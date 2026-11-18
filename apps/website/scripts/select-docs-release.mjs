import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { compare, validateRequest, promotionState } from './promote-docs.mjs'

// Requests are durable release assets, not transient dispatch payloads. A scheduled
// scan recovers dispatch failures and replaced pending Actions concurrency jobs.
const gh = (args) => execFileSync('gh', args, { encoding: 'utf8' }).trim()
const repo = process.env.GITHUB_REPOSITORY || 'crateview/registry-ui'
const releases = []
for (let page = 1; ; page++) {
  const batch = JSON.parse(gh(['api', `repos/${repo}/releases?per_page=100&page=${page}`]))
  releases.push(...batch)
  if (batch.length < 100) break
}
const manifest = JSON.parse(
  await readFile(
    process.env.DOCS_MANIFEST || new URL('../../../docs/versions.json', import.meta.url),
    'utf8',
  ),
)
const ledger = JSON.parse(
  await readFile(
    process.env.DOCS_PUBLICATIONS || new URL('../../../docs/publications.json', import.meta.url),
    'utf8',
  ),
)
const requestedTag = process.env.REQUESTED_TAG
if (
  requestedTag &&
  !releases.some(
    (release) => release.tag_name === requestedTag && !release.draft && !release.prerelease,
  )
)
  throw new Error('Requested stable release does not exist')
const pending = []
for (const release of releases) {
  if (release.draft || release.prerelease) continue
  const asset = release.assets.find((asset) => asset.name === 'docs-promotion.json')
  if (!asset) {
    if (release.tag_name === requestedTag)
      throw new Error('Requested release is missing its promotion receipt; rerun registry Release')
    continue
  }
  const request = validateRequest(
    JSON.parse(
      gh([
        'api',
        '-H',
        'Accept: application/octet-stream',
        `repos/${repo}/releases/assets/${asset.id}`,
      ]),
    ),
  )
  if (request.tag !== release.tag_name) throw new Error('Release receipt tag mismatch')
  const commit = JSON.parse(gh(['api', `repos/${repo}/commits/${request.tag}`])).sha
  if (commit !== request.registryRevision) throw new Error(`Moved registry tag ${request.tag}`)
  const recorded = ledger[request.tag]
  if (
    recorded &&
    (recorded.registryRevision !== request.registryRevision ||
      recorded.docsRevision !== request.docsRevision ||
      recorded.imageDigest !== request.imageDigest ||
      recorded.schema !== request.schema)
  )
    throw new Error(`Changed promotion receipt for ${request.tag}`)
  if (recorded) {
    if (request.schema === 1 && process.env.MONOREPO_PROMOTION === 'true') continue
    if (request.schema === 2 && !recorded.websiteVersion) returnPending()
    const websiteTag =
      request.schema === 2
        ? `repos/${repo}/releases/tags/website-v${recorded.websiteVersion}`
        : `repos/crateview/website/releases/tags/v${recorded.websiteVersion}`
    let published
    try {
      published = JSON.parse(gh(['api', websiteTag]))
    } catch {
      if (request.schema === 2) returnPending()
      pending.push({ ...request, recovery: recorded })
      continue
    }
    if (published.draft || published.prerelease)
      throw new Error('Website publication is not a stable release')
    continue
  }
  if (request.schema === 1 && process.env.MONOREPO_PROMOTION === 'true') {
    if (promotionState(manifest, request) === 'stale') continue
    throw new Error(`Reconcile legacy promotion ${request.tag} before enabling the monorepo writer`)
  }
  const state = promotionState(manifest, request)
  if (state === 'stale') {
    console.log(`Skipping superseded request ${request.tag}`)
    continue
  }
  if (state === 'done') throw new Error(`Missing publication record for ${request.tag}`)
  pending.push(request)
}

function returnPending() {
  console.log('Waiting for the reviewed website version PR')
  process.exit(0)
}
pending.sort((a, b) => compare(a.tag, b.tag))
if (pending.length) {
  await writeFile(process.env.REQUEST_FILE, JSON.stringify(pending[0], null, 2) + '\n')
  await writeFile(process.env.GITHUB_OUTPUT, `pending=true\n`, { flag: 'a' })
} else console.log('No outstanding documentation promotions')
