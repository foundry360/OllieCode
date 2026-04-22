"use client";

import type { ReactNode } from "react";
import { OLLIE_OPEN_CONTACT_EVENT } from "@/lib/contact-dialog-event";

type OpenContactDialogButtonProps = {
  className?: string;
  children: ReactNode;
};

export function OpenContactDialogButton({ className = "", children }: OpenContactDialogButtonProps) {
  return (
    <button
      type="button"
      className={className}
      aria-haspopup="dialog"
      onClick={() => window.dispatchEvent(new CustomEvent(OLLIE_OPEN_CONTACT_EVENT))}
    >
      {children}
    </button>
  );
}
