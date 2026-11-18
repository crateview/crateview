---
description: 'Implementation and acceptance tasks for Website Release Identity'
---

# Tasks: Website Release Identity

**Input**: [Specification](spec.md), [plan](plan.md), [research](research.md), [data model](data-model.md), [contracts](contracts/website-release-identity.md), and [quickstart](quickstart.md).

## Phase 1: Setup

Use the selected worktree, linked issue branch and existing Node/npm setup. No repository setup increment.

## Phase 2: Foundation

No shared infrastructure changes. Verify the feature pointer and issue checklist before implementation.

## Phase 3: User Story 1 - Identify the Running Website Version (P1, MVP)

- [X] T001 [P] [US1] Add a focused failing SSR/browser regression in `apps/website/tests/e2e/website.spec.ts`, then expose the exact `apps/website/package.json` version at build time in `apps/website/nuxt.config.ts` and render it once with a single `v` prefix and isolated text direction in `apps/website/app/layouts/default.vue`.

**Independent acceptance (FR-001, FR-002, SC-001)**: The production homepage and localized documentation footer, including a narrow RTL page, show the correct website version; existing footer links remain usable. Run focused Playwright, lint, format, typecheck and website build before the T001 commit.

## Phase 4: User Story 2 - Find the Website Package (P1)

- [X] T002 [P] [US2] Add `org.opencontainers.image.source=https://github.com/crateview/crateview` to the final stage of `apps/website/Dockerfile`; run the release-script tests and verify the label by building and inspecting a local image, without publishing.
- [ ] T003 [US2] After separate hosted-change approval, have a package admin relink the existing `ghcr.io/crateview/website` in place using `specs/003-website-release-identity/quickstart.md`; inventory and preserve its private visibility, effective access, image tags and digests. Confirm the actual listing in `crateview/crateview`; do not change access or publish for verification without separate approval. Record hosted evidence in the issue, not an empty commit.

**Independent acceptance (FR-003, FR-004, SC-002, SC-003)**: Local image reports the canonical source; an authorized user can find the same private package in the monorepo; existing tagged digests and authorized pulls are unchanged. Track publisher access and the previous `403` explicitly.

## Final Phase: Feature-Wide Validation and Release Metadata

- [X] T004 Complete code-side checks in `specs/003-website-release-identity/quickstart.md` and record their results and any pending hosted evidence. Use the app-local Changesets CLI to create and separately commit one patch changeset under `apps/website/.changeset/` for the two code increments. Do not run version, release, publish, or deploy commands.

## Dependencies & Execution Order

- T001 and T002 touch disjoint source paths. Their local checks can overlap, but commit each completed increment separately; use T001 then T002 in this worktree.
- T004 follows T001 and T002. T003 requires an admin, separate approval, and verified access prerequisites; it does not block creating a draft PR. If still outstanding, state that explicitly and keep the PR draft per the delivery workflow.
- Start with T001 for a usable MVP. The package branch of acceptance remains independent of footer verification.
