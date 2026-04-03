import { Workspace, Xml, utils, serialization } from "blockly/core";
import { EMPTY_START_WORKSPACE_XML } from "@/lib/workspace/emptyStartWorkspaceXml";

let cached: Record<string, unknown> | null = null;

/** Serialized Blockly state for a sprite with only the `ollie_start` hat (no stack). */
export function getEmptyWorkspaceSave(): Record<string, unknown> {
  if (cached) return structuredClone(cached);
  const temp = new Workspace();
  const dom = utils.xml.textToDom(EMPTY_START_WORKSPACE_XML);
  Xml.domToWorkspace(dom, temp);
  cached = serialization.workspaces.save(temp) as Record<string, unknown>;
  temp.dispose();
  return structuredClone(cached);
}
