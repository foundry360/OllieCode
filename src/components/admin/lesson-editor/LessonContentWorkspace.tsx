"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react";
import { RichTextField } from "@/components/admin/lesson-editor/RichTextField";
import type { LessonCatalogEntry, LessonModule } from "@/lib/lms/lessonsCatalog";

const fieldLabel = "block text-sm font-semibold text-slate-800";
const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-1 ring-slate-900/[0.04] transition focus:border-[#84c126] focus:ring-2 focus:ring-[#84c126]/25";

const sectionTitle =
  "text-xs font-bold uppercase tracking-wide text-slate-500";

function newModuleId(lessonId: string): string {
  return `${lessonId}-m-${crypto.randomUUID().slice(0, 8)}`;
}

type Props = {
  draft: LessonCatalogEntry;
  setDraft: Dispatch<SetStateAction<LessonCatalogEntry>>;
  disabled: boolean;
};

export function LessonContentWorkspace({
  draft,
  setDraft,
  disabled,
}: Props) {
  const [openModuleId, setOpenModuleId] = useState<string | null>(() =>
    draft.modules[0]?.id ?? null,
  );

  useEffect(() => {
    if (
      openModuleId != null &&
      !draft.modules.some((m) => m.id === openModuleId)
    ) {
      setOpenModuleId(draft.modules[0]?.id ?? null);
    }
  }, [draft.modules, openModuleId]);

  const toggleModule = (id: string) => {
    setOpenModuleId((cur) => (cur === id ? null : id));
  };

  const moveModule = (index: number, dir: -1 | 1) => {
    setDraft((d) => {
      const next = [...d.modules];
      const j = index + dir;
      if (j < 0 || j >= next.length) return d;
      [next[index], next[j]] = [next[j]!, next[index]!];
      return { ...d, modules: next };
    });
  };

  const updateModule = (index: number, patch: Partial<LessonModule>) => {
    setDraft((d) => {
      const modules = [...d.modules];
      const cur = modules[index];
      if (!cur) return d;
      modules[index] = { ...cur, ...patch };
      return { ...d, modules };
    });
  };

  const removeModule = (index: number) => {
    if (draft.modules.length <= 1) return;
    if (!window.confirm("Remove this module from the lesson?")) return;
    setDraft((d) => ({
      ...d,
      modules: d.modules.filter((_, i) => i !== index),
    }));
  };

  const addModule = () => {
    const nid = newModuleId(draft.id);
    setDraft((d) => ({
      ...d,
      modules: [
        ...d.modules,
        {
          id: nid,
          title: "New module",
          points: 100,
          durationMins: 10,
          steps: 1,
          detail: "Describe what learners do in this step.",
        },
      ],
    }));
    setOpenModuleId(nid);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <section className="space-y-5">
        <h3 className={sectionTitle}>Lesson</h3>
        <div>
          <label className={fieldLabel} htmlFor="lesson-title-input">
            Name
          </label>
          <input
            id="lesson-title-input"
            maxLength={255}
            value={draft.title}
            onChange={(e) =>
              setDraft((d) => ({ ...d, title: e.target.value }))
            }
            className={inputClass}
            disabled={disabled}
          />
          <p className="mt-1 text-xs text-slate-500">
            {draft.title.length} / 255
          </p>
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-10">
        <h3 className={sectionTitle}>Timing & labels</h3>
        <div className="space-y-4">
          <div>
            <label className={fieldLabel} htmlFor="est-mins">
              Estimated minutes
            </label>
            <input
              id="est-mins"
              type="number"
              min={1}
              value={draft.estimatedMinutes}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  estimatedMinutes: Math.max(
                    1,
                    Number(e.target.value) || 1,
                  ),
                }))
              }
              className={inputClass}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={fieldLabel} htmlFor="objective">
              Objective label
            </label>
            <input
              id="objective"
              value={draft.objective}
              onChange={(e) =>
                setDraft((d) => ({ ...d, objective: e.target.value }))
              }
              className={inputClass}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={fieldLabel} htmlFor="role-label">
              Role label
            </label>
            <input
              id="role-label"
              value={draft.roleLabel}
              onChange={(e) =>
                setDraft((d) => ({ ...d, roleLabel: e.target.value }))
              }
              className={inputClass}
              disabled={disabled}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 pt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className={sectionTitle}>Modules</h3>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Open one module at a time. Learners still see the full timeline
              on the lesson page.
            </p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={addModule}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#3f6212] transition hover:border-[#84c126] hover:bg-[#ecfccb]/40 disabled:opacity-50"
          >
            <Plus className="size-4" strokeWidth={2} />
            Add module
          </button>
        </div>

        <ul className="mt-6 space-y-3">
          {draft.modules.map((m, index) => {
            const isOpen = openModuleId === m.id;
            return (
              <li
                key={m.id}
                id={`module-${m.id}`}
                className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40 shadow-sm"
              >
                <div className="flex items-stretch gap-1">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleModule(m.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 px-3 py-3 text-left transition hover:bg-white/80"
                    aria-expanded={isOpen}
                  >
                    <ChevronDown
                      className={`size-5 shrink-0 text-[#84c126] transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    <span className="text-xs font-bold uppercase text-slate-400">
                      Module {index + 1}
                    </span>
                    <span className="min-w-0 truncate font-semibold text-slate-900">
                      {m.title || "Untitled"}
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center gap-0.5 border-l border-slate-200 bg-white/50 px-1">
                    <button
                      type="button"
                      disabled={disabled || index === 0}
                      onClick={() => moveModule(index, -1)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-30"
                      aria-label="Move module up"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={
                        disabled || index === draft.modules.length - 1
                      }
                      onClick={() => moveModule(index, 1)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-30"
                      aria-label="Move module down"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={disabled || draft.modules.length <= 1}
                      onClick={() => removeModule(index)}
                      className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30"
                      aria-label="Remove module"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                {isOpen ? (
                  <div className="border-t border-slate-200 bg-white p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-600">
                          Title
                        </label>
                        <input
                          value={m.title}
                          onChange={(e) =>
                            updateModule(index, { title: e.target.value })
                          }
                          className={inputClass}
                          disabled={disabled}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600">
                          Points
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={m.points}
                          onChange={(e) =>
                            updateModule(index, {
                              points: Number(e.target.value) || 0,
                            })
                          }
                          className={inputClass}
                          disabled={disabled}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600">
                          Duration (mins)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={m.durationMins}
                          onChange={(e) =>
                            updateModule(index, {
                              durationMins: Number(e.target.value) || 0,
                            })
                          }
                          className={inputClass}
                          disabled={disabled}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600">
                          Steps
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={m.steps}
                          onChange={(e) =>
                            updateModule(index, {
                              steps: Number(e.target.value) || 0,
                            })
                          }
                          className={inputClass}
                          disabled={disabled}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-semibold text-slate-600">
                        Detail
                      </label>
                      <p className="mt-1 text-xs text-slate-500">
                        Format text with the toolbar (fonts, color, lists,
                        links).
                      </p>
                      <div className="mt-2">
                        <RichTextField
                          key={m.id}
                          value={m.detail}
                          onChange={(html) =>
                            updateModule(index, { detail: html })
                          }
                          disabled={disabled}
                          placeholder="Describe what learners do in this step…"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
