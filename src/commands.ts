const COMMENT_PATTERN = /^\s*#/;
const SHELL_ASSIGNMENT = /^\s*[A-Za-z_][A-Za-z0-9_]*=/;
const CONTROL_PATTERN = /^\s*(if|then|fi|for|do|done|case|esac|while|until|else|elif)\b/;

export function extractShellCommands(contents: string): string[] {
  return contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !COMMENT_PATTERN.test(line))
    .filter((line) => !line.startsWith("#!"))
    .filter((line) => !SHELL_ASSIGNMENT.test(line))
    .filter((line) => !CONTROL_PATTERN.test(line))
    .slice(0, 20);
}

export function extractYamlCommands(contents: string): string[] {
  const commands: string[] = [];
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    const match = /^(run|entry|command|cmd|script):\s*(.+)$/.exec(trimmed);
    if (match) {
      commands.push(stripQuotes(match[2]));
      continue;
    }
    const listMatch = /^-\s+(run|entry|command|cmd|script):\s*(.+)$/.exec(trimmed);
    if (listMatch) {
      commands.push(stripQuotes(listMatch[2]));
    }
  }
  return commands.slice(0, 50);
}

export function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
