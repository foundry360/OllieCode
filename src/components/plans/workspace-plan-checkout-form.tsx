"use client";

import type { Appearance, CssFontSource } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckout,
} from "@stripe/react-stripe-js/checkout";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { PLAN_CARDS } from "@/lib/plans/planCards";
import type { BillingInterval, PaidPlanId } from "@/lib/stripe/prices";

const CANCEL_CHECKOUT_BUTTON_CLASS =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#d1d5db] bg-transparent px-4 py-3 text-base font-bold text-[#374151] transition-colors hover:border-[#9ca3af] hover:bg-[#f9fafb]";

const SUBSCRIBE_BUTTON_CLASS =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--ollie-primary)] px-4 py-3 text-base font-bold text-white shadow transition-colors hover:bg-[#6fa020] disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Stripe Payment Element runs in an isolated frame: host CSS variables like
 * `var(--font-nunito)` are not applied, so we load Nunito explicitly (same as
 * `font-sans` / auth form labels in the app).
 */
const OLLIE_CHECKOUT_FONT_STACK = "Nunito, ui-sans-serif, system-ui, sans-serif";

const ollieCheckoutFontSources: CssFontSource[] = [
  {
    cssSrc:
      "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap",
  },
];

/** Stripe Elements styling aligned with auth forms (login-form labels + inputs). */
const ollieCheckoutAppearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#84c126",
    colorBackground: "#ffffff",
    colorText: "#111827",
    colorTextSecondary: "#6b7280",
    colorDanger: "#dc2626",
    colorTextPlaceholder: "#9ca3af",
    fontFamily: OLLIE_CHECKOUT_FONT_STACK,
    fontSizeBase: "16px",
    fontSizeSm: "12px",
    fontSizeXs: "11px",
    borderRadius: "12px",
    spacingUnit: "8px",
    gridColumnSpacing: "12px",
    gridRowSpacing: "8px",
  },
  rules: {
    ".Input": {
      border: "1px solid #e5e7eb",
      boxShadow: "none",
      minHeight: "48px",
      padding: "12px 16px",
      fontSize: "16px",
      lineHeight: "1.4",
      fontFamily: OLLIE_CHECKOUT_FONT_STACK,
    },
    ".Input::placeholder": {
      color: "#9ca3af",
      fontSize: "15px",
    },
    ".Label": {
      fontWeight: "600",
      fontSize: "14px",
      color: "#374151",
      marginBottom: "4px",
      fontFamily: OLLIE_CHECKOUT_FONT_STACK,
    },
    ".Tab": {
      padding: "10px 14px",
      fontFamily: OLLIE_CHECKOUT_FONT_STACK,
    },
    ".TabLabel": {
      fontSize: "14px",
      fontWeight: "600",
      fontFamily: OLLIE_CHECKOUT_FONT_STACK,
    },
    ".Error": {
      fontSize: "13px",
      fontFamily: OLLIE_CHECKOUT_FONT_STACK,
    },
    ".TermsText": {
      fontSize: "11px",
      lineHeight: "1.45",
      color: "#6b7280",
      fontFamily: OLLIE_CHECKOUT_FONT_STACK,
    },
    ".TermsLink": {
      fontSize: "11px",
      fontFamily: OLLIE_CHECKOUT_FONT_STACK,
    },
    ".RedirectText": {
      fontSize: "11px",
      lineHeight: "1.45",
      color: "#6b7280",
      fontFamily: OLLIE_CHECKOUT_FONT_STACK,
    },
  },
};

function planPriceLine(planId: PaidPlanId, billing: BillingInterval): string | null {
  const card = PLAN_CARDS.find((p) => p.id === planId);
  if (!card?.pricingByBilling) return null;
  return billing === "month" ? card.pricingByBilling.month : card.pricingByBilling.year;
}

function CheckoutPayInner({ onCancel }: { onCancel: () => void }) {
  const checkoutState = useCheckout();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const pay = useCallback(async () => {
    setError(null);
    setPending(true);
    try {
      if (checkoutState.type !== "success") {
        setPending(false);
        return;
      }
      const { checkout } = checkoutState;
      // Session already sets `return_url` in `/api/checkout` (Elements mode).
      const result = await checkout.confirm({
        redirect: "if_required",
      });
      if (result.type === "error") {
        setError(result.error.message);
        setPending(false);
        return;
      }
      const sessionId = result.session.id;
      if (sessionId.startsWith("cs_")) {
        window.location.assign(`${window.location.origin}/workspace/welcome?session_id=${sessionId}`);
        return;
      }
      setError("Unexpected response from payment provider.");
      setPending(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed.");
      setPending(false);
    }
  }, [checkoutState]);

  if (checkoutState.type === "loading") {
    return (
      <div className="flex min-h-[140px] flex-col items-center justify-center gap-4 py-2">
        <div className="flex flex-col items-center gap-2">
          <div
            className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--ollie-primary)] border-t-transparent"
            aria-hidden
          />
          <p className="font-section text-xs font-medium text-[#6b7280]">Preparing payment…</p>
        </div>
        <div className="w-full max-w-xs px-1">
          <button type="button" className={CANCEL_CHECKOUT_BUTTON_CLASS} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (checkoutState.type === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <p className="text-xs text-red-600 sm:text-sm" role="alert">
          {checkoutState.error.message}
        </p>
        <div className="w-full max-w-xs px-1">
          <button type="button" className={CANCEL_CHECKOUT_BUTTON_CLASS} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 py-0 sm:py-1">
      <div className="shrink-0">
        <p className="text-sm font-semibold text-[#374151]">Enter your card information below</p>
      </div>
      <div className="min-h-0 flex-1">
        <PaymentElement
          options={{
            layout: { type: "tabs" },
            terms: { card: "never" },
            // Stripe Link autofills cards for anyone logged into Link in this browser, across
            // businesses and unrelated app accounts — looks like “another user’s card”. Cards
            // still come from the Checkout Session’s Customer; Link is separate wallet UI.
            wallets: { link: "never" },
          }}
        />
      </div>
      <p className="shrink-0 text-[11px] leading-snug text-[#6b7280] sm:text-xs">
        By subscribing, you authorize Ollie Code to charge your card according to the terms until you
        cancel.
      </p>
      {error ? (
        <p className="shrink-0 text-center text-[11px] text-red-600 sm:text-xs" role="alert">
          {error}
        </p>
      ) : null}
      <div className="grid shrink-0 grid-cols-2 gap-3">
        <button type="button" className={CANCEL_CHECKOUT_BUTTON_CLASS} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={SUBSCRIBE_BUTTON_CLASS} disabled={pending} onClick={() => void pay()}>
          {pending ? "Processing…" : "Subscribe"}
        </button>
      </div>
    </div>
  );
}

export type WorkspacePlanCheckoutFormProps = {
  publishableKey: string;
  clientSecret: string;
  plan: PaidPlanId;
  billing: BillingInterval;
  onClose: () => void;
};

/**
 * Two-column in-modal checkout: plan summary (left) + Stripe Payment Element (right).
 */
export function WorkspacePlanCheckoutForm({
  publishableKey,
  clientSecret,
  plan,
  billing,
  onClose,
}: WorkspacePlanCheckoutFormProps) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);

  const card = PLAN_CARDS.find((p) => p.id === plan);
  const priceLine = planPriceLine(plan, billing);

  if (!card) {
    return null;
  }

  const checkoutOptions = useMemo(
    () => ({
      clientSecret,
      elementsOptions: {
        appearance: ollieCheckoutAppearance,
        fonts: ollieCheckoutFontSources,
        loader: "auto" as const,
      },
    }),
    [clientSecret],
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-3 pb-1 sm:gap-3 sm:pb-2">
      <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:gap-6 xl:grid-cols-1 xl:gap-5">
        <div className="flex min-h-0 w-full min-w-0 flex-nowrap items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-3 sm:gap-4 sm:p-4">
          <div className="relative h-11 w-11 shrink-0 sm:h-12 sm:w-12">
            <Image
              src={card.iconSrc}
              alt={card.iconAlt}
              width={256}
              height={256}
              sizes="48px"
              className="h-full w-full object-contain object-center"
            />
          </div>
          <h2
            className={`min-w-0 flex-1 truncate text-left font-section text-base font-extrabold leading-tight tracking-tight sm:text-lg ${card.accent.title}`}
          >
            {card.name}
          </h2>
          {priceLine ? (
            <p className="shrink-0 text-right font-section text-lg font-extrabold leading-tight tracking-tight text-[#111827] sm:text-xl">
              {priceLine}
            </p>
          ) : null}
        </div>

        <CheckoutElementsProvider stripe={stripePromise} options={checkoutOptions}>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col pt-1 sm:pt-0 xl:pt-0">
            <CheckoutPayInner onCancel={onClose} />
          </div>
        </CheckoutElementsProvider>
      </div>
    </div>
  );
}
