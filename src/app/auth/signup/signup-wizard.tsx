"use client";

import { OllieLogoLink } from "@/components/auth/OllieLogoLink";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { BirthDateDigits } from "@/components/auth/BirthDateDigits";
import {
  isoDateFromDigits,
  validateBirthDateForSignup,
} from "@/lib/auth/birthDate";
import {
  normalizeUsername,
  validateUsernameNormalized,
} from "@/lib/profiles/username";

type Step = 1 | 2 | 3;

const SIGNUP_STEPS: { id: Step; title: string }[] = [
  { id: 1, title: "Account" },
  { id: 2, title: "Age Check" },
  { id: 3, title: "Parent" },
];

function StepCheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SignupStepStatus({ step }: { step: Step }) {
  return (
    <nav className="mt-5 w-full" aria-label="Sign-up steps">
      <div className="flex w-full items-center">
        {SIGNUP_STEPS.map((meta, index) => {
          const isComplete = step > meta.id;
          const isCurrent = step === meta.id;
          const isPending = step < meta.id;
          return (
            <Fragment key={meta.id}>
              {index > 0 ? (
                <div
                  className={[
                    "mx-1 h-1 min-w-[0.5rem] flex-1 rounded-full",
                    step > SIGNUP_STEPS[index - 1].id ? "bg-[#84c126]" : "bg-[#e5e7eb]",
                  ].join(" ")}
                  aria-hidden
                />
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                <span
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
                    isComplete && "bg-[#84c126] text-white shadow-sm",
                    isCurrent &&
                      "bg-[#84c126] text-white shadow-md ring-4 ring-[#84c126]/25",
                    isPending && "border-2 border-[#e5e7eb] bg-white text-[#cbd5e1]",
                  ].join(" ")}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isComplete ? <StepCheckIcon /> : meta.id}
                </span>
                <span
                  className={[
                    "mt-2 w-full px-1 text-center text-[10px] font-bold uppercase leading-tight tracking-wide sm:text-[11px] sm:whitespace-nowrap",
                    isCurrent ? "text-[#365314]" : isComplete ? "text-[#6b7280]" : "text-[#9ca3af]",
                  ].join(" ")}
                >
                  {meta.title}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>
    </nav>
  );
}

export function SignupWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [done, setDone] = useState(false);
  const [codename, setCodename] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [birthDigits, setBirthDigits] = useState<string[]>(() =>
    Array.from({ length: 8 }, () => ""),
  );
  const [parentEmail, setParentEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [parentEmailSent, setParentEmailSent] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  function validateStep1(): boolean {
    setMsg("");
    const n = normalizeUsername(codename);
    const err = validateUsernameNormalized(n);
    if (err) {
      setMsg(err);
      return false;
    }
    if (password.length < 6) {
      setMsg("Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirm) {
      setMsg("Passwords do not match.");
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    setMsg("");
    const iso = isoDateFromDigits(birthDigits);
    if (!iso) {
      setMsg("Enter your birth date using all eight boxes (month, day, year).");
      return false;
    }
    const err = validateBirthDateForSignup(iso);
    if (err) {
      setMsg(err);
      return false;
    }
    return true;
  }

  async function submitParentEmail(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const n = normalizeUsername(codename);
    const trimmedParent = parentEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedParent)) {
      setMsg("Enter a valid parent or guardian email.");
      return;
    }

    const birthIso = isoDateFromDigits(birthDigits);
    if (!birthIso || validateBirthDateForSignup(birthIso)) {
      setMsg("Go back and enter a valid birth date.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/pending-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: n,
          password,
          confirmPassword: confirm,
          birthDate: birthIso,
          parentEmail: trimmedParent,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        ok?: boolean;
        emailSent?: boolean;
        approvalUrl?: string;
      };
      if (!res.ok) {
        setMsg(data.error ?? "Something went wrong.");
        return;
      }
      setDone(true);
      setParentEmailSent(data.emailSent === true);
      setApprovalUrl(data.approvalUrl ?? null);
      setMsg("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <OllieLogoLink className="mb-6" />
      <h1 className="font-display text-2xl font-bold text-[#111827]">Create an account</h1>
      <p className="mt-2 text-sm text-[#6b7280]">
        {done
          ? "Parent approval is pending."
          : "Let's get you started."}
      </p>

      {!done ? <SignupStepStatus step={step} /> : null}

      {!done && step === 1 ? (
        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (validateStep1()) setStep(2);
          }}
        >
          <label className="text-sm font-semibold text-[#374151]">
            Codename
            <input
              type="text"
              value={codename}
              onChange={(e) => setCodename(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-xl border border-[#e5e7eb] px-4 py-3 text-base lowercase text-[#111827]"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={40}
              required
              placeholder="e.g. blocky_turtle"
            />
          </label>
          <label className="text-sm font-semibold text-[#374151]">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-xl border border-[#e5e7eb] px-4 py-3 text-base text-[#111827]"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </label>
          <label className="text-sm font-semibold text-[#374151]">
            Confirm password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-xl border border-[#e5e7eb] px-4 py-3 text-base text-[#111827]"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </label>
          {msg ? (
            <p className="text-sm text-red-600" role="alert">
              {msg}
            </p>
          ) : null}
          <button
            type="submit"
            className="rounded-xl bg-[#84c126] py-3 font-bold text-white shadow hover:bg-[#6fa020]"
          >
            Next
          </button>
        </form>
      ) : null}

      {!done && step === 2 ? (
        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (validateStep2()) setStep(3);
          }}
        >
          <BirthDateDigits digits={birthDigits} onDigitsChange={setBirthDigits} />
          {msg ? (
            <p className="text-sm text-red-600" role="alert">
              {msg}
            </p>
          ) : null}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setMsg("");
              }}
              className="flex-1 rounded-xl border border-[#e5e7eb] py-3 font-bold text-[#374151] hover:bg-[#f9fafb]"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-[#84c126] py-3 font-bold text-white shadow hover:bg-[#6fa020]"
            >
              Next
            </button>
          </div>
        </form>
      ) : null}

      {!done && step === 3 ? (
        <form className="mt-6 flex flex-col gap-4" onSubmit={submitParentEmail}>
          <p className="text-sm text-[#374151]">
            Parent or guardian email (stored with this request). If the app doesn&apos;t send mail,
            the next screen has a link you can share with them instead.
          </p>
          <label className="text-sm font-semibold text-[#374151]">
            Parent or guardian email
            <input
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-xl border border-[#e5e7eb] px-4 py-3 text-base text-[#111827]"
              autoComplete="email"
              required
            />
          </label>
          {msg ? (
            <p className="text-sm text-red-600" role="alert">
              {msg}
            </p>
          ) : null}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setStep(2);
                setMsg("");
              }}
              className="flex-1 rounded-xl border border-[#e5e7eb] py-3 font-bold text-[#374151] hover:bg-[#f9fafb] disabled:opacity-60"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-[#84c126] py-3 font-bold text-white shadow hover:bg-[#6fa020] disabled:opacity-60"
            >
              {loading ? "Working…" : "Finish"}
            </button>
          </div>
        </form>
      ) : null}

      {done ? (
        <div className="mt-6 rounded-xl border border-[#ecfccb] bg-[#f7fee7] p-4 text-sm text-[#365314]">
          <p className="font-bold">You&apos;re almost there!</p>
          {parentEmailSent ? (
            <p className="mt-2">
              We sent a message to your parent or guardian. Ask them to open it and tap{" "}
              <strong>Approve account</strong>. After that, you can sign in here with your codename
              and password.
            </p>
          ) : approvalUrl ? (
            <>
              <p className="mt-2">
                We didn&apos;t send an email from this app. Share the link below with a parent or
                guardian—they open it once to approve your account. Then you can sign in with your
                codename and password.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                <p className="min-w-0 flex-1 break-all font-mono text-xs text-[#4d7c0f]">
                  {approvalUrl}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(approvalUrl).then(() => {
                      setLinkCopied(true);
                      window.setTimeout(() => setLinkCopied(false), 2000);
                    });
                  }}
                  className="shrink-0 rounded-lg border border-[#84c126] bg-white px-3 py-2 text-sm font-semibold text-[#365314] hover:bg-[#ecfccb]"
                >
                  {linkCopied ? "Copied" : "Copy link"}
                </button>
              </div>
            </>
          ) : (
            <p className="mt-2">
              Ask a parent or guardian to approve your account. After that, you can sign in here.
            </p>
          )}
          <Link
            href="/auth/login?next=/workspace"
            className="mt-4 inline-block font-bold text-[#3f6212] underline"
          >
            Back to sign in
          </Link>
        </div>
      ) : null}

      <p className="mt-8 text-center text-sm">
        Already have an account?{" "}
        <Link href="/auth/login?next=/workspace" className="font-semibold text-[#84c126] hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link href="/" className="font-semibold text-[#84c126] hover:underline">
          ← Back home
        </Link>
      </p>
    </div>
  );
}
