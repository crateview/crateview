import { expect, test } from '@playwright/test'
import { stableDocVersion, docVersionsByNewest, docPath } from '../../shared/docs'

test('latest released documentation is the default and versions descend', async ({ page }) => {
  await page.goto('/docs')
  await expect(page).toHaveURL(new RegExp(`/docs/${stableDocVersion}/overview$`))
  const selector = page.locator('.docs-toolbar').getByRole('combobox')
  await expect(selector).toContainText(stableDocVersion)
  await selector.click()
  await expect(page.getByRole('option')).toHaveText(
    docVersionsByNewest.map((version) => version.id),
  )
})

test('documentation toolbar stays compact on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1111, height: 1131 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto(docPath(stableDocVersion))
  const toolbar = page.locator('.docs-toolbar')
  expect((await toolbar.boundingBox())!.height).toBeLessThanOrEqual(45)
  const navigation = toolbar.getByRole('navigation')
  expect(
    await navigation.evaluate(
      (node) => node.scrollWidth <= node.clientWidth && node.scrollHeight <= node.clientHeight + 1,
    ),
  ).toBe(true)
  await page.screenshot({
    path: '.dev/docs-toolbar-refined.png',
    clip: { x: 0, y: 0, width: 1111, height: 180 },
  })
  await page.setViewportSize({ width: 320, height: 844 })
  expect(
    await navigation.evaluate(
      (node) => node.scrollWidth <= node.clientWidth && node.scrollHeight <= node.clientHeight + 1,
    ),
  ).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('documentation screenshots are local, load, and follow explicit theme selection', async ({
  page,
}) => {
  await page.route('https://crateview.de/images/**', (route) => route.abort())
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/docs/v0.4/overview')
  for (const mode of ['Light', 'Dark']) {
    await page.getByTestId('theme-switch').click()
    await expect(page.getByTestId('theme-switch')).toHaveAccessibleName(`Color mode: ${mode}`)
    const screenshot = page.locator('article img:visible').first()
    await expect(screenshot).toHaveAttribute(
      'src',
      new RegExp(`^/images/docs/v0.4/repositories-${mode.toLowerCase()}.webp$`),
    )
    await expect
      .poll(() => screenshot.evaluate((img) => (img as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0)
  }
})
