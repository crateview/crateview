# Implementation Plan: Monorepo Dependency Maintenance

**Branch**: `70-update-monorepo-dependencies` | **Spec**: [spec.md](spec.md)

## Technical context

- Node 26.13.1 from `.nvmrc`; npm lockfiles are owned by Registry UI, its account service, and the website.
- Existing CI runs type checks, lint, formatting, unit and integration tests, and production builds.
- The Spec Kit constitution is an uncustomized template; follow `docs/coding-guidelines.md` and the existing CI and release rules.

## Design

Land supported dependency updates via their existing PRs where possible. Require CI against current `main`. Identical or superseded diffs need no divergent merges. Put any compatibility work required by the queue on the linked branch. Keep the two apps' Changesets independent; record a patch only for a user-visible change.

Confirm the resolved versions and open alerts on `main` after merging. Do not use a downgrade or suppress a finding to clear an audit report. No storage or API contracts change.

If a supported picomatch release is still unavailable, install first-party hardened copies built from verified upstream tarballs. Disable repeated extglobs at compilation without changing other glob syntax. Keep original major-version compatibility, record the fork's distinct package identity, and use local tarballs so installs are hardened even with lifecycle scripts disabled. Remove the temporary fork once a compatible upstream release is available.

See [research.md](research.md), [quickstart.md](quickstart.md), and [tasks.md](tasks.md).
