"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { LEARNING_GUIDE_SECTION_ORDER } from "@/lib/lms/learningGuides";
import { reorderLearningGuidesInSectionAction } from "@/app/admin/guides/actions";

export type AdminGuideListRow = {
  id: string;
  title: string;
  published: boolean;
  sort_order: number;
  updated_at: string;
  section: string | null;
  card_image_url: string | null;
};

/** Stable per-section id so each DndContext scopes a11y ids the same on server and client. */
function stableDndContextId(section: string): string {
  const slug = section
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `admin-learning-guides-${slug || "default"}`;
}

function formatGuideUpdatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function groupRowsBySection(rows: AdminGuideListRow[]): { section: string; rows: AdminGuideListRow[] }[] {
  const map = new Map<string, AdminGuideListRow[]>();
  for (const r of rows) {
    const sec = r.section?.trim() || "Ollie Code Basics";
    const list = map.get(sec) ?? [];
    list.push(r);
    map.set(sec, list);
  }
  const sortWithin = (list: AdminGuideListRow[]) =>
    [...list].sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));

  const out: { section: string; rows: AdminGuideListRow[] }[] = [];
  const seen = new Set<string>();
  for (const label of LEARNING_GUIDE_SECTION_ORDER) {
    seen.add(label);
    const list = map.get(label);
    if (list?.length) {
      out.push({ section: label, rows: sortWithin(list) });
    }
  }
  for (const [section, list] of [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (seen.has(section)) continue;
    if (list.length) {
      out.push({ section, rows: sortWithin(list) });
    }
  }
  return out;
}

function SortableGuideRow({ row }: { row: AdminGuideListRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 0,
    position: "relative" as const,
    opacity: isDragging ? 0.88 : 1,
    backgroundColor: isDragging ? "rgb(248 250 252)" : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style} className="text-slate-800">
      <td className="w-10 px-2 py-3 align-middle">
        <button
          type="button"
          className="inline-flex cursor-grab touch-none rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:cursor-grabbing"
          aria-label={`Drag to reorder: ${row.title}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        </button>
      </td>
      <td className="w-24 px-3 py-2 align-middle">
        {row.card_image_url?.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin may use any public card URL (not only configured Image hosts)
          <img
            src={row.card_image_url.trim()}
            alt=""
            className="aspect-video h-11 w-full max-w-[5.5rem] rounded-md bg-slate-100 object-cover ring-1 ring-slate-200"
            loading="lazy"
          />
        ) : (
          <span className="flex aspect-video h-11 max-w-[5.5rem] items-center justify-center rounded-md bg-slate-100 text-[10px] font-medium text-slate-400 ring-1 ring-slate-200">
            None
          </span>
        )}
      </td>
      <td className="px-4 py-3 font-medium">{row.title}</td>
      <td className="px-4 py-3 text-slate-600">{row.section?.trim() || "—"}</td>
      <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.id}</td>
      <td className="px-4 py-3">{row.published ? "Yes" : "No"}</td>
      <td className="px-4 py-3 text-slate-600">{formatGuideUpdatedAt(row.updated_at)}</td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/admin/guides/${encodeURIComponent(row.id)}/edit`}
          className="font-semibold text-[#3f6212] underline hover:text-[#84c126]"
        >
          Edit
        </Link>
      </td>
    </tr>
  );
}

function SectionSortableBlock({
  section,
  initialRows,
  onReorderError,
}: {
  section: string;
  initialRows: AdminGuideListRow[];
  onReorderError: (message: string) => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = useMemo(() => rows.map((r) => r.id), [rows]);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = rows.findIndex((r) => r.id === active.id);
      const newIndex = rows.findIndex((r) => r.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;

      const previous = rows;
      const next = arrayMove(rows, oldIndex, newIndex);
      const nextWithSort = next.map((r, i) => ({ ...r, sort_order: i * 10 }));
      setRows(nextWithSort);

      startTransition(() => {
        void reorderLearningGuidesInSectionAction(
          section,
          nextWithSort.map((r) => r.id),
        ).then((res) => {
          if (!res.ok) {
            setRows(previous);
            onReorderError(res.message);
            return;
          }
          router.refresh();
        });
      });
    },
    [rows, section, router, onReorderError, startTransition],
  );

  return (
    <div className="mb-10 last:mb-0">
      <h2 className="mb-3 font-display text-lg font-bold text-slate-900">{section}</h2>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <DndContext
            id={stableDndContextId(section)}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <table className="min-w-[52rem] w-full border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="w-10 px-2 py-3" aria-hidden />
                <th className="w-24 px-3 py-3">Card</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <SortableGuideRow key={r.id} row={r} />
                ))}
              </tbody>
            </SortableContext>
            </table>
          </DndContext>
        </div>
      </section>
      {isPending ? (
        <p className="mt-2 text-xs text-slate-500" aria-live="polite">
          Saving order…
        </p>
      ) : null}
    </div>
  );
}

export function AdminGuidesSortableTable({ rows }: { rows: AdminGuideListRow[] }) {
  const [reorderError, setReorderError] = useState<string | null>(null);
  const grouped = useMemo(() => groupRowsBySection(rows), [rows]);

  const onReorderError = useCallback((message: string) => {
    setReorderError(message);
  }, []);

  return (
    <div className="w-full min-w-0">
      {reorderError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {reorderError}{" "}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => setReorderError(null)}
          >
            Dismiss
          </button>
        </p>
      ) : null}
      {grouped.map(({ section, rows: sectionRows }) => (
        <SectionSortableBlock
          key={section}
          section={section}
          initialRows={sectionRows}
          onReorderError={onReorderError}
        />
      ))}
    </div>
  );
}
