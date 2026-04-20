import { FeatureCardsAnimated } from "@/components/landing/FeatureCardsAnimated";

const ITEMS = [
  {
    title: "Learn to Code",
    body: "Snap blocks together like puzzle pieces. No typing stress — just ideas and logic.",
    icon: "/images/code_blocks.png",
    iconWidth: 260,
    iconHeight: 268,
  },
  {
    title: "Build Games",
    body: "Make characters move, add sounds, and see your game on the canvas in seconds.",
    icon: "/images/games.png",
    iconWidth: 267,
    iconHeight: 272,
  },
  {
    title: "Create Fun Projects",
    body: "Explore fun adventures and projects designed for curious young creators.",
    icon: "/images/fun-projects.png",
    iconWidth: 256,
    iconHeight: 262,
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="relative scroll-mt-20 overflow-x-clip bg-white px-4 pb-12 pt-8 sm:pb-16 sm:pt-10 lg:pb-20 lg:pt-14"
    >
      <div className="relative z-10 mx-auto max-w-6xl pb-2 sm:pb-3 lg:pb-4">
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
