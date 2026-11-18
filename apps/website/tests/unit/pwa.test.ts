import { describe, expect, it } from 'vitest'
import {
  firstPwaRelease,
  hasPwaSupport,
  pwaGuideUrl,
  pwaRegistryRevision,
} from '../../app/utils/pwa'

describe('PWA release announcement', () => {
  it('announces the first PWA minor release', () => {
    expect(firstPwaRelease).toBe('v0.6.0')
    expect(hasPwaSupport(firstPwaRelease)).toBe(true)
  })
  it.each(['v0.5.0', 'v0.5.1', 'v0.5.99', undefined, null, '', 'v0.6.0-beta.1', 'v01.0.0'])(
    'does not promise PWA for %s',
    (release) => {
      expect(hasPwaSupport(release)).toBe(false)
      expect(pwaGuideUrl(release, '/de/docs/v0.5/installation')).toBe(
        `https://github.com/crateview/registry-ui/blob/${pwaRegistryRevision}/README.md#install-as-an-app-pwa`,
      )
    },
  )
  it.each(['v0.6.0', 'v0.6.1', 'v0.10.0', 'v1.0.0', 'v2.0.1'])(
    'uses the matching stable guide for %s',
    (release) => {
      expect(hasPwaSupport(release)).toBe(true)
      const version = release.split('.').slice(0, 2).join('.')
      expect(pwaGuideUrl(release, `/de/docs/${version}/installation`)).toBe(
        `/de/docs/${version}/installation#pwa`,
      )
    },
  )
})
