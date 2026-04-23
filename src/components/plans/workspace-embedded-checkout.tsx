"use client";

import { useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";

type EmbeddedInstance = {
  mount: (target: HTMLElement | string) => void;
  destroy: () => void;
};

type WorkspaceEmbeddedCheckoutProps = {
  publishableKey: string;
  clientSecret: string;
  onClose: () => void;
};

/**
 * Mounts Stripe Embedded Checkout (Checkout Session `ui_mode: embedded_page`).
 */
export function WorkspaceEmbeddedCheckout({
  publishableKey,
  clientSecret,
  onClose,
}: WorkspaceEmbeddedCheckoutProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<EmbeddedInstance | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const el = mountRef.current;
    if (!el || !publishableKey || !clientSecret) return;

    let cancelled = false;

    void (async () => {
      const stripe = await loadStripe(publishableKey);
      if (!stripe || cancelled || !mountRef.current) return;

      const fetchClientSecret = async () => clientSecret;

      const stripeAny = stripe as unknown as {
        createEmbeddedCheckoutPage?: (opts: {
          fetchClientSecret: () => Promise<string>;
        }) => Promise<EmbeddedInstance>;
        initEmbeddedCheckout?: (opts: { clientSecret: string }) => Promise<EmbeddedInstance>;
      };

      let checkout: EmbeddedInstance | null = null;
      if (typeof stripeAny.createEmbeddedCheckoutPage === "function") {
        checkout = await stripeAny.createEmbeddedCheckoutPage({ fetchClientSecret });
      } else if (typeof stripeAny.initEmbeddedCheckout === "function") {
        checkout = await stripeAny.initEmbeddedCheckout({ clientSecret });
      } else {
        console.error("[WorkspaceEmbeddedCheckout] Stripe.js embedded API not found");
        onCloseRef.current();
        return;
      }

      if (cancelled || !mountRef.current) {
        checkout.destroy();
        return;
      }

      checkout.mount(mountRef.current);
      checkoutRef.current = checkout;
    })();

    return () => {
      cancelled = true;
      checkoutRef.current?.destroy();
      checkoutRef.current = null;
    };
  }, [publishableKey, clientSecret]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="mb-2 flex shrink-0 justify-center sm:mb-3">
        <button
          type="button"
          onClick={() => {
            checkoutRef.current?.destroy();
            checkoutRef.current = null;
            onClose();
          }}
          className="text-xs font-semibold text-[#4b5563] underline underline-offset-2 hover:text-[#111827] sm:text-sm"
        >
          Back to plans
        </button>
      </div>
      <div
        ref={mountRef}
        className="min-h-[min(420px,55dvh)] w-full flex-1 overflow-y-auto rounded-lg border border-[#e5e7eb] bg-white sm:min-h-[480px]"
      />
    </div>
  );
}
