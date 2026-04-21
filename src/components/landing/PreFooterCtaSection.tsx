import Image from "next/image";
import { PreFooterCtaContent } from "@/components/landing/PreFooterCta";

export function PreFooterCtaSection() {
  return (
    <section className="relative w-full min-w-0 overflow-x-clip bg-[#d9eeff] py-20 sm:py-24 lg:py-28">
      <div
        className="pointer-events-none absolute inset-0 flex flex-col overflow-hidden bg-[#d9eeff]"
        aria-hidden
      >
        <div className="min-h-0 min-w-0 flex-1" />
        <div className="relative w-full shrink-0 aspect-[1920/600]">
          <Image
            src="/images/grass_bg.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      </div>
      <div className="relative z-10 px-4">
        <PreFooterCtaContent />
      </div>
    </section>
  );
}
