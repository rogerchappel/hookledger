import path from "node:path";
import { readJson } from "./fs-utils.js";

export interface PackageJson {
  scripts?: Record<string, string>;
  "simple-git-hooks"?: Record<string, string>;
  simpleGitHooks?: Record<string, string>;
  [key: string]: unknown;
}

export async function readPackageJson(root: string): Promise<PackageJson | null> {
  return readJson<PackageJson>(path.join(root, "package.json"));
}
