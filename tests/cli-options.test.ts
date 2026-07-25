import assert from "node:assert/strict";
import test from "node:test";
import { parseArgs } from "../src/cli-options.js";

test("parses documented inventory and verify options", () => {
  assert.deepEqual(
    [...parseArgs(["inventory", "--root", ".", "--json=ledger.json", "--stdout"]).flags],
    [["root", "."], ["json", "ledger.json"], ["stdout", true]]
  );
  assert.deepEqual(
    [...parseArgs(["verify", "--baseline", "ledger.json", "--root=."]).flags],
    [["baseline", "ledger.json"], ["root", "."]]
  );
});

test("rejects options that are not allowed for the command", () => {
  assert.throws(
    () => parseArgs(["inventory", "--bogus"]),
    /Unknown option for inventory: --bogus/
  );
  assert.throws(
    () => parseArgs(["verify", "--stdout"]),
    /Unknown option for verify: --stdout/
  );
});

for (const option of ["root", "json", "markdown", "ledger-dir"]) {
  test(`rejects a missing inventory --${option} value`, () => {
    assert.throws(
      () => parseArgs(["inventory", `--${option}`]),
      new RegExp(`--${option} requires a value`)
    );
  });
}

test("rejects a missing verify option value", () => {
  assert.throws(
    () => parseArgs(["verify", "--baseline", "--root", "."]),
    /--baseline requires a value/
  );
  assert.throws(
    () => parseArgs(["verify", "--baseline="]),
    /--baseline requires a value/
  );
});

test("rejects values supplied to boolean options", () => {
  assert.throws(
    () => parseArgs(["inventory", "--stdout=json"]),
    /--stdout does not accept a value/
  );
  assert.throws(
    () => parseArgs(["inventory", "--stdout", "json"]),
    /--stdout does not accept a value: json/
  );
});
