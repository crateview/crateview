import { expect, test, type Page } from '@playwright/test'

async function preview(page: Page) {
  await page.goto('/')
  const region = page.locator('.product-preview')
  await region.scrollIntoViewIfNeeded()
  await page.mouse.move(0, 0)
  await expect(region).toHaveAttribute('data-playing', 'true')
  return region
}

test('tabs slide horizontally without fading and keep themed screenshots', async ({ page }) => {
  const region = await preview(page)
  const track = region.locator('.preview-track')
  const active = region.locator('.preview-slide.is-active')
  await expect(track).toHaveCSS('transition-property', 'transform')
  await expect(track).toHaveCSS('transition-duration', '0.4s')
  await region.getByRole('button', { name: 'Repositories', exact: true }).click()
  await expect(active.locator('.preview-light')).toHaveAttribute('src', /repositories-light.webp$/)
  await expect(track).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
  for (const slide of await region.locator('.preview-slide').all()) {
    await expect(slide).toHaveCSS('opacity', '1')
  }
  await region.getByRole('button', { name: 'Dashboard', exact: true }).click()
  await expect(active.locator('.preview-dark')).toHaveAttribute('src', /monitoring-dark.webp$/)
  await expect(active).toHaveAttribute('aria-hidden', 'false')
  await expect
    .poll(async () => {
      const frame = await region.locator('.aspect-\\[17\\/11\\]').boundingBox()
      const slide = await active.boundingBox()
      return Math.abs(frame!.x - slide!.x)
    })
    .toBeLessThan(1)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(region).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('autoplay wraps and pauses for hover, focus, controls, visibility and offscreen', async ({
  page,
}) => {
  await page.clock.install()
  const region = await preview(page)
  const selected = () => region.locator('.preview-slide.is-active img.preview-light')
  await page.clock.fastForward(6000)
  await expect(selected()).toHaveAttribute('src', /monitoring-light.webp$/)
  await page.clock.fastForward(6000)
  await expect(selected()).toHaveAttribute('src', /repositories-light.webp$/)
  await region.hover()
  await expect(region).toHaveAttribute('data-playing', 'false')
  await page.clock.fastForward(12000)
  await expect(selected()).toHaveAttribute('src', /repositories-light.webp$/)
  await page.mouse.move(0, 0)
  await region.getByRole('button', { name: 'Image details', exact: true }).focus()
  await expect(region).toHaveAttribute('data-playing', 'false')
  await page.clock.fastForward(12000)
  await expect(selected()).toHaveAttribute('src', /repositories-light.webp$/)
  await page
    .getByTestId('theme-switch')
    .evaluate((element) => element.focus({ preventScroll: true }))
  await expect(region).toHaveAttribute('data-playing', 'true')
  await region.getByRole('button', { name: 'Pause slideshow', exact: true }).click()
  await page
    .getByTestId('theme-switch')
    .evaluate((element) => element.focus({ preventScroll: true }))
  await page.mouse.move(0, 0)
  await expect(region).toHaveAttribute('data-playing', 'false')
  await page.clock.fastForward(12000)
  await expect(selected()).toHaveAttribute('src', /repositories-light.webp$/)
  await region.getByRole('button', { name: 'Play slideshow', exact: true }).click()
  await page
    .getByTestId('theme-switch')
    .evaluate((element) => element.focus({ preventScroll: true }))
  await page.mouse.move(0, 0)
  await expect(region).toHaveAttribute('data-playing', 'true')
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(region).toHaveAttribute('data-playing', 'false')
  await page.clock.fastForward(12000)
  await expect(selected()).toHaveAttribute('src', /repositories-light.webp$/)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(region).toHaveAttribute('data-playing', 'true')
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(region).toHaveAttribute('data-playing', 'false')
  await page.clock.fastForward(12000)
  await expect(selected()).toHaveAttribute('src', /repositories-light.webp$/)
})

test('reduced motion keeps manual selection without movement or autoplay in RTL', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' })
  await page.goto('/ar')
  const region = page.locator('.product-preview')
  await region.scrollIntoViewIfNeeded()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(region).toHaveAttribute('data-playing', 'false')
  await expect(region.locator('.preview-track')).toHaveCSS('transition-duration', '0s')
  const buttons = region.getByRole('button')
  await expect(buttons).toHaveCount(3)
  await buttons.first().click()
  await expect(region.locator('.preview-slide.is-active .preview-dark')).toHaveAttribute(
    'src',
    /repositories-dark.webp$/,
  )
  const frame = await region.locator('.preview-track').boundingBox()
  const active = await region.locator('.preview-slide.is-active').boundingBox()
  expect(Math.abs(frame!.x - active!.x)).toBeLessThan(1)
})
