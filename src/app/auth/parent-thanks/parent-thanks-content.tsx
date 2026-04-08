"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const ERROR_COPY: Record<string, string> = {
  server_config:
    "The server could not complete approval. Ask the app owner to check environment variables.",
  missing_token: "This link is incomplete. Use the button from the email.",
  invalid_or_expired:
    "This link is invalid or has expired. Ask your child to start sign-up again from the website.",
  taken: "That codename is already in use. Contact support if this is unexpected.",
  create_failed: "We could not create the account. Please try again or contact support.",
};

export function ParentThanksContent() {
  const searchParams = useSearchParams();
  const err = searchParams.get("error");

  if (err) {
    const message = ERROR_COPY[err] ?? "Something went wrong.";
    return (
      <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 shadow-lg">
        <h1 className="font-display text-2xl font-bold text-[#991b1b]">Could not approve</h1>
        <p className="mt-3 text-sm text-[#374151]">{message}</p>
        <Link
          href="/"
          className="mt-6 inline-block font-semibold text-[#84c126] hover:underline"
        >
          ← Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-[#ecfccb] bg-white p-8 shadow-lg">
      <h1 className="font-display text-2xl font-bold text-[#166534]">Account approved</h1>
      <p className="mt-3 text-sm text-[#374151]">
        The Ollie Code account is ready. Your child can sign in with the codename and password they
        chose.
      </p>
      <Link
        href="/auth/login?next=/workspace"
        className="mt-6 inline-block rounded-xl bg-[#84c126] px-6 py-3 font-bold text-white shadow hover:bg-[#6fa020]"
      >
        Open sign in
      </Link>
      <p className="mt-6 text-center text-sm">
        <Link href="/" className="font-semibold text-[#84c126] hover:underline">
          ← Back home
        </Link>
      </p>
    </div>
  );
}
