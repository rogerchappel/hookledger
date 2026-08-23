import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

function validate(tag?: string) {
  return spawnSync(process.execPath, ["scripts/assert-release-version.mjs", ...(tag ? [tag] : [])], {
    encoding: "utf8",
  });
}

test("accepts a release tag matching the package version", () => {
  const result = validate("v0.1.0");

  assert.equal(result.status, 0);
  assert.match(result.stdout, /v0\.1\.0 matches package\.json version 0\.1\.0/);
});

test("rejects a release tag that does not match the package version", () => {
  const result = validate("v0.2.0");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /does not match package\.json version "0\.1\.0"; expected "v0\.1\.0"/);
});

test("rejects missing and malformed release tags", () => {
  const missing = validate();
  const malformed = validate("release-0.1.0");

  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Release tag is required/);
  assert.equal(malformed.status, 1);
  assert.match(malformed.stderr, /Invalid release tag "release-0\.1\.0"; expected v<semver>/);
});
