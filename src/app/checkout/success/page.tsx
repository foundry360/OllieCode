import type { Metadata } from "next";
import { Suspense } from "react";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { CheckoutSuccessClient } from "@/app/checkout/success/checkout-success-client";

export const metadata: Metadata = {
  title: "You are subscribed — Ollie Code",
  description: "Thanks for subscribing to Ollie Code.",
};

function SuccessFallback() {
  return (
    <p className="text-base leading-relaxed text-[#6b7280] sm:text-lg">Loading…</p>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="box-border flex min-h-[100dvh] w-full min-w-0 max-w-full flex-col overflow-x-clip bg-[#ffffff]">
      <LandingNav appearance="mint" />
      <main className="flex min-w-0 flex-1 flex-col items-center justify-center px-4 py-20">
        <div className="mx-auto max-w-lg text-center">
          <Suspense fallback={<SuccessFallback />}>
            <CheckoutSuccessClient />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
