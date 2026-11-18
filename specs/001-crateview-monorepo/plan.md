# Implementation Plan: Crateview Monorepo

**Branch**: `60-consolidate-crateview-into-a-monorepo` | **Base**: `main` | **Spec Kit feature**: `001-crateview-monorepo`.

**Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

## Summary

Rename `crateview/registry-ui` in place to `crateview/crateview`. Move registry-ui into `apps/registry-ui`, import the existing website into `apps/website`, and import the docs pinned by the website into root `docs/`. Preserve the deployment and release contracts while removing the website's dependency on the docs submodule.

## Technical Context

- **Language/version**: TypeScript and JavaScript, Node 26.13.1, existing Nuxt 4, Vue and app-local npm dependency graphs.
- **Primary dependencies**: Nuxt UI, Nuxt Content (website), npm, Changesets, GitHub Actions, Docker and Compose.
- **Storage**: Root Markdown and version metadata; no runtime database or volume migration. Preserve registry and account-service mounts and paths.
- **Testing**: Existing ESLint, Prettier, typecheck, Vitest, Playwright and distribution/auth/PWA/branding/image integration checks; add release and docs cutover dry runs.
- **Target platform**: Existing Linux container deployments and local Node development.
- **Project type and scope**: Two deployable Nuxt apps, one root docs tree, no new shared runtime package or public API.
- **Performance goals and constraints**: Preserve existing build/run isolation and production behavior. Keep website port 3002 for local dev and registry-ui port 3000. Keep independently deployable images and use no extra repositories for ordinary builds.

## Constitution Check

**Pre-research: pass.** `.specify/memory/constitution.md` is an unratified template, so it defines no enforceable gates. Apply the repository's existing coding guidelines, CI, Changesets and compatibility contracts as working constraints; no constitution amendment is in scope.

**Post-design: pass.** The design retains app-local lint/format/type validation, supported locales, registry/API behavior, and Changesets review gates. Path changes get clean-install, runtime and release validation; no rules or CI checks are weakened. Hosted permissions and cutover are implementation acceptance gates, not planning claims.

## Project Structure

### Planning artifacts

`specs/001-crateview-monorepo/` contains this plan, the spec, [research](research.md), [data model](data-model.md), [contracts](contracts/monorepo.md) and [quickstart](quickstart.md). Task generation is a separate phase.

### Target repository

```text
crateview/
├── .github/                 # CI/release, issue templates, Dependabot
├── apps/
│   ├── registry-ui/         # Nuxt, auth/, Compose, Docker, tests, release metadata
│   └── website/             # Nuxt, public assets, tests, approved deployment templates
├── docs/                    # locales, versions.json, publication ledger, release templates
├── .specify/
├── specs/
├── .nvmrc
├── package.json             # private, dependency-free command entry point
├── README.md
├── LICENSE
└── SECURITY.md
```

**Structure decision**: Borrow Repovio's app/docs boundaries, not its pnpm/Nx tooling. Preserve app-owned npm locks and configuration. Retain the existing root `docs/coding-guidelines.md` and `docs/feature-matrix.md` alongside imported product docs; do not expose them unintentionally through the website.

## Implementation Sequence

1. **Establish baseline and review visibility.** Record source SHAs, website gitlink, release tags, live docs routes, image digests, required checks, GHCR grants and deployment ownership. Capture registry/website checks before moving files. The target stays public; obtain explicit owner approval for the exact website import list before adding website content to the target checkout. Scan for credentials and private operational material; exclude sensitive files or replace them with public-safe templates without changing deployment inputs. Refresh pins at the cutover freeze; flag any divergence between docs HEAD and the published gitlink.
2. **Move and import.** Use tracked moves for registry-ui; bring in the pinned website tree and docs tree without `.git`, submodule metadata, nested `.github` automation, or generated outputs. Preserve source/license attribution in root docs. Retain app-local configs, locks, changelogs, vendor patches and runtime-relative paths. Add root npm delegation and contributor guide; keep existing repo governance files at root.
3. **Reconnect builds and docs.** Point Nuxt Content's collection sources and version/test loaders to root `docs/`. Keep registry Docker context app-local; use root context plus an explicit website Dockerfile for the website. Update Compose and CI to match; use narrow copies and ignore build outputs, VCS files and secrets. Preserve screenshot/public URLs, existing version aliases, locale fallbacks and production exclusion of `next`. Exercise registry external auth and its integrated image/CLI in production-like containers.
4. **Reconnect release and promotion.** Keep independent Changesets state and app-specific release PRs. Preserve registry Git tags and the registry latest-release feed; use distinct website Git tags while keeping both pre-existing image names. Seed release state from both baselines so existing versions are not republished. Update packaging, Dependabot and source links. Replace cross-repo dispatch with durable same-repo promotion receipts pinned to the verified registry tag and image digest; retain scheduled reconciliation and reconcile outstanding legacy receipts at handoff. Stage docs, captures, the publication record and a website Changeset in one reviewed promotion PR. Serialize promotions and website version writes, reject conflicting inputs, and make retries resume the intended website version. Verify docs on a staged image before promoting `latest`.
5. **Cut over with approval.** Stage and verify without pushing production tags; freeze legacy publishers before enabling new ones. Rename the registry repo in place, update remotes and integrations, verify redirects, required checks and GHCR access (registry image public, website image private). Resume one writer per stream only after verification. Advancing the website's `latest` tag is a production action and needs operator approval. Leave legacy repos available; pause their publishing, not their history.
6. **Retire unused legacy images separately.** Rebuild both images from the monorepo and publish new versions to the existing GHCR packages. Set an operator-approved rollback window before cutover. Once it closes, inventory deployed and documented references, protected release tags, and shared manifests; propose an exact list of unused legacy tags/digests. Require separate approval before deletion and verify retained pulls afterward. Do not delete either package or overwrite historical version tags.

## Rollback and Stop Conditions

- Stop on incompatible URLs, content, runtime inputs, image identity, permissions, or incorrect tag/version decisions. Do not merge a broken release PR or silently skip a pending docs promotion.
- Disable new writers before restoring a previous one. Pin and redeploy the known-good website digest. Restore the registry frontend separately without touching volumes if needed. Reconcile promotion receipts and the ledger before restoring legacy ownership. Do not force-push, delete published tags, or repoint historical image digests. Reverse the repo rename only if needed and approved.
- Phase 1 ends at design. Repo rename, release publication and deployment are not performed by planning.
