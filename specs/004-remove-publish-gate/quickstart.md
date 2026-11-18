# Validation: Remove Release Publishing Gate

Use the Node version from `.nvmrc`. Run `node --test scripts/*.test.mjs scripts/checks/*.test.mjs` from the repository root.

- With pending changes and no enablement environment variable, stub tests must verify creation or update of the expected app PRs, with separate PRs when both apps are pending.
- Off-branch and stale-head runs must not write release state. Eligible no-changes runs must retain publication behavior; incorrect image revisions must still stop publication.
- Review both workflow conditions and confirm release still depends on CI. Check that no workflow or release script references the retired variable.
- Run applicable repository checks and `git diff --check`. Do not dispatch a live workflow to validate this change.
