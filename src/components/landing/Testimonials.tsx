"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { LandingSectionWave } from "@/components/landing/sectionWaves";

const PLACEHOLDERS = [
  {
    quote: "I made my turtle dance!",
    name: "Madison, 9",
    img: "/images/testimonial-avatar-happy-girl.png",
  },
  {
    quote: "I created a dancing robot!",
    name: "Nicholas, 11",
    img: "/images/testimonial-avatar-cool-boy.png",
  },
  {
    quote: "I like when I press Run and it actually moves.",
    name: "Jordan, 8",
    img: "/images/testimonial-avatar-curious-girl.png",
  },
  {
    quote: "I created my own adventure!",
    name: "Matthew, 10",
    img: "/images/testimonial-avatar-laughing-boy.png",
  },
  {
    quote: "Coding feels like playing with toys.",
    name: "Casey, 9",
    img: "/images/testimonial-avatar-shy-girl.png",
  },
] as const;

const CARD_GROUP_CLASS =
  "flex shrink-0 gap-5 pr-5 sm:gap-6 sm:pr-6 lg:gap-6 lg:pr-6";

function testimonialCardClass(reduced: boolean) {
  return [
    "flex shrink-0 flex-col items-center rounded-2xl border border-white/15 bg-[#234b68] p-5 text-center shadow-sm sm:p-6",
    reduced
      ? "w-full max-w-[13rem] justify-self-center"
      : "w-[calc((100vw-6rem)/5)] min-w-[10.5rem] sm:min-w-[11rem]",
  ].join(" ");
}

function TestimonialCard({
  t,
  reduced,
}: {
  t: (typeof PLACEHOLDERS)[number];
  reduced: boolean;
}) {
  return (
    <article className={testimonialCardClass(reduced)}>
      <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-[#84c126] sm:h-16 sm:w-16">
        <Image src={t.img} alt="" fill className="object-cover" sizes="64px" />
      </div>
      <blockquote className="mt-3 font-section text-sm font-medium leading-snug text-white sm:mt-4 sm:text-base">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <cite className="mt-2 font-section text-xs font-semibold not-italic text-[#b8e063] sm:mt-3 sm:text-sm">
        {t.name}
      </cite>
    </article>
  );
}

export function Testimonials() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <section
      id="stories"
      className="relative z-10 -translate-y-px scroll-mt-20 overflow-x-hidden bg-gradient-to-b from-[#3a6288] via-[#2d4f6e] via-40% to-[#1f3d58] px-4 pb-24 pt-6 sm:pb-28 sm:pt-10 lg:pb-32 lg:pt-12"
    >
      <LandingSectionWave variant="bottom" colorClassName="text-white" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <h2 className="font-section text-center text-3xl font-extrabold text-white sm:text-4xl">
          What kids are saying
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-white/70">
          What young creators are saying about learning and building with Ollie Code.
        </p>

        {reducedMotion ? (
          <ul className="mt-12 grid list-none grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
            {PLACEHOLDERS.map((t) => (
              <li key={t.name} className="w-full max-w-[14rem]">
                <TestimonialCard t={t} reduced />
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {!reducedMotion ? (
        <div
          className="ollie-testimonials-marquee relative z-10 mt-12 w-screen max-w-[100vw] -translate-x-1/2 left-1/2 overflow-hidden py-1"
          aria-label="Kids testimonials, auto-scrolling"
        >
          <div className="ollie-testimonials-marquee-track">
            <div className={CARD_GROUP_CLASS}>
              {PLACEHOLDERS.map((t, index) => (
                <TestimonialCard key={`a-${index}`} t={t} reduced={false} />
              ))}
            </div>
            <div className={CARD_GROUP_CLASS}>
              {PLACEHOLDERS.map((t, index) => (
                <TestimonialCard key={`b-${index}`} t={t} reduced={false} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
