# Implementation Plan: Run Registry Garbage Collection

**Branch**: `74-add-a-button-to-run-registry-garbage-collection` (`origin/main` base `ebf37019c4ea28557bacdc3336b31672327364ba`) | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: `specs/003-registry-garbage-collection/spec.md`

## Summary

Add a registry-wide maintenance panel on Settings. Authorized operators explicitly confirm a start and see the existing maintenance job's status. Nitro proxies a small authenticated contract to an operator-configured HTTPS adapter; Crateview does not run the collector or control the storage.

## Technical Context

**Language/Version**: Node.js 26.13.1, TypeScript, Vue/Nuxt
**Primary Dependencies**: Existing Nitro/H3, Zod, Nuxt UI, and i18n; no new package required
**Storage**: No new Crateview persistence; the external job owns durable state and serialization
**Testing**: Vitest/local real HTTP route with fake provider, Playwright, and a disposable Distribution fixture for write safety
**Target Platform**: Crateview server and supported browser deployments
**Project Type**: Nuxt web application in a monorepo
**Performance Goals**: Bound the start/status HTTP requests; never hold a request open until collection completes
**Constraints**: Default off, authenticated operators only, no browser-specified targets or collector options
**Scale/Scope**: One configured registry and one maintenance adapter; no scheduler, history, or cancellation

## Constitution Check

No ratified principles are present in `.specify/memory/constitution.md`; use `docs/coding-guidelines.md`, CI, and the approved workflow as project gates. Pre-design and post-design review: reuse existing components, auth and validators; preserve `/v2/**` and manifest deletion behavior; add no storage, privileged container access, or dependencies. Validate the authorization and wire contracts and the localized Vue flow. No exceptions needed.

## Project Structure

```text
specs/003-registry-garbage-collection/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/garbage-collection.md
└── quickstart.md
```

```text
apps/registry-ui/
├── app/pages/settings.vue
├── app/components/             # Maintenance panel and confirmation
├── i18n/                       # Supported locale messages
├── nuxt.config.ts              # Private runtime configuration
├── server/api/registry/        # Start/status routes
├── server/utils/               # Authorization and provider adapter
├── shared/                     # Runtime schemas and response types
└── tests/                      # Route, provider, and browser coverage
docs/                           # Current operator configuration and operations guidance
```

**Structure Decision**: Keep maintenance separate from repository actions and monitoring. Use the existing managed authentication modes with a dedicated garbage collection allowlist. The provider owns the job; the UI must work when registry writes are blocked but `/v2/` authentication remains reachable. If an operator stops the registry instead, existing connection handling may block recovery until it returns.

## Delivery and Validation

- Reuse `DeleteManifestsDialog.vue` for confirmation interaction patterns and `home.vue` for status polling and cleanup patterns, without taking a dependency on monitoring.
- No compatible adapter was identified in the repository. The contract is a proposed integration boundary, not a claim that a deployed job already implements it.
- GitHub base: `main`; selected checkout: `/tmp/opencode/crateview-garbage-collection`, detached for initial planning, then switched to the branch linked to [issue #74](https://github.com/crateview/crateview/issues/74). Keep the original Picomatch checkout untouched.
- After task approval, use separate issue/branch and implementation approvals. Under the Spec Kit workflow, add one registry UI Changesets entry after feature-wide validation; no website release entry unless independently warranted.
- Verify runtime request and response schemas, authorization, stale/concurrent starts, unreliable responses, and PWA no-cache behavior. Check the Vue flow with keyboard and responsive/localized Playwright cases. Validate operator prerequisites in a disposable integration fixture, not against a live registry.
