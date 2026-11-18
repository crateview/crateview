# Feature Specification: Unify Version Packages

**Feature Branch**: `83-unify-release-versioning-in-one-version-packages-pr`\
**Created**: 2026-11-18\
**Status**: Draft\
**Input**: Replace separate automated app version PRs with one standard Changesets Version Packages PR.

## User Scenarios & Testing

### User Story 1 - Review one version PR (Priority: P1)

As a maintainer, I want one automatically maintained version PR for the repository so I can review pending package versions together. Independently test zero, registry-only, website-only, and both-app pending changes, then add a changeset and verify the same PR is updated.

1. **Given** either app has pending changesets on current `main` and CI passes, **when** release automation runs, **then** it creates or updates one `Version Packages` PR including only affected apps.
2. **Given** both apps have pending changesets, **when** release automation runs, **then** the single PR versions both independently; it does not synchronize version numbers.

### User Story 2 - Preserve independent releases and documentation (Priority: P2)

As a release operator, I want each app's images, tags, and docs bookkeeping to retain their existing behavior. Independently test an eligible merged version for each app, including a promoted docs change.

1. **Given** the shared version PR is merged, **when** each revised version becomes eligible, **then** its own image and tag are released under existing safeguards.
2. **Given** an eligible docs promotion, **when** it is staged and subsequently versioned, **then** it requests a website patch and records the actual website version against the promoted registry release.

### Edge Cases

- No pending changesets create no version PR. Off-branch, stale, and failed-CI runs must not introduce release writes.
- The two existing version PRs are based on the old layout and must not be merged as part of this work. Source changesets on `main` are the migration input.

## Requirements

### Functional Requirements

- **FR-001**: Keep one shared changeset directory at repository root and preserve all pending entries, including identical basenames across the former directories.
- **FR-002**: Maintain at most one new-style version PR, use normal Changesets version calculation, and require manual merge.
- **FR-003**: Preserve app-specific semver, changelogs, image and tag names, release eligibility and verification, and docs publication records.
- **FR-004**: Stop generating per-app version PRs without modifying their existing hosted PRs or branches.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Zero pending app bumps yield zero version PRs; any nonzero set yields one new-style PR with exactly the affected app versions.
- **SC-002**: Migration preserves every pending entry and both app version baselines without publishing anything.
- **SC-003**: CI and release fixtures confirm unchanged image/tag separation and correct website version assignment for promoted docs.

## Assumptions

- Direct docs edits without website changesets remain outside scope.
- Hosted cleanup and live release execution are not validation steps.
