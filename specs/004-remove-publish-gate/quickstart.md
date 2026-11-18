# Validation: Remove Release Publishing Gate

Use the Node version from `.nvmrc`. Run `node --test scripts/*.test.mjs scripts/checks/*.test.mjs` from the repository root.

- With pending changes and no enablement environment variable, stub tests must verify creation or update of the expected app PRs, with separate PRs when both apps are pending.
- Off-branch and stale-head runs must not write release state. Eligible no-changes runs must retain publication behavior; incorrect image revisions must still stop publication.
- Review both workflow conditions and confirm release still depends on CI. Check that no workflow or release script references the retired variable.
- Run applicable repository checks and `git diff --check`. Do not dispatch a live workflow to validate this change.

## Results

- All 20 root script tests passed under Node 26.13.1 after reinstalling locked dependencies in a disposable repository snapshot. The first run against stale local dependencies had six dependency-check failures; none reproduced after reinstalling.
- `actionlint` passed for both changed workflows, and formatting passed for the changed scripts and workflows. The release job still depends on CI; `main` restrictions remain. No production workflow was dispatched.
- No changeset was added: no app package changed, and an empty app-local changeset would itself trigger a version PR.
