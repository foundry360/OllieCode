import type { Block } from "blockly/core";
import { TOUCHING_SPRITE_FIELD_PREFIX } from "@/lib/blockly/spriteTouchingDropdownRegistry";
import type {
  SerializedBoolExpr,
  SerializedColorExpr,
  SerializedListExpr,
  SerializedNumExpr,
  SerializedStringExpr,
} from "@/types/ollie";

const DEG_TO_RAD = Math.PI / 180;

type FieldWithVariable = {
  getVariable?: () => {
    getId: () => string;
    getName?: () => string;
  } | null;
};

const RUN_VAR_NAME_PREFIX = "__ollieName:";

/** Stable key for looking up a variable by Blockly display name (when ids disagree). */
export function runVarNameKey(displayName: string): string {
  return `${RUN_VAR_NAME_PREFIX}${displayName.trim()}`;
}

export function assignRunVar(
  vars: Record<string, number>,
  id: string,
  value: number,
  displayName?: string,
): void {
  if (id) {
    const ik = id.trim();
    if (ik) vars[ik] = value;
  }
  const n = displayName?.trim();
  if (n) vars[runVarNameKey(n)] = value;
}

function normKey(s: string): string {
  return s.normalize("NFC").trim();
}

export function readVarValue(
  vars: Record<string, number> | undefined,
  id: string,
  displayName?: string,
): number | undefined {
  if (!vars) return undefined;
  const idNorm = id ? normKey(id) : "";
  if (idNorm) {
    const direct = vars[idNorm];
    if (typeof direct === "number" && Number.isFinite(direct)) return direct;
    if (typeof vars[id] === "number" && Number.isFinite(vars[id])) return vars[id];
    for (const key of Object.keys(vars)) {
      if (normKey(key) === idNorm) {
        const v = vars[key];
        if (typeof v === "number" && Number.isFinite(v)) return v;
      }
    }
  }
  const n = displayName?.trim();
  if (n) {
    const k = runVarNameKey(n);
    const v = vars[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    /** Blockly may show the same name with different casing on getter vs setter (e.g. answer vs Answer). */
    const want = n.toLowerCase();
    for (const key of Object.keys(vars)) {
      if (!key.startsWith(RUN_VAR_NAME_PREFIX)) continue;
      const rest = key.slice(RUN_VAR_NAME_PREFIX.length);
      if (rest.toLowerCase() !== want) continue;
      const vv = vars[key];
      if (typeof vv === "number" && Number.isFinite(vv)) return vv;
    }
  }
  return undefined;
}

/**
 * Variable id for `variables_get` / `variables_set` — must match keys in {@link SensingEvalContext.vars}.
 * Prefer the live variable model id over `getFieldValue("VAR")` so it stays aligned with `setVar`.
 * Also walks `inputList` so blocks that use a non-`VAR` field name still resolve (e.g. some library variants).
 */
export function getBlocklyVariableId(block: Block): string {
  const fromField = (f: unknown): string | null => {
    const m = (f as FieldWithVariable | null | undefined)?.getVariable?.();
    return m ? m.getId() : null;
  };
  const named = fromField(block.getField("VAR"));
  if (named) return named;
  const raw = String(block.getFieldValue("VAR") ?? "").trim();
  if (raw) return raw;
  for (const input of block.inputList) {
    for (const f of input.fieldRow) {
      const id = fromField(f);
      if (id) return id;
    }
  }
  return "";
}

type FieldMaybeText = { getText?: () => string };

/** Blockly variable **name** (e.g. `Answer`) for dual id/name runtime lookup. */
export function getBlocklyVariableName(block: Block): string | undefined {
  const fromField = (f: unknown): string | undefined => {
    const m = (f as FieldWithVariable | null | undefined)?.getVariable?.();
    if (m && typeof m.getName === "function") {
      const n = m.getName();
      if (n?.trim()) return n.trim();
    }
    const ft = f as FieldMaybeText | null | undefined;
    if (ft && typeof ft.getText === "function") {
      const t = ft.getText();
      if (t?.trim()) return t.trim();
    }
    return undefined;
  };
  const direct = fromField(block.getField("VAR"));
  if (direct) return direct;
  for (const input of block.inputList) {
    for (const f of input.fieldRow) {
      const n = fromField(f);
      if (n) return n;
    }
  }
  /** `FieldVariable.getVariable()` can be null while `VAR` still holds a valid id — resolve via the workspace map. */
  const varFieldId = String(block.getFieldValue("VAR") ?? "").trim();
  if (varFieldId && block.workspace) {
    const model = block.workspace.getVariableMap().getVariableById(varFieldId);
    if (model) {
      const n = model.getName();
      if (n?.trim()) return n.trim();
    }
  }
  return undefined;
}

/**
 * Id + name for serialization. Prefer {@link VariableMap#getVariableById} so the **name**
 * matches the workspace model (field `getText()` / `getVariable()` can disagree with what
 * `assignRunVar` stored under `__ollieName:` — logs showed compare `a` = 0 while `Answer` was 17).
 */
function serializedVariableRef(block: Block): { id: string; name?: string } | null {
  const id = getBlocklyVariableId(block);
  let name = getBlocklyVariableName(block);
  if (id && block.workspace) {
    const model = block.workspace.getVariableMap().getVariableById(id);
    if (model?.getName()?.trim()) {
      name = model.getName()!.trim();
    }
  }
  if (!id && !name?.trim()) return null;
  return {
    id: id || "",
    ...(name?.trim() ? { name: name.trim() } : {}),
  };
}

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
      const cmpOp = String(block.getFieldValue("OP") ?? "EQ");
      const map: Record<string, "EQ" | "NEQ" | "LT" | "LTE" | "GT" | "GTE"> = {
        EQ: "EQ",
        NEQ: "NEQ",
        LT: "LT",
        LTE: "LTE",
        GT: "GT",
        GTE: "GTE",
      };
      let o = map[cmpOp];
      if (!o) {
        if (cmpOp === "=" || cmpOp === "==" || cmpOp === "===") o = "EQ";
        else if (cmpOp === "!=" || cmpOp === "!==") o = "NEQ";
      }
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
      if (v === "MOUSE") return { k: "touchMouse" };
      if (v.startsWith(TOUCHING_SPRITE_FIELD_PREFIX)) {
        return {
          k: "touchSprite",
          actorId: v.slice(TOUCHING_SPRITE_FIELD_PREFIX.length),
        };
      }
      return { k: "touchMouse" };
    }
    case "ollie_sensing_key_pressed": {
      const keyId = String(block.getFieldValue("KEY") ?? "space");
      return { k: "keyDown", keyId };
    }
    case "ollie_sensing_mouse_down":
      return { k: "mouseDown" };
    case "ollie_sensing_is_clone":
      return { k: "isClone" };
    case "math_number_property": {
      const property = String(block.getFieldValue("PROPERTY") ?? "");
      const n = serializeNumExpr(block.getInputTargetBlock("NUMBER_TO_CHECK"));
      if (!n) return null;
      if (property === "DIVISIBLE_BY") {
        const divisor = serializeNumExpr(block.getInputTargetBlock("DIVISOR"));
        if (!divisor) return null;
        return { k: "numProp", property, n, divisor };
      }
      return { k: "numProp", property, n };
    }
    default:
      return null;
  }
}

function serializeListExpr(block: Block | null): SerializedListExpr | null {
  if (!block) return null;
  switch (block.type) {
    case "lists_create_empty":
      return { k: "empty" };
    case "lists_create_with": {
      const items: SerializedNumExpr[] = [];
      let i = 0;
      while (block.getInput(`ADD${i}`)) {
        const e = serializeNumExpr(block.getInputTargetBlock(`ADD${i}`));
        if (!e) return null;
        items.push(e);
        i += 1;
      }
      return { k: "items", items };
    }
    case "lists_repeat": {
      const item = serializeNumExpr(block.getInputTargetBlock("ITEM"));
      const count = serializeNumExpr(block.getInputTargetBlock("NUM"));
      if (!item || !count) return null;
      return { k: "repeat", item, count };
    }
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
    case "math_single":
    case "math_trig": {
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
    case "math_random_int":
    case "ollie_pick_random": {
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
    case "math_on_list": {
      const op = String(block.getFieldValue("OP") ?? "SUM");
      const list = serializeListExpr(block.getInputTargetBlock("LIST"));
      if (!list) return null;
      return { k: "listOp", op, list };
    }
    case "ollie_sensing_mouse_x":
      return { k: "mx" };
    case "ollie_sensing_mouse_y":
      return { k: "my" };
    case "ollie_sensing_distance":
      return { k: "distMouse" };
    case "ollie_sensing_timer":
      return { k: "timer" };
    case "variables_get":
    case "variables_get_dynamic": {
      const ref = serializedVariableRef(block);
      if (!ref) return null;
      return { k: "var", id: ref.id, ...(ref.name ? { name: ref.name } : {}) };
    }
    default:
      return null;
  }
}

/** Blockly color reporters → serialized form for {@link evalSerializedColorExpr} at Run time. */
export function serializeColorExpr(
  block: Block | null,
): SerializedColorExpr | null {
  if (!block) return null;
  switch (block.type) {
    case "colour_picker": {
      const raw = String(block.getFieldValue("COLOUR") ?? "#ffffff");
      return { k: "pick", hex: raw };
    }
    case "colour_random":
      return { k: "rand" };
    case "colour_rgb": {
      const r = serializeNumExpr(block.getInputTargetBlock("RED"));
      const g = serializeNumExpr(block.getInputTargetBlock("GREEN"));
      const b = serializeNumExpr(block.getInputTargetBlock("BLUE"));
      if (!r || !g || !b) return null;
      return { k: "rgb", r, g, b };
    }
    case "colour_blend": {
      const c1 = serializeColorExpr(block.getInputTargetBlock("COLOUR1"));
      const c2 = serializeColorExpr(block.getInputTargetBlock("COLOUR2"));
      const ratio = serializeNumExpr(block.getInputTargetBlock("RATIO"));
      if (!c1 || !c2 || !ratio) return null;
      return { k: "blend", c1, c2, ratio };
    }
    default:
      return null;
  }
}

/** Blockly text / join / variables / math → runtime string (for `say` / ask). */
export function serializeStringExpr(block: Block | null): SerializedStringExpr {
  if (!block) return { k: "lit", v: "" };
  switch (block.type) {
    case "text":
      return { k: "lit", v: String(block.getFieldValue("TEXT") ?? "") };
    case "variables_get":
    case "variables_get_dynamic": {
      const ref = serializedVariableRef(block);
      if (!ref) return { k: "lit", v: "" };
      return { k: "var", id: ref.id, ...(ref.name ? { name: ref.name } : {}) };
    }
    case "text_join": {
      const parts: SerializedStringExpr[] = [];
      let i = 0;
      while (block.getInput(`ADD${i}`)) {
        parts.push(serializeStringExpr(block.getInputTargetBlock(`ADD${i}`)));
        i += 1;
      }
      return { k: "join", parts };
    }
    default: {
      const num = serializeNumExpr(block);
      if (num) return { k: "num", e: num };
      return { k: "lit", v: "" };
    }
  }
}

/** Evaluate string expression for Run (variables + sensing + math). */
export function evalSerializedString(
  e: SerializedStringExpr,
  ctx: SensingEvalContext,
): string {
  switch (e.k) {
    case "lit":
      return e.v;
    case "join":
      return e.parts.map((p) => evalSerializedString(p, ctx)).join("");
    case "var": {
      const n = readVarValue(ctx.vars, e.id, e.name);
      if (n === undefined) return "";
      return Number.isInteger(n) ? String(n) : String(n);
    }
    case "num": {
      const n = evalSerializedNum(e.e, ctx);
      return Number.isInteger(n) ? String(n) : String(n);
    }
    default:
      return "";
  }
}

function evalSerializedList(
  list: SerializedListExpr,
  ctx: SensingEvalContext,
): number[] {
  switch (list.k) {
    case "empty":
      return [];
    case "items":
      return list.items.map((x) => evalSerializedNum(x, ctx));
    case "repeat": {
      const item = evalSerializedNum(list.item, ctx);
      const n = Math.max(
        0,
        Math.floor(Math.abs(evalSerializedNum(list.count, ctx))),
      );
      return Array(n).fill(item);
    }
  }
}

/** Blockly `math_on_list` aggregate (matches `evaluateBlock` / JS generators). */
function mathListOpFromNums(op: string, nums: number[]): number {
  const list = nums.filter((x) => typeof x === "number" && Number.isFinite(x));
  switch (op) {
    case "SUM":
      return list.reduce((x, y) => x + y, 0);
    case "MIN":
      return list.length ? Math.min(...list) : 0;
    case "MAX":
      return list.length ? Math.max(...list) : 0;
    case "AVERAGE":
      return list.length
        ? list.reduce((x, y) => x + y, 0) / list.length
        : 0;
    case "MEDIAN": {
      if (!list.length) return 0;
      const localList = [...list].sort((a, b) => b - a);
      if (localList.length % 2 === 0) {
        return (
          (localList[localList.length / 2 - 1] + localList[localList.length / 2]) /
          2
        );
      }
      return localList[(localList.length - 1) / 2];
    }
    case "MODE": {
      if (!list.length) return 0;
      const counts: [number, number][] = [];
      let maxCount = 0;
      for (const value of list) {
        let found = false;
        let thisCount = 0;
        for (let j = 0; j < counts.length; j++) {
          if (counts[j][0] === value) {
            thisCount = ++counts[j][1];
            found = true;
            break;
          }
        }
        if (!found) {
          counts.push([value, 1]);
          thisCount = 1;
        }
        maxCount = Math.max(thisCount, maxCount);
      }
      const modes = counts.filter((c) => c[1] === maxCount).map((c) => c[0]);
      return modes[0] ?? 0;
    }
    case "STD_DEV": {
      const n = list.length;
      if (!n) return 0;
      const mean = list.reduce((x, y) => x + y, 0) / n;
      let variance = 0;
      for (let j = 0; j < n; j++) {
        variance += (list[j] - mean) ** 2;
      }
      variance /= n;
      return Math.sqrt(variance);
    }
    case "RANDOM":
      return list.length ? list[Math.floor(Math.random() * list.length)] : 0;
    default:
      return 0;
  }
}

function isPrimeBlockly(n: number): boolean {
  if (n === 2 || n === 3) return true;
  if (isNaN(n) || n <= 1 || n % 1 !== 0 || n % 2 === 0 || n % 3 === 0) {
    return false;
  }
  for (let x = 6; x <= Math.sqrt(n) + 1; x += 6) {
    if (n % (x - 1) === 0 || n % (x + 1) === 0) return false;
  }
  return true;
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
    case "listOp": {
      const nums = evalSerializedList(e.list, ctx);
      return mathListOpFromNums(e.op, nums);
    }
    case "var": {
      const v = readVarValue(
        ctx.vars,
        String(e.id ?? ""),
        e.name !== undefined ? String(e.name) : undefined,
      );
      return v !== undefined ? v : 0;
    }
    default:
      return 0;
  }
}

export type SensingEvalContext = {
  cw: number;
  ch: number;
  spriteId: string;
  /** True when the running sprite was spawned by `create clone` (not the main actor). */
  isCloneSprite?: boolean;
  spriteX: number;
  spriteY: number;
  mouseX: number;
  mouseY: number;
  mouseIsPressed: boolean;
  keysDown: ReadonlySet<string>;
  timerSecs: number;
  /** Blockly variable values for the current Run (optional; defaults to empty). */
  vars?: Record<string, number>;
  /**
   * When set, used by “touching [sprite]?” — overlap of costume hit circles on the stage.
   */
  touchingSprite?: (otherActorId: string) => boolean;
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
          return (
            Number.isFinite(a) &&
            Number.isFinite(b) &&
            Math.abs(a - b) < 1e-4
          );
        case "NEQ":
          return !(
            Number.isFinite(a) &&
            Number.isFinite(b) &&
            Math.abs(a - b) < 1e-4
          );
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
    case "touchSprite":
      return ctx.touchingSprite?.(e.actorId) ?? false;
    case "mouseDown":
      return ctx.mouseIsPressed;
    case "isClone":
      return ctx.isCloneSprite === true;
    case "numProp": {
      const v = evalSerializedNum(e.n, ctx);
      switch (e.property) {
        case "EVEN":
          return v % 2 === 0;
        case "ODD":
          return v % 2 === 1;
        case "WHOLE":
          return v % 1 === 0;
        case "POSITIVE":
          return v > 0;
        case "NEGATIVE":
          return v < 0;
        case "PRIME":
          return isPrimeBlockly(v);
        case "DIVISIBLE_BY": {
          const d = e.divisor ? evalSerializedNum(e.divisor, ctx) : 0;
          if (d === 0) return false;
          return v % d === 0;
        }
        default:
          return false;
      }
    }
    default:
      return false;
  }
}

function normalizeColorHex6(hex: string): string {
  const s = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) {
    return `#${s.slice(1).toLowerCase()}`;
  }
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const r = s[1];
    const g = s[2];
    const b = s[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return "#ffffff";
}

/** Scratch-style 0–100 per channel → #rrggbb (matches Blockly `colour_rgb` JS generator name). */
function scratchRgbChannelsToHex(r: number, g: number, b: number): string {
  const clampCh = (n: number) =>
    Math.max(0, Math.min(100, Number(n))) * 2.55;
  const ri = Math.round(clampCh(r));
  const gi = Math.round(clampCh(g));
  const bi = Math.round(clampCh(b));
  const hx = (x: number) => (`0${(x || 0).toString(16)}`).slice(-2);
  return `#${hx(ri)}${hx(gi)}${hx(bi)}`;
}

function blendHexColors(c1: string, c2: string, ratio: number): string {
  const a = normalizeColorHex6(c1);
  const b = normalizeColorHex6(c2);
  const t = Math.max(0, Math.min(1, Number(ratio)));
  const r1 = parseInt(a.slice(1, 3), 16);
  const g1 = parseInt(a.slice(3, 5), 16);
  const b1 = parseInt(a.slice(5, 7), 16);
  const r2 = parseInt(b.slice(1, 3), 16);
  const g2 = parseInt(b.slice(3, 5), 16);
  const b2 = parseInt(b.slice(5, 7), 16);
  const r = Math.round(r1 * (1 - t) + r2 * t);
  const g = Math.round(g1 * (1 - t) + g2 * t);
  const bl = Math.round(b1 * (1 - t) + b2 * t);
  const hx = (x: number) => (`0${(x || 0).toString(16)}`).slice(-2);
  return `#${hx(r)}${hx(g)}${hx(bl)}`;
}

/**
 * Evaluate Blockly color blocks at Run time (same semantics as bundled JS generators).
 */
export function evalSerializedColorExpr(
  e: SerializedColorExpr,
  ctx: SensingEvalContext,
): string {
  switch (e.k) {
    case "pick":
      return normalizeColorHex6(e.hex);
    case "rand": {
      const num = Math.floor(Math.random() * 0x1000000);
      return `#${`000000${num.toString(16)}`.slice(-6)}`;
    }
    case "rgb": {
      const r = evalSerializedNum(e.r, ctx);
      const g = evalSerializedNum(e.g, ctx);
      const b = evalSerializedNum(e.b, ctx);
      return scratchRgbChannelsToHex(r, g, b);
    }
    case "blend": {
      const x = evalSerializedColorExpr(e.c1, ctx);
      const y = evalSerializedColorExpr(e.c2, ctx);
      const t = evalSerializedNum(e.ratio, ctx);
      return blendHexColors(x, y, t);
    }
    default:
      return "#ffffff";
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
