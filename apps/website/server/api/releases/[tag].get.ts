import { parseMarkdown } from '@nuxtjs/mdc/runtime'

const getReleaseDocument = defineCachedFunction(
  async (tag: string) => {
    const release = (await getReleases()).find((item) => item.tag === tag)
    if (!release) throw createError({ statusCode: 404, statusMessage: 'Release not found' })
    const document = await parseMarkdown(release.markdown, {
      remark: { plugins: { 'remark-mdc': false } },
      rehype: { options: { allowDangerousHtml: false }, plugins: { 'rehype-raw': false } },
      toc: { depth: 3, searchDepth: 3 },
    })
    return { ...release, document }
  },
  { name: 'registry-release-document', maxAge: 3600 },
)

export default defineEventHandler(async (event) => {
  const tag = getRouterParam(event, 'tag') || ''
  if (!/^v?\d+\.\d+\.\d+$/.test(tag))
    throw createError({ statusCode: 404, statusMessage: 'Release not found' })
  try {
    return await getReleaseDocument(tag)
  } catch (error) {
    if (isError(error) && error.statusCode === 404) throw error
    throw createError({ statusCode: 502, statusMessage: 'Releases unavailable' })
  }
})
