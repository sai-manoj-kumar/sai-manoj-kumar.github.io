import { test, expect } from '@playwright/test';

test('the 404 page is set in General Sans, fits a 320 px phone and links home', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/404.html');
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();

  const boldLoaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].some((f) => f.family.includes('General Sans') && f.weight === '700' && f.status === 'loaded');
  });
  expect(boldLoaded, 'General Sans 700 loaded, not a fallback').toBe(true);

  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(fits, 'no horizontal scroll at 320 px').toBe(true);

  await page.getByRole('link', { name: 'Go to the home page' }).click();
  await expect(page).toHaveURL('/');
});
