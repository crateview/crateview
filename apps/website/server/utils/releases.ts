interface GitHubRelease {
  tag_name: string
  name: string | null
  published_at: string | null
  body: string | null
  draft: boolean
  prerelease: boolean
}

export async function fetchReleases(fetcher: typeof fetch = fetch) {
  const response = await fetcher(
    'https://api.github.com/repos/crateview/registry-ui/releases?per_page=100',
    {
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(5000),
    },
  )
  if (!response.ok) throw new Error(`GitHub releases unavailable (${response.status})`)
  const releases: GitHubRelease[] = await response.json()
  return releases
    .filter(
      (release) =>
        !release.draft && !release.prerelease && /^v?\d+\.\d+\.\d+$/.test(release.tag_name),
    )
    .map((release) => ({
      tag: release.tag_name,
      title: release.name || release.tag_name,
      publishedAt: release.published_at,
      markdown: release.body || '',
      url: `https://github.com/crateview/registry-ui/releases/tag/${encodeURIComponent(release.tag_name)}`,
    }))
    .sort((a, b) =>
      b.tag.replace(/^v/, '').localeCompare(a.tag.replace(/^v/, ''), 'en', { numeric: true }),
    )
}

export const getReleases = defineCachedFunction(() => fetchReleases(), {
  name: 'registry-releases',
  maxAge: 3600,
})
