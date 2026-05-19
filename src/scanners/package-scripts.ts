import path from "node:path";
import { readPackageJson } from "../package-json.js";
import { makeVirtualHookRecord } from "../record.js";
import type { HookRecord } from "../types.js";

const HOOK_SCRIPT_NAMES = new Set([
  "precommit",
  "pre-commit",
  "commit-msg",
  "prepush",
  "pre-push",
  "premerge",
  "pre-merge",
  "prepare-commit-msg",
  "post-commit",
  "post-merge",
  "post-checkout",
  "prepare"
]);

export async function scanPackageHookScripts(root: string): Promise<HookRecord[]> {
  const packageJson = await readPackageJson(root);
  if (!packageJson?.scripts) {
    return [];
  }
  const packagePath = path.join(root, "package.json");
  return Object.entries(packageJson.scripts)
    .filter(([name, command]) => isHookLikeScript(name, command))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, command]) =>
      makeVirtualHookRecord(root, "package-script", name, packagePath, [command])
    );
}

function isHookLikeScript(name: string, command: string): boolean {
  const normalized = name.toLowerCase();
  return HOOK_SCRIPT_NAMES.has(normalized) || /\b(husky|lefthook|pre-commit|simple-git-hooks)\b/.test(command);
}
