"use client";

import { Suspense } from "react";
import { OllieWorkspace } from "@/components/workspace/OllieWorkspace";

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
