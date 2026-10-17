import { test, expect } from '@playwright/test';

test.describe('JavaScript off (Review Focus 1)', () => {
  test.use({ javaScriptEnabled: false });

  test('the page reads in full and the demo explains itself', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#fallback')).toBeVisible();
    await expect(page.locator('#take')).toBeDisabled();
    await expect(page.locator('.folder .text').first()).toBeVisible();
    expect(await page.locator('.folder .text').first().evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await expect(page.locator('#stack details[open]')).toHaveCount(4);
  });
});

test.describe('Reduced motion (Review Focus 2)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('every section is visible and nothing animates in', async ({ page }) => {
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.classList.contains('anim'))).toBe(false);
    for (const selector of ['.folder .text', '#stack .bar', '#about .sheet', '#connect .coupon']) {
      const el = page.locator(selector).first();
      await expect(el).toBeVisible();
      expect(await el.evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    }
  });
});

test.describe('A 320 px phone (Review Focus 4)', () => {
  test.use({ viewport: { width: 320, height: 700 } });

  test('nothing scrolls sideways', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
