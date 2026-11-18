# Interface Contracts

## Contributor commands

- From root, `npm run setup` installs both apps and the nested auth dependencies using their own lockfiles. No root dependency installation required.
- `npm run dev:registry-ui` and `npm run dev:website` bind to `127.0.0.1:3000` and `127.0.0.1:3002`, respectively.
- Root `npm run check`, `npm run test`, and `npm run build` aggregate the relevant checks, unit tests and builds for both apps. App scripts remain addressable via `npm --prefix apps/<app> run <script>`. Root check commands do not autofix.

## Runtime and Git identities

- Published images remain `ghcr.io/crateview/registry-ui` and `ghcr.io/crateview/website`, each with its existing version-label format `vX.Y.Z` and existing deployment channels. Registry Git tags remain `vX.Y.Z`; new website Git tags use `website-vX.Y.Z`.
- Registry UI and auth API, config keys, data paths, Compose profiles/overlays and image runtime entrypoints are unchanged. Repository-relative build commands are updated; existing pulled-image deployment configuration remains valid.
- Canonical source is `https://github.com/crateview/crateview`. Verify redirects for existing registry issues and releases; use explicit image names, not `${{ github.repository }}`.
- The canonical repository and registry image remain public; the website image remains private. Website GitHub releases must not replace the registry's latest-release feed. Updating the website's `latest` image is a production action.
- New image versions are built from the monorepo. Legacy cleanup excludes deployed, documented, supported and rollback references, including all tags sharing a retained digest; it requires a separate approved list after the rollback window.

## Website and publication

- Preserve `https://crateview.de`, locale path conventions, `/docs/<slug>` stable URLs, `/docs/<series>/<slug>` history URLs, redirects, sitemap and `/images/docs/...` assets. Preserve production 404s for `next`; unpublished content is exercised by local validation only.
- Promotion uses the verified registry tag, commit, and image digest as inputs. Docs and captures become visible together only through a verified website deployment. Missing or conflicting input fails without updating live stable; identical retries must not duplicate releases or overwrite unrelated archives.
