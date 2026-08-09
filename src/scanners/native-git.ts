import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { listFiles, readText } from "../fs-utils.js";
import { makeFileHookRecord } from "../record.js";
import type { HookRecord } from "../types.js";

const execFileAsync = promisify(execFile);

export async function scanNativeGitHooks(root: string): Promise<HookRecord[]> {
  const hooksDir = await resolveHooksDir(root);
  const files = await listFiles(hooksDir);
  const hookFiles = files.filter((file) => !path.basename(file).endsWith(".sample"));
  const records = await Promise.all(
    hookFiles.map((filePath) =>
      makeFileHookRecord({
        root,
        manager: "native-git",
        name: path.basename(filePath),
        filePath
      })
    )
  );
  return records;
}

async function resolveHooksDir(root: string): Promise<string> {
  const configuredHooksPath = await readConfiguredHooksPath(root);
  if (configuredHooksPath) {
    return path.isAbsolute(configuredHooksPath)
      ? configuredHooksPath
      : path.resolve(root, configuredHooksPath);
  }

  const dotGitPath = path.join(root, ".git");
  const dotGitFile = await readText(dotGitPath);
  const gitDirMatch = dotGitFile?.match(/^gitdir:\s*(.+)\s*$/im);
  const gitDir = gitDirMatch
    ? path.resolve(path.dirname(dotGitPath), gitDirMatch[1])
    : dotGitPath;

  const commonDirFile = await readText(path.join(gitDir, "commondir"));
  const commonDir = commonDirFile?.trim()
    ? path.resolve(gitDir, commonDirFile.trim())
    : gitDir;
  return path.join(commonDir, "hooks");
}

async function readConfiguredHooksPath(root: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["-C", root, "config", "--path", "--get", "core.hooksPath"],
      { encoding: "utf8" }
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}
