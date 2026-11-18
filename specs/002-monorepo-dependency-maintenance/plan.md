# Implementation Plan: Monorepo Dependency Maintenance

**Branch**: `70-update-monorepo-dependencies` | **Spec**: [spec.md](spec.md)

## Technical context

- Node 26.13.1 from `.nvmrc`; npm lockfiles are owned by Registry UI, its account service, and the website.
- Existing CI runs type checks, lint, formatting, unit and integration tests, and production builds.
- The Spec Kit constitution is an uncustomized template; follow `docs/coding-guidelines.md` and the existing CI and release rules.

## Design

Land supported dependency updates via their existing PRs where possible. Require CI against current `main`. Identical or superseded diffs need no divergent merges. Put any compatibility work required by the queue on the linked branch. Keep the two apps' Changesets independent; record a patch only for a user-visible change.

Confirm the resolved versions and open alerts on `main` after merging. Do not use a downgrade or suppress a finding to clear an audit report. No storage or API contracts change.

If a supported picomatch release is still unavailable, patch each npm-installed copy before Nuxt preparation and production builds, including Docker builds. Reject repeated extglobs at compilation instead of generating the associated unbounded regular expressions. Preserve other glob syntax and standard upstream package resolution. Remove the patch when upgrading to a supported upstream fix.

See [research.md](research.md), [quickstart.md](quickstart.md), and [tasks.md](tasks.md).
