import Image from "next/image";
import Link from "next/link";
import { BookOpen, LayoutGrid, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const HERO_HIGHLIGHTS: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: LayoutGrid,
    title: "Drag-and-drop blocks",
    description: "Snap together real code ideas without typing syntax first.",
  },
  {
    icon: Sparkles,
    title: "See it on the canvas",
    description: "Run your program and watch sprites and motion come alive.",
  },
  {
    icon: BookOpen,
    title: "Adventures that teach",
    description: "Step through lessons built for kids — clear goals and quick wins.",
  },
  {
    icon: Users,
    title: "Learn with friends",
    description: "Share projects, celebrate progress, and grow skills.",
  },
];

export function Hero() {
  return (
    <section className="relative isolate box-border min-h-0 w-full min-w-0 max-w-full overflow-x-clip bg-[#111727] px-4 pb-24 pt-14 max-sm:min-h-[min(92dvh,52rem)] sm:pb-32 sm:pt-24 lg:pb-36 lg:pt-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="/images/blue_bg.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div className="relative z-10 mx-auto min-w-0 max-w-6xl">
        <div className="mx-auto min-w-0 max-w-5xl text-center">
          <h1 className="font-section text-balance text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
            Code games, build robots, and make friends — one block at a time.
          </h1>
          <p className="mt-5 text-lg text-white/90">
            Ollie Code is a friendly place to learn programming. Drag blocks, run your
            code, and watch your ideas come alive on the canvas.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-full bg-[var(--ollie-primary)] px-8 py-3.5 text-base font-bold text-white shadow-md transition-colors hover:bg-[#6fa020]"
            >
              Start Coding
            </Link>
          </div>
        </div>

        <ul className="mx-auto mt-12 grid w-full max-w-6xl list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {HERO_HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="relative rounded-2xl border-2 border-white/15 bg-[#132746] p-5 text-left shadow-sm transition-colors duration-200 ease-out hover:border-[var(--ollie-primary)] hover:bg-[#0a1528]"
            >
              <span className="absolute left-5 top-5 flex size-10 items-center justify-center rounded-full bg-white/20 text-white sm:size-11">
                <Icon className="size-5 shrink-0" aria-hidden />
              </span>
              <h3 className="mt-14 font-section text-base font-bold leading-snug text-white sm:mt-16">
                {title}
              </h3>
              <p className="mt-2 font-section text-sm leading-relaxed text-white/90">{description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
