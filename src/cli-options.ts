export interface ParsedArgs {
  command: string;
  flags: Map<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const [command = "help", ...rest] = argv;
  const flags = new Map<string, string | boolean>();
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${token}`);
    }
    const [rawName, inlineValue] = token.slice(2).split("=", 2);
    if (!rawName) {
      throw new Error(`Invalid flag: ${token}`);
    }
    if (inlineValue !== undefined) {
      flags.set(rawName, inlineValue);
      continue;
    }
    const next = rest[index + 1];
    if (next && !next.startsWith("--")) {
      flags.set(rawName, next);
      index += 1;
    } else {
      flags.set(rawName, true);
    }
  }
  return { command, flags };
}

export function stringFlag(flags: Map<string, string | boolean>, name: string, fallback: string): string {
  const value = flags.get(name);
  if (value === undefined || value === true) {
    return fallback;
  }
  return value as string;
}

export function optionalStringFlag(flags: Map<string, string | boolean>, name: string): string | null {
  const value = flags.get(name);
  if (value === undefined || value === true) {
    return null;
  }
  return value as string;
}

export function hasFlag(flags: Map<string, string | boolean>, name: string): boolean {
  return flags.has(name);
}
