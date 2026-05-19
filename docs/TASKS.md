# HookLedger Tasks

## MVP

- [x] Scaffold TypeScript CLI package with StackForge.
- [x] Preserve the project PRD in docs.
- [x] Detect native git hooks without executing hook bodies.
- [x] Detect Husky hooks.
- [x] Detect Lefthook configuration.
- [x] Detect pre-commit configuration.
- [x] Detect simple-git-hooks configuration.
- [x] Detect package manager hook-like scripts.
- [x] Summarize hook names, executable status, commands, hashes, and risk hints.
- [x] Write JSON and Markdown ledgers.
- [x] Verify current hooks against a baseline JSON ledger.
- [x] Include fixtures for common hook managers.
- [x] Add tests and a real CLI smoke run.
- [x] Publish as a public GitHub repository.

## Follow-up

- [ ] Add richer YAML parsing for complex Lefthook and pre-commit files.
- [ ] Add SARIF output for security tooling.
- [ ] Add optional allowlist policies for expected high-risk commands.
- [ ] Add CI fixtures for Windows path behavior.
