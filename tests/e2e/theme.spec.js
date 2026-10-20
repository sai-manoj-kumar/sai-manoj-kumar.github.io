import { test, expect } from '@playwright/test';

const LIGHT = 'rgb(241, 235, 220)'; // #f1ebdc
const DARK = 'rgb(71, 41, 19)'; // #472913
const bg = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const choose = (page, name) => page.locator('.theme label', { hasText: name }).click();
const themeAttr = (page) => page.evaluate(() => document.documentElement.getAttribute('data-theme'));

test.use({ viewport: { width: 1440, height: 900 } });

test('by default the page follows the OS, live', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  expect(await themeAttr(page)).toBeNull();
  expect(await bg(page)).toBe(LIGHT);
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await bg(page)).toBe(DARK);
});

test('Dark beats a light OS, Light beats a dark OS, and System gives control back to the OS', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await choose(page, 'Dark');
  expect(await themeAttr(page)).toBe('dark');
  expect(await bg(page)).toBe(DARK);

  await page.emulateMedia({ colorScheme: 'dark' });
  await choose(page, 'Light');
  expect(await themeAttr(page)).toBe('light');
  expect(await bg(page)).toBe(LIGHT);

  await choose(page, 'System');
  expect(await themeAttr(page)).toBeNull();
  expect(await bg(page)).toBe(DARK); // the OS is dark
});

test('the choice survives a reload and is applied before the page body exists (no flash)', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await choose(page, 'Dark');
  await page.addInitScript(() => {
    new MutationObserver(() => {
      if (window.__firstTheme === undefined && document.documentElement.getAttribute('data-theme')) {
        window.__firstTheme = { theme: document.documentElement.getAttribute('data-theme'), bodyExisted: !!document.body };
      }
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ['data-theme'] });
  });
  await page.reload();
  expect(await page.evaluate(() => window.__firstTheme)).toEqual({ theme: 'dark', bodyExisted: false });
  expect(await bg(page)).toBe(DARK);
  await expect(page.locator('.theme input[value="dark"]')).toBeChecked();
});

test('the theme-color metas follow an override', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await choose(page, 'Dark');
  const colors = await page.$$eval('meta[name="theme-color"]', (metas) => metas.map((m) => m.getAttribute('content')));
  expect(colors).toEqual(['#472913', '#472913']);
  await choose(page, 'System');
  const back = await page.$$eval('meta[name="theme-color"]', (metas) => metas.map((m) => m.getAttribute('content')));
  expect(back).toEqual(['#f1ebdc', '#472913']);
});

test('blocked or throwing storage does not break the page, and the switch still works for the visit', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const blocked = () => { throw new Error('storage blocked'); };
    Storage.prototype.getItem = blocked;
    Storage.prototype.setItem = blocked;
    Storage.prototype.removeItem = blocked;
  });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await choose(page, 'Dark');
  expect(await themeAttr(page)).toBe('dark');
  expect(await bg(page)).toBe(DARK);
  expect(errors).toEqual([]);
});

test('junk in storage is ignored', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'purple'));
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  expect(await themeAttr(page)).toBeNull();
  expect(await bg(page)).toBe(LIGHT);
  await expect(page.locator('.theme input[value="system"]')).toBeChecked();
});

test('with JavaScript off the switch is hidden and the page still follows the OS', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark', viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.theme')).toBeHidden();
  expect(await bg(page)).toBe(DARK);
  await context.close();
});
