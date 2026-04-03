import Image from "next/image";

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
    title: "Create AI Projects",
    body: "Explore AI-themed missions and projects designed for curious young creators.",
    icon: "/placeholders/icon-ai.svg",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 bg-white px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-center text-3xl font-extrabold text-[#111827] sm:text-4xl">
          Learn to Code, Build Games, Create AI Projects
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-[#6b7280]">
          Three big ways to grow — all in one colorful workspace.
        </p>
        <ul className="mt-12 grid gap-8 sm:grid-cols-3">
          {ITEMS.map((item) => (
            <li
              key={item.title}
              className="flex flex-col rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-6 text-center shadow-sm transition hover:border-[#84c126]/40"
            >
              <div className="relative mx-auto mb-4 h-20 w-20">
                <Image src={item.icon} alt="" width={80} height={80} />
              </div>
              <h3 className="font-display text-xl font-bold text-[#111827]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6b7280]">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
