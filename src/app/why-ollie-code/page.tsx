import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { LandingSectionWave } from "@/components/landing/sectionWaves";

export const metadata: Metadata = {
  title: "Why Ollie Code — Ollie Code",
  description:
    "Why Ollie Code exists: block-based coding for K–5, meaningful screen time, and a path to confidence for families and classrooms.",
};

const HERO_GRADIENT =
  "bg-[linear-gradient(180deg,#111727_0%,#172a40_22%,#1a3350_48%,#1c3959_72%,#1f3d58_100%)]";

/** Same fluid scale as “Our Commitment to Safety and Security” — all major titles on this page. */
const WHY_MAIN_HEADING_TYPE =
  "font-section text-[clamp(0.8125rem,0.35rem+2.4vw,3rem)] font-extrabold leading-[1.1] tracking-tight";

const OUTCOMES_SHARED_LINE =
  "These are not separate skills. They build together as kids create, experiment, and explore.";

const WHY_IT_WORKS_CARDS: {
  iconSrc: string;
  iconAlt: string;
  title: string;
  body: string;
}[] = [
  {
    iconSrc: "/images/hero-card-icon-confidence.png",
    iconAlt: "Friendly purple robot icon with stars representing confidence",
    title: "Confidence through early wins",
    body: "Small, visible results stack into “I can change this” instead of “I do not get code.”",
  },
  {
    iconSrc: "/images/hero-card-icon-safe-experiment.png",
    iconAlt: "Friendly orange robot icon representing safe experimentation",
    title: "Problem solving through trial",
    body: "When something misbehaves, debugging is framed as figuring out what happened, not failing a test.",
  },
  {
    iconSrc: "/images/hero-card-icon-visual-logic.png",
    iconAlt: "Friendly teal robot icon representing visual logic on the canvas",
    title: "Logical thinking that transfers",
    body: "Sequencing, conditions, and events show up in games and animations today, and in how kids reason about systems tomorrow.",
  },
  {
    iconSrc: "/images/hero-card-icon-no-syntax.png",
    iconAlt: "Friendly blue robot icon representing coding without syntax barriers",
    title: "Engagement that earns the time",
    body: "When building feels like play with a point, kids stay with it, and parents notice.",
  },
];

/**
 * Content band; optional `waveTopColor` adds a landing-style top divider (same pattern as
 * {@link WhyBlockCoding}) where the fill matches the section above.
 */
function Band({
  id,
  titleId,
  ariaLabel,
  bgClass,
  waveTopColor,
  contentMaxWidthClass = "max-w-3xl",
  children,
}: Readonly<{
  id?: string;
  titleId?: string;
  ariaLabel?: string;
  bgClass: string;
  /** When set, renders {@link LandingSectionWave} `variant="top"` (previous section color). */
  waveTopColor?: string;
  /** Tailwind max-width on inner wrapper (e.g. `max-w-6xl` for two-column layouts). */
  contentMaxWidthClass?: string;
  children: ReactNode;
}>) {
  const a11y = {
    ...(titleId ? { "aria-labelledby": titleId } : {}),
    ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
  };

  const innerClass = `relative z-10 mx-auto w-full min-w-0 ${contentMaxWidthClass}`;

  if (waveTopColor) {
    return (
      <section
        id={id}
        className={`relative isolate scroll-mt-20 overflow-x-clip px-4 pb-14 pt-20 sm:px-6 sm:pb-16 sm:pt-24 lg:px-8 lg:pb-20 lg:pt-28 ${bgClass}`}
        {...a11y}
      >
        <LandingSectionWave variant="top" colorClassName={waveTopColor} />
        <div className={innerClass}>{children}</div>
      </section>
    );
  }

  return (
    <section id={id} className={`relative scroll-mt-20 overflow-x-clip ${bgClass}`} {...a11y}>
      <div
        className={`${innerClass} px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20`}
      >
        {children}
      </div>
    </section>
  );
}

export default function WhyOllieCodePage() {
  return (
    <main className="flex-1">
      <section
        className={`relative isolate min-w-0 overflow-x-visible px-4 pb-20 pt-12 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20 ${HERO_GRADIENT}`}
        aria-labelledby="why-heading"
      >
        <LandingSectionWave variant="bottom" colorClassName="text-[#f1f5f9]" />
        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <h1
            id="why-heading"
            className={`text-balance text-white ${WHY_MAIN_HEADING_TYPE}`}
          >
            Why <span className="italic text-[var(--ollie-primary)]">Ollie Code</span>
          </h1>
          <p className="mx-auto mt-5 max-w-none whitespace-nowrap text-center text-[clamp(0.6875rem,2.1vw+0.4rem,1.25rem)] font-medium leading-snug tracking-tight text-white/88 sm:mt-6 sm:leading-normal">
            A visual way into coding for elementary learners built for confidence, not credentials.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:mt-12 sm:gap-4">
            <Link
              href="/plans"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#84c126] px-7 py-2.5 text-sm font-bold text-[#111827] shadow-sm transition hover:bg-[#6fa020] sm:min-h-12 sm:px-8 sm:text-base"
            >
              See plans
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-white/35 bg-white/10 px-7 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:border-white/55 hover:bg-white/15 sm:min-h-12 sm:px-8 sm:text-base"
            >
              Start Coding
            </Link>
          </div>
        </div>
      </section>

      <Band
        id="problem"
        titleId="problem-heading"
        bgClass="bg-[#f1f5f9]"
        contentMaxWidthClass="max-w-7xl"
      >
        <>
          <p className="mx-auto mb-3 max-w-4xl text-center font-section text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ollie-primary)] sm:mb-4 sm:text-base">
            The Learning Gap
          </p>
          <div className="-mx-1 overflow-x-auto overflow-y-visible px-1 text-center [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:overflow-x-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
            <h2
              id="problem-heading"
              className={`mb-10 inline-block min-w-min whitespace-nowrap text-center text-[#111827] sm:mb-12 lg:mb-14 ${WHY_MAIN_HEADING_TYPE}`}
            >
              Why Kids Lose Interest in Coding Early
            </h2>
          </div>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
            <div className="min-w-0 lg:pr-2">
              <h3 className="font-section text-xl font-extrabold leading-snug tracking-tight text-[var(--ollie-primary)] sm:text-2xl">
                Ollie Code Closes The Gap
              </h3>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-[#374151] sm:text-lg">
                <p>
                  Coding is still introduced the wrong way: syntax first, concepts second. For kids,
                  that feels like homework before any wins, and interest fades quickly.
                </p>
                <p>
                  They also disengage when tools feel like school instead of exploration.
                </p>
                <p>
                  Meanwhile, parents are stuck choosing between entertainment and “educational” apps
                  that don&apos;t fully deliver. Productive, age-appropriate screen time shouldn&apos;t
                  require becoming the teacher at home.
                </p>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
              <div className="relative aspect-[544/459] w-full overflow-hidden rounded-2xl bg-[#f1f5f9]">
                <Image
                  src="/images/why-problem-section-revised.png"
                  alt="Two children collaborating at a laptop with playful coding graphics: a code symbol and colorful programming blocks including Start and Forever."
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          </div>
        </>
      </Band>

      <Band
        id="approach"
        titleId="approach-heading"
        bgClass="bg-white"
        waveTopColor="text-[#f1f5f9]"
        contentMaxWidthClass="max-w-7xl"
      >
        <>
          <p className="mx-auto mb-3 max-w-4xl text-center font-section text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ollie-primary)] sm:mb-4 sm:text-base">
            By Design
          </p>
          <h2
            id="approach-heading"
            className={`mx-auto mb-10 max-w-4xl text-balance text-center text-[#111827] sm:mb-12 lg:mb-14 ${WHY_MAIN_HEADING_TYPE}`}
          >
            Built for Curiosity. Not Complexity
          </h2>
          <div className="grid items-center gap-10 lg:grid-cols-[3fr_2fr] lg:gap-x-10 xl:gap-x-14">
            <div className="relative order-1 mx-auto w-full min-w-0 max-w-2xl sm:max-w-3xl lg:order-1 lg:mx-0 lg:max-w-none">
              <div className="relative aspect-[1024/584] w-full">
                <Image
                  src="/images/why-approach-workspace.jpg"
                  alt="Ollie Code workspace with block-based scripts, lesson preview, and friendly characters showing build-and-run learning across devices."
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              </div>
            </div>
            <div className="order-2 min-w-0 lg:order-2 lg:pl-2">
              <ul className="list-none space-y-4 text-base leading-relaxed text-[#374151] sm:text-lg">
                <li className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#84c126]" aria-hidden />
                  <span>
                    <strong className="font-semibold text-[#111827]">Visual, block-based building.</strong>{" "}
                    Learners compose ideas with pieces that snap together, so the focus stays on logic
                    and outcomes, not memorizing symbols.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#84c126]" aria-hidden />
                  <span>
                    <strong className="font-semibold text-[#111827]">Learn by making.</strong> Skills show
                    up because something on the canvas needed to work, not because a chapter said so.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#84c126]" aria-hidden />
                  <span>
                    <strong className="font-semibold text-[#111827]">Tight feedback loops.</strong> Run,
                    watch, adjust. Iteration becomes a habit instead of a lecture.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#84c126]" aria-hidden />
                  <span>
                    <strong className="font-semibold text-[#111827]">Guidance plus room to roam.</strong>{" "}
                    Structured paths when kids want a handrail; open space when they want to try their own
                    idea without starting from zero.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </>
      </Band>

      <Band
        id="why-it-works"
        titleId="outcomes-heading"
        bgClass="bg-[#f1f5f9]"
        waveTopColor="text-white"
        contentMaxWidthClass="max-w-7xl"
      >
        <p className="mx-auto mb-3 max-w-4xl text-center font-section text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ollie-primary)] sm:mb-4 sm:text-base">
          The Results
        </p>
        <h2
          id="outcomes-heading"
          className={`mx-auto mb-10 max-w-4xl text-balance text-center text-[#111827] sm:mb-12 lg:mb-14 ${WHY_MAIN_HEADING_TYPE}`}
        >
          Real Learning Outcomes
        </h2>
        <ul className="grid list-none grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-8 lg:gap-10">
          {WHY_IT_WORKS_CARDS.map((card) => (
            <li key={card.title}>
              <div className="flex h-full flex-col items-center rounded-2xl bg-white px-5 pb-6 pt-0 text-center shadow-sm ring-1 ring-[#e2e8f0] sm:px-6">
                <div className="-mt-2 flex h-[5.5rem] w-full shrink-0 items-end justify-center sm:h-24">
                  <Image
                    src={card.iconSrc}
                    alt={card.iconAlt}
                    width={88}
                    height={88}
                    className="max-h-[4.5rem] max-w-[4.5rem] object-contain object-bottom sm:max-h-[5rem] sm:max-w-[5rem]"
                    sizes="(max-width: 640px) 40vw, 88px"
                  />
                </div>
                <h3 className="mt-3 font-section text-lg font-bold leading-snug tracking-tight text-[#111827] sm:text-xl">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#4b5563] sm:text-base">{card.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mx-auto mt-10 max-w-4xl sm:mt-12 lg:mt-14">
          <div className="rounded-2xl border border-white/50 bg-[#d2e0ce]/70 px-6 py-5 text-center shadow-sm backdrop-blur-sm sm:px-8 sm:py-7">
            <p className="text-pretty text-lg font-medium leading-relaxed text-[#1e293b] sm:text-xl lg:text-2xl lg:leading-snug">
              {OUTCOMES_SHARED_LINE}
            </p>
          </div>
        </div>
      </Band>

      <Band
        id="safety"
        titleId="safety-heading"
        bgClass="bg-white"
        waveTopColor="text-[#f1f5f9]"
        contentMaxWidthClass="max-w-7xl"
      >
        <p className="mx-auto mb-3 max-w-4xl text-center font-section text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ollie-primary)] sm:mb-4 sm:text-base">
          Built for kids. Trusted by parents.
        </p>
        <div className="-mx-1 overflow-x-auto overflow-y-visible px-1 text-center [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:overflow-x-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          <h2
            id="safety-heading"
            className={`mb-10 inline-block min-w-min whitespace-nowrap text-center text-[#111827] sm:mb-12 lg:mb-14 ${WHY_MAIN_HEADING_TYPE}`}
          >
            Our Commitment to Safety and Security
          </h2>
        </div>
        <div className="mx-auto max-w-6xl text-center text-pretty">
          <p className="text-lg leading-relaxed text-[#374151] sm:text-xl sm:leading-relaxed">
            Ollie Code is designed to provide a safe, focused environment where kids can create and
            learn without unnecessary risks or distractions. Everything is intentionally structured to
            keep the experience simple and age-appropriate, so children can stay engaged in building and
            exploring rather than navigating complexity or unrelated content. The platform removes common
            online distractions and prioritizes a calm, controlled space where learning feels natural,
            creative, and secure from the start.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-4xl space-y-12 text-left">
            <section aria-labelledby="safety-kid-first-heading">
              <div className="flex items-center gap-5 sm:gap-6 lg:gap-8">
                <div
                  className="flex size-36 shrink-0 items-center justify-center rounded-full border-2 border-[#9ccc8a] bg-gradient-to-b from-[#f1faeb] to-[#dcebd4] shadow-sm sm:size-44 lg:size-48"
                  aria-hidden
                >
                  <Image
                    src="/images/safety-icon-safe-environment.png"
                    alt=""
                    width={120}
                    height={120}
                    className="h-[62%] w-[62%] object-contain sm:h-[64%] sm:w-[64%]"
                    sizes="(max-width: 640px) 112px, (max-width: 1024px) 144px, 160px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    id="safety-kid-first-heading"
                    className="font-section text-2xl font-extrabold leading-snug tracking-tight text-[#111827] sm:text-3xl sm:leading-tight lg:text-[1.75rem] xl:text-3xl"
                  >
                    Safe, kid first environment
                  </h3>
                  <p className="mt-3 text-lg leading-relaxed text-[#374151] sm:text-xl">
                    Everything in Ollie Code is built with young learners in mind, simple, structured,
                    and appropriate for ages 7 to 13.
                  </p>
                </div>
              </div>
            </section>
            <section aria-labelledby="safety-no-ads-heading">
              <div className="flex items-center gap-5 sm:gap-6 lg:gap-8">
                <div
                  className="flex size-36 shrink-0 items-center justify-center rounded-full border-2 border-[#7dd3fc] bg-gradient-to-b from-[#f0f9ff] to-[#dbeafe] shadow-sm sm:size-44 lg:size-48"
                  aria-hidden
                >
                  <Image
                    src="/images/safety-icon-no-ads.png"
                    alt=""
                    width={120}
                    height={120}
                    className="h-[62%] w-[62%] object-contain sm:h-[64%] sm:w-[64%]"
                    sizes="(max-width: 640px) 112px, (max-width: 1024px) 144px, 160px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    id="safety-no-ads-heading"
                    className="font-section text-2xl font-extrabold leading-snug tracking-tight text-[#111827] sm:text-3xl sm:leading-tight lg:text-[1.75rem] xl:text-3xl"
                  >
                    No ads or external distractions
                  </h3>
                  <p className="mt-3 text-lg leading-relaxed text-[#374151] sm:text-xl">
                    Kids stay focused on building and learning. There are no third party ads or
                    unrelated content pulling attention away.
                  </p>
                </div>
              </div>
            </section>
            <section aria-labelledby="safety-payments-heading">
              <div className="flex items-center gap-5 sm:gap-6 lg:gap-8">
                <div
                  className="flex size-36 shrink-0 items-center justify-center rounded-full border-2 border-[#c4b5fd] bg-gradient-to-b from-[#faf5ff] to-[#ede9fe] shadow-sm sm:size-44 lg:size-48"
                  aria-hidden
                >
                  <Image
                    src="/images/safety-icon-secure-payments.png"
                    alt=""
                    width={120}
                    height={120}
                    className="h-[62%] w-[62%] object-contain sm:h-[64%] sm:w-[64%]"
                    sizes="(max-width: 640px) 112px, (max-width: 1024px) 144px, 160px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    id="safety-payments-heading"
                    className="font-section text-2xl font-extrabold leading-snug tracking-tight text-[#111827] sm:text-3xl sm:leading-tight lg:text-[1.75rem] xl:text-3xl"
                  >
                    Secure payments &amp; account protection
                  </h3>
                  <p className="mt-3 text-lg leading-relaxed text-[#374151] sm:text-xl">
                    All payments and account information are handled through secure, industry standard
                    systems to keep data protected.
                  </p>
                </div>
              </div>
            </section>
            <section aria-labelledby="safety-privacy-heading">
              <div className="flex items-center gap-5 sm:gap-6 lg:gap-8">
                <div
                  className="flex size-36 shrink-0 items-center justify-center rounded-full border-2 border-[#fdba74] bg-gradient-to-b from-[#fff7ed] to-[#ffedd5] shadow-sm sm:size-44 lg:size-48"
                  aria-hidden
                >
                  <Image
                    src="/images/safety-icon-privacy.png"
                    alt=""
                    width={120}
                    height={120}
                    className="h-[62%] w-[62%] object-contain sm:h-[64%] sm:w-[64%]"
                    sizes="(max-width: 640px) 112px, (max-width: 1024px) 144px, 160px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    id="safety-privacy-heading"
                    className="font-section text-2xl font-extrabold leading-snug tracking-tight text-[#111827] sm:text-3xl sm:leading-tight lg:text-[1.75rem] xl:text-3xl"
                  >
                    Privacy conscious by design
                  </h3>
                  <p className="mt-3 text-lg leading-relaxed text-[#374151] sm:text-xl">
                    We only collect what&apos;s needed to support the experience, nothing more. Data is
                    handled responsibly and never sold.
                  </p>
                </div>
              </div>
            </section>
        </div>
      </Band>
    </main>
  );
}
