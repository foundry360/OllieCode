import Image from "next/image";
import Link from "next/link";
import { LandingSectionWave } from "@/components/landing/sectionWaves";

type HeroHighlight = {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
};

const HERO_HIGHLIGHTS: HeroHighlight[] = [
  {
    imageSrc: "/images/hero-card-icon-no-syntax.png",
    imageAlt: "Friendly blue robot icon representing coding without syntax barriers",
    title: "Drag-And-Drop Blocks",
    description: "Snap together real code ideas without typing syntax first.",
  },
  {
    imageSrc: "/images/hero-card-icon-visual-logic.png",
    imageAlt: "Friendly teal robot icon representing visual logic on the canvas",
    title: "See It On The Canvas",
    description: "Run your program and watch sprites and motion come alive.",
  },
  {
    imageSrc: "/images/hero-card-icon-safe-experiment.png",
    imageAlt: "Friendly orange robot icon representing safe experimentation",
    title: "Adventures That Teach",
    description: "Step through lessons built for kids, clear goals and quick wins.",
  },
  {
    imageSrc: "/images/hero-card-icon-confidence.png",
    imageAlt: "Friendly purple robot icon with stars representing confidence",
    title: "Learn With Friends",
    description: "Share projects, celebrate progress, and grow skills.",
  },
];

function HeroHighlightMedia({ highlight }: { highlight: HeroHighlight }) {
  return (
    <Image
      src={highlight.imageSrc}
      alt={highlight.imageAlt}
      width={88}
      height={88}
      sizes="44px"
      className="max-h-[68%] max-w-[68%] object-contain object-center"
    />
  );
}

export function Hero() {
  return (
    <section
      className="relative isolate box-border min-h-0 w-full min-w-0 max-w-full overflow-x-clip bg-[linear-gradient(180deg,#111727_0%,#172a40_22%,#1a3350_48%,#1c3959_72%,#1f3d58_100%)] px-4 pb-24 pt-8 max-sm:min-h-[min(92dvh,52rem)] sm:pb-28 sm:pt-14 lg:pb-32 lg:pt-16"
    >
      <LandingSectionWave variant="bottom" colorClassName="text-white" />
      <div className="relative z-10 mx-auto min-w-0 max-w-6xl">
        <div className="mx-auto min-w-0 max-w-5xl text-center">
          <h1 className="font-section text-balance text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
            Start Your{" "}
            <span className="italic text-[var(--ollie-primary)]">Coding</span> Adventure
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg font-medium leading-relaxed text-white/90 sm:mt-5 sm:text-xl">
            Create games, explore projects, and learn step-by-step through play
          </p>
        </div>

        <ul className="mx-auto mt-12 grid w-full max-w-6xl list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {HERO_HIGHLIGHTS.map((item) => {
            const { title, description } = item;
            return (
            <li
              key={title}
              className="relative rounded-2xl border-2 border-white/12 bg-[#1a3750] p-5 text-left shadow-sm transition-colors duration-200 ease-out hover:border-[#c8dcc8] hover:bg-[#152d42]"
            >
              <span className="absolute left-5 top-5 flex size-10 items-center justify-center overflow-hidden rounded-xl bg-white/20 text-white sm:size-11">
                <HeroHighlightMedia highlight={item} />
              </span>
              <h3 className="mt-14 font-section text-base font-bold leading-snug text-white sm:mt-16">
                {title}
              </h3>
              <p className="mt-2 font-section text-sm leading-relaxed text-white/90">{description}</p>
            </li>
            );
          })}
        </ul>

        <div className="mx-auto mt-10 flex flex-wrap justify-center gap-4 sm:mt-12">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-full bg-[#111727] px-8 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#243352] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
          >
            Get Started Today!
          </Link>
        </div>
      </div>
    </section>
  );
}
