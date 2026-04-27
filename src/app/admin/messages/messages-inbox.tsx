"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { markContactInboxReadAction } from "@/app/admin/messages/actions";
import { dispatchAdminInboxUnreadRefresh } from "@/lib/admin/adminInboxUnreadEvent";

export type ContactInboxRow = {
  id: string;
  created_at: string;
  visitor_name: string;
  visitor_email: string;
  message: string;
  read_at: string | null;
  auth_user_id: string | null;
};

function previewText(body: string, max = 90): string {
  const oneLine = body.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1)}…`;
}

function formatListDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function MessagesInbox({ initialMessages }: { initialMessages: ContactInboxRow[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [selectedId, setSelectedId] = useState<string | null>(initialMessages[0]?.id ?? null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMessages(initialMessages);
    setSelectedId((prev) => {
      if (prev && initialMessages.some((m) => m.id === prev)) return prev;
      return initialMessages[0]?.id ?? null;
    });
  }, [initialMessages]);

  const selected = useMemo(
    () => messages.find((m) => m.id === selectedId) ?? null,
    [messages, selectedId],
  );

  const markReadOnServer = useCallback(
    (id: string) => {
      startTransition(() => {
        void markContactInboxReadAction(id, true).then((res) => {
          if (!res.ok) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id ? { ...m, read_at: new Date().toISOString() } : m,
            ),
          );
          dispatchAdminInboxUnreadRefresh();
        });
      });
    },
    [startTransition],
  );

  const selectMessage = useCallback(
    (m: ContactInboxRow) => {
      setSelectedId(m.id);
      if (!m.read_at) {
        markReadOnServer(m.id);
      }
    },
    [markReadOnServer],
  );

  const toggleRead = useCallback(() => {
    if (!selected) return;
    const nextRead = !selected.read_at;
    startTransition(() => {
      void markContactInboxReadAction(selected.id, nextRead).then((res) => {
        if (!res.ok) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === selected.id
              ? { ...m, read_at: nextRead ? new Date().toISOString() : null }
              : m,
          ),
        );
        dispatchAdminInboxUnreadRefresh();
      });
    });
  }, [selected, startTransition]);

  return (
    <div className="flex min-h-[min(70dvh,640px)] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:flex-row">
      <aside
        className="flex max-h-[40vh] w-full shrink-0 flex-col border-b border-slate-200 lg:max-h-none lg:w-[min(100%,320px)] lg:border-b-0 lg:border-r"
        aria-label="Message list"
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Inbox</p>
          <p className="mt-0.5 text-sm text-slate-600">{messages.length} message(s)</p>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-slate-500">No messages yet.</li>
          ) : (
            messages.map((m) => {
              const active = m.id === selectedId;
              const unread = !m.read_at;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => selectMessage(m)}
                    className={`w-full border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${
                      active ? "bg-[#ecfccb]/80 ring-1 ring-inset ring-[#84c126]/25" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`min-w-0 flex-1 truncate font-semibold text-slate-900 ${
                          unread ? "font-bold" : ""
                        }`}
                      >
                        {m.visitor_name}
                      </span>
                      {unread ? (
                        <span
                          className="mt-1 size-2 shrink-0 rounded-full bg-[#84c126]"
                          aria-label="Unread"
                        />
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{m.visitor_email}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-600">
                      {previewText(m.message)}
                    </p>
                    <p className="mt-1 text-[11px] tabular-nums text-slate-400">
                      {formatListDate(m.created_at)}
                    </p>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      <section
        className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-50/40"
        aria-label="Message detail"
      >
        {!selected ? (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
            Select a message
          </div>
        ) : (
          <>
            <header className="shrink-0 border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold text-slate-900">{selected.visitor_name}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    <a
                      className="font-medium text-[#3f6212] underline hover:text-[#84c126]"
                      href={`mailto:${encodeURIComponent(selected.visitor_email)}`}
                    >
                      {selected.visitor_email}
                    </a>
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-slate-500">
                    {formatListDate(selected.created_at)}
                    {selected.auth_user_id ? (
                      <span className="ml-2 text-slate-400">
                        · Signed-in user <span className="font-mono">{selected.auth_user_id}</span>
                      </span>
                    ) : (
                      <span className="ml-2 text-slate-400">· Guest</span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={toggleRead}
                  className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {selected.read_at ? "Mark unread" : "Mark read"}
                </button>
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800">
                  {selected.message}
                </pre>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
