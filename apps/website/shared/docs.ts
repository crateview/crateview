import manifest from '../../../docs/versions.json' with { type: 'json' }
export const docVersions = manifest.versions.filter((version) => version.status !== 'preview')
export const docVersionsByNewest = [...docVersions].sort((a, b) => {
  if (a.status === 'preview') return -1
  if (b.status === 'preview') return 1
  return b.id.localeCompare(a.id, 'en', { numeric: true })
})
export const stableDocVersion = manifest.stable
export const docSlugs = [...new Set(docVersions.flatMap((version) => version.slugs))]
export function getDocVersion(id: string) {
  return docVersions.find((version) => version.id === id)
}
export function docPath(version: string, slug = 'overview') {
  return `/docs/${version}/${slug}`
}
