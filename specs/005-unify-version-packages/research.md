# Research: Unify Version Packages

- Use the official Changesets [version action](https://github.com/changesets/action/tree/v2.1.2/version) pinned to its verified commit. It manages `changeset-release/main` and defaults to `Version Packages`. Its default PR text describes npm publishing, so ensure maintainer-facing documentation states the actual Docker release behavior.
- Preserve app-local npm installs and lockfiles because they are consumed by app-specific Docker and CI builds. Validate a targeted package-discovery manifest understood by both CLI and action, rather than changing dependency hoisting and Docker build contexts. If discovery or lockfile updates require a broader package-manager migration, stop and review scope before proceeding.
- Capture promoted docs receipt names from unconsumed root changesets before versioning; assign the actual website version after versioning. Do not infer receipt tags from unrelated website entries.
- Compare version-branch heads before dispatching CI so scheduled retries do not repeatedly start checks for an unchanged PR. Verify stale builds cannot become the source of a container release.
