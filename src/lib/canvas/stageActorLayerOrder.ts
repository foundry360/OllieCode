/**
 * Scratch-style stacking: layer 1 is drawn first (behind), layer N is in front when there are N sprites.
 */
export function reorderActorToOneBasedLayer<T extends { id: string }>(
  actors: readonly T[],
  actorId: string,
  layerOneBased: number,
): T[] {
  const n = actors.length;
  if (n <= 1) return [...actors];
  const idx = actors.findIndex((a) => a.id === actorId);
  if (idx < 0) return [...actors];
  const target = Math.min(n, Math.max(1, Math.round(layerOneBased)));
  const next = [...actors];
  const [actor] = next.splice(idx, 1);
  next.splice(target - 1, 0, actor!);
  return next;
}
