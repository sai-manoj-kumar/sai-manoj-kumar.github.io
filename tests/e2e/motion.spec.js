import { test, expect } from '@playwright/test';
import { wheelToY } from './helpers.js';

test.use({ viewport: { width: 1440, height: 900 } });

test.describe('Reduced motion (Review Focus 5)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('nothing animates and everything is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.documentElement.classList.contains('reveal'))).toBe(false);
    await wheelToY(page, 1200);
    await page.waitForTimeout(300);
    for (const selector of ['.hero', '.role', '#limiter', '#stack .group', '#about']) {
      await expect(page.locator(selector).first()).toBeVisible();
      expect(await page.locator(selector).first().evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    }
  });
});
