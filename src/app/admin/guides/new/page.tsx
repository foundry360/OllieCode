import Link from "next/link";
import { GuideEditorForm } from "@/app/admin/guides/guide-editor-form";

export default function AdminNewGuidePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm">
        <Link href="/admin/guides" className="font-semibold text-[#3f6212] underline">
          ← Learning Guides
        </Link>
      </p>
      <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">New guide</h1>
      <p className="mt-1 text-sm text-slate-600">
        Choose a short URL-safe ID (lowercase, hyphens). It appears in API paths and cannot be
        changed later without creating a new row.
      </p>
      <GuideEditorForm mode="create" />
    </div>
  );
}
