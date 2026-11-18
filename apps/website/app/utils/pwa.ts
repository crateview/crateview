/** First registry release containing the installable PWA implementation. */
export const firstPwaRelease = 'v0.6.0'
/** Keep the unreleased documentation link tied to the reviewed PWA source. */
export const pwaRegistryRevision = '9954f9c33e34c65bab19378a9b488e9b8ed13b6d'

/** Announce availability only when the documented stable registry release includes PWA. */
export function hasPwaSupport(release?: string | null) {
  const match = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(release || '')
  if (!match) return false
  return Number(match[1]) > 0 || Number(match[2]) >= 6
}

/** Link preview readers to reviewed source; stable readers use their localized installation guide. */
export function pwaGuideUrl(release: string | null | undefined, installationPath: string) {
  return hasPwaSupport(release)
    ? installationPath + '#pwa'
    : `https://github.com/crateview/registry-ui/blob/${pwaRegistryRevision}/README.md#install-as-an-app-pwa`
}
