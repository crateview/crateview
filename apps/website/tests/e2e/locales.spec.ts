import { expect, test } from '@playwright/test'
import { supportedLocales, localizedPath } from '../../shared/locales'
for (const locale of supportedLocales) {
  test(`${locale.code}: direct docs, search, mobile layout and technical text`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(localizedPath(locale.code, '/docs/v0.4/installation'))
    await page.waitForFunction(
      "document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false",
    )
    await expect(page.locator('html')).toHaveAttribute('lang', locale.code)
    await expect(page.locator('html')).toHaveAttribute('dir', locale.dir)
    await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(page.locator('pre').first()).toContainText('openssl rand -base64 32')
    expect(
      await page
        .locator('pre')
        .first()
        .evaluate((node) => getComputedStyle(node).direction),
    ).toBe('ltr')
    await page.keyboard.press('/')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('textbox').fill('htpasswd')
    const result = dialog.getByRole('link').first()
    await expect(result).toBeVisible()
    await expect(result).toHaveAttribute(
      'href',
      new RegExp(`^${locale.code === 'en' ? '' : '/' + locale.code}/docs/v0.4/`),
    )
    await result.click()
    await expect(dialog).toBeHidden()
  })
}

test('language selection preserves the document, switches RTL and persists the cookie', async ({
  page,
  context,
}) => {
  await page.goto('/docs/v0.4/usage')
  await page.waitForFunction(
    "document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false",
  )
  for (const code of ['ar', 'ur', 'zh-CN', 'pt-BR', 'en']) {
    const trigger = page.getByTestId('language-switch')
    await expect(trigger).toHaveText('')
    await trigger.press('Enter')
    await expect(page.getByRole('menuitemcheckbox')).toHaveCount(supportedLocales.length)
    await page
      .getByRole('menuitemcheckbox', {
        name: supportedLocales.find((item) => item.code === code)!.name,
        exact: true,
      })
      .click()
    await expect(page).toHaveURL(new RegExp(localizedPath(code, '/docs/v0.4/usage') + '$'))
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      code === 'ar' || code === 'ur' ? 'rtl' : 'ltr',
    )
    await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty()
    await expect
      .poll(
        async () =>
          (await context.cookies()).find((cookie) => cookie.name === 'crateview-language')?.value,
      )
      .toBe(code)
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', code)
    await page.waitForFunction(
      "document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false",
    )
  }
})
