# Release State

- **Pending changeset**: Root Markdown file with a unique basename, package-to-bump mapping, and changelog text.
- **Version PR**: At most one new-style open PR targeting `main`, with head `changeset-release/main`. It holds changelogs, version and lockfile updates, consumed entries, and any website ledger updates. Review and merge are manual.
- **Published version**: App version that passes the existing baseline, revision, tag, digest, and smoke checks. Registry tags are `vX.Y.Z`; website tags are `website-vX.Y.Z`. No npm publication.
- **Docs receipt**: Registry release tag pinned to an image and source revision, plus a website version recorded when that receipt's patch entry is consumed.
