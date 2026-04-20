"use client";

import { MessageCircle, X } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const SUPPORT_EMAIL =
  typeof process.env.NEXT_PUBLIC_SUPPORT_EMAIL === "string"
    ? process.env.NEXT_PUBLIC_SUPPORT_EMAIL.trim()
    : "";

export function ContactChatLauncher() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [mailtoTarget, setMailtoTarget] = useState<string | null>(null);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const reset = useCallback(() => {
    setName("");
    setEmail("");
    setMessage("");
    setHoneypot("");
    setStatus("idle");
    setErrorText(null);
    setMailtoTarget(null);
  }, []);

  /** Portals to `document.body` so `position: fixed` is viewport-relative (footer uses `transform`). */
  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onClose = () => reset();
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, [reset, portalReady]);

  const open = () => {
    setStatus("idle");
    setErrorText(null);
    setMailtoTarget(null);
    dialogRef.current?.showModal();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorText(null);
    setMailtoTarget(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website: honeypot }),
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
      className="ollie-contact-dialog fixed left-1/2 top-1/2 z-[101000] m-0 max-h-[min(90dvh,720px)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#e5e7eb] bg-white p-0 text-[#111827] shadow-2xl"
    >
        <div className="flex items-start justify-between gap-3 border-b border-[#e5e7eb] px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold">Message us</h2>
            <p className="mt-0.5 text-sm text-[#6b7280]">
              Ask a question or say hello — we read every note.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-full p-2 text-[#6b7280] transition hover:bg-[#f3f4f6] hover:text-[#111827]"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {status === "sent" ? (
          <div className="px-5 py-8 text-center">
            <p className="font-medium text-[#3f6212]">Thanks — your message is on its way.</p>
            <p className="mt-2 text-sm text-[#6b7280]">We&apos;ll reply by email when we can.</p>
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
                <label htmlFor="contact-name" className="text-xs font-semibold text-[#374151]">
                  Your name
                </label>
                <input
                  id="contact-name"
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
                <label htmlFor="contact-email" className="text-xs font-semibold text-[#374151]">
                  Email
                </label>
                <input
                  id="contact-email"
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
                <label htmlFor="contact-message" className="text-xs font-semibold text-[#374151]">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  minLength={10}
                  maxLength={4000}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
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

  const floating = (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className="fixed bottom-6 left-6 z-50 flex max-w-[calc(100vw-5rem)] items-center gap-2.5 whitespace-nowrap rounded-full border-2 border-[var(--ollie-primary)] bg-[var(--ollie-primary)] px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:border-[#6fa020] hover:bg-[#6fa020] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#84c126] sm:px-5 sm:text-base"
      >
        <MessageCircle className="h-5 w-5 shrink-0 sm:h-6 sm:w-6 text-current" strokeWidth={2} aria-hidden />
        <span>Have a question?</span>
      </button>
      {dialog}
    </>
  );

  return portalReady ? createPortal(floating, document.body) : null;
}
