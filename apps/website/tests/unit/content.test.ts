import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { docVersions, getDocVersion, stableDocVersion, docPath } from '../../shared/docs'
import { supportedLocales, localizedPath } from '../../shared/locales'
import { contentContract } from '../helpers/content-contract'

const read = (path: string) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
describe('versioned multilingual documentation', () => {
  it('defines immutable source revisions and one stable default', () => {
    expect(docVersions.every((version) => /^v\d+\.\d+$/.test(version.id))).toBe(true)
    expect(getDocVersion('next')).toBeUndefined()
    expect(
      docVersions.filter((version) => version.status === 'stable').map((version) => version.id),
    ).toEqual([stableDocVersion])
    expect(getDocVersion('unknown')).toBeUndefined()
    for (const version of docVersions) expect(version.revision).toMatch(/^[a-f0-9]{40}$/)
    expect(docPath('v0.4', 'usage')).toBe('/docs/v0.4/usage')
  })
  for (const version of docVersions) {
    it(`${version.id} has matching real captures`, () => {
      const capture = JSON.parse(read(`public/images/docs/${version.id}/capture.json`))
      expect(capture.revision).toBe(version.revision)
      expect(capture.version).toBe(version.id)
      expect(capture.viewport).toEqual({ width: 1360, height: 880 })
      for (const file of capture.files)
        expect(
          existsSync(new URL(`../../public/images/docs/${version.id}/${file}`, import.meta.url)),
          file,
        ).toBe(true)
    })
    for (const { code: locale } of supportedLocales) {
      it(`${version.id}/${locale} ships substantive, linked, matching guides`, () => {
        const directory = `../../docs/${locale}/docs/${version.id}`
        expect(readdirSync(new URL('../../' + directory, import.meta.url)).sort()).toEqual(
          version.slugs.map((slug) => slug + '.md').sort(),
        )
        for (const slug of version.slugs) {
          const markdown = read(`${directory}/${slug}.md`)
          expect(markdown).toMatch(/^---\ntitle: .+\ndescription: .+\n---/)
          expect(markdown.length).toBeGreaterThan(400)
          for (const [, target] of markdown.matchAll(
            /\]\((\/(?:[A-Za-z-]+\/)?docs\/[^)#]+)(?:#[^)]*)?\)/g,
          )) {
            expect(target?.startsWith(localizedPath(locale, `/docs/${version.id}/`)), target).toBe(
              true,
            )
            expect(version.slugs).toContain(target?.split('/').at(-1))
          }
          for (const [, file] of markdown.matchAll(/https:\/\/crateview.de(\/images\/[^)]+)\)/g)) {
            expect(file).toContain(`/images/docs/${version.id}/`)
            expect(existsSync(new URL('../../public' + file, import.meta.url)), file).toBe(true)
          }
          expect(markdown).not.toMatch(/lorem ipsum|coming soon|ZXQ\d+QXZ/i)
          if (locale !== 'de') {
            expect(contentContract(markdown, slug), `${locale}/${slug}`).toEqual(
              contentContract(read(`../../docs/en/docs/${version.id}/${slug}.md`), slug),
            )
          }
        }
      })
    }
  }
  it('lets all v0.5 installation variants select the release used by upgrade instructions', () => {
    const release = getDocVersion('v0.5')!.release
    const binding = 'image: ghcr.io/crateview/registry-ui:${CRATEVIEW_VERSION:-' + release + '}'
    for (const locale of supportedLocales) {
      const markdown = read(`../../docs/${locale.code}/docs/v0.5/installation.md`)
      expect(markdown.split(binding), locale.code).toHaveLength(4)
    }
  })
  it('keeps unreleased capabilities out of archived and stable guides', () => {
    for (const version of docVersions.filter((version) =>
      ['v0.1', 'v0.2', 'v0.3', 'v0.4'].includes(version.id),
    )) {
      expect(read(`../../docs/en/docs/${version.id}/authentication.md`)).not.toContain(
        'NUXT_AUTH_MODE',
      )
      expect(read(`../../docs/en/docs/${version.id}/overview.md`)).toContain(
        'Two interface languages',
      )
      expect(read(`../../docs/en/docs/${version.id}/installation.md`)).toContain(
        `registry-ui:${version.release}`,
      )
      expect(read(`../../docs/en/docs/${version.id}/installation.md`)).toContain('24.22.2')
      expect(version.slugs.includes('monitoring')).toBe(version.id === 'v0.4')
    }
    expect(read('../../docs/en/docs/next/installation.md')).toContain('26.13.0')
    expect(read('../../docs/en/docs/next/authentication.md')).toContain('NUXT_AUTH_MODE')
  })
})
