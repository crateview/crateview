# Feature Specification: Website Release Identity

**Feature Branch**: `75-show-the-website-version-and-link-its-container-package`

**Created**: 2026-11-18

**Status**: Draft

**Input**: Show the Crateview website version in its footer, as on repovio.de, and list its existing container package under `crateview/crateview`.

## User Scenarios & Testing

### User Story 1 - Identify the running website version (Priority: P1)

A visitor can identify the website build by reading its footer.

**Independent Test**: Open the landing page and a localized documentation page from the same production build and compare their footer to the website's release version.

**Acceptance Scenarios**:

1. **Given** a website build at version `X.Y.Z`, **when** a visitor reads the shared footer, **then** it shows `vX.Y.Z`.
2. **Given** a localized page, including a right-to-left locale, **when** a visitor reads the footer on a narrow screen, **then** the version remains readable and the existing footer content remains usable.

### User Story 2 - Find the website package (Priority: P1)

A repository user with package access can find the existing website image under Packages in the Crateview monorepo.

**Independent Test**: Open `crateview/crateview` as an authorized user and verify that its Packages section links to the existing website package.

**Acceptance Scenarios**:

1. **Given** access to the existing private package, **when** the user opens the repository's Packages section after the association is changed, **then** the listed website package is `ghcr.io/crateview/website`.
2. **Given** a consumer already authorized to pull the image, **when** the repository association changes, **then** the consumer retains access using the same image reference and existing tags.

### Edge Cases

- A documentation or registry UI version may differ from the website version; neither is used as the footer value.
- A repository visitor without package access is not granted access by this feature.
- Image source metadata is not proof that the existing package association changed.

## Requirements

### Functional Requirements

- **FR-001**: The shared footer MUST show the running website build's own release version, prefixed with `v`, without a separate manually maintained display value.
- **FR-002**: The version MUST appear on pages using the shared footer, including localized pages, without introducing new translated copy or a release link.
- **FR-003**: The existing website image package MUST be associated with `crateview/crateview`, and subsequent website images MUST identify that repository as their source.
- **FR-004**: The package MUST retain its name, private visibility, existing tags, and access for current deployments and publishing automation.

### Key Entities

- **Website release**: The version of an independently built website, distinct from registry UI and documentation versions.
- **Website container package**: The existing private package containing website release images and their tags.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The same expected version appears exactly once in the shared footer on each tested landing and documentation route, including desktop and narrow localized layouts.
- **SC-002**: An authorized user sees the website package under Packages in `crateview/crateview`; GitHub reports that repository as its source and `private` as its visibility.
- **SC-003**: Existing tagged digests are unchanged by the reassociation; authorized pull and release-workflow access remain available.

## Assumptions

- Match Repovio's plain version display, not its version number or any unrelated footer design.
- Preserve package visibility. Making the package visible to anonymous visitors, changing deployments, and altering registry UI releases are out of scope.
