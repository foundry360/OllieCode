import type { Block } from "blockly/core";

/**
 * Evaluates Blockly value blocks for the Ollie static interpreter (compile-time).
 * Variable/sensing blocks are not supported — they evaluate to 0 / false.
 */

const DEG_TO_RAD = Math.PI / 180;

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

/** Blockly `math_single` / `math_trig` ops (angles in degrees). */
function evalMathSingleOp(op: string, n: number): number {
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

/** Blockly `math_on_list` (matches bundled JS generators). */
function evalMathOnListOp(op: string, list: number[]): number {
  const nums = list.filter((x) => typeof x === "number" && Number.isFinite(x));
  switch (op) {
    case "SUM":
      return nums.reduce((x, y) => x + y, 0);
    case "MIN":
      return nums.length ? Math.min(...nums) : 0;
    case "MAX":
      return nums.length ? Math.max(...nums) : 0;
    case "AVERAGE":
      return nums.length
        ? nums.reduce((x, y) => x + y, 0) / nums.length
        : 0;
    case "MEDIAN": {
      if (!nums.length) return 0;
      const localList = [...nums].sort((a, b) => b - a);
      if (localList.length % 2 === 0) {
        return (
          (localList[localList.length / 2 - 1] + localList[localList.length / 2]) /
          2
        );
      }
      return localList[(localList.length - 1) / 2];
    }
    case "MODE": {
      if (!nums.length) return 0;
      const counts: [number, number][] = [];
      let maxCount = 0;
      for (const value of nums) {
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
      const n = nums.length;
      if (!n) return 0;
      const mean = nums.reduce((x, y) => x + y, 0) / n;
      let variance = 0;
      for (let j = 0; j < n; j++) {
        variance += (nums[j] - mean) ** 2;
      }
      variance /= n;
      return Math.sqrt(variance);
    }
    case "RANDOM":
      return nums.length ? nums[Math.floor(Math.random() * nums.length)] : 0;
    default:
      return 0;
  }
}

function evaluateNumberList(block: Block | null): number[] {
  if (!block) return [];
  switch (block.type) {
    case "lists_create_empty":
      return [];
    case "lists_create_with": {
      const out: number[] = [];
      let i = 0;
      while (block.getInput(`ADD${i}`)) {
        out.push(evaluateNumber(block.getInputTargetBlock(`ADD${i}`)));
        i += 1;
      }
      return out;
    }
    case "lists_repeat": {
      const item = evaluateNumber(block.getInputTargetBlock("ITEM"));
      const n = Math.max(
        0,
        Math.floor(Math.abs(evaluateNumber(block.getInputTargetBlock("NUM")))),
      );
      return Array(n).fill(item);
    }
    default:
      return [];
  }
}

export function evaluateNumber(block: Block | null): number {
  if (!block) return 0;

  switch (block.type) {
    case "math_number": {
      const raw = block.getFieldValue("NUM");
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    }
    case "math_arithmetic": {
      const op = block.getFieldValue("OP");
      const a = evaluateNumber(block.getInputTargetBlock("A"));
      const b = evaluateNumber(block.getInputTargetBlock("B"));
      switch (op) {
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
    case "math_single": {
      const op = block.getFieldValue("OP");
      const n = evaluateNumber(block.getInputTargetBlock("NUM"));
      return evalMathSingleOp(op, n);
    }
    case "math_trig": {
      const op = block.getFieldValue("OP");
      const n = evaluateNumber(block.getInputTargetBlock("NUM"));
      return evalMathSingleOp(op, n);
    }
    case "math_number_property": {
      const n = evaluateNumber(block.getInputTargetBlock("NUMBER_TO_CHECK"));
      const prop = block.getFieldValue("PROPERTY");
      switch (prop) {
        case "EVEN":
          return n % 2 === 0 ? 1 : 0;
        case "ODD":
          return n % 2 === 1 ? 1 : 0;
        case "WHOLE":
          return n % 1 === 0 ? 1 : 0;
        case "POSITIVE":
          return n > 0 ? 1 : 0;
        case "NEGATIVE":
          return n < 0 ? 1 : 0;
        case "PRIME":
          return isPrimeBlockly(n) ? 1 : 0;
        case "DIVISIBLE_BY": {
          const d = evaluateNumber(block.getInputTargetBlock("DIVISOR"));
          if (d === 0) return 0;
          return n % d === 0 ? 1 : 0;
        }
        default:
          return 0;
      }
    }
    case "math_on_list": {
      const op = block.getFieldValue("OP");
      return evalMathOnListOp(op, evaluateNumberList(block.getInputTargetBlock("LIST")));
    }
    case "math_constant": {
      const c = block.getFieldValue("CONSTANT");
      switch (c) {
        case "PI":
          return Math.PI;
        case "E":
          return Math.E;
        case "GOLDEN_RATIO":
          return (1 + Math.sqrt(5)) / 2;
        case "SQRT2":
          return Math.SQRT2;
        case "SQRT1_2":
          return Math.SQRT1_2;
        case "INFINITY":
          return Number.POSITIVE_INFINITY;
        default:
          return 0;
      }
    }
    case "math_round": {
      const op = block.getFieldValue("OP");
      const n = evaluateNumber(block.getInputTargetBlock("NUM"));
      switch (op) {
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
    case "math_modulo": {
      const a = evaluateNumber(block.getInputTargetBlock("DIVIDEND"));
      const b = evaluateNumber(block.getInputTargetBlock("DIVISOR"));
      if (b === 0) return 0;
      return ((a % b) + b) % b;
    }
    case "math_constrain": {
      const v = evaluateNumber(block.getInputTargetBlock("VALUE"));
      const lo = evaluateNumber(block.getInputTargetBlock("LOW"));
      const hi = evaluateNumber(block.getInputTargetBlock("HIGH"));
      return Math.min(hi, Math.max(lo, v));
    }
    case "math_random_int":
    case "ollie_pick_random": {
      const a = Math.ceil(evaluateNumber(block.getInputTargetBlock("FROM")));
      const b = Math.floor(evaluateNumber(block.getInputTargetBlock("TO")));
      if (b < a) return a;
      return a + Math.floor(Math.random() * (b - a + 1));
    }
    case "math_random_float":
      return Math.random();
    case "math_atan2": {
      const x = evaluateNumber(block.getInputTargetBlock("X"));
      const y = evaluateNumber(block.getInputTargetBlock("Y"));
      return Math.atan2(y, x) / DEG_TO_RAD;
    }
    case "variables_get":
    case "variables_get_dynamic":
      /** Values only exist at Run time — compile-time / static eval uses 0. */
      return 0;
    default:
      return 0;
  }
}

/** Boolean or numeric truth (for ternary / loose checks). */
export function evaluateTruth(block: Block | null): boolean {
  if (!block) return false;
  const t = block.type;
  if (
    t === "logic_boolean" ||
    t === "logic_negate" ||
    t === "logic_operation" ||
    t === "logic_compare" ||
    t === "logic_ternary"
  ) {
    return evaluateBoolean(block);
  }
  return evaluateNumber(block) !== 0;
}

export function evaluateBoolean(block: Block | null): boolean {
  if (!block) return false;

  switch (block.type) {
    case "logic_boolean": {
      return block.getFieldValue("BOOL") === "TRUE";
    }
    case "logic_negate":
      return !evaluateBoolean(block.getInputTargetBlock("BOOL"));
    case "logic_operation": {
      const op = block.getFieldValue("OP");
      const a = evaluateBoolean(block.getInputTargetBlock("A"));
      const b = evaluateBoolean(block.getInputTargetBlock("B"));
      if (op === "AND") return a && b;
      return a || b;
    }
    case "logic_compare": {
      const op = block.getFieldValue("OP");
      const a = evaluateNumber(block.getInputTargetBlock("A"));
      const b = evaluateNumber(block.getInputTargetBlock("B"));
      switch (op) {
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
    case "logic_ternary": {
      const cond = evaluateBoolean(block.getInputTargetBlock("IF"));
      return cond
        ? evaluateTruth(block.getInputTargetBlock("THEN"))
        : evaluateTruth(block.getInputTargetBlock("ELSE"));
    }
    default:
      return Boolean(evaluateNumber(block));
  }
}
