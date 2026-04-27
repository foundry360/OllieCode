import type { Metadata } from "next";
import { Suspense } from "react";
import { BackToTop } from "@/components/landing/BackToTop";
import { LandingNav } from "@/components/landing/LandingNav";
import { PreFooterCtaSection } from "@/components/landing/PreFooterCtaSection";
import { Footer } from "@/components/landing/Footer";
import { LandingSectionWave } from "@/components/landing/sectionWaves";
import { PlansPricingWithInlineCheckout } from "@/components/plans/PlansPricingWithInlineCheckout";
import { getPlanCheckoutAvailability } from "@/lib/stripe/prices";

const HERO_GRADIENT =
  "bg-[linear-gradient(180deg,#111727_0%,#172a40_22%,#1a3350_48%,#1c3959_72%,#1f3d58_100%)]";

/** Same fluid hero title scale as the Why Ollie Code page. */
const PLANS_HERO_HEADING =
  "font-section text-[clamp(0.8125rem,0.35rem+2.4vw,3rem)] font-extrabold leading-[1.1] tracking-tight";

function PlansPricingFallback() {
  return (
    <div className="mt-4 text-center text-sm text-[#6b7280]" aria-hidden>
      Loading plans…
    </div>
  );
}

export const metadata: Metadata = {
  title: "Plan Options — Ollie Code",
  description:
    "Starter and Family plans for home learners, plus Educators pricing—pick what fits your household or classroom.",
};

export default function PlansPage() {
  const checkoutAvailability = getPlanCheckoutAvailability();

  return (
    <div className="box-border flex min-h-[100dvh] w-full min-w-0 max-w-full flex-col overflow-x-clip bg-[#ffffff]">
      <LandingNav appearance="mint" />
      <main className="min-w-0 w-full max-w-full flex-1">
        <section
          className={`relative isolate min-w-0 overflow-x-visible px-4 pb-20 pt-12 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20 ${HERO_GRADIENT}`}
          aria-labelledby="plans-heading"
        >
          <LandingSectionWave variant="bottom" colorClassName="text-[#ffffff]" />
          <div className="relative z-10 mx-auto max-w-6xl text-center">
            <h1
              id="plans-heading"
              className={`text-balance text-white ${PLANS_HERO_HEADING}`}
            >
              Choose Your <span className="italic text-[var(--ollie-primary)]">Plan</span>
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-pretty text-center text-base font-medium leading-relaxed text-white/88 sm:mt-6 sm:text-lg">
              Starter and Family for home learners, Educators for classrooms, simple pricing, no
              contracts, billed monthly or annually.
            </p>
          </div>
        </section>

        <section
          id="plans-pricing"
          className="relative scroll-mt-24 overflow-x-clip bg-[#ffffff] px-4 pb-24 pt-3 sm:pb-28 sm:pt-4 lg:pb-32 lg:pt-5"
          aria-label="Pricing and checkout"
        >
          <LandingSectionWave variant="bottom" colorClassName="text-[#d9eeff]" />
          <div className="relative z-10 mx-auto max-w-6xl">
            <Suspense fallback={<PlansPricingFallback />}>
              <PlansPricingWithInlineCheckout
                checkoutAvailability={checkoutAvailability}
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
      <Footer waveTopFillClassName="text-[#d9eeff]" />
      <BackToTop />
    </div>
  );
}
