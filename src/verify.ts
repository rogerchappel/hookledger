import { inventoryHooks } from "./inventory.js";
import { readJson } from "./fs-utils.js";
import type { HookLedger, HookRecord, VerifyResult } from "./types.js";

const COMPARED_FIELDS: Array<keyof HookRecord> = [
  "path",
  "exists",
  "executable",
  "commands",
  "missingReferences",
  "sha256"
];

export async function verifyLedger(root: string, baselinePath: string): Promise<VerifyResult> {
  const baseline = await readJson<HookLedger>(baselinePath);
  if (!baseline) {
    throw new Error(`Baseline ledger not found: ${baselinePath}`);
  }
  const current = await inventoryHooks({ root, generatedAt: baseline.generatedAt });
  const baselineById = indexById(baseline.hooks);
  const currentById = indexById(current.hooks);
  const added = current.hooks.filter((hook) => !baselineById.has(hook.id));
  const removed = baseline.hooks.filter((hook) => !currentById.has(hook.id));
  const changed = baseline.hooks
    .map((baselineHook) => {
      const currentHook = currentById.get(baselineHook.id);
      if (!currentHook) {
        return null;
      }
      const fields = changedFields(baselineHook, currentHook);
      return fields.length > 0 ? { baseline: baselineHook, current: currentHook, fields } : null;
    })
    .filter((entry): entry is { baseline: HookRecord; current: HookRecord; fields: string[] } => entry !== null);

  return {
    ok: added.length === 0 && removed.length === 0 && changed.length === 0,
    baselinePath,
    current,
    baseline,
    added,
    removed,
    changed
  };
}

function indexById(hooks: HookRecord[]): Map<string, HookRecord> {
  return new Map(hooks.map((hook) => [hook.id, hook]));
}

function changedFields(baseline: HookRecord, current: HookRecord): string[] {
  return COMPARED_FIELDS.filter((field) => JSON.stringify(baseline[field]) !== JSON.stringify(current[field]));
}
