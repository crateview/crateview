import { supportedLocales, localizedPath } from '../../shared/locales'
import { docVersions, docPath } from '#shared/docs'

export default defineEventHandler((event) => {
  const origin = String(useRuntimeConfig(event).public.siteUrl).replace(/\/$/, '')
  const escape = (value: string) =>
    value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
  const pages = [
    '/',
    '/imprint',
    '/privacy-policy',
    '/docs/releases',
    ...docVersions
      .filter((version) => version.status !== 'preview')
      .flatMap((version) => version.slugs.map((slug) => docPath(version.id, slug))),
  ]
  const urls = pages.flatMap((path) =>
    supportedLocales.map((locale) => localizedPath(locale.code, path)),
  )
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `<url><loc>${escape(origin + path)}</loc></url>`).join('')}</urlset>`
})
