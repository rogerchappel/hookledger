export type HookManager =
  | "native-git"
  | "husky"
  | "lefthook"
  | "pre-commit"
  | "simple-git-hooks"
  | "package-script";

export type RiskLevel = "info" | "warning" | "high";

export interface RiskHint {
  level: RiskLevel;
  message: string;
}

export interface HookRecord {
  id: string;
  manager: HookManager;
  name: string;
  path: string;
  exists: boolean;
  executable: boolean | null;
  commands: string[];
  missingReferences: string[];
  riskHints: RiskHint[];
  sha256: string | null;
}

export interface InventorySummary {
  total: number;
  byManager: Record<string, number>;
  warnings: number;
  highRisk: number;
  missingReferences: number;
}

export interface HookLedger {
  schemaVersion: 1;
  tool: "hookledger";
  generatedAt: string;
  root: string;
  summary: InventorySummary;
  hooks: HookRecord[];
}

export interface InventoryOptions {
  root: string;
  generatedAt?: string;
}

export interface VerifyResult {
  ok: boolean;
  baselinePath: string;
  current: HookLedger;
  baseline: HookLedger;
  added: HookRecord[];
  removed: HookRecord[];
  changed: Array<{ baseline: HookRecord; current: HookRecord; fields: string[] }>;
}
