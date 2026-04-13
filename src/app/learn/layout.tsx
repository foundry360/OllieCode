import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Learning Hub | Ollie Code",
  description:
    "Learning Hub — skill-based lessons on the Ollie Code platform.",
};

export default function LearnLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
