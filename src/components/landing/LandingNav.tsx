import Image from "next/image";
import Link from "next/link";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e5e7eb] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            className="block shrink-0"
            aria-label="David Code home"
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
          <span className="hidden rounded-full bg-[#ecfccb] px-3 py-1 text-xs font-semibold text-[#3f6212] sm:inline">
            Learn &amp; play
          </span>
        </div>
        <nav className="flex items-center gap-3 text-sm font-semibold sm:gap-6">
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
