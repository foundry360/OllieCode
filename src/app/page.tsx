import { BackToTop } from "@/components/landing/BackToTop";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { WhyBlockCoding } from "@/components/landing/WhyBlockCoding";
import { WhyOllieCode } from "@/components/landing/WhyOllieCode";
import { OurMission } from "@/components/landing/OurMission";
import { Testimonials } from "@/components/landing/Testimonials";
import { FaqSection } from "@/components/landing/FaqSection";
import { PreFooterCtaSection } from "@/components/landing/PreFooterCtaSection";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="box-border flex min-h-[100dvh] w-full min-w-0 max-w-full flex-col overflow-x-clip bg-[#f8fafc]">
      <LandingNav appearance="mint" />
      <main className="min-w-0 w-full max-w-full flex-1">
        <Hero />
        <Features />
        <WhyBlockCoding />
        <WhyOllieCode />
        <OurMission />
        <Testimonials />
        <FaqSection />
        <PreFooterCtaSection />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
