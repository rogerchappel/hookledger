import type { HookLedger, HookRecord } from "./types.js";

export function renderMarkdownLedger(ledger: HookLedger): string {
  const lines = [
    "# HookLedger",
    "",
    `Generated: ${ledger.generatedAt}`,
    `Root: ${ledger.root}`,
    "",
    "## Summary",
    "",
    `- Hooks: ${ledger.summary.total}`,
    `- Warnings: ${ledger.summary.warnings}`,
    `- High risk hints: ${ledger.summary.highRisk}`,
    `- Missing references: ${ledger.summary.missingReferences}`,
    "",
    "## Managers",
    "",
    ...Object.entries(ledger.summary.byManager)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([manager, count]) => `- ${manager}: ${count}`),
    "",
    "## Hooks",
    ""
  ];

  if (ledger.hooks.length === 0) {
    lines.push("No hooks or hook-manager configuration detected.", "");
    return lines.join("\n");
  }

  for (const hook of ledger.hooks) {
    lines.push(...renderHook(hook));
  }
  return `${lines.join("\n")}\n`;
}

function renderHook(hook: HookRecord): string[] {
  const lines = [
    `### ${hook.manager}: ${hook.name}`,
    "",
    `- Path: ${hook.path}`,
    `- Exists: ${hook.exists ? "yes" : "no"}`,
    `- Executable: ${hook.executable === null ? "n/a" : hook.executable ? "yes" : "no"}`,
    `- SHA-256: ${hook.sha256 ?? "n/a"}`,
    "- Commands:"
  ];
  if (hook.commands.length === 0) {
    lines.push("  - n/a");
  } else {
    lines.push(...hook.commands.map((command) => `  - \`${escapeBackticks(command)}\``));
  }
  lines.push("- Risk hints:");
  if (hook.riskHints.length === 0) {
    lines.push("  - none");
  } else {
    lines.push(...hook.riskHints.map((hint) => `  - ${hint.level}: ${hint.message}`));
  }
  if (hook.missingReferences.length > 0) {
    lines.push("- Missing references:", ...hook.missingReferences.map((reference) => `  - ${reference}`));
  }
  lines.push("");
  return lines;
}

function escapeBackticks(value: string): string {
  return value.replaceAll("`", "\\`");
}
