import { mkdtemp, mkdir, cp, writeFile, chmod } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { inventoryHooks } from "../src/inventory.js";
import { renderJsonLedger } from "../src/render-json.js";
import { verifyLedger } from "../src/verify.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

test("passes when hook ledger matches current hooks", async () => {
  const root = await nativeGitFixture();
  const ledger = await inventoryHooks({ root, generatedAt: "2026-01-01T00:00:00.000Z" });
  const baselinePath = path.join(root, "hookledger.json");
  await writeFile(baselinePath, renderJsonLedger(ledger), "utf8");
  const result = await verifyLedger(root, baselinePath);
  assert.equal(result.ok, true);
});

test("fails when a hook file changes", async () => {
  const root = await nativeGitFixture();
  const ledger = await inventoryHooks({ root, generatedAt: "2026-01-01T00:00:00.000Z" });
  const baselinePath = path.join(root, "hookledger.json");
  await writeFile(baselinePath, renderJsonLedger(ledger), "utf8");
  await writeFile(path.join(root, ".git", "hooks", "pre-commit"), "#!/bin/sh\nnpm run check\n", "utf8");
  await chmod(path.join(root, ".git", "hooks", "pre-commit"), 0o755);
  const result = await verifyLedger(root, baselinePath);
  assert.equal(result.ok, false);
  assert.equal(result.changed.length, 1);
  assert.match(result.changed[0]?.fields.join(","), /commands/);
});

async function nativeGitFixture(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "hookledger-verify-"));
  await mkdir(path.join(root, ".git", "hooks"), { recursive: true });
  await cp(path.join(repoRoot, "fixtures", "native-git", "git-hooks"), path.join(root, ".git", "hooks"), { recursive: true });
  return root;
}
