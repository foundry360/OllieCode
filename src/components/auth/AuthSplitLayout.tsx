import Image from "next/image";

type AuthSplitLayoutProps = {
  children: React.ReactNode;
  /** Path under `/public` — full-page backdrop behind the card (e.g. login). */
  pageBackgroundSrc?: string;
  /** When false, only the form card is shown (no side illustration). */
  showIllustration?: boolean;
  /** Path under `/public` */
  imageSrc?: string;
  imageAlt?: string;
};

/**
 * Sign-in / sign-up: form, optionally with illustration in a second column.
 * Height follows the form (no inner scrollbars); the whole page scrolls if needed.
 */
export function AuthSplitLayout({
  children,
  pageBackgroundSrc,
  showIllustration = true,
  imageSrc = "/images/sprites/bot.svg",
  imageAlt = "David robot character",
}: AuthSplitLayoutProps) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      {pageBackgroundSrc ? (
        <div className="pointer-events-none absolute inset-0 z-0 bg-[#f8fafc]">
          {/*
            Plain <img> so replacing public/.../landing_bg.png shows up after refresh.
            next/image optimization caches by URL and often keeps stale pixels after file edits.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pageBackgroundSrc}
            alt=""
            className="absolute inset-0 z-0 h-full w-full object-cover object-center"
            draggable={false}
          />
        </div>
      ) : (
        <>
          {/* Kid-friendly + brand greens: soft outdoor / “code grass” base */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ecfccb] via-[#f4faf0] to-[#e8f0fc]"
            aria-hidden
          />
          {/* Primary green glow — David Code brand */}
          <div
            className="pointer-events-none absolute -left-1/4 top-0 h-[min(70vh,520px)] w-[min(90vw,600px)] rounded-full bg-[#84c126]/[0.14] blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-[#84c126]/10 blur-3xl sm:h-96 sm:w-96"
            aria-hidden
          />
          {/* Sunny accent — matches landing hero */}
          <div
            className="pointer-events-none absolute -right-10 -top-8 h-48 w-48 rounded-full bg-[#fde047]/30 blur-2xl sm:h-64 sm:w-64"
            aria-hidden
          />
          {/* Light “circuit / building blocks” grid — subtle robot & coding vibe */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(132,193,38,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(132,193,38,0.12)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,black,transparent)]"
            aria-hidden
          />
        </>
      )}

      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <div
          className={[
            "w-full overflow-hidden rounded-3xl bg-white shadow-2xl",
            pageBackgroundSrc
              ? "border-4 border-[#dfe22d]"
              : "ring-1 ring-[#84c126]/10",
            showIllustration
              ? "grid max-w-6xl grid-cols-1 lg:grid-cols-2 lg:items-stretch"
              : "max-w-lg",
          ].join(" ")}
        >
          <div
            className={[
              "flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10",
              showIllustration ? "lg:px-12 lg:py-10 xl:px-14" : "",
            ].join(" ")}
          >
            <div className="w-full min-w-0">{children}</div>
          </div>

          {showIllustration ? (
            <div className="relative flex min-h-[200px] w-full items-center justify-center bg-gradient-to-br from-[#ecfccb]/40 via-[#f8fafc] to-white px-6 py-8 sm:min-h-[220px] lg:h-full lg:min-h-[280px] lg:px-10 lg:py-12">
              <div className="relative aspect-square w-full max-w-[160px] sm:max-w-[180px] lg:max-w-[200px]">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  className="object-contain object-center"
                  priority
                  sizes="(max-width: 1024px) 200px, 220px"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
