import { expect, test, type Page } from '@playwright/test';

const path = '**/api/registry/garbage-collection';
const labels = {
  start: 'Run garbage collection',
  warning: 'This affects the entire registry and may interrupt writes.',
  running: 'Garbage collection is running.',
  success: 'Garbage collection completed.',
  failed: 'Garbage collection failed. Check the maintenance job.',
  unknown: 'Garbage collection status is unknown. Check the maintenance job before starting again.',
};

async function signedIn(page: Page) {
  await page.route('**/api/registry/status', (route) =>
    route.fulfill({
      json: { auth: false, authType: 'basic', user: 'operator', deleteEnabled: false, monitoringEnabled: false },
    }),
  );
}

test.use({ locale: 'en-US' });

for (const status of [403, 404]) {
  test(`does not expose a start button when status returns ${status}`, async ({ page }) => {
    await signedIn(page);
    await page.route(path, (route) => route.fulfill({ status, json: { statusCode: status } }));
    const checked = page.waitForResponse((response) => response.url().endsWith('/registry/garbage-collection'));
    await page.goto('/settings');
    await checked;
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: labels.start })).toHaveCount(0);
  });
}

test('keyboard cancel never starts; confirmed run survives reload and shows its result', async ({ page }) => {
  await signedIn(page);
  let posts = 0;
  let revision = 'r0';
  let run: { id: string; state: string } | null = null;
  await page.route(path, async (route) => {
    if (route.request().method() === 'POST') {
      posts++;
      expect(route.request().postDataJSON()).toEqual({ revision: 'r0' });
      revision = 'r1';
      run = { id: 'job', state: 'running' };
      return route.fulfill({ status: 202, json: { revision, run } });
    }
    return route.fulfill({ json: { revision, run } });
  });
  await page.goto('/settings');
  const button = page.getByRole('button', { name: labels.start });
  await button.focus();
  await button.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText(labels.warning);
  await dialog.getByRole('button', { name: 'Cancel' }).press('Enter');
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();
  expect(posts).toBe(0);
  await button.click();
  await dialog.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText(labels.running)).toHaveAttribute('role', 'status');
  await expect(button).toBeDisabled();
  await page.reload();
  await expect(page.getByText(labels.running)).toBeVisible();
  revision = 'r2';
  run = { id: 'job', state: 'succeeded' };
  await expect(page.getByText(labels.success)).toBeVisible();
  expect(posts).toBe(1);
});

test('an ambiguous POST never retries and shows authoritative failure when known', async ({ page }) => {
  await signedIn(page);
  let posts = 0;
  let failed = false;
  await page.route(path, async (route) => {
    if (route.request().method() === 'POST') {
      posts++;
      return route.abort('connectionreset');
    }
    return route.fulfill({
      json: failed ? { revision: 'r2', run: { id: 'job', state: 'failed' } } : { revision: 'r0', run: null },
    });
  });
  await page.goto('/settings');
  const button = page.getByRole('button', { name: labels.start });
  await button.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText(labels.unknown)).toBeVisible();
  await expect(button).toBeDisabled();
  await page.reload();
  await expect(page.getByText(labels.unknown)).toBeVisible();
  await expect(button).toBeDisabled();
  failed = true;
  await expect(page.getByText(labels.failed)).toBeVisible();
  await expect(button).toBeEnabled();
  expect(posts).toBe(1);
});

test.describe('German narrow layout', () => {
  test.use({ locale: 'de-DE', viewport: { width: 360, height: 740 } });

  test('renders translated action and confirmation without horizontal overflow', async ({ page }) => {
    await signedIn(page);
    await page.route(path, (route) => route.fulfill({ json: { revision: 'r0', run: null } }));
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Garbage Collection starten' }).click();
    await expect(page.getByRole('dialog')).toContainText('gesamte Registry');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
});
