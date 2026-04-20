import type { ReactNode } from "react";
import { BackToTop } from "@/components/landing/BackToTop";
import { Footer } from "@/components/landing/Footer";
import { LandingNav } from "@/components/landing/LandingNav";

export default function LegalLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f8fafc]">
      <LandingNav />
      {children}
      <Footer />
      <BackToTop />
    </div>
  );
}
