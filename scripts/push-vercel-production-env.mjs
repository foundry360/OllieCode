#!/usr/bin/env node
/**
 * Push key/value pairs from a local .env-style file to Vercel **Production**.
 *
 * Prerequisites:
 *   - `npx vercel login` (or VERCEL_TOKEN in the environment for CI)
 *   - `npx vercel link` in this repo so `.vercel/project.json` exists
 *
 * Usage:
 *   node scripts/push-vercel-production-env.mjs
 *   node scripts/push-vercel-production-env.mjs path/to/vercel-production.env
 *
 * Default input file: vercel-production.env (copy from vercel-production.env.example; gitignored)
 */

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const DEFAULT_ENV_FILE = resolve(repoRoot, "vercel-production.env");

function parseEnvLines(text) {
  /** @type {{ key: string; value: string }[]} */
  const out = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (!key) continue;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out.push({ key, value });
  }
  return out;
}

function main() {
  const envPath = resolve(repoRoot, process.argv[2] || DEFAULT_ENV_FILE);

  if (!existsSync(envPath)) {
    console.error(`Missing file: ${envPath}`);
    console.error("Copy vercel-production.env.example → vercel-production.env and fill in values.");
    process.exit(1);
  }

  const entries = parseEnvLines(readFileSync(envPath, "utf8")).filter((e) => e.value.length > 0);
  if (entries.length === 0) {
    console.error("No non-empty KEY=value lines found. Nothing to push.");
    process.exit(1);
  }

  console.log(`Pushing ${entries.length} variable(s) to Vercel Production from:\n  ${envPath}\n`);

  for (const { key, value } of entries) {
    const isPublic = key.startsWith("NEXT_PUBLIC_");
    const args = [
      "vercel",
      "env",
      "add",
      key,
      "production",
      "--value",
      value,
      "--yes",
      "--force",
      "--non-interactive",
    ];
    if (isPublic) {
      args.push("--no-sensitive");
    }

    const r = spawnSync("npx", args, {
      cwd: repoRoot,
      stdio: "inherit",
      env: process.env,
      shell: false,
    });

    if (r.status !== 0) {
      console.error(`\nFailed while setting ${key} (exit ${r.status ?? "unknown"}).`);
      process.exit(r.status ?? 1);
    }
  }

  console.log("\nDone. Verify in Vercel → Project → Settings → Environment Variables.");
}

main();
