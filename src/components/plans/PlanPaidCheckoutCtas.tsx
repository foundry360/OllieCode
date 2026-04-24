"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildPlansCheckoutIntentPath } from "@/lib/plans/checkoutIntent";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BillingInterval, PaidPlanId, PlanCheckoutAvailability } from "@/lib/stripe/prices";

const PLAN_CARD_CTA_CLASS =
  "inline-flex min-h-[2.75rem] w-full max-w-xs items-center justify-center rounded-full bg-[var(--ollie-primary)] px-6 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#6fa020] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

const PLAN_CARD_CTA_COMPACT_CLASS =
  "inline-flex min-h-10 w-full max-w-full items-center justify-center rounded-full bg-[var(--ollie-primary)] px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#6fa020] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-11 sm:px-4 sm:text-sm";

const SECONDARY_LINK_CLASS =
  "mt-3 text-center text-sm font-semibold text-[#4b5563] underline underline-offset-2 hover:text-[#111827]";

const SECONDARY_LINK_COMPACT_CLASS =
  "mt-2 text-center text-xs font-semibold text-[#4b5563] underline underline-offset-2 hover:text-[#111827] sm:text-sm";

const WORKSPACE_NEXT = "/workspace";
const loginWorkspaceHref = `/auth/login?next=${encodeURIComponent(WORKSPACE_NEXT)}`;

type CheckoutUiMode = "redirect" | "embedded" | "elements";

export type PlanInlineCheckoutPayload = {
  clientSecret: string;
  plan: PaidPlanId;
  billing: BillingInterval;
};

type PlanPaidCheckoutCtasProps = {
  planId: PaidPlanId;
  /** Matches the page-level billing toggle. */
  billing: BillingInterval;
  availability: PlanCheckoutAvailability[PaidPlanId];
  /** Where to return after signup before checkout (default `/plans`). */
  checkoutIntentBasePath?: string;
  /** When true (e.g. workspace paywall), hide sign-in / sign-up links — user is already signed in. */
  hideAccountAuthLinks?: boolean;
  /** Smaller buttons and copy for viewport-constrained modals. */
  compact?: boolean;
  /** Primary button label when checkout is available (e.g. “Get Started” on `/plans`). */
  checkoutButtonLabel?: string;
  /** Hide the “New here? Create an account” link (e.g. Starter card on `/plans`). */
  hideNewHereSignupLink?: boolean;
  /** Hosted redirect (default) vs Stripe embedded page vs Elements (custom layout + Payment Element). */
  checkoutUi?: CheckoutUiMode;
  /** When `checkoutUi` is `embedded` or `elements`, receives Checkout Session `clientSecret` for Stripe.js. */
  onEmbeddedClientSecret?: (payload: PlanInlineCheckoutPayload) => void;
};

export function PlanPaidCheckoutCtas({
  planId,
  billing,
  availability,
  checkoutIntentBasePath = "/plans",
  hideAccountAuthLinks = false,
  compact = false,
  checkoutButtonLabel = "Subscribe",
  hideNewHereSignupLink = false,
  checkoutUi = "redirect",
  onEmbeddedClientSecret,
}: PlanPaidCheckoutCtasProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCheckout = billing === "month" ? availability.month : availability.year;
  const hasAnyCheckout = availability.month || availability.year;

  const plansIntentPath = buildPlansCheckoutIntentPath(planId, billing, checkoutIntentBasePath);
  const signupHref = `/auth/signup?next=${encodeURIComponent(plansIntentPath)}`;
  const loginPlansHref = `/auth/login?next=${encodeURIComponent(plansIntentPath)}`;

  const startCheckoutWithBilling = useCallback(
    async (billingChoice: BillingInterval) => {
      setError(null);
      setPending(true);
      try {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          router.push(hideAccountAuthLinks ? loginWorkspaceHref : signupHref);
          return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Public plans: sign up first, then return to this page with ?plan=&billing= to open checkout.
          // Workspace paywall: already gated to signed-in users; fall back to workspace login.
          router.push(hideAccountAuthLinks ? loginWorkspaceHref : signupHref);
          return;
        }

        const useInlineStripe = checkoutUi === "embedded" || checkoutUi === "elements";
        if (useInlineStripe && !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()) {
          setError("Stripe publishable key is not configured (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).");
          return;
        }

        const res = await fetch("/api/checkout", {
          method: "POST",
          cache: "no-store",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: planId,
            billing: billingChoice,
            ...(checkoutUi === "embedded" ? { embedded: true } : {}),
            ...(checkoutUi === "elements" ? { elements: true } : {}),
          }),
        });
        const data: { url?: string; clientSecret?: string; error?: string; code?: string } =
          await res.json().catch(() => ({}));
        if (res.status === 401 || data.code === "sign_in_required") {
          router.push(hideAccountAuthLinks ? loginWorkspaceHref : signupHref);
          return;
        }
        if (!res.ok) {
          setError(data.error || "Something went wrong. Please try again.");
          return;
        }
        if (useInlineStripe && data.clientSecret && onEmbeddedClientSecret) {
          onEmbeddedClientSecret({
            clientSecret: data.clientSecret,
            plan: planId,
            billing: billingChoice,
          });
          return;
        }
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        setError("Something went wrong. Please try again.");
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setPending(false);
      }
    },
    [checkoutUi, hideAccountAuthLinks, onEmbeddedClientSecret, planId, router, signupHref],
  );

  const pendingLabel = checkoutUi === "elements" ? "Loading…" : "Redirecting…";

  const startCheckout = useCallback(async () => {
    await startCheckoutWithBilling(billing);
  }, [billing, startCheckoutWithBilling]);

  const ctaClass = compact ? PLAN_CARD_CTA_COMPACT_CLASS : PLAN_CARD_CTA_CLASS;
  const secondaryClass = compact ? SECONDARY_LINK_COMPACT_CLASS : SECONDARY_LINK_CLASS;
  /** Primary signup link when checkout is not available (keep “Sign Up” when using default subscribe label). */
  const primarySignupLinkLabel = checkoutButtonLabel === "Subscribe" ? "Sign Up" : checkoutButtonLabel;

  if (!hasAnyCheckout) {
    return (
      <div className="flex w-full flex-col items-center">
        {hideAccountAuthLinks ? (
          <button
            type="button"
            className={ctaClass}
            disabled
            aria-disabled="true"
            title="Checkout for this plan is not configured yet."
          >
            {checkoutButtonLabel}
          </button>
        ) : (
          <>
            <Link href={signupHref} className={ctaClass}>
              {primarySignupLinkLabel}
            </Link>
            <Link href={loginPlansHref} className={secondaryClass}>
              Already have an account? Sign in
            </Link>
          </>
        )}
      </div>
    );
  }

  if (!canCheckout) {
    const fallbackBilling: BillingInterval | null = availability.month
      ? "month"
      : availability.year
        ? "year"
        : null;

    return (
      <div className="flex w-full flex-col items-center">
        <p
          className={
            compact
              ? "max-w-full px-0.5 text-center text-[10px] leading-tight text-[#6b7280] sm:text-xs"
              : "max-w-xs text-center text-sm text-[#6b7280]"
          }
        >
          {billing === "year"
            ? "Annual billing is not available for this plan yet."
            : "Monthly billing is not available for this plan yet."}
        </p>
        {hideAccountAuthLinks && fallbackBilling ? (
          <button
            type="button"
            className={`${ctaClass} ${compact ? "mt-2" : "mt-4"}`}
            disabled={pending}
            onClick={() => void startCheckoutWithBilling(fallbackBilling)}
          >
            {pending ? pendingLabel : checkoutButtonLabel}
          </button>
        ) : null}
        {!hideAccountAuthLinks ? (
          <>
            <Link href={signupHref} className={`${ctaClass} ${compact ? "mt-2" : "mt-4"}`}>
              {primarySignupLinkLabel}
            </Link>
            <Link href={loginPlansHref} className={secondaryClass}>
              Already have an account? Sign in
            </Link>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center">
      <button
        type="button"
        className={ctaClass}
        disabled={pending}
        onClick={() => void startCheckout()}
      >
        {pending ? pendingLabel : checkoutButtonLabel}
      </button>
      {!hideAccountAuthLinks ? (
        <>
          <Link href={loginPlansHref} className={secondaryClass}>
            Already have an account? Sign in
          </Link>
          {!hideNewHereSignupLink ? (
            <Link href={signupHref} className={`${secondaryClass} mt-1`}>
              New here? Create an account
            </Link>
          ) : null}
        </>
      ) : null}
      {error ? (
        <p
          className={
            compact
              ? "mt-1 max-w-full px-0.5 text-center text-[10px] leading-tight text-red-600 sm:text-xs"
              : "mt-2 max-w-xs text-center text-sm text-red-600"
          }
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
