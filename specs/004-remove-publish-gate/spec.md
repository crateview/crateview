# Feature Specification: Remove Release Publishing Gate

**Feature Branch**: `79-remove-release-publishing-gate`\
**Created**: 2026-11-18\
**Status**: Draft\
**Input**: Remove the release enablement variable so pending changesets always produce version PRs on the default branch after CI succeeds.

## User Scenarios & Testing

### User Story 1 - Receive version PRs without setup (Priority: P1)

As a maintainer, I want each app's pending changesets to produce a version PR without configuring an enablement switch.

**Why this priority**: Missing repository configuration must not delay release preparation.

**Independent Test**: Simulate a successful default-branch release run with pending changes for one app and no enablement variable.

**Acceptance Scenarios**:

1. **Given** only one app has pending changes, **When** the current default branch passes CI and release automation runs, **Then** it creates or updates only that app's version PR.
2. **Given** both apps have pending changes, **When** the release run succeeds, **Then** each app has its own version PR for manual review and merge.

### User Story 2 - Use normal release safeguards (Priority: P2)

As a release operator, I want publishing and documentation promotion to proceed under their existing safeguards without a separate enablement switch.

**Why this priority**: A version PR alone should not result in publishing an unapproved version.

**Independent Test**: Simulate an eligible post-merge release and an ineligible run without configuration.

**Acceptance Scenarios**:

1. **Given** an eligible version and successful verification, **When** the current default branch is processed, **Then** existing publication and promotion eligibility rules apply.
2. **Given** a run outside the default branch, **When** automation is invoked, **Then** no version PR, release, or promotion is written.

### Edge Cases

- No pending changes means no version PR; an app may still qualify for normal publication.
- A stale default-branch run or failed verification must not bypass existing safeguards.

## Requirements

### Functional Requirements

- **FR-001**: Version PR creation and updates MUST work without `CRATEVIEW_MONOREPO_PUBLISH` for both release streams.
- **FR-002**: Publishing and docs promotion MUST NOT depend on that variable.
- **FR-003**: Default-branch restrictions, verification, independent release streams, publication eligibility, artifact checks, serialization, and manual version PR merges MUST remain in place.

## Success Criteria

### Measurable Outcomes

- **SC-001**: With no enablement switch, one pending app produces one version PR; two pending apps produce two.
- **SC-002**: An off-branch run produces zero release writes, and a failed artifact check produces zero release or promotion writes for that artifact.

## Assumptions

- Keep existing schedules, changeset locations, and PR naming.
- Removing the variable from repository settings or running a production release is not needed to verify the code change.
