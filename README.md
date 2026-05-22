# HookLedger

Read-only git hook inventory and verification ledger for developers and agents.

HookLedger answers: what local automation is about to run before a commit, push,
or merge? It inventories native git hooks and common hook managers without
installing, modifying, or executing hook bodies.

## Detects

- Native `.git/hooks` files, excluding `*.sample`.
- Husky hook files in `.husky/`.
- Lefthook `lefthook.yml` and `lefthook.yaml`.
- pre-commit `.pre-commit-config.yaml`.
- simple-git-hooks package and JSON config.
- Package scripts that look like local hook automation.

## Install

```sh
npm install
npm run build
```

During development, run the CLI through the built entry point:

```sh
node dist/index.js inventory --root .
```

## Use

Write JSON and Markdown ledgers:

```sh
hookledger inventory --root . --ledger-dir docs/hookledger
```

Write explicit output paths:

```sh
hookledger inventory \
  --root . \
  --json docs/hookledger/hookledger.json \
  --markdown docs/hookledger/HOOKLEDGER.md
```

Verify that current hooks still match a baseline:

```sh
hookledger verify --root . --baseline docs/hookledger/hookledger.json
```

Print inventory JSON to stdout:

```sh
hookledger inventory --root . --stdout
```

## Risk Hints

HookLedger reports informational, warning, and high-risk hints for patterns such
as non-executable hook files, network commands, destructive local commands, and
secret-like environment references. These hints are conservative signals for
review; HookLedger does not block by policy unless verification detects drift.

## Fixtures

Fixtures live under `fixtures/` for native git hooks, Husky, Lefthook,
pre-commit, simple-git-hooks, and package hook scripts.

Run the real CLI smoke against a temporary native-hook fixture:

```sh
npm run build
npm run smoke
```

## Verify

```sh
npm run build
npm run check
npm test
npm run smoke
bash scripts/validate.sh
```

## Attribution

Inspired by Husky, Lefthook, pre-commit, and maintainer onboarding checklists.
Reframed as a read-only local inventory and verification tool.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md). HookLedger does not require secrets and does not
include telemetry.

## License

MIT
