import { mkdtemp, mkdir, cp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { inventoryHooks } from "../src/inventory.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

test("inventories native git hooks from a repository", async () => {
  const root = await nativeGitFixture();
  const ledger = await inventoryHooks({ root, generatedAt: "2026-01-01T00:00:00.000Z" });
  assert.equal(ledger.summary.total, 1);
  assert.equal(ledger.hooks[0]?.manager, "native-git");
  assert.equal(ledger.hooks[0]?.name, "pre-commit");
  assert.deepEqual(ledger.hooks[0]?.commands, ["npm test"]);
});

test("inventories Husky hooks", async () => {
  const ledger = await inventoryHooks({ root: fixture("husky") });
  assert.equal(ledger.hooks.filter((hook) => hook.manager === "husky").length, 2);
  assert.match(ledger.hooks.map((hook) => hook.name).join(","), /pre-commit/);
});

test("inventories Lefthook command config", async () => {
  const ledger = await inventoryHooks({ root: fixture("lefthook") });
  assert.deepEqual(ledger.hooks.map((hook) => hook.name), ["pre-commit", "pre-push"]);
});

test("inventories pre-commit config", async () => {
  const ledger = await inventoryHooks({ root: fixture("pre-commit") });
  assert.deepEqual(ledger.hooks.map((hook) => hook.name), ["lint", "unit-tests"]);
});

test("inventories simple-git-hooks config", async () => {
  const ledger = await inventoryHooks({ root: fixture("simple-git-hooks") });
  assert.equal(ledger.hooks.filter((hook) => hook.manager === "simple-git-hooks").length, 3);
});

test("inventories package hook scripts", async () => {
  const ledger = await inventoryHooks({ root: fixture("package-scripts") });
  const names = ledger.hooks.map((hook) => hook.name).sort();
  assert.deepEqual(names, ["precommit", "prepare", "prepush"]);
});

async function nativeGitFixture(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "hookledger-native-"));
  await mkdir(path.join(root, ".git", "hooks"), { recursive: true });
  await cp(fixture("native-git", "git-hooks"), path.join(root, ".git", "hooks"), { recursive: true });
  await writeFile(path.join(root, "README.md"), "native fixture\n", "utf8");
  return root;
}

function fixture(...parts: string[]): string {
  return path.join(repoRoot, "fixtures", ...parts);
}
