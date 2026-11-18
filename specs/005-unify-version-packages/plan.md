# Implementation Plan: Unify Version Packages

**Checkout**: Original checkout on `83-unify-release-versioning-in-one-version-packages-pr`.\
**Date**: 2026-11-18\
**Spec**: [spec.md](spec.md)

## Summary

Migrate both app queues to root `.changeset/` and use the official Changesets v2 version action to maintain one `Version Packages` PR. Keep the container release pipeline separate and do not enable npm publishing.

## Technical Context

GitHub Actions, Node from `.nvmrc`, pinned Changesets CLI v3 and compatible version action. Keep existing npm app lockfiles, including auth, and existing Docker build contexts. Verify real Changesets behavior in disposable fixtures and test release routing with stubs.

## Constitution Check

The constitution is an unfilled template. Keep repository conventions, required CI, current-`main` checks, production-writer serialization, and manual release-PR approval. Post-design: no app runtime or public interface changes are needed.

## Project Structure

- Root `.changeset/`: move all nine pending entries without changing bump or text. Rename one of the two `crateview-monorepo.md` files to avoid overwrite. Keep app versions unlinked.
- Root `package.json`, lockfile, and package discovery: install a root-pinned Changesets CLI and register only the two release packages. Verify discovery works for both the CLI and action without changing app-local install semantics.
- `.github/workflows/release.yml`: use the pinned Changesets version sub-action on current `main` after CI, retain the shared writer lock, and dispatch existing CI for changes to `changeset-release/main`. Invoke container publication from the original `main` checkout, not the version branch.
- `scripts/release*.mjs`: remove app-specific version-PR code; keep publication and promotion behavior. The root version wrapper must update app lockfiles and promoted docs bookkeeping only for affected packages.
- `scripts/docs-publication*.mjs` and `.github/workflows/promote-docs.yml`: write and stage website patch entries in root `.changeset/`; preserve eligibility, captures, and ledger updates.

## Rollout and Rollback

Land the root layout and both reader/writer updates in the same reviewed PR. Before merge, refresh against current `main` and verify source changeset count and docs metadata. Existing version PRs #81 and #82 are not part of the migration and must stay unmerged; any manual cleanup is separate. If rollback is needed before the new PR merges, revert the coordinated layout and workflows; after it merges, inventory consumed entries and published versions before reverting so no version or tag is replayed.

See [research](research.md), [state model](data-model.md), and [validation](quickstart.md).
