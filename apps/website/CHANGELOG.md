# @crateview/website

## 0.4.11

### Patch Changes

- 0b3e135: Harden installed glob matchers by disabling repeated extglobs until an upstream fix is available.
- 581a20e: Install the hardened glob matcher directly, including when lifecycle scripts are disabled.
- 1ecd685: Update the website dependencies to receive published Nuxt and node-forge security fixes.
- 8805699: Show the website build version in the footer and identify the Crateview monorepo as the container image source.
- a54c87d: Build the website and versioned documentation from the Crateview monorepo, without a docs submodule. Existing documentation URLs and the website image name are unchanged.

## 0.4.8

### Patch Changes

- 83f3332: Update zlib and remove the unused npm CLI and its bundled dependencies from the production container.

## 0.4.7

### Patch Changes

- b21b389: Restore documentation promotion with exact release source links and consistent preview metadata.

## 0.4.5

### Patch Changes

- c172f33: Cycle system, light and dark modes with one button, add language flags, and slide product previews horizontally.

## 0.4.2

### Patch Changes

- bc2f0db: Hide internal next documentation and automatically promote reviewed documentation snapshots when stable registry UI releases are published.
- aaea38a: Publish filesystem branding instructions for all 13 documentation languages, including private file settings and read-only Docker mounts.
- de53a63: Announce upcoming registry PWA support in all languages, switch guidance with the documented stable release, and refresh next documentation and source-matched screenshots.
- bbcd520: Use a compact documentation version selector showing only released version numbers, without status labels or the unreleased next preview. Update next guides in all thirteen languages for administrative password resets, confirmed account deletion and user action menus, and refresh light/dark screenshots against the matching registry UI revision.

## 0.4.1

### Patch Changes

- 501ced1: Update the contact email in the imprint and privacy policy to business@tobiaswaelde.com, including mail links in every supported language.

## 0.4.0

### Minor Changes

- 0365aa8: Refresh the landing page with animated registry artwork and a theme-aware dashboard slideshow. Add compact documentation navigation, icon menus for language and color mode, and an internal releases browser. Publish v0.5 documentation as the stable default, repair local screenshot rendering and add source-matched light/dark captures.
- c70f976: Add thirteen-language documentation archives for Crateview 0.1–0.4 and an isolated unreleased preview, with version navigation, version-scoped search, stable redirects and canonical URLs. Correct outdated feature and deployment guidance and replace landing-page and documentation previews with real, source-matched light/dark screenshots.

## 0.3.0

### Minor Changes

- 2caff6b: Add thirteen interface languages with native language selection and RTL support for Arabic and Urdu. Localize all eight documentation guides, legal pages, search and SEO metadata.

### Patch Changes

- 5527732: Document the optional account service and repository-scoped token authorization in both languages, and update the documentation submodule.
- 3e08f5e: Add bilingual imprint and privacy pages, footer links and author attribution to tobiaswaelde.com.
- 8a6ec7b: Require Node.js 26.13.0 LTS for development and production, update Docker images and Node.js types, and align installation documentation. Upgrade TypeScript to 6.0.3 and Shiki to 4.6.0.

## 0.2.0

### Minor Changes

- 0d3d85d: Add theme-aware syntax highlighting with safe plain-text fallback for code blocks.

## 0.1.3

### Patch Changes

- 3de23a5: Add English and German Docker Compose installation examples for an existing registry, a bundled registry, and a complete HTTPS stack with Traefik and registry authentication.

## 0.1.2

### Patch Changes

- 257eefe: Require Node 24.22.2, update vulnerable transitive dependencies and patch deepmerge prototype poisoning pending an upstream fix.

## 0.1.1

### Patch Changes

- 7e205df: Start native version pull request checks automatically using the repository-scoped GitHub Actions token.

## 0.1.0

### Minor Changes

- Initial versioned Docker release with Changesets-managed releases.
