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
  migrateSceneIdFromStorage,
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
import {
  normalizeStageActor,
  type OllieAction,
  type ProjectPayload,
  type StageActor,
} from "@/types/ollie";
import { AvatarPickerModal } from "@/components/workspace/AvatarPickerModal";
import { GamificationPanel } from "@/components/workspace/GamificationPanel";
import { authEmailLocalPart } from "@/lib/auth/authEmailDomain";
import {
  getAvatarBySlug,
  isOllieAvatarSlug,
  type OllieAvatarId,
} from "@/lib/profiles/avatarAssets";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** Legacy id from older saves — migrated on load to {@link ACTOR_ROBOT_ID}. */
const LEGACY_ACTOR_OLLIE_ID = "actor-ollie";
const ACTOR_ROBOT_ID = "actor-robot";

const DEFAULT_STAGE_ACTORS: StageActor[] = [
  { id: ACTOR_ROBOT_ID, label: "Robot", costumeId: "robot" },
];

/** Main Blockly + canvas + kid-friendly toolbar — extend with new blocks in lib/blockly. */
export function OllieWorkspace() {
  const router = useRouter();
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<WorkspaceSvg | null>(null);
  const spriteWorkspacesRef = useRef<Record<string, Record<string, unknown>>>({});
  const p5Ref = useRef<P5CanvasHandle>(null);
  const [status, setStatus] = useState<string>("");
  const [blocklyInjectKey, setBlocklyInjectKey] = useState(0);
  const [initError, setInitError] = useState<string | null>(null);
  const [stageSceneId, setStageSceneId] = useState<OllieSceneId>(DEFAULT_SCENE_ID);
  const [actors, setActors] = useState<StageActor[]>(DEFAULT_STAGE_ACTORS);
  const [activeActorId, setActiveActorId] = useState<string>(ACTOR_ROBOT_ID);
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
    | { type: "sprite"; actorId: string; label: string }
  >(null);
  /** Profile username / codename for header (from `profiles` or synthetic email local part). */
  const [userCodename, setUserCodename] = useState<string | null>(null);
  const [avatarSlug, setAvatarSlug] = useState<OllieAvatarId | null>(null);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentStageScene =
    getSceneById(stageSceneId) ?? getSceneById(DEFAULT_SCENE_ID)!;
  const activeActor =
    actors.find((a) => a.id === activeActorId) ?? actors[0]!;
  const currentStageCostume =
    getCostumeById(activeActor.costumeId) ??
    getCostumeById(DEFAULT_COSTUME_ID)!;
  const headerAvatarAsset = getAvatarBySlug(avatarSlug);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    async function syncAccount() {
      const sb = getSupabaseBrowserClient();
      if (!sb) {
        setUserCodename(null);
        setAvatarSlug(null);
        return;
      }
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        setUserCodename(null);
        setAvatarSlug(null);
        return;
      }
      const { data: profile } = await sb
        .from("profiles")
        .select("username, avatar_slug")
        .eq("id", user.id)
        .maybeSingle();
      const fromProfile = profile?.username?.trim();
      setUserCodename(fromProfile || authEmailLocalPart(user.email));
      const rawSlug = profile?.avatar_slug;
      setAvatarSlug(isOllieAvatarSlug(rawSlug) ? rawSlug : null);
    }

    void syncAccount();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(() => {
      void syncAccount();
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function syncFullscreen() {
      const fs = document.fullscreenElement ?? (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement;
      setIsFullscreen(!!fs);
    }
    syncFullscreen();
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen as EventListener);
    };
  }, []);

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
        spriteWorkspacesRef.current[ACTOR_ROBOT_ID] =
          serialization.workspaces.save(ws) as Record<string, unknown>;
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
          label: `Sprite ${prev.length + 1}`,
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
    setActiveActorId(ACTOR_ROBOT_ID);
    setStageSceneId(DEFAULT_SCENE_ID);
    const xml = utils.xml.textToDom(DEFAULT_WORKSPACE_XML);
    Events.disable();
    ws.clear();
    Xml.clearWorkspaceAndLoadFromXml(xml, ws);
    Events.enable();
    spriteWorkspacesRef.current[ACTOR_ROBOT_ID] =
      serialization.workspaces.save(ws) as Record<string, unknown>;
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
    spriteWorkspacesRef.current[activeActorId] =
      serialization.workspaces.save(ws) as Record<string, unknown>;
    const workspacesByActorId = { ...spriteWorkspacesRef.current };
    const payload: ProjectPayload = {
      workspace: workspacesByActorId[activeActorId]!,
      workspacesByActorId,
      actors,
      sceneId: stageSceneId,
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

  const toggleFullscreen = useCallback(async () => {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void> | void;
      webkitFullscreenElement?: Element | null;
    };
    const root = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    try {
      if (document.fullscreenElement ?? doc.webkitFullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else await doc.webkitExitFullscreen?.();
      } else {
        if (root.requestFullscreen) await root.requestFullscreen();
        else await root.webkitRequestFullscreen?.();
      }
    } catch {
      /* denied or unsupported */
    }
  }, []);

  const saveAvatar = useCallback(async (id: OllieAvatarId) => {
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;
    const { error } = await sb
      .from("profiles")
      .update({ avatar_slug: id })
      .eq("id", user.id);
    if (!error) setAvatarSlug(id);
  }, []);

  const applyProjectPayload = useCallback((payload: ProjectPayload) => {
    const ws = workspaceRef.current;
    if (!ws) return;
    if (payload.workspacesByActorId && payload.actors?.length) {
      const wsRaw = { ...payload.workspacesByActorId };
      if (wsRaw[LEGACY_ACTOR_OLLIE_ID] && !wsRaw[ACTOR_ROBOT_ID]) {
        wsRaw[ACTOR_ROBOT_ID] = wsRaw[LEGACY_ACTOR_OLLIE_ID];
        delete wsRaw[LEGACY_ACTOR_OLLIE_ID];
      }
      const migratedActors = payload.actors.map((a) => {
        const n = normalizeStageActor(a);
        if (n.id === LEGACY_ACTOR_OLLIE_ID) {
          return {
            ...n,
            id: ACTOR_ROBOT_ID,
            label: n.label === "Ollie" ? "Robot" : n.label,
          };
        }
        return n;
      });
      setActors(migratedActors);
      spriteWorkspacesRef.current = wsRaw;
      const firstId = migratedActors[0].id;
      setActiveActorId(firstId);
      setStageSceneId(migrateSceneIdFromStorage(payload.sceneId));
      const blob =
        spriteWorkspacesRef.current[firstId] ?? getEmptyWorkspaceSave();
      Events.disable();
      ws.clear();
      serialization.workspaces.load(blob, ws, { recordUndo: false });
      Events.enable();
    } else {
      setActors(DEFAULT_STAGE_ACTORS);
      setActiveActorId(ACTOR_ROBOT_ID);
      setStageSceneId(migrateSceneIdFromStorage(payload.sceneId));
      Events.disable();
      ws.clear();
      serialization.workspaces.load(payload.workspace, ws, { recordUndo: false });
      Events.enable();
      spriteWorkspacesRef.current[ACTOR_ROBOT_ID] =
        serialization.workspaces.save(ws) as Record<string, unknown>;
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

        <div className="flex flex-wrap items-center justify-end gap-2 sm:ml-auto">
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
          {getSupabaseBrowserClient() ? (
            <div className="flex items-center gap-2 border-l border-[#e5e7eb] pl-2 sm:gap-3 sm:pl-3">
              <button
                type="button"
                onClick={async () => {
                  const s = getSupabaseBrowserClient();
                  await s?.auth.signOut();
                  router.push("/auth/login?next=/workspace");
                  router.refresh();
                }}
                title="Sign out"
                aria-label="Sign out"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#374151] shadow-sm transition hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
              >
                <SignOutIcon />
              </button>
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#374151] shadow-sm transition hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
              </button>
              <Link
                href="/settings"
                title="Settings"
                aria-label="Settings"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#374151] shadow-sm transition hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
              >
                <SettingsIcon />
              </Link>
              {userCodename ? (
                <div
                  className="flex min-w-0 items-center gap-2"
                  aria-label={`Signed in as ${userCodename}`}
                >
                  <span
                    className="max-w-[min(160px,36vw)] truncate text-sm font-semibold text-[#374151] sm:max-w-[200px]"
                    title={userCodename}
                  >
                    {userCodename}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAvatarPickerOpen(true)}
                    title="Change avatar"
                    aria-label="Change avatar"
                    className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#ecfccb] text-sm font-bold uppercase text-[#365314] ring-2 ring-[#84c126]/25 transition hover:ring-[#84c126] focus:outline-none focus-visible:ring-4"
                  >
                    {headerAvatarAsset ? (
                      <Image
                        src={headerAvatarAsset.src}
                        alt=""
                        width={36}
                        height={36}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span aria-hidden>{userCodename.slice(0, 1)}</span>
                    )}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
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
          <div className="flex h-[min(720px,72vh)] min-h-[520px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
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
                      <div className="flex flex-wrap gap-2">
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
                                "grid h-20 w-20 shrink-0 grid-rows-[1fr_auto] gap-1 rounded-xl border-2 p-2 text-[11px] font-semibold leading-tight",
                                sel
                                  ? "border-[#84c126] bg-[#f7fee7]"
                                  : "border-[#e5e7eb] bg-white",
                              ].join(" ")}
                            >
                              <div className="group relative min-h-0 w-full overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f1f5f9]">
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
                                    aria-label={`Remove ${actor.label}`}
                                    title="Remove sprite"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirm({
                                        type: "sprite",
                                        actorId: actor.id,
                                        label: actor.label,
                                      });
                                    }}
                                    className="absolute right-0 top-0 z-10 flex size-6 items-center justify-center rounded-bl-md rounded-tr-md border border-[#e5e7eb] bg-white/95 text-[#6b7280] shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:pointer-events-auto focus-visible:opacity-100 opacity-0 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100"
                                  >
                                    <ThumbnailTrashIcon className="size-3.5" />
                                  </button>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                onClick={() => switchActor(actor.id)}
                                className="w-full truncate px-0.5 text-center text-[11px] font-semibold leading-snug text-[#111827] transition hover:text-[#365314] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-1"
                                title={`${actor.label} — tap to edit code`}
                              >
                                {actor.label}
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
      <AvatarPickerModal
        open={avatarPickerOpen}
        onClose={() => setAvatarPickerOpen(false)}
        selectedId={avatarSlug}
        onSelect={(id) => void saveAvatar(id)}
      />
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
              ? `Remove “${deleteConfirm.label}”?`
              : ""
        }
        message={
          deleteConfirm?.type === "scene"
            ? "The stage will switch to the default white dots backdrop."
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

function SettingsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
      />
    </svg>
  );
}

function FullscreenEnterIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
      />
    </svg>
  );
}

function FullscreenExitIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
      />
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
