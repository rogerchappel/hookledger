import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, cp, writeFile, chmod } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { inventoryHooks } from "../src/inventory.js";
import { renderJsonLedger } from "../src/render-json.js";
import { verifyLedger } from "../src/verify.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const execFileAsync = promisify(execFile);

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

test("rejects malformed baseline ledgers with an actionable diagnostic", async () => {
  const root = await nativeGitFixture();
  const baselinePath = path.join(root, "hookledger.json");

  for (const [baseline, expected] of [
    [{}, "schemaVersion must be 1"],
    [{ schemaVersion: 1, tool: "hookledger", generatedAt: "2026-01-01T00:00:00.000Z", root: ".", summary: {} }, "hooks must be an array"],
    [{ schemaVersion: 1, tool: "hookledger", generatedAt: "2026-01-01T00:00:00.000Z", root: ".", summary: {}, hooks: [{}] }, "hooks[0].id must be a string"]
  ] as const) {
    await writeFile(baselinePath, JSON.stringify(baseline), "utf8");
    await assert.rejects(
      verifyLedger(root, baselinePath),
      new Error(`Invalid baseline ledger ${baselinePath}: ${expected}`)
    );
  }
});

test("detects drift in a hook from configured core.hooksPath", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "hookledger-verify-configured-"));
  const hooksDir = path.join(root, ".custom-hooks");
  await execFileAsync("git", ["init", "--quiet", root]);
  await execFileAsync("git", ["-C", root, "config", "core.hooksPath", ".custom-hooks"]);
  await mkdir(hooksDir, { recursive: true });
  await writeFile(path.join(hooksDir, "pre-commit"), "#!/bin/sh\nnpm test\n", "utf8");
  await chmod(path.join(hooksDir, "pre-commit"), 0o755);
  const ledger = await inventoryHooks({ root, generatedAt: "2026-01-01T00:00:00.000Z" });
  const baselinePath = path.join(root, "hookledger.json");
  await writeFile(baselinePath, renderJsonLedger(ledger), "utf8");

  await writeFile(path.join(hooksDir, "pre-commit"), "#!/bin/sh\nnpm run check\n", "utf8");
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
