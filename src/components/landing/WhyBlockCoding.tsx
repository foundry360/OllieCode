import { LandingSectionWave } from "@/components/landing/sectionWaves";
import Image from "next/image";
import Link from "next/link";

export function WhyBlockCoding() {
  return (
    <section
      id="why-block-coding"
      className="relative z-10 scroll-mt-20 overflow-x-clip bg-[#d2e0ce] px-4 pb-16 pt-20 sm:pb-20 sm:pt-24 lg:pb-24 lg:pt-28"
      aria-labelledby="why-block-coding-heading"
    >
      {/* Top wave: fill matches previous section (Features, white). */}
      <LandingSectionWave variant="top" colorClassName="text-white" />
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="text-center lg:text-left">
          <h2
            id="why-block-coding-heading"
            className="font-section text-3xl font-extrabold leading-tight text-[#111827] sm:text-4xl"
          >
            Why Block Coding
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[#4b5563] sm:text-lg">
            Blocks turn big ideas into small steps kids can see and rearrange. They practice logic and
            sequencing first, then level up when they&apos;re ready for more. Every run on the canvas is
            instant feedback, celebrate what works, tweak what doesn&apos;t, and try again.
          </p>
          <div className="mt-8 flex justify-center lg:justify-start">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-full bg-[var(--ollie-primary)] px-8 py-3.5 text-base font-bold text-white shadow-md transition-colors hover:bg-[#6fa020]"
            >
              Start Coding
            </Link>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div
            className="relative isolate h-[min(24rem,90vw)] w-[min(22rem,86vw)] max-w-full overflow-hidden bg-slate-200/40 shadow-[0_28px_64px_-8px_rgba(54,83,20,0.42),0_16px_36px_-10px_rgba(15,23,42,0.22),0_6px_16px_-4px_rgba(15,23,42,0.14)] lg:h-[28rem] lg:w-[26rem]"
            style={{
              borderRadius: "42% 58% 48% 52% / 36% 44% 56% 64%",
            }}
          >
            <div className="flex h-full min-h-0 w-full min-w-0 items-center justify-center p-4 sm:p-6">
              <Image
                src="/images/boycoder.png"
                alt="Learner using block-based coding"
                width={1600}
                height={2000}
                className="h-auto w-auto max-h-full max-w-full object-contain"
                sizes="(max-width: 1024px) 86vw, 26rem"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
