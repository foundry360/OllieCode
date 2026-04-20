import { LandingSectionWave } from "@/components/landing/sectionWaves";

export function WhyOllieCode() {
  return (
    <section
      id="why-ollie-code"
      className="relative z-10 scroll-mt-20 overflow-x-clip bg-white px-4 pb-24 pt-20 sm:pb-28 sm:pt-24 lg:pb-36 lg:pt-28"
      aria-labelledby="why-ollie-code-heading"
    >
      <LandingSectionWave variant="top" colorClassName="text-[#d2e0ce]" />
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h2
          id="why-ollie-code-heading"
          className="font-section text-3xl font-extrabold leading-tight text-[#111827] sm:text-4xl"
        >
          Why Ollie Code
        </h2>
        <p className="mt-5 text-base leading-relaxed text-[#4b5563] sm:text-lg">
          Ollie Code is built for curious kids who learn by doing — friendly lessons, a colorful block
          workspace, and room to experiment without fear of breaking anything. We keep goals clear,
          celebrate small wins, and grow with your learner as they get braver with logic and creativity.
        </p>
      </div>
      <LandingSectionWave variant="bottom" colorClassName="text-[#0a1628]" className="!z-20" />
    </section>
  );
}
