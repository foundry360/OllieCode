import { LandingSectionWave } from "@/components/landing/sectionWaves";
import Image from "next/image";
import Link from "next/link";

const BLOCK_CODING_COLUMNS: {
  imageSrc: string;
  imageAlt: string;
  title: string;
  subtext: string;
}[] = [
  {
    imageSrc: "/images/block-benefit-no-syntax.png",
    imageAlt: "Friendly robot holding snap-together coding blocks",
    title: "No Syntax Barriers",
    subtext:
      "Block coding removes typing and spelling errors, so kids focus on thinking like a programmer instead of memorizing code rules.",
  },
  {
    imageSrc: "/images/block-benefit-visual-logic.png",
    imageAlt: "Friendly robot holding a stack of colorful logic blocks",
    title: "Visual Logic Building",
    subtext:
      "Kids connect blocks like puzzle pieces, which helps them clearly see how sequences, loops, and conditions work together.",
  },
  {
    imageSrc: "/images/block-benefit-safe-experiment.png",
    imageAlt: "Friendly robot with a shield, representing safe experimentation",
    title: "Safe Way To Experiment",
    subtext:
      "It encourages trial and error without breaking code, so kids can explore ideas freely and learn from instant feedback.",
  },
  {
    imageSrc: "/images/block-benefit-confidence.png",
    imageAlt: "Friendly robot with a trophy and stars, representing confidence",
    title: "Builds Confidence",
    subtext:
      "Kids see results fast, helping them stay motivated and build confidence as they create and improve their projects.",
  },
];

export function WhyBlockCoding() {
  return (
    <section
      id="why-block-coding"
      className="relative z-10 scroll-mt-20 overflow-x-clip bg-[#d2e0ce] px-4 pb-16 pt-28 sm:pb-20 sm:pt-32 lg:pb-24 lg:pt-36"
      aria-labelledby="why-block-coding-heading"
    >
      <LandingSectionWave variant="top" colorClassName="text-white" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="text-center">
          <h2
            id="why-block-coding-heading"
            className="font-section text-balance text-3xl font-extrabold leading-tight text-[#111827] sm:text-4xl"
          >
            Discover The Benefits Of Block Coding
          </h2>
          <p className="mx-auto mt-5 max-w-6xl text-pretty text-base leading-relaxed text-[#4b5563] sm:text-lg">
            Blocks turn big ideas into small steps kids can see and rearrange. They practice logic and
            sequencing first, then level up when they&apos;re ready for more. Every run on the canvas is
            instant feedback, celebrate what works, tweak what doesn&apos;t, and try again.
          </p>
        </header>

        <ul className="mx-auto mt-12 grid list-none grid-cols-1 gap-10 p-0 sm:mt-14 sm:grid-cols-2 sm:gap-8 lg:mt-16 lg:grid-cols-4 lg:gap-8 xl:gap-10">
          {BLOCK_CODING_COLUMNS.map((col) => (
            <li key={col.title} className="flex flex-col items-center text-center">
              <div className="relative flex h-36 w-36 shrink-0 items-center justify-center sm:h-40 sm:w-40">
                <Image
                  src={col.imageSrc}
                  alt={col.imageAlt}
                  width={200}
                  height={200}
                  className="max-h-full max-w-full object-contain"
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 22vw"
                />
              </div>
              <h3 className="mt-6 w-full whitespace-nowrap text-center font-section text-xs font-extrabold leading-none tracking-tight text-[#111827] sm:text-sm lg:text-[11px] xl:text-sm 2xl:text-base">
                {col.title}
              </h3>
              <p className="mt-2 w-full max-w-xl text-sm leading-relaxed text-[#4b5563] sm:max-w-2xl sm:text-base md:max-w-none">
                {col.subtext}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex justify-center sm:mt-14">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-full bg-[var(--ollie-primary)] px-8 py-3.5 text-base font-bold text-white shadow-md transition-colors hover:bg-[#6fa020]"
          >
            Start Coding
          </Link>
        </div>
      </div>
    </section>
  );
}
