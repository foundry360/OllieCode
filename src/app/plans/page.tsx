import type { Metadata } from "next";
import { BackToTop } from "@/components/landing/BackToTop";
import { LandingNav } from "@/components/landing/LandingNav";
import { PreFooterCtaSection } from "@/components/landing/PreFooterCtaSection";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Plans — Ollie Code",
  description: "Plans for families, homeschoolers, and educators. Details coming soon.",
};

const PLAN_CARDS = [
  {
    id: "starter",
    name: "Starter",
    description: "Plan details will go here soon.",
  },
  {
    id: "homeschool",
    name: "Home School",
    description: "Plan details will go here soon.",
  },
  {
    id: "educators",
    name: "Educators",
    description: "Plan details will go here soon.",
  },
] as const;

export default function PlansPage() {
  return (
    <div className="box-border flex min-h-[100dvh] w-full min-w-0 max-w-full flex-col overflow-x-clip bg-[#f8fafc]">
      <LandingNav appearance="mint" />
      <main className="min-w-0 w-full max-w-full flex-1">
        <section
          className="scroll-mt-20 px-4 py-16 sm:py-20 lg:py-24"
          aria-labelledby="plans-heading"
        >
          <div className="mx-auto max-w-6xl">
            <h1
              id="plans-heading"
              className="font-section text-center text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl"
            >
              Plans
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-[#6b7280] sm:text-lg">
              Choose the path that fits your learner. We&apos;ll publish full plan details here
              soon.
            </p>
            <ul className="mt-12 grid list-none gap-6 p-0 sm:mt-14 md:grid-cols-3 md:gap-8 lg:mt-16">
              {PLAN_CARDS.map((plan) => (
                <li key={plan.id}>
                  <article className="flex h-full flex-col rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="font-section text-xl font-extrabold text-[#111827] sm:text-2xl">
                      {plan.name}
                    </h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-[#6b7280] sm:text-base">
                      {plan.description}
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <PreFooterCtaSection />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
