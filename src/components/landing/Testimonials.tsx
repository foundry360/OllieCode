import Image from "next/image";

const PLACEHOLDERS = [
  { quote: "I made my turtle dance!", name: "Alex, 9", img: "/placeholders/avatar-1.svg" },
  { quote: "The blocks are easy — I built a whole maze.", name: "Sam, 11", img: "/placeholders/avatar-2.svg" },
  { quote: "I like when I press Run and it actually moves.", name: "Jordan, 8", img: "/placeholders/avatar-3.svg" },
];

export function Testimonials() {
  return (
    <section
      id="stories"
      className="scroll-mt-20 bg-[#111727] px-4 py-24 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="font-section text-center text-3xl font-extrabold text-white sm:text-4xl">
          What kids are saying
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-[#9ca3af]">
          Placeholder quotes — swap for real testimonials when you have them.
        </p>
        <ul className="mt-12 grid gap-8 sm:grid-cols-3">
          {PLACEHOLDERS.map((t) => (
            <li
              key={t.name}
              className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#1a1f2e] p-6 text-center shadow-sm"
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-[#84c126]">
                <Image src={t.img} alt="" fill className="object-cover" />
              </div>
              <blockquote className="mt-4 font-section text-lg font-medium text-white">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <cite className="mt-3 font-section not-italic text-sm font-semibold text-[#b8e063]">
                {t.name}
              </cite>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
