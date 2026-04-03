"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Root segment error UI (must not wrap in `<html>` — that is only for `global-error.tsx`). */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center text-[#111827]">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-sm text-[#4b5563]">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-[#84c126] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#6fa020]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-[#e5e7eb] bg-white px-5 py-2.5 text-sm font-bold shadow-sm hover:bg-[#f9fafb]"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
