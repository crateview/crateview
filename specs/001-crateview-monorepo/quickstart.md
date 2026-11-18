# Quickstart: Validate the Monorepo

Run these commands from the repository root **after implementation**, in a clean disposable checkout. Use Node from `.nvmrc`, npm, Docker with Compose, and Chromium for Playwright. No production credentials are needed for local checks.

## 1. Install, check, and run both apps

```bash
npm run setup
npm run check
npm run test
npm run build
```

In separate terminals:

```bash
npm run dev:registry-ui
npm run dev:website
```

Use the fixture registry described in the registry-ui README for meaningful registry reads. Both local URLs in the [contract](contracts/monorepo.md) must respond. No submodule init or additional repository clone should be required.

## 2. Validate existing integration and production images

```bash
docker build -t crateview-registry-ui:monorepo apps/registry-ui
docker build -f apps/website/Dockerfile -t crateview-website:monorepo .
docker compose -f apps/registry-ui/compose.yaml -f apps/registry-ui/compose.build.yaml config
docker compose -f apps/website/compose.yaml -f apps/website/compose.build.yaml config
npm --prefix apps/registry-ui run test:pwa:integration
npm --prefix apps/registry-ui run test:branding:integration
npm --prefix apps/registry-ui run test:monitoring:integration
npm --prefix apps/registry-ui run test:auth:integration -- --docker --browser
npm --prefix apps/registry-ui run test:auth:image -- crateview-registry-ui:monorepo
npm --prefix apps/website run test:e2e -- tests/e2e/versions.spec.ts
```

Install Playwright Chromium for each app's resolved version first and run the website suite against the built site using its Playwright config. Verify the production smoke matrix with disposable data and existing Compose overlays. Compare the docs route inventory against the pinned baseline: stable, archive series, locales, missing translations, sitemap, images and `next` exclusions.

## 3. Dry-run release, promotion and rollback

In an isolated checkout, use release/promotion fixture tests targeted by `npm run test`. Cover registry-only, website-only, both apps at the same numeric version, and a docs-only promotion. Simulate the same promotion twice and a failure before website deployment. Compare the ledger and archived content against the [model](data-model.md); require one resulting promotion, unchanged unrelated archives, and a stable live version that does not move on failure.

Using a staging runner and read-only checks where possible, verify the old tagged images by digest, repository redirects, required checks, and GHCR workflow repository access. Confirm an anonymous registry image pull succeeds, while the website image requires authorized credentials. Exercise rollback by pinning the recorded website digest in staging with auto-updates disabled and verify its docs routes. Do not publish to production tags, rename the repository, or deploy to production as part of this guide.

Dry-run legacy cleanup against the inventory. Ensure tags and digests still deployed, documented, supported or retained for rollback (including shared manifests) are excluded. Actual deletion requires an approved artifact list and an expired rollback window.
