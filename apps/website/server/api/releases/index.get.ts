export default defineEventHandler(async () => {
  try {
    const releases = await getReleases()
    return releases.map(({ tag, title, publishedAt, url }) => ({ tag, title, publishedAt, url }))
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Releases unavailable' })
  }
})
