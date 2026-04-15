"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink, Eye } from "lucide-react";
import { upsertLessonAction } from "@/app/admin/lessons/actions";
import { LessonPublishToggle } from "@/app/admin/lessons/lesson-publish-toggle";
import { LessonStatusStepper } from "@/app/admin/lessons/lesson-status-stepper";
import { LessonContentWorkspace } from "@/components/admin/lesson-editor/LessonContentWorkspace";
import { isTrivialLessonHtml } from "@/lib/lms/htmlContent";
import {
  levelNameForSkillLevel,
  type LessonCatalogEntry,
} from "@/lib/lms/lessonsCatalog";
import { parseLessonPayload } from "@/lib/lms/lessonPayload";

type Props = {
  initialLesson: LessonCatalogEntry;
  initialPublished: boolean;
};

function cloneLesson(l: LessonCatalogEntry): LessonCatalogEntry {
  return JSON.parse(JSON.stringify(l)) as LessonCatalogEntry;
}

function normalizeForSave(
  d: LessonCatalogEntry,
  fixedId: string,
): LessonCatalogEntry {
  return {
    ...d,
    id: fixedId,
    bodyHtml: isTrivialLessonHtml(d.bodyHtml) ? null : d.bodyHtml,
    levelName: levelNameForSkillLevel(d.skillLevel),
  };
}

export function LessonEditorForm({
  initialLesson,
  initialPublished,
}: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => cloneLesson(initialLesson));
  const [published, setPublished] = useState(initialPublished);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPublished(initialPublished);
  }, [initialPublished]);

  useEffect(() => {
    setDraft(cloneLesson(initialLesson));
    // Only re-load form state when navigating to another lesson (id change).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [initialLesson.id]);

  const previewHref = `/learn/${encodeURIComponent(initialLesson.id)}`;
  const lessonId = initialLesson.id;
  const stepLinks = {
    basics: `/admin/lessons/${encodeURIComponent(lessonId)}/basics`,
    content: `/admin/lessons/${encodeURIComponent(lessonId)}/edit`,
    publish: `/admin/lessons/${encodeURIComponent(lessonId)}/edit#lesson-publish`,
  };

  const buildPayloadOrError = (): LessonCatalogEntry | null => {
    if (draft.id !== initialLesson.id) {
      setMsg("Lesson id mismatch. Reload the page.");
      return null;
    }
    const payload = normalizeForSave(draft, initialLesson.id);
    if (!parseLessonPayload(payload)) {
      setMsg("Invalid lesson data. Check numbers and required fields.");
      return null;
    }
    return payload;
  };

  const saveFromDraft = async () => {
    setMsg("");
    const payload = buildPayloadOrError();
    if (!payload) return;
    setLoading(true);
    try {
      const r = await upsertLessonAction(payload, published);
      if (r.ok) {
        setMsg(
          published
            ? "Saved. Lesson is live on the Learning Hub."
            : "Saved. Lesson is draft (hidden from the hub).",
        );
        router.refresh();
      } else {
        setMsg(r.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#6b9e1f]">
            <Link href="/admin/lessons" className="hover:underline">
              ← Lessons
            </Link>
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-slate-900">
            {draft.title}
          </h1>
          <p className="mt-1 font-mono text-sm text-slate-500">
            {initialLesson.id}
          </p>
        </div>
        <div
          id="lesson-publish"
          className="flex max-w-full flex-wrap items-center justify-end gap-3 scroll-mt-24"
        >
          <LessonPublishToggle
            published={published}
            onChange={setPublished}
            disabled={loading}
          />
          <Link
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-[#84c126]/50 hover:bg-[#f8fafc]"
          >
            <Eye className="size-4 text-[#84c126]" strokeWidth={2} />
            Preview
            <ExternalLink
              className="size-3.5 text-slate-400"
              strokeWidth={2}
            />
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Progress
        </p>
        <div className="mt-4 max-w-2xl">
          <LessonStatusStepper currentStep={2} stepLinks={stepLinks} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
        <div className="border-b border-slate-100 pb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Content
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Build the lesson visually. Use{" "}
            <strong className="font-semibold text-slate-800">Preview</strong>{" "}
            to check the learner view. Set{" "}
            <strong className="font-semibold text-slate-800">Draft</strong> or{" "}
            <strong className="font-semibold text-slate-800">Live</strong> in
            the header, then <strong className="font-semibold text-slate-800">Save</strong>{" "}
            to update the hub.
          </p>
        </div>

        <div className="mt-8">
          <LessonContentWorkspace
            draft={draft}
            setDraft={setDraft}
            disabled={loading}
          />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6">
          <button
            type="button"
            disabled={loading}
            onClick={() => router.push("/admin/lessons")}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={saveFromDraft}
            className="rounded-xl bg-[#84c126] px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-[#6fa020] disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>

        {msg ? (
          <p className="mt-4 text-sm text-slate-700" role="status">
            {msg}
          </p>
        ) : null}
      </div>
    </div>
  );
}
