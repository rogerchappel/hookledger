# Windows-path inventory fixture

This fixture uses Windows-style separators in its descriptive metadata, while the
tracked directory tree is traversed by the host-independent scanner API. The test
asserts normalized forward-slash ledger paths so CI does not rely on Windows
`path` parsing or a Windows runner.

Expected logical paths:

- `fixtures\\windows-paths\\.git\\hooks\\commit-msg`
- `fixtures\\windows-paths\\.git\\hooks\\pre-commit`

The `.sample` file is intentionally excluded.
