import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const json = async (file) => JSON.parse(await readFile(file, 'utf8'))
export function releaseVersion(tag) {
  const match = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(tag)
  if (!match) throw new Error('Expected stable vMAJOR.MINOR.PATCH tag')
  return `v${match[1]}.${match[2]}`
}
export const compare = (a, b) => a.localeCompare(b, 'en', { numeric: true })
export function validateRequest(request) {
  releaseVersion(request.tag)
  for (const key of ['registryRevision', 'docsRevision'])
    if (!/^[a-f0-9]{40}$/.test(request[key])) throw new Error(`Invalid ${key}`)
  if (request.schema !== 1) throw new Error('Unsupported promotion request schema')
  return request
}
export function promotionState(manifest, request) {
  validateRequest(request)
  const id = releaseVersion(request.tag)
  const entry = manifest.versions.find((item) => item.id === id)
  if (entry?.release === request.tag) {
    if (entry.revision !== request.registryRevision || entry.docsRevision !== request.docsRevision)
      throw new Error('Conflicting promotion for existing release tag')
    return 'done'
  }
  if (
    compare(id, manifest.stable) < 0 ||
    (entry?.release && compare(request.tag, entry.release) < 0)
  )
    return 'stale'
  return 'promote'
}
export async function promoteDocs({ source, target, request }) {
  const sourceManifest = await json(join(source, 'versions.json'))
  const manifest = await json(join(target, 'versions.json'))
  const state = promotionState(manifest, request)
  if (state !== 'promote') return { state }
  const next = sourceManifest.versions.find((item) => item.id === 'next')
  if (!next?.slugs.length || !next.captures)
    throw new Error('Missing next manifest/capture configuration')
  // This immutable v0.8.0 receipt predates the reviewed preview-manifest correction.
  // Keep its provenance while resolving the source pin actually used by its pages.
  const sourceRevision =
    request.tag === 'v0.8.0' &&
    request.registryRevision === '244ad8eb2cea0317f9ab149c238def5b414af565' &&
    request.docsRevision === 'cb97cf8090549b792e795a5957da868551fe72fc' &&
    next.revision === '9161995b06303796e48cd1b5e695106ed003ec79'
      ? '9954f9c33e34c65bab19378a9b488e9b8ed13b6d'
      : next.revision
  if (!/^[a-f0-9]{40}$/.test(sourceRevision))
    throw new Error('Inconsistent source revision in next manifest')
  const locales = (await readdir(source, { withFileTypes: true }))
    .filter((item) => item.isDirectory())
    .map((item) => item.name)
    .filter((name) => !name.startsWith('.') && !['release-templates'].includes(name))
  const required = [
    'en',
    'de',
    'zh-CN',
    'hi',
    'es',
    'ar',
    'fr',
    'bn',
    'pt-BR',
    'id',
    'ur',
    'ru',
    'ja',
  ]
  if (required.some((locale) => !locales.includes(locale)))
    throw new Error('Missing locale directory')
  const id = releaseVersion(request.tag)
  const prepared = []
  // Validate the entire snapshot before touching any target version.
  for (const locale of required) {
    const directory = join(source, locale, 'docs/next')
    const files = await readdir(directory)
    if (
      files.sort().join() !==
      next.slugs
        .map((slug) => slug + '.md')
        .sort()
        .join()
    )
      throw new Error(`Incomplete next pages for ${locale}`)
    for (const slug of next.slugs) {
      let text = await readFile(join(directory, slug + '.md'), 'utf8')
      if (!/^---\ntitle: .+\ndescription: .+\n---/.test(text))
        throw new Error(`Invalid page ${locale}/${slug}`)
      if (['installation', 'operations', 'authentication'].includes(slug)) {
        const revisions = text.match(/\b[a-f0-9]{40}\b/g) || []
        if (!revisions.length || revisions.some((revision) => revision !== sourceRevision))
          throw new Error(`Inconsistent source revision in ${locale}/${slug}`)
      }
      if (['installation', 'operations'].includes(slug)) {
        const marker = new RegExp(
          `<!-- release:${slug}:start -->[\\s\\S]*?<!-- release:${slug}:end -->`,
          'g',
        )
        if ([...text.matchAll(marker)].length !== 1)
          throw new Error(`Missing release section ${locale}/${slug}`)
        const template = await readFile(
          join(source, 'release-templates', locale, slug + '.md'),
          'utf8',
        )
        text = text.replace(marker, () => template.trim())
      }
      text = text
        .replaceAll('/docs/next/', `/docs/${id}/`)
        .replaceAll('/images/docs/next/', `/images/docs/${id}/`)
        .replaceAll(
          'crateview-registry-ui:next',
          'ghcr.io/crateview/registry-ui:${CRATEVIEW_VERSION:-' + request.tag + '}',
        )
        .replaceAll(sourceRevision, request.registryRevision)
        .replaceAll('{{RELEASE_TAG}}', request.tag)
      if (/\/docs\/next\/|crateview-registry-ui:next|<!-- release:|\{\{[A-Z_]+\}\}/.test(text))
        throw new Error(`Unresolved preview content ${locale}/${slug}`)
      for (const [, link] of text.matchAll(/\]\((\/(?:[A-Za-z-]+\/)?docs\/[^)#]+)(?:#[^)]*)?\)/g)) {
        const prefix = `${locale === 'en' ? '' : '/' + locale}/docs/${id}/`
        if (!link.startsWith(prefix) || !next.slugs.includes(link.slice(prefix.length)))
          throw new Error(`Invalid localized link ${locale}/${slug}: ${link}`)
      }
      prepared.push({ locale, slug, text })
    }
  }
  for (const locale of required) {
    await rm(join(target, locale, 'docs', id), { recursive: true, force: true })
    await mkdir(join(target, locale, 'docs', id), { recursive: true })
  }
  for (const { locale, slug, text } of prepared)
    await writeFile(join(target, locale, 'docs', id, slug + '.md'), text)
  for (const entry of manifest.versions) if (entry.status === 'stable') entry.status = 'archived'
  const entry = {
    ...next,
    id,
    release: request.tag,
    revision: request.registryRevision,
    docsRevision: request.docsRevision,
    status: 'stable',
  }
  manifest.versions = manifest.versions.filter((item) => item.id !== id)
  manifest.versions.push(entry)
  manifest.stable = id
  await writeFile(join(target, 'versions.json'), JSON.stringify(manifest, null, 2) + '\n')
  return { state, id }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [source, target, file] = process.argv.slice(2)
  console.log(await promoteDocs({ source, target, request: await json(file) }))
}
