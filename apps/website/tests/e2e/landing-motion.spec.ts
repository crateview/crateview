import { expect, test } from '@playwright/test'
import { docPath, stableDocVersion } from '../../shared/docs'

const variants = [
  { locale: 'en', width: 1440, colorScheme: 'light' },
  { locale: 'de', width: 1440, colorScheme: 'dark' },
  { locale: 'ar', width: 1440, colorScheme: 'light' },
  { locale: 'en', width: 390, colorScheme: 'dark' },
  { locale: 'de', width: 390, colorScheme: 'light' },
  { locale: 'ar', width: 390, colorScheme: 'dark' },
] as const

for (const variant of variants) {
  test(`landing network and reveals: ${variant.locale} ${variant.width}px ${variant.colorScheme}`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (/hydration/i.test(message.text())) errors.push(message.text())
    })
    await page.setViewportSize({ width: variant.width, height: 900 })
    await page.emulateMedia({ colorScheme: variant.colorScheme, reducedMotion: 'no-preference' })
    await page.goto(variant.locale === 'en' ? '/' : `/${variant.locale}`)
    await expect(page.locator('html')).toHaveAttribute('lang', variant.locale)
    const network = page.locator('svg.hero-network')
    await expect(network).toBeVisible()
    await expect(network).toHaveAttribute('aria-hidden', 'true')
    await expect(network).toHaveCSS('pointer-events', 'none')
    await expect(network.locator('.network-flow').first()).toHaveCSS(
      'animation-name',
      'registry-flow',
    )
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const features = page.locator('#features')
    await features.scrollIntoViewIfNeeded()
    await expect(features).toHaveClass(/is-revealed/)
    await expect(features).toHaveCSS('animation-name', 'landing-enter')
    await expect(page.locator('.feature-card')).toHaveCount(6)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({
      path: `.dev/modernization/${variant.locale}-${variant.width}-${variant.colorScheme}.png`,
      animations: 'disabled',
    })
    expect(errors).toEqual([])
  })
}

test('reduced motion leaves landing content visible and static', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const selector of ['.hero-content', '.network-flow', '.network-pulse']) {
    await expect(page.locator(selector).first()).toHaveCSS('animation-name', 'none')
  }
  await page.locator('#features').scrollIntoViewIfNeeded()
  await expect(page.locator('#features')).toHaveCSS('animation-name', 'none')
  await expect(page.locator('#features')).toHaveCSS('opacity', '1')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.reload()
  await expect(page.locator('.network-flow').first()).toHaveCSS('animation-name', 'registry-flow')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.network-flow').first()).toHaveCSS('animation-name', 'none')
})

test('landing content remains available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.locator('#features').scrollIntoViewIfNeeded()
  await expect(page.locator('#features')).toHaveCSS('opacity', '1')
  await expect(page.locator('.feature-card')).toHaveCount(6)
  await context.close()
})

test('circuit TOC tracks scrolling and nested anchor navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(docPath(stableDocVersion, 'installation'))
  const toc = page.locator('aside').last().locator('nav')
  const indicator = toc.locator('[data-slot="indicator"]')
  await expect(indicator).toBeVisible()
  await expect(indicator).not.toHaveCSS('mask-image', 'none')
  for (const heading of [page.locator('article h2').nth(1), page.locator('article h3').first()]) {
    const id = await heading.getAttribute('id')
    const link = toc.locator(`a[href="#${id}"]`)
    await link.click()
    await expect(page).toHaveURL(new RegExp(`#${id}$`))
    await expect(link).toHaveClass(/text-primary/)
    await expect(toc.locator('[data-slot="indicatorActive"]')).toBeVisible()
  }
  const first = page.locator('article h2').first()
  await first.scrollIntoViewIfNeeded()
  const firstId = await first.getAttribute('id')
  await expect(toc.locator(`a[href="#${firstId}"]`)).toHaveClass(/text-primary/)
})
