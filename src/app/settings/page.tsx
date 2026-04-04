import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="min-h-[100dvh] bg-[#f8fafc] px-4 py-10 text-[#111827]">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-[#6b7280]">More options coming soon.</p>
        <Link
          href="/workspace"
          className="mt-8 inline-block font-semibold text-[#84c126] hover:underline"
        >
          ← Back to workspace
        </Link>
      </div>
    </div>
  );
}
