"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Block,
  Events,
  Scrollbar,
  Xml,
  common,
  inject,
  serialization,
  utils,
} from "blockly/core";
import type { WorkspaceSvg } from "blockly/core";
import { initBlocklyLocale } from "@/lib/blockly/initBlocklyLocale";
import { loadBlocklyLibraryBlocks } from "@/lib/blockly/registerLibraryBlocks";
import { registerOllieBlocks } from "@/lib/blockly/ollieBlocks";
import { ollieBlocklyTheme } from "@/lib/blockly/ollieTheme";
import {
  HIDE_FLYOUT_SCROLLBAR_VISUAL,
  HIDE_MAIN_WORKSPACE_SCROLLBAR_VISUAL,
  HIDE_TOOLBOX_SCROLLBAR_VISUAL,
} from "@/lib/blockly/blocklyUiOptions";
import { OLLIE_TOOLBOX } from "@/lib/blockly/toolbox";
import { executeWorkspaceFromSave } from "@/lib/blockly/executeBlocks";
import { getEmptyWorkspaceSave } from "@/lib/blockly/emptyWorkspaceState";
import { DEFAULT_WORKSPACE_XML } from "@/lib/workspace/defaultWorkspaceXml";
import { EMPTY_START_WORKSPACE_XML } from "@/lib/workspace/emptyStartWorkspaceXml";
import {
  DEFAULT_COSTUME_ID,
  DEFAULT_SCENE_ID,
  getCostumeById,
  getSceneById,
} from "@/lib/canvas/stageAssets";
import type { OllieSceneId, OllieSpriteCostumeId } from "@/lib/canvas/stageAssets";
import { P5Canvas, type P5CanvasHandle } from "@/components/workspace/P5Canvas";
import { ScenePickerModal } from "@/components/workspace/ScenePickerModal";
import { ScenePreview } from "@/components/workspace/ScenePreview";
import { ConfirmDeleteModal } from "@/components/workspace/ConfirmDeleteModal";
import { SpritePickerModal } from "@/components/workspace/SpritePickerModal";
import { SpritePreview } from "@/components/workspace/SpritePreview";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  downloadProjectJson,
  uploadProjectJson,
} from "@/lib/supabase/projectStorage";
import type { OllieAction, ProjectPayload, StageActor } from "@/types/ollie";
import { GamificationPanel } from "@/components/workspace/GamificationPanel";
import Link from "next/link";

const ACTOR_GIRL_ID = "actor-girl";
const ACTOR_DOG_ID = "actor-dog";

const DEFAULT_STAGE_ACTORS: StageActor[] = [
  { id: ACTOR_GIRL_ID, name: "Girl", costumeId: "cat" },
  { id: ACTOR_DOG_ID, name: "Dog", costumeId: "ball" },
];

/** Main Blockly + canvas + kid-friendly toolbar — extend with new blocks in lib/blockly. */
export function OllieWorkspace() {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<WorkspaceSvg | null>(null);
  const spriteWorkspacesRef = useRef<Record<string, Record<string, unknown>>>({});
  const p5Ref = useRef<P5CanvasHandle>(null);
  const [status, setStatus] = useState<string>("");
  const [blocklyInjectKey, setBlocklyInjectKey] = useState(0);
  const [initError, setInitError] = useState<string | null>(null);
  const [stageSceneId, setStageSceneId] = useState<OllieSceneId>(DEFAULT_SCENE_ID);
  const [actors, setActors] = useState<StageActor[]>(DEFAULT_STAGE_ACTORS);
  const [activeActorId, setActiveActorId] = useState<string>(ACTOR_GIRL_ID);
  const [scenePickerOpen, setScenePickerOpen] = useState(false);
  const [spritePickerOpen, setSpritePickerOpen] = useState(false);
  /** Set immediately before opening the modal so onSelect is never stale vs. intent. */
  const spritePickerIntentRef = useRef<"costume" | "new">("costume");
  const [openStagePanel, setOpenStagePanel] = useState<"scene" | "sprite">(
    "scene",
  );
  const [deleteConfirm, setDeleteConfirm] = useState<
    | null
    | { type: "scene" }
    | { type: "sprite"; actorId: string; name: string }
  >(null);

  const currentStageScene =
    getSceneById(stageSceneId) ?? getSceneById(DEFAULT_SCENE_ID)!;
  const activeActor =
    actors.find((a) => a.id === activeActorId) ?? actors[0]!;
  const currentStageCostume =
    getCostumeById(activeActor.costumeId) ??
    getCostumeById(DEFAULT_COSTUME_ID)!;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setInitError(null);
      try {
        initBlocklyLocale();
        await loadBlocklyLibraryBlocks();
        if (cancelled || !blocklyDiv.current || workspaceRef.current) {
          return;
        }

        registerOllieBlocks();

        /** Blockly SVG scrollbars — slightly narrower than default 15px. */
        Scrollbar.scrollbarThickness = 11;

        const ws = inject(blocklyDiv.current, {
          toolbox: OLLIE_TOOLBOX,
          theme: ollieBlocklyTheme,
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
          move: {
            /** Vertical only — avoids a persistent bottom “strip” after toolbox/flyout closes (Blockly forces scrollbars visible). */
            scrollbars: { horizontal: false, vertical: true },
            drag: true,
            wheel: true,
          },
        });

        if (cancelled) {
          ws.dispose();
          return;
        }

        workspaceRef.current = ws;

        const xml = utils.xml.textToDom(DEFAULT_WORKSPACE_XML);
        Xml.clearWorkspaceAndLoadFromXml(xml, ws);
        spriteWorkspacesRef.current[ACTOR_GIRL_ID] =
          serialization.workspaces.save(ws) as Record<string, unknown>;
        spriteWorkspacesRef.current[ACTOR_DOG_ID] = getEmptyWorkspaceSave();
      } catch (err) {
        if (!cancelled) {
          setInitError(
            err instanceof Error ? err.message : "Something went wrong starting Blockly.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      workspaceRef.current?.dispose();
      workspaceRef.current = null;
    };
  }, [blocklyInjectKey]);

  const switchActor = useCallback(
    (nextId: string) => {
      const ws = workspaceRef.current;
      if (!ws || nextId === activeActorId) return;
      spriteWorkspacesRef.current[activeActorId] =
        serialization.workspaces.save(ws) as Record<string, unknown>;
      setActiveActorId(nextId);
      const saved = spriteWorkspacesRef.current[nextId];
      Events.disable();
      ws.clear();
      if (saved && Object.keys(saved).length > 0) {
        serialization.workspaces.load(saved, ws, { recordUndo: false });
      } else {
        Xml.clearWorkspaceAndLoadFromXml(
          utils.xml.textToDom(EMPTY_START_WORKSPACE_XML),
          ws,
        );
      }
      Events.enable();
    },
    [activeActorId],
  );

  const confirmRemoveScene = useCallback(() => {
    setStageSceneId(DEFAULT_SCENE_ID);
    setDeleteConfirm(null);
  }, []);

  const confirmRemoveSprite = useCallback(
    (actorId: string) => {
      const ws = workspaceRef.current;
      if (!ws) return;
      if (actors.length <= 1) {
        setDeleteConfirm(null);
        return;
      }
      spriteWorkspacesRef.current[activeActorId] =
        serialization.workspaces.save(ws) as Record<string, unknown>;
      delete spriteWorkspacesRef.current[actorId];
      const nextActors = actors.filter((a) => a.id !== actorId);
      setActors(nextActors);
      if (activeActorId === actorId) {
        const nextId = nextActors[0]!.id;
        setActiveActorId(nextId);
        const saved = spriteWorkspacesRef.current[nextId];
        Events.disable();
        ws.clear();
        if (saved && Object.keys(saved).length > 0) {
          serialization.workspaces.load(saved, ws, { recordUndo: false });
        } else {
          Xml.clearWorkspaceAndLoadFromXml(
            utils.xml.textToDom(EMPTY_START_WORKSPACE_XML),
            ws,
          );
        }
        Events.enable();
      }
      setDeleteConfirm(null);
    },
    [actors, activeActorId],
  );

  const addSpriteWithCostume = useCallback(
    (costumeId: OllieSpriteCostumeId) => {
      const ws = workspaceRef.current;
      if (!ws) return;
      spriteWorkspacesRef.current[activeActorId] =
        serialization.workspaces.save(ws) as Record<string, unknown>;
      const newId = `actor-${Date.now()}`;
      setActors((prev) => [
        ...prev,
        {
          id: newId,
          name: `Sprite ${prev.length + 1}`,
          costumeId,
        },
      ]);
      spriteWorkspacesRef.current[newId] = getEmptyWorkspaceSave();
      setActiveActorId(newId);
      Events.disable();
      ws.clear();
      Xml.clearWorkspaceAndLoadFromXml(
        utils.xml.textToDom(EMPTY_START_WORKSPACE_XML),
        ws,
      );
      Events.enable();
    },
    [activeActorId],
  );

  const handleRun = useCallback(async () => {
    const ws = workspaceRef.current;
    const p5 = p5Ref.current;
    if (!ws || !p5) return;
    setStatus("Running…");
    spriteWorkspacesRef.current[activeActorId] =
      serialization.workspaces.save(ws) as Record<string, unknown>;
    const bundles = actors.map((actor) => {
      const raw = spriteWorkspacesRef.current[actor.id];
      let actions: OllieAction[] = [];
      if (raw && Object.keys(raw).length > 0) {
        try {
          actions = executeWorkspaceFromSave(raw);
        } catch {
          actions = [];
        }
      }
      return { spriteId: actor.id, actions };
    });
    p5.resetSprite();
    await p5.runParallel(bundles);
    setStatus("Done!");
    setTimeout(() => setStatus(""), 2000);
  }, [actors, activeActorId]);

  const handleReset = useCallback(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
    setActors(DEFAULT_STAGE_ACTORS);
    setActiveActorId(ACTOR_GIRL_ID);
    setStageSceneId(DEFAULT_SCENE_ID);
    const xml = utils.xml.textToDom(DEFAULT_WORKSPACE_XML);
    Events.disable();
    ws.clear();
    Xml.clearWorkspaceAndLoadFromXml(xml, ws);
    Events.enable();
    spriteWorkspacesRef.current[ACTOR_GIRL_ID] =
      serialization.workspaces.save(ws) as Record<string, unknown>;
    spriteWorkspacesRef.current[ACTOR_DOG_ID] = getEmptyWorkspaceSave();
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
  }, [actors, activeActorId, stageSceneId]);

  const applyProjectPayload = useCallback((payload: ProjectPayload) => {
    const ws = workspaceRef.current;
    if (!ws) return;
    if (payload.workspacesByActorId && payload.actors?.length) {
      setActors(payload.actors);
      spriteWorkspacesRef.current = { ...payload.workspacesByActorId };
      const firstId = payload.actors[0].id;
      setActiveActorId(firstId);
      setStageSceneId(payload.sceneId ?? DEFAULT_SCENE_ID);
      const blob =
        spriteWorkspacesRef.current[firstId] ?? getEmptyWorkspaceSave();
      Events.disable();
      ws.clear();
      serialization.workspaces.load(blob, ws, { recordUndo: false });
      Events.enable();
    } else {
      setActors(DEFAULT_STAGE_ACTORS);
      setActiveActorId(ACTOR_GIRL_ID);
      setStageSceneId(payload.sceneId ?? DEFAULT_SCENE_ID);
      Events.disable();
      ws.clear();
      serialization.workspaces.load(payload.workspace, ws, { recordUndo: false });
      Events.enable();
      spriteWorkspacesRef.current[ACTOR_GIRL_ID] =
        serialization.workspaces.save(ws) as Record<string, unknown>;
      spriteWorkspacesRef.current[ACTOR_DOG_ID] = getEmptyWorkspaceSave();
    }
    p5Ref.current?.resetSprite();
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
        applyProjectPayload(payload);
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
    applyProjectPayload(data);
    setStatus("Loaded!");
    setTimeout(() => setStatus(""), 2000);
  }, [applyProjectPayload]);

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

      {initError ? (
        <div
          className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950"
          role="alert"
        >
          <p className="font-semibold">Couldn’t start the block editor</p>
          <p className="mt-1 opacity-90">{initError}</p>
          <button
            type="button"
            onClick={() => setBlocklyInjectKey((k) => k + 1)}
            className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-900 shadow-sm hover:bg-red-50"
          >
            Try again
          </button>
        </div>
      ) : null}

      <main className="flex min-h-0 flex-1 flex-col gap-3 p-3 lg:flex-row">
        <div className="flex min-h-[50vh] min-w-0 flex-1 flex-col rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="rounded-t-2xl border-b border-[#e5e7eb] bg-[#ecfccb] px-4 py-2 text-sm font-semibold text-[#365314]">
            Workspace
          </div>
          <div
            key={blocklyInjectKey}
            ref={blocklyDiv}
            className={[
              "ollie-blockly-host min-h-[480px] flex-1",
              HIDE_FLYOUT_SCROLLBAR_VISUAL ? "ollie-blockly--hide-flyout-scrollbar" : "",
              HIDE_TOOLBOX_SCROLLBAR_VISUAL ? "ollie-blockly--hide-toolbox-scrollbar" : "",
              HIDE_MAIN_WORKSPACE_SCROLLBAR_VISUAL ? "ollie-blockly--hide-main-scrollbar" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        </div>

        <div className="flex min-h-0 w-full flex-col gap-3 lg:w-[420px] lg:max-w-[42vw]">
          <div className="flex h-[min(560px,62vh)] min-h-[420px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
            <div className="shrink-0 rounded-t-2xl border-b border-[#e5e7eb] bg-[#ecfccb] px-4 py-2 text-sm font-semibold text-[#365314]">
              Canvas
            </div>
            <P5Canvas
              ref={p5Ref}
              className="min-h-0 w-full flex-1"
              sceneId={stageSceneId}
              actors={actors.map((a) => ({
                id: a.id,
                costumeId: a.costumeId,
              }))}
              onSceneChange={setStageSceneId}
              onActorCostumeChange={(actorId, costumeId) =>
                setActors((prev) =>
                  prev.map((a) =>
                    a.id === actorId ? { ...a, costumeId } : a,
                  ),
                )
              }
            />
            <div className="shrink-0 border-t border-[#e5e7eb] bg-[#f8fafc] px-2 py-1">
              <div className="divide-y divide-[#e5e7eb]">
                <div>
                  <button
                    type="button"
                    id="ollie-stage-accordion-scene"
                    aria-expanded={openStagePanel === "scene"}
                    aria-controls="ollie-stage-accordion-scene-panel"
                    onClick={() => setOpenStagePanel("scene")}
                    className="flex w-full items-center justify-between gap-2 px-2 py-2.5 text-left text-xs font-semibold text-[#374151] transition hover:bg-[#f1f5f9] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#84c126]"
                  >
                    Scene
                    <StageAccordionChevron open={openStagePanel === "scene"} />
                  </button>
                  {openStagePanel === "scene" ? (
                    <div
                      id="ollie-stage-accordion-scene-panel"
                      role="region"
                      aria-labelledby="ollie-stage-accordion-scene"
                      className="flex flex-col gap-1.5 px-2 pb-3 pt-0"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f1f5f9] shadow-sm"
                          title={currentStageScene.label}
                        >
                          <ScenePreview scene={currentStageScene} />
                          {stageSceneId !== DEFAULT_SCENE_ID ? (
                            <button
                              type="button"
                              aria-label="Remove backdrop"
                              title="Remove backdrop"
                              onClick={() => setDeleteConfirm({ type: "scene" })}
                              className="absolute right-0.5 top-0.5 z-10 flex size-6 items-center justify-center rounded-md border border-[#e5e7eb] bg-white/95 text-[#6b7280] shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:pointer-events-auto focus-visible:opacity-100 opacity-0 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100"
                            >
                              <ThumbnailTrashIcon className="size-3.5" />
                            </button>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => setScenePickerOpen(true)}
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] text-2xl font-light leading-none text-[#9ca3af] transition hover:bg-[#e8eaed] hover:text-[#6b7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
                          aria-label="Choose a scene"
                          title="Choose a scene"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div>
                  <button
                    type="button"
                    id="ollie-stage-accordion-sprite"
                    aria-expanded={openStagePanel === "sprite"}
                    aria-controls="ollie-stage-accordion-sprite-panel"
                    onClick={() => setOpenStagePanel("sprite")}
                    className="flex w-full items-center justify-between gap-2 px-2 py-2.5 text-left text-xs font-semibold text-[#374151] transition hover:bg-[#f1f5f9] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#84c126]"
                  >
                    Sprites
                    <StageAccordionChevron open={openStagePanel === "sprite"} />
                  </button>
                  {openStagePanel === "sprite" ? (
                    <div
                      id="ollie-stage-accordion-sprite-panel"
                      role="region"
                      aria-labelledby="ollie-stage-accordion-sprite"
                      className="flex flex-col gap-2 px-2 pb-3 pt-0"
                    >
                      <div className="flex flex-wrap gap-1.5">
                        {actors.map((actor) => {
                          const c =
                            getCostumeById(actor.costumeId) ??
                            getCostumeById(DEFAULT_COSTUME_ID)!;
                          const sel = actor.id === activeActorId;
                          const canRemoveSprite = actors.length > 1;
                          return (
                            <div
                              key={actor.id}
                              className={[
                                "flex max-w-[5.5rem] items-center gap-1 rounded-lg border-2 px-1 py-1 text-left text-[10px] font-semibold leading-tight",
                                sel
                                  ? "border-[#84c126] bg-[#f7fee7]"
                                  : "border-[#e5e7eb] bg-white",
                              ].join(" ")}
                            >
                              <div className="group relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-[#e5e7eb] bg-[#f1f5f9]">
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  onClick={() => switchActor(actor.id)}
                                  className="absolute inset-0 z-0 flex items-center justify-center focus:outline-none"
                                  aria-hidden
                                />
                                <div className="pointer-events-none flex h-full w-full items-center justify-center">
                                  <SpritePreview costume={c} />
                                </div>
                                {canRemoveSprite ? (
                                  <button
                                    type="button"
                                    aria-label={`Remove ${actor.name}`}
                                    title="Remove sprite"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirm({
                                        type: "sprite",
                                        actorId: actor.id,
                                        name: actor.name,
                                      });
                                    }}
                                    className="absolute right-0 top-0 z-10 flex size-[18px] items-center justify-center rounded-bl-md rounded-tr-md border border-[#e5e7eb] bg-white/95 text-[#6b7280] shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:pointer-events-auto focus-visible:opacity-100 opacity-0 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100"
                                  >
                                    <ThumbnailTrashIcon className="size-2.5" />
                                  </button>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                onClick={() => switchActor(actor.id)}
                                className="min-w-0 flex-1 truncate text-left text-[10px] font-semibold leading-tight text-[#111827] transition hover:text-[#365314] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-1"
                                title={`${actor.name} — tap to edit code`}
                              >
                                {actor.name}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-[#e5e7eb] pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            spritePickerIntentRef.current = "costume";
                            setSpritePickerOpen(true);
                          }}
                          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f1f5f9] shadow-sm transition hover:border-[#cbd5e1] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
                          title={`${currentStageCostume.label} — tap to change costume`}
                          aria-label="Change costume for selected sprite"
                        >
                          <SpritePreview costume={currentStageCostume} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            spritePickerIntentRef.current = "new";
                            setSpritePickerOpen(true);
                          }}
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] text-2xl font-light leading-none text-[#9ca3af] transition hover:bg-[#e8eaed] hover:text-[#6b7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
                          aria-label="Add a new sprite"
                          title="Add sprite"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <GamificationPanel />
        </div>
      </main>
      <ScenePickerModal
        open={scenePickerOpen}
        onClose={() => setScenePickerOpen(false)}
        selectedId={stageSceneId}
        onSelect={setStageSceneId}
      />
      <SpritePickerModal
        open={spritePickerOpen}
        onClose={() => setSpritePickerOpen(false)}
        selectedId={
          spritePickerIntentRef.current === "costume"
            ? activeActor.costumeId
            : null
        }
        onSelect={(id) => {
          if (spritePickerIntentRef.current === "new") {
            addSpriteWithCostume(id);
          } else {
            setActors((prev) =>
              prev.map((a) =>
                a.id === activeActorId ? { ...a, costumeId: id } : a,
              ),
            );
          }
          setSpritePickerOpen(false);
        }}
      />
      <ConfirmDeleteModal
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title={
          deleteConfirm?.type === "scene"
            ? "Reset backdrop?"
            : deleteConfirm?.type === "sprite"
              ? `Remove “${deleteConfirm.name}”?`
              : ""
        }
        message={
          deleteConfirm?.type === "scene"
            ? "The stage will switch to the default white grid backdrop."
            : deleteConfirm?.type === "sprite"
              ? "Their code blocks will be removed. This can’t be undone."
              : ""
        }
        confirmLabel={deleteConfirm?.type === "scene" ? "Reset" : "Remove"}
        onConfirm={() => {
          if (deleteConfirm?.type === "scene") confirmRemoveScene();
          else if (deleteConfirm?.type === "sprite")
            confirmRemoveSprite(deleteConfirm.actorId);
        }}
      />
    </div>
  );
}

function ThumbnailTrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function StageAccordionChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-[#6b7280] transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
