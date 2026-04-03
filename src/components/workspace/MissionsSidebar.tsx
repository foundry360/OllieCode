"use client";

/**
 * Step-by-step missions — replace copy with curriculum data or CMS later.
 * Optional: use Interact.js to make mission cards draggable for reordering (see Interact.js docs).
 */
const STEPS = [
  { n: 1, title: "Meet the turtle", detail: "Stack move and turn blocks under When Run." },
  { n: 2, title: "Add a sound", detail: "Try the play sound block after a move." },
  { n: 3, title: "Loops", detail: "Wrap repeats around a pattern to draw a square." },
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
