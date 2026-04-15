"use client";

import type { ReactNode } from "react";
import { useState } from "react";

const detailsClass =
  "group min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm open:border-[#84c126]/35 open:shadow-md open:ring-1 open:ring-[#84c126]/20";

type Props = {
  defaultOpen?: boolean;
  summary: ReactNode;
  children: ReactNode;
};

/**
 * `<details>` with optional initial open state; user can still toggle (controlled open).
 */
export function LessonModuleDetailsAccordion({
  defaultOpen = false,
  summary,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      className={detailsClass}
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      {summary}
      {children}
    </details>
  );
}
