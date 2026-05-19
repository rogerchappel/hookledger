# HookLedger PRD

Status: in-progress

## Summary

HookLedger inventories local git hooks and hook-manager configuration, then writes an auditable ledger of what will run before commits, pushes, or merges. It gives developers and agents a quick answer to "what local automation is about to fire?"

## Problem

Git hooks hide important behavior in `.git/hooks`, Husky folders, package scripts, and manager config. Agents can trip hooks unexpectedly or bypass them without realizing it.

## Users

- Developers entering an unfamiliar repo.
- Agents preparing commits.
- Maintainers documenting local contribution workflow.

## MVP

- Detect native git hooks, Husky, Lefthook, pre-commit, simple-git-hooks, and package manager hook scripts.
- Summarize hook names, executable status, referenced commands, missing files, and risk hints.
- Write markdown and JSON ledgers.
- Provide a verify mode that fails on changed or missing hooks.
- Include fixtures for common hook managers.

## Non-goals

- Installing or modifying hooks.
- Executing hook bodies.
- Replacing dedicated hook managers.

## Source Attribution

Inspired by Husky, Lefthook, pre-commit, and maintainer onboarding checklists. Reframed as a read-only local inventory and verification tool.

