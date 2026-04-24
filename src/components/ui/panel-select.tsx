"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown } from "lucide-react";

export type PanelSelectOption = Readonly<{ value: string; label: string }>;

type PanelSelectGroupContextValue = {
  openId: string | null;
  setOpenId: (id: string | null) => void;
};

const PanelSelectGroupContext = createContext<PanelSelectGroupContextValue | null>(null);

export function PanelSelectGroup({ children }: Readonly<{ children: React.ReactNode }>) {
  const [openId, setOpenId] = useState<string | null>(null);
  const value = useMemo(() => ({ openId, setOpenId }), [openId]);
  return (
    <PanelSelectGroupContext.Provider value={value}>{children}</PanelSelectGroupContext.Provider>
  );
}

const triggerClass =
  "flex min-h-11 w-full min-w-[10.5rem] items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-slate-300 hover:bg-slate-50/80 focus-visible:border-[#84c126] focus-visible:ring-2 focus-visible:ring-[#84c126]/30 data-[open=true]:border-[#84c126]/60 data-[open=true]:ring-2 data-[open=true]:ring-[#84c126]/25";

const listClass =
  "absolute left-0 right-0 top-full z-50 mt-1 max-h-56 min-w-full overflow-auto rounded-xl border border-slate-200/90 bg-white py-1 shadow-[0_10px_40px_-10px_rgba(15,23,42,0.25)] ring-1 ring-slate-900/5";

const optionBase =
  "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition";

export function PanelSelect({
  label,
  value,
  onChange,
  options,
  triggerMinWidth,
}: Readonly<{
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: readonly PanelSelectOption[];
  /** e.g. `min-w-[9rem]` for compact triggers */
  triggerMinWidth?: string;
}>) {
  const group = useContext(PanelSelectGroupContext);
  const instanceId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [localOpen, setLocalOpen] = useState(false);
  const open = group ? group.openId === instanceId : localOpen;

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? options[0],
    [options, value],
  );

  const close = useCallback(() => {
    if (group) group.setOpenId(null);
    else setLocalOpen(false);
  }, [group]);

  const toggle = useCallback(() => {
    if (group) {
      group.setOpenId(open ? null : instanceId);
    } else {
      setLocalOpen((o) => !o);
    }
  }, [group, open, instanceId]);

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t)) close();
    };
    document.addEventListener("pointerdown", onDocPointer, true);
    return () => document.removeEventListener("pointerdown", onDocPointer, true);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const triggerId = `${instanceId}-trigger`;

  return (
    <div ref={rootRef} className="relative flex min-w-0 flex-col gap-1">
      <span id={`${instanceId}-label`} className="text-xs font-semibold text-slate-500">
        {label}
      </span>
      <button
        type="button"
        id={triggerId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${instanceId}-label`}
        data-open={open}
        onClick={toggle}
        className={`${triggerClass} ${triggerMinWidth ?? ""}`}
      >
        <span className="min-w-0 truncate">{selected?.label ?? "—"}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-labelledby={`${instanceId}-label`}
          className={listClass}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value || "__empty__"} role="none" className="px-1">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    close();
                  }}
                  className={`${optionBase} rounded-lg ${
                    isSelected
                      ? "bg-[#ecfccb] font-semibold text-[#365314] hover:bg-[#e3f4b8]"
                      : "text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? "border-[#84c126] bg-[#84c126] text-white"
                          : "border-slate-200 bg-white"
                      }`}
                      aria-hidden
                    >
                      {isSelected ? <Check className="size-3" strokeWidth={3} /> : null}
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
