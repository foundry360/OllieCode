import { FieldDropdown } from "blockly/core";
import { costumeDropdownOptions } from "@/lib/canvas/stageAssets";

/** Stored in the “switch costume” field — not a catalog id. */
export const PAINTED_COSTUME_FIELD_PREFIX = "olliePainted:";

type ExtrasGetter = () => [string, string][];

let extrasGetter: ExtrasGetter | null = null;

/** Workspace sets this so “switch costume” lists project My Sprites under a divider. */
export function setSwitchCostumeDropdownExtras(getter: ExtrasGetter | null): void {
  extrasGetter = getter;
}

/**
 * Catalog options, then an optional Blockly separator, then user-painted costumes
 * (label + encoded URL value).
 */
export function getSwitchCostumeDropdownOptions(): Array<
  [string, string] | typeof FieldDropdown.SEPARATOR
> {
  const catalog = costumeDropdownOptions();
  const extras = extrasGetter?.() ?? [];
  if (extras.length === 0) return catalog;
  return [...catalog, FieldDropdown.SEPARATOR, ...extras];
}

export function parsePaintedCostumeFieldValue(
  raw: string | undefined | null,
): string | null {
  const s = String(raw ?? "").trim();
  if (!s.startsWith(PAINTED_COSTUME_FIELD_PREFIX)) return null;
  try {
    return decodeURIComponent(s.slice(PAINTED_COSTUME_FIELD_PREFIX.length));
  } catch {
    return null;
  }
}
