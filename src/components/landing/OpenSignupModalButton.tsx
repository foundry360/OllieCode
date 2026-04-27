"use client";

import type { ReactNode } from "react";
import { OLLIE_OPEN_SIGNUP_EVENT } from "@/lib/signup-dialog-event";

type OpenSignupModalButtonProps = {
  className?: string;
  children: ReactNode;
};

export function OpenSignupModalButton({ className = "", children }: OpenSignupModalButtonProps) {
  return (
    <button
      type="button"
      className={className}
      aria-haspopup="dialog"
      onClick={() => window.dispatchEvent(new CustomEvent(OLLIE_OPEN_SIGNUP_EVENT))}
    >
      {children}
    </button>
  );
}
