/**
 * Walk Blockly workspace JSON and collect every block `type` string (recursive).
 */
export function collectBlockTypesFromWorkspaceSave(
  save: Record<string, unknown>,
): Set<string> {
  const out = new Set<string>();
  function walk(v: unknown): void {
    if (v === null || typeof v !== "object") return;
    if (Array.isArray(v)) {
      for (const x of v) walk(x);
      return;
    }
    const o = v as Record<string, unknown>;
    if (typeof o.type === "string") out.add(o.type);
    for (const x of Object.values(o)) walk(x);
  }
  walk(save);
  return out;
}
