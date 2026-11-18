# Tasks: Unify Version Packages

## Format and Setup

Paths are repository-relative. Use the Node version in `.nvmrc`, npm, and the existing CI checks. No hosted release operations are part of validation.

## User Story 1: Review One Version PR

**Independent test**: No pending changes means no new PR; registry-only, website-only, and both-app changes use the same shared branch and bump only affected packages.

- [ ] T001 [US1] Add root Changesets tooling and discovery in `package.json` and its lockfile without changing existing app install semantics. In `.changeset/`, preserve all nine source entries and the two colliding basenames under distinct paths. In `scripts/version-packages.mjs` and its tests, version from root and refresh the lockfiles of changed apps only. Keep old production readers functional until T002.
- [ ] T002 [US1] Switch `.github/workflows/release.yml`, `scripts/release.mjs`, `scripts/release-plan.mjs`, and docs producers in `.github/workflows/promote-docs.yml` and `scripts/docs-publication.mjs` together to the root queue. Remove the old app queues from active use. Use the pinned official Changesets version action to maintain `changeset-release/main`, preserve CI and current-head safeguards, and verify no duplicate PR or npm publication.

## User Story 2: Preserve Independent Releases and Documentation

**Independent test**: Merged app versions use distinct Docker streams, and a promoted docs receipt records the bumped website version.

- [ ] T003 [US2] Integrate and test docs receipt version assignment in `scripts/version-packages.mjs` and `scripts/docs-publication.test.mjs`; verify release and image separation in `scripts/release-dry-run.test.mjs`, and update `docs/monorepo-migration.md` with the manual handoff and rollback constraints.

## Cross-Cutting Validation

- [ ] T004 Record results in `specs/005-unify-version-packages/quickstart.md`, including preserved pending-entry contents, required CI routing, workflow lint, and no production actions. Apply the Changesets policy without inventing a package version bump.

## Dependencies and Strategy

T001 → T002 → T003 → T004. T002 is the shared-PR MVP. Run distinct fixture, workflow lint, and Docker-routing checks in parallel when their changes are complete. Do not merge, close, or update an old version PR as part of this work.
