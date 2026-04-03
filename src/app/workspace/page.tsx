import type { Metadata } from "next";
import { WorkspaceGate } from "@/components/workspace/WorkspaceGate";

export const metadata: Metadata = {
  title: "Workspace | Ollie Code",
  description: "Build games and code with blocks.",
};

export default function WorkspacePage() {
  return <WorkspaceGate />;
}
