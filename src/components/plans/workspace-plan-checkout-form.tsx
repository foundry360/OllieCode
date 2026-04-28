"use client";

import type { Appearance, CssFontSource } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckout,
} from "@stripe/react-stripe-js/checkout";
import Image from "next/image";
import { useCallback, useId, useMemo, useState } from "react";
import { PLAN_CARDS, type PlanCardDefinition } from "@/lib/plans/planCards";
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

function isInvalidPromotionCodeError(
  err: { message: string; code: "invalidCode" | null },
): err is { message: string; code: "invalidCode" } {
  return err.code === "invalidCode";
}

function friendlyPromotionApplyErrorMessage(err: {
  message: string;
  code: "invalidCode" | null;
}): string {
  if (isInvalidPromotionCodeError(err)) {
    return "That code is not accepted. Enter the customer-facing Code from Stripe (Dashboard → Coupons → Promotion codes), not a promo_… ID. Check spelling, capitals, and Test vs Live mode for this site.";
  }
  return err.message;
}

function looksLikeStripePromotionCodeId(value: string): boolean {
  return /^promo_[a-zA-Z0-9]+$/.test(value.trim());
}

/** Whole-dollar amounts without “.00” (e.g. $0, $7); otherwise use Stripe’s formatted string. */
function formatStripeMinorUnitsForDisplay(total: {
  amount: string;
  minorUnitsAmount: number;
}): string {
  if (total.minorUnitsAmount === 0) return "$0";
  if (total.minorUnitsAmount % 100 === 0) {
    return `$${total.minorUnitsAmount / 100}`;
  }
  return total.amount;
}

function checkoutLinePriceLabel(
  checkout: { lineItems: Array<{ recurring: { interval: string } | null; total: { amount: string; minorUnitsAmount: number } }> },
  fallback: string | null,
): string | null {
  const li = checkout.lineItems[0];
  if (!li?.recurring) return fallback;
  const interval = li.recurring.interval;
  const suffix =
    interval === "month" ? "month" : interval === "year" ? "year" : interval;
  return `${formatStripeMinorUnitsForDisplay(li.total)}/${suffix}`;
}

function CheckoutModalGridInner({
  card,
  plan,
  billing,
  onClose,
}: {
  card: PlanCardDefinition;
  plan: PaidPlanId;
  billing: BillingInterval;
  onClose: () => void;
}) {
  const checkoutState = useCheckout();
  const fallbackPrice = planPriceLine(plan, billing);
  const displayedPrice = useMemo(() => {
    if (checkoutState.type !== "success") return fallbackPrice;
    return checkoutLinePriceLabel(checkoutState.checkout, fallbackPrice);
  }, [checkoutState, fallbackPrice]);

  return (
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
        {displayedPrice ? (
          <p className="shrink-0 text-right font-section text-lg font-extrabold leading-tight tracking-tight text-[#111827] sm:text-xl">
            {displayedPrice}
          </p>
        ) : null}
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col pt-1 sm:pt-0 xl:pt-0">
        <CheckoutPayInner onCancel={onClose} />
      </div>
    </div>
  );
}

function CheckoutPayInner({ onCancel }: { onCancel: () => void }) {
  const checkoutState = useCheckout();
  const promoFieldId = useId();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);

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

  const applyPromo = useCallback(async () => {
    setPromoError(null);
    if (checkoutState.type !== "success") return;
    const code = promoInput.trim();
    if (!code) {
      setPromoError("Enter a promotion code.");
      return;
    }
    if (looksLikeStripePromotionCodeId(code)) {
      setPromoError(
        "promo_… is Stripe’s internal ID, not what customers type. In Dashboard → Coupons → your coupon → Promotion codes, copy the Code value for this row (for example OLLIE26 or a generated code).",
      );
      return;
    }
    setPromoBusy(true);
    try {
      const checkout = checkoutState.checkout;
      let result = await checkout.applyPromotionCode(code);
      if (
        result.type === "error" &&
        isInvalidPromotionCodeError(result.error) &&
        code !== code.toUpperCase()
      ) {
        result = await checkout.applyPromotionCode(code.toUpperCase());
      }
      if (result.type === "error") {
        setPromoError(friendlyPromotionApplyErrorMessage(result.error));
        setPromoBusy(false);
        return;
      }
      setPromoInput("");
    } catch (e) {
      setPromoError(e instanceof Error ? e.message : "Could not apply code.");
    }
    setPromoBusy(false);
  }, [checkoutState, promoInput]);

  const removePromo = useCallback(async () => {
    setPromoError(null);
    if (checkoutState.type !== "success") return;
    setPromoBusy(true);
    try {
      const result = await checkoutState.checkout.removePromotionCode();
      if (result.type === "error") {
        setPromoError(result.error.message);
      }
    } catch (e) {
      setPromoError(e instanceof Error ? e.message : "Could not remove code.");
    }
    setPromoBusy(false);
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

  const checkout = checkoutState.checkout;
  const appliedDiscounts = checkout.discountAmounts ?? [];
  const hasAppliedPromo = appliedDiscounts.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 py-0 sm:py-1">
      <div className="shrink-0 space-y-2">
        <label
          htmlFor={promoFieldId}
          className="block text-xs font-semibold uppercase tracking-wide text-[#64748b]"
        >
          Promo Code:
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <input
            id={promoFieldId}
            type="text"
            name="promotion_code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="Optional"
            value={promoInput}
            disabled={promoBusy}
            onChange={(e) => setPromoInput(e.target.value)}
            className="min-h-12 w-full min-w-0 flex-1 rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm font-medium text-[#111827] outline-none ring-[var(--ollie-primary)] placeholder:text-[#9ca3af] focus:border-[#84c126] focus:ring-2"
          />
          <button
            type="button"
            disabled={promoBusy}
            onClick={() => void applyPromo()}
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl border border-[#84c126] bg-[#ecfccb] px-4 text-sm font-bold text-[#365314] transition hover:bg-[#d9f99d] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[5.5rem]"
          >
            {promoBusy ? "…" : "Apply"}
          </button>
        </div>
        {promoError ? (
          <p className="text-xs text-red-600 sm:text-sm" role="alert">
            {promoError}
          </p>
        ) : null}
        {hasAppliedPromo ? (
          <div className="flex flex-col gap-1.5 border-t border-[#e2e8f0] pt-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="font-semibold text-[#111827]">
              {appliedDiscounts
                .map((d) => d.displayName || d.promotionCode || "Discount")
                .join(", ")}
            </span>
            <button
              type="button"
              disabled={promoBusy}
              onClick={() => void removePromo()}
              className="self-start text-xs font-bold text-[var(--ollie-primary)] underline underline-offset-2 hover:text-[#6fa020] disabled:opacity-60 sm:self-auto"
            >
              Remove code
            </button>
          </div>
        ) : null}
      </div>
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
      <CheckoutElementsProvider stripe={stripePromise} options={checkoutOptions}>
        <CheckoutModalGridInner card={card} plan={plan} billing={billing} onClose={onClose} />
      </CheckoutElementsProvider>
    </div>
  );
}
