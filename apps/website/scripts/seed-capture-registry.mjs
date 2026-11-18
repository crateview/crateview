export const fixtureImage =
  'alpine@sha256:3d67941fed5ae436b2bb9791cb3f50a252441c7706bbc5b4e738936df8ff8306'
// Copy a real Linux amd64 Alpine image through Registry HTTP API V2. This avoids
// assuming Docker Desktop's daemon shares the runner's host loopback interface.
export async function seedCaptureRegistry(target, password) {
  async function check(response) {
    if (!response.ok) throw new Error(`Registry seed failed: ${response.url} (${response.status})`)
    return response
  }
  const get = async (url, options = {}) =>
    check(await fetch(url, { ...options, signal: AbortSignal.timeout(120000) }))
  const token = (
    await (
      await get(
        'https://auth.docker.io/token?service=registry.docker.io&scope=repository:library/alpine:pull',
      )
    ).json()
  ).token
  const source = 'https://registry-1.docker.io/v2/library/alpine'
  const sourceHeaders = {
    Authorization: `Bearer ${token}`,
    Accept:
      'application/vnd.oci.image.index.v1+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json',
  }
  const manifest = await (
    await get(source + '/manifests/' + fixtureImage.split('@')[1], { headers: sourceHeaders })
  ).text()
  const parsed = JSON.parse(manifest)
  const headers = { Authorization: `Basic ${Buffer.from('admin:' + password).toString('base64')}` }
  const blobs = await Promise.all(
    [parsed.config, ...parsed.layers].map(async (entry) => ({
      ...entry,
      data: await (
        await get(source + '/blobs/' + entry.digest, { headers: sourceHeaders })
      ).arrayBuffer(),
    })),
  )
  for (const repo of ['alpine', 'demo/backend', 'demo/frontend']) {
    for (const blob of blobs) {
      const upload = await get(`${target}/v2/${repo}/blobs/uploads/`, { method: 'POST', headers })
      const location = new URL(upload.headers.get('location'), target)
      const url = new URL(location.pathname + location.search, target)
      url.searchParams.set('digest', blob.digest)
      await get(url, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/octet-stream' },
        body: blob.data,
      })
    }
    for (const tag of ['latest', 'v1'])
      await get(`${target}/v2/${repo}/manifests/${tag}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': parsed.mediaType },
        body: manifest,
      })
  }
}
