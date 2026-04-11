"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactElement,
} from "react";
import {
  ChevronDown,
  Circle,
  Droplet,
  Eraser,
  MousePointer2,
  Paintbrush,
  Slash,
  Square,
  Trash,
  Trash2,
  Triangle,
  Undo2,
  X,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadPaintedCostumePng } from "@/lib/supabase/costumePaintStorage";

const CANVAS_W = 800;
const CANVAS_H = 450;
const SPRITE_LABEL_MAX = 48;
const MAX_UNDO = 25;
const TOOL_ICON_STROKE = 2;
const BRUSH_WIDTH_MIN = 1;
const BRUSH_WIDTH_MAX = 40;
const BRUSH_WIDTH_OPTIONS = Array.from(
  { length: BRUSH_WIDTH_MAX - BRUSH_WIDTH_MIN + 1 },
  (_, i) => BRUSH_WIDTH_MIN + i,
);

/**
 * Decodes costume pixels for editing. Prefer fetch→blob (CORS-friendly for Supabase);
 * fall back to decoding an `<img>` if fetch fails (e.g. some same-origin paths).
 */
async function loadImageBitmapForPaint(src: string): Promise<ImageBitmap> {
  try {
    const res = await fetch(src, { mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error(String(res.status));
    return await createImageBitmap(await res.blob());
  } catch {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("img"));
      img.src = src;
    });
    return createImageBitmap(img);
  }
}

/** Scales image uniformly to fit inside the raster, centered (letterboxed with transparency). */
function drawImageContainOnRaster(
  rctx: CanvasRenderingContext2D,
  im: ImageBitmap | HTMLImageElement,
  cw: number,
  ch: number,
) {
  rctx.clearRect(0, 0, cw, ch);
  const iw = im instanceof ImageBitmap ? im.width : im.naturalWidth;
  const ih = im instanceof ImageBitmap ? im.height : im.naturalHeight;
  if (iw < 1 || ih < 1) return;
  const scale = Math.min(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;
  rctx.drawImage(im, 0, 0, iw, ih, dx, dy, dw, dh);
}

/**
 * Dot pattern in the drawable frame (not square grid lines), visible wherever the canvas is transparent.
 */
const DOT_WORKSPACE_LAYER_STYLE: CSSProperties = {
  backgroundColor: "#f1f5f9",
  backgroundImage: "radial-gradient(circle, rgb(148 163 184 / 0.55) 1.1px, transparent 1.1px)",
  backgroundSize: "14px 14px",
};

type Tool =
  | "brush"
  | "eraser"
  | "fill"
  | "select"
  | "line"
  | "rect"
  | "ellipse"
  | "triangle";

type ShapeKind = "line" | "rect" | "ellipse" | "triangle";

type ShapeRecord = {
  id: string;
  kind: ShapeKind;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  fillColor: string;
  strokeColor: string;
  lineWidth: number;
  fillClosed: boolean;
};

type UndoSnapshot = {
  raster: ImageData;
  shapes: ShapeRecord[];
};

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "start" | "end";

const PAINT_TOOLS: {
  id: Tool;
  label: string;
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: "brush", label: "Brush", Icon: Paintbrush },
  { id: "eraser", label: "Eraser", Icon: Eraser },
  { id: "fill", label: "Fill", Icon: Droplet },
  { id: "select", label: "Select", Icon: MousePointer2 },
  { id: "line", label: "Line", Icon: Slash },
  { id: "rect", label: "Rectangle", Icon: Square },
  { id: "ellipse", label: "Ellipse", Icon: Circle },
  { id: "triangle", label: "Triangle", Icon: Triangle },
];

/**
 * Hover + keyboard (`:focus-visible`) only — same interaction model as WorkspaceHeaderTooltip.
 * Shown below the icon so it sits over the canvas gutter, not clipped by the panel top.
 */
function PaintToolbarTooltip({
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
        className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-[100021] -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#111827] px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg ring-1 ring-black/10 transition-opacity duration-150 ease-out group-hover:opacity-100 group-[&:has(*:focus-visible)]:opacity-100"
      >
        {text}
      </span>
    </div>
  );
}

function ColorSwatchDropdown({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="relative flex shrink-0 items-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-9 min-w-[6.25rem] items-center gap-1.5 rounded-lg border border-solid border-[#e5e7eb] bg-white px-2 text-xs font-semibold text-[#374151] shadow-sm hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126]"
        aria-label={`${label} color`}
      >
        <span className="min-w-0 truncate">{label}</span>
        <span
          className="size-5 shrink-0 rounded border border-solid border-[#d1d5db]"
          style={{ backgroundColor: value }}
          aria-hidden
        />
        <ChevronDown className="size-3.5 shrink-0 opacity-50" strokeWidth={2} aria-hidden />
      </button>
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}

function isShapeTool(t: Tool): t is "line" | "rect" | "ellipse" | "triangle" {
  return t === "line" || t === "rect" || t === "ellipse" || t === "triangle";
}

function shapeBounds(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  return {
    left: Math.min(x0, x1),
    right: Math.max(x0, x1),
    top: Math.min(y0, y1),
    bottom: Math.max(y0, y1),
  };
}

type ShapeDrawOpts = {
  fillColor: string;
  strokeColor: string;
  lineWidth: number;
  fillClosed: boolean;
  preview: boolean;
};

function drawShapePath(
  ctx: CanvasRenderingContext2D,
  tool: "line" | "rect" | "ellipse" | "triangle",
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  const { left, right, top, bottom } = shapeBounds(x0, y0, x1, y1);
  if (tool === "line") {
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    return;
  }
  if (tool === "rect") {
    ctx.rect(left, top, right - left, bottom - top);
    return;
  }
  if (tool === "ellipse") {
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;
    const rx = Math.max(1, (right - left) / 2);
    const ry = Math.max(1, (bottom - top) / 2);
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    return;
  }
  // triangle: points up inside the drag box
  ctx.moveTo((left + right) / 2, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.closePath();
}

function renderShape(
  ctx: CanvasRenderingContext2D,
  tool: "line" | "rect" | "ellipse" | "triangle",
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  opts: ShapeDrawOpts,
) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1, opts.lineWidth);
  ctx.strokeStyle = opts.strokeColor;
  ctx.fillStyle = opts.fillColor;
  if (opts.preview) {
    ctx.setLineDash([5, 5]);
  }
  ctx.beginPath();
  drawShapePath(ctx, tool, x0, y0, x1, y1);
  if (tool !== "line" && opts.fillClosed) {
    ctx.fill();
  }
  ctx.stroke();
  ctx.restore();
}

const HANDLE_HIT_PX = 12;

function distanceToSegment(
  px: number,
  py: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): number {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-6) return Math.hypot(px - x0, py - y0);
  let t = ((px - x0) * dx + (py - y0) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const qx = x0 + t * dx;
  const qy = y0 + t * dy;
  return Math.hypot(px - qx, py - qy);
}

function hitHandleForShape(
  px: number,
  py: number,
  s: ShapeRecord,
): ResizeHandle | null {
  const pad = HANDLE_HIT_PX;
  if (s.kind === "line") {
    if (Math.hypot(px - s.x0, py - s.y0) <= pad) return "start";
    if (Math.hypot(px - s.x1, py - s.y1) <= pad) return "end";
    return null;
  }
  const { left, right, top, bottom } = shapeBounds(s.x0, s.y0, s.x1, s.y1);
  const corners: { h: ResizeHandle; x: number; y: number }[] = [
    { h: "nw", x: left, y: top },
    { h: "ne", x: right, y: top },
    { h: "sw", x: left, y: bottom },
    { h: "se", x: right, y: bottom },
  ];
  for (const { h, x, y } of corners) {
    if (Math.hypot(px - x, py - y) <= pad) return h;
  }
  return null;
}

function hitShapeBody(px: number, py: number, s: ShapeRecord): boolean {
  const lw = Math.max(s.lineWidth, 4);
  const pad = lw + 6;
  if (s.kind === "line") {
    return distanceToSegment(px, py, s.x0, s.y0, s.x1, s.y1) <= pad;
  }
  const { left, right, top, bottom } = shapeBounds(s.x0, s.y0, s.x1, s.y1);
  if (s.fillClosed) {
    return px >= left && px <= right && py >= top && py <= bottom;
  }
  const outer =
    px >= left - pad &&
    px <= right + pad &&
    py >= top - pad &&
    py <= bottom + pad;
  const inner =
    px >= left + pad &&
    px <= right - pad &&
    py >= top + pad &&
    py <= bottom - pad;
  return outer && !inner;
}

function drawSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  s: ShapeRecord,
) {
  const { left, right, top, bottom } = shapeBounds(s.x0, s.y0, s.x1, s.y1);
  ctx.save();
  ctx.strokeStyle = "#2563eb";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  if (s.kind === "line") {
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(s.x0, s.y0);
    ctx.lineTo(s.x1, s.y1);
    ctx.stroke();
    ctx.setLineDash([]);
    for (const [cx, cy] of [
      [s.x0, s.y0],
      [s.x1, s.y1],
    ] as const) {
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else {
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(left - 1, top - 1, right - left + 2, bottom - top + 2);
    ctx.setLineDash([]);
    for (const [hx, hy] of [
      [left, top],
      [right, top],
      [left, bottom],
      [right, bottom],
    ] as const) {
      ctx.fillRect(hx - 5, hy - 5, 10, 10);
      ctx.strokeRect(hx - 5, hy - 5, 10, 10);
    }
  }
  ctx.restore();
}

function cloneShapes(shapes: ShapeRecord[]): ShapeRecord[] {
  return shapes.map((s) => ({ ...s }));
}

function clampCanvasCoord(x: number, y: number) {
  return {
    x: Math.max(0, Math.min(CANVAS_W, x)),
    y: Math.max(0, Math.min(CANVAS_H, y)),
  };
}

function aabbFromCorners(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): Pick<ShapeRecord, "x0" | "y0" | "x1" | "y1"> {
  const p = clampCanvasCoord(bx, by);
  return {
    x0: Math.min(ax, p.x),
    y0: Math.min(ay, p.y),
    x1: Math.max(ax, p.x),
    y1: Math.max(ay, p.y),
  };
}

function applyShapeResize(
  s: ShapeRecord,
  handle: ResizeHandle,
  px: number,
  py: number,
) {
  const b = shapeBounds(s.x0, s.y0, s.x1, s.y1);
  if (s.kind === "line") {
    const p = clampCanvasCoord(px, py);
    if (handle === "start") {
      s.x0 = p.x;
      s.y0 = p.y;
    } else {
      s.x1 = p.x;
      s.y1 = p.y;
    }
    return;
  }
  let next: Pick<ShapeRecord, "x0" | "y0" | "x1" | "y1">;
  if (handle === "se") {
    next = aabbFromCorners(b.left, b.top, px, py);
  } else if (handle === "nw") {
    next = aabbFromCorners(b.right, b.bottom, px, py);
  } else if (handle === "ne") {
    next = aabbFromCorners(b.left, b.bottom, px, py);
  } else {
    next = aabbFromCorners(b.right, b.top, px, py);
  }
  s.x0 = next.x0;
  s.y0 = next.y0;
  s.x1 = next.x1;
  s.y1 = next.y1;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function colorsMatch(
  d: Uint8ClampedArray,
  i: number,
  r: number,
  g: number,
  b: number,
  a: number,
): boolean {
  return d[i] === r && d[i + 1] === g && d[i + 2] === b && d[i + 3] === a;
}

function floodFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fillRgb: [number, number, number],
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  if (xi < 0 || xi >= w || yi < 0 || yi >= h) return;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const start = (yi * w + xi) * 4;
  const tr = d[start];
  const tg = d[start + 1];
  const tb = d[start + 2];
  const ta = d[start + 3];
  const fr = fillRgb[0];
  const fg = fillRgb[1];
  const fb = fillRgb[2];
  const fa = 255;
  if (tr === fr && tg === fg && tb === fb && ta === fa) return;
  const stack: [number, number][] = [[xi, yi]];
  const target = [tr, tg, tb, ta];
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    const idx = (cy * w + cx) * 4;
    if (!colorsMatch(d, idx, target[0], target[1], target[2], target[3])) continue;
    d[idx] = fr;
    d[idx + 1] = fg;
    d[idx + 2] = fb;
    d[idx + 3] = fa;
    if (cx > 0) stack.push([cx - 1, cy]);
    if (cx + 1 < w) stack.push([cx + 1, cy]);
    if (cy > 0) stack.push([cx, cy - 1]);
    if (cy + 1 < h) stack.push([cx, cy + 1]);
  }
  ctx.putImageData(img, 0, 0);
}

export type CostumePaintSaveResult = {
  publicUrl: string;
  /** `projects` bucket path — refresh signed URLs on load. */
  storagePath: string;
  /** Trimmed sprite label for the stage actor. */
  label: string;
};

type CostumePaintModalProps = {
  open: boolean;
  onClose: () => void;
  /** Seed for the name field when the modal opens (usually the selected sprite label). */
  initialSpriteLabel: string;
  /**
   * When set (painted/upload URL or catalog PNG `src`), loads into the canvas so the user can
   * keep editing. Omit for a blank canvas.
   */
  initialImageSrc?: string | null;
  /** Called after a successful Supabase upload. */
  onSaved: (result: CostumePaintSaveResult) => void;
};

export function CostumePaintModal({
  open,
  onClose,
  initialSpriteLabel,
  initialImageSrc = null,
  onSaved,
}: CostumePaintModalProps) {
  const titleId = useId();
  const spriteNameFieldId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Bitmap layer: brush, eraser, fill only. Composed with {@link shapesRef} on the display canvas. */
  const rasterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const shapesRef = useRef<ShapeRecord[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [selectedShapeKind, setSelectedShapeKind] =
    useState<ShapeKind | null>(null);
  const selectedShapeIdRef = useRef<string | null>(null);
  const selectDragRef = useRef<
    | null
    | {
        mode: "move";
        shapeId: string;
        orig: ShapeRecord;
        startX: number;
        startY: number;
      }
    | {
        mode: "resize";
        shapeId: string;
        handle: ResizeHandle;
        orig: ShapeRecord;
      }
  >(null);
  const shapeDraftRef = useRef<{
    kind: ShapeKind;
    sx: number;
    sy: number;
  } | null>(null);

  const [tool, setTool] = useState<Tool>("brush");
  /** Keeps pointer handlers and {@link redraw} aligned when we switch tools synchronously (e.g. after placing a shape). */
  const toolRef = useRef<Tool>(tool);
  toolRef.current = tool;
  const [fillColor, setFillColor] = useState("#222222");
  const [outlineColor, setOutlineColor] = useState("#222222");
  const [brushSize, setBrushSize] = useState(4);
  /** Filled interior vs stroke-only outline for rectangle, ellipse, and triangle (lines are always stroke-only). */
  const [shapeFill, setShapeFill] = useState(true);
  const [spriteName, setSpriteName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const lastShapePointRef = useRef<{ x: number; y: number } | null>(null);
  const undoStack = useRef<UndoSnapshot[]>([]);

  /** Select a shape (syncs fill/outline swatches) or clear selection without resetting those colors. */
  const applySelection = useCallback((shape: ShapeRecord | null) => {
    if (!shape) {
      selectedShapeIdRef.current = null;
      setSelectedShapeId(null);
      setSelectedShapeKind(null);
      return;
    }
    selectedShapeIdRef.current = shape.id;
    setSelectedShapeId(shape.id);
    setSelectedShapeKind(shape.kind);
    setFillColor(shape.fillColor);
    setOutlineColor(shape.strokeColor);
  }, []);

  const redraw = useCallback(() => {
    const disp = canvasRef.current?.getContext("2d");
    const raster = rasterCanvasRef.current;
    if (!disp || !raster) return;
    disp.clearRect(0, 0, CANVAS_W, CANVAS_H);
    disp.drawImage(raster, 0, 0);
    for (const s of shapesRef.current) {
      renderShape(disp, s.kind, s.x0, s.y0, s.x1, s.y1, {
        fillColor: s.fillColor,
        strokeColor: s.strokeColor,
        lineWidth: s.lineWidth,
        fillClosed: s.fillClosed,
        preview: false,
      });
    }
    if (toolRef.current === "select") {
      const sid = selectedShapeIdRef.current;
      if (sid) {
        const sel = shapesRef.current.find((x) => x.id === sid);
        if (sel) drawSelectionOverlay(disp, sel);
      }
    }
  }, []);

  const snapshot = useCallback(() => {
    const raster = rasterCanvasRef.current?.getContext("2d");
    if (!raster) return;
    undoStack.current.push({
      raster: raster.getImageData(0, 0, CANVAS_W, CANVAS_H),
      shapes: cloneShapes(shapesRef.current),
    });
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();
  }, []);

  const resetSessionOnOpen = useCallback(() => {
    const raster = rasterCanvasRef.current?.getContext("2d", { alpha: true });
    if (!raster) return;
    undoStack.current = [];
    shapesRef.current = [];
    applySelection(null);
    selectDragRef.current = null;
    shapeDraftRef.current = null;
    raster.clearRect(0, 0, CANVAS_W, CANVAS_H);
    redraw();
  }, [redraw, applySelection]);

  const clearPaintContent = useCallback(() => {
    const raster = rasterCanvasRef.current?.getContext("2d", { alpha: true });
    if (!raster) return;
    shapesRef.current = [];
    applySelection(null);
    selectDragRef.current = null;
    shapeDraftRef.current = null;
    raster.clearRect(0, 0, CANVAS_W, CANVAS_H);
    redraw();
  }, [redraw, applySelection]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSaving(false);
    const seed = initialSpriteLabel.trim();
    setSpriteName(seed.length > 0 ? seed.slice(0, SPRITE_LABEL_MAX) : "Sprite");

    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      resetSessionOnOpen();
      const src = initialImageSrc?.trim();
      if (!src) return;

      void loadImageBitmapForPaint(src)
        .then((bmp) => {
          if (cancelled) {
            bmp.close();
            return;
          }
          const rctx = rasterCanvasRef.current?.getContext("2d", {
            alpha: true,
          });
          if (!rctx) {
            bmp.close();
            return;
          }
          try {
            drawImageContainOnRaster(rctx, bmp, CANVAS_W, CANVAS_H);
            redraw();
          } finally {
            bmp.close();
          }
        })
        .catch(() => {
          if (!cancelled) {
            setError(
              "Could not load the costume image to edit. You can still paint from scratch.",
            );
          }
        });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [open, resetSessionOnOpen, initialSpriteLabel, initialImageSrc, redraw]);

  useEffect(() => {
    if (!open) return;
    redraw();
  }, [open, tool, redraw]);

  const clientToCanvas = useCallback(
    (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
      const c = canvasRef.current;
      if (!c) return { x: 0, y: 0 };
      const r = c.getBoundingClientRect();
      const scaleX = c.width / r.width;
      const scaleY = c.height / r.height;
      let clientX: number;
      let clientY: number;
      if ("touches" in e) {
        const t = e.touches[0] ?? e.changedTouches[0];
        clientX = t?.clientX ?? 0;
        clientY = t?.clientY ?? 0;
      } else {
        const pe = e as React.MouseEvent | React.PointerEvent;
        clientX = pe.clientX;
        clientY = pe.clientY;
      }
      return {
        x: (clientX - r.left) * scaleX,
        y: (clientY - r.top) * scaleY,
      };
    },
    [],
  );

  const paintLine = useCallback(
    (x0: number, y0: number, x1: number, y1: number) => {
      const ctx = rasterCanvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = brushSize;
      if (tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = outlineColor;
      }
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.restore();
      redraw();
    },
    [brushSize, outlineColor, tool, redraw],
  );

  const onCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      const t = toolRef.current;
      const { x, y } = clientToCanvas(e);
      const rctx = rasterCanvasRef.current?.getContext("2d");
      if (!rasterCanvasRef.current || !rctx) return;
      const canvasEl = e.currentTarget;

      const tryCapture = () => {
        try {
          canvasEl.setPointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
      };

      if (t === "select") {
        for (let i = shapesRef.current.length - 1; i >= 0; i--) {
          const s = shapesRef.current[i];
          const h = hitHandleForShape(x, y, s);
          if (h) {
            snapshot();
            selectDragRef.current = {
              mode: "resize",
              shapeId: s.id,
              handle: h,
              orig: { ...s },
            };
            applySelection(s);
            tryCapture();
            redraw();
            return;
          }
          if (hitShapeBody(x, y, s)) {
            snapshot();
            selectDragRef.current = {
              mode: "move",
              shapeId: s.id,
              orig: { ...s },
              startX: x,
              startY: y,
            };
            applySelection(s);
            tryCapture();
            redraw();
            return;
          }
        }
        applySelection(null);
        redraw();
        return;
      }

      if (t === "fill") {
        snapshot();
        const [r, g, b] = hexToRgb(fillColor);
        floodFill(rctx, x, y, [r, g, b]);
        redraw();
        return;
      }

      if (isShapeTool(t)) {
        snapshot();
        shapeDraftRef.current = { kind: t, sx: x, sy: y };
        lastShapePointRef.current = { x, y };
        drawing.current = true;
        tryCapture();
        return;
      }

      snapshot();
      drawing.current = true;
      last.current = { x, y };
      tryCapture();
      paintLine(x, y, x, y);
    },
    [clientToCanvas, paintLine, redraw, snapshot, fillColor, applySelection],
  );

  const onCanvasPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const { x, y } = clientToCanvas(e);

      if (toolRef.current === "select" && selectDragRef.current) {
        const drag = selectDragRef.current;
        const s = shapesRef.current.find((z) => z.id === drag.shapeId);
        if (!s) return;
        if (drag.mode === "move") {
          const dx = x - drag.startX;
          const dy = y - drag.startY;
          const o = drag.orig;
          s.x0 = o.x0 + dx;
          s.y0 = o.y0 + dy;
          s.x1 = o.x1 + dx;
          s.y1 = o.y1 + dy;
        } else {
          Object.assign(s, drag.orig);
          applyShapeResize(s, drag.handle, x, y);
        }
        redraw();
        return;
      }

      if (!drawing.current || toolRef.current === "fill") return;
      if (isShapeTool(toolRef.current) && shapeDraftRef.current) {
        const d = shapeDraftRef.current;
        lastShapePointRef.current = { x, y };
        redraw();
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        renderShape(ctx, d.kind, d.sx, d.sy, x, y, {
          fillColor,
          strokeColor: outlineColor,
          lineWidth: brushSize,
          fillClosed: shapeFill && d.kind !== "line",
          preview: true,
        });
        return;
      }
      const prev = last.current;
      if (prev) paintLine(prev.x, prev.y, x, y);
      last.current = { x, y };
    },
    [clientToCanvas, paintLine, redraw, fillColor, outlineColor, brushSize, shapeFill],
  );

  const endStroke = useCallback(
    (e?: React.PointerEvent<HTMLCanvasElement>) => {
      if (toolRef.current === "select" && selectDragRef.current) {
        selectDragRef.current = null;
        redraw();
        return;
      }

      if (isShapeTool(toolRef.current) && drawing.current && shapeDraftRef.current) {
        const d = shapeDraftRef.current;
        let x = lastShapePointRef.current?.x ?? d.sx;
        let y = lastShapePointRef.current?.y ?? d.sy;
        if (e) {
          const p = clientToCanvas(e);
          x = p.x;
          y = p.y;
        }
        const newId = crypto.randomUUID();
        const newShape: ShapeRecord = {
          id: newId,
          kind: d.kind,
          x0: d.sx,
          y0: d.sy,
          x1: x,
          y1: y,
          fillColor,
          strokeColor: outlineColor,
          lineWidth: brushSize,
          fillClosed: shapeFill && d.kind !== "line",
        };
        shapesRef.current.push(newShape);
        shapeDraftRef.current = null;
        lastShapePointRef.current = null;
        drawing.current = false;
        toolRef.current = "select";
        setTool("select");
        applySelection(newShape);
        redraw();
        return;
      }

      drawing.current = false;
      last.current = null;
    },
    [clientToCanvas, fillColor, outlineColor, brushSize, shapeFill, redraw, applySelection],
  );

  const handleFillColorChange = useCallback(
    (hex: string) => {
      setFillColor(hex);
      if (toolRef.current !== "select" || !selectedShapeIdRef.current) return;
      const s = shapesRef.current.find((z) => z.id === selectedShapeIdRef.current);
      if (!s || s.kind === "line") return;
      snapshot();
      s.fillColor = hex;
      redraw();
    },
    [snapshot, redraw],
  );

  const handleOutlineColorChange = useCallback(
    (hex: string) => {
      setOutlineColor(hex);
      if (toolRef.current !== "select" || !selectedShapeIdRef.current) return;
      const s = shapesRef.current.find((z) => z.id === selectedShapeIdRef.current);
      if (!s) return;
      snapshot();
      s.strokeColor = hex;
      redraw();
    },
    [snapshot, redraw],
  );

  const handleDeleteSelectedShape = useCallback(() => {
    const id = selectedShapeIdRef.current;
    if (!id) return;
    const idx = shapesRef.current.findIndex((s) => s.id === id);
    if (idx < 0) return;
    snapshot();
    shapesRef.current.splice(idx, 1);
    applySelection(null);
    selectDragRef.current = null;
    redraw();
  }, [snapshot, redraw, applySelection]);

  const handleUndo = useCallback(() => {
    const rctx = rasterCanvasRef.current?.getContext("2d");
    if (!rctx) return;
    const prev = undoStack.current.pop();
    if (!prev) return;
    rctx.putImageData(prev.raster, 0, 0);
    shapesRef.current = cloneShapes(prev.shapes);
    const sid = selectedShapeIdRef.current;
    if (sid && !shapesRef.current.some((s) => s.id === sid)) {
      applySelection(null);
    } else if (sid) {
      const sh = shapesRef.current.find((s) => s.id === sid);
      if (sh) applySelection(sh);
    }
    redraw();
  }, [redraw, applySelection]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (toolRef.current === "select") {
          applySelection(null);
          redraw();
          return;
        }
        onClose();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const target = e.target as HTMLElement | null;
        if (target?.closest("input, textarea, [contenteditable='true']")) {
          return;
        }
        if (
          toolRef.current === "select" &&
          selectedShapeIdRef.current
        ) {
          e.preventDefault();
          handleDeleteSelectedShape();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, redraw, applySelection, handleDeleteSelectedShape]);

  const handleClear = useCallback(() => {
    snapshot();
    clearPaintContent();
  }, [clearPaintContent, snapshot]);

  const handleSave = useCallback(async () => {
    const c = canvasRef.current;
    const supabase = getSupabaseBrowserClient();
    if (!c || !supabase) {
      setError(!supabase ? "Sign in to save painted costumes." : "Canvas missing.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) {
        setError("Sign in to save painted costumes.");
        setSaving(false);
        return;
      }
      const blob = await new Promise<Blob | null>((resolve) =>
        c.toBlob((b) => resolve(b), "image/png"),
      );
      if (!blob) {
        setError("Could not export image.");
        setSaving(false);
        return;
      }
      const { publicUrl, storagePath, error: upErr } =
        await uploadPaintedCostumePng(supabase, uid, blob);
      if (upErr || !publicUrl || !storagePath) {
        setError(upErr?.message ?? "Upload failed.");
        setSaving(false);
        return;
      }
      const trimmed = spriteName.trim();
      const label =
        trimmed.length > 0 ? trimmed.slice(0, SPRITE_LABEL_MAX) : "Sprite";
      onSaved({ publicUrl, storagePath, label });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }, [onClose, onSaved, spriteName]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100020] flex min-h-0 items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/*
        z-[100020] sits above OllieWorkspace sticky header (z-[100000]). Height caps to the visible
        viewport using svh + margin so the dialog never runs under the header or off-screen.
      */}
      <div className="relative z-10 flex h-[min(88dvh,calc(100svh-4.5rem))] w-full max-w-6xl min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e5e7eb] bg-[#f8fafc] px-4 py-3">
          <h2 id={titleId} className="font-display text-lg font-bold text-[#111827]">
            {initialImageSrc?.trim() ? "Edit Sprite" : "Create Sprite"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg text-[#6b7280] transition hover:bg-[#f1f5f9] hover:text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126]"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
          <div className="mb-3 flex min-w-0 max-w-md shrink-0 flex-col gap-1">
            <label
              htmlFor={spriteNameFieldId}
              className="text-xs font-semibold text-[#374151]"
            >
              Sprite name
            </label>
            <input
              id={spriteNameFieldId}
              type="text"
              value={spriteName}
              onChange={(e) =>
                setSpriteName(e.target.value.slice(0, SPRITE_LABEL_MAX))
              }
              autoComplete="off"
              placeholder="Name this sprite"
              className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3.5 py-2.5 text-sm font-semibold text-[#111827] shadow-inner outline-none transition placeholder:text-[#9ca3af] focus:border-[#84c126] focus:bg-white focus:ring-4 focus:ring-[#d9f99d]/60"
            />
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border-2 border-solid border-[#64748b] bg-white shadow-sm">
            <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-2 border-b-2 border-solid border-[#cbd5e1] bg-[#f8fafc] px-3 py-2">
              <div className="flex shrink-0 items-center gap-1.5">
                {PAINT_TOOLS.map(({ id, label, Icon }) => (
                  <PaintToolbarTooltip key={id} text={label}>
                    <button
                      type="button"
                      aria-label={label}
                      aria-pressed={tool === id}
                      onClick={() => setTool(id)}
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-solid transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126] focus-visible:ring-offset-2 ${
                        tool === id
                          ? "border-[#84c126] bg-[#ecfccb] text-[#365314]"
                          : "border-[#e5e7eb] bg-white text-[#4b5563] hover:border-[#cbd5e1] hover:bg-[#f9fafb]"
                      }`}
                    >
                      <Icon
                        className="size-5 shrink-0"
                        strokeWidth={TOOL_ICON_STROKE}
                        aria-hidden
                      />
                      <span className="sr-only">{label}</span>
                    </button>
                  </PaintToolbarTooltip>
                ))}
              </div>
              {(tool === "rect" || tool === "ellipse" || tool === "triangle") ? (
                <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#374151]">
                  <span className="sr-only">Shape style</span>
                  <select
                    value={shapeFill ? "filled" : "outline"}
                    onChange={(e) => setShapeFill(e.target.value === "filled")}
                    className="h-9 min-w-[7.5rem] shrink-0 cursor-pointer rounded-lg border border-solid border-[#e5e7eb] bg-white px-2 text-xs font-semibold text-[#374151] shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126]"
                    aria-label="Shape style"
                  >
                    <option value="filled">Filled</option>
                    <option value="outline">Outline</option>
                  </select>
                </label>
              ) : null}
              {(tool === "fill" ||
                tool === "rect" ||
                tool === "ellipse" ||
                tool === "triangle" ||
                (tool === "select" &&
                  selectedShapeId &&
                  selectedShapeKind &&
                  selectedShapeKind !== "line")) ? (
                <ColorSwatchDropdown
                  label="Fill"
                  value={fillColor}
                  onChange={handleFillColorChange}
                />
              ) : null}
              {(tool === "brush" ||
                tool === "line" ||
                tool === "rect" ||
                tool === "ellipse" ||
                tool === "triangle" ||
                (tool === "select" && selectedShapeId)) ? (
                <ColorSwatchDropdown
                  label="Outline"
                  value={outlineColor}
                  onChange={handleOutlineColorChange}
                />
              ) : null}
              {(tool === "brush" ||
                tool === "eraser" ||
                isShapeTool(tool)) ? (
                <label className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#374151]">
                  <span className="whitespace-nowrap">
                    {isShapeTool(tool) ? "Width" : "Size"}
                  </span>
                  <select
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="h-9 w-[4.25rem] shrink-0 cursor-pointer rounded-lg border border-solid border-[#e5e7eb] bg-white px-2 text-center text-xs font-semibold text-[#374151] shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126]"
                    aria-label={isShapeTool(tool) ? "Line width" : "Brush size"}
                  >
                    {BRUSH_WIDTH_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {tool === "select" && selectedShapeId ? (
                <PaintToolbarTooltip text="Delete">
                  <button
                    type="button"
                    aria-label="Delete selected shape"
                    onClick={handleDeleteSelectedShape}
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-solid border-[#e5e7eb] bg-white text-[#4b5563] transition hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126]"
                  >
                    <Trash
                      className="size-5 shrink-0"
                      strokeWidth={TOOL_ICON_STROKE}
                      aria-hidden
                    />
                  </button>
                </PaintToolbarTooltip>
              ) : null}
              <PaintToolbarTooltip text="Undo">
                <button
                  type="button"
                  aria-label="Undo"
                  onClick={handleUndo}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-solid border-[#e5e7eb] bg-white text-[#4b5563] transition hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126]"
                >
                  <Undo2
                    className="size-5 shrink-0"
                    strokeWidth={TOOL_ICON_STROKE}
                    aria-hidden
                  />
                </button>
              </PaintToolbarTooltip>
              <PaintToolbarTooltip text="Clear">
                <button
                  type="button"
                  aria-label="Clear canvas"
                  onClick={handleClear}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-solid border-[#e5e7eb] bg-white text-[#4b5563] transition hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126]"
                >
                  <Trash2
                    className="size-5 shrink-0"
                    strokeWidth={TOOL_ICON_STROKE}
                    aria-hidden
                  />
                </button>
              </PaintToolbarTooltip>
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden bg-[#cbd5e1] p-2 sm:p-3">
              <div
                className="relative w-full min-w-0 max-w-full overflow-hidden rounded border-2 border-solid border-[#334155] shadow-sm"
                style={{
                  aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
                  maxWidth: CANVAS_W,
                  maxHeight: "100%",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 z-0"
                  style={DOT_WORKSPACE_LAYER_STYLE}
                  aria-hidden
                />
                <canvas
                  ref={rasterCanvasRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  className="hidden"
                  aria-hidden
                />
                <canvas
                  ref={canvasRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  className={`relative z-[1] block h-full w-full touch-none bg-transparent ${
                    tool === "select" ? "cursor-default" : "cursor-crosshair"
                  }`}
                  onPointerDown={onCanvasPointerDown}
                  onPointerMove={onCanvasPointerMove}
                  onPointerUp={(e) => endStroke(e)}
                  onPointerCancel={(e) => endStroke(e)}
                />
              </div>
            </div>
          </div>
          {error ? (
            <p className="mt-2 shrink-0 text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-bold text-[#4b5563] shadow-sm hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="rounded-xl border-2 border-[#65a30d] bg-gradient-to-b from-[#a3e635] to-[#84cc16] px-5 py-2.5 text-sm font-bold text-[#1a2e05] shadow-md transition hover:from-[#bef264] hover:to-[#a3e635] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84c126]"
          >
            {saving ? "Saving…" : "Save to costume"}
          </button>
        </div>
      </div>
    </div>
  );
}
