import { createHash } from "node:crypto";
import { access, readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readText(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

export async function readJson<T>(filePath: string): Promise<T | null> {
  const text = await readText(filePath);
  if (text === null) {
    return null;
  }
  return JSON.parse(text) as T;
}

export async function listFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(dir, entry.name))
      .sort();
  } catch {
    return [];
  }
}

export async function isExecutable(filePath: string): Promise<boolean | null> {
  try {
    await access(filePath, constants.X_OK);
    return true;
  } catch {
    if (await pathExists(filePath)) {
      return false;
    }
    return null;
  }
}

export async function hashFile(filePath: string): Promise<string | null> {
  try {
    const data = await readFile(filePath);
    return createHash("sha256").update(data).digest("hex");
  } catch {
    return null;
  }
}

export async function fileSize(filePath: string): Promise<number | null> {
  try {
    return (await stat(filePath)).size;
  } catch {
    return null;
  }
}

export async function writeText(filePath: string, contents: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
}

export function relativePath(root: string, target: string): string {
  return path.relative(root, target).split(path.sep).join("/") || ".";
}
