import type { ReactNode } from "react";
import { BackToTop } from "@/components/landing/BackToTop";
import { Footer } from "@/components/landing/Footer";
import { LandingNav } from "@/components/landing/LandingNav";

export default function WhyOllieCodeLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f8fafc]">
      <LandingNav appearance="mint" />
      {children}
      <Footer />
      <BackToTop />
    </div>
  );
}
