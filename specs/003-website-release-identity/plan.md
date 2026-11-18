# Implementation Plan: Website Release Identity

**Branch**: `75-show-the-website-version-and-link-its-container-package` from `origin/main` at `0b3e135`

**Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

## Summary

Use the website manifest's version at build time and render it as plain `vX.Y.Z` in the existing shared footer. Add the canonical OCI source label to the website runtime image. Reassociate the existing private GitHub package in Package settings separately from code delivery, after verifying access and obtaining approval for that hosted change.

## Technical Context

- **Language/Version**: TypeScript, Vue 3, Nuxt 4; npm and Node from `.nvmrc`.
- **Dependencies and platform**: Existing Nuxt UI layout, Nuxt i18n, and Linux Docker image on GitHub Container Registry.
- **Storage**: No application data changes; GitHub stores package association and permissions.
- **Testing**: Website formatting, lint, typecheck, Vitest, production build and Playwright; local Docker image inspection; read-only GitHub verification after the approved reassociation.
- **Performance**: No new requests, runtime services, or dependencies.
- **Constraints**: Preserve the existing package name, private visibility, permissions, tags, and deploy references. Leave the registry UI release, documentation versions, deploy configuration, and publish gates unchanged.

## Constitution Check

The installed constitution is a placeholder and defines no project-specific mandatory principles. Existing website lint/format configuration, CI, and [coding guidelines](../../docs/coding-guidelines.md) apply; preserve the website's local conventions without reformatting unrelated code. Check SSR, browser rendering, supported locales, and narrow/RTL layout per the Vue feature check. No API or database surface changes. Post-design check: the design adds no dependencies, new services, or exceptions.

## Project Structure

```text
specs/003-website-release-identity/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/website-release-identity.md
└── quickstart.md

apps/website/
├── package.json                 # Existing source of truth
├── nuxt.config.ts               # Expose a build-time constant through Nuxt app config
├── app/layouts/default.vue      # Render the version in the shared footer
├── tests/e2e/website.spec.ts    # SSR and browser regression coverage
└── Dockerfile                   # Set OCI source label on the runtime image
```

## Implementation and Rollout

1. Resolve the manifest version via the existing Nuxt build; expose only the version to the shared layout through public app config, not an environment override. Add one `v` prefix, retain surrounding content, and isolate the version's text direction.
2. Add `org.opencontainers.image.source=https://github.com/crateview/crateview` to the final Docker stage. Verify locally without publishing. Preserve the existing release-script revision label and image destinations.
3. After implementation checks, add one website patch changeset using the existing app-local Changesets CLI. Submit one feature PR to `main`; no release tool, deploy, or package settings mutation is part of PR creation.
4. For the separately approved hosted step, a package admin inventories visibility, inheritance, repository Actions grants, current deployment access and existing version/tag digests. Preserve required access explicitly before relinking if it currently depends on inheritance. Use GitHub's supported unlink/connect procedure to set the monorepo as repository source without inheriting access from the public repo. Treat any new grant for monorepo Actions as a separate access decision: inspect fork exposure and, if approved, grant only the required role. A previous monorepo workflow received `403`; do not assume current publishing access. If required access cannot be preserved or verified, stop before changing the association.
5. Verify association, listing, private visibility, unchanged recorded digests, and authorized pull after relinking. Keep deployment and publishing gates in place. Report any unverified remote acceptance separately from code and CI checks.
