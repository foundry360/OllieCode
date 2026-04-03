"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Block,
  Events,
  Xml,
  common,
  inject,
  serialization,
  utils,
} from "blockly/core";
import type { WorkspaceSvg } from "blockly/core";
import { registerOllieBlocks } from "@/lib/blockly/ollieBlocks";
import { OLLIE_TOOLBOX } from "@/lib/blockly/toolbox";
import { executeWorkspace } from "@/lib/blockly/executeBlocks";
import { DEFAULT_WORKSPACE_XML } from "@/lib/workspace/defaultWorkspaceXml";
import { P5Canvas, type P5CanvasHandle } from "@/components/workspace/P5Canvas";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  downloadProjectJson,
  uploadProjectJson,
} from "@/lib/supabase/projectStorage";
import type { ProjectPayload } from "@/types/ollie";
import { MissionsSidebar } from "@/components/workspace/MissionsSidebar";
import { GamificationPanel } from "@/components/workspace/GamificationPanel";
import Link from "next/link";

/** Main Blockly + canvas + kid-friendly toolbar — extend with new blocks in lib/blockly. */
export function OllieWorkspace() {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<WorkspaceSvg | null>(null);
  const p5Ref = useRef<P5CanvasHandle>(null);
  const [status, setStatus] = useState<string>("");
  const [missionsOpen, setMissionsOpen] = useState(true);

  const initWorkspace = useCallback(() => {
    if (!blocklyDiv.current || workspaceRef.current) return;
    registerOllieBlocks();

    const ws = inject(blocklyDiv.current, {
      toolbox: OLLIE_TOOLBOX,
      renderer: "zelos",
      trashcan: true,
      zoom: {
        controls: true,
        wheel: true,
        pinch: true,
        startScale: 0.92,
        maxScale: 1.6,
        minScale: 0.5,
      },
      grid: {
        spacing: 20,
        length: 2,
        colour: "#e5e7eb",
        snap: true,
      },
      move: {
        scrollbars: true,
        drag: true,
        wheel: true,
      },
    });

    workspaceRef.current = ws;
    const xml = utils.xml.textToDom(DEFAULT_WORKSPACE_XML);
    Xml.clearWorkspaceAndLoadFromXml(xml, ws);
  }, []);

  useEffect(() => {
    initWorkspace();
    return () => {
      workspaceRef.current?.dispose();
      workspaceRef.current = null;
    };
  }, [initWorkspace]);

  const handleRun = useCallback(async () => {
    const ws = workspaceRef.current;
    const p5 = p5Ref.current;
    if (!ws || !p5) return;
    setStatus("Running…");
    p5.resetSprite();
    const actions = executeWorkspace(ws);
    await p5.runActions(actions);
    setStatus("Done!");
    setTimeout(() => setStatus(""), 2000);
  }, []);

  const handleReset = useCallback(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
    Events.disable();
    ws.clear();
    Events.enable();
    const xml = utils.xml.textToDom(DEFAULT_WORKSPACE_XML);
    Xml.clearWorkspaceAndLoadFromXml(xml, ws);
    p5Ref.current?.resetSprite();
    setStatus("Workspace reset");
    setTimeout(() => setStatus(""), 1500);
  }, []);

  const handleUndo = useCallback(() => {
    workspaceRef.current?.undo(false);
  }, []);

  const handleRedo = useCallback(() => {
    workspaceRef.current?.undo(true);
  }, []);

  /**
   * Duplicate selected block — Blockly also supports this from the block context menu.
   * Future: plug into Blockly shortcuts registry for keyboard duplicate.
   */
  const handleDuplicate = useCallback(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
    const selected = common.getSelected();
    if (!selected || !(selected instanceof Block) || selected.isShadow()) return;
    const dom = Xml.blockToDomWithXY(selected);
    const el =
      dom instanceof Element
        ? dom
        : dom instanceof DocumentFragment
          ? dom.firstElementChild
          : null;
    if (!el) return;
    const newBlock = Xml.domToBlock(el, ws);
    newBlock.moveBy(32, 32);
  }, []);

  const handleSave = useCallback(async () => {
    const ws = workspaceRef.current;
    if (!ws) return;
    const state = serialization.workspaces.save(ws);
    const payload: ProjectPayload = {
      workspace: state,
      name: "My Ollie Project",
      updatedAt: new Date().toISOString(),
    };

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      try {
        localStorage.setItem(
          "ollie-project-local",
          JSON.stringify(payload),
        );
        setStatus("Saved locally (add Supabase env for cloud save)");
      } catch {
        setStatus("Could not save");
      }
      setTimeout(() => setStatus(""), 3000);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("Sign in to save to the cloud");
      setTimeout(() => setStatus(""), 3000);
      return;
    }

    const projectId = "default";
    const { error } = await uploadProjectJson(
      supabase,
      user.id,
      projectId,
      payload,
    );
    setStatus(error ? `Save failed: ${error.message}` : "Saved to cloud!");
    setTimeout(() => setStatus(""), 3000);
  }, []);

  const handleLoad = useCallback(async () => {
    const ws = workspaceRef.current;
    if (!ws) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      const raw = localStorage.getItem("ollie-project-local");
      if (!raw) {
        setStatus("No local project");
        setTimeout(() => setStatus(""), 2000);
        return;
      }
      try {
        const payload = JSON.parse(raw) as ProjectPayload;
        serialization.workspaces.load(payload.workspace, ws, { recordUndo: false });
        setStatus("Loaded from browser");
      } catch {
        setStatus("Bad project data");
      }
      setTimeout(() => setStatus(""), 2500);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("Sign in to load from cloud");
      setTimeout(() => setStatus(""), 3000);
      return;
    }

    const { data, error } = await downloadProjectJson(
      supabase,
      user.id,
      "default",
    );
    if (error || !data) {
      setStatus(error?.message ?? "Nothing saved yet");
      setTimeout(() => setStatus(""), 3000);
      return;
    }
    serialization.workspaces.load(data.workspace, ws, { recordUndo: false });
    setStatus("Loaded!");
    setTimeout(() => setStatus(""), 2000);
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f8fafc] text-[#111827]">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-display text-xl font-bold tracking-tight text-[#111827]"
          >
            Ollie Code
          </Link>
          <span className="hidden rounded-full bg-[#ecfccb] px-3 py-1 text-xs font-semibold text-[#3f6212] sm:inline">
            Learn &amp; play
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton onClick={handleRun} variant="primary">
            Run
          </ToolbarButton>
          <ToolbarButton onClick={handleSave}>Save</ToolbarButton>
          <ToolbarButton onClick={handleLoad}>Load</ToolbarButton>
          <ToolbarButton onClick={handleReset}>Reset</ToolbarButton>
          <ToolbarButton onClick={handleUndo} title="Undo">
            Undo
          </ToolbarButton>
          <ToolbarButton onClick={handleRedo} title="Redo">
            Redo
          </ToolbarButton>
          <ToolbarButton onClick={handleDuplicate} title="Duplicate selected block">
            Duplicate
          </ToolbarButton>
          <button
            type="button"
            onClick={() => setMissionsOpen((o) => !o)}
            className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-semibold text-[#111827] shadow-sm"
          >
            {missionsOpen ? "Hide" : "Show"} missions
          </button>
        </div>

        {status ? (
          <p
            className="w-full text-center text-sm text-[#374151] sm:w-auto sm:text-left"
            role="status"
          >
            {status}
          </p>
        ) : null}
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside
          className={`border-[#e5e7eb] bg-white lg:w-72 lg:border-r ${missionsOpen ? "flex" : "hidden lg:flex"}`}
        >
          <MissionsSidebar />
        </aside>

        <main className="flex min-h-0 flex-1 flex-col gap-3 p-3 lg:flex-row">
          <div className="flex min-h-[50vh] min-w-0 flex-1 flex-col rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
            <div className="rounded-t-2xl border-b border-[#e5e7eb] bg-[#ecfccb] px-4 py-2 text-sm font-semibold text-[#365314]">
              Code blocks
            </div>
            <div ref={blocklyDiv} className="min-h-[420px] flex-1" />
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-[420px] lg:max-w-[42vw]">
            <div className="flex min-h-[240px] flex-1 flex-col overflow-hidden rounded-2xl border border-[#c5d4b8] bg-[#e2ecdc] shadow-sm">
              <div className="flex items-center justify-between border-b border-[#b8c9a8] bg-[#d8e8d0] px-4 py-2 text-sm font-semibold text-[#365314]">
                <span>Canvas</span>
                <span className="text-xs font-normal text-[#4d6b2f]">
                  p5.js preview
                </span>
              </div>
              <P5Canvas
                ref={p5Ref}
                className="h-[min(50vh,360px)] w-full min-h-[200px] lg:h-[360px]"
              />
            </div>
            <GamificationPanel />
          </div>
        </main>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  title,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  variant?: "primary";
}) {
  const base =
    "rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2";
  const styles =
    variant === "primary"
      ? "bg-[#84c126] text-white hover:bg-[#6fa020]"
      : "border border-[#e5e7eb] bg-white text-[#111827] hover:bg-[#f9fafb]";
  return (
    <button type="button" title={title} onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}
