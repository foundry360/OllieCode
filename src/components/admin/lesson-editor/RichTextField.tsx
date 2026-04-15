"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyleKit } from "@tiptap/extension-text-style/text-style-kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Strikethrough,
  Underline,
  Heading2,
  Heading3,
  Baseline,
} from "lucide-react";
import { embellishLessonColorWords } from "@/lib/lms/embellishLessonColorWords";
import { isTrivialLessonHtml } from "@/lib/lms/htmlContent";
import { sanitizeLessonBodyHtml } from "@/lib/lms/sanitizeLessonBodyHtml";

const toolbarBtn =
  "inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:pointer-events-none disabled:opacity-35";

const toolbarBtnActive =
  "border-[#84c126]/40 bg-[#ecfccb] text-[#365314] hover:bg-[#ecfccb]";

const FONT_FAMILIES: { label: string; value: string }[] = [
  { label: "Default", value: "" },
  { label: "Sans", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "ui-serif, Georgia, Cambria, serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
  {
    label: "Display",
    value: 'var(--font-fredoka), ui-sans-serif, sans-serif',
  },
];

const FONT_SIZES: { label: string; value: string }[] = [
  { label: "Size", value: "" },
  { label: "Small", value: "12px" },
  { label: "Normal", value: "14px" },
  { label: "Medium", value: "16px" },
  { label: "Large", value: "18px" },
  { label: "XL", value: "24px" },
];

const COLOR_PRESETS = [
  { label: "Default", value: "" },
  { label: "Body", value: "#334155" },
  { label: "Lime", value: "#84c126" },
  { label: "Blue", value: "#2563eb" },
  { label: "Red", value: "#dc2626" },
  { label: "Violet", value: "#7c3aed" },
];

const previewProseClass =
  "max-w-none text-sm leading-relaxed text-slate-700 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold";

type Props = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Show sanitized “color word” styling as on the lesson page (module detail). */
  learnerColorPreview?: boolean;
};

function RichTextToolbar({
  editor,
  disabled,
}: {
  editor: Editor;
  disabled: boolean;
}) {
  const state = useEditorState({
    editor,
    selector: (snap) => ({
      bold: snap.editor.isActive("bold"),
      italic: snap.editor.isActive("italic"),
      underline: snap.editor.isActive("underline"),
      strike: snap.editor.isActive("strike"),
      bulletList: snap.editor.isActive("bulletList"),
      orderedList: snap.editor.isActive("orderedList"),
      h2: snap.editor.isActive("heading", { level: 2 }),
      h3: snap.editor.isActive("heading", { level: 3 }),
      isLink: snap.editor.isActive("link"),
      attrs: snap.editor.getAttributes("textStyle") as {
        color?: string | null;
        fontFamily?: string | null;
        fontSize?: string | null;
      },
    }),
  });

  const setLink = () => {
    if (disabled) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    const t = url.trim();
    if (t === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: t, rel: "noopener noreferrer", target: "_blank" })
      .run();
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/90 px-2 py-1.5"
      role="toolbar"
      aria-label="Text formatting"
    >
      <select
        className="h-8 max-w-[7.5rem] rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-800 shadow-sm outline-none focus:border-[#84c126] focus:ring-2 focus:ring-[#84c126]/25 disabled:opacity-50"
        disabled={disabled}
        value={FONT_FAMILIES.find((f) => f.value === (state.attrs.fontFamily ?? ""))?.value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) {
            editor.chain().focus().unsetFontFamily().run();
          } else {
            editor.chain().focus().setFontFamily(v).run();
          }
        }}
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.label} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <select
        className="h-8 max-w-[5.5rem] rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-800 shadow-sm outline-none focus:border-[#84c126] focus:ring-2 focus:ring-[#84c126]/25 disabled:opacity-50"
        disabled={disabled}
        value={
          FONT_SIZES.find((s) => s.value === (state.attrs.fontSize ?? ""))
            ?.value ?? ""
        }
        onChange={(e) => {
          const v = e.target.value;
          if (!v) {
            editor.chain().focus().unsetFontSize().run();
          } else {
            editor.chain().focus().setFontSize(v).run();
          }
        }}
      >
        {FONT_SIZES.map((s) => (
          <option key={s.label} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <span className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:inline-block" aria-hidden />
      <select
        className="h-8 max-w-[6.5rem] rounded-lg border border-slate-200 bg-white px-1.5 text-xs font-medium text-slate-800 shadow-sm outline-none focus:border-[#84c126] focus:ring-2 focus:ring-[#84c126]/25 disabled:opacity-50"
        disabled={disabled}
        aria-label="Text color"
        value={(() => {
          const c = state.attrs.color ?? "";
          if (c === "" || COLOR_PRESETS.some((p) => p.value === c)) {
            return c;
          }
          return "__custom__";
        })()}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__custom__") return;
          if (!v) {
            editor.chain().focus().unsetColor().run();
          } else {
            editor.chain().focus().setColor(v).run();
          }
        }}
      >
        {COLOR_PRESETS.map((c) => (
          <option key={c.label} value={c.value}>
            {c.label}
          </option>
        ))}
        {state.attrs.color &&
        state.attrs.color !== "" &&
        !COLOR_PRESETS.some((p) => p.value === state.attrs.color) ? (
          <option value="__custom__">Custom</option>
        ) : null}
      </select>
      <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-1 shadow-sm hover:border-[#84c126]/50 disabled:opacity-50">
        <span className="sr-only">Custom color</span>
        <Baseline className="size-4 text-slate-500" strokeWidth={2} aria-hidden />
        <input
          type="color"
          disabled={disabled}
          className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
          value={
            /^#[0-9A-Fa-f]{6}$/.test(state.attrs.color ?? "")
              ? (state.attrs.color ?? "#334155")
              : "#334155"
          }
          onChange={(e) => {
            editor.chain().focus().setColor(e.target.value).run();
          }}
        />
      </label>
      <span className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:inline-block" aria-hidden />
      <button
        type="button"
        disabled={disabled}
        className={`${toolbarBtn} ${state.h2 ? toolbarBtnActive : ""}`}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        title="Heading 2"
      >
        <Heading2 className="size-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        disabled={disabled}
        className={`${toolbarBtn} ${state.h3 ? toolbarBtnActive : ""}`}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        title="Heading 3"
      >
        <Heading3 className="size-4" strokeWidth={2} />
      </button>
      <span className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:inline-block" aria-hidden />
      <button
        type="button"
        disabled={disabled}
        className={`${toolbarBtn} ${state.bold ? toolbarBtnActive : ""}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold className="size-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        disabled={disabled}
        className={`${toolbarBtn} ${state.italic ? toolbarBtnActive : ""}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic className="size-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        disabled={disabled}
        className={`${toolbarBtn} ${state.underline ? toolbarBtnActive : ""}`}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <Underline className="size-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        disabled={disabled}
        className={`${toolbarBtn} ${state.strike ? toolbarBtnActive : ""}`}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <Strikethrough className="size-4" strokeWidth={2} />
      </button>
      <span className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:inline-block" aria-hidden />
      <button
        type="button"
        disabled={disabled}
        className={`${toolbarBtn} ${state.bulletList ? toolbarBtnActive : ""}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        <List className="size-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        disabled={disabled}
        className={`${toolbarBtn} ${state.orderedList ? toolbarBtnActive : ""}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered list"
      >
        <ListOrdered className="size-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        disabled={disabled}
        className={`${toolbarBtn} ${state.isLink ? toolbarBtnActive : ""}`}
        onClick={setLink}
        title="Link"
      >
        <LinkIcon className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}

export function RichTextField({
  value,
  onChange,
  disabled = false,
  placeholder = "Write details for learners…",
  learnerColorPreview = false,
}: Props) {
  const lastEmitted = useRef<string | null>(null);

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          codeBlock: false,
          link: {
            openOnClick: false,
            autolink: true,
            HTMLAttributes: {
              class:
                "font-semibold text-[#84c126] underline underline-offset-2",
            },
          },
        }),
        TextStyleKit.configure({
          backgroundColor: false,
          lineHeight: false,
        }),
        Placeholder.configure({
          placeholder,
        }),
      ],
      content: value || "",
      editable: !disabled,
      editorProps: {
        attributes: {
          class:
            "max-w-none text-sm text-slate-900 focus:outline-none [&_a]:font-semibold [&_a]:text-[#84c126] [&_a]:underline",
        },
      },
      onUpdate: ({ editor: ed }) => {
        const html = ed.getHTML();
        lastEmitted.current = html;
        onChange(html);
      },
    },
    [disabled],
  );

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    if (value === lastEmitted.current) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
    lastEmitted.current = value || "";
  }, [editor, value]);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/[0.04] ${disabled ? "opacity-60" : ""}`}
    >
      {editor ? (
        <RichTextToolbar editor={editor} disabled={disabled} />
      ) : (
        <div className="h-10 border-b border-slate-200 bg-slate-50/90" />
      )}
      <EditorContent
        editor={editor}
        className="ollie-rich-text max-w-none px-1 pb-1 text-sm [&_.ProseMirror]:min-h-[140px] [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2.5 [&_.ProseMirror]:outline-none"
      />
      {learnerColorPreview && value && !isTrivialLessonHtml(value) ? (
        <div className="border-t border-slate-200 bg-[#f8fafc] px-3 py-2.5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Color preview (learner view)
          </p>
          <div
            className={previewProseClass}
            dangerouslySetInnerHTML={{
              __html: sanitizeLessonBodyHtml(
                embellishLessonColorWords(value),
              ),
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
