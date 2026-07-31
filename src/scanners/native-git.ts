import path from "node:path";
import { listFiles, readText } from "../fs-utils.js";
import { makeFileHookRecord } from "../record.js";
import type { HookRecord } from "../types.js";

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
