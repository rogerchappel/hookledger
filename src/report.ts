import type { HookLedger, VerifyResult } from "./types.js";

export function inventorySummaryText(ledger: HookLedger, outputs?: { jsonPath: string; markdownPath: string }): string {
  const lines = [
    `HookLedger found ${ledger.summary.total} hook record(s).`,
    `Warnings: ${ledger.summary.warnings}; high risk hints: ${ledger.summary.highRisk}; missing references: ${ledger.summary.missingReferences}.`
  ];
  if (outputs) {
    lines.push(`JSON ledger: ${outputs.jsonPath}`, `Markdown ledger: ${outputs.markdownPath}`);
  }
  return `${lines.join("\n")}\n`;
}

export function verifySummaryText(result: VerifyResult): string {
  const lines = [
    result.ok ? "HookLedger verification passed." : "HookLedger verification failed.",
    `Baseline: ${result.baselinePath}`,
    `Added: ${result.added.length}; removed: ${result.removed.length}; changed: ${result.changed.length}.`
  ];
  for (const hook of result.added) {
    lines.push(`+ ${hook.id}`);
  }
  for (const hook of result.removed) {
    lines.push(`- ${hook.id}`);
  }
  for (const change of result.changed) {
    lines.push(`~ ${change.current.id}: ${change.fields.join(", ")}`);
  }
  return `${lines.join("\n")}\n`;
}
