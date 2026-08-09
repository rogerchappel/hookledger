import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { chmod, mkdtemp, mkdir, cp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { inventoryHooks } from "../src/inventory.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const execFileAsync = promisify(execFile);

test("inventories native git hooks from a repository", async () => {
  const root = await nativeGitFixture();
  const ledger = await inventoryHooks({ root, generatedAt: "2026-01-01T00:00:00.000Z" });
  assert.equal(ledger.summary.total, 1);
  assert.equal(ledger.hooks[0]?.manager, "native-git");
  assert.equal(ledger.hooks[0]?.name, "pre-commit");
  assert.deepEqual(ledger.hooks[0]?.commands, ["npm test"]);
});

test("inventories shared native hooks from a linked worktree", async () => {
  const root = await linkedWorktreeFixture();
  const ledger = await inventoryHooks({ root, generatedAt: "2026-01-01T00:00:00.000Z" });

  assert.deepEqual(
    ledger.hooks.map(({ name, executable }) => ({ name, executable })),
    [
      { name: "pre-commit", executable: true },
      { name: "pre-push", executable: false }
    ]
  );
  assert.deepEqual(ledger.hooks[0]?.commands, ["npm test"]);
});

test("inventories native hooks from a repository-relative core.hooksPath", async () => {
  const root = await configuredHooksFixture(".custom-hooks");
  const ledger = await inventoryHooks({ root, generatedAt: "2026-01-01T00:00:00.000Z" });

  assert.deepEqual(
    ledger.hooks.map(({ name, executable }) => ({ name, executable })),
    [{ name: "pre-commit", executable: true }]
  );
  assert.deepEqual(ledger.hooks[0]?.commands, ["npm run configured-check"]);
});

test("inventories native hooks from an absolute core.hooksPath", async () => {
  const hooksDir = await mkdtemp(path.join(os.tmpdir(), "hookledger-absolute-hooks-"));
  const root = await configuredHooksFixture(hooksDir);
  const ledger = await inventoryHooks({ root, generatedAt: "2026-01-01T00:00:00.000Z" });

  assert.equal(ledger.hooks[0]?.name, "pre-commit");
  assert.equal(ledger.hooks[0]?.executable, true);
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

async function linkedWorktreeFixture(): Promise<string> {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "hookledger-linked-"));
  const root = path.join(fixtureRoot, "linked");
  const gitDir = path.join(fixtureRoot, "main", ".git", "worktrees", "linked");
  const commonDir = path.join(fixtureRoot, "main", ".git");
  const hooksDir = path.join(commonDir, "hooks");
  await mkdir(root, { recursive: true });
  await mkdir(gitDir, { recursive: true });
  await mkdir(hooksDir, { recursive: true });
  await writeFile(path.join(root, ".git"), `gitdir: ${gitDir}\n`, "utf8");
  await writeFile(path.join(gitDir, "commondir"), "../..\n", "utf8");
  await writeFile(path.join(hooksDir, "pre-commit"), "#!/bin/sh\nnpm test\n", "utf8");
  await chmod(path.join(hooksDir, "pre-commit"), 0o755);
  await writeFile(path.join(hooksDir, "pre-push"), "#!/bin/sh\nnpm run build\n", "utf8");
  await writeFile(path.join(hooksDir, "pre-rebase.sample"), "#!/bin/sh\nexit 0\n", "utf8");
  return root;
}

function fixture(...parts: string[]): string {
  return path.join(repoRoot, "fixtures", ...parts);
}

async function configuredHooksFixture(configuredPath: string): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "hookledger-configured-"));
  const hooksDir = path.isAbsolute(configuredPath) ? configuredPath : path.join(root, configuredPath);
  await execFileAsync("git", ["init", "--quiet", root]);
  await execFileAsync("git", ["-C", root, "config", "core.hooksPath", configuredPath]);
  await mkdir(hooksDir, { recursive: true });
  await writeFile(path.join(hooksDir, "pre-commit"), "#!/bin/sh\nnpm run configured-check\n", "utf8");
  await chmod(path.join(hooksDir, "pre-commit"), 0o755);
  return root;
}
