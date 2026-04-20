import { FeatureCardsAnimated } from "@/components/landing/FeatureCardsAnimated";

const ITEMS = [
  {
    title: "Learn to Code",
    body: "Snap blocks together like puzzle pieces. No typing stress — just ideas and logic.",
    icon: "/placeholders/icon-code.svg",
  },
  {
    title: "Build Games",
    body: "Make characters move, add sounds, and see your game on the canvas in seconds.",
    icon: "/placeholders/icon-game.svg",
  },
  {
    title: "Create Fun Projects",
    body: "Explore fun adventures and projects designed for curious young creators.",
    icon: "/placeholders/icon-ai.svg",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="relative scroll-mt-20 overflow-x-clip bg-white px-4 pb-12 pt-16 sm:pb-16 sm:pt-20 lg:pb-20 lg:pt-24"
    >
      <div className="relative mx-auto max-w-6xl pb-6 sm:pb-8 lg:pb-10">
        <h2 className="font-section text-center text-3xl font-extrabold leading-tight text-[#111827] sm:text-4xl">
          Learn to Code, Build Games, Create Fun Projects
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-[#4b5563] sm:text-lg">
          Three big ways to grow — all in one colorful workspace.
        </p>
        <FeatureCardsAnimated items={ITEMS} />
      </div>
    </section>
  );
}
