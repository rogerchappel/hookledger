#!/usr/bin/env node
import path from "node:path";
import { parseArgs, hasFlag, optionalStringFlag, stringFlag } from "./cli-options.js";
import { inventoryHooks } from "./inventory.js";
import { writeLedgers } from "./output.js";
import { inventorySummaryText, verifySummaryText } from "./report.js";
import { verifyLedger } from "./verify.js";

const HELP = `HookLedger inventories local git hooks without executing them.

Usage:
  hookledger inventory [--root <path>] [--json <path>] [--markdown <path>] [--ledger-dir <path>] [--stdout]
  hookledger verify --baseline <path> [--root <path>]
  hookledger help

Commands:
  inventory  Detect native git hooks and common hook-manager config.
  verify     Compare current inventory against a JSON ledger.
`;

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const parsed = parseArgs(argv);
  if (parsed.command === "help" || parsed.command === "--help" || parsed.command === "-h") {
    process.stdout.write(HELP);
    return 0;
  }
  if (parsed.command === "inventory") {
    const root = path.resolve(stringFlag(parsed.flags, "root", process.cwd()));
    const ledger = await inventoryHooks({ root });
    if (hasFlag(parsed.flags, "stdout")) {
      process.stdout.write(JSON.stringify(ledger, null, 2));
      process.stdout.write("\n");
      return 0;
    }
    const outputs = await writeLedgers(ledger, {
      jsonPath: optionalStringFlag(parsed.flags, "json"),
      markdownPath: optionalStringFlag(parsed.flags, "markdown"),
      ledgerDir: optionalStringFlag(parsed.flags, "ledger-dir")
    });
    process.stdout.write(inventorySummaryText(ledger, outputs));
    return 0;
  }
  if (parsed.command === "verify") {
    const root = path.resolve(stringFlag(parsed.flags, "root", process.cwd()));
    const baseline = optionalStringFlag(parsed.flags, "baseline");
    if (!baseline) {
      throw new Error("verify requires --baseline <path>");
    }
    const result = await verifyLedger(root, path.resolve(baseline));
    process.stdout.write(verifySummaryText(result));
    return result.ok ? 0 : 1;
  }
  throw new Error(`Unknown command: ${parsed.command}`);
}

main().then((code) => {
  process.exitCode = code;
}).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`hookledger: ${message}\n`);
  process.exitCode = 1;
});
