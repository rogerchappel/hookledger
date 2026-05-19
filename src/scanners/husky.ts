import path from "node:path";
import { listFiles } from "../fs-utils.js";
import { makeFileHookRecord } from "../record.js";
import type { HookRecord } from "../types.js";

export async function scanHuskyHooks(root: string): Promise<HookRecord[]> {
  const huskyDir = path.join(root, ".husky");
  const files = await listFiles(huskyDir);
  const hookFiles = files.filter((file) => {
    const name = path.basename(file);
    return !name.startsWith(".") && name !== "_" && name !== "husky.sh";
  });
  return Promise.all(
    hookFiles.map((filePath) =>
      makeFileHookRecord({
        root,
        manager: "husky",
        name: path.basename(filePath),
        filePath
      })
    )
  );
}
