import { expect, test } from '@playwright/test'
import manifest from '../../package.json' with { type: 'json' }
import { docSlugs, docVersions, stableDocVersion } from '../../shared/docs'
import { supportedLocales } from '../../shared/locales'

const version = manifest.version
const footerVersionPattern = new RegExp(`>v${RegExp.escape(version)}<`, 'g')

test('server renders all landing pages and all documentation, with SEO and sitemap', async ({
  request,
}) => {
  for (const locale of supportedLocales) {
    const prefix = locale.code === 'en' ? '' : `/${locale.code}`
    for (const path of [
      '/',
      '/imprint',
      '/privacy-policy',
      ...docSlugs.map((slug) => `/docs/v0.4/${slug}`),
    ]) {
      const url = prefix + (prefix && path === '/' ? '' : path)
      const response = await request.get(url, { headers: { 'Accept-Language': 'en' } })
      expect(response.status(), url).toBe(200)
      const html = await response.text()
      expect(html).toMatch(new RegExp(`<html\\s+[^>]*lang="${locale.code}"`))
      expect(html).toContain('<h1')
      expect(html).toContain('rel="canonical"')
      expect(html).toContain('hreflang="de-DE"')
      expect(html).toContain(`dir="${locale.dir}"`)
      const footer = html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)?.[1] ?? ''
      expect(footer.match(footerVersionPattern) ?? [], url).toHaveLength(1)
      expect(html).toContain('href="https://tobiaswaelde.com"')
      expect(html).toContain(`href="${prefix}/imprint"`)
      expect(html).toContain(`href="${prefix}/privacy-policy"`)
      if (path === '/imprint') {
        expect(html).toContain('Sandhübel 8')
        expect(html).toContain('mailto:business@tobiaswaelde.com')
      }
      if (path === '/privacy-policy') {
        expect(html).toContain('mailto:business@tobiaswaelde.com')
        expect(html).toContain('crateview-language')
        expect(html).toContain('crateview-color-mode')
      }
      if (path.includes('installation')) {
        expect(html).toContain('docker compose pull')
        expect(html).toContain('docker compose up -d')
      }
      if (path.startsWith('/docs/v0.4/')) {
        expect(html).toContain(
          `https://github.com/crateview/crateview/edit/main/docs/${locale.code}${path}.md`,
        )
      }
    }
  }
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  const publishedPages =
    4 +
    docVersions
      .filter((version) => version.status !== 'preview')
      .reduce((total, version) => total + version.slugs.length, 0)
  expect((await sitemap.text()).match(/<loc>/g)).toHaveLength(
    publishedPages * supportedLocales.length,
  )
  expect(await (await request.get('/robots.txt')).text()).toContain(
    'Sitemap: https://crateview.de/sitemap.xml',
  )
})

test('website version stays readable in the shared footer on desktop and narrow RTL pages', async ({
  page,
}) => {
  const footer = page.getByRole('contentinfo')
  const versionText = footer.getByText(`v${version}`, { exact: true })

  await page.goto('/')
  await expect(versionText).toHaveCount(1)
  await expect(versionText).toBeVisible()

  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto(`/ar/docs/${stableDocVersion}/overview`)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(versionText).toHaveCount(1)
  await expect(versionText).toHaveAttribute('dir', 'ltr')
  await versionText.scrollIntoViewIfNeeded()
  await expect(versionText).toBeInViewport()
  await expect(footer.locator('a[href="/ar/imprint"]')).toBeVisible()
})

test('landing navigation, real product previews, copy and FAQ work', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page.waitForFunction(
    "document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false",
  )
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your registry.In focus.')
  await expect(page.locator('header img').first()).toHaveAttribute(
    'src',
    '/branding/crateview-mark-256.png',
  )
  await page.getByRole('button', { name: 'Repositories', exact: true }).click()
  await expect(page.locator('.preview-slide.is-active img.preview-light')).toHaveAttribute(
    'src',
    `/images/docs/${stableDocVersion}/repositories-light.webp`,
  )
  await page.getByRole('button', { name: 'Existing registry', exact: true }).click()
  await page.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Copied', exact: true })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    'NUXT_REGISTRY_UPSTREAM=',
  )
  await page.getByRole('button', { name: 'Does Crateview replace my registry?' }).click()
  await expect(
    page.getByText('No. It runs alongside your registry.', { exact: false }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Get started', exact: true }).first().click()
  await expect(page).toHaveURL(new URL(`/docs/${stableDocVersion}/installation`, page.url()).href)
  await expect(page.getByRole('heading', { name: 'Installation', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('documentation language switch preserves page and choice', async ({ page }) => {
  await page.goto('/docs/v0.4/authentication')
  await page.waitForFunction(
    "document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false",
  )
  await page.getByRole('button', { name: 'Language', exact: true }).click()
  const german = page.getByRole('menuitemcheckbox', { name: 'Deutsch', exact: true })
  await expect(german.getByTestId('language-flag')).toHaveText('🇩🇪')
  await expect(german.getByTestId('language-flag')).toHaveAttribute('aria-hidden', 'true')
  await expect(page.getByTestId('language-flag')).toHaveCount(13)
  await german.click()
  await expect(page).toHaveURL(/\/de\/docs\/v0\.4\/authentication$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Authentifizierung')
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  await page.reload()
  await page.waitForFunction(
    "document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false",
  )
  await page.getByRole('button', { name: 'Sprache', exact: true }).click()
  await expect(
    page.getByRole('menuitemcheckbox', { name: 'Deutsch', exact: true }),
  ).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.press('Escape')
  await page.locator('header a').first().click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Deine Registry.Im Blick.')
})

test('first home visit follows German browser preference', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'de-DE' })
  const page = await context.newPage()
  await page.goto('/')
  await page.waitForFunction(
    "document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false",
  )
  await expect(page).toHaveURL(/\/de$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  await context.close()
})

test('full-text search shortcuts find localized guide sections', async ({ page }) => {
  await page.goto('/de/docs/v0.4/overview')
  await page.waitForFunction(
    "document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false",
  )
  await page.keyboard.press('/')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('textbox').fill('htpasswd')
  const result = dialog
    .getByRole('link')
    .filter({ hasText: /htpasswd|Authentifizierung/i })
    .first()
  await expect(result).toBeVisible()
  await expect(result).toHaveAttribute('href', /\/de\/docs\/v0\.4\//)
  await result.click()
  await expect(page).toHaveURL(/\/de\/docs\/v0\.4\//)
  await expect(dialog).not.toBeVisible()
  await page.keyboard.press('Control+k')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('textbox').fill('no-result-zzzyyyxxx')
  await expect(dialog.getByText('Keine passenden Seiten.', { exact: false })).toBeVisible()
})

test('system mode follows OS, explicit modes survive reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await page.waitForFunction(
    "document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false",
  )
  await expect(page.locator('html')).toHaveClass(/dark/)
  const theme = page.getByTestId('theme-switch')
  await expect(theme).toHaveText('')
  await expect(theme).toHaveAccessibleName('Color mode: System')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await theme.press('Enter')
  await expect(theme).toHaveAccessibleName('Color mode: Light')
  await theme.click()
  await expect(theme).toHaveAccessibleName('Color mode: Dark')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('crateview-color-mode')))
    .toBe('dark')
  await page.reload()
  await page.waitForFunction(
    "document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false",
  )
  await expect(theme).toHaveAccessibleName('Color mode: Dark')
  await theme.click()
  await expect(theme).toHaveAccessibleName('Color mode: System')
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('crateview-color-mode')))
    .toBe('system')
})

test('mobile menu, theme, documentation selector and layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/de')
  await page.waitForFunction(
    "document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false",
  )
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByTestId('theme-switch').click()
  await page.getByTestId('theme-switch').click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.getByRole('button', { name: 'Navigation', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('link', { name: 'Dokumentation', exact: true }).click()
  await expect(page).toHaveURL(new URL(`/de/docs/${stableDocVersion}/overview`, page.url()).href)
  await page.getByRole('combobox', { name: 'Dokumentation', exact: true }).click()
  await page.getByRole('option', { name: 'Installation', exact: true }).click()
  await expect(page).toHaveURL(
    new URL(`/de/docs/${stableDocVersion}/installation`, page.url()).href,
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: '.dev/mobile-docs.png', fullPage: true })
})

test('unknown documentation returns a real 404 and recovery works', async ({ page }) => {
  const response = await page.goto('/docs/v0.4/does-not-exist')
  await page.waitForFunction(
    "document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false",
  )
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await page.getByRole('button', { name: 'Back to the homepage' }).click()
  await expect(page).toHaveURL(/\/$/)
})
