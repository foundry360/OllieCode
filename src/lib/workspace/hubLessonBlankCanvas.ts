import type { OllieSceneId } from "@/lib/canvas/stageAssets";
import {
  DEFAULT_WORKSPACE_LESSON_ID,
  WORKSPACE_NO_LESSON_QUERY,
} from "@/lib/lms/lessonsCatalog";

/**
 * Default stage for activated hub lessons: white dotted grid (`white_dots` in stage assets).
 */
export const HUB_LESSON_BLANK_SCENE_ID: OllieSceneId = "white_dots";

/**
 * True when the URL has an explicit `lesson=` query for a hub lesson that should open on a clean
 * slate (not Getting Started and not `lesson=none`).
 */
export function hubLessonOpensBlankCanvas(rawLessonQuery: string): boolean {
  const raw = rawLessonQuery.trim();
  if (!raw || raw === WORKSPACE_NO_LESSON_QUERY) return false;
  if (raw === DEFAULT_WORKSPACE_LESSON_ID) return false;
  return true;
}
