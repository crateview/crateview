import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { getDocVersion, stableDocVersion } from '../../shared/docs'
import { hasPwaSupport, pwaGuideUrl } from '../../app/utils/pwa'

const stable = getDocVersion(stableDocVersion)!.release
for (const scenario of [
  { locale: 'en', prefix: '', dir: 'ltr', width: 1360, height: 880, theme: 'light' },
  { locale: 'de', prefix: '/de', dir: 'ltr', width: 390, height: 844, theme: 'dark' },
  { locale: 'ar', prefix: '/ar', dir: 'rtl', width: 390, height: 844, theme: 'light' },
] as const) {
  test(`PWA release announcement, link and keyboard FAQ (${scenario.locale})`, async ({
    page,
    context,
    baseURL,
  }) => {
    const copy = JSON.parse(
      readFileSync(new URL(`../../i18n/locales/${scenario.locale}.json`, import.meta.url), 'utf8'),
    )
    await page.setViewportSize({ width: scenario.width, height: scenario.height })
    await page.emulateMedia({ colorScheme: scenario.theme, reducedMotion: 'reduce' })
    await context.addCookies([
      { name: 'crateview-color-mode', value: scenario.theme, url: baseURL! },
    ])
    await page.goto(scenario.prefix || '/')
    await page.waitForFunction(
      "document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false",
    )
    await expect(page.locator('html')).toHaveAttribute('dir', scenario.dir)
    const announcement = page.getByTestId('pwa-announcement')
    await announcement.scrollIntoViewIfNeeded()
    await expect(announcement.getByRole('heading')).toHaveText(copy.pwaTitle)
    const expectedText = hasPwaSupport(stable)
      ? copy.pwaAvailable
      : copy.pwaUpcoming.replace('{version}', 'v0.6.0')
    await expect(announcement).toContainText(expectedText)
    const guide = announcement.getByRole('link', { name: copy.pwaReadGuide, exact: true })
    await expect(guide).toHaveAttribute(
      'href',
      pwaGuideUrl(stable, `${scenario.prefix}/docs/${stableDocVersion}/installation`),
    )
    if (hasPwaSupport(stable)) await expect(guide).not.toHaveAttribute('target', '_blank')
    else await expect(guide).toHaveAttribute('target', '_blank')
    await expect(page.locator('a[href*="/docs/next"]')).toHaveCount(0)
    expect(
      await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length),
    ).toBe(0)
    await announcement.screenshot({ path: `test-results/pwa-${scenario.locale}-announcement.png` })
    const question = page.getByRole('button', { name: copy.faqPwaQuestion, exact: true })
    await question.scrollIntoViewIfNeeded()
    await question.focus()
    await page.keyboard.press('Enter')
    await expect(question).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByText(copy.faqPwaDetails, { exact: false })).toBeVisible()
    const status = hasPwaSupport(stable)
      ? copy.faqPwaAvailable
      : copy.faqPwaUpcoming.replace('{version}', 'v0.6.0')
    await expect(page.getByText(status, { exact: false })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    await page.screenshot({ path: `test-results/pwa-${scenario.locale}-faq.png`, fullPage: false })
    await question.press('Enter')
    await expect(question).toHaveAttribute('aria-expanded', 'false')
  })
}
