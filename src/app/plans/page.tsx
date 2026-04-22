import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BackToTop } from "@/components/landing/BackToTop";
import { LandingNav } from "@/components/landing/LandingNav";
import { PreFooterCtaSection } from "@/components/landing/PreFooterCtaSection";
import { Footer } from "@/components/landing/Footer";
import { LandingSectionWave } from "@/components/landing/sectionWaves";

const PLAN_CARD_CTA_CLASS =
  "inline-flex min-h-[2.75rem] w-full max-w-xs items-center justify-center rounded-full bg-[var(--ollie-primary)] px-8 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#6fa020] sm:w-auto";

const PLAN_CARD_CTA_COMING_SOON_CLASS =
  "inline-flex min-h-[2.75rem] w-full max-w-xs cursor-not-allowed items-center justify-center rounded-full border-2 border-[#e5e7eb] bg-[#f3f4f6] px-8 py-3 text-base font-bold text-[#6b7280] shadow-sm sm:w-auto";

export const metadata: Metadata = {
  title: "Plan Options — Ollie Code",
  description:
    "Starter and Family plans for home learners, plus Educators pricing—pick what fits your household or classroom.",
};

const PLAN_CARDS = [
  {
    id: "starter",
    name: "Starter Plan",
    positioning: "Perfect For Getting Started",
    audience: "For one creator",
    pricing: "$7/month or $49/year",
    features: [
      "1 child account",
      "Full access to all lessons and projects",
      "Unlimited builds and saves",
      "Game creation + project tools",
      "Individual progress tracking",
    ] as const,
    description: null,
    pricingLead: null,
    iconSrc: "/images/plan-icon-starter.png",
    iconAlt:
      "Friendly red robot character with a star, representing the Starter plan.",
    cta: { kind: "signup" as const, label: "Sign Up" },
    accent: {
      headerTop: "bg-rose-100 border-b border-rose-200/50",
      iconFrame:
        "rounded-full border-4 border-rose-300 bg-rose-50 p-1 shadow-md ring-2 ring-white sm:p-1.5",
      title: "text-rose-950",
    },
  },
  {
    id: "family",
    name: "Family Plan",
    positioning: "Siblings & Shared Learning",
    audience: "For growing creators",
    pricing: "$12/month or $89/year",
    features: [
      "Up to 3 child accounts",
      "Full access to all lessons and projects",
      "Unlimited builds and saves",
      "Game creation + project tools",
      "Individual progress tracking",
    ] as const,
    description: null,
    pricingLead: null,
    iconSrc: "/images/plan-icon-homeschool.png",
    iconAlt:
      "Friendly orange robot in a graduation cap holding a book, representing the Family plan.",
    cta: { kind: "signup" as const, label: "Sign Up" },
    accent: {
      headerTop: "bg-amber-100 border-b border-amber-200/50",
      iconFrame:
        "rounded-full border-4 border-amber-300 bg-amber-50 p-1 shadow-md ring-2 ring-white sm:p-1.5",
      title: "text-amber-950",
    },
  },
  {
    id: "educators",
    name: "Educators",
    positioning: "Schools, Studios & Programs",
    audience: "For schools, districts, and programs",
    pricingLead: null,
    pricing: "Custom Plan",
    features: [
      "Unlimited student accounts",
      "Classroom dashboard",
      "Assignment & lesson controls",
      "Professional Development",
      "Bulk pricing for schools & districts",
    ] as const,
    description: null,
    iconSrc: "/images/plan-icon-educators.png",
    iconAlt:
      "Friendly blue robot with glasses and a wand, representing the Educators plan.",
    cta: { kind: "comingSoon" as const, label: "Coming Soon" },
    accent: {
      headerTop: "bg-sky-100 border-b border-sky-200/50",
      iconFrame:
        "rounded-full border-4 border-sky-300 bg-sky-50 p-1 shadow-md ring-2 ring-white sm:p-1.5",
      title: "text-sky-950",
    },
  },
] as const;

export default function PlansPage() {
  return (
    <div className="box-border flex min-h-[100dvh] w-full min-w-0 max-w-full flex-col overflow-x-clip bg-[#ffffff]">
      <LandingNav appearance="mint" />
      <main className="min-w-0 w-full max-w-full flex-1">
        <section
          className="relative scroll-mt-20 overflow-x-clip bg-[#ffffff] px-4 pb-24 pt-16 sm:pb-28 sm:pt-20 lg:pb-32 lg:pt-24"
          aria-labelledby="plans-heading"
        >
          <LandingSectionWave variant="bottom" colorClassName="text-[#d9eeff]" />
          <div className="relative z-10 mx-auto max-w-6xl">
            <h1
              id="plans-heading"
              className="font-section text-center text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl"
            >
              Plan Options
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-center text-base leading-relaxed text-[#6b7280] sm:text-lg">
              Pick the plan that fits your learning journey. Start with easy, family-friendly pricing at
              home, or explore powerful, scalable options built for classrooms, schools, and education
              programs.
            </p>
            <ul className="mt-12 grid list-none gap-x-6 gap-y-20 p-0 pt-12 sm:mt-14 sm:gap-x-8 sm:gap-y-24 sm:pt-14 md:grid-cols-3 lg:mt-16">
              {PLAN_CARDS.map((plan) => (
                <li key={plan.id} className="min-w-0">
                  <article className="relative flex h-full flex-col overflow-visible rounded-2xl border border-[#e5e7eb] bg-white text-center shadow-[0_12px_40px_-8px_rgba(15,23,42,0.14)] sm:shadow-[0_16px_48px_-10px_rgba(15,23,42,0.16)]">
                    <div
                      className={`absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 ${plan.accent.iconFrame}`}
                    >
                      <div className="relative flex h-16 w-16 items-center justify-center sm:h-[4.25rem] sm:w-[4.25rem]">
                        <Image
                          src={plan.iconSrc}
                          alt={plan.iconAlt}
                          width={256}
                          height={256}
                          sizes="(max-width: 768px) 64px, 72px"
                          className="h-full w-full max-h-[96%] max-w-[96%] object-contain object-center"
                        />
                      </div>
                    </div>
                    <header
                      className={`relative z-0 rounded-t-2xl px-6 pb-5 pt-14 sm:px-8 sm:pb-6 sm:pt-[4.25rem] ${plan.accent.headerTop}`}
                    >
                      <h2
                        className={`font-section text-xl font-extrabold sm:text-2xl ${plan.accent.title}`}
                      >
                        {plan.name}
                      </h2>
                      {plan.positioning ? (
                        <p
                          className={`mt-2 whitespace-nowrap text-sm font-medium leading-snug sm:text-base ${plan.accent.title} opacity-80`}
                        >
                          {plan.positioning}
                        </p>
                      ) : null}
                    </header>
                    <div className="flex flex-1 flex-col rounded-b-2xl bg-white px-6 pb-6 pt-5 text-center sm:px-8 sm:pb-8 sm:pt-6">
                      {plan.audience ? (
                        <p className="text-sm font-semibold text-[#374151] sm:text-base">
                          {plan.audience}
                        </p>
                      ) : null}
                      {plan.pricingLead ? (
                        <p className="mt-2 text-sm font-medium leading-relaxed text-[#4b5563] sm:text-base">
                          {plan.pricingLead}
                        </p>
                      ) : null}
                      {plan.pricing ? (
                        <p className="mt-2 text-lg font-extrabold tracking-tight text-[#111827] sm:text-xl">
                          {plan.pricing}
                        </p>
                      ) : null}
                      {plan.features && plan.features.length > 0 ? (
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
                        <p className="mt-1 flex-1 text-left text-sm leading-relaxed text-[#6b7280] sm:text-center sm:text-base">
                          {plan.description}
                        </p>
                      ) : null}
                      <div className="mt-6 flex w-full shrink-0 justify-center">
                        {plan.cta.kind === "signup" ? (
                          <Link href="/auth/signup" className={PLAN_CARD_CTA_CLASS}>
                            {plan.cta.label}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className={PLAN_CARD_CTA_COMING_SOON_CLASS}
                            aria-disabled="true"
                          >
                            {plan.cta.label}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
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
