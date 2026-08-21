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
  const baseline = await readJson<unknown>(baselinePath);
  if (!baseline) {
    throw new Error(`Baseline ledger not found: ${baselinePath}`);
  }
  assertHookLedger(baseline, baselinePath);
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

function assertHookLedger(value: unknown, baselinePath: string): asserts value is HookLedger {
  const fail = (detail: string): never => {
    throw new Error(`Invalid baseline ledger ${baselinePath}: ${detail}`);
  };
  if (!isRecord(value)) {
    fail("ledger must be an object");
  }
  const ledger = value as Record<string, unknown>;
  if (ledger.schemaVersion !== 1) fail("schemaVersion must be 1");
  if (ledger.tool !== "hookledger") fail('tool must be "hookledger"');
  if (typeof ledger.generatedAt !== "string") fail("generatedAt must be a string");
  if (typeof ledger.root !== "string") fail("root must be a string");
  const hooks = ledger.hooks;
  if (!Array.isArray(hooks)) fail("hooks must be an array");
  (hooks as unknown[]).forEach((hook, index) => assertHookRecord(hook, index, fail));
  assertSummary(ledger.summary, fail);
}

function assertHookRecord(hook: unknown, index: number, fail: (detail: string) => never): void {
  const field = (name: string) => `hooks[${index}].${name}`;
  if (!isRecord(hook)) fail(`hooks[${index}] must be an object`);
  for (const name of ["id", "name", "path", "sha256"] as const) {
    if (name === "sha256") {
      if (hook[name] !== null && typeof hook[name] !== "string") fail(`${field(name)} must be a string or null`);
    } else if (typeof hook[name] !== "string") {
      fail(`${field(name)} must be a string`);
    }
  }
  if (!["native-git", "husky", "lefthook", "pre-commit", "simple-git-hooks", "package-script"].includes(String(hook.manager))) {
    fail(`${field("manager")} must be a supported hook manager`);
  }
  if (typeof hook.exists !== "boolean") fail(`${field("exists")} must be a boolean`);
  if (hook.executable !== null && typeof hook.executable !== "boolean") fail(`${field("executable")} must be a boolean or null`);
  for (const name of ["commands", "missingReferences"] as const) {
    if (!isStringArray(hook[name])) fail(`${field(name)} must be an array of strings`);
  }
  if (!Array.isArray(hook.riskHints)) fail(`${field("riskHints")} must be an array`);
  hook.riskHints.forEach((hint, hintIndex) => {
    if (!isRecord(hint) || !["info", "warning", "high"].includes(String(hint.level)) || typeof hint.message !== "string") {
      fail(`${field("riskHints")}[${hintIndex}] must contain a supported level and string message`);
    }
  });
}

function assertSummary(summary: unknown, fail: (detail: string) => never): void {
  if (!isRecord(summary)) fail("summary must be an object");
  for (const name of ["total", "warnings", "highRisk", "missingReferences"] as const) {
    if (typeof summary[name] !== "number") fail(`summary.${name} must be a number`);
  }
  if (!isRecord(summary.byManager)) fail("summary.byManager must be an object");
  if (Object.values(summary.byManager).some((count) => typeof count !== "number")) {
    fail("summary.byManager values must be numbers");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function indexById(hooks: HookRecord[]): Map<string, HookRecord> {
  return new Map(hooks.map((hook) => [hook.id, hook]));
}

function changedFields(baseline: HookRecord, current: HookRecord): string[] {
  return COMPARED_FIELDS.filter((field) => JSON.stringify(baseline[field]) !== JSON.stringify(current[field]));
}
