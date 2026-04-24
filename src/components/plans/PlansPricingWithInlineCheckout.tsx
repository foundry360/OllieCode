"use client";

import { useState } from "react";
import type { PlanInlineCheckoutPayload } from "@/components/plans/PlanPaidCheckoutCtas";
import { PlansPricingSection } from "@/components/plans/PlansPricingSection";
import { WorkspacePlanCheckoutForm } from "@/components/plans/workspace-plan-checkout-form";
import type { PlanCheckoutAvailability } from "@/lib/stripe/prices";

type PlansPricingWithInlineCheckoutProps = {
  checkoutAvailability: PlanCheckoutAvailability;
  checkoutIntentBasePath?: string;
  paidCheckoutButtonLabel?: string;
};

/**
 * Public plans pages: open Stripe Payment Element in a modal instead of hosted Checkout redirect.
 */
export function PlansPricingWithInlineCheckout({
  checkoutAvailability,
  checkoutIntentBasePath = "/plans",
  paidCheckoutButtonLabel,
}: PlansPricingWithInlineCheckoutProps) {
  const [inlineCheckout, setInlineCheckout] = useState<PlanInlineCheckoutPayload | null>(null);
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  const showingCheckout = Boolean(inlineCheckout && stripePublishableKey);

  return (
    <>
      <PlansPricingSection
        checkoutAvailability={checkoutAvailability}
        checkoutIntentBasePath={checkoutIntentBasePath}
        paidCheckoutButtonLabel={paidCheckoutButtonLabel}
        checkoutUi="elements"
        onEmbeddedCheckoutClientSecret={setInlineCheckout}
      />

      {showingCheckout && inlineCheckout ? (
        <div className="fixed inset-0 z-[110000] flex items-center justify-center overflow-hidden bg-[#0f172a]/45 p-4 backdrop-blur-[1px] sm:p-6">
          <div
            className="pointer-events-auto flex max-h-[min(92dvh,900px)] w-full max-w-[min(98vw,72rem)] flex-col overflow-hidden rounded-2xl border border-[#cfe8b8] bg-white/95 shadow-[0_25px_50px_-12px_rgba(132,193,38,0.18)] backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="plans-checkout-title"
          >
            <div className="shrink-0 border-b border-[#e5e7eb]/80 bg-[linear-gradient(180deg,#f7fcf2_0%,#ffffff_100%)] px-4 pb-4 pt-4 sm:px-7 sm:pb-5 sm:pt-5">
              <h2
                id="plans-checkout-title"
                className="font-section text-center text-base font-extrabold tracking-tight text-[#111827] sm:text-lg"
              >
                You&apos;re One Step Away
              </h2>
              <p className="mx-auto mt-1 max-w-2xl text-center text-[11px] leading-snug text-[#6b7280] sm:text-xs">
                Add your payment details to complete setup. Secure processing and you can update or
                cancel anytime.
              </p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-5 pt-3 sm:px-7 sm:pb-6 sm:pt-5">
              <WorkspacePlanCheckoutForm
                key={inlineCheckout.clientSecret}
                publishableKey={stripePublishableKey}
                clientSecret={inlineCheckout.clientSecret}
                plan={inlineCheckout.plan}
                billing={inlineCheckout.billing}
                onClose={() => setInlineCheckout(null)}
              />
            </div>
            <p className="mx-auto shrink-0 px-4 pb-4 text-center text-[10px] leading-snug text-[#6b7280] sm:px-7 sm:pb-5 sm:text-xs">
              All payments are securely processed through a trusted, PCI-compliant provider.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
