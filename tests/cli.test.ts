import { access, mkdtemp, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const cliPath = path.resolve(import.meta.dirname, "..", "src", "index.js");

test("inventory rejects a missing root without creating outputs", async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "hookledger-cli-missing-"));
  const root = path.join(parent, "missing");
  await assertInvalidRoot(root, "Inventory root does not exist");
});

test("inventory rejects a regular-file root without creating outputs", async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "hookledger-cli-file-"));
  const root = path.join(parent, "package.json");
  await writeFile(root, "{}\n", "utf8");
  await assertInvalidRoot(root, "Inventory root is not a directory");
});

async function assertInvalidRoot(root: string, message: string): Promise<void> {
  const outputDir = `${root}-output`;
  const jsonPath = path.join(outputDir, "hookledger.json");
  const markdownPath = path.join(outputDir, "HOOKLEDGER.md");
  const result = spawnSync(process.execPath, [cliPath, "inventory", "--root", root, "--json", jsonPath, "--markdown", markdownPath], {
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, new RegExp(`${message}: ${escapeRegExp(path.resolve(root))}`));
  await assert.rejects(access(jsonPath));
  await assert.rejects(access(markdownPath));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
