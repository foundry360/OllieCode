import { FieldDropdown, type MenuOption } from "blockly/core";

export type TouchingSpriteActorOption = { id: string; label: string };

/** Prefix for “touching another sprite” field values — serialized in project JSON. */
export const TOUCHING_SPRITE_FIELD_PREFIX = "SPRITE:";

let actors: TouchingSpriteActorOption[] = [];

/** Called from the workspace when the sprite list changes so the dropdown stays current. */
export function setTouchingSpriteDropdownActors(
  next: TouchingSpriteActorOption[] | null,
): void {
  actors = next ?? [];
}

/** Options for the “touching … ?” block: pointer, edge, then project sprites. */
export function getTouchingSpriteDropdownOptions(): MenuOption[] {
  const base: MenuOption[] = [
    ["mouse-pointer", "MOUSE"],
    ["edge", "EDGE"],
  ];
  if (actors.length === 0) return base;
  const spriteRows: MenuOption[] = actors.map((a) => [
    a.label.trim() || a.id,
    `${TOUCHING_SPRITE_FIELD_PREFIX}${a.id}`,
  ]);
  return [...base, FieldDropdown.SEPARATOR, ...spriteRows];
}
