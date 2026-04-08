"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { useIsClient } from "@/hooks/useIsClient";
import {
  Block,
  Events,
  Scrollbar,
  Xml,
  common,
  dialog,
  inject,
  serialization,
  svgResize,
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
import {
  extractSpriteScriptPlan,
  extractSpriteScriptPlanFromSave,
} from "@/lib/blockly/executeBlocks";
import { getEmptyWorkspaceSave } from "@/lib/blockly/emptyWorkspaceState";
import { DEFAULT_WORKSPACE_XML } from "@/lib/workspace/defaultWorkspaceXml";
import { EMPTY_START_WORKSPACE_XML } from "@/lib/workspace/emptyStartWorkspaceXml";
import {
  DEFAULT_COSTUME_ID,
  DEFAULT_SCENE_ID,
  getCostumeById,
  getSceneById,
  migrateSceneIdFromStorage,
  normalizeSceneLayerIdsFromPayload,
} from "@/lib/canvas/stageAssets";
import type { OllieSceneId, OllieSpriteCostumeId } from "@/lib/canvas/stageAssets";
import { P5Canvas, type P5CanvasHandle } from "@/components/workspace/P5Canvas";
import { ScenePickerModal } from "@/components/workspace/ScenePickerModal";
import { ScenePreview } from "@/components/workspace/ScenePreview";
import { ConfirmDeleteModal } from "@/components/workspace/ConfirmDeleteModal";
import { DeleteMissionModal } from "@/components/workspace/DeleteMissionModal";
import { MissionCompleteModal } from "@/components/workspace/MissionCompleteModal";
import { SaveMissionNameModal } from "@/components/workspace/SaveMissionNameModal";
import { SavedMissionsModal } from "@/components/workspace/SavedMissionsModal";
import { SpritePickerModal } from "@/components/workspace/SpritePickerModal";
import { SpritePreview } from "@/components/workspace/SpritePreview";
import {
  clearMissionProjectSnapshotLocal,
  createCustomMissionId,
  getMissionById,
  getSavedMissionProgress,
  loadMissionProjectSnapshotLocal,
  mergeMissionProgressIntoStorage,
  missionCloudProjectId,
  MISSIONS,
  recordMissionSaved,
  removeSavedMissionProgressEntry,
  storeMissionProjectSnapshotLocal,
} from "@/lib/missions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  deleteProjectJson,
  downloadProjectJson,
  uploadProjectJson,
} from "@/lib/supabase/projectStorage";
import {
  deleteSavedMissionProgress,
  fetchSavedMissionProgress,
  upsertSavedMissionProgress,
} from "@/lib/supabase/savedMissionProgress";
import {
  normalizeStageActor,
  type SpriteScriptPlan,
  type ProjectPayload,
  type SavedMissionProgressEntry,
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
import {
  ChevronDown,
  CopyPlus,
  Briefcase,
  LogOut,
  Plus,
  Maximize2,
  Minimize2,
  Play,
  Redo,
  Square,
  RotateCcw,
  Save,
  Settings,
  Trash2,
  Undo,
  Upload,
  X,
  Braces,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const ICON_SM = "size-5 shrink-0";
const ICON_STROKE = 2;

/** Legacy id from older saves — migrated on load to {@link ACTOR_ROBOT_ID}. */
const LEGACY_ACTOR_OLLIE_ID = "actor-ollie";
const ACTOR_ROBOT_ID = "actor-robot";

const DEFAULT_STAGE_ACTORS: StageActor[] = [
  { id: ACTOR_ROBOT_ID, label: "Ollie", costumeId: "olliebot" },
];

/** Main Blockly + canvas + kid-friendly toolbar — extend with new blocks in lib/blockly. */
export function OllieWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const missionIdParam = searchParams.get("mission");
  const activeMission = missionIdParam
    ? getMissionById(missionIdParam)
    : undefined;
  /** Mission used when naming a save: URL mission, or the first catalog mission on plain `/workspace`. */
  const missionForSave = useMemo(
    () => activeMission ?? MISSIONS[0],
    [activeMission],
  );
  const isClient = useIsClient();
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<WorkspaceSvg | null>(null);
  const spriteWorkspacesRef = useRef<Record<string, Record<string, unknown>>>({});
  const p5Ref = useRef<P5CanvasHandle>(null);
  const [status, setStatus] = useState<string>("");
  const [blocklyInjectKey, setBlocklyInjectKey] = useState(0);
  const [blocklyMounted, setBlocklyMounted] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [stageSceneLayers, setStageSceneLayers] = useState<OllieSceneId[]>([
    DEFAULT_SCENE_ID,
  ]);
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
  const [missionCompleteOpen, setMissionCompleteOpen] = useState(false);
  const [programRunning, setProgramRunning] = useState(false);
  const [saveMissionNameModalOpen, setSaveMissionNameModalOpen] =
    useState(false);
  const [saveMissionNameLoading, setSaveMissionNameLoading] = useState(false);
  const missionRewardShownRef = useRef(false);
  /** After choosing a mission in the modal we load immediately; skip the duplicate run when `?mission=` updates. */
  const skipNextMissionUrlEffectRef = useRef(false);
  const [missionsModalOpen, setMissionsModalOpen] = useState(false);
  const [deleteMissionModalOpen, setDeleteMissionModalOpen] = useState(false);
  const [deleteMissionLoading, setDeleteMissionLoading] = useState(false);
  const [renameMissionModalOpen, setRenameMissionModalOpen] = useState(false);
  const [renameMissionContext, setRenameMissionContext] = useState<{
    missionId: string;
    missionTitle: string;
    defaultName: string;
  } | null>(null);
  const [renameMissionLoading, setRenameMissionLoading] = useState(false);
  const [savedMissionEntries, setSavedMissionEntries] = useState<
    SavedMissionProgressEntry[]
  >([]);

  /** In-app `ask` / prompt overlay (replaces `window.prompt` on the stage). */
  const [askOverlay, setAskOverlay] = useState<{
    message: string;
    numberOnly: boolean;
  } | null>(null);
  /** Remount the ask `<form>` on each prompt so the uncontrolled field always matches the new question. */
  const [askFormNonce, setAskFormNonce] = useState(0);
  const [askInputError, setAskInputError] = useState<string | null>(null);
  const askResolveRef = useRef<((n: number) => void) | null>(null);
  const askInputRef = useRef<HTMLInputElement>(null);

  const requestNumberInput = useCallback(
    (message: string, numberOnly: boolean) => {
      return new Promise<number>((resolve) => {
        askResolveRef.current = resolve;
        setAskInputError(null);
        setAskFormNonce((n) => n + 1);
        setAskOverlay({ message, numberOnly });
      });
    },
    [],
  );

  const finishAsk = useCallback((value: string) => {
    const resolve = askResolveRef.current;
    askResolveRef.current = null;
    const n = Number.parseFloat(String(value).trim());
    /** Resolve the Run promise before closing the overlay so the canvas stores the number on the same turn (avoids ordering bugs with React state vs. `await`). */
    resolve?.(Number.isFinite(n) ? n : Number.NaN);
    setAskOverlay(null);
  }, []);

  const cancelAsk = useCallback(() => {
    const resolve = askResolveRef.current;
    askResolveRef.current = null;
    setAskInputError(null);
    setAskOverlay(null);
    resolve?.(Number.NaN);
  }, []);

  /** Blockly `dialog.prompt` (create/rename variable, etc.) — replaces `window.prompt`. */
  const [blocklyPrompt, setBlocklyPrompt] = useState<{
    message: string;
    defaultValue: string;
  } | null>(null);
  const [blocklyPromptInput, setBlocklyPromptInput] = useState("");
  const blocklyPromptCallbackRef = useRef<
    ((result: string | null) => void) | null
  >(null);
  const blocklyPromptInputRef = useRef<HTMLInputElement>(null);

  const commitBlocklyPrompt = useCallback((result: string | null) => {
    const cb = blocklyPromptCallbackRef.current;
    blocklyPromptCallbackRef.current = null;
    setBlocklyPrompt(null);
    setBlocklyPromptInput("");
    cb?.(result);
  }, []);

  const cancelBlocklyPrompt = useCallback(() => {
    commitBlocklyPrompt(null);
  }, [commitBlocklyPrompt]);

  useEffect(() => {
    if (!blocklyMounted) return;
    dialog.setPrompt((message, defaultValue, callback) => {
      blocklyPromptCallbackRef.current = callback;
      setBlocklyPromptInput(defaultValue);
      setBlocklyPrompt({ message, defaultValue });
    });
    return () => {
      dialog.setPrompt(undefined);
    };
  }, [blocklyMounted]);

  useEffect(() => {
    if (!blocklyPrompt) return;
    const t = window.setTimeout(() => blocklyPromptInputRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancelBlocklyPrompt();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [blocklyPrompt, cancelBlocklyPrompt]);

  useEffect(() => {
    if (!askOverlay) return;
    const t = window.setTimeout(() => askInputRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancelAsk();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [askOverlay, cancelAsk]);

  useEffect(() => {
    setSavedMissionEntries(getSavedMissionProgress());
  }, []);

  /**
   * Stage header: only show a specific mission title when `?mission=` is in the URL.
   * Plain `/workspace` shows the generic label “Mission”.
   */
  const canvasMissionLabel = useMemo(() => {
    if (!activeMission) return "Mission";
    const saved = savedMissionEntries.find(
      (e) => e.missionId === activeMission.id,
    );
    if (saved?.displayName?.trim()) return saved.displayName.trim();
    return activeMission.title;
  }, [activeMission, savedMissionEntries]);

  const canvasMissionTooltip = useMemo(() => {
    if (!activeMission) return undefined;
    const saved = savedMissionEntries.find(
      (e) => e.missionId === activeMission.id,
    );
    if (saved?.displayName?.trim()) return activeMission.title;
    return activeMission.description || undefined;
  }, [activeMission, savedMissionEntries]);

  /** Fixed locale + UTC so server and client match during hydration. */
  const defaultMissionSaveName = useMemo(() => {
    if (!missionForSave) return "";
    const d = new Date();
    const datePart = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    return `${missionForSave.title} — ${datePart}`;
  }, [missionForSave]);

  const topStageSceneId =
    stageSceneLayers[stageSceneLayers.length - 1] ?? DEFAULT_SCENE_ID;
  const currentStageScene =
    getSceneById(topStageSceneId) ?? getSceneById(DEFAULT_SCENE_ID)!;
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
    missionRewardShownRef.current = false;
  }, [missionIdParam]);

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
          trashcan: false,
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
        setBlocklyMounted(true);

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
      setBlocklyMounted(false);
      workspaceRef.current?.dispose();
      workspaceRef.current = null;
    };
  }, [blocklyInjectKey]);

  /** Blockly’s SVG must be resized when the flex host changes size; otherwise toolbox/blocks can render at 0×0. */
  useEffect(() => {
    if (!blocklyMounted) return;
    const el = blocklyDiv.current;
    const ws = workspaceRef.current;
    if (!el || !ws) return;

    const bump = () => {
      requestAnimationFrame(() => svgResize(ws));
    };
    bump();

    const ro = new ResizeObserver(bump);
    ro.observe(el);
    window.addEventListener("resize", bump);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", bump);
    };
  }, [blocklyMounted, blocklyInjectKey]);

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
    setStageSceneLayers([DEFAULT_SCENE_ID]);
    setDeleteConfirm(null);
  }, []);

  const removeSceneLayerAt = useCallback((index: number) => {
    setStageSceneLayers((prev) => {
      if (prev.length <= 1) return [DEFAULT_SCENE_ID];
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [DEFAULT_SCENE_ID];
    });
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

  const handleStop = useCallback(() => {
    p5Ref.current?.stopRun();
  }, []);

  const handleRun = useCallback(async () => {
    const ws = workspaceRef.current;
    const p5 = p5Ref.current;
    if (!ws || !p5) return;
    setProgramRunning(true);
    try {
      setStatus("Running…");
      spriteWorkspacesRef.current[activeActorId] =
        serialization.workspaces.save(ws) as Record<string, unknown>;
      const emptyPlan = (): SpriteScriptPlan => ({
        runScripts: [],
        keyScripts: [],
        stageClickScripts: [],
        backdropScripts: [],
        broadcastScripts: [],
      });
      const bundles = actors.map((actor) => {
        const raw = spriteWorkspacesRef.current[actor.id];
        let plan: SpriteScriptPlan = emptyPlan();
        if (raw && Object.keys(raw).length > 0) {
          try {
            /** Live workspace avoids save→temp reload, which can desync variable ids vs `assignRunVar` (compare read 0, snap had Answer). */
            if (actor.id === activeActorId && workspaceRef.current) {
              plan = extractSpriteScriptPlan(workspaceRef.current);
            } else {
              plan = extractSpriteScriptPlanFromSave(raw);
            }
          } catch {
            plan = emptyPlan();
          }
        }
        return { spriteId: actor.id, plan };
      });
      p5.resetSprite();
      const { aborted } = await p5.runProjectPlans(bundles);
      setStatus(aborted ? "Stopped" : "Done!");
      setTimeout(() => setStatus(""), 2000);

      if (
        !aborted &&
        activeMission &&
        !missionRewardShownRef.current &&
        activeMission.isComplete({ ...spriteWorkspacesRef.current })
      ) {
        missionRewardShownRef.current = true;
        setMissionCompleteOpen(true);
      }
    } finally {
      setProgramRunning(false);
    }
  }, [actors, activeActorId, activeMission]);

  const resetWorkspaceToDefaultStarter = useCallback(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
    setActors(DEFAULT_STAGE_ACTORS);
    setActiveActorId(ACTOR_ROBOT_ID);
    setStageSceneLayers([DEFAULT_SCENE_ID]);
    const xml = utils.xml.textToDom(DEFAULT_WORKSPACE_XML);
    Events.disable();
    ws.clear();
    Xml.clearWorkspaceAndLoadFromXml(xml, ws);
    Events.enable();
    spriteWorkspacesRef.current = {
      [ACTOR_ROBOT_ID]: serialization.workspaces.save(ws) as Record<
        string,
        unknown
      >,
    };
    p5Ref.current?.resetSprite();
  }, []);

  const handleReset = useCallback(() => {
    resetWorkspaceToDefaultStarter();
    setStatus("Workspace reset");
    setTimeout(() => setStatus(""), 1500);
  }, [resetWorkspaceToDefaultStarter]);

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

  const saveProject = useCallback(
    async (opts?: {
      missionRecord?: { missionId: string; displayName: string };
    }): Promise<string> => {
    const ws = workspaceRef.current;
    if (!ws) return "Nothing to save";
    spriteWorkspacesRef.current[activeActorId] =
      serialization.workspaces.save(ws) as Record<string, unknown>;
    const workspacesByActorId = { ...spriteWorkspacesRef.current };
    if (opts?.missionRecord) {
      recordMissionSaved(
        opts.missionRecord.missionId,
        opts.missionRecord.displayName,
      );
    }
    const mergedMissionProgress = getSavedMissionProgress();
    const payload: ProjectPayload = {
      workspace: workspacesByActorId[activeActorId]!,
      workspacesByActorId,
      actors,
      sceneLayerIds: stageSceneLayers,
      sceneId: topStageSceneId,
      name: "My Ollie Project",
      updatedAt: new Date().toISOString(),
      savedMissionProgress: mergedMissionProgress,
    };
    if (opts?.missionRecord) {
      storeMissionProjectSnapshotLocal(opts.missionRecord.missionId, payload);
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      try {
        localStorage.setItem(
          "ollie-project-local",
          JSON.stringify(payload),
        );
        return "Saved locally (add Supabase env for cloud save)";
      } catch {
        return "Could not save";
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      try {
        localStorage.setItem(
          "ollie-project-local",
          JSON.stringify(payload),
        );
        return "Saved on this device — sign in to sync to the cloud";
      } catch {
        return "Could not save";
      }
    }

    const projectId = "default";
    const { error } = await uploadProjectJson(
      supabase,
      user.id,
      projectId,
      payload,
    );
    const missionRecord = opts?.missionRecord;
    if (!error && missionRecord) {
      const { error: mErr } = await uploadProjectJson(
        supabase,
        user.id,
        missionCloudProjectId(missionRecord.missionId),
        payload,
      );
      if (mErr) {
        /* mission file is optional; default save succeeded */
      }
    }
    let missionDbError: Error | null = null;
    if (!error && missionRecord && user) {
      const entry = mergedMissionProgress.find(
        (m) => m.missionId === missionRecord.missionId,
      );
      if (entry) {
        const { error: upErr } = await upsertSavedMissionProgress(
          supabase,
          user.id,
          entry,
        );
        missionDbError = upErr;
      }
    }
    if (error) return `Save failed: ${error.message}`;
    if (missionDbError) {
      return `Saved to cloud! (Mission list not updated in database: ${missionDbError.message})`;
    }
    return "Saved to cloud!";
  },
    [actors, activeActorId, stageSceneLayers, topStageSceneId],
  );

  const confirmSaveMissionName = useCallback(
    async (displayName: string) => {
      if (!missionForSave) return;
      setSaveMissionNameLoading(true);
      try {
        const msg = await saveProject({
          missionRecord: {
            missionId: missionForSave.id,
            displayName,
          },
        });
        setStatus(msg);
        setSaveMissionNameModalOpen(false);
        setSavedMissionEntries(getSavedMissionProgress());
        setTimeout(() => setStatus(""), 3000);
      } finally {
        setSaveMissionNameLoading(false);
      }
    },
    [missionForSave, saveProject],
  );

  /** Reuse the last name for this mission; only prompt when none exists yet. */
  const saveMissionWithExistingNameOrPrompt = useCallback(() => {
    if (!missionForSave) return;
    const existing = getSavedMissionProgress().find(
      (e) => e.missionId === missionForSave.id,
    );
    const name = existing?.displayName?.trim();
    if (name) {
      void confirmSaveMissionName(name);
      return;
    }
    setSaveMissionNameModalOpen(true);
  }, [missionForSave, confirmSaveMissionName]);

  const handleSave = useCallback(() => {
    saveMissionWithExistingNameOrPrompt();
  }, [saveMissionWithExistingNameOrPrompt]);

  const openRenameMissionFromList = useCallback((missionId: string) => {
    const meta = getMissionById(missionId);
    const entry = getSavedMissionProgress().find(
      (e) => e.missionId === missionId,
    );
    const defaultName =
      entry?.displayName?.trim() || meta?.title || "Mission";
    setRenameMissionContext({
      missionId,
      missionTitle: meta?.title ?? "Mission",
      defaultName,
    });
    setRenameMissionModalOpen(true);
  }, []);

  const confirmRenameMission = useCallback(
    async (displayName: string) => {
      if (!renameMissionContext) return;
      const trimmed = displayName.trim();
      if (!trimmed) return;
      setRenameMissionLoading(true);
      try {
        recordMissionSaved(renameMissionContext.missionId, trimmed);
        const sb = getSupabaseBrowserClient();
        if (sb) {
          const {
            data: { user },
          } = await sb.auth.getUser();
          if (user) {
            const { error } = await upsertSavedMissionProgress(sb, user.id, {
              missionId: renameMissionContext.missionId,
              displayName: trimmed,
              savedAt: new Date().toISOString(),
            });
            if (error) {
              setStatus(`Renamed on this device; cloud: ${error.message}`);
              setTimeout(() => setStatus(""), 5000);
            }
          }
        }
        setSavedMissionEntries(getSavedMissionProgress());
        setRenameMissionModalOpen(false);
        setRenameMissionContext(null);
        setStatus("Mission renamed!");
        setTimeout(() => setStatus(""), 2500);
      } finally {
        setRenameMissionLoading(false);
      }
    },
    [renameMissionContext],
  );

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
        const id = n.id === LEGACY_ACTOR_OLLIE_ID ? ACTOR_ROBOT_ID : n.id;
        const label =
          id === ACTOR_ROBOT_ID &&
          (n.label === "Robot" ||
            n.label === "David" ||
            n.label === "Ollie")
            ? "Ollie"
            : n.label;
        return { ...n, id, label };
      });
      setActors(migratedActors);
      spriteWorkspacesRef.current = wsRaw;
      const firstId = migratedActors[0].id;
      setActiveActorId(firstId);
      setStageSceneLayers(
        normalizeSceneLayerIdsFromPayload(
          payload.sceneLayerIds,
          payload.sceneId,
        ),
      );
      const blob =
        spriteWorkspacesRef.current[firstId] ?? getEmptyWorkspaceSave();
      Events.disable();
      ws.clear();
      serialization.workspaces.load(blob, ws, { recordUndo: false });
      Events.enable();
    } else {
      setActors(DEFAULT_STAGE_ACTORS);
      setActiveActorId(ACTOR_ROBOT_ID);
      setStageSceneLayers(
        normalizeSceneLayerIdsFromPayload(
          payload.sceneLayerIds,
          payload.sceneId,
        ),
      );
      Events.disable();
      ws.clear();
      serialization.workspaces.load(payload.workspace, ws, { recordUndo: false });
      Events.enable();
      spriteWorkspacesRef.current[ACTOR_ROBOT_ID] =
        serialization.workspaces.save(ws) as Record<string, unknown>;
    }
    mergeMissionProgressIntoStorage(payload.savedMissionProgress);
    setSavedMissionEntries(getSavedMissionProgress());
    p5Ref.current?.resetSprite();
  }, []);

  /**
   * Load a mission workspace: cloud JSON → local snapshot → default starter blocks.
   * Call with an explicit id from the Adventures modal so we don’t rely on `useSearchParams` updating first.
   */
  const openMissionWorkspace = useCallback(
    async (missionId: string) => {
      const meta = getMissionById(missionId);
      if (!meta) return;
      if (!workspaceRef.current) return;

      const sb = getSupabaseBrowserClient();
      if (sb) {
        const {
          data: { user },
        } = await sb.auth.getUser();
        if (user) {
          const { data, error } = await downloadProjectJson(
            sb,
            user.id,
            missionCloudProjectId(missionId),
          );
          if (data && !error) {
            applyProjectPayload(data);
            missionRewardShownRef.current = false;
            requestAnimationFrame(() => {
              const w = workspaceRef.current;
              if (w) svgResize(w);
            });
            setStatus(`Opened “${meta.title}”`);
            setTimeout(() => setStatus(""), 2000);
            return;
          }
        }
      }

      const localSnap = loadMissionProjectSnapshotLocal(missionId);
      if (localSnap) {
        applyProjectPayload(localSnap);
        missionRewardShownRef.current = false;
        requestAnimationFrame(() => {
          const w = workspaceRef.current;
          if (w) svgResize(w);
        });
        setStatus(`Opened “${meta.title}”`);
        setTimeout(() => setStatus(""), 2000);
        return;
      }

      resetWorkspaceToDefaultStarter();
      missionRewardShownRef.current = false;
      requestAnimationFrame(() => {
        const w = workspaceRef.current;
        if (w) svgResize(w);
      });
      setStatus(
        `Mission “${meta.title}” — start here, or open Save after you sign in to sync from the cloud.`,
      );
      setTimeout(() => setStatus(""), 4000);
    },
    [applyProjectPayload, resetWorkspaceToDefaultStarter],
  );

  /** Open mission from URL (direct links / refresh) and when Blockly becomes ready after navigation. */
  useEffect(() => {
    if (!blocklyMounted || !workspaceRef.current) return;
    if (!missionIdParam || !getMissionById(missionIdParam)) return;

    if (skipNextMissionUrlEffectRef.current) {
      skipNextMissionUrlEffectRef.current = false;
      return;
    }

    void openMissionWorkspace(missionIdParam);
  }, [
    missionIdParam,
    blocklyMounted,
    blocklyInjectKey,
    openMissionWorkspace,
  ]);

  const openMissionsModal = useCallback(() => {
    setSavedMissionEntries(getSavedMissionProgress());
    setMissionsModalOpen(true);
    void (async () => {
      const sb = getSupabaseBrowserClient();
      if (!sb) return;
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session?.user) return;
      const { data: rows, error } = await fetchSavedMissionProgress(
        sb,
        session.user.id,
      );
      if (error) {
        setStatus(
          `Could not load adventures from cloud (${error.message}). Using this device only.`,
        );
        setTimeout(() => setStatus(""), 5000);
        return;
      }
      if (rows.length) {
        mergeMissionProgressIntoStorage(rows);
        setSavedMissionEntries(getSavedMissionProgress());
      }
    })();
  }, []);

  const handleSelectMissionFromModal = useCallback(
    (missionId: string) => {
      setMissionsModalOpen(false);
      if (workspaceRef.current) {
        skipNextMissionUrlEffectRef.current = true;
        void openMissionWorkspace(missionId);
      }
      const q = new URLSearchParams();
      q.set("mission", missionId);
      router.replace(`/workspace?${q.toString()}`, { scroll: false });
    },
    [router, openMissionWorkspace],
  );

  const handleNewMission = useCallback(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
    const newId = createCustomMissionId();
    skipNextMissionUrlEffectRef.current = true;
    resetWorkspaceToDefaultStarter();
    missionRewardShownRef.current = false;
    requestAnimationFrame(() => {
      const w = workspaceRef.current;
      if (w) svgResize(w);
    });
    const q = new URLSearchParams();
    q.set("mission", newId);
    router.replace(`/workspace?${q.toString()}`, { scroll: false });
    setStatus("New mission — use Save to name it.");
    setTimeout(() => setStatus(""), 3500);
  }, [resetWorkspaceToDefaultStarter, router]);

  const canDeleteCurrentMission = Boolean(activeMission && missionIdParam);

  const confirmDeleteCurrentMission = useCallback(async () => {
    const id = missionIdParam;
    if (!id || !getMissionById(id)) return;
    setDeleteMissionLoading(true);
    let cloudListWarning: string | null = null;
    try {
      removeSavedMissionProgressEntry(id);
      clearMissionProjectSnapshotLocal(id);
      const sb = getSupabaseBrowserClient();
      if (sb) {
        const {
          data: { user },
        } = await sb.auth.getUser();
        if (user) {
          await deleteProjectJson(sb, user.id, missionCloudProjectId(id));
          const { error: rowErr } = await deleteSavedMissionProgress(
            sb,
            user.id,
            id,
          );
          if (rowErr) cloudListWarning = rowErr.message;
        }
      }
      skipNextMissionUrlEffectRef.current = true;
      resetWorkspaceToDefaultStarter();
      missionRewardShownRef.current = false;
      router.replace("/workspace", { scroll: false });
      requestAnimationFrame(() => {
        const w = workspaceRef.current;
        if (w) svgResize(w);
      });
      setSavedMissionEntries(getSavedMissionProgress());
      setDeleteMissionModalOpen(false);
      if (cloudListWarning) {
        setStatus(
          `Cleared here — cloud list may need a refresh (${cloudListWarning}).`,
        );
        setTimeout(() => setStatus(""), 5000);
      } else {
        setStatus("Mission deleted — fresh canvas!");
        setTimeout(() => setStatus(""), 3000);
      }
    } finally {
      setDeleteMissionLoading(false);
    }
  }, [missionIdParam, resetWorkspaceToDefaultStarter, router]);

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
      const raw = localStorage.getItem("ollie-project-local");
      if (raw) {
        try {
          const payload = JSON.parse(raw) as ProjectPayload;
          applyProjectPayload(payload);
          setStatus("Loaded from browser");
        } catch {
          setStatus("Bad project data");
        }
      } else {
        setStatus("Sign in to load from cloud");
      }
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
    const { data: missionRows } = await fetchSavedMissionProgress(
      supabase,
      user.id,
    );
    if (missionRows.length) mergeMissionProgressIntoStorage(missionRows);
    setSavedMissionEntries(getSavedMissionProgress());
    setStatus("Loaded!");
    setTimeout(() => setStatus(""), 2000);
  }, [applyProjectPayload]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f8fafc] text-[#111827]">
      <header className="sticky top-0 z-[100000] flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            className="block shrink-0"
            aria-label="Ollie Code home"
          >
            <Image
              src="/images/logo.png"
              alt=""
              width={434}
              height={91}
              className="h-7 w-auto sm:h-8"
              priority
            />
          </Link>
          <span className="hidden rounded-full bg-[#ecfccb] px-3 py-1 text-xs font-semibold text-[#3f6212] sm:inline">
            Learn &amp; play
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:ml-auto sm:gap-2">
          {programRunning ? (
            <ToolbarIconButton
              variant="stop"
              onClick={handleStop}
              title="Stop"
              aria-label="Stop"
            >
              <Square
                className={`${ICON_SM} fill-current`}
                strokeWidth={ICON_STROKE}
                aria-hidden
              />
            </ToolbarIconButton>
          ) : (
            <ToolbarIconButton
              variant="primary"
              onClick={handleRun}
              title="Run"
              aria-label="Run"
            >
              <Play
                className={`${ICON_SM} fill-current`}
                strokeWidth={ICON_STROKE}
                aria-hidden
              />
            </ToolbarIconButton>
          )}
          <ToolbarIconButton
            onClick={handleSave}
            title="Save"
            aria-label="Save"
          >
            <Save
              className={ICON_SM}
              strokeWidth={ICON_STROKE}
              aria-hidden
            />
          </ToolbarIconButton>
          <ToolbarIconButton
            onClick={() => void handleLoad()}
            title="Load"
            aria-label="Load"
          >
            <Upload
              className={ICON_SM}
              strokeWidth={ICON_STROKE}
              aria-hidden
            />
          </ToolbarIconButton>
          <ToolbarIconButton
            onClick={handleReset}
            title="Reset"
            aria-label="Reset"
          >
            <RotateCcw
              className={ICON_SM}
              strokeWidth={ICON_STROKE}
              aria-hidden
            />
          </ToolbarIconButton>
          <ToolbarIconButton
            onClick={handleUndo}
            title="Undo"
            aria-label="Undo"
          >
            <Undo
              className={ICON_SM}
              strokeWidth={ICON_STROKE}
              aria-hidden
            />
          </ToolbarIconButton>
          <ToolbarIconButton
            onClick={handleRedo}
            title="Redo"
            aria-label="Redo"
          >
            <Redo
              className={ICON_SM}
              strokeWidth={ICON_STROKE}
              aria-hidden
            />
          </ToolbarIconButton>
          <ToolbarIconButton
            onClick={handleDuplicate}
            title="Duplicate"
            aria-label="Duplicate"
          >
            <CopyPlus
              className={ICON_SM}
              strokeWidth={ICON_STROKE}
              aria-hidden
            />
          </ToolbarIconButton>
          <ToolbarIconButton
            onClick={openMissionsModal}
            title="Adventures"
            aria-label="Open adventures list"
          >
            <Briefcase
              className={ICON_SM}
              strokeWidth={ICON_STROKE}
              aria-hidden
            />
          </ToolbarIconButton>
          <ToolbarIconButton
            onClick={handleNewMission}
            title="New mission"
            aria-label="New mission"
          >
            <Plus
              className={ICON_SM}
              strokeWidth={ICON_STROKE}
              aria-hidden
            />
          </ToolbarIconButton>
          <ToolbarIconButton
            disabled={!canDeleteCurrentMission}
            onClick={() => setDeleteMissionModalOpen(true)}
            title={
              canDeleteCurrentMission
                ? "Delete mission"
                : "Pick a mission first"
            }
            aria-label={
              canDeleteCurrentMission
                ? "Delete mission"
                : "Delete mission (pick a mission first)"
            }
          >
            <Trash2
              className={ICON_SM}
              strokeWidth={ICON_STROKE}
              aria-hidden
            />
          </ToolbarIconButton>
          {isClient && getSupabaseBrowserClient() ? (
            <div className="flex items-center gap-2 border-l border-[#e5e7eb] pl-2 sm:gap-3 sm:pl-3">
              <WorkspaceHeaderTooltip text="Settings">
                <Link
                  href="/settings"
                  aria-label="Settings"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#374151] shadow-sm transition hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
                >
                  <Settings
                    className={ICON_SM}
                    strokeWidth={ICON_STROKE}
                    aria-hidden
                  />
                </Link>
              </WorkspaceHeaderTooltip>
              <WorkspaceHeaderTooltip
                text={isFullscreen ? "Exit" : "Fullscreen"}
              >
                <button
                  type="button"
                  onClick={() => void toggleFullscreen()}
                  aria-label={
                    isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#374151] shadow-sm transition hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
                >
                  {isFullscreen ? (
                    <Minimize2
                      className={ICON_SM}
                      strokeWidth={ICON_STROKE}
                      aria-hidden
                    />
                  ) : (
                    <Maximize2
                      className={ICON_SM}
                      strokeWidth={ICON_STROKE}
                      aria-hidden
                    />
                  )}
                </button>
              </WorkspaceHeaderTooltip>
              <WorkspaceHeaderTooltip text="Logout">
                <button
                  type="button"
                  onClick={async () => {
                    const s = getSupabaseBrowserClient();
                    await s?.auth.signOut();
                    router.push("/auth/login?next=/workspace");
                    router.refresh();
                  }}
                  aria-label="Sign out"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#374151] shadow-sm transition hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
                >
                  <LogOut
                    className={ICON_SM}
                    strokeWidth={ICON_STROKE}
                    aria-hidden
                  />
                </button>
              </WorkspaceHeaderTooltip>
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
                  <WorkspaceHeaderTooltip text="Avatar">
                    <button
                      type="button"
                      onClick={() => setAvatarPickerOpen(true)}
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
                  </WorkspaceHeaderTooltip>
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
        <div className="flex min-h-[50vh] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm lg:min-h-[calc(100dvh-9rem)]">
          <div className="shrink-0 border-b border-[#e5e7eb] bg-[#ecfccb] px-4 py-2 text-sm font-semibold text-[#365314]">
            Workspace
          </div>
          <div className="relative min-h-[480px] w-full min-w-0 flex-1 overflow-hidden rounded-b-2xl">
            <div
              key={blocklyInjectKey}
              ref={blocklyDiv}
              className={[
                "ollie-blockly-host absolute inset-0 min-h-[480px] w-full min-w-0 overflow-hidden",
                HIDE_FLYOUT_SCROLLBAR_VISUAL ? "ollie-blockly--hide-flyout-scrollbar" : "",
                HIDE_TOOLBOX_SCROLLBAR_VISUAL ? "ollie-blockly--hide-toolbox-scrollbar" : "",
                HIDE_MAIN_WORKSPACE_SCROLLBAR_VISUAL ? "ollie-blockly--hide-main-scrollbar" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          </div>
        </div>

        <div className="flex min-h-0 w-full flex-col gap-3 lg:w-[420px] lg:max-w-[42vw]">
          <div className="flex h-[min(720px,72vh)] min-h-[520px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
            <div className="shrink-0 rounded-t-2xl border-b border-[#e5e7eb] bg-[#ecfccb] px-4 py-2 text-sm font-semibold text-[#365314]">
              <span
                className="block truncate"
                title={canvasMissionTooltip}
              >
                {canvasMissionLabel}
              </span>
            </div>
            <div className="relative flex min-h-0 flex-1 flex-col">
              {askOverlay ? (
                <div
                  className="absolute inset-0 z-20 flex items-center justify-center p-4 sm:p-6"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="ollie-ask-dialog-title"
                >
                  <button
                    type="button"
                    className="absolute inset-0 cursor-default bg-gradient-to-b from-[#0f172a]/55 via-[#0f172a]/45 to-[#0f172a]/60 backdrop-blur-[3px] transition-opacity"
                    aria-label="Close dialog backdrop"
                    onClick={cancelAsk}
                  />
                  <form
                    key={askFormNonce}
                    className="relative z-10 w-full max-w-md"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const fromForm = String(
                        fd.get("ollieAskAnswer") ?? "",
                      ).trim();
                      const fromRef = String(
                        askInputRef.current?.value ?? "",
                      ).trim();
                      const chosen = fromRef || fromForm;
                      if (askOverlay.numberOnly) {
                        const n = Number.parseFloat(chosen);
                        if (!chosen.trim() || !Number.isFinite(n)) {
                          setAskInputError("Type a number first.");
                          askInputRef.current?.focus();
                          return;
                        }
                      }
                      setAskInputError(null);
                      finishAsk(chosen);
                    }}
                  >
                    <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
                      <div className="space-y-4 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                        <p
                          id="ollie-ask-dialog-title"
                          className="font-display min-w-0 max-h-[min(200px,40vh)] overflow-y-auto text-base font-semibold leading-snug text-[#111827] whitespace-pre-wrap break-words"
                        >
                          {askOverlay.message}
                        </p>
                        <div>
                          <label
                            htmlFor="ollie-ask-input"
                            className="mb-1.5 block text-xs font-semibold text-[#4b5563]"
                          >
                            {askOverlay.numberOnly ? "Answer" : "Reply"}
                          </label>
                          <input
                            id="ollie-ask-input"
                            name="ollieAskAnswer"
                            ref={askInputRef}
                            type="text"
                            inputMode={
                              askOverlay.numberOnly ? "decimal" : undefined
                            }
                            autoComplete="off"
                            defaultValue=""
                            placeholder={
                              askOverlay.numberOnly ? "0" : "Type here…"
                            }
                            aria-invalid={askInputError ? true : undefined}
                            onChange={() => setAskInputError(null)}
                            className={[
                              "w-full rounded-xl border-2 bg-[#f9fafb] px-3.5 py-3 text-base font-semibold text-[#111827] shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-[#d9f99d]/60",
                              askInputError
                                ? "border-red-400 placeholder:text-red-300 focus:border-red-500 focus:ring-red-200/60"
                                : "border-[#e5e7eb] placeholder:text-[#9ca3af] focus:border-[#84c126]",
                            ].join(" ")}
                          />
                          {askInputError ? (
                            <p
                              className="mt-2 text-sm font-semibold text-red-600"
                              role="alert"
                            >
                              {askInputError}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end sm:gap-3">
                          <button
                            type="button"
                            onClick={cancelAsk}
                            className="rounded-xl border-2 border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-bold text-[#4b5563] shadow-sm transition hover:border-[#d1d5db] hover:bg-[#f9fafb] active:scale-[0.99]"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="rounded-xl border-2 border-[#65a30d] bg-gradient-to-b from-[#a3e635] to-[#84cc16] px-5 py-2.5 text-sm font-bold text-[#1a2e05] shadow-md transition hover:from-[#bef264] hover:to-[#a3e635] active:scale-[0.99] active:shadow-sm"
                          >
                            OK
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              ) : null}
              {blocklyPrompt ? (
                <div
                  className="fixed inset-0 z-[100010] flex items-center justify-center p-4 sm:p-6"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="ollie-blockly-prompt-title"
                  aria-describedby="ollie-blockly-prompt-message"
                >
                  <button
                    type="button"
                    className="absolute inset-0 cursor-default bg-gradient-to-b from-[#0f172a]/55 via-[#0f172a]/45 to-[#0f172a]/60 backdrop-blur-[3px]"
                    aria-label="Close dialog"
                    onClick={cancelBlocklyPrompt}
                  />
                  <form
                    className="relative z-10 w-full max-w-md"
                    onSubmit={(e) => {
                      e.preventDefault();
                      commitBlocklyPrompt(blocklyPromptInput.trim());
                    }}
                  >
                    <div className="overflow-hidden rounded-2xl border border-[#d9f99d]/80 bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(132,193,38,0.12)] ring-1 ring-[#84c126]/20">
                      <div className="flex items-center gap-2.5 border-b border-[#ecfccb] bg-gradient-to-r from-[#ecfccb] via-[#f7fee7] to-[#ecfccb] px-4 py-3.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/90 shadow-sm ring-1 ring-[#84c126]/25">
                          <Braces
                            className="size-5 text-[#3f6212]"
                            strokeWidth={ICON_STROKE}
                            aria-hidden
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            id="ollie-blockly-prompt-title"
                            className="font-display text-xs font-bold uppercase tracking-wide text-[#4d7c0f]"
                          >
                            Variable
                          </p>
                          <p className="text-[11px] font-medium text-[#3f6212]/80">
                            Name your variable for the blocks.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                        <p
                          id="ollie-blockly-prompt-message"
                          className="text-sm font-medium text-[#374151]"
                        >
                          {blocklyPrompt.message}
                        </p>
                        <div>
                          <label
                            htmlFor="ollie-blockly-prompt-input"
                            className="mb-1.5 block text-xs font-semibold text-[#4b5563]"
                          >
                            Name
                          </label>
                          <input
                            id="ollie-blockly-prompt-input"
                            ref={blocklyPromptInputRef}
                            type="text"
                            autoComplete="off"
                            value={blocklyPromptInput}
                            onChange={(e) =>
                              setBlocklyPromptInput(e.target.value)
                            }
                            placeholder={blocklyPrompt.defaultValue || "name"}
                            className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3.5 py-3 text-base font-semibold text-[#111827] shadow-inner outline-none transition placeholder:text-[#9ca3af] focus:border-[#84c126] focus:bg-white focus:ring-4 focus:ring-[#d9f99d]/60"
                          />
                        </div>
                        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end sm:gap-3">
                          <button
                            type="button"
                            onClick={cancelBlocklyPrompt}
                            className="rounded-xl border-2 border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-bold text-[#4b5563] shadow-sm transition hover:border-[#d1d5db] hover:bg-[#f9fafb] active:scale-[0.99]"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="rounded-xl border-2 border-[#65a30d] bg-gradient-to-b from-[#a3e635] to-[#84cc16] px-5 py-2.5 text-sm font-bold text-[#1a2e05] shadow-md transition hover:from-[#bef264] hover:to-[#a3e635] active:scale-[0.99] active:shadow-sm"
                          >
                            OK
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              ) : null}
              <P5Canvas
                ref={p5Ref}
                className="min-h-0 min-w-0 w-full flex-1"
                sceneLayerIds={stageSceneLayers}
                actors={actors.map((a) => ({
                  id: a.id,
                  costumeId: a.costumeId,
                }))}
                pauseActorCostumePropSync={programRunning}
                onSceneChange={(id) => setStageSceneLayers([id])}
                onActorCostumeChange={(actorId, costumeId) =>
                  setActors((prev) =>
                    prev.map((a) =>
                      a.id === actorId ? { ...a, costumeId } : a,
                    ),
                  )
                }
                requestNumberInput={requestNumberInput}
              />
            </div>
            <div className="shrink-0 rounded-b-2xl border-t border-[#e5e7eb] bg-[#f8fafc] px-2 py-1">
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
                    Scenes
                    <ChevronDown
                      className={`size-4 shrink-0 text-[#6b7280] transition-transform duration-200 ${
                        openStagePanel === "scene" ? "rotate-180" : ""
                      }`}
                      strokeWidth={ICON_STROKE}
                      aria-hidden
                    />
                  </button>
                  {openStagePanel === "scene" ? (
                    <div
                      id="ollie-stage-accordion-scene-panel"
                      role="region"
                      aria-labelledby="ollie-stage-accordion-scene"
                      className="flex flex-col gap-1.5 px-2 pb-3 pt-0"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {stageSceneLayers.map((layerId, index) => {
                          const scene =
                            getSceneById(layerId) ??
                            getSceneById(DEFAULT_SCENE_ID)!;
                          return (
                            <div
                              key={`${layerId}-${index}`}
                              className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f1f5f9] shadow-sm"
                              title={`${scene.label} (layer ${index + 1})`}
                            >
                              <ScenePreview scene={scene} />
                              {stageSceneLayers.length > 1 ? (
                                <button
                                  type="button"
                                  aria-label={`Remove ${scene.label} layer`}
                                  title="Remove this layer"
                                  onClick={() => removeSceneLayerAt(index)}
                                  className="absolute right-0.5 top-0.5 z-10 flex size-6 items-center justify-center rounded-md border border-[#e5e7eb] bg-white/95 text-[#6b7280] shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:pointer-events-auto focus-visible:opacity-100 opacity-0 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100"
                                >
                                  <X
                                    className="size-3.5 shrink-0"
                                    strokeWidth={ICON_STROKE}
                                    aria-hidden
                                  />
                                </button>
                              ) : topStageSceneId !== DEFAULT_SCENE_ID ? (
                                <button
                                  type="button"
                                  aria-label="Reset backdrop"
                                  title="Reset backdrop"
                                  onClick={() =>
                                    setDeleteConfirm({ type: "scene" })
                                  }
                                  className="absolute right-0.5 top-0.5 z-10 flex size-6 items-center justify-center rounded-md border border-[#e5e7eb] bg-white/95 text-[#6b7280] shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:pointer-events-auto focus-visible:opacity-100 opacity-0 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100"
                                >
                                  <Trash2
                                    className="size-3.5 shrink-0"
                                    strokeWidth={ICON_STROKE}
                                    aria-hidden
                                  />
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setScenePickerOpen(true)}
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] text-2xl font-light leading-none text-[#9ca3af] transition hover:bg-[#e8eaed] hover:text-[#6b7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
                          aria-label="Choose a Scene"
                          title="Choose a Scene"
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
                    <ChevronDown
                      className={`size-4 shrink-0 text-[#6b7280] transition-transform duration-200 ${
                        openStagePanel === "sprite" ? "rotate-180" : ""
                      }`}
                      strokeWidth={ICON_STROKE}
                      aria-hidden
                    />
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
                                "grid h-24 w-24 shrink-0 grid-rows-[1fr_auto] gap-1 rounded-xl border-2 p-2 text-[11px] font-semibold leading-tight",
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
                                <div className="pointer-events-none relative h-full w-full min-h-0 p-1">
                                  <SpritePreview costume={c} fillCard />
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
                                    <Trash2
                                      className="size-3.5 shrink-0"
                                      strokeWidth={ICON_STROKE}
                                      aria-hidden
                                    />
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
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f1f5f9] p-1 shadow-sm transition hover:border-[#cbd5e1] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
                          title={`${currentStageCostume.label} — tap to change costume`}
                          aria-label="Change costume for selected sprite"
                        >
                          <SpritePreview costume={currentStageCostume} fillCard />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            spritePickerIntentRef.current = "new";
                            setSpritePickerOpen(true);
                          }}
                          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] text-2xl font-light leading-none text-[#9ca3af] transition hover:bg-[#e8eaed] hover:text-[#6b7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2"
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
        title="Choose a Scene"
        selectedId={false}
        onSelect={(id) => {
          setStageSceneLayers((prev) => [...prev, id]);
          setScenePickerOpen(false);
        }}
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
      <MissionCompleteModal
        open={missionCompleteOpen && !!activeMission}
        missionTitle={activeMission?.title ?? "Mission"}
        saving={false}
        onDismiss={() => setMissionCompleteOpen(false)}
        onSave={() => {
          setMissionCompleteOpen(false);
          saveMissionWithExistingNameOrPrompt();
        }}
      />
      <SaveMissionNameModal
        open={saveMissionNameModalOpen && !!missionForSave}
        missionTitle={missionForSave?.title ?? "Mission"}
        defaultName={defaultMissionSaveName}
        saving={saveMissionNameLoading}
        onCancel={() => setSaveMissionNameModalOpen(false)}
        onConfirm={confirmSaveMissionName}
      />
      <SaveMissionNameModal
        open={renameMissionModalOpen && !!renameMissionContext}
        variant="rename"
        missionTitle={renameMissionContext?.missionTitle ?? "Mission"}
        defaultName={renameMissionContext?.defaultName ?? ""}
        saving={renameMissionLoading}
        onCancel={() => {
          setRenameMissionModalOpen(false);
          setRenameMissionContext(null);
        }}
        onConfirm={confirmRenameMission}
      />
      <SavedMissionsModal
        open={missionsModalOpen}
        onClose={() => setMissionsModalOpen(false)}
        entries={savedMissionEntries}
        onSelectMission={handleSelectMissionFromModal}
        activeMissionId={
          missionIdParam && getMissionById(missionIdParam)
            ? missionIdParam
            : null
        }
        onRenameMission={openRenameMissionFromList}
      />
      <DeleteMissionModal
        open={deleteMissionModalOpen && canDeleteCurrentMission}
        missionLabel={canvasMissionLabel}
        deleting={deleteMissionLoading}
        onClose={() => setDeleteMissionModalOpen(false)}
        onConfirm={confirmDeleteCurrentMission}
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

/**
 * Hover + keyboard (`:focus-visible`) only — not `focus-within`, so a mouse click
 * doesn’t leave the tooltip open while the control stays focused.
 */
function WorkspaceHeaderTooltip({
  text,
  children,
}: {
  text: string;
  children: ReactElement;
}) {
  return (
    <div className="group relative inline-flex shrink-0">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-[110001] -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#111827] px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg ring-1 ring-black/10 transition-opacity duration-150 ease-out group-hover:opacity-100 group-[&:has(*:focus-visible)]:opacity-100"
      >
        {text}
      </span>
    </div>
  );
}

function ToolbarIconButton({
  children,
  onClick,
  title,
  variant,
  disabled,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  "aria-label": string;
  variant?: "primary" | "stop";
  disabled?: boolean;
}) {
  const base =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2";
  const styles =
    variant === "primary"
      ? "bg-[#84c126] text-white hover:bg-[#6fa020]"
      : variant === "stop"
        ? "bg-[#FFAB19] text-white"
        : "border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]";
  const disabledStyles =
    disabled === true
      ? "cursor-not-allowed opacity-45 hover:bg-white"
      : "";
  return (
    <WorkspaceHeaderTooltip text={title}>
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={onClick}
        className={`${base} ${styles} ${disabledStyles}`}
      >
        {children}
      </button>
    </WorkspaceHeaderTooltip>
  );
}
