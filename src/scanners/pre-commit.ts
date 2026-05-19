import path from "node:path";
import { extractYamlCommands } from "../commands.js";
import { pathExists, readText } from "../fs-utils.js";
import { makeVirtualHookRecord } from "../record.js";
import type { HookRecord } from "../types.js";

const CONFIG_FILE = ".pre-commit-config.yaml";

export async function scanPreCommit(root: string): Promise<HookRecord[]> {
  const configPath = path.join(root, CONFIG_FILE);
  if (!(await pathExists(configPath))) {
    return [];
  }
  const contents = (await readText(configPath)) ?? "";
  const records: HookRecord[] = [];
  let currentId: string | null = null;
  let block: string[] = [];

  for (const line of contents.split(/\r?\n/)) {
    const idMatch = /^\s*-\s+id:\s*(.+)$/.exec(line);
    if (idMatch) {
      pushBlock(root, configPath, records, currentId, block);
      currentId = idMatch[1].trim();
      block = [line];
      continue;
    }
    block.push(line);
  }
  pushBlock(root, configPath, records, currentId, block);
  return records;
}

function pushBlock(
  root: string,
  configPath: string,
  records: HookRecord[],
  id: string | null,
  block: string[]
): void {
  if (!id) {
    return;
  }
  const commands = extractYamlCommands(block.join("\n"));
  records.push(makeVirtualHookRecord(root, "pre-commit", id, configPath, commands));
}
