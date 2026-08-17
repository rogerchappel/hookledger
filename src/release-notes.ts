import assert from "node:assert/strict";

export function assertReleaseNotesMatch(workspaceNotes: Buffer, packedNotes: Buffer): void {
  assert.deepEqual(
    packedNotes,
    workspaceNotes,
    "packed RELEASE_NOTES.md must exactly match the generated workspace file"
  );
}
