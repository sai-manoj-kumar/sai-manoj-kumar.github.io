import { test, expect } from '@playwright/test';
import { wheelToY } from './helpers.js';

test.use({ viewport: { width: 1440, height: 900 } });

test('sections rise in once as they are scrolled to', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);
  const last = page.locator('.role').last();
  expect(await last.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
  await last.scrollIntoViewIfNeeded();
  await expect(last).toHaveClass(/\bin\b/);
  await page.waitForTimeout(1500); // the 0.7s rise plus its stagger delay
  expect(await last.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
});

test.describe('Reduced motion (Review Focus 5)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('nothing animates, no name or stub element exists, and everything is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => document.documentElement.classList.contains('anim'))).toBe(false);
    expect(await page.evaluate(() => document.getElementById('name'))).toBeNull();
    expect(await page.evaluate(() => document.getElementById('stub'))).toBeNull();
    await wheelToY(page, 1200);
    await page.waitForTimeout(400);
    for (const selector of ['.role', '#stack .group', '#about', '#connect']) {
      expect(await page.locator(selector).first().evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    }
  });
});
