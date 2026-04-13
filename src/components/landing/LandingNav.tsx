import Image from "next/image";
import Link from "next/link";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#d9f99d] bg-[#ecfccb]/90 backdrop-blur">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="block shrink-0"
          aria-label="Ollie Code home"
        >
          <Image
            src="/images/logo.png"
            alt=""
            width={434}
            height={91}
            className="h-8 w-auto sm:h-9"
            priority
          />
        </Link>
        <nav
          className="flex flex-wrap items-center justify-end gap-3 text-sm font-semibold sm:gap-6"
          aria-label="Primary"
        >
          <a href="#features" className="hidden text-[#374151] hover:text-[#84c126] sm:inline">
            What we do
          </a>
          <a href="#stories" className="hidden text-[#374151] hover:text-[#84c126] md:inline">
            Fun stuff
          </a>
          <Link
            href="/auth/login"
            className="rounded-full bg-[#84c126] px-5 py-2.5 text-white shadow-sm transition hover:bg-[#6fa020]"
          >
            Start Coding
          </Link>
        </nav>
      </div>
    </header>
  );
}
