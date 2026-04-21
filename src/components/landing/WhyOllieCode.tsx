import { LandingSectionWave } from "@/components/landing/sectionWaves";
import Image from "next/image";

/** Shared frame for every benefit image so rows align visually (photos use cover, graphics use contain). */
const BENEFIT_IMAGE_ASPECT_CLASS = "aspect-[1024/685]";

/** Organic blob shapes (fixed per row so layout stays stable). */
const IMAGE_BLOBS: {
  solid: { borderRadius: string; className: string };
  glow: { borderRadius: string; className: string };
}[] = [
  {
    solid: {
      borderRadius: "63% 37% 54% 46% / 55% 48% 52% 45%",
      className:
        "pointer-events-none absolute left-[50%] top-[57%] z-[1] h-[86%] w-[calc(100%+7rem)] -translate-x-1/2 -translate-y-1/2 -rotate-[13deg] bg-gradient-to-br from-[#c5dcc0]/34 via-[#dde8d8]/28 to-[#c8d4ef]/32 sm:left-[51%] sm:h-[92%] sm:w-[calc(100%+10rem)]",
    },
    glow: {
      borderRadius: "72% 28% 48% 52% / 52% 44% 56% 48%",
      className:
        "pointer-events-none absolute left-[52%] top-[53%] z-[1] h-[100%] w-[calc(100%+9rem)] -translate-x-1/2 -translate-y-1/2 rotate-[7deg] bg-gradient-to-tr from-[#b8cfae]/28 via-[#d4e3d0]/20 to-[#b8c5e8]/26 blur-xl sm:left-[54%] sm:top-[51%] sm:h-[106%] sm:w-[calc(100%+12rem)] sm:blur-2xl",
    },
  },
  {
    solid: {
      borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
      className:
        "pointer-events-none absolute left-[49%] top-[55%] z-[1] h-[92%] w-[calc(100%+8rem)] -translate-x-1/2 -translate-y-1/2 rotate-[2deg] bg-gradient-to-r from-[#c0d8ba]/32 via-[#e0ebe0]/26 to-[#cad6f2]/30 sm:left-1/2 sm:top-[53%] sm:h-[98%] sm:w-[calc(100%+11rem)]",
    },
    glow: {
      borderRadius: "75% 25% 69% 31% / 29% 63% 37% 71%",
      className:
        "pointer-events-none absolute left-[48%] top-[59%] z-[1] h-[108%] w-[calc(100%+10rem)] -translate-x-1/2 -translate-y-1/2 -rotate-[19deg] bg-gradient-to-bl from-[#b5cca8]/26 via-[#dce6d8]/18 to-[#b6c4ea]/24 blur-xl sm:left-[46%] sm:top-[57%] sm:h-[114%] sm:w-[calc(100%+13rem)] sm:blur-2xl",
    },
  },
  {
    solid: {
      borderRadius: "42% 58% 55% 45% / 52% 48% 38% 62%",
      className:
        "pointer-events-none absolute left-[52%] top-[55%] z-[1] h-[88%] w-[calc(100%+7.5rem)] -translate-x-1/2 -translate-y-1/2 rotate-[16deg] bg-gradient-to-l from-[#c8dcc2]/33 via-[#dde8d8]/27 to-[#c5d0ef]/31 sm:left-[50%] sm:top-[54%] sm:h-[94%] sm:w-[calc(100%+10rem)]",
    },
    glow: {
      borderRadius: "50% 50% 33% 67% / 45% 35% 65% 55%",
      className:
        "pointer-events-none absolute left-[51%] top-[51%] z-[1] h-[102%] w-[calc(100%+9rem)] -translate-x-1/2 -translate-y-1/2 -rotate-[11deg] bg-gradient-to-r from-[#aac99e]/26 via-[#d8e6d4]/20 to-[#aebfe8]/24 blur-xl sm:left-[49%] sm:top-[49%] sm:h-[110%] sm:w-[calc(100%+12rem)]",
    },
  },
  {
    solid: {
      borderRadius: "68% 32% 40% 60% / 44% 56% 70% 30%",
      className:
        "pointer-events-none absolute left-[49%] top-[56%] z-[1] h-[90%] w-[calc(100%+7rem)] -translate-x-1/2 -translate-y-1/2 -rotate-[6deg] bg-gradient-to-tr from-[#c3d9bd]/35 via-[#e2ebe3]/28 to-[#ccd8f0]/30 sm:left-[47%] sm:top-[58%] sm:h-[96%] sm:w-[calc(100%+10.5rem)]",
    },
    glow: {
      borderRadius: "40% 60% 70% 30% / 55% 45% 55% 45%",
      className:
        "pointer-events-none absolute left-[53%] top-[54%] z-[1] h-[104%] w-[calc(100%+9.5rem)] -translate-x-1/2 -translate-y-1/2 rotate-[22deg] bg-gradient-to-br from-[#b8cfae]/26 via-[#d2e0ce]/18 to-[#b0c2e6]/24 blur-2xl sm:left-[55%] sm:top-[56%] sm:h-[110%] sm:w-[calc(100%+13rem)]",
    },
  },
  {
    solid: {
      borderRadius: "55% 45% 62% 38% / 48% 52% 44% 56%",
      className:
        "pointer-events-none absolute left-[51%] top-[60%] z-[1] h-[84%] w-[calc(100%+6.5rem)] -translate-x-1/2 -translate-y-1/2 rotate-[9deg] bg-gradient-to-bl from-[#c6dcc0]/33 via-[#e4ebe4]/27 to-[#c9d4f1]/30 sm:left-[49%] sm:top-[58%] sm:h-[90%] sm:w-[calc(100%+9.5rem)]",
    },
    glow: {
      borderRadius: "38% 62% 48% 52% / 62% 38% 52% 48%",
      className:
        "pointer-events-none absolute left-[47%] top-[52%] z-[1] h-[100%] w-[calc(100%+9rem)] -translate-x-1/2 -translate-y-1/2 -rotate-[23deg] bg-gradient-to-tl from-[#b0c9a4]/26 via-[#dae6d6]/18 to-[#b9c7ed]/24 blur-2xl sm:left-[45%] sm:top-[54%] sm:h-[106%] sm:w-[calc(100%+12rem)]",
    },
  },
  {
    solid: {
      borderRadius: "48% 52% 64% 36% / 36% 64% 42% 58%",
      className:
        "pointer-events-none absolute left-[51%] top-[56%] z-[1] h-[94%] w-[calc(100%+8rem)] -translate-x-1/2 -translate-y-1/2 -rotate-[3deg] bg-gradient-to-r from-[#bfd4b8]/34 via-[#dfe9df]/27 to-[#c6d2ee]/31 sm:left-[53%] sm:top-[54%] sm:h-[100%] sm:w-[calc(100%+11rem)]",
    },
    glow: {
      borderRadius: "64% 36% 38% 62% / 42% 58% 64% 36%",
      className:
        "pointer-events-none absolute left-[49%] top-[52%] z-[1] h-[110%] w-[calc(100%+10rem)] -translate-x-1/2 -translate-y-1/2 rotate-[4deg] bg-gradient-to-br from-[#b6cdaa]/26 via-[#d6e4d2]/18 to-[#a8b8e0]/24 blur-2xl sm:left-1/2 sm:top-[50%] sm:h-[116%] sm:w-[calc(100%+13rem)]",
    },
  },
];

const BENEFITS: {
  title: string;
  body: string;
  imageSrc: string;
  imageAlt: string;
  /** When false, skip CSS blobs; use object-contain for full graphics. */
  showBlobs?: boolean;
  /** Extra Tailwind classes on the image (e.g. scale); column width unchanged. */
  imageClassName?: string;
  /** Extra classes on the image column wrapper (e.g. margin when using scale). */
  imageColumnClassName?: string;
}[] = [
  {
    title: "Built for How Kids Learn Best",
    body: "Ollie Code turns coding into a visual, hands on experience. Instead of memorizing syntax, kids snap blocks together, experiment freely, and learn by doing, building confidence from the very first click.",
    imageSrc: "/images/kids-code-why-block.png",
    imageAlt:
      "Three children gathered around a laptop, smiling and collaborating in a classroom.",
    showBlobs: false,
  },
  {
    title: "More Than Coding: It’s Creative Thinking",
    body: "Kids don’t just follow instructions. They create. From games to animations, Ollie Code helps young learners explore ideas, solve problems, and bring their imagination to life.",
    imageSrc: "/images/more-than-coding-creative.png",
    imageAlt:
      "Girl in a thinking pose on a rounded photo over a soft mint organic shape.",
    showBlobs: false,
  },
  {
    title: "Instant Feedback, Real Results",
    body: "No waiting, no guessing. Every action shows up instantly on screen, helping kids understand cause and effect while staying engaged and motivated.",
    imageSrc: "/images/instant-feedback.png",
    imageAlt:
      "Woman and two children in white shirts cheering at a blue laptop in a bright room with bookshelves, in a rounded photo with a blue frame on a light blue shape.",
    showBlobs: false,
    imageClassName:
      "max-lg:scale-[1.1] max-lg:origin-bottom lg:scale-[1.42] lg:origin-right xl:scale-[1.36] will-change-transform",
  },
  {
    title: "Structured, But Never Boring",
    body: "Guided lessons provide just the right amount of direction, while open ended projects encourage exploration, so kids can learn at their own pace without feeling stuck or overwhelmed.",
    imageSrc: "/images/structured-never-boring.png",
    imageAlt:
      "Two children with headphones smiling at each other by a laptop, in a rounded photo with a red frame on a soft pink shape.",
    showBlobs: false,
  },
  {
    title: "One Platform, Endless Possibilities",
    body: "Everything lives in one simple, colorful workspace for coding, building, and creating, so kids stay focused on learning instead of navigating complicated tools.",
    imageSrc: "/images/one-platform.png",
    imageAlt:
      "Child in a pilot cap and cardboard wings with arms raised; their shadow on the wall is shaped like a rocket taking off, in a rounded photo on a soft purple shape.",
    showBlobs: false,
  },
  {
    title: "Designed for Curious Minds",
    body: "Ollie Code is tailored specifically for young creators, balancing fun and foundational skills to prepare them for the future, without ever feeling like school.",
    imageSrc: "/images/curious-minds.png",
    imageAlt:
      "Young child leaning in to tap a colorful learning app on a tablet, in a rounded photo on a soft purple shape.",
    showBlobs: false,
  },
];

export function WhyOllieCode() {
  return (
    <section
      id="why-ollie-code"
      className="relative z-10 scroll-mt-20 overflow-x-visible overflow-y-visible px-4 pb-8 pt-8 sm:pb-10 sm:pt-10 lg:pb-12 lg:pt-12"
      aria-labelledby="why-ollie-code-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-[#eef5ea] via-[#fafdfb] to-[#dce8d8]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden
        style={{
          backgroundImage: [
            "radial-gradient(ellipse 110% 70% at 50% -15%, rgb(200 220 190 / 0.55), transparent 58%)",
            "radial-gradient(ellipse 80% 55% at 100% 100%, rgb(180 205 215 / 0.22), transparent 52%)",
            "radial-gradient(ellipse 65% 50% at 0% 75%, rgb(210 228 198 / 0.35), transparent 48%)",
          ].join(","),
        }}
      />
      <LandingSectionWave variant="top" colorClassName="text-[#d2e0ce]" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="mx-auto w-full max-w-6xl pb-2 pt-10 text-center sm:pb-2 sm:pt-12 lg:pb-2.5 lg:pt-14">
          <h2
            id="why-ollie-code-heading"
            className="font-section text-balance text-3xl font-extrabold leading-tight text-[#111827] sm:text-4xl"
          >
            The Magic Behind Ollie Code!
          </h2>
          <p className="mx-auto mt-3 w-full max-w-6xl text-pretty text-base font-medium leading-snug text-[#374151] sm:mt-3 sm:text-lg sm:leading-relaxed">
            Ollie Code is a fun, interactive learning space where kids learn real coding skills by
            doing, not just reading or watching. Instead of typing long lines of code, they use simple
            drag-and-drop blocks to build games, solve challenges, and bring their ideas to life.
          </p>
        </header>

        <ul className="mx-auto flex w-full max-w-6xl list-none flex-col gap-0 px-0 pb-10 sm:pb-12 lg:pb-14">
          {BENEFITS.map(
            (
              {
                title,
                body,
                imageSrc,
                imageAlt,
                showBlobs = true,
                imageClassName = "",
                imageColumnClassName = "",
              },
              index,
            ) => {
            const reverseDesktop = index % 2 === 1;
            const blobs = IMAGE_BLOBS[index % IMAGE_BLOBS.length];
            return (
              <li
                key={title}
                className={[
                  "flex min-h-0 min-w-0 flex-col gap-0.5 overflow-visible lg:flex-row lg:items-center lg:gap-x-2 lg:gap-y-0 xl:gap-x-3",
                  reverseDesktop ? "max-lg:flex-col-reverse lg:flex-row-reverse" : "",
                ].join(" ")}
              >
                <div
                  className={[
                    "relative z-0 mx-auto w-full max-w-md shrink-0 sm:max-w-lg lg:mx-0 lg:max-w-sm xl:max-w-md",
                    showBlobs ? "isolate overflow-visible" : "overflow-visible bg-transparent",
                    imageColumnClassName,
                  ]
                    .join(" ")
                    .trim()}
                >
                  {showBlobs ? (
                    <>
                      <div
                        aria-hidden
                        style={{ borderRadius: blobs.solid.borderRadius }}
                        className={blobs.solid.className}
                      />
                      <div
                        aria-hidden
                        style={{ borderRadius: blobs.glow.borderRadius }}
                        className={blobs.glow.className}
                      />
                    </>
                  ) : null}
                  <div
                    className={[
                      "relative z-20 w-full",
                      BENEFIT_IMAGE_ASPECT_CLASS,
                      showBlobs
                        ? "rounded-2xl bg-gradient-to-br from-[#d2e0ce]/70 via-[#e8efe5]/80 to-[#d4dff0]/70 p-[3px] shadow-[0_2px_8px_rgba(15,23,42,0.06),0_18px_48px_-12px_rgba(15,23,42,0.16),0_40px_80px_-24px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.04]"
                        : "bg-transparent",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "relative h-full w-full",
                        showBlobs
                          ? "overflow-hidden rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_0_0_1px_rgba(15,23,42,0.04)]"
                          : "overflow-visible bg-transparent",
                      ].join(" ")}
                    >
                      <Image
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        className={[
                          showBlobs ? "object-cover" : "object-contain",
                          imageClassName,
                        ]
                          .join(" ")
                          .trim()}
                        sizes="(max-width: 1024px) 100vw, 28rem"
                      />
                    </div>
                  </div>
                </div>
                <div className="relative z-10 flex w-full min-w-0 flex-1 flex-col justify-center bg-transparent text-left lg:pl-0">
                  <h3 className="font-section text-2xl font-extrabold leading-snug tracking-tight text-[#0a0a0a] sm:text-3xl sm:leading-tight lg:text-[1.75rem] xl:text-3xl">
                    {title}
                  </h3>
                  <p className="mt-1 font-section text-base leading-snug text-[#525252] sm:text-lg sm:leading-relaxed">
                    {body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <LandingSectionWave variant="bottom" colorClassName="text-[#3a6288]" className="!z-20" />
    </section>
  );
}
