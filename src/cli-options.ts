export interface ParsedArgs {
  command: string;
  flags: Map<string, string | boolean>;
}

type FlagKind = "string" | "boolean";

const COMMAND_FLAGS: Record<string, Readonly<Record<string, FlagKind>>> = {
  inventory: {
    root: "string",
    json: "string",
    markdown: "string",
    "ledger-dir": "string",
    stdout: "boolean"
  },
  verify: {
    baseline: "string",
    root: "string"
  },
  help: {},
  "--help": {},
  "-h": {}
};

export function parseArgs(argv: string[]): ParsedArgs {
  const [command = "help", ...rest] = argv;
  const allowedFlags = COMMAND_FLAGS[command];
  if (!allowedFlags) {
    throw new Error(`Unknown command: ${command}`);
  }
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
    const kind = allowedFlags[rawName];
    if (!kind) {
      throw new Error(`Unknown option for ${command}: --${rawName}`);
    }
    if (kind === "boolean") {
      if (inlineValue !== undefined) {
        throw new Error(`--${rawName} does not accept a value`);
      }
      const next = rest[index + 1];
      if (next && !next.startsWith("--")) {
        throw new Error(`--${rawName} does not accept a value: ${next}`);
      }
      flags.set(rawName, true);
      continue;
    }
    const value = inlineValue ?? rest[index + 1];
    if (value === undefined || value === "" || value.startsWith("--")) {
      throw new Error(`--${rawName} requires a value`);
    }
    flags.set(rawName, value);
    if (inlineValue === undefined) index += 1;
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
