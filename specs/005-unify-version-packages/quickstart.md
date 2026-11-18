# Validation: Unify Version Packages

Use the repository-pinned Node and clean locked installs. Run `node --test scripts/*.test.mjs scripts/checks/*.test.mjs` and `actionlint` on modified workflows.

1. Compare moved entries to current `main`, including the duplicate basename. Confirm the root tool discovers exactly registry UI and website.
2. In disposable fixtures, exercise no pending entries, either app only, and both apps. Check package versions, lockfiles, changelogs, and unchanged app data. Rehearse another changeset against an existing shared branch and confirm the same PR is updated.
3. Verify scheduled/off-branch/stale behavior, required CI dispatch, writer serialization, separate container tags and builds, and lack of npm publish.
4. Stage a promoted docs receipt, confirm the root website patch entry, and check that versioning writes the resulting website version to the correct ledger record. Run applicable build and dependency checks.
5. Check `git diff --check`. Do not merge or update any bot version PR or dispatch production release automation during validation.
