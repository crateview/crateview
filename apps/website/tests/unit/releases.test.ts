import { afterAll, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('defineCachedFunction', (handler: unknown) => handler)
const { fetchReleases } = await import('../../server/utils/releases')
afterAll(() => vi.unstubAllGlobals())

describe('public release feed', () => {
  it('orders stable releases, excludes drafts and previews, and uses canonical GitHub URLs', async () => {
    const entries = [
      { tag_name: 'v0.9.0', name: null, body: null, published_at: null },
      {
        tag_name: 'v0.10.0',
        name: 'Next stable',
        body: '## Changes\nFixed navigation.',
        published_at: '2026-11-02T10:00:00Z',
      },
      { tag_name: 'v0.11.0', draft: true },
      { tag_name: 'v0.12.0-beta.1', prerelease: true },
      { tag_name: '../unsafe' },
    ]
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(entries)))
    const releases = await fetchReleases(fetcher)
    expect(releases.map((release) => release.tag)).toEqual(['v0.10.0', 'v0.9.0'])
    expect(releases[0]).toMatchObject({
      title: 'Next stable',
      markdown: '## Changes\nFixed navigation.',
      url: 'https://github.com/crateview/registry-ui/releases/tag/v0.10.0',
    })
    expect(releases[1]).toMatchObject({ title: 'v0.9.0', markdown: '' })
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it('surfaces upstream errors and empty release feeds', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 429 }))
    await expect(fetchReleases(fetcher)).rejects.toThrow('GitHub releases unavailable (429)')
    fetcher.mockResolvedValue(new Response('[]'))
    await expect(fetchReleases(fetcher)).resolves.toEqual([])
  })
})
