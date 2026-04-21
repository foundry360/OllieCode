import Link from "next/link";

/** Heading, subheading, and auth links — used in `PreFooterCtaSection` above the footer. */
export function PreFooterCtaContent({ className = "" }: { className?: string }) {
  return (
    <div
      id="get-started"
      className={["mx-auto max-w-3xl text-center", className].filter(Boolean).join(" ")}
      aria-labelledby="pre-footer-cta-heading"
    >
      <h2
        id="pre-footer-cta-heading"
        className="font-section text-balance text-3xl font-extrabold leading-tight tracking-tight text-[#111827] sm:text-4xl"
      >
        Ready to Get Started?
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-pretty text-base font-medium leading-relaxed text-[#6b7280] sm:mt-5 sm:text-lg">
        Be part of a community of young creators building, coding, and exploring.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:mt-12">
        <Link
          href="/auth/signup"
          className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full bg-[var(--ollie-primary)] px-8 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#6fa020]"
        >
          Create an account
        </Link>
        <Link
          href="/auth/login"
          className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full border-2 border-[#84c126] bg-white/90 px-8 py-3 text-base font-bold text-[#374151] transition-colors hover:bg-white"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
