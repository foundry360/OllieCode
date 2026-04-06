import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Workspace | David Code",
  description: "Build games and code with blocks.",
};

export default function WorkspaceLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
