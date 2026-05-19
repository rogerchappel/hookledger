import path from "node:path";
import { extractYamlCommands } from "../commands.js";
import { pathExists, readText } from "../fs-utils.js";
import { makeVirtualHookRecord } from "../record.js";
import type { HookRecord } from "../types.js";

const LEFTHOOK_FILES = ["lefthook.yml", "lefthook.yaml"];
const HOOK_HEADER = /^([a-z][a-z0-9-]+):\s*$/i;

export async function scanLefthook(root: string): Promise<HookRecord[]> {
  const configPath = await firstExisting(root, LEFTHOOK_FILES);
  if (!configPath) {
    return [];
  }
  const contents = (await readText(configPath)) ?? "";
  const records: HookRecord[] = [];
  let currentHook = "lefthook";
  let block: string[] = [];

  for (const line of contents.split(/\r?\n/)) {
    const header = HOOK_HEADER.exec(line);
    if (header && !line.startsWith(" ") && !line.startsWith("\t")) {
      pushBlock(root, configPath, records, currentHook, block);
      currentHook = header[1];
      block = [];
      continue;
    }
    block.push(line);
  }
  pushBlock(root, configPath, records, currentHook, block);
  return records;
}

function pushBlock(
  root: string,
  configPath: string,
  records: HookRecord[],
  hookName: string,
  block: string[]
): void {
  const commands = extractYamlCommands(block.join("\n"));
  if (commands.length > 0) {
    records.push(makeVirtualHookRecord(root, "lefthook", hookName, configPath, commands));
  }
}

async function firstExisting(root: string, names: string[]): Promise<string | null> {
  for (const name of names) {
    const filePath = path.join(root, name);
    if (await pathExists(filePath)) {
      return filePath;
    }
  }
  return null;
}
