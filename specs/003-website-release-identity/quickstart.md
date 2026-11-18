# Validation: Website Release Identity

Use the repository's `.nvmrc` Node version, npm, Chromium for Playwright, and a local Docker daemon. Nothing in the local checks publishes an image.

## Website

From `apps/website`:

```bash
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm exec -- playwright install chromium
npm run test:e2e -- tests/e2e/website.spec.ts
```

Expect the production SSR and browser checks to match the manifest version. Inspect the shared footer on desktop and a narrow localized/RTL route for readable version text and undisturbed links. Run the full website Playwright suite before marking the PR ready. If applicable, separate browser evidence from package checks.

## Image

From the repository root:

```bash
node --test scripts/*.test.mjs
docker build -f apps/website/Dockerfile -t crateview-website:release-identity .
docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.source"}}' crateview-website:release-identity
```

Expect `https://github.com/crateview/crateview`. No tag or image is pushed.

## Hosted package

With an authorized account, verify before and after the separately approved settings change:

```bash
gh api orgs/crateview/packages/container/website --jq '{repository: .repository.full_name, visibility}'
```

Expect `crateview/crateview` and `private` after relinking. Check the repository Packages listing, compare the recorded version/tag/digest inventory, and verify a pull with the deployment's existing credentials and the monorepo's publisher grant. A token read probe does not prove write access; record write evidence from a separately approved check or the next normal release. Do not change visibility or trigger a deployment to obtain evidence. If access degrades, stop release activity and restore the prior association and grants with the package admin before continuing.
