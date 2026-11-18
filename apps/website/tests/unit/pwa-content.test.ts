import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { supportedLocales } from '../../shared/locales'

const source = process.env.PWA_DOCS_SOURCE || new URL('../../../../docs/', import.meta.url).pathname
const read = (path: string) => readFileSync(resolve(source, path), 'utf8')
const manifest = JSON.parse(read('versions.json'))
const revision = manifest.versions.find((version: { id: string }) => version.id === 'next')
  .revision as string
const variables = [
  'NUXT_PUBLIC_BRAND_PWA_ICON_192',
  'NUXT_PUBLIC_BRAND_PWA_ICON_512',
  'NUXT_BRAND_PWA_ICON_192_FILE',
  'NUXT_BRAND_PWA_ICON_512_FILE',
]
const pwaSection = (page: string) => page.slice(page.lastIndexOf('\n## '))
const identifiers = (text: string) =>
  [...text.matchAll(/`[^`\n]+`/g)].map(([value]) => value).sort()
const fences = (text: string) =>
  [...text.matchAll(/^```[^\n]*\n[\s\S]*?^```/gm)].map(([value]) => value)

describe('PWA documentation', () => {
  it('records fresh next captures from the documented source revision', () => {
    const capture = JSON.parse(
      readFileSync(new URL('../../public/images/docs/next/capture.json', import.meta.url), 'utf8'),
    )
    expect(capture.revision).toBe(revision)
    expect(capture.version).toBe('next')
    expect(capture.viewport).toEqual({ width: 1360, height: 880 })
    expect(capture.files).toHaveLength(20)
  })
  it('pins the internal PWA source without claiming it in older published guides', () => {
    expect(revision).toMatch(/^[a-f0-9]{40}$/)
    for (const version of manifest.versions.filter((entry: { id: string }) =>
      /^v0\.[1-5]$/.test(entry.id),
    )) {
      for (const locale of supportedLocales) {
        for (const slug of [
          'overview',
          'installation',
          'configuration',
          'theming',
          'troubleshooting',
        ]) {
          const page = read(`${locale.code}/docs/${version.id}/${slug}.md`)
          for (const variable of variables) expect(page).not.toContain(variable)
          expect(page).not.toContain('<a id="pwa">')
        }
      }
    }
  })
  for (const locale of supportedLocales) {
    it(`${locale.code} keeps PWA instructions localized and technically consistent`, () => {
      const prefix = `${locale.code === 'en' ? '' : '/' + locale.code}/docs/next/`
      for (const slug of [
        'overview',
        'installation',
        'configuration',
        'theming',
        'troubleshooting',
      ]) {
        const page = read(`${locale.code}/docs/next/${slug}.md`)
        const section = pwaSection(page)
        const english = pwaSection(read(`en/docs/next/${slug}.md`))
        expect(identifiers(section)).toEqual(identifiers(english))
        expect(fences(section)).toEqual(fences(english))
        expect(section).toContain('PWA')
        for (const [, target] of page.matchAll(
          /\]\((\/(?:[A-Za-z-]+\/)?docs\/[^)#]+)(?:#[^)]*)?\)/g,
        )) {
          expect(target?.startsWith(prefix), target).toBe(true)
        }
      }
      const installation = read(`${locale.code}/docs/next/installation.md`)
      expect(installation).toContain('<a id="pwa"></a>')
      expect(pwaSection(installation)).toContain('HTTPS')
      expect(pwaSection(installation)).toContain('localhost')
      expect(pwaSection(installation)).toContain('Cache Storage')
      expect(pwaSection(installation)).toContain('RTL')
      for (const variable of variables)
        expect(read(`${locale.code}/docs/next/configuration.md`)).toContain(variable)
      for (const slug of ['installation', 'operations', 'authentication']) {
        expect(read(`${locale.code}/docs/next/${slug}.md`)).toContain(revision)
        expect(read(`${locale.code}/docs/next/${slug}.md`)).not.toContain(
          '3844d7605dac80d0d58999201c43e94c644d72c0',
        )
      }
      const previewEnd = installation.indexOf('<!-- release:installation:end -->')
      expect(previewEnd).toBeGreaterThan(-1)
      expect(installation.indexOf('<a id="pwa">')).toBeGreaterThan(previewEnd)
    })
  }
})
