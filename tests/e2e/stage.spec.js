import { test, expect } from '@playwright/test';
import { wheelToY } from './helpers.js';

const SIZES = [[1920, 1080], [1440, 900], [1280, 720], [1024, 768], [861, 700], [820, 1180], [390, 844], [320, 700]];

test.describe('Scrolling and layout (Review Focus 1)', () => {
  for (const [width, height] of SIZES) {
    test(`the mouse wheel scrolls the page, and nothing scrolls sideways, at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await page.waitForTimeout(400);
      await wheelToY(page, 600);
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0);
    });
  }

  test('the stage stays pinned while the reader scrolls (wide screens)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await wheelToY(page, 2000);
    const stage = await page.locator('.stage').boundingBox();
    expect(Math.round(stage.y)).toBe(0);
    expect(Math.round(stage.height)).toBe(900);
    expect(Math.round(stage.width)).toBeGreaterThan(650);
  });

  test('on a phone the stage is a block at the top that scrolls away', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await wheelToY(page, 1500);
    const stage = await page.locator('.stage').boundingBox();
    expect(stage.y).toBeLessThan(0);
  });
});
