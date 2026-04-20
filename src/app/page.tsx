import { BackToTop } from "@/components/landing/BackToTop";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Testimonials } from "@/components/landing/Testimonials";
import { FaqSection } from "@/components/landing/FaqSection";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="box-border flex min-h-[100dvh] w-full min-w-0 max-w-full flex-col overflow-x-clip bg-[#f8fafc]">
      <LandingNav appearance="mint" />
      <main className="min-w-0 w-full max-w-full flex-1">
        <Hero />
        <Features />
        <Testimonials />
        <FaqSection />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
