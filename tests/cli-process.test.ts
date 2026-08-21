import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const cliPath = path.resolve("dist/src/index.js");
const fixtureRoot = path.resolve("fixtures/husky");

function run(...args: string[]) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    encoding: "utf8"
  });
}

test("invalid inventory arguments fail without producing an inventory", () => {
  for (const args of [
    ["inventory", "--bogus", "--stdout"],
    ["inventory", "--root", "--stdout"],
    ["inventory", "--json", "--markdown", "ledger.md"],
    ["inventory", "--stdout=json"]
  ]) {
    const result = run(...args);
    assert.equal(result.status, 1, args.join(" "));
    assert.equal(result.stdout, "", args.join(" "));
    assert.match(result.stderr, /^hookledger: .+\n$/, args.join(" "));
  }
});

test("invalid verify arguments fail without producing a report", () => {
  const result = run("verify", "--baseline", "--root", fixtureRoot);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "hookledger: --baseline requires a value\n");
});

test("malformed baseline ledgers fail without an internal error", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hookledger-cli-malformed-"));
  const baseline = path.join(directory, "baseline.json");
  await writeFile(baseline, "{}\n", "utf8");

  const result = run("verify", "--root", fixtureRoot, "--baseline", baseline);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, `hookledger: Invalid baseline ledger ${baseline}: schemaVersion must be 1\n`);
  assert.doesNotMatch(result.stderr, /TypeError|stack/i);
});

test("documented inventory, verify, and help commands succeed", async () => {
  const inventory = run("inventory", "--root", fixtureRoot, "--stdout");
  assert.equal(inventory.status, 0);
  assert.equal(inventory.stderr, "");
  const ledger = JSON.parse(inventory.stdout) as { hooks: unknown[] };
  assert.ok(ledger.hooks.length > 0);

  const directory = await mkdtemp(path.join(os.tmpdir(), "hookledger-cli-"));
  const baseline = path.join(directory, "baseline.json");
  await writeFile(baseline, inventory.stdout, "utf8");
  const verify = run("verify", "--root", fixtureRoot, "--baseline", baseline);
  assert.equal(verify.status, 0);
  assert.equal(verify.stderr, "");
  assert.match(verify.stdout, /HookLedger verification passed\./);

  for (const args of [["--help"], ["help"]]) {
    const help = run(...args);
    assert.equal(help.status, 0);
    assert.equal(help.stderr, "");
    assert.match(help.stdout, /Usage:/);
  }
});
