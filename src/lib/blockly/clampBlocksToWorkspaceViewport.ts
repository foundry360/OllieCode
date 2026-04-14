import { bumpObjects, Events, type WorkspaceSvg } from "blockly/core";

/**
 * Keeps main-workspace blocks inside the visible Blockly viewport (all four edges).
 * Uses {@link bumpObjects.bumpIntoBounds} with view metrics — Blockly’s built-in bump
 * uses scroll metrics, which still allow content to extend beyond the visible area
 * when vertical scrolling is enabled.
 */
export function installClampBlocksToWorkspaceViewport(
  workspace: WorkspaceSvg,
): () => void {
  const onChange = (e: { type: string; group?: string; blockId?: string }) => {
    if (!Events.isEnabled()) return;
    if (workspace.isDragging()) return;
    if (e.type !== Events.BLOCK_MOVE && e.type !== Events.BLOCK_CREATE) return;

    const blockId = e.blockId;
    if (!blockId) return;

    const block = workspace.getBlockById(blockId);
    if (!block || block.isInFlyout) return;

    const root = block.getRootBlock();
    const view = workspace.getMetricsManager().getViewMetrics(true);
    const prevGroup = Events.getGroup();
    try {
      Events.setGroup(e.group || false);
      bumpObjects.bumpIntoBounds(workspace, view, root);
    } finally {
      Events.setGroup(prevGroup);
    }
  };

  workspace.addChangeListener(onChange);
  return () => workspace.removeChangeListener(onChange);
}
