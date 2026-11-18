# Crateview documentation

Public documentation sources for [Crateview](https://crateview.de).

- Stable: [English](https://crateview.de/docs/overview), [Deutsch](https://crateview.de/de/docs/overview).
- See [versions.json](versions.json) for the current stable series, archives and internal unreleased `next` source.
- The guides support English, German, Simplified Chinese, Hindi, Spanish, Arabic, French, Bengali, Brazilian Portuguese, Indonesian, Urdu, Russian and Japanese.

## Editing

Edit `<locale>/docs/<version>/<slug>.md`. Every page has `title` and `description`
frontmatter. English is the editorial reference. Update all translations together,
preserving fenced executable examples and technical identifiers. Additional
translations have not received native-speaker review. Arabic and Urdu render RTL;
code remains LTR. No translation API runs on the website.

Internal links use `/docs/<version>/<slug>` in English and
`/<locale>/docs/<version>/<slug>` otherwise; retain `zh-CN` and `pt-BR` case.
Screenshots use `https://crateview.de/images/docs/<version>/<name>-light.webp`.
They are captured from the matching exact source revision, not borrowed from the
latest interface. Light and dark captures live in `apps/website/public/images/docs/`;
release provenance lives in [publications.json](publications.json). Add new guide slugs to the version's manifest entry and
all website locale dictionaries.

## Compatibility review

The initial archive was checked against `v0.1.2`, `v0.2.1`, `v0.3.0`, `v0.4.0`
and preview commit `bef44098e9acfe2aaa39c0ba0bbaa768b7853241`:

- Releases through 0.4 expose English/German UI only and use Node 24.22.2. Release 0.5 adds thirteen UI languages, account management and Node 26.13.0.
- 0.1 uses a repository overview and navbar search; 0.2 adds namespace table/grid
  views and the resizable sidebar; 0.3 adds theme-aware code highlighting.
- 0.4 introduces the command palette, bulk digest deletion, optional Distribution
  monitoring, Settings and dependency-license inventory. Monitoring has its own
  guide only where supported; its SQLite database is optional.
- 0.5 releases file-backed account management, managed token authorization,
  Administration/Users/Account pages, thirteen UI languages, RTL and Node 26.13.0.
  The `next` snapshot remains a separate unreleased preview.

For each release, check runtime defaults, Compose files, authentication and
permission boundaries, UI routes/shortcuts, deletion semantics and screenshots
against its recorded source revision. Historical docs must not inherit new features
or installation requirements automatically. Keep the released minor archive when
moving the stable marker; update `next` separately. Website tests validate every
version/locale combination, localized links, source revisions and image references.

## Publishing

The website builds from this root `docs/` directory without a submodule.
For manual corrections, review the docs, matching captures if needed and a website
Changeset in the same PR. Routine registry releases use the promotion workflow
below. Old unversioned URLs redirect temporarily to the selected stable version.
Internal next pages are not published; on-site search stays
inside the selected released version and language.

Both app sources and the docs are in the public monorepo. The production website
image remains private.

## Automatic release promotion

`next` is an internal editorial source, not a public preview. Keep all 13 locales
current before publishing a registry UI release. The website returns 404 for next
routes and excludes next from its content index and published screenshot assets.

The registry UI release workflow pins the tagged commit, its `docs/` directory,
and the verified registry image digest in its `docs-promotion.json` release asset. The website promotes that immutable snapshot
to `v<major>.<minor>`; patches update the existing minor. Older minor archives are
retained. Changes committed after the request was created belong to a future
release, even when a promotion is retried.

Installation and operations pages contain explicit `release:<slug>:start/end`
HTML comment markers. The promotion replaces only those sections with the matching
`release-templates/<locale>/<slug>.md` fragment. An empty installation fragment
removes the local preview-build introduction. Operations fragments use
`{{RELEASE_TAG}}` for the published version. Preserve markers and update localized
fragments when release instructions change. Other next links, the recorded source
revision, and the exact local preview image reference are converted structurally.

Each manifest entry declares `captures` capabilities (`overviewRoute`, `monitoring`,
`accounts`, `userActions`). Keep next capabilities aligned with the upcoming UI.
The promotion workflow takes fresh screenshots from the digest-pinned registry image;
existing next captures are not relabeled as release captures. Failed validation
or screenshots stop publication. See the [migration runbook](monorepo-migration.md)
for production gates, rollback and image retention.
