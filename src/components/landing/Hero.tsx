import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#ecfccb] to-[#f8fafc] px-4 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-8">
        <div>
          <p className="mb-3 inline-block rounded-full bg-white/80 px-4 py-1 text-sm font-bold text-[#3f6212] shadow-sm">
            For kids 7–13
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-[#111827] sm:text-5xl lg:text-[3.25rem]">
            Code games, build robots, and make friends — one block at a time.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[#4b5563]">
            Ollie Code is a friendly place to learn programming. Drag blocks, run your
            code, and watch your ideas come alive on the canvas.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-full bg-[#84c126] px-8 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-[#6fa020]"
            >
              Start coding
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-full border-2 border-[#111827]/20 bg-white px-6 py-3.5 text-base font-bold text-[#111827] transition hover:border-[#84c126]"
            >
              See what you can do
            </a>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#fde047]/80 blur-2xl" aria-hidden />
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border-4 border-white shadow-xl">
            <Image
              src="/placeholders/hero-kids.svg"
              alt="Kids learning to code together"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
