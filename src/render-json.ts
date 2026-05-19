import type { HookLedger } from "./types.js";

export function renderJsonLedger(ledger: HookLedger): string {
  return `${JSON.stringify(ledger, null, 2)}\n`;
}
