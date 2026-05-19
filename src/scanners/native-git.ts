import path from "node:path";
import { listFiles } from "../fs-utils.js";
import { makeFileHookRecord } from "../record.js";
import type { HookRecord } from "../types.js";

export async function scanNativeGitHooks(root: string): Promise<HookRecord[]> {
  const hooksDir = path.join(root, ".git", "hooks");
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
