import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertReleaseNotesMatch } from "../dist/src/release-notes.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const temporaryRoot = await mkdtemp(join(tmpdir(), "hookledger-package-smoke-"));
const packDirectory = join(temporaryRoot, "pack");
const installDirectory = join(temporaryRoot, "install");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with status ${result.status}\n${result.stdout}${result.stderr}`,
    );
  }

  return result;
}

try {
  await mkdir(packDirectory);
  await mkdir(installDirectory);
  const packed = run(npmCommand, ["pack", "--json", "--pack-destination", packDirectory]);
  const metadata = JSON.parse(packed.stdout);

  assert.equal(metadata.length, 1, "npm pack should produce exactly one package");
  const [{ filename, files }] = metadata;
  const paths = new Set(files.map((file) => file.path));
  const requiredFiles = [
    "dist/src/index.js",
    "README.md",
    "LICENSE",
    "SECURITY.md",
    "SUPPORT.md",
    "RELEASE_NOTES.md",
  ];

  for (const requiredFile of requiredFiles) {
    assert(paths.has(requiredFile), `packed artifact is missing ${requiredFile}`);
  }
  assert(
    [...paths].some((path) => path.startsWith("fixtures/") && !path.endsWith("/")),
    "packed artifact is missing fixtures",
  );

  const packageJson = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
  const cliPath = packageJson.bin.hookledger.replace(/^\.\//, "");
  assert(paths.has(cliPath), `packed artifact is missing CLI target ${cliPath}`);

  const tarball = join(packDirectory, filename);
  run(npmCommand, ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--no-package-lock", tarball], {
    cwd: installDirectory,
  });
  const cli = join(installDirectory, "node_modules", ".bin", process.platform === "win32" ? "hookledger.cmd" : "hookledger");
  const installedPackage = join(installDirectory, "node_modules", "hookledger");
  assertReleaseNotesMatch(
    await readFile(join(projectRoot, "RELEASE_NOTES.md")),
    await readFile(join(installedPackage, "RELEASE_NOTES.md")),
  );
  const executed = run(cli, ["--help"], { cwd: temporaryRoot });
  assert.match(executed.stdout, /Usage:\s+hookledger/, "installed CLI should print its help output");

  console.log(`Verified ${filename}: ${files.length} files, installed CLI executed outside checkout.`);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
