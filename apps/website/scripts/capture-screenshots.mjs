import { chromium, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, rm, readFile, writeFile, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    version: { type: 'string' },
    output: { type: 'string' },
    'base-url': { type: 'string' },
    overwrite: { type: 'boolean', default: false },
  },
})
const manifest = JSON.parse(
  await readFile(
    process.env.DOCS_MANIFEST || new URL('../../../docs/versions.json', import.meta.url),
    'utf8',
  ),
)
const version = manifest.versions.find((item) => item.id === values.version)
if (!version) throw new Error('Pass --version with a documentation manifest version')
if (process.env.REGISTRY_SOURCE) {
  const actual = execFileSync('git', ['-C', process.env.REGISTRY_SOURCE, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim()
  if (actual !== version.revision) throw new Error('Capture source revision mismatch')
}
const baseURL = values['base-url'] || process.env.UI_BASE_URL || 'http://localhost:3000'
const output =
  values.output || process.env.CAPTURE_OUTPUT
    ? resolve(values.output || process.env.CAPTURE_OUTPUT)
    : fileURLToPath(new URL(`../public/images/docs/${version.id}/`, import.meta.url))
const { monitoring: modern, accounts, userActions, overviewRoute } = version.captures
const username = process.env.UI_SCREENSHOT_USERNAME
const password = process.env.UI_SCREENSHOT_PASSWORD
if (Boolean(username) !== Boolean(password))
  throw new Error('Set both UI_SCREENSHOT_USERNAME and UI_SCREENSHOT_PASSWORD')
const routes = [
  ['repositories', overviewRoute],
  ['image', '/image/alpine/tag/latest'],
  ...(modern
    ? [
        ['monitoring', '/home'],
        ['settings', '/settings'],
      ]
    : []),
  ...(accounts
    ? [
        ['users', '/users'],
        ['account', '/account'],
      ]
    : []),
]
const files = routes.flatMap(([name]) => ['light', 'dark'].map((mode) => `${name}-${mode}.webp`))
if (accounts) files.push('login-light.webp', 'login-dark.webp')
if (userActions)
  for (const name of ['user-actions', 'user-password', 'user-delete'])
    for (const mode of ['light', 'dark']) files.push(`${name}-${mode}.webp`)
if (!values.overwrite)
  for (const name of [...files, 'capture.json']) {
    if (
      await access(join(output, name)).then(
        () => true,
        () => false,
      )
    )
      throw new Error(`Refusing to replace ${name}; use --overwrite after review`)
  }
await mkdir(output, { recursive: true })
const temporary = await mkdtemp(join(tmpdir(), 'crateview-screenshots-'))
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
})
async function capture(page, name, colorScheme) {
  await page.evaluate(() => document.fonts.ready)
  const png = join(temporary, `${name}-${colorScheme}.png`)
  await page.screenshot({ path: png, animations: 'disabled' })
  execFileSync('cwebp', [
    '-quiet',
    '-q',
    '90',
    png,
    '-o',
    join(output, `${name}-${colorScheme}.webp`),
  ])
  console.log(`Captured ${version.id}/${name}-${colorScheme}.webp`)
}
try {
  for (const colorScheme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 1360, height: 880 },
      deviceScaleFactor: 1,
      locale: 'en-US',
      colorScheme,
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    if (username) {
      await page.goto(new URL('/login', baseURL).href)
      await expect(page.getByLabel('Username', { exact: true })).toBeVisible()
      if (accounts) await capture(page, 'login', colorScheme)
      await page.getByLabel('Username', { exact: true }).fill(username)
      await page.getByLabel('Password', { exact: true }).fill(password)
      await page.getByRole('button', { name: 'Sign in', exact: true }).click()
      await expect(page).not.toHaveURL(/\/login$/)
    } else if (accounts) throw new Error('Account captures require fixture login credentials')
    for (const [name, route] of routes) {
      await page.goto(new URL(route, baseURL).href)
      await expect(page.locator('html')).toHaveClass(new RegExp(colorScheme))
      await expect(page.getByText('Registry connected', { exact: true })).toBeVisible()
      if (name === 'repositories') {
        await expect(page.locator('a[href="/image/alpine"]').first()).toBeVisible()
        await expect(page.getByText('linux/amd64').first()).toBeVisible()
      } else if (name === 'image')
        await expect(page.getByText(/alpine-minirootfs/).first()).toBeVisible()
      else if (name === 'monitoring') {
        await expect(page).toHaveURL(/\/home$/)
        await expect(page.getByText('Probe latency', { exact: true })).toBeVisible()
        await expect
          .poll(
            async () =>
              (await page.request.get(new URL('/api/monitoring/overview', baseURL).href))
                .json()
                .then((data) => Boolean(data.latest?.storage)),
            { timeout: 150000, message: 'Wait for two real metrics samples before capturing' },
          )
          .toBe(true)
      } else if (name === 'settings')
        await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible()
      else if (name === 'users') {
        await expect(page.getByRole('button', { name: 'Create user', exact: true })).toBeVisible()
        await expect(page.getByRole('cell').filter({ hasText: username }).first()).toBeVisible()
        await expect(page.getByText('Loading…', { exact: true })).toBeHidden()
      } else if (name === 'account')
        await expect(page.getByLabel('Current password', { exact: true })).toBeVisible()
      await capture(page, name, colorScheme)
      if (name === 'users' && userActions) {
        const otherUser = page.getByRole('row').filter({
          has: page.getByRole('cell', { name: 'developer', exact: true }),
        })
        await otherUser.getByRole('button', { name: 'Actions', exact: true }).click()
        await expect(page.getByRole('menuitem', { name: 'Delete user', exact: true })).toBeVisible()
        await capture(page, 'user-actions', colorScheme)
        await page.getByRole('menuitem', { name: 'Change password', exact: true }).click()
        const dialog = page.getByRole('dialog')
        await expect(dialog.getByLabel('Username', { exact: true })).toHaveValue('developer')
        await capture(page, 'user-password', colorScheme)
        await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
        await otherUser.getByRole('button', { name: 'Actions', exact: true }).click()
        await page.getByRole('menuitem', { name: 'Delete user', exact: true }).click()
        await expect(dialog).toContainText('Delete user developer?')
        await capture(page, 'user-delete', colorScheme)
        await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
      }
    }
    await context.close()
  }
  await writeFile(
    join(output, 'capture.json'),
    JSON.stringify(
      {
        version: version.id,
        revision: version.revision,
        release: version.release,
        viewport: { width: 1360, height: 880 },
        locale: 'en-US',
        capturedAt: new Date().toISOString(),
        ...(process.env.CAPTURE_FIXTURE_IMAGE
          ? { fixtureImage: process.env.CAPTURE_FIXTURE_IMAGE }
          : {}),
        files,
      },
      null,
      2,
    ) + '\n',
  )
} finally {
  await browser.close()
  await rm(temporary, { recursive: true, force: true })
}
