"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

/** Blockly + p5 + browser-only APIs — skip SSR so the workspace tree never runs on the server. */
const OllieWorkspace = dynamic(
  () =>
    import("@/components/workspace/OllieWorkspace").then((m) => m.OllieWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f8fafc] p-6 text-sm text-[#6b7280]">
        Loading workspace…
      </div>
    ),
  },
);

export function WorkspacePageClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#f8fafc] p-6 text-sm text-[#6b7280]">
          Loading workspace…
        </div>
      }
    >
      <OllieWorkspace />
    </Suspense>
  );
}
