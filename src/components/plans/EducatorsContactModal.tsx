"use client";

import { X } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { buildEducatorsContactInboxMessage } from "@/lib/contact/educatorsInquiry";

const SUPPORT_EMAIL =
  typeof process.env.NEXT_PUBLIC_SUPPORT_EMAIL === "string"
    ? process.env.NEXT_PUBLIC_SUPPORT_EMAIL.trim()
    : "";

const noopSubscribe = () => () => {};

function useClientMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export type EducatorsContactModalProps = {
  open: boolean;
  onClose: () => void;
};

export function EducatorsContactModal({ open, onClose }: EducatorsContactModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mounted = useClientMounted();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [mailtoTarget, setMailtoTarget] = useState<string | null>(null);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onDialogClose = () => {
      onClose();
    };
    el.addEventListener("close", onDialogClose);
    return () => el.removeEventListener("close", onDialogClose);
  }, [onClose]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el || !mounted) return;
    if (open) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [open, mounted]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorText(null);
    setMailtoTarget(null);
    const composed = buildEducatorsContactInboxMessage(organization, message);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message: composed, website: honeypot }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        fallbackEmail?: string | null;
      };

      if (res.ok) {
        setStatus("sent");
        return;
      }

      if (res.status === 503 && data.error === "not_configured") {
        const fallback =
          (typeof data.fallbackEmail === "string" && data.fallbackEmail.trim()) ||
          SUPPORT_EMAIL ||
          null;
        if (fallback) {
          setMailtoTarget(fallback);
          setErrorText(
            "The message form is not wired to email on this server yet. You can still reach us here:",
          );
        } else {
          setErrorText(
            "The message form is not wired to email on this server yet. Ask your host for a support address.",
          );
        }
        setStatus("error");
        return;
      }

      setErrorText(
        typeof data.error === "string" ? data.error : "Something went wrong. Please try again.",
      );
      setStatus("error");
    } catch {
      setErrorText("Network error. Check your connection and try again.");
      setStatus("error");
    }
  };

  const dialog = (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 z-[101050] m-0 max-h-[min(90dvh,720px)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#e5e7eb] bg-white p-0 text-[#111827] shadow-2xl backdrop:bg-slate-900/40"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#e5e7eb] px-5 py-4">
        <div>
          <h2 className="font-display text-lg font-bold">Educators & classrooms</h2>
          <p className="mt-1 text-sm leading-snug text-[#6b7280]">
            Tell us about your school or program and we will follow up about custom plans, bulk pricing,
            and classroom tools.
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          className="shrink-0 rounded-full p-2 text-[#6b7280] transition hover:bg-[#f3f4f6] hover:text-[#111827]"
          aria-label="Close"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {status === "sent" ? (
        <div className="px-5 py-8 text-center">
          <p className="font-medium text-[#3f6212]">Thank you for your message!</p>
          <p className="mt-2 text-sm text-[#6b7280]">
            Our team reads every note and will follow up by email when we can.
          </p>
          <button
            type="button"
            onClick={close}
            className="mt-6 rounded-full bg-[#84c126] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#6fa020]"
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="px-5 py-4">
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
            aria-hidden
          />
          <div className="space-y-3">
            <div>
              <label htmlFor="educators-contact-name" className="text-xs font-semibold text-[#374151]">
                Your name
              </label>
              <input
                id="educators-contact-name"
                name="name"
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d1d5db] px-3 py-2.5 text-sm outline-none ring-[#84c126]/40 transition focus:border-[#84c126] focus:ring-2"
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="educators-contact-email" className="text-xs font-semibold text-[#374151]">
                Work email
              </label>
              <input
                id="educators-contact-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d1d5db] px-3 py-2.5 text-sm outline-none ring-[#84c126]/40 transition focus:border-[#84c126] focus:ring-2"
                autoComplete="email"
              />
            </div>
            <div>
              <label
                htmlFor="educators-contact-organization"
                className="text-xs font-semibold text-[#374151]"
              >
                School or organization
              </label>
              <input
                id="educators-contact-organization"
                name="organization"
                maxLength={200}
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Lincoln Elementary, Code Camp Inc."
                className="mt-1 w-full rounded-xl border border-[#d1d5db] px-3 py-2.5 text-sm outline-none ring-[#84c126]/40 transition focus:border-[#84c126] focus:ring-2"
                autoComplete="organization"
              />
            </div>
            <div>
              <label htmlFor="educators-contact-message" className="text-xs font-semibold text-[#374151]">
                How can we help?
              </label>
              <textarea
                id="educators-contact-message"
                name="message"
                required
                minLength={10}
                maxLength={4000}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Rough student count, timeline, or questions about the Educators plan…"
                className="mt-1 w-full resize-y rounded-xl border border-[#d1d5db] px-3 py-2.5 text-sm outline-none ring-[#84c126]/40 transition focus:border-[#84c126] focus:ring-2"
              />
            </div>
          </div>

          {errorText ? (
            <div className="mt-3 text-sm text-red-800" role="alert">
              <p>{errorText}</p>
              {mailtoTarget ? (
                <p className="mt-2">
                  <a
                    className="font-semibold text-[#3f6212] underline decoration-[#84c126] underline-offset-2 hover:text-[#84c126]"
                    href={`mailto:${mailtoTarget}`}
                  >
                    Email {mailtoTarget}
                  </a>
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="rounded-full border border-[#d1d5db] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] transition hover:bg-[#f9fafb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-full bg-[#84c126] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#6fa020] disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send message"}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );

  return mounted ? createPortal(dialog, document.body) : null;
}
