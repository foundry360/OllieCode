import Image from "next/image";
import Link from "next/link";

type LandingNavProps = {
  /** Home (`/`) header; other routes use `default` (lime bar). */
  appearance?: "default" | "mint";
};

export function LandingNav({ appearance = "default" }: LandingNavProps) {
  const isMint = appearance === "mint";
  const headerClass = isMint
    ? "sticky top-0 z-40 relative w-full max-w-full overflow-x-clip bg-[#111727]"
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
            src={isMint ? "/images/logo_blue.png" : "/images/logo.png"}
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
          <Link
            href="/#features"
            className={`hidden sm:inline ${isMint ? "text-white/90 hover:text-[#c5e08a]" : "text-[#374151] hover:text-[#84c126]"}`}
          >
            What we do
          </Link>
          <Link
            href="/#stories"
            className={`hidden md:inline ${isMint ? "text-white/90 hover:text-[#c5e08a]" : "text-[#374151] hover:text-[#84c126]"}`}
          >
            Fun stuff
          </Link>
          <Link
            href="/plans"
            className={isMint ? "text-white/90 hover:text-[#c5e08a]" : "text-[#374151] hover:text-[#84c126]"}
          >
            Plans
          </Link>
          <Link
            href="/auth/signup"
            className={isMint ? "text-white/90 hover:text-[#c5e08a]" : "text-[#374151] hover:text-[#84c126]"}
          >
            Sign Up
          </Link>
          <Link
            href="/auth/login?next=%2Fworkspace"
            className="rounded-full bg-[#84c126] px-5 py-2.5 text-white shadow-sm transition hover:bg-[#6fa020]"
          >
            Log In
          </Link>
        </nav>
      </div>
    </header>
  );
}
