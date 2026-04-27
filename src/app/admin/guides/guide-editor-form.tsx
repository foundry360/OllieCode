"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { LessonImageDropzone } from "@/app/admin/lessons/new/lesson-image-dropzone";
import {
  uploadLearningGuideCardImageAction,
  upsertLearningGuideAction,
  type GuideActionResult,
} from "@/app/admin/guides/actions";
import { RichTextField } from "@/components/admin/lesson-editor/RichTextField";

const initial: GuideActionResult = { ok: true };

function GuideFormFields({
  mode,
  initialValues,
  bodyHtml,
  onBodyHtmlChange,
  cardImageUrl,
  onCardImageUrlChange,
  formDisabled,
}: {
  mode: "create" | "edit";
  initialValues?: {
    id: string;
    title: string;
    summary: string;
    body_html: string;
    card_image_url: string;
    published: boolean;
    sort_order: number;
  };
  bodyHtml: string;
  onBodyHtmlChange: (html: string) => void;
  cardImageUrl: string;
  onCardImageUrlChange: (url: string) => void;
  formDisabled: boolean;
}) {
  return (
    <>
      <label className="mt-6 block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#3f6212]">
          Guide ID
        </span>
        <input
          name="id"
          required
          readOnly={mode === "edit"}
          defaultValue={initialValues?.id ?? ""}
          placeholder="e.g. parent-quick-start"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none ring-1 ring-slate-900/[0.04] read-only:bg-slate-50"
        />
      </label>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#3f6212]">
          Title
        </span>
        <input
          name="title"
          required
          defaultValue={initialValues?.title ?? ""}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none ring-1 ring-slate-900/[0.04]"
        />
      </label>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#3f6212]">
          Summary
        </span>
        <textarea
          name="summary"
          rows={3}
          defaultValue={initialValues?.summary ?? ""}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none ring-1 ring-slate-900/[0.04]"
        />
      </label>
      <div className="mt-4">
        <p className="mb-2 text-xs text-slate-500">
          Card image appears on Learning Guides. JPEG, PNG, WebP, or GIF · max 5 MB (LMS assets bucket).
        </p>
        <input type="hidden" name="card_image_url" value={cardImageUrl} />
        <LessonImageDropzone
          label="Card image (optional)"
          value={cardImageUrl}
          onChange={onCardImageUrlChange}
          variant="card"
          disabled={formDisabled}
          uploadAction={uploadLearningGuideCardImageAction}
        />
      </div>
      <div className="mt-4 block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#3f6212]">
          Body
        </span>
        <p className="mb-2 text-xs text-slate-500">
          Headings, lists, bold, links, and styles—same editor as lessons. Shown on the hub after save.
        </p>
        <input type="hidden" name="body_html" value={bodyHtml} />
        <div className="[&_.ProseMirror]:min-h-[min(40vh,320px)]">
          <RichTextField
            value={bodyHtml}
            onChange={onBodyHtmlChange}
            placeholder="Write the guide: intro, steps, tips…"
            learnerColorPreview={false}
            disabled={formDisabled}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-6">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
          <input
            type="checkbox"
            name="published"
            value="true"
            defaultChecked={initialValues?.published ?? false}
            className="size-4 rounded border-slate-300 text-[#84c126] focus:ring-[#84c126]"
          />
          Published
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#3f6212]">
            Sort order
          </span>
          <input
            name="sort_order"
            type="number"
            defaultValue={initialValues?.sort_order ?? 0}
            className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm tabular-nums"
          />
        </label>
      </div>
    </>
  );
}

export function GuideEditorForm({
  mode,
  initialValues,
}: {
  mode: "create" | "edit";
  initialValues?: {
    id: string;
    title: string;
    summary: string;
    body_html: string;
    card_image_url: string;
    published: boolean;
    sort_order: number;
  };
}) {
  const [bodyHtml, setBodyHtml] = useState(initialValues?.body_html ?? "");
  const [cardImageUrl, setCardImageUrl] = useState(initialValues?.card_image_url ?? "");
  const [state, formAction, pending] = useActionState(
    async (_prev: GuideActionResult, formData: FormData) => upsertLearningGuideAction(formData),
    initial,
  );

  return (
    <form action={formAction} className="mt-6">
      {state.ok === false ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </p>
      ) : null}
      <GuideFormFields
        mode={mode}
        initialValues={initialValues}
        bodyHtml={bodyHtml}
        onBodyHtmlChange={setBodyHtml}
        cardImageUrl={cardImageUrl}
        onCardImageUrlChange={setCardImageUrl}
        formDisabled={pending}
      />
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-xl bg-[#84c126] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#6b9e1f] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save guide"}
        </button>
        <Link
          href="/admin/guides"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
