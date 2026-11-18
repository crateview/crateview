import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, cp, rm, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { supportedLocales } from '../../shared/locales'
import {
  promoteDocs,
  promotionState,
  releaseVersion,
  validateRequest,
} from '../../scripts/promote-docs.mjs'
const roots: string[] = []
const revision = 'a'.repeat(40)
const request = (tag = 'v0.6.0') => ({
  schema: 1,
  tag,
  registryRevision: revision,
  docsRevision: 'b'.repeat(40),
})
const historicalRequest = {
  schema: 1,
  tag: 'v0.8.0',
  registryRevision: '244ad8eb2cea0317f9ab149c238def5b414af565',
  docsRevision: 'cb97cf8090549b792e795a5957da868551fe72fc',
}
const previewRevision = '9954f9c33e34c65bab19378a9b488e9b8ed13b6d'
const incorrectRevision = '9161995b06303796e48cd1b5e695106ed003ec79'
const pinnedSlugs = ['installation', 'operations', 'authentication']

/** Reproduce the historical mismatch without depending on live next source pins. */
async function historicalFixture() {
  const paths = await fixture()
  const file = join(paths.source, 'versions.json')
  const manifest = JSON.parse(await readFile(file, 'utf8'))
  const next = manifest.versions.find((entry: { id: string }) => entry.id === 'next')
  for (const locale of supportedLocales) {
    for (const slug of pinnedSlugs) {
      const page = join(paths.source, locale.code, 'docs/next', slug + '.md')
      const text = await readFile(page, 'utf8')
      await writeFile(page, text.replaceAll(next.revision, previewRevision))
    }
  }
  next.revision = incorrectRevision
  await writeFile(file, JSON.stringify(manifest))
  return paths
}
async function fixture(liveRelease?: string) {
  const root = await mkdtemp(join(tmpdir(), 'docs-promotion-test-'))
  roots.push(root)
  const source = join(root, 'source'),
    target = join(root, 'target')
  const filter = (path: string) => !path.split('/').includes('.git')
  await cp(new URL('../../../../docs/', import.meta.url), source, { recursive: true, filter })
  const liveManifest = JSON.parse(await readFile(join(source, 'versions.json'), 'utf8'))
  if (liveRelease) {
    liveManifest.stable = releaseVersion(liveRelease)
    liveManifest.versions.push({
      id: releaseVersion(liveRelease),
      release: liveRelease,
      revision: 'f'.repeat(40),
      docsRevision: 'f'.repeat(40),
      status: 'stable',
      slugs: ['installation'],
    })
    await writeFile(join(source, 'versions.json'), JSON.stringify(liveManifest))
  }
  await cp(source, target, { recursive: true })
  const next = liveManifest.versions.find((version: { id: string }) => version.id === 'next')
  // Fixtures must not inherit a release that the coordinator just promoted.
  const baseline = {
    stable: 'v0.5',
    versions: [
      {
        id: 'v0.1',
        release: 'v0.1.2',
        revision: 'd'.repeat(40),
        status: 'archived',
        slugs: ['installation'],
      },
      { ...next, id: 'v0.5', release: 'v0.5.0', revision: 'e'.repeat(40), status: 'stable' },
      next,
    ],
  }
  await writeFile(join(target, 'versions.json'), JSON.stringify(baseline))
  return { source, target }
}
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})
describe('release promotion', () => {
  it('repairs v0.8.0 source references while retaining the immutable receipt', async () => {
    const { source, target } = await historicalFixture()
    const before = await readFile(join(source, 'en/docs/next/authentication.md'), 'utf8')
    const preview = await readFile(join(target, 'versions.json'), 'utf8')
    const receipt = JSON.stringify(historicalRequest)
    await expect(promoteDocs({ source, target, request: historicalRequest })).resolves.toEqual({
      state: 'promote',
      id: 'v0.8',
    })
    const manifest = JSON.parse(await readFile(join(target, 'versions.json'), 'utf8'))
    expect(manifest.versions.find((entry: { id: string }) => entry.id === 'v0.8')).toMatchObject({
      release: historicalRequest.tag,
      revision: historicalRequest.registryRevision,
      docsRevision: historicalRequest.docsRevision,
    })
    expect(manifest.versions.find((entry: { id: string }) => entry.id === 'next')).toEqual(
      JSON.parse(preview).versions.find((entry: { id: string }) => entry.id === 'next'),
    )
    for (const locale of supportedLocales) {
      for (const slug of pinnedSlugs) {
        const page = await readFile(join(target, locale.code, 'docs/v0.8', slug + '.md'), 'utf8')
        expect(page, `${locale.code}/${slug}`).toContain(
          slug === 'operations' ? historicalRequest.tag : historicalRequest.registryRevision,
        )
        expect(page).not.toContain(previewRevision)
        expect(page).not.toContain(incorrectRevision)
        expect(page).not.toMatch(/\/docs\/next\/|\/images\/docs\/next\//)
      }
    }
    expect(await readFile(join(source, 'en/docs/next/authentication.md'), 'utf8')).toBe(before)
    expect(JSON.stringify(historicalRequest)).toBe(receipt)
    const published = await readFile(join(target, 'versions.json'), 'utf8')
    await expect(promoteDocs({ source, target, request: historicalRequest })).resolves.toEqual({
      state: 'done',
    })
    expect(await readFile(join(target, 'versions.json'), 'utf8')).toBe(published)
  })
  it.each(['unknown snapshot', 'different release', 'unexpected page pin'])(
    'rejects %s before changing the target',
    async (scenario) => {
      const { source, target } = await historicalFixture()
      const receipt = { ...historicalRequest }
      if (scenario === 'unknown snapshot') receipt.docsRevision = 'c'.repeat(40)
      if (scenario === 'different release') receipt.tag = 'v0.8.1'
      if (scenario === 'unexpected page pin') {
        const file = join(source, 'ja/docs/next/authentication.md')
        await writeFile(
          file,
          (await readFile(file, 'utf8')).replaceAll(previewRevision, 'f'.repeat(40)),
        )
      }
      // Validation also runs after promotion, when this released directory exists.
      await mkdir(join(target, 'en/docs/v0.8'), { recursive: true })
      const releasedPage = join(target, 'en/docs/v0.8/authentication.md')
      await writeFile(releasedPage, 'Previously published authentication guide\n')
      const before = await readFile(join(target, 'versions.json'), 'utf8')
      const archive = await readFile(join(target, 'en/docs/v0.5/authentication.md'), 'utf8')
      await expect(promoteDocs({ source, target, request: receipt })).rejects.toThrow(
        'Inconsistent source revision',
      )
      expect(await readFile(join(target, 'versions.json'), 'utf8')).toBe(before)
      expect(await readFile(join(target, 'en/docs/v0.5/authentication.md'), 'utf8')).toBe(archive)
      expect(await readFile(releasedPage, 'utf8')).toBe(
        'Previously published authentication guide\n',
      )
    },
  )
  it.each(['v0.6.0', 'v1.0.0'])(
    'keeps fixtures independent after live promotion to %s',
    async (liveRelease) => {
      const { source, target } = await fixture(liveRelease)
      await expect(promoteDocs({ source, target, request: request('v0.5.1') })).resolves.toEqual({
        state: 'promote',
        id: 'v0.5',
      })
    },
  )
  it.each(['v0.6.0', 'v0.5.1', 'v1.0.0'])(
    'promotes %s in all locales without changing next or archives',
    async (tag) => {
      const { source, target } = await fixture()
      const before = await readFile(join(source, 'en/docs/next/installation.md'), 'utf8')
      const archive = await readFile(join(target, 'de/docs/v0.1/installation.md'), 'utf8')
      await promoteDocs({ source, target, request: request(tag) })
      const manifest = JSON.parse(await readFile(join(target, 'versions.json'), 'utf8'))
      expect(manifest.stable).toBe(releaseVersion(tag))
      expect(
        manifest.versions.filter((item: { status: string }) => item.status === 'stable'),
      ).toHaveLength(1)
      expect(await readFile(join(target, 'en/docs/next/installation.md'), 'utf8')).toBe(before)
      expect(await readFile(join(target, 'de/docs/v0.1/installation.md'), 'utf8')).toBe(archive)
      for (const locale of [
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
      ]) {
        const page = await readFile(
          join(target, locale, 'docs', releaseVersion(tag), 'installation.md'),
          'utf8',
        )
        expect(page).toContain('ghcr.io/crateview/registry-ui:${CRATEVIEW_VERSION:-' + tag + '}')
        expect(page).not.toMatch(/crateview-registry-ui:next|\/docs\/next\/|<!-- release:/)
        expect(
          await readFile(
            join(target, locale, 'docs', releaseVersion(tag), 'operations.md'),
            'utf8',
          ),
        ).toContain('CRATEVIEW_VERSION=' + tag)
      }
      expect(await promoteDocs({ source, target, request: request(tag) })).toEqual({
        state: 'done',
      })
      await expect(
        promoteDocs({
          source,
          target,
          request: { ...request(tag), registryRevision: 'c'.repeat(40) },
        }),
      ).rejects.toThrow('Conflicting')
    },
  )
  it('rejects preview tags and invalid revisions', () => {
    for (const tag of ['v1.0.0-beta.1', '1.0.0', 'v01.0.0', '../x'])
      expect(() => validateRequest(request(tag))).toThrow()
    expect(() => validateRequest({ ...request(), docsRevision: 'main' })).toThrow()
  })
  it('does not roll stable or patch documentation backwards', () => {
    const manifest = { stable: 'v0.6', versions: [{ id: 'v0.6', release: 'v0.6.3' }] }
    expect(promotionState(manifest, request('v0.5.9'))).toBe('stale')
    expect(promotionState(manifest, request('v0.6.2'))).toBe('stale')
  })
  it('rejects incomplete translations before changing target', async () => {
    const { source, target } = await fixture()
    const before = await readFile(join(target, 'versions.json'), 'utf8')
    await rm(join(source, 'ja/docs/next/authentication.md'))
    await expect(promoteDocs({ source, target, request: request() })).rejects.toThrow('Incomplete')
    expect(await readFile(join(target, 'versions.json'), 'utf8')).toBe(before)
  })
  it('rejects missing release markers and broken localized links', async () => {
    const { source, target } = await fixture()
    const file = join(source, 'de/docs/next/installation.md')
    const text = await readFile(file, 'utf8')
    await writeFile(file, text.replace('release:installation:start', 'broken'))
    await expect(promoteDocs({ source, target, request: request() })).rejects.toThrow(
      'Missing release section',
    )
    await writeFile(file, text + '\n[broken](/docs/next/nope)\n')
    await expect(promoteDocs({ source, target, request: request() })).rejects.toThrow(
      'Invalid localized link',
    )
  })
})
