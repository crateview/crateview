# Tasks: Run Registry Garbage Collection

**Input**: [Specification](spec.md), [plan](plan.md), [research](research.md), [data model](data-model.md), [contract](contracts/garbage-collection.md), and [validation guide](quickstart.md).

## Phase 1: Setup

Reuse the existing application, auth fixtures, and CI. No new project or setup commit.

## Phase 2: Foundation

- [ ] T001 Implement the default-off job adapter, dedicated exact-match operator allowlist, and shared request/status validation in `apps/registry-ui/nuxt.config.ts`, `apps/registry-ui/shared/garbage-collection.ts`, and `apps/registry-ui/server/utils/garbage-collection.ts`. Add focused tests in `apps/registry-ui/tests/garbage-collection-provider.test.ts` and document the credentials, binding, and setup in `apps/registry-ui/README.md`.

**Acceptance**: Disabled, malformed, or unauthorized configuration fails closed. The adapter sends requests only to the configured HTTPS origin and fixed path, with bounded timeouts and redirects disabled. Cover `revision` as an opaque bounded non-empty token; `run` as `null` or `{ id, state }`, with opaque bounded `id` and `state` restricted to `running`, `succeeded`, or `failed`. Keep credentials and raw provider errors out of client results. Run focused Vitest, lint, format, and type checks.

## Phase 3: User Story 1 — Run registry maintenance (P1, MVP)

**Independent test**: An authorized operator confirms a run from Settings, reloads, and sees the provider's eventual result without starting a second run.

- [ ] T002 [US1] Implement protected start/status routes in `apps/registry-ui/server/api/registry/garbage-collection.get.ts` and `apps/registry-ui/server/api/registry/garbage-collection.post.ts`, exclude them from offline caching in `apps/registry-ui/server/utils/pwa-offline.ts` and the owning service-worker code, add real HTTP contract coverage with a local fake adapter in `apps/registry-ui/tests/garbage-collection-api-integration.mjs`, and document status/failure semantics in `docs/en/docs/next/operations.md`.

  **Acceptance**: Revalidate managed identity, apply `no-store` on success and errors, require same-origin POST, and accept strict `{ revision }` with no caller-supplied execution parameters. Denials and malformed input never contact the adapter. Verify response/error mappings, `202` distinct from completion, `409` after stale/duplicate admission, no automatic retries, unavailable/malformed provider responses, and offline no-cache behavior. Run the local HTTP integration plus applicable PWA and project checks.

- [ ] T003 [US1] Implement the maintenance panel, confirmation, and status recovery in `apps/registry-ui/app/pages/settings.vue` and `apps/registry-ui/app/components/GarbageCollectionPanel.vue`, add messages in all `apps/registry-ui/i18n/locales/*.json`, add Playwright coverage in `apps/registry-ui/tests/garbage-collection.spec.ts`, and document the operator journey in `docs/en/docs/next/operations.md`.

  **Acceptance**: No start button when disabled or unauthorized; cancel sends no POST. Confirmation explains registry scope and write interruption. Pending and active states block starting. Refresh resumes status reads; transport uncertainty is not success and never causes another POST. Verify success/failure/unknown, keyboard focus and announcements, narrow/wide layouts, English/German, and key coverage across locales. Run targeted Playwright plus project checks.

## Final Phase: Feature-wide Verification

Run the [validation guide](quickstart.md) after T003, including a disposable job and registry, preserved referenced content, write protection, and restoration. Report unavailable evidence separately; a fake adapter does not verify Distribution write coordination. Apply the API contract and Vue acceptance checks, confirm manifest deletion is unchanged, and add one registry UI Changesets entry in `apps/registry-ui/.changeset/` in a separate commit only after feature-wide checks pass.

## Dependencies & Execution Order

`T001 → T002 → T003 → feature-wide verification`. No implementation tasks are independent: the UI uses the finalized routes and the routes use the validated adapter. Browser evidence and the disposable storage verification can be collected independently once T003 passes.

## Implementation Strategy

Keep each task's code, tests, and documentation in one validated commit. MVP ends with the authorized button and authoritative run status. Do not add a bundled runner, scheduler, dry run, or history.
