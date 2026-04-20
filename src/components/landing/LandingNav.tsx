import Image from "next/image";
import Link from "next/link";

type LandingNavProps = {
  /** White header for marketing home (`/`) only; other routes use `default` (lime bar). */
  appearance?: "default" | "mint";
};

export function LandingNav({ appearance = "default" }: LandingNavProps) {
  const isMint = appearance === "mint";
  const headerClass = isMint
    ? "sticky top-0 z-40 relative w-full max-w-full overflow-x-clip bg-white/95 backdrop-blur-sm"
    : "sticky top-0 z-40 w-full max-w-full overflow-x-clip bg-[#ecfccb]/90 backdrop-blur";

  return (
    <header className={headerClass}>
      <div
        className={`flex min-w-0 w-full max-w-full items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10${isMint ? " relative z-10" : ""}`}
      >
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
          className="flex min-w-0 shrink flex-wrap items-center justify-end gap-3 text-sm font-semibold sm:gap-6"
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
