"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  PlanPaidCheckoutCtas,
  type PlanInlineCheckoutPayload,
} from "@/components/plans/PlanPaidCheckoutCtas";
import { normalizePlansCheckoutBasePath, parsePlansCheckoutIntent } from "@/lib/plans/checkoutIntent";
import { PLAN_CARDS, type PlanCardDefinition, type PlanCardId } from "@/lib/plans/planCards";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BillingInterval, PlanCheckoutAvailability } from "@/lib/stripe/prices";

const PLAN_CARD_CTA_CLASS =
  "inline-flex min-h-[2.75rem] w-full max-w-xs items-center justify-center rounded-full bg-[var(--ollie-primary)] px-8 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#6fa020] sm:w-auto";

const PLAN_CARD_CTA_COMING_SOON_CLASS =
  "inline-flex min-h-[2.75rem] w-full max-w-xs cursor-not-allowed items-center justify-center rounded-full border-2 border-[#e5e7eb] bg-[#f3f4f6] px-8 py-3 text-base font-bold text-[#6b7280] shadow-sm sm:w-auto";

const PLAN_CARD_CTA_COMPACT_CLASS =
  "inline-flex min-h-10 w-full max-w-full items-center justify-center rounded-full bg-[var(--ollie-primary)] px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#6fa020] sm:min-h-11 sm:px-4 sm:text-sm";

const PLAN_CARD_CTA_COMING_SOON_COMPACT_CLASS =
  "inline-flex min-h-10 w-full max-w-full cursor-not-allowed items-center justify-center rounded-full border-2 border-[#e5e7eb] bg-[#f3f4f6] px-3 py-2.5 text-xs font-bold text-[#6b7280] sm:min-h-11 sm:px-4 sm:text-sm";

const TOGGLE_WRAPPER =
  "mx-auto mt-0 flex w-full max-w-md flex-col items-center gap-2 sm:mt-1";

const TOGGLE_LABEL = "text-center text-sm font-semibold text-[#374151]";

const TOGGLE_GROUP =
  "inline-flex w-full max-w-sm rounded-full border border-[#e5e7eb] bg-[#f3f4f6] p-1 shadow-inner";

const TOGGLE_BTN_ON =
  "flex-1 rounded-full bg-[var(--ollie-primary)] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#6fa020] sm:text-base";

const TOGGLE_BTN_OFF =
  "flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-[#6b7280] transition-colors hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-[#6b7280] sm:text-base";

function isPaidPlan(id: PlanCardId): id is "starter" | "family" {
  return id === "starter" || id === "family";
}

function planPriceLine(plan: PlanCardDefinition, billing: BillingInterval): string | null {
  if (plan.pricingStatic) return plan.pricingStatic;
  if (plan.pricingByBilling) return plan.pricingByBilling[billing === "month" ? "month" : "year"];
  return null;
}

type PlansPricingSectionProps = {
  checkoutAvailability: PlanCheckoutAvailability;
  /** Post-auth return URL for Subscribe flow (`/plans` or `/plans/welcome`). */
  checkoutIntentBasePath?: string;
  /** Hide sign-in / sign-up CTAs (signed-in workspace paywall). */
  hideAccountAuthLinks?: boolean;
  /** Tighter layout for viewport-constrained modals (no page scroll). */
  compact?: boolean;
  /** Paid-plan primary CTA when Stripe checkout is available (default “Subscribe”). */
  paidCheckoutButtonLabel?: string;
  /** Workspace paywall: Stripe in-modal (`elements` = styled form, `embedded` = full embedded page). */
  checkoutUi?: "redirect" | "embedded" | "elements";
  /** When `checkoutUi` is `embedded` or `elements`, called with Checkout Session `clientSecret`. */
  onEmbeddedCheckoutClientSecret?: (payload: PlanInlineCheckoutPayload) => void;
};

export function PlansPricingSection({
  checkoutAvailability,
  checkoutIntentBasePath = "/plans",
  hideAccountAuthLinks = false,
  compact = false,
  paidCheckoutButtonLabel,
  checkoutUi = "redirect",
  onEmbeddedCheckoutClientSecret,
}: PlansPricingSectionProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const intentBase = normalizePlansCheckoutBasePath(checkoutIntentBasePath);
  const queryKey = searchParams.toString();
  const subscriptionRequired = searchParams.get("subscription_required") === "1";

  const canMonthly = checkoutAvailability.starter.month || checkoutAvailability.family.month;
  const canYearly = checkoutAvailability.starter.year || checkoutAvailability.family.year;

  const [billing, setBilling] = useState<BillingInterval>(() => {
    if (canMonthly) return "month";
    if (canYearly) return "year";
    return "month";
  });

  const lastBillingFromUrlKey = useRef<string | null>(null);

  useEffect(() => {
    if (lastBillingFromUrlKey.current === queryKey) return;
    lastBillingFromUrlKey.current = queryKey;

    const intent = parsePlansCheckoutIntent(searchParams);
    if (!intent) return;
    if (intent.billing === "year" && canYearly) setBilling("year");
    else if (intent.billing === "month" && canMonthly) setBilling("month");
  }, [queryKey, searchParams, canMonthly, canYearly]);

  const showToggle = canMonthly || canYearly;

  const checkoutResumeKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const intent = parsePlansCheckoutIntent(searchParams);
    if (!intent) return;

    const { planId, billing: billingIntent } = intent;

    const hasPrice =
      billingIntent === "month"
        ? checkoutAvailability[planId].month
        : checkoutAvailability[planId].year;
    if (!hasPrice) return;

    const resumeKey = `${planId}-${billingIntent}-${queryKey}`;
    if (checkoutResumeKeyRef.current === resumeKey) return;

    let cancelled = false;

    async function resumeCheckout() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      checkoutResumeKeyRef.current = resumeKey;

      const useInline = checkoutUi === "embedded" || checkoutUi === "elements";
      const res = await fetch("/api/checkout", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          billing: billingIntent,
          ...(checkoutUi === "embedded" ? { embedded: true } : {}),
          ...(checkoutUi === "elements" ? { elements: true } : {}),
        }),
      });
      const data: { url?: string; clientSecret?: string } = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (res.ok && useInline && data.clientSecret && onEmbeddedCheckoutClientSecret) {
        onEmbeddedCheckoutClientSecret({
          clientSecret: data.clientSecret,
          plan: planId,
          billing: billingIntent,
        });
        return;
      }
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      window.history.replaceState({}, "", pathname || "/plans");
      checkoutResumeKeyRef.current = null;
    }

    void resumeCheckout();
    return () => {
      cancelled = true;
    };
  }, [checkoutUi, onEmbeddedCheckoutClientSecret, queryKey, searchParams, checkoutAvailability, pathname]);

  const section = (
    <>
      {subscriptionRequired ? (
        <div
          className={
            compact
              ? "mx-auto mt-0 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs leading-snug text-amber-950 sm:px-4"
              : "mx-auto mt-4 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm leading-relaxed text-amber-950 sm:mt-5 sm:px-5 sm:text-base"
          }
          role="status"
        >
          {compact
            ? "A paid plan is required. Subscribe below or use an account with a subscription."
            : "A paid plan is required to use the workspace. Choose a plan below and subscribe, or sign in with the account that already has a subscription."}
        </div>
      ) : null}
      {showToggle ? (
        <div
          className={
            compact
              ? "mx-auto mt-0 flex w-full max-w-md shrink-0 flex-col items-center gap-1.5 pb-6 sm:gap-2 sm:pb-8"
              : TOGGLE_WRAPPER
          }
          role="group"
          aria-label="Billing period"
        >
          <p
            id="billing-toggle-label"
            className={compact ? "text-center text-xs font-semibold text-[#374151]" : TOGGLE_LABEL}
          >
            Billing
          </p>
          <div
            className={compact ? `${TOGGLE_GROUP} max-w-[11.5rem] p-0.5 sm:max-w-[13rem]` : TOGGLE_GROUP}
            aria-labelledby="billing-toggle-label"
          >
            <button
              type="button"
              className={
                compact
                  ? billing === "month"
                    ? `${TOGGLE_BTN_ON} px-2 py-1.5 text-xs sm:px-2.5 sm:py-2 sm:text-sm`
                    : `${TOGGLE_BTN_OFF} px-2 py-1.5 text-xs sm:px-2.5 sm:py-2 sm:text-sm`
                  : billing === "month"
                    ? TOGGLE_BTN_ON
                    : TOGGLE_BTN_OFF
              }
              aria-pressed={billing === "month"}
              disabled={!canMonthly}
              onClick={() => canMonthly && setBilling("month")}
            >
              Monthly
            </button>
            <button
              type="button"
              className={
                compact
                  ? billing === "year"
                    ? `${TOGGLE_BTN_ON} px-2 py-1.5 text-xs sm:px-2.5 sm:py-2 sm:text-sm`
                    : `${TOGGLE_BTN_OFF} px-2 py-1.5 text-xs sm:px-2.5 sm:py-2 sm:text-sm`
                  : billing === "year"
                    ? TOGGLE_BTN_ON
                    : TOGGLE_BTN_OFF
              }
              aria-pressed={billing === "year"}
              disabled={!canYearly}
              onClick={() => canYearly && setBilling("year")}
            >
              Yearly
            </button>
          </div>
        </div>
      ) : null}

      <ul
        className={
          compact
            ? "mt-0 grid list-none grid-cols-3 content-start items-start gap-x-2.5 gap-y-0 overflow-visible p-0 pt-10 sm:gap-x-4 sm:pt-12"
            : "mt-12 grid list-none gap-x-6 gap-y-20 p-0 pt-12 sm:mt-14 sm:gap-x-8 sm:gap-y-24 sm:pt-14 md:grid-cols-3 lg:mt-16"
        }
      >
        {PLAN_CARDS.map((plan) => {
          const priceLine = planPriceLine(plan, billing);

          return (
            <li key={plan.id} className="min-w-0">
              <article
                className={
                  compact
                    ? "relative flex h-full flex-col overflow-visible rounded-2xl border border-[#e5e7eb] bg-white text-center shadow-[0_8px_28px_-6px_rgba(15,23,42,0.12)] sm:shadow-[0_12px_36px_-8px_rgba(15,23,42,0.14)]"
                    : "relative flex h-full flex-col overflow-visible rounded-2xl border border-[#e5e7eb] bg-white text-center shadow-[0_12px_40px_-8px_rgba(15,23,42,0.14)] sm:shadow-[0_16px_48px_-10px_rgba(15,23,42,0.16)]"
                }
              >
                <div
                  className={`absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 ${plan.accent.iconFrame}`}
                >
                  <div
                    className={
                      compact
                        ? "relative flex h-[3.25rem] w-[3.25rem] items-center justify-center sm:h-14 sm:w-14"
                        : "relative flex h-16 w-16 items-center justify-center sm:h-[4.25rem] sm:w-[4.25rem]"
                    }
                  >
                    <Image
                      src={plan.iconSrc}
                      alt={plan.iconAlt}
                      width={256}
                      height={256}
                      sizes={compact ? "(max-width: 640px) 52px, 56px" : "(max-width: 768px) 64px, 72px"}
                      className="h-full w-full max-h-[96%] max-w-[96%] object-contain object-center"
                    />
                  </div>
                </div>
                <header
                  className={
                    compact
                      ? `relative z-0 rounded-t-2xl px-3 pb-2 pt-9 sm:px-4 sm:pb-3 sm:pt-10 ${plan.accent.headerTop}`
                      : `relative z-0 rounded-t-2xl px-6 pb-5 pt-14 sm:px-8 sm:pb-6 sm:pt-[4.25rem] ${plan.accent.headerTop}`
                  }
                >
                  <h2
                    className={`font-section font-extrabold ${compact ? "text-[0.95rem] leading-tight sm:text-lg" : "text-xl sm:text-2xl"} ${plan.accent.title}`}
                  >
                    {plan.name}
                  </h2>
                  {plan.positioning ? (
                    <p
                      className={`${compact ? "mt-1 text-[11px] leading-snug sm:text-xs" : "mt-2 text-sm sm:text-base"} font-medium leading-snug ${plan.accent.title} opacity-80`}
                    >
                      {plan.positioning}
                    </p>
                  ) : null}
                </header>
                <div
                  className={
                    compact
                      ? "flex flex-1 flex-col rounded-b-2xl bg-white px-3 pb-4 pt-3 text-center sm:px-4 sm:pb-5 sm:pt-4"
                      : "flex flex-1 flex-col rounded-b-2xl bg-white px-6 pb-6 pt-5 text-center sm:px-8 sm:pb-8 sm:pt-6"
                  }
                >
                  {plan.audience ? (
                    <p
                      className={
                        compact
                          ? "text-xs font-semibold leading-snug text-[#374151] sm:text-sm"
                          : "text-sm font-semibold text-[#374151] sm:text-base"
                      }
                    >
                      {plan.audience}
                    </p>
                  ) : null}
                  {plan.pricingLead ? (
                    <p
                      className={
                        compact
                          ? "mt-1 text-xs font-medium leading-snug text-[#4b5563] sm:text-sm"
                          : "mt-2 text-sm font-medium leading-relaxed text-[#4b5563] sm:text-base"
                      }
                    >
                      {plan.pricingLead}
                    </p>
                  ) : null}
                  {priceLine ? (
                    <p
                      className={
                        compact
                          ? "mt-2 text-base font-extrabold tracking-tight text-[#111827] sm:text-lg"
                          : "mt-2 text-lg font-extrabold tracking-tight text-[#111827] sm:text-xl"
                      }
                    >
                      {priceLine}
                    </p>
                  ) : null}
                  {!compact && plan.features && plan.features.length > 0 ? (
                    <ul className="mx-auto mt-5 w-full max-w-xs space-y-2.5 text-left text-sm leading-relaxed text-[#374151] sm:text-base">
                      {plan.features.map((item) => (
                        <li key={item} className="flex gap-2.5">
                          <span
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ollie-primary)]"
                            aria-hidden
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : plan.description ? (
                    <p
                      className={
                        compact
                          ? "mt-1 flex-1 text-left text-xs leading-snug text-[#6b7280] sm:text-center sm:text-sm"
                          : "mt-1 flex-1 text-left text-sm leading-relaxed text-[#6b7280] sm:text-center sm:text-base"
                      }
                    >
                      {plan.description}
                    </p>
                  ) : null}
                  <div className={compact ? "mt-4 flex w-full shrink-0 justify-center sm:mt-5" : "mt-6 flex w-full shrink-0 justify-center"}>
                    {plan.cta.kind === "signup" ? (
                      isPaidPlan(plan.id) ? (
                        <PlanPaidCheckoutCtas
                          planId={plan.id}
                          billing={billing}
                          availability={checkoutAvailability[plan.id]}
                          checkoutIntentBasePath={intentBase}
                          hideAccountAuthLinks={hideAccountAuthLinks}
                          compact={compact}
                          checkoutButtonLabel={paidCheckoutButtonLabel}
                          hideNewHereSignupLink
                          checkoutUi={checkoutUi}
                          onEmbeddedClientSecret={onEmbeddedCheckoutClientSecret}
                        />
                      ) : (
                        <Link
                          href={`/auth/signup?next=${encodeURIComponent(intentBase)}`}
                          className={compact ? PLAN_CARD_CTA_COMPACT_CLASS : PLAN_CARD_CTA_CLASS}
                        >
                          {plan.cta.label}
                        </Link>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled
                        className={compact ? PLAN_CARD_CTA_COMING_SOON_COMPACT_CLASS : PLAN_CARD_CTA_COMING_SOON_CLASS}
                        aria-disabled="true"
                      >
                        {plan.cta.label}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </>
  );

  if (compact) {
    return <div className="flex min-h-0 flex-1 flex-col overflow-visible">{section}</div>;
  }

  return section;
}
