import path from "node:path";
import { access, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { scanHuskyHooks } from "./scanners/husky.js";
import { scanLefthook } from "./scanners/lefthook.js";
import { scanNativeGitHooks } from "./scanners/native-git.js";
import { scanPackageHookScripts } from "./scanners/package-scripts.js";
import { scanPreCommit } from "./scanners/pre-commit.js";
import { scanSimpleGitHooks } from "./scanners/simple-git-hooks.js";
import type { HookLedger, HookRecord, InventoryOptions, InventorySummary } from "./types.js";

export async function inventoryHooks(options: InventoryOptions): Promise<HookLedger> {
  const root = path.resolve(options.root);
  await validateInventoryRoot(root);
  const hookGroups = await Promise.all([
    scanNativeGitHooks(root),
    scanHuskyHooks(root),
    scanLefthook(root),
    scanPreCommit(root),
    scanSimpleGitHooks(root),
    scanPackageHookScripts(root)
  ]);
  const hooks = hookGroups.flat().sort(compareHookRecords);
  return {
    schemaVersion: 1,
    tool: "hookledger",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    root,
    summary: summarizeHooks(hooks),
    hooks
  };
}

async function validateInventoryRoot(root: string): Promise<void> {
  let rootStat;
  try {
    rootStat = await stat(root);
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === "ENOENT") {
      throw new Error(`Inventory root does not exist: ${root}`);
    }
    throw new Error(`Inventory root is not readable: ${root}`);
  }
  if (!rootStat.isDirectory()) {
    throw new Error(`Inventory root is not a directory: ${root}`);
  }
  try {
    await access(root, constants.R_OK);
  } catch {
    throw new Error(`Inventory root is not readable: ${root}`);
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

export function summarizeHooks(hooks: HookRecord[]): InventorySummary {
  const byManager: Record<string, number> = {};
  let warnings = 0;
  let highRisk = 0;
  let missingReferences = 0;
  for (const hook of hooks) {
    byManager[hook.manager] = (byManager[hook.manager] ?? 0) + 1;
    missingReferences += hook.missingReferences.length;
    for (const hint of hook.riskHints) {
      if (hint.level === "warning") {
        warnings += 1;
      }
      if (hint.level === "high") {
        highRisk += 1;
      }
    }
  }
  return { total: hooks.length, byManager, warnings, highRisk, missingReferences };
}

function compareHookRecords(left: HookRecord, right: HookRecord): number {
  return left.manager.localeCompare(right.manager) ||
    left.name.localeCompare(right.name) ||
    left.path.localeCompare(right.path);
}
