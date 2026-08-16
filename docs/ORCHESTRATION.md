# HookLedger Orchestration

HookLedger is a single-agent MVP built from the PRD at
`oss-ideas/ideas/in-progress/hookledger/PRD.md`.

## Ownership

- Repo: `rogerchappel/hookledger`
- Default branch: `main`
- Package manager: `npm`
- Runtime: Node.js 20+

## Local Workflow

1. Install dependencies with `npm install`.
2. Build with `npm run build`.
3. Run checks with `npm run check`.
4. Run tests with `npm test`.
5. Run a real CLI smoke with `npm run smoke`.
6. Run all local gates with `bash scripts/validate.sh`.

## Safety

HookLedger must remain read-only. It may read hook files and hook-manager
configuration, but it must not install, modify, delete, or execute hooks.

## Release Notes

The release workflow publishes the verified package to npm with provenance before
creating its matching GitHub release. npm trusted publishing must be configured as
described in `docs/release-checklist.md`; Homebrew publishing remains disabled.
