import assert from "node:assert/strict";
import test from "node:test";
import { assertReleaseNotesMatch } from "../src/release-notes.js";

test("accepts packed release notes that match the generated workspace file", () => {
  const notes = Buffer.from("# Release notes\n\n- Added package verification.\n");

  assert.doesNotThrow(() => assertReleaseNotesMatch(notes, Buffer.from(notes)));
});

test("rejects packed release notes that differ from the generated workspace file", () => {
  const workspaceNotes = Buffer.from("# Release notes\n\n- Current release.\n");
  const stalePackedNotes = Buffer.from("# Release notes\n\n- Previous release.\n");

  assert.throws(
    () => assertReleaseNotesMatch(workspaceNotes, stalePackedNotes),
    /packed RELEASE_NOTES\.md must exactly match the generated workspace file/
  );
});
