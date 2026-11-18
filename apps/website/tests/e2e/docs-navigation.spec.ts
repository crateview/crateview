import { expect, test } from '@playwright/test'

test('toolbar sections filter the native content sidebar and keep version selection on the right', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/docs/v0.4/overview')
  const toolbar = page.locator('.docs-toolbar')
  const sidebar = page.locator('aside').first()
  await expect(toolbar.getByRole('link')).toHaveText(['Get started', 'Guides', 'Releases'])
  await expect(toolbar.getByRole('link', { name: 'Get started', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(sidebar.getByRole('link')).toHaveText(['Overview', 'Installation', 'Configuration'])
  await expect(page.locator('article').getByRole('combobox')).toHaveCount(0)
  const version = toolbar.getByRole('combobox', { name: 'Documentation version' })
  expect((await version.boundingBox())!.x).toBeGreaterThan(
    (await toolbar.getByRole('navigation').boundingBox())!.x,
  )
  await toolbar.getByRole('link', { name: 'Guides', exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/v0.4\/authentication$/)
  await expect(toolbar.getByRole('link', { name: 'Guides', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(sidebar.getByRole('link', { name: 'Overview', exact: true })).toHaveCount(0)
  await sidebar.getByRole('link', { name: 'Using Crateview', exact: true }).click()
  await expect(page).toHaveURL(/\/usage$/)
  await version.click()
  await page.getByRole('option', { name: 'v0.1', exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/v0.1\/usage$/)
  await expect(toolbar.getByRole('link', { name: 'Guides', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await page.screenshot({ path: '.dev/docs-navigation-desktop.png', fullPage: false })
})

test('mobile toolbar and filtered document selector preserve RTL and locale', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/ar/docs/v0.4/usage')
  const toolbar = page.locator('.docs-toolbar')
  await expect(toolbar.getByRole('link')).toHaveCount(3)
  await expect(toolbar.getByRole('combobox')).toBeVisible()
  await expect(page.locator('article').getByRole('combobox')).toBeVisible()
  await toolbar.getByRole('link').first().click()
  await expect(page).toHaveURL(/\/ar\/docs\/v0.4\/overview$/)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: '.dev/docs-navigation-mobile.png', fullPage: true })
})

test('release tab opens an internal changelog with version navigation and circuit TOC', async ({
  page,
}) => {
  const releases = [
    {
      tag: 'v0.5.0',
      title: 'v0.5.0',
      publishedAt: '2026-11-02T10:00:00Z',
      url: 'https://github.com/crateview/registry-ui/releases/tag/v0.5.0',
    },
    {
      tag: 'v0.4.0',
      title: 'v0.4.0',
      publishedAt: '2026-10-30T10:00:00Z',
      url: 'https://github.com/crateview/registry-ui/releases/tag/v0.4.0',
    },
  ]
  await page.route('**/api/releases', (route) => route.fulfill({ json: releases }))
  await page.route('**/api/releases/*', (route) => {
    const tag = new URL(route.request().url()).pathname.split('/').at(-1)
    return route.fulfill({
      json: {
        ...releases.find((release) => release.tag === tag),
        document: {
          body: {
            type: 'root',
            children: [
              {
                type: 'element',
                tag: 'h2',
                props: { id: 'fixes' },
                children: [{ type: 'text', value: 'Fixes' }],
              },
              {
                type: 'element',
                tag: 'p',
                props: {},
                children: [{ type: 'text', value: 'Improved documentation navigation.' }],
              },
            ],
          },
          toc: { links: [{ id: 'fixes', depth: 2, text: 'Fixes' }] },
        },
      },
    })
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/docs/v0.4/overview')
  await page.waitForFunction(
    "document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false",
  )
  await page.locator('.docs-toolbar').getByRole('link', { name: 'Releases', exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/releases$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('v0.5.0')
  await expect(page.getByRole('heading', { name: 'Fixes', exact: true })).toBeVisible()
  await expect(page.locator('aside').last().locator('[data-slot="indicator"]')).toBeVisible()
  await page.locator('aside').first().getByRole('link', { name: 'v0.4.0', exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/releases\/v0.4.0$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('v0.4.0')
  await expect(
    page.locator('article').getByRole('link', { name: 'View on GitHub' }),
  ).toHaveAttribute('href', releases[1]!.url)
})

test('release failures can be retried and empty feeds have an explicit state', async ({ page }) => {
  let fail = true
  await page.route('**/api/releases', (route) =>
    fail
      ? route.fulfill({ status: 502, json: { message: 'Unavailable' } })
      : route.fulfill({ json: [] }),
  )
  await page.goto('/docs/v0.4/overview')
  await page.waitForFunction(
    "document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false",
  )
  await page.locator('.docs-toolbar').getByRole('link', { name: 'Releases', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Release notes are currently unavailable.')
  fail = false
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.getByText('No releases published yet.', { exact: true })).toBeVisible()
})
