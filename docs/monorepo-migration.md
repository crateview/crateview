# Monorepo migration runbook

Baseline captured before moving files. Refresh these checks at the cutover freeze; a source tag does not prove which image is running.

## Source and release baseline

- Registry UI: `792605d68e11703bd42f48b75608f44ace0c6d98`, release `v0.8.2`. The published `ghcr.io/crateview/registry-ui:v0.8.2` resolves to the OCI index `sha256:ac7050bc5184ef8a909f096b4f93a3301fa52042316599ab57d9a35e7612cc55` with a Linux/amd64 image.
- Website and product docs: use the source pins in the [data model](../specs/001-crateview-monorepo/data-model.md). The website commit's `content` gitlink and the docs checkout both resolve to `52a7be3122b01ab0d81d698b9286f201f36b5a45`. Do not substitute an unreviewed revision from either repo.
- Record the private website image digest, running digests for each deployment, and deployment access details in a restricted operator record before switching publishers. This baseline does not verify running digests.

## Check baseline

Registry CI passed at the pinned revision ([run](https://github.com/crateview/registry-ui/actions/runs/44018628971)). Website CI passed at its pinned revision in its source repo. The registry requires the `checks` status on `main` and requires branches to be up to date. Preserve this check name through migration.

Registry CI covers formatting, lint, types, unit and account-service tests, build, PWA, filesystem branding, integrated/external auth and production-image account bootstrap. Keep these checks and add the website's existing checks to monorepo CI. No local app tests or image builds were run for this baseline: the runner had Node `24.22.1` rather than the pinned `26.13.1` and could not access the Docker daemon.

## Public docs baseline

The pinned `versions.json` defines stable `v0.8` (registry `v0.8.2`), archives `v0.1`–`v0.7`, and unpublished `next`. The content tree has 13 locales, including case-sensitive `pt-BR` and `zh-CN`. Use the manifest's locale, series, and slug inventory to generate route comparisons rather than copying a stale URL list.

- `/docs/overview`: `302` to `/docs/v0.8/overview`.
- `/docs/v0.8/installation` and `/docs/v0.1/overview`: `200`.
- `/zh-CN/docs/overview` and `/pt-BR/docs/overview`: `302` to the respective localized `v0.8` URL.
- `/docs/next/overview` and `/images/docs/next/capture.json`: `404`.
- `/sitemap.xml`: 910 docs URLs, none under `next`.

These are spot checks, not a full route comparison. Run the full [validation guide](../specs/001-crateview-monorepo/quickstart.md) against a staged image.

## Website import approval

The owner approved publishing the 235-file allowlist from the pinned website commit in `apps/website/`, under the repository's MIT license for first-party code. Preserve the bundled third-party notices. Do not import `.github/`, `deploy/`, `.env.example`, `.gitmodules`, the `content` gitlink, `README.md`, or `SECURITY.md` from the website. Approved public-safe replacements may be authored separately.

The exact allowlist is the pinned Git tree's file paths minus those exclusions. A credential-signature scan of the approved blobs found no matches; this is not a substitute for verifying that the import uses exactly that tree and scope.

Product guide sources and release templates were imported from the pinned [Crateview docs tree](https://github.com/crateview/docs/tree/52a7be3122b01ab0d81d698b9286f201f36b5a45), excluding its GitHub issue templates. `docs/versions.json` remains the version manifest; the website's public captures and third-party notices retain their original locations relative to the app.

## Rollback prerequisites

- Leave `CRATEVIEW_MONOREPO_PUBLISH` unset during development and staging. Enabling production publishing is part of the separately approved cutover, not an implementation or merge step.
- Record known-good running digests, effective deployment inputs, and current publication owners in the restricted operator record. Verify staging can pull both retained digests using the expected access.
- Set the rollback window and retain both packages, their supported tag references, and the known-good digests. Check for shared manifests and retain uncertain artifacts.
- Rehearse pausing automatic website updates and pinning the previous digest. Rehearse restoring the registry UI separately without removing its data or account volumes.
- Reconcile pending promotion receipts and confirm one writer per stream before handing off or restoring publication ownership. Do not rewrite release tags.

## Hosted handoff (separate operator action)

1. Record both running image digests and the recent versioned images in the restricted operator record. Confirm the repository rename target is available. Pause website auto-updates and agree on a rollback window before touching publishers.
2. Reconcile or explicitly retire all legacy promotion receipts. Pause legacy website release and promotion workflows once their queues are stable. Keep source repos, audited history and usable rollback images intact.
3. Rename the public registry repository in place to `crateview/crateview`. Update remotes and integrations; check required CI, old issue and release redirects, existing issue/PR IDs, releases and Git tags against the baseline.
4. Verify CI can write both existing GHCR packages. Check a public registry pull and both an authenticated pull and anonymous denial for website. Do not change image visibility. Enable `CRATEVIEW_MONOREPO_PUBLISH` only with operator approval. Review both version PRs separately. Confirm each version was built from the monorepo and smoke-tested by digest before promotion; verify website stable, archived and `next` routes before resuming auto-updates.
5. Exercise rollback first in staging. If live rollback is required, disable new writers and website auto-updates, pin and recreate only the affected app at its previously recorded digest, and leave data volumes alone. Reconcile publication records before re-enabling a writer.

### Legacy image retention

After the approved rollback window expires, inventory old GHCR tags, digests and shared manifests. Protect deployed, documented and supported versions, retained rollback digests, and all aliases sharing a retained digest. Leave any uncertain artifact intact. Get separate approval for the exact removal list; never delete either package or repoint historical tags. Verify retained references still pull after cleanup.

## Pre-cutover verification

- Clean-checkout run at `23be8d2` using Node `26.13.1`: setup, type/lint/format, unit/auth tests, both app and Docker builds, registry production-image auth, Distribution monitoring, PWA, branding, integrated/basic/token browser and Docker integration, and all 65 website browser tests passed.
- Temporary same-series and new-series promotion rehearsals generated fresh screenshots. Repeating the new-series promotion was a no-op; the unrelated archive was unchanged. The container capture path used a locally built revision-labeled image in place of the external digest pull. Release command fixtures verified that the closed gate and a rejected image revision do not advance `latest` or create a release.
- Local website rollback rehearsal: rebuilt the approved website baseline and its pinned docs; checked both the monorepo candidate and the baseline by immutable local image ID. The stable redirect, German archive and unpublished-route 404 held across rollback.
- The public registry baseline digest resolves. Anonymous inspection of the private website image was denied. Authenticated GHCR access and post-rename redirects remain hosted handoff checks; local image IDs are not production rollback digests.
