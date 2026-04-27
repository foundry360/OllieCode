"use client";

import { X } from "lucide-react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SignupWizard } from "@/app/auth/signup/signup-wizard";
import { OLLIE_OPEN_SIGNUP_EVENT } from "@/lib/signup-dialog-event";

function SignupWizardFallback() {
  return <p className="py-8 text-center text-sm text-[#6b7280]">Loading…</p>;
}

export function SignupModalLauncher() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [wizardKey, setWizardKey] = useState(0);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const open = useCallback(() => {
    setWizardKey((k) => k + 1);
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!portalReady) return;
    const onExternalOpen = () => open();
    window.addEventListener(OLLIE_OPEN_SIGNUP_EVENT, onExternalOpen);
    return () => window.removeEventListener(OLLIE_OPEN_SIGNUP_EVENT, onExternalOpen);
  }, [open, portalReady]);

  const dialog = (
    <dialog
      ref={dialogRef}
      aria-label="Create an account"
      className="ollie-contact-dialog fixed left-1/2 top-1/2 z-[101000] m-0 max-h-[min(90dvh,720px)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-0 text-[#111827] shadow-2xl"
    >
      <div className="flex items-center justify-end border-b border-[#e5e7eb] px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={close}
          className="rounded-full p-2 text-[#6b7280] transition hover:bg-[#f3f4f6] hover:text-[#111827]"
          aria-label="Close"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <div className="max-h-[min(calc(90dvh-3.5rem),680px)] overflow-y-auto px-5 pb-6 pt-1">
        <Suspense key={wizardKey} fallback={<SignupWizardFallback />}>
          <SignupWizard />
        </Suspense>
      </div>
    </dialog>
  );

  return portalReady ? createPortal(dialog, document.body) : null;
}
