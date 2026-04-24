import Link from "next/link";
import { SignedInAppHeader } from "@/components/app/SignedInAppHeader";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";

export default function SettingsPage() {
  return (
    <div className="min-h-[100dvh] bg-[#f8fafc] text-[#111827]">
      <SignedInAppHeader active="settings" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[30px] border border-[#dbe4ea] bg-[#f8fafc] shadow-[0_30px_80px_-20px_rgba(15,23,42,0.12)]">
          <SettingsPageShell />
        </div>
        <Link
          href="/workspace"
          className="mt-6 inline-block font-semibold text-[#84c126] hover:underline"
        >
          ← Back to workspace
        </Link>
      </div>
    </div>
  );
}
