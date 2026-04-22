import Image from "next/image";
import { LandingSectionWave } from "@/components/landing/sectionWaves";

export function OurMission() {
  return (
    <section
      id="our-mission"
      className="relative scroll-mt-20 overflow-x-clip bg-[#ffffff] px-4 pb-28 pt-16 sm:pb-32 sm:pt-20 lg:pb-40 lg:pt-24"
      aria-labelledby="our-mission-heading"
    >
      <LandingSectionWave variant="top" colorClassName="text-white" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:items-end lg:gap-x-12 lg:gap-y-8 xl:gap-x-16">
          <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none lg:shrink-0">
            <div className="relative aspect-[1024/717] w-full overflow-hidden rounded-2xl bg-[#ffffff] border-0 ring-0">
              <Image
                src="/images/our-mission-kids.png"
                alt="Banner of four diverse children with playful icons: a robot, code brackets, rocket, light bulb, sun, and moon."
                fill
                className="border-0 object-cover object-center shadow-none outline-none ring-0"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
          <div className="text-center lg:max-w-xl lg:justify-self-start lg:text-left">
            <h2
              id="our-mission-heading"
              className="font-section text-3xl font-extrabold leading-tight tracking-tight text-[#111827] sm:text-4xl"
            >
              Our Mission
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#4b5563] sm:mt-5 sm:text-lg">
              We believe every young creator deserves a joyful place to learn real skills: logic,
              persistence, and imagination, without the pressure of perfect typing or adult-sized tools.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[#4b5563] sm:mt-5 sm:text-lg">
              Ollie Code meets kids where they are: playful lessons, a friendly canvas, and room to
              experiment so families and educators can cheer on progress, not manage frustration.
            </p>
          </div>
        </div>
      </div>
      <LandingSectionWave variant="bottom" colorClassName="text-[#3a6288]" />
    </section>
  );
}
