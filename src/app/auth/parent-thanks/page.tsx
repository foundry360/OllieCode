import { Suspense } from "react";
import { ParentThanksContent } from "@/app/auth/parent-thanks/parent-thanks-content";

function Fallback() {
  return (
    <div className="w-full max-w-md rounded-3xl border border-[#e5e7eb] bg-white p-8 shadow-lg">
      <p className="text-sm text-[#6b7280]">Loading…</p>
    </div>
  );
}

export default function ParentThanksPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f8fafc] px-4 py-12">
      <Suspense fallback={<Fallback />}>
        <ParentThanksContent />
      </Suspense>
    </div>
  );
}
