import { readFile } from "node:fs/promises";

const tag = process.argv[2];

if (!tag) {
  console.error("Release tag is required (expected v<package.json version>, for example v0.1.0).");
  process.exitCode = 1;
} else if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(tag)) {
  console.error(`Invalid release tag ${JSON.stringify(tag)}; expected v<semver> (for example v0.1.0).`);
  process.exitCode = 1;
} else {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const expected = `v${manifest.version}`;

  if (tag !== expected) {
    console.error(`Release tag ${JSON.stringify(tag)} does not match package.json version ${JSON.stringify(manifest.version)}; expected ${JSON.stringify(expected)}.`);
    process.exitCode = 1;
  } else {
    console.log(`Release tag ${tag} matches package.json version ${manifest.version}.`);
  }
}
