/** Layer id for a row in `user_scenes` — matches `user_scenes.id` after the prefix. */
export const USER_SCENE_ID_PREFIX = "user-scene-" as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUserSceneLayerId(id: string): boolean {
  if (!id.startsWith(USER_SCENE_ID_PREFIX)) return false;
  return UUID_RE.test(id.slice(USER_SCENE_ID_PREFIX.length));
}

export function makeUserSceneLayerId(rowUuid: string): string {
  return `${USER_SCENE_ID_PREFIX}${rowUuid}`;
}

export function userSceneRowUuidFromLayerId(id: string): string | null {
  if (!isUserSceneLayerId(id)) return null;
  return id.slice(USER_SCENE_ID_PREFIX.length);
}
