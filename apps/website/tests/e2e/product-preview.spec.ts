import { expect, test } from '@playwright/test'
import { stableDocVersion } from '../../shared/docs'

test('preview cycles through dashboard, repositories and image details every six seconds', async ({
  page,
}) => {
  await page.clock.install()
  await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: 'light' })
  await page.goto('/')
  const preview = page.locator('.product-preview')
  await preview.scrollIntoViewIfNeeded()
  await page.mouse.move(0, 0)
  await expect(preview).toHaveAttribute('data-playing', 'true')
  const active = preview.locator('.preview-slide.is-active')
  await expect(active.locator('img.preview-light')).toHaveAttribute(
    'src',
    `/images/docs/${stableDocVersion}/image-light.webp`,
  )
  const height = (await preview.boundingBox())!.height
  for (const slide of ['monitoring', 'repositories', 'image']) {
    await page.clock.runFor(6000)
    await expect(active.locator('img.preview-light')).toHaveAttribute(
      'src',
      `/images/docs/${stableDocVersion}/${slide}-light.webp`,
    )
    await expect
      .poll(() =>
        active
          .locator('img.preview-light')
          .evaluate((node) => (node as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0)
    expect((await preview.boundingBox())!.height).toBeCloseTo(height, 1)
  }
  await expect(preview.locator('.preview-track')).toHaveCSS('transition-duration', '0.4s')
})

test('manual selection, hover, keyboard focus and pause control stop automatic switching', async ({
  page,
}) => {
  await page.clock.install()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const preview = page.locator('.product-preview')
  await preview.scrollIntoViewIfNeeded()
  await preview.getByRole('button', { name: 'Dashboard', exact: true }).click()
  await expect(preview.getByRole('button', { name: 'Dashboard', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.clock.runFor(12000)
  await expect(preview.getByRole('button', { name: 'Dashboard', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await preview.getByRole('button', { name: 'Pause slideshow', exact: true }).click()
  await page.locator('h1').click()
  await page.mouse.move(0, 0)
  await expect(preview).toHaveAttribute('data-playing', 'false')
  await page.clock.runFor(12000)
  await expect(preview.getByRole('button', { name: 'Dashboard', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await preview.getByRole('button', { name: 'Play slideshow', exact: true }).click()
  await page.locator('h1').click()
  await preview.scrollIntoViewIfNeeded()
  await page.mouse.move(0, 0)
  await expect(preview).toHaveAttribute('data-playing', 'true')
  await preview.hover()
  await expect(preview).toHaveAttribute('data-playing', 'false')
  await page.clock.runFor(12000)
  await expect(preview.getByRole('button', { name: 'Dashboard', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.mouse.move(0, 0)
  await expect(preview).toHaveAttribute('data-playing', 'true')
  await page.clock.runFor(6000)
  await expect(preview.getByRole('button', { name: 'Repositories', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('reduced motion keeps manual slides static and theme-aware on mobile', async ({ page }) => {
  await page.clock.install()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
  await page.goto('/')
  const preview = page.locator('.product-preview')
  await preview.scrollIntoViewIfNeeded()
  await expect(preview).toHaveAttribute('data-playing', 'false')
  await expect(preview.getByRole('button', { name: 'Pause slideshow', exact: true })).toHaveCount(0)
  await preview.getByRole('button', { name: 'Dashboard', exact: true }).click()
  const active = preview.locator('.preview-slide.is-active')
  await expect(preview.locator('.preview-track')).toHaveCSS('transition-duration', '0s')
  await expect(active.locator('img.preview-light')).toBeVisible()
  await page.clock.runFor(18000)
  await expect(preview.getByRole('button', { name: 'Dashboard', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(active.locator('img.preview-dark')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(preview.getByRole('button', { name: 'Pause slideshow', exact: true })).toBeVisible()
  await page.screenshot({ path: '.dev/preview-dashboard-mobile.png', animations: 'disabled' })
})
