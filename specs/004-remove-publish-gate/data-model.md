# Release Decision State

The release decision uses the source branch and current `main` revision plus app-local pending changes, manifest version, tags, and published releases. It no longer consumes an enablement setting.

- Off `main` or stale: no release writes.
- Pending changes: create or update the app's version PR; do not publish that stream in that run.
- No pending changes: apply existing baseline, tag, release, and image verification checks.
- Docs promotion independently checks for an eligible pinned registry release.
