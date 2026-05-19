import path from "node:path";
import { writeText } from "./fs-utils.js";
import { renderJsonLedger } from "./render-json.js";
import { renderMarkdownLedger } from "./render-markdown.js";
import type { HookLedger } from "./types.js";

export interface OutputPaths {
  jsonPath: string;
  markdownPath: string;
}

export async function writeLedgers(
  ledger: HookLedger,
  options: { jsonPath?: string | null; markdownPath?: string | null; ledgerDir?: string | null }
): Promise<OutputPaths> {
  const ledgerDir = options.ledgerDir ?? path.join(ledger.root, "docs", "hookledger");
  const jsonPath = options.jsonPath ?? path.join(ledgerDir, "hookledger.json");
  const markdownPath = options.markdownPath ?? path.join(ledgerDir, "HOOKLEDGER.md");
  await writeText(jsonPath, renderJsonLedger(ledger));
  await writeText(markdownPath, renderMarkdownLedger(ledger));
  return { jsonPath, markdownPath };
}
