"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { createDraftLessonAction } from "@/app/admin/lessons/actions";
import { LessonImageDropzone } from "@/app/admin/lessons/new/lesson-image-dropzone";
import { LearningHubSelect } from "@/components/lms/LearningHubSelect";
import {
  LESSON_CATEGORY_OPTIONS,
  LESSON_SKILL_LEVEL_OPTIONS,
  levelNameForSkillLevel,
} from "@/lib/lms/lessonsCatalog";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-[#84c126] focus:ring-2 focus:ring-[#84c126]/25";

const LEVEL_SELECT_OPTIONS = LESSON_SKILL_LEVEL_OPTIONS.map((n) => ({
  value: String(n),
  label: `Level ${n} — ${levelNameForSkillLevel(n)}`,
}));

export function NewLessonForm() {
  const router = useRouter();
  const categorySelectId = useId();
  const levelSelectId = useId();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(LESSON_CATEGORY_OPTIONS[0]!.value);
  const [skillLevel, setSkillLevel] = useState(String(LESSON_SKILL_LEVEL_OPTIONS[0]!));
  const [summary, setSummary] = useState("");
  const [cardImageUrl, setCardImageUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setMsg("");
        setLoading(true);
        try {
          const r = await createDraftLessonAction({
            title,
            summary,
            topic: category,
            skillLevel: Number(skillLevel),
            cardImageUrl: cardImageUrl.trim() || null,
            thumbnailUrl: thumbnailUrl.trim() || null,
          });
          if (r && !r.ok) setMsg(r.message);
          else router.refresh();
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
                placeholder="e.g. Space Race"
                required
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
                    options={LESSON_CATEGORY_OPTIONS}
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
                placeholder="Short summary for cards and the detail page (plain text)."
                required
                rows={5}
                className={`${inputClass} resize-y min-h-[120px]`}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-6 lg:border-l lg:border-slate-100 lg:pl-10">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Media <span className="font-normal normal-case text-slate-400">(optional)</span>
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
          <p className="mt-6 text-sm text-red-600" role="alert">
            {msg}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">
          <button
            type="button"
            disabled={loading}
            onClick={() => router.push("/admin/lessons")}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#84c126] px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-[#6fa020] disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create Lesson"}
          </button>
        </div>
      </div>
    </form>
  );
}
