# Data Model: Repository and Publication

No application database schema changes. The modeled state is source and release metadata.

## App

- **Fields**: `id` (`registry-ui` or `website`), `path`, npm package name, SemVer version, Git tag convention, GHCR image coordinate.
- **Relationships**: Registry-ui owns its nested auth package; website consumes root docs and owns the served static images. Neither app imports the other's `node_modules`.
- **Validation**: Exactly two deployable app IDs; existing package names and image coordinates are stable; no new npm publish target.

## Imported Baseline

- **Fields**: Source repository, commit SHA, target path, source tree/digest evidence and license attribution.
- **Planning references**: Registry-ui `792605d68e11703bd42f48b75608f44ace0c6d98`; website `5fdb7e06e200cb4c8bb077de4189af553cd8762e`; website's `content` gitlink `52a7be3122b01ab0d81d698b9286f201f36b5a45`.
- **Validation**: Import only tracked files from reviewed pins. The website commit's gitlink must match the imported published docs baseline; document path adjustments and intentional exclusions.

## Documentation Version and Publication

- **Version fields**: Retain `id`, `release`, `revision`, `status`, `slugs`, `captures`, optional legacy `docsRevision`, and root `stable` from `docs/versions.json`. A series ID is `vMAJOR.MINOR`; `next` is preview source, not a public route.
- **Publication fields**: Registry tag (unique key), registry commit, verified registry image digest, docs source path and commit, capture manifest identity, and the website publication version/commit once known. Preserve legacy `docsRevision`, `docsCommit`, and `websiteVersion` entries without reinterpretation; version the record format for new fields.
- **Relationships**: A release maps to a pinned docs revision and one series. A website version may carry the resulting publication; a website-only release does not trigger registry docs promotion.
- **Validation**: One stable series; preserve locale fallback, slug coverage, prior archive series and historical ledger entries. A patch can advance the currently published series under the existing route behavior. A retry with identical inputs is a no-op after completion; a conflicting identity fails closed.
- **Transitions**: Verified registry tag/image → staged docs and captures → reviewed promotion → verified website image → website deployment. A failure before deployment leaves the previous live site intact; a retry resumes at the last verified stage. Never recapture from a drifting `latest` tag.
