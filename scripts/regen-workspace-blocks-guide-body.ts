/**
 * Regenerates body_html for `workspace-blocks-reference` with human-readable flyout-style labels
 * (no internal block type ids in the first column).
 * Run: npx tsx scripts/regen-workspace-blocks-guide-body.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getToolboxBlockHumanLabel } from "../src/lib/blockly/blockToolboxHumanLabels";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const srcSql = path.join(
  repoRoot,
  "supabase/migrations/20260429120000_learning_guide_workspace_blocks_reference.sql",
);
const outSql = path.join(
  repoRoot,
  "supabase/migrations/20260429140000_learning_guide_workspace_blocks_human_labels.sql",
);

const s = fs.readFileSync(srcSql, "utf8");
const open = s.indexOf("$body$");
const close = s.lastIndexOf("$body$");
if (open < 0 || close <= open) throw new Error("Could not find $body$ delimiters");
const body = s.slice(open + 6, close);

const rowRe =
  /<tr><td><span style="color:#[0-9A-Fa-f]+">■<\/span> <code>([^<]+)<\/code><\/td><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><\/tr>/g;

let newBody = body;
let m: RegExpExecArray | null;
while ((m = rowRe.exec(body)) !== null) {
  const full = m[0];
  const type = m[1];
  const does = m[2];
  const use = m[3];
  const prefix = full.match(/^<tr><td>(<span style="color:#[0-9A-Fa-f]+">■<\/span> )<code>/)?.[1];
  if (!prefix) throw new Error("Bad row prefix for " + type);
  const label = escapeHtml(getToolboxBlockHumanLabel(type));
  const replacement = `<tr><td>${prefix}<strong>${label}</strong></td><td>${does}</td><td>${use}</td></tr>`;
  if (!newBody.includes(full)) throw new Error("Row not found for replace: " + type);
  newBody = newBody.replace(full, replacement);
}

const introOld =
  "Each row lists the block type (as in code), what it does, and typical ways to use it.";
const introNew =
  "Each row shows how the block reads in the toolbox, what it does, and typical ways to use it.";
const thOld = "<th>Block</th>";
const thNew = "<th>Toolbox</th>";
if (!newBody.includes(introOld)) throw new Error("Expected intro sentence missing — check source migration.");
newBody = newBody.replace(introOld, introNew).replaceAll(thOld, thNew);

/** Avoid internal type ids in prose (readers match the flyout, not code names). */
newBody = newBody
  .replace(/<code>ollie_broadcast<\/code>/g, "the <strong>Broadcast …</strong> block")
  .replace(/<code>ollie_stop<\/code>/g, "the <strong>Stop …</strong> block")
  .replace(/<code>controls_repeat_ext<\/code>/g, "<strong>Repeat … times</strong>")
  .replace(/<code>controls_whileUntil<\/code>/g, "<strong>Repeat while / until …</strong>")
  .replace(/<code>text_join<\/code>/g, "<strong>Join text …</strong>");

newBody = newBody.replaceAll("<table>", '<table class="ollie-toolbox-guide-table">');

const sql = `/*
  Workspace blocks guide: flyout-style labels only (no internal block type ids in the first column).
*/

update public.lms_learning_guides
set body_html = $body$${newBody}$body$
where id = 'workspace-blocks-reference';
`;

fs.writeFileSync(outSql, sql, "utf8");
console.log("Wrote", outSql);
console.log("Length", newBody.length);
