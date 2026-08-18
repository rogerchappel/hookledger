import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { parse } from "yaml";

const releaseWorkflow = resolve(".github/workflows/release.yml");
const dryRunWorkflow = resolve(".github/workflows/release-dry-run.yml");

test("release publishes the verified tarball before creating the GitHub release", async () => {
  const workflow = await readFile(releaseWorkflow, "utf8");
  const document = parse(workflow) as {
    jobs?: Record<string, {
      needs?: string;
      permissions?: Record<string, string>;
      steps?: Array<{ name?: string; run?: string; uses?: string }>;
    }>;
  };
  const publish = "npm publish ./*.tgz --access public --provenance";
  const createRelease = "gh release create";
  const prepare = document.jobs?.prepare;
  const publishJob = document.jobs?.publish;

  assert.deepEqual(Object.keys(document.jobs ?? {}), ["prepare", "publish"]);
  assert.deepEqual(prepare?.permissions, { contents: "read" });
  assert.deepEqual(publishJob?.permissions, {
    contents: "write",
    "id-token": "write",
  });
  assert.equal(publishJob?.needs, "prepare");
  assert.ok(prepare?.steps?.some((step) =>
    step.name === "Preserve verified release assets" &&
    step.uses === "actions/upload-artifact@v4"
  ));
  assert.ok(publishJob?.steps?.some((step) =>
    step.name === "Publish package to npm" && step.run === publish
  ));

  assert.ok(workflow.indexOf("Generate release notes") < workflow.indexOf("Run release checks"));
  assert.ok(workflow.indexOf("Run release checks") < workflow.indexOf("Build package"));
  assert.ok(workflow.indexOf(publish) > workflow.indexOf("actions/download-artifact@v4"));
  assert.ok(workflow.indexOf(createRelease) > workflow.indexOf(publish));
});

test("pull requests exercise the publish command in dry-run mode", async () => {
  const workflow = await readFile(dryRunWorkflow, "utf8");

  assert.match(workflow, /permissions:\n  contents: read/);
  assert.match(
    workflow,
    /npm publish \.\/\*\.tgz --access public --provenance --dry-run/,
  );
  assert.doesNotMatch(workflow, /npm publish \.\/\*\.tgz --access public --provenance\s*$/m);
});
