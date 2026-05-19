import test from "node:test";
import assert from "node:assert/strict";
import { renderJsonLedger } from "../src/render-json.js";
import { renderMarkdownLedger } from "../src/render-markdown.js";
import type { HookLedger } from "../src/types.js";

const ledger: HookLedger = {
  schemaVersion: 1,
  tool: "hookledger",
  generatedAt: "2026-01-01T00:00:00.000Z",
  root: "/repo",
  summary: {
    total: 1,
    byManager: { husky: 1 },
    warnings: 0,
    highRisk: 0,
    missingReferences: 0
  },
  hooks: [
    {
      id: "husky:pre-commit:.husky/pre-commit",
      manager: "husky",
      name: "pre-commit",
      path: ".husky/pre-commit",
      exists: true,
      executable: true,
      commands: ["npm test"],
      missingReferences: [],
      riskHints: [],
      sha256: "abc"
    }
  ]
};

test("renders parseable JSON ledger", () => {
  const parsed = JSON.parse(renderJsonLedger(ledger)) as HookLedger;
  assert.equal(parsed.tool, "hookledger");
  assert.equal(parsed.hooks[0]?.name, "pre-commit");
});

test("renders markdown ledger with hook details", () => {
  const markdown = renderMarkdownLedger(ledger);
  assert.match(markdown, /# HookLedger/);
  assert.match(markdown, /husky: pre-commit/);
  assert.match(markdown, /npm test/);
});
