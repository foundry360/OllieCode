"use client";

import dynamic from "next/dynamic";

const OllieWorkspace = dynamic(
  () =>
    import("@/components/workspace/OllieWorkspace").then((m) => m.OllieWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f8fafc] font-sans text-[#111827]">
        <p className="text-lg font-semibold">Loading workspace…</p>
      </div>
    ),
  },
);

export function WorkspaceGate() {
  return <OllieWorkspace />;
}
