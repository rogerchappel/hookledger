import path from "node:path";
import { readJson } from "../fs-utils.js";
import type { PackageJson } from "../package-json.js";
import { readPackageJson } from "../package-json.js";
import { makeVirtualHookRecord } from "../record.js";
import type { HookRecord } from "../types.js";

type HookMap = Record<string, string>;

export async function scanSimpleGitHooks(root: string): Promise<HookRecord[]> {
  const packageJson = await readPackageJson(root);
  const packageHooks = packageJson ? hooksFromPackage(packageJson) : {};
  const configPath = path.join(root, ".simple-git-hooks.json");
  const fileHooks = (await readJson<HookMap>(configPath)) ?? {};
  const packagePath = path.join(root, "package.json");
  const records: HookRecord[] = [];

  for (const [name, command] of Object.entries(packageHooks).sort()) {
    records.push(makeVirtualHookRecord(root, "simple-git-hooks", name, packagePath, [command]));
  }
  for (const [name, command] of Object.entries(fileHooks).sort()) {
    records.push(makeVirtualHookRecord(root, "simple-git-hooks", name, configPath, [command]));
  }
  return records;
}

function hooksFromPackage(packageJson: PackageJson): HookMap {
  return {
    ...(packageJson["simple-git-hooks"] ?? {}),
    ...(packageJson.simpleGitHooks ?? {})
  };
}
