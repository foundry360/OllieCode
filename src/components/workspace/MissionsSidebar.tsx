"use client";

/**
 * Step-by-step missions — replace copy with curriculum data or CMS later.
 * Optional: use Interact.js to make mission cards draggable for reordering (see Interact.js docs).
 */
const STEPS = [
  {
    n: 1,
    title: "Events & Motion",
    detail:
      "Under Events, snap When Run clicked, then try Motion blocks (move, turn, glide) like Scratch’s Getting Started.",
  },
  {
    n: 2,
    title: "Looks & Sound",
    detail: "Use say or think bubbles, switch costume, and play sounds from the Sound category.",
  },
  {
    n: 3,
    title: "Control",
    detail: "Use wait and repeat loops to choreograph your animation on the stage.",
  },
];

export function MissionsSidebar() {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div>
        <h2 className="font-display text-lg font-bold text-[#111827]">Missions</h2>
        <p className="mt-1 text-sm text-[#6b7280]">
          Follow these steps — your teacher can add more later.
        </p>
      </div>
      <ol className="flex flex-col gap-3">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm"
          >
            <span className="font-bold text-[#84c126]">Step {s.n}</span>
            <p className="mt-1 font-semibold text-[#111827]">{s.title}</p>
            <p className="mt-1 text-[#6b7280]">{s.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
