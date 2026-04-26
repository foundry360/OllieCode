import { FeatureCardsAnimated } from "@/components/landing/FeatureCardsAnimated";

const ITEMS = [
  {
    title: "Learn to Code",
    body: "Snap blocks together like puzzle pieces. No typing stress — just ideas and logic.",
    icon: "/images/features-learn-code.png",
    iconWidth: 256,
    iconHeight: 256,
    iconImageClassName: "translate-y-2 sm:translate-y-2.5",
  },
  {
    title: "Build Games",
    body: "Make characters move, add sounds, and see your game on the canvas in seconds.",
    icon: "/images/features-build-games-v2.png",
    iconWidth: 256,
    iconHeight: 256,
    /** Artwork goes edge-to-edge in the 256px file; scale so on-screen size matches the other cards. */
    iconImageClassName: "origin-center scale-[0.78]",
  },
  {
    title: "Create Fun Projects",
    body: "Explore fun adventures and projects designed for curious young creators.",
    icon: "/images/features-create-projects.png",
    iconWidth: 256,
    iconHeight: 256,
    iconImageClassName: "translate-y-1.5 sm:translate-y-2",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="relative scroll-mt-20 overflow-x-clip bg-white px-4 pb-12 pt-8 sm:pb-16 sm:pt-10 lg:pb-20 lg:pt-14"
    >
      <div className="relative z-10 mx-auto max-w-6xl pb-2 sm:pb-3 lg:pb-4">
        <p className="mx-auto mb-3 max-w-4xl text-center font-section text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ollie-primary)] sm:mb-4 sm:text-base">
          The Workspace
        </p>
        <h2 className="font-section text-center text-3xl font-extrabold leading-tight text-[#111827] sm:text-4xl">
          Turning Ideas Into Games and Creations
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-[#4b5563] sm:text-lg">
          A fun, all-in-one space to learn, build, and explore.
        </p>
        <FeatureCardsAnimated items={ITEMS} />
      </div>
    </section>
  );
}
