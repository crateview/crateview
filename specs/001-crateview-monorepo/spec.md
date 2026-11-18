# Feature Specification: Crateview Monorepo

**Feature Branch**: `60-consolidate-crateview-into-a-monorepo`.
**Created**: 2026-11-18
**Status**: Draft
**Input**: Rename the existing registry-ui repository to `crateview` and organize it like Repovio: two apps, `registry-ui` and `website`, with docs at the repository root.

## User Scenarios & Testing

### User Story 1 - Contribute from one checkout (Priority: P1)

A contributor can find, run, and validate both existing apps and edit the public documentation from one checkout.

**Why this priority**: A single source of truth is the purpose of the migration.

**Independent Test**: Follow the root contributor guide from a fresh clone and build each app independently.

1. **Given** a clean checkout, **When** the contributor follows the root guide, **Then** both apps can be started and verified independently without another repository checkout.
2. **Given** an unpublished docs edit at the root, **When** the website's docs validation runs, **Then** it reads the edit without changing the public site or published snapshots.

### User Story 2 - Keep existing deployments working (Priority: P1)

An operator can continue running and updating registry-ui or the website without adopting a new image location, domain, authentication setup, or storage layout.

**Why this priority**: A repository move must not break deployments.

**Independent Test**: Build both production images and validate each against the existing operator-facing configuration; check previous published image references separately.

1. **Given** existing image references and persisted data, **When** an operator uses the corresponding post-migration build, **Then** the app starts and uses the same configuration and data paths.
2. **Given** the renamed repository, **When** users visit existing registry-ui issues or releases, **Then** the existing history remains available.

### User Story 3 - Keep versioned documentation available (Priority: P2)

A website reader can reach existing localized and versioned docs, and maintainers can promote the next verified registry-ui release without editing another repository.

**Why this priority**: Public links and release documentation must survive the migration.

**Independent Test**: Verify the existing URL inventory using a built site, then dry-run a new registry-ui release against a disposable checkout.

1. **Given** an existing stable or version-specific URL, **When** a reader opens it after cutover, **Then** it resolves to the same published content or preexisting fallback.
2. **Given** a verified registry-ui release, **When** promotion runs or retries, **Then** it promotes that release's pinned snapshot once and leaves earlier snapshots unchanged.

### Edge Cases

- Promotion fails after a registry image has been built: keep the previous published docs live and allow a retry without duplicating the version.
- Both apps reach the same numeric version: neither can overwrite the other's release or image.
- The old repo name redirects but a workflow or package is still tied to the old name: keep the previous deployment until permissions and new references are verified.
- A locale has no matching translation: preserve the existing locale fallback and URL behavior.

## Requirements

### Functional Requirements

- **FR-001**: Rename the existing GitHub repository in place to `crateview`, preserving registry-ui Git history, existing release tags, issues, and PRs.
- **FR-002**: House exactly two deployable apps under `apps/registry-ui` and `apps/website`, importing the current website rather than rebuilding it. The account service remains part of registry-ui.
- **FR-003**: Keep public documentation sources, locales, and version metadata under root `docs/`; the website must build from this repository without the former docs submodule or a separate checkout.
- **FR-004**: Provide a root onboarding guide and independent build, development, and verification commands; CI must check both apps, the docs build, and existing registry integrations.
- **FR-005**: Keep image coordinates, public URLs, deployment inputs, and existing registry/auth behavior compatible. Update source links and release automation for the renamed repository.
- **FR-006**: Keep independently versionable apps and preserve published docs history and release provenance; promotions must be repeatable and fail without changing the live stable docs.
- **FR-007**: Document a verified rollback to the previous deployment and publication source; do not delete, repurpose, or archive the legacy repos as part of this feature.
- **FR-008**: Keep the target repository public and the website image private. Import only explicitly approved website source and publicly safe configuration; private operational material and credentials must not enter the public repo.
- **FR-009**: Build both replacement images from the monorepo at the existing GHCR coordinates. After the rollback window, remove only explicitly approved legacy tags or digests proven unused; preserve supported historical pulls and retained rollback artifacts.

### Key Entities

- **App**: One independently built and deployed unit, with its own version.
- **Documentation snapshot**: A registry release's localized content, identifiable by its source revision; the public version series can advance to the latest patch.
- **Publication**: A version's association with a snapshot and its public visibility.

## Success Criteria

### Measurable Outcomes

- **SC-001**: One clean checkout can build and run both apps; zero additional source checkouts are required.
- **SC-002**: Both pre-cutover image coordinates and the full representative deployment smoke matrix still work; zero required changes to operator-owned configuration or persisted data.
- **SC-003**: The baseline public docs URL inventory retains its status/redirect and version semantics, including current stable, all published versions, and locale fallbacks.
- **SC-004**: Two runs for the same simulated registry release produce one publication and leave other version series unchanged; a simulated pre-publication failure leaves stable unchanged.
- **SC-005**: The renamed GitHub repo retains the baseline registry-ui tags/releases and issue/PR IDs.

## Assumptions

- Repovio is the repository layout reference, not a requirement to copy its package manager, orchestration, or framework.
- Legacy website/docs history remains available in the untouched source repos; import pinned tracked trees with source links, not a combined historical rewrite.
- No new UI features, auth or storage redesign, dependency upgrade, or production deployment is included in planning.
