import path from "node:path";
import { extractShellCommands } from "./commands.js";
import { hashFile, isExecutable, pathExists, readText, relativePath } from "./fs-utils.js";
import { missingReferenceHints, riskHintsFor } from "./risk.js";
import type { HookManager, HookRecord } from "./types.js";

export interface FileHookInput {
  root: string;
  manager: HookManager;
  name: string;
  filePath: string;
  commands?: string[];
  missingReferences?: string[];
}

export async function makeFileHookRecord(input: FileHookInput): Promise<HookRecord> {
  const exists = await pathExists(input.filePath);
  const executable = await isExecutable(input.filePath);
  const text = exists ? await readText(input.filePath) : null;
  const commands = input.commands ?? (text ? extractShellCommands(text) : []);
  const missingReferences = input.missingReferences ?? [];
  const riskHints = [
    ...riskHintsFor(commands, executable),
    ...missingReferenceHints(missingReferences)
  ];
  const relPath = relativePath(input.root, input.filePath);
  return {
    id: stableHookId(input.manager, input.name, relPath),
    manager: input.manager,
    name: input.name,
    path: relPath,
    exists,
    executable,
    commands,
    missingReferences,
    riskHints,
    sha256: await hashFile(input.filePath)
  };
}

export function makeVirtualHookRecord(
  root: string,
  manager: HookManager,
  name: string,
  sourcePath: string,
  commands: string[],
  missingReferences: string[] = []
): HookRecord {
  const relPath = relativePath(root, sourcePath);
  return {
    id: stableHookId(manager, name, relPath),
    manager,
    name,
    path: relPath,
    exists: true,
    executable: null,
    commands,
    missingReferences,
    riskHints: [
      ...riskHintsFor(commands, null),
      ...missingReferenceHints(missingReferences)
    ],
    sha256: null
  };
}

export function stableHookId(manager: HookManager, name: string, relPath: string): string {
  return [manager, name, relPath.split(path.sep).join("/")].join(":");
}
