import { expect, test } from '@playwright/test'
import { docVersions, docVersionsByNewest, stableDocVersion, docPath } from '../../shared/docs'
import { supportedLocales, localizedPath } from '../../shared/locales'

for (const version of docVersions) {
  test(`${version.id}: all languages render version-specific canonical pages`, async ({
    request,
  }) => {
    for (const locale of supportedLocales)
      for (const slug of version.slugs) {
        const path = localizedPath(locale.code, docPath(version.id, slug))
        const response = await request.get(path)
        expect(response.status(), path).toBe(200)
        const html = await response.text()
        expect(html).toContain(`href="https://crateview.de${path}"`)
        expect(html).toContain(
          `https://github.com/crateview/crateview/edit/main/docs/${locale.code}/docs/${version.id}/${slug}.md`,
        )
        expect(html.includes('content="noindex, follow"')).toBe(version.id === 'next')
      }
  })
}

test('legacy URLs redirect temporarily, preserving locale and query', async ({ request, page }) => {
  for (const path of ['/docs/usage', '/de/docs/usage', '/ar/docs/usage']) {
    const response = await request.get(path + '?from=old', { maxRedirects: 0 })
    expect(response.status()).toBe(302)
    expect(response.headers().location).toBe(
      path.replace('/docs/', `/docs/${stableDocVersion}/`) + '?from=old',
    )
  }
  await page.goto('/de/docs/usage#pull-befehle')
  await expect(page).toHaveURL(new RegExp(`/de/docs/${stableDocVersion}/usage#pull-befehle$`))
})

test('version switching preserves document and language, missing pages recover explicitly', async ({
  page,
}) => {
  await page.goto('/docs/v0.4/usage')
  await page.waitForFunction(
    "document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false",
  )
  await page.getByRole('combobox', { name: 'Documentation version', exact: true }).click()
  await expect(page.getByRole('option')).toHaveText(
    docVersionsByNewest.map((version) => version.id),
  )
  await page.getByRole('option', { name: 'v0.1', exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/v0.1\/usage$/)
  await expect(page.getByText('Archived documentation.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Language', exact: true }).click()
  await page.getByRole('menuitemcheckbox', { name: 'Deutsch', exact: true }).click()
  await expect(page).toHaveURL(/\/de\/docs\/v0.1\/usage$/)
  await page.goto('/docs/v0.4/monitoring')
  await page.getByRole('combobox', { name: 'Documentation version', exact: true }).click()
  await page.getByRole('option', { name: 'v0.3', exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/v0.3\/overview\?missing=monitoring$/)
  await expect(page.getByText('This page is unavailable', { exact: false })).toBeVisible()
})

test('search never mixes version results and refreshes after a version change', async ({
  page,
}) => {
  await page.goto('/docs/v0.4/overview')
  for (const version of ['v0.1', stableDocVersion, 'v0.4']) {
    await page.getByRole('combobox', { name: 'Documentation version', exact: true }).click()
    await page.getByRole('option', { name: version, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/docs/${version}/overview$`))
    await expect(page.locator('meta[name=robots]')).toHaveCount(0)
    await page.getByRole('button', { name: 'Search documentation', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox').fill('htpasswd')
    await expect(dialog.getByRole('link').first()).toBeVisible()
    for (const href of await dialog
      .getByRole('link')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href'))))
      expect(href).toMatch(new RegExp(`^/docs/${version}/`))
    await page.keyboard.press('Escape')
  }
})

test('unknown versions and unavailable guides return 404', async ({ request }) => {
  for (const path of [
    '/docs/v99/overview',
    '/docs/v0.1/monitoring',
    '/docs/next/missing',
    '/docs/unknown',
  ])
    expect((await request.get(path)).status(), path).toBe(404)
})

test('sitemap and robots publish every localized release route but no preview', async ({
  request,
}) => {
  const base = 'https://crateview.de'
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBe(true)
  const expected = supportedLocales.flatMap(({ code }) =>
    [
      '/docs/releases',
      ...docVersions.flatMap(({ id, slugs }) => slugs.map((slug) => docPath(id, slug))),
    ].map((path) => base + localizedPath(code, path)),
  )
  const found = [...(await sitemap.text()).matchAll(/<loc>([^<]+\/docs\/[^<]+)<\/loc>/g)].map(
    ([, url]) => url,
  )
  expect(found.sort()).toEqual(expected.sort())
  const robots = await request.get('/robots.txt')
  expect(robots.ok()).toBe(true)
  expect(await robots.text()).toContain(`Sitemap: ${base}/sitemap.xml`)
})

test('mobile version selection preserves RTL, language and fragment', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/ar/docs/v0.4/usage#example')
  await page.locator('.docs-toolbar').getByRole('combobox').click()
  await page.getByRole('option', { name: 'v0.1', exact: true }).click()
  await expect(page).toHaveURL(/\/ar\/docs\/v0\.1\/usage#example$/)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('all source-matched screenshots are served as real WebP assets', async ({ request }) => {
  for (const version of docVersions) {
    const metadata = await request.get(`/images/docs/${version.id}/capture.json`)
    expect(metadata.status()).toBe(200)
    const capture = await metadata.json()
    expect(capture.revision).toBe(version.revision)
    for (const file of capture.files) {
      const response = await request.get(`/images/docs/${version.id}/${file}`)
      expect(response.status(), file).toBe(200)
      expect(response.headers()['content-type']).toContain('image/webp')
      expect((await response.body()).byteLength).toBeGreaterThan(5000)
    }
  }
})

test('next is internal in every language, including direct overview URLs', async ({ request }) => {
  for (const locale of supportedLocales)
    for (const path of ['/docs/next', '/docs/next/overview', '/docs/next/installation'])
      expect((await request.get(localizedPath(locale.code, path))).status()).toBe(404)
  expect((await request.get('/images/docs/next/capture.json')).status()).toBe(404)
})
