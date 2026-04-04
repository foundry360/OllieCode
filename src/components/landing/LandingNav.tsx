import Link from "next/link";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e5e7eb] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-2xl font-bold text-[#111827]">
          Ollie Code
        </Link>
        <nav className="flex items-center gap-3 text-sm font-semibold sm:gap-6">
          <a href="#features" className="hidden text-[#374151] hover:text-[#84c126] sm:inline">
            What we do
          </a>
          <a href="#stories" className="hidden text-[#374151] hover:text-[#84c126] md:inline">
            Fun stuff
          </a>
          <Link
            href="/auth/signup"
            className="rounded-full bg-[#84c126] px-5 py-2.5 text-white shadow-sm transition hover:bg-[#6fa020]"
          >
            Start Coding
          </Link>
        </nav>
      </div>
    </header>
  );
}
