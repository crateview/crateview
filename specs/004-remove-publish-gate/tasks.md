# Tasks: Remove Release Publishing Gate

## Format and Paths

Tasks use repository-relative paths and execute in order. Validate and commit each increment separately.

## Setup and Foundation

No additional setup or dependencies; reuse the existing workflow and test harness.

## User Story 1: Receive Version PRs Without Setup

**Independent test**: On current `main` without the variable, one pending app produces one version PR, and two pending apps produce two. Off-branch and stale runs create none.

- [X] T001 [US1] Remove the release gate from `.github/workflows/release.yml`, `scripts/release.mjs`, and `scripts/release-plan.mjs`; update `scripts/release-plan.test.mjs` and extend `scripts/release-dry-run.test.mjs` for independent app PRs, off-branch or stale runs, and preserved image verification. Keep CI and existing publication eligibility.

## User Story 2: Use Normal Release Safeguards

**Independent test**: Docs promotion runs on `main` without a variable, and only an eligible pinned release can produce a promotion PR.

- [ ] T002 [US2] Remove the variable from `.github/workflows/promote-docs.yml` without changing eligibility, revision verification, or branch checks; update `docs/monorepo-migration.md` and run `scripts/docs-publication.test.mjs` to verify that promotion still creates the website patch changeset. Direct docs edits without a changeset remain outside this scope.

## Cross-Cutting Verification

- [ ] T003 Run and record the checks in `specs/004-remove-publish-gate/quickstart.md`; apply the repo's Changesets policy without introducing an artificial application version bump.

## Dependencies and Strategy

T001 → T002 → T003. T001 is the version-PR MVP. Unit and integration checks can run independently after their implementation is complete. Do not run live publishing.
