import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Profile | Ollie Code",
  description: "Your adventures, favorites, and learner profile.",
};

export default function ProfileLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
