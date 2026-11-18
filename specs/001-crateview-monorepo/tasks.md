# Tasks: Crateview Monorepo

**Input**: [Spec](spec.md), [plan](plan.md), [research](research.md), [data model](data-model.md), [contracts](contracts/monorepo.md), [quickstart](quickstart.md).

**Format**: Sequential ID, optional `[P]` for independent work, story label for story tasks. Tests and documentation travel with each increment. Commit each completed, verified task separately; add feature Changesets after feature-wide checks. No task authorizes a hosted rename or production release.

## Phase 1: Setup

- [X] T001 Record current local CI checks, canonical source revisions and gitlink, release baselines, docs route inventory, and rollback prerequisites in `docs/monorepo-migration.md`; keep actual private operations data in the restricted operator record. Verify the website gitlink against the intended published docs baseline.

## Phase 2: Foundational

- [X] T002 Gate the import in `docs/monorepo-migration.md`: review and scan the exact website tracked-file allowlist privately, verify licensing, and obtain explicit owner approval before copying website files into the public target checkout. Record only publicly safe evidence and exclusions; stop if the import is not approved.

## Phase 3: US1 — Contribute from one checkout (P1)

**Independent test**: Follow the root README in a clean clone, check/build/run both apps without submodules, and validate a local unpublished docs edit without exposing it publicly.

- [X] T003 [US1] Move registry source and app-local npm, auth, Docker, Compose, tests, scripts and tooling into `apps/registry-ui/`; update `.github/workflows/ci.yml`, `.github/workflows/release.yml` and root `README.md` in the same increment so existing required checks and release command paths still resolve. Verify fresh installs, registry tests and an app-context image build.
- [ ] T004 [US1] Import approved website files into `apps/website/` and pinned docs into `docs/` with source attribution in `docs/monorepo-migration.md`. Wire `apps/website/content.config.ts`, `apps/website/shared/docs.ts`, `apps/website/tests/` and `apps/website/Dockerfile` to root docs without requiring the submodule. Preserve `next` exclusions and use a narrow root Docker context. Run website format/lint/types/unit/build and version-route checks.
- [ ] T005 [US1] Add dependency-free root orchestration in `package.json`, `.nvmrc` and `README.md` and both app checks in `.github/workflows/ci.yml`. Keep app-local locks and stable required check names. Validate `npm run setup`, `check`, `test`, `build`, and both loopback dev entry points from the root. Confirm exactly two deployable app IDs and no new npm publish target.

## Phase 4: US2 — Keep existing deployments working (P1)

**Independent test**: Build and smoke-test both images, validate existing Compose inputs and persisted registry/auth data, and dry-run releases for both apps at the same numeric version.

- [ ] T006 [P] [US2] Align build and operator paths in `apps/registry-ui/compose*.yaml`, `apps/website/compose*.yaml`, `apps/website/Dockerfile.dockerignore` and app READMEs. Preserve external/integrated auth, runtime users, volumes, image and environment behavior. Prove production-image bootstrap, Docker access and registry monitoring/PWA/branding integrations; test website candidate with public-safe deployment inputs.
- [ ] T007 [P] [US2] Implement independent release selection in `.github/workflows/release.yml` with Changesets state under `apps/registry-ui/.changeset/` and `apps/website/.changeset/`; update `.github/dependabot.yml` and app manifests. Give each Changesets PR its own branch/title, serialize writes, seed both release baselines, and check the image before tagging. Keep explicit `ghcr.io/crateview/registry-ui` and `ghcr.io/crateview/website` and Docker `vX.Y.Z`; use registry Git `vX.Y.Z` and website Git `website-vX.Y.Z`. Dry-run registry-only, website-only and equal-version cases; verify no publication of baseline versions and no required-check regressions.
- [ ] T008 [US2] Update canonical repo, release feed and edit links in `apps/website/server/utils/releases.ts`, `apps/website/app/pages/docs/`, `README.md` and `SECURITY.md` for `crateview/crateview`. Exclude website releases from the registry latest-release feed and verify the expected registry notes and links with a fixture.

## Phase 5: US3 — Keep versioned documentation available (P2)

**Independent test**: Compare published routes against the baseline and dry-run a pinned registry promotion twice, including failure before website deployment.

- [ ] T009 [US3] Consolidate the legacy ledger into `docs/publications.json` and switch `apps/registry-ui/scripts/request-docs-promotion.mjs` plus `apps/website/scripts/select-docs-release.mjs` to versioned same-repo receipts pinned to registry tag, commit and verified image digest. Preserve legacy provenance; verify one publication per registry tag, identical retry no-op, conflicting input failure, baseline skip and oldest eligible recovery.
- [ ] T010 [US3] Wire `apps/website/scripts/promote-docs.mjs`, capture tools and `.github/workflows/promote-docs.yml` to stage root docs, website captures, ledger and a website Changeset in one reviewed PR. Serialize with website version writes, keep scheduled reconciliation, and retry against the intended version rather than current `main`. Verify exactly one stable series, unchanged unrelated archives and historical ledger entries, preserved locale fallback and slug coverage, prior live site on failure, and no website-only release triggering registry promotion.
- [ ] T011 [US3] Extend `apps/website/tests/e2e/versions.spec.ts` and docs fixture validation for full baseline locale/version/slug coverage, canonical URLs, screenshots, sitemap/robots and `next` 404s. Run against the staged production build; ensure docs and captures ship together.

## Phase 6: Polish and cross-cutting validation

- [ ] T012 Run `specs/001-crateview-monorepo/quickstart.md` from a fresh checkout and record evidence in `docs/monorepo-migration.md`. Rehearse prior-digest rollback with website auto-updates paused. Document separately authorized handoff: reconcile legacy receipts, pause old writers, rename in place, update integrations, verify redirects/checks and GHCR permissions/visibility, and resume one writer per stream. Do not publish `latest`, rename, deploy or change hosted configuration in this task.
- [ ] T013 Add the reviewed feature Changesets metadata in `apps/registry-ui/.changeset/` and `apps/website/.changeset/` as applicable after T012; verify both app scopes and bumps against the actual release plan without running version, release or publish commands.

### Post-cutover follow-up (separately authorized)

- [ ] T014 Follow the retention runbook in `docs/monorepo-migration.md` after both monorepo images are live and the approved rollback window has closed. Inventory deployed, documented, supported and rollback tags/digests; resolve shared manifests and leave uncertain artifacts intact. Obtain separate approval for the exact unused legacy artifacts before removing them; verify retained pulls after cleanup. Do not remove either GHCR package.

## Dependencies & Execution Order

- T001 → T002 → T003 → T004 → T005. T002 is an explicit approval gate, not a task an agent can self-approve.
- T006 and T007 depend on T005. T008 depends on T007. T009 depends on T004 and T007; T010 follows T009; T011 follows T010 and T008.
- T012 joins T006 and T011; T013 follows verified integration. Hosted cutover requires separate operator authorization after review. T014 follows successful cutover and the rollback window; it does not block the implementation PR and must not run during implementation.

## Parallel Examples

- **US1**: After T005, run app-local validation for both apps independently in separate processes.
- **US2**: T006 owns Compose, Docker ignore and app docs; T007 owns the release/tooling configuration. Keep T007's checks fixture-only.
- **US3**: After T010, run the successful/retry promotion fixtures against disposable data while the built-site route checks run against a fixed staged image.

## Implementation Strategy

The MVP is both apps and docs working from one checkout with unchanged live publishers. Next prove deployment and release compatibility, then prove docs promotion and rollback. Do not enable production writers or update website `latest` as an implementation side effect.
