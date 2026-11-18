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

## Rollback prerequisites

- Record known-good running digests, effective deployment inputs, and current publication owners in the restricted operator record. Verify staging can pull both retained digests using the expected access.
- Set the rollback window and retain both packages, their supported tag references, and the known-good digests. Check for shared manifests and retain uncertain artifacts.
- Rehearse pausing automatic website updates and pinning the previous digest. Rehearse restoring the registry UI separately without removing its data or account volumes.
- Reconcile pending promotion receipts and confirm one writer per stream before handing off or restoring publication ownership. Do not rewrite release tags.
