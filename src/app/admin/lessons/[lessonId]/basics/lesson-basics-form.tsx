"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { upsertLessonAction } from "@/app/admin/lessons/actions";
import { LessonPublishToggle } from "@/app/admin/lessons/lesson-publish-toggle";
import { LessonImageDropzone } from "@/app/admin/lessons/new/lesson-image-dropzone";
import { LessonStatusStepper } from "@/app/admin/lessons/lesson-status-stepper";
import { LearningHubSelect } from "@/components/lms/LearningHubSelect";
import {
  LESSON_CATEGORY_OPTIONS,
  LESSON_SKILL_LEVEL_OPTIONS,
  levelNameForSkillLevel,
  type LessonCatalogEntry,
} from "@/lib/lms/lessonsCatalog";
import { parseLessonPayload } from "@/lib/lms/lessonPayload";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-[#84c126] focus:ring-2 focus:ring-[#84c126]/25";

const LEVEL_SELECT_OPTIONS = LESSON_SKILL_LEVEL_OPTIONS.map((n) => ({
  value: String(n),
  label: `Level ${n} — ${levelNameForSkillLevel(n)}`,
}));

type Props = {
  initialLesson: LessonCatalogEntry;
  initialPublished: boolean;
};

export function LessonBasicsForm({
  initialLesson,
  initialPublished,
}: Props) {
  const router = useRouter();
  const categorySelectId = useId();
  const levelSelectId = useId();

  const [title, setTitle] = useState(initialLesson.title);
  const [summary, setSummary] = useState(initialLesson.summary);
  const [category, setCategory] = useState(initialLesson.topic);
  const [skillLevel, setSkillLevel] = useState(String(initialLesson.skillLevel));
  const [cardImageUrl, setCardImageUrl] = useState(initialLesson.cardImageUrl ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(
    initialLesson.thumbnailUrl ?? "",
  );
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(initialPublished);

  useEffect(() => {
    setPublished(initialPublished);
  }, [initialPublished]);

  const categoryOptions = useMemo(() => {
    const base = LESSON_CATEGORY_OPTIONS;
    if (base.some((o) => o.value === category)) return base;
    return [{ value: category, label: category }, ...base];
  }, [category]);

  const lessonId = initialLesson.id;
  const stepLinks = {
    basics: `/admin/lessons/${encodeURIComponent(lessonId)}/basics`,
    content: `/admin/lessons/${encodeURIComponent(lessonId)}/edit`,
    publish: `/admin/lessons/${encodeURIComponent(lessonId)}/edit#lesson-publish`,
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
            Lesson basics
          </h1>
          <p className="mt-1 font-mono text-sm text-slate-500">{lessonId}</p>
        </div>
        <div className="flex max-w-full items-start justify-end">
          <LessonPublishToggle
            published={published}
            onChange={setPublished}
            disabled={loading}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Progress
        </p>
        <div className="mt-4 max-w-2xl">
          <LessonStatusStepper currentStep={1} stepLinks={stepLinks} />
        </div>
      </div>

      <form
        className="space-y-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setMsg("");
          setLoading(true);
          try {
            const n = Number(skillLevel);
            const payload: LessonCatalogEntry = {
              ...initialLesson,
              title: title.trim(),
              summary: summary.trim(),
              topic: category.trim(),
              skillLevel: n,
              levelName: levelNameForSkillLevel(n),
              cardImageUrl: cardImageUrl.trim() || null,
              thumbnailUrl: thumbnailUrl.trim() || null,
            };
            if (!parseLessonPayload(payload)) {
              setMsg("Invalid data. Check required fields.");
              return;
            }
            const r = await upsertLessonAction(payload, published);
            if (!r.ok) setMsg(r.message);
            else {
              router.refresh();
              setMsg(
                published
                  ? "Saved. Lesson is live on the Learning Hub."
                  : "Saved. Lesson is draft (hidden from the hub).",
              );
            }
          } finally {
            setLoading(false);
          }
        }}
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 lg:items-start">
            <div className="space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Details
              </h2>
              <div>
                <label className="block text-sm font-semibold text-slate-800">
                  Title
                </label>
                <input
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={255}
                  className={inputClass}
                  autoComplete="off"
                  disabled={loading}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                <div>
                  <label
                    className="block text-sm font-semibold text-slate-800"
                    htmlFor={categorySelectId}
                  >
                    Category
                  </label>
                  <div className="mt-1.5">
                    <LearningHubSelect
                      id={categorySelectId}
                      value={category}
                      onChange={setCategory}
                      options={categoryOptions}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-semibold text-slate-800"
                    htmlFor={levelSelectId}
                  >
                    Level
                  </label>
                  <div className="mt-1.5">
                    <LearningHubSelect
                      id={levelSelectId}
                      value={skillLevel}
                      onChange={setSkillLevel}
                      options={LEVEL_SELECT_OPTIONS}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800">
                  Description
                </label>
                <textarea
                  name="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  required
                  rows={5}
                  className={`${inputClass} resize-y min-h-[120px]`}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-6 lg:border-l lg:border-slate-100 lg:pl-10">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Media{" "}
                <span className="font-normal normal-case text-slate-400">
                  (optional)
                </span>
              </h2>
              <LessonImageDropzone
                label="Card image"
                variant="card"
                value={cardImageUrl}
                onChange={setCardImageUrl}
                disabled={loading}
              />
              <LessonImageDropzone
                label="Thumbnail"
                variant="thumbnail"
                value={thumbnailUrl}
                onChange={setThumbnailUrl}
                disabled={loading}
              />
            </div>
          </div>

          {msg ? (
            <p
              className={
                msg === "Saved."
                  ? "mt-6 text-sm text-slate-700"
                  : "mt-6 text-sm text-red-600"
              }
              role={msg === "Saved." ? "status" : "alert"}
            >
              {msg}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">
            <Link
              href={`/admin/lessons/${encodeURIComponent(lessonId)}/edit`}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Continue to content
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#84c126] px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-[#6fa020] disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
