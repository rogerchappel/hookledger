import type { RiskHint } from "./types.js";

const NETWORK_PATTERN = /\b(curl|wget|nc|netcat|ssh|scp|rsync)\b/;
const DESTRUCTIVE_PATTERN = /\b(rm\s+-rf|git\s+clean|git\s+reset\s+--hard|dd\s+)\b/;
const SECRET_PATTERN = /\b(SECRET|TOKEN|PASSWORD|PRIVATE_KEY|AWS_|GITHUB_TOKEN)\b/i;

export function riskHintsFor(commands: string[], executable: boolean | null): RiskHint[] {
  const hints: RiskHint[] = [];
  if (executable === false) {
    hints.push({ level: "warning", message: "Hook file exists but is not executable." });
  }
  if (commands.length === 0) {
    hints.push({ level: "info", message: "No runnable command lines were detected." });
  }
  for (const command of commands) {
    if (NETWORK_PATTERN.test(command)) {
      hints.push({ level: "warning", message: `Command may access the network: ${command}` });
    }
    if (DESTRUCTIVE_PATTERN.test(command)) {
      hints.push({ level: "high", message: `Command may delete or reset local data: ${command}` });
    }
    if (SECRET_PATTERN.test(command)) {
      hints.push({ level: "warning", message: `Command references secret-like environment data: ${command}` });
    }
  }
  return dedupeHints(hints);
}

export function missingReferenceHints(missingReferences: string[]): RiskHint[] {
  return missingReferences.map((reference) => ({
    level: "warning" as const,
    message: `Referenced file is missing: ${reference}`
  }));
}

function dedupeHints(hints: RiskHint[]): RiskHint[] {
  const seen = new Set<string>();
  return hints.filter((hint) => {
    const key = `${hint.level}:${hint.message}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
