#!/usr/bin/env bash
set -euo pipefail

ROOT="$(mktemp -d "${TMPDIR:-/tmp}/hookledger-smoke.XXXXXX")"
mkdir -p "$ROOT/.git/hooks"
cp -R "fixtures/native-git/git-hooks/." "$ROOT/.git/hooks/"

node dist/index.js inventory \
  --root "$ROOT" \
  --json "$ROOT/hookledger.json" \
  --markdown "$ROOT/HOOKLEDGER.md"

node dist/index.js verify --root "$ROOT" --baseline "$ROOT/hookledger.json"
