# Phase 0 Research: Crateview Monorepo

## Reference and checkout layout

- **Decision**: Use the `apps/` and root `docs/` convention from [Repovio](https://github.com/repovio/repovio/tree/6c630923e4b3e65670cfa675e522fac7a283041d). Rename the registry-ui GitHub repo in place; import pinned tracked trees without rewriting history.
- **Rationale**: Registry history, issue IDs, and releases remain at the canonical project. Existing website and docs histories remain available in their source repos. The website's gitlink, not docs HEAD by itself, defines the published baseline.
- **Alternatives considered**: New repo loses hosted history; merging unrelated full histories introduces conflicting tags and release identities for no immediate contributor benefit.

## Repository and package visibility

- **Decision**: Keep the renamed repo public, as selected during planning. Keep the website GHCR image private. Before importing, have the owner approve a reviewed website file list and scan the candidate tree for credentials and private operational material.
- **Rationale**: GitHub reports registry-ui and docs as public and website as private. Repository visibility and GHCR package visibility are separate; approving a public target for planning is not approval to push private source or deployment details.
- **Alternatives considered**: A private monorepo would preserve website source privacy but remove the current public access to registry source and hosted history. Keeping website private in a separate repository would not meet the single-checkout requirement.

## Node and development commands

- **Decision**: Keep per-app npm locks and the existing nested auth lock. A private, dependency-free root `package.json` delegates commands with `npm --prefix`; use the checked-in Node version `26.13.1` across CI and development.
- **Rationale**: Registry-ui and website have different Nuxt versions, npm root overrides, local `file:` dependencies, and app-specific `postinstall` patches. Independent installs preserve resolution and Docker caching while giving contributors one entry point.
- **Alternatives considered**: npm workspaces with a shared lock require reconciling overrides and hoisting; Repovio's pnpm/Nx stack adds a tooling migration. Neither is required for two apps with no shared runtime packages.

## Content and provenance

- **Decision**: Vendor the pinned docs tree directly into `docs/`, preserving locale-relative paths, `versions.json`, and templates. Point the website's content ingestion and validation at that tree and keep served screenshots in `apps/website/public/images/docs/`. Pin future promotion inputs to the verified registry Git tag, including its `docs/` tree. Keep legacy publication records readable.
- **Rationale**: The current website excludes `next` from public content/sitemap/screenshots; previous series and locales must keep their route behavior. The current `v0.8.2` publication links registry, docs and website versions; flattening the submodule must not erase that provenance.
- **Alternatives considered**: Keeping the submodule or mirroring content preserves split ownership; putting content inside the website violates root ownership; exposing a new public preview changes behavior.

## CI, releases and containers

- **Decision**: Run full CI initially with independent app jobs behind a stable required check. Keep Changesets and version calculation scoped to each app; serialize release-PR writes and give each app a distinct branch and title. Preserve registry Git tags `vX.Y.Z`, use `website-vX.Y.Z` for new website Git releases, and keep Docker version tags `vX.Y.Z` for both images.
- **Rationale**: Both existing releases already use Changesets and verify the image before tagging. `ghcr.io/${{ github.repository }}` would silently change registry-ui's image name after rename. Explicit image coordinates and verified Actions package access decouple Git hosting from operator config.
- **Alternatives considered**: Lockstep releases couple unrelated deployments; reusing unqualified Git tags risks collision; moving image coordinates breaks existing pulls and deploy definitions. Path-filtered CI can wait until CI cost warrants it.

## Rollout and recovery

- **Decision**: Verify both build paths and release/promotion dry runs before any hosted cutover. Freeze publishing briefly, refresh the final source pins, switch one writer per image and docs channel, then verify the first real release as an authorized operator action.
- **Rationale**: Source redirects do not prove package writes or deployment hooks work. Capture old image digests and workflow ownership before the switch; roll back by restoring workflow ownership and deploying a known-good digest, not by deleting tags or alternating concurrent publishers.
- **Alternatives considered**: Big-bang publication cannot isolate rename, package grants and content errors; immediately retiring old repos weakens rollback.

## Legacy image cleanup

- **Decision**: Keep both GHCR coordinates, replace the publishers with monorepo builds, and remove only individually approved, verified-unused legacy artifacts after the rollback window.
- **Rationale**: A digest can be shared by multiple tags; a legacy tag can still be deployed, documented or needed for rollback. Preserve deployed, supported and rollback references and leave uncertain artifacts intact.
- **Alternatives considered**: Deleting packages or replacing historical version tags breaks existing pulls and weakens recovery.
