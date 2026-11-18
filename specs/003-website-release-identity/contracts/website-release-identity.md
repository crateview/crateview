# Contracts: Website Release Identity

## Website UI

The shared `<footer>` renders the built website version once as `v` followed by the manifest version. The server-rendered HTML and hydrated page agree. English, localized, and RTL layouts use identical version text; neither the visible value nor its direction depends on translated copy. Existing footer links and keyboard semantics are unchanged.

## Runtime container and GitHub package

- Runtime image source label: `org.opencontainers.image.source=https://github.com/crateview/crateview`.
- Package reference: `ghcr.io/crateview/website`; versioned tags, `latest`, and digest references retain their existing semantics.
- Hosted listing: GitHub identifies the package's associated repository as `crateview/crateview`, and an authorized user finds it under Packages. Visibility stays `private`; the existing authorized deployment and publisher retain access.
