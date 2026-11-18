import { expect, test } from '@playwright/test'

test('terminal highlighting follows theme, updates commands and preserves copied source', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  const code = page.locator('.code-block code')
  const token = code.locator('span[style*="--shiki-light"]').first()
  await expect(token).toBeVisible()
  const light = await token.evaluate((element) => getComputedStyle(element).color)
  await page.getByTestId('theme-switch').click()
  await page.getByTestId('theme-switch').click()
  await expect(page.getByTestId('theme-switch')).toHaveAccessibleName('Color mode: Dark')
  await expect
    .poll(() => token.evaluate((element) => getComputedStyle(element).color))
    .not.toBe(light)
  const initial = await code.textContent()
  await page.getByRole('button', { name: 'Existing registry', exact: true }).click()
  await expect(code).not.toHaveText(initial!)
  await expect(token).toBeVisible()
  const source = await code.textContent()
  await page.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(source)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('documentation highlights shell, dotenv and YAML in both themes', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/docs/v0.4/operations')
  const token = page
    .locator('.docs-article pre.shiki code span')
    .filter({ hasText: 'storage' })
    .first()
  await expect(token).toBeVisible()
  const light = await token.evaluate((element) => getComputedStyle(element).color)
  await page.getByTestId('theme-switch').click()
  await page.getByTestId('theme-switch').click()
  await expect(page.getByTestId('theme-switch')).toHaveAccessibleName('Color mode: Dark')
  await expect
    .poll(() => token.evaluate((element) => getComputedStyle(element).color))
    .not.toBe(light)
  await page.goto('/docs/v0.4/installation')
  await expect(page.locator('.docs-article pre.shiki').first()).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
