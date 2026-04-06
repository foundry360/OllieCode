import type { Block } from "blockly/core";

/**
 * Evaluates Blockly value blocks for the Ollie static interpreter (compile-time).
 * Variable/sensing blocks are not supported — they evaluate to 0 / false.
 */

const DEG_TO_RAD = Math.PI / 180;

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
    case "math_random_int": {
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
