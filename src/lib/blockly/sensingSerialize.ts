import type { Block } from "blockly/core";
import type { SerializedBoolExpr, SerializedNumExpr } from "@/types/ollie";

const DEG_TO_RAD = Math.PI / 180;

/**
 * Turn a Blockly boolean/value subtree into a JSON-safe AST for **runtime** evaluation
 * on the stage (mouse, keys, timer, …). Returns `null` if the tree uses unsupported blocks
 * — the caller falls back to compile-time evaluation where possible.
 */
export function serializeBoolExpr(block: Block | null): SerializedBoolExpr | null {
  if (!block) return null;

  switch (block.type) {
    case "logic_boolean": {
      return { k: "b", v: block.getFieldValue("BOOL") === "TRUE" };
    }
    case "logic_negate": {
      const inner = serializeBoolExpr(block.getInputTargetBlock("BOOL"));
      return inner ? { k: "not", a: inner } : null;
    }
    case "logic_operation": {
      const op = block.getFieldValue("OP");
      const a = serializeBoolExpr(block.getInputTargetBlock("A"));
      const b = serializeBoolExpr(block.getInputTargetBlock("B"));
      if (!a || !b) return null;
      if (op === "AND") return { k: "and", a, b };
      if (op === "OR") return { k: "or", a, b };
      return null;
    }
    case "logic_compare": {
      const cmpOp = block.getFieldValue("OP");
      const map: Record<string, "EQ" | "NEQ" | "LT" | "LTE" | "GT" | "GTE"> = {
        EQ: "EQ",
        NEQ: "NEQ",
        LT: "LT",
        LTE: "LTE",
        GT: "GT",
        GTE: "GTE",
      };
      const o = map[cmpOp];
      if (!o) return null;
      const a = serializeNumExpr(block.getInputTargetBlock("A"));
      const b = serializeNumExpr(block.getInputTargetBlock("B"));
      if (!a || !b) return null;
      return { k: "cmp", op: o, a, b };
    }
    case "logic_ternary": {
      const cond = serializeBoolExpr(block.getInputTargetBlock("IF"));
      const bt = serializeBoolExpr(block.getInputTargetBlock("THEN"));
      const bf = serializeBoolExpr(block.getInputTargetBlock("ELSE"));
      if (!cond || !bt || !bf) return null;
      return {
        k: "or",
        a: { k: "and", a: cond, b: bt },
        b: { k: "and", a: { k: "not", a: cond }, b: bf },
      };
    }
    case "ollie_sensing_touching": {
      const v = String(block.getFieldValue("TOUCHING") ?? "MOUSE");
      if (v === "EDGE") return { k: "touchEdge" };
      return { k: "touchMouse" };
    }
    case "ollie_sensing_key_pressed": {
      const keyId = String(block.getFieldValue("KEY") ?? "space");
      return { k: "keyDown", keyId };
    }
    case "ollie_sensing_mouse_down":
      return { k: "mouseDown" };
    default:
      return null;
  }
}

export function serializeNumExpr(block: Block | null): SerializedNumExpr | null {
  if (!block) return null;

  switch (block.type) {
    case "math_number": {
      const raw = block.getFieldValue("NUM");
      const n = Number(raw);
      return { k: "n", v: Number.isFinite(n) ? n : 0 };
    }
    case "math_arithmetic": {
      const op = block.getFieldValue("OP");
      const map: Record<string, "ADD" | "MINUS" | "MULTIPLY" | "DIVIDE" | "POWER"> = {
        ADD: "ADD",
        MINUS: "MINUS",
        MULTIPLY: "MULTIPLY",
        DIVIDE: "DIVIDE",
        POWER: "POWER",
      };
      const o = map[op];
      if (!o) return null;
      const a = serializeNumExpr(block.getInputTargetBlock("A"));
      const b = serializeNumExpr(block.getInputTargetBlock("B"));
      if (!a || !b) return null;
      return { k: "arith", op: o, a, b };
    }
    case "math_single": {
      const op = block.getFieldValue("OP");
      const a = serializeNumExpr(block.getInputTargetBlock("NUM"));
      if (!a) return null;
      return { k: "single", op, a };
    }
    case "math_constant": {
      const c = block.getFieldValue("CONSTANT");
      switch (c) {
        case "PI":
          return { k: "n", v: Math.PI };
        case "E":
          return { k: "n", v: Math.E };
        case "GOLDEN_RATIO":
          return { k: "n", v: (1 + Math.sqrt(5)) / 2 };
        case "SQRT2":
          return { k: "n", v: Math.SQRT2 };
        case "SQRT1_2":
          return { k: "n", v: Math.SQRT1_2 };
        case "INFINITY":
          return { k: "n", v: Number.POSITIVE_INFINITY };
        default:
          return { k: "n", v: 0 };
      }
    }
    case "math_round": {
      const op = block.getFieldValue("OP") as "ROUND" | "ROUNDUP" | "ROUNDDOWN";
      const a = serializeNumExpr(block.getInputTargetBlock("NUM"));
      if (!a) return null;
      return { k: "round", op, a };
    }
    case "math_modulo": {
      const a = serializeNumExpr(block.getInputTargetBlock("DIVIDEND"));
      const b = serializeNumExpr(block.getInputTargetBlock("DIVISOR"));
      if (!a || !b) return null;
      return { k: "mod", a, b };
    }
    case "math_constrain": {
      const v = serializeNumExpr(block.getInputTargetBlock("VALUE"));
      const lo = serializeNumExpr(block.getInputTargetBlock("LOW"));
      const hi = serializeNumExpr(block.getInputTargetBlock("HIGH"));
      if (!v || !lo || !hi) return null;
      return { k: "constrain", v, lo, hi };
    }
    case "math_random_int": {
      const a = serializeNumExpr(block.getInputTargetBlock("FROM"));
      const b = serializeNumExpr(block.getInputTargetBlock("TO"));
      if (!a || !b) return null;
      return { k: "randInt", a, b };
    }
    case "math_random_float":
      return { k: "rand" };
    case "math_atan2": {
      const x = serializeNumExpr(block.getInputTargetBlock("X"));
      const y = serializeNumExpr(block.getInputTargetBlock("Y"));
      if (!x || !y) return null;
      return { k: "atan2", x, y };
    }
    case "ollie_sensing_mouse_x":
      return { k: "mx" };
    case "ollie_sensing_mouse_y":
      return { k: "my" };
    case "ollie_sensing_distance":
      return { k: "distMouse" };
    case "ollie_sensing_timer":
      return { k: "timer" };
    default:
      return null;
  }
}

/** Evaluate serialized math for runtime sensing context. */
export function evalSerializedNum(
  e: SerializedNumExpr,
  ctx: SensingEvalContext,
): number {
  switch (e.k) {
    case "n":
      return e.v;
    case "mx":
      return scratchMouseX(ctx.mouseX, ctx.cw);
    case "my":
      return scratchMouseY(ctx.mouseY, ctx.ch);
    case "distMouse":
      return distanceSpriteToMouse(ctx);
    case "timer":
      return ctx.timerSecs;
    case "arith": {
      const a = evalSerializedNum(e.a, ctx);
      const b = evalSerializedNum(e.b, ctx);
      switch (e.op) {
        case "ADD":
          return a + b;
        case "MINUS":
          return a - b;
        case "MULTIPLY":
          return a * b;
        case "DIVIDE":
          return b === 0 ? 0 : a / b;
        case "POWER":
          return a ** b;
        default:
          return 0;
      }
    }
    case "neg":
      return -evalSerializedNum(e.a, ctx);
    case "single": {
      const n = evalSerializedNum(e.a, ctx);
      const op = e.op;
      switch (op) {
        case "ROOT":
          return Math.sqrt(Math.max(0, n));
        case "ABS":
          return Math.abs(n);
        case "NEG":
          return -n;
        case "LN":
          return Math.log(Math.max(1e-12, n));
        case "LOG10":
          return Math.log10(Math.max(1e-12, n));
        case "EXP":
          return Math.exp(n);
        case "POW10":
          return 10 ** n;
        case "SIN":
          return Math.sin(DEG_TO_RAD * n);
        case "COS":
          return Math.cos(DEG_TO_RAD * n);
        case "TAN":
          return Math.tan(DEG_TO_RAD * n);
        case "ASIN":
          return Math.asin(n) / DEG_TO_RAD;
        case "ACOS":
          return Math.acos(n) / DEG_TO_RAD;
        case "ATAN":
          return Math.atan(n) / DEG_TO_RAD;
        default:
          return 0;
      }
    }
    case "round": {
      const n = evalSerializedNum(e.a, ctx);
      switch (e.op) {
        case "ROUND":
          return Math.round(n);
        case "ROUNDUP":
          return Math.ceil(n);
        case "ROUNDDOWN":
          return Math.floor(n);
        default:
          return Math.round(n);
      }
    }
    case "mod": {
      const a = evalSerializedNum(e.a, ctx);
      const b = evalSerializedNum(e.b, ctx);
      if (b === 0) return 0;
      return ((a % b) + b) % b;
    }
    case "constrain": {
      const v = evalSerializedNum(e.v, ctx);
      const lo = evalSerializedNum(e.lo, ctx);
      const hi = evalSerializedNum(e.hi, ctx);
      return Math.min(hi, Math.max(lo, v));
    }
    case "randInt": {
      const a = Math.ceil(evalSerializedNum(e.a, ctx));
      const b = Math.floor(evalSerializedNum(e.b, ctx));
      if (b < a) return a;
      return a + Math.floor(Math.random() * (b - a + 1));
    }
    case "rand":
      return Math.random();
    case "atan2": {
      const x = evalSerializedNum(e.x, ctx);
      const y = evalSerializedNum(e.y, ctx);
      return Math.atan2(y, x) / DEG_TO_RAD;
    }
    default:
      return 0;
  }
}

export type SensingEvalContext = {
  cw: number;
  ch: number;
  spriteId: string;
  spriteX: number;
  spriteY: number;
  mouseX: number;
  mouseY: number;
  mouseIsPressed: boolean;
  keysDown: ReadonlySet<string>;
  timerSecs: number;
};

function scratchMouseX(mouseX: number, cw: number): number {
  const x = (mouseX / Math.max(1, cw)) * 200 - 100;
  return Math.min(100, Math.max(-100, x));
}

function scratchMouseY(mouseY: number, ch: number): number {
  const y = 100 - (mouseY / Math.max(1, ch)) * 200;
  return Math.min(100, Math.max(-100, y));
}

function distanceSpriteToMouse(ctx: SensingEvalContext): number {
  const dx = ctx.mouseX - ctx.spriteX;
  const dy = ctx.mouseY - ctx.spriteY;
  return Math.round(Math.hypot(dx, dy));
}

/** Evaluate serialized boolean for runtime sensing context. */
export function evalSerializedBool(
  e: SerializedBoolExpr,
  ctx: SensingEvalContext,
): boolean {
  switch (e.k) {
    case "b":
      return e.v;
    case "not":
      return !evalSerializedBool(e.a, ctx);
    case "and":
      return evalSerializedBool(e.a, ctx) && evalSerializedBool(e.b, ctx);
    case "or":
      return evalSerializedBool(e.a, ctx) || evalSerializedBool(e.b, ctx);
    case "cmp": {
      const a = evalSerializedNum(e.a, ctx);
      const b = evalSerializedNum(e.b, ctx);
      switch (e.op) {
        case "EQ":
          return a === b;
        case "NEQ":
          return a !== b;
        case "LT":
          return a < b;
        case "LTE":
          return a <= b;
        case "GT":
          return a > b;
        case "GTE":
          return a >= b;
        default:
          return false;
      }
    }
    case "keyDown":
      return ctx.keysDown.has(e.keyId);
    case "touchEdge":
      return isTouchingEdge(ctx.spriteX, ctx.spriteY, ctx.cw, ctx.ch);
    case "touchMouse":
      return (
        Math.hypot(ctx.mouseX - ctx.spriteX, ctx.mouseY - ctx.spriteY) < 32
      );
    case "mouseDown":
      return ctx.mouseIsPressed;
    default:
      return false;
  }
}

const EDGE_MARGIN = 18;

function isTouchingEdge(
  x: number,
  y: number,
  cw: number,
  ch: number,
): boolean {
  const m = EDGE_MARGIN;
  return x <= m || x >= cw - m || y <= m || y >= ch - m;
}
