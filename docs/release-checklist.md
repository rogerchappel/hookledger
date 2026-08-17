# Release Checklist

Use this checklist before publishing hookledger.

Users install the published CLI from npm with:

```sh
npm install --global hookledger
```

## Local Verification

- Run `npm install` from a clean checkout.
- Run `npm run release:check` when available.
- Run `npm run package:smoke` to assert the packed file list and execute the installed artifact.
- Run the documented CLI smoke command from the README.

## Package Contents

Confirm the package includes:

- runtime CLI or library files
- README.md
- LICENSE
- SECURITY.md
- SUPPORT.md
- RELEASE_NOTES.md or CHANGELOG.md
- examples, fixtures, or docs required by the README

## Public Readiness

- README quickstart matches the current binary name.
- Release notes call out breaking changes or explicitly state that there are none.
- Security and support docs give users a clear place to report issues.
- CI is green on the release branch.
- The npm package has a trusted publisher configured for GitHub Actions with
  owner `rogerchappel`, repository `hookledger`, and workflow `release.yml`.
  The release workflow uses npm OIDC authentication and does not require an
  `NPM_TOKEN` repository secret.
