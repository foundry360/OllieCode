import type { Metadata } from "next";
import { Suspense } from "react";
import { BackToTop } from "@/components/landing/BackToTop";
import { LandingNav } from "@/components/landing/LandingNav";
import { PreFooterCtaSection } from "@/components/landing/PreFooterCtaSection";
import { Footer } from "@/components/landing/Footer";
import { LandingSectionWave } from "@/components/landing/sectionWaves";
import { PlansPricingSection } from "@/components/plans/PlansPricingSection";
import { getPlanCheckoutAvailability } from "@/lib/stripe/prices";

function PlansPricingFallback() {
  return (
    <div className="mt-12 text-center text-sm text-[#6b7280]" aria-hidden>
      Loading plans…
    </div>
  );
}

export const metadata: Metadata = {
  title: "Welcome — Choose a plan | Ollie Code",
  description:
    "Welcome to Ollie Code. Pick a Starter or Family plan to unlock the workspace and full lessons.",
};

export default function PlansWelcomePage() {
  const checkoutAvailability = getPlanCheckoutAvailability();

  return (
    <div className="box-border flex min-h-[100dvh] w-full min-w-0 max-w-full flex-col overflow-x-clip bg-[#ffffff]">
      <LandingNav appearance="mint" />
      <main className="min-w-0 w-full max-w-full flex-1">
        <section
          className="relative scroll-mt-20 overflow-x-clip bg-[#ffffff] px-4 pb-24 pt-16 sm:pb-28 sm:pt-20 lg:pb-32 lg:pt-24"
          aria-labelledby="plans-welcome-heading"
        >
          <LandingSectionWave variant="bottom" colorClassName="text-[#d9eeff]" />
          <div className="relative z-10 mx-auto max-w-6xl">
            <h1
              id="plans-welcome-heading"
              className="font-section text-center text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl"
            >
              Welcome to Ollie Code!
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-center text-base font-semibold leading-relaxed text-[#374151] sm:text-xl">
              Let&apos;s get started with a new plan!
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-center text-base leading-relaxed text-[#6b7280] sm:text-lg">
              Choose monthly or yearly billing, then pick the plan that fits your home. You&apos;ll
              unlock the full workspace and lessons as soon as your subscription is active.
            </p>
            <Suspense fallback={<PlansPricingFallback />}>
              <PlansPricingSection
                checkoutAvailability={checkoutAvailability}
                checkoutIntentBasePath="/plans/welcome"
                paidCheckoutButtonLabel="Get Started"
              />
            </Suspense>
            <p className="mx-auto mt-12 max-w-3xl text-center text-sm leading-relaxed text-[#6b7280] sm:mt-14 sm:text-base">
              No contracts. Cancel anytime. Billed monthly or annually. Family plan includes up to 3
              child accounts. Educator pricing available for schools and classrooms.
            </p>
          </div>
        </section>
        <PreFooterCtaSection />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
