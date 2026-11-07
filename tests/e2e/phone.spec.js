import { test, expect } from '@playwright/test';
import { wheelToY } from './helpers.js';

/* Phones (860px and below) read words first: top bar, headline, facts, buttons, a short photo
   strip, then the demo. The stage stays first in the DOM, so its only focusable element is #take. */
test.describe('Phone layout, words first', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the first screen reads top bar, headline, buttons, photo strip, demo', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(400);
    const tops = [];
    for (const sel of ['.topbar', '.intro h1', '.intro .btn', '.room', '#dispenser']) {
      const box = await page.locator(sel).first().boundingBox();
      expect(box, `${sel} has a box`).not.toBeNull();
      tops.push([sel, box.y]);
    }
    for (let i = 1; i < tops.length; i += 1) {
      expect(tops[i][1], `${tops[i][0]} is below ${tops[i - 1][0]}`).toBeGreaterThan(tops[i - 1][1]);
    }
  });

  for (const [width, height] of [[375, 667], [390, 844]]) {
    test(`the demo starts on the first screen at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await page.waitForTimeout(400);
      const box = await page.locator('#dispenser').boundingBox();
      expect(box.y).toBeLessThan(height);
    });
  }

  test('the photo is a short strip', async ({ page }) => {
    await page.goto('/');
    const box = await page.locator('.room').boundingBox();
    expect(box.height).toBeGreaterThan(100);
    expect(box.height).toBeLessThan(0.3 * 844);
  });

  test('nothing is fixed or sticky on a phone', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(400);
    await wheelToY(page, 1500);
    const pinned = await page.$$eval('body *', (els) =>
      els.filter((el) => ['fixed', 'sticky'].includes(getComputedStyle(el).position)).map((el) => el.className || el.tagName));
    expect(pinned).toEqual([]);
  });

  test('the only focusable element in the stage is #take', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(400);
    const ids = await page.$$eval(
      '.stage a[href], .stage button, .stage input, .stage select, .stage textarea, .stage [tabindex]:not([tabindex="-1"])',
      (els) => els.filter((el) => !el.disabled && el.checkVisibility({ visibilityProperty: true })).map((el) => el.id),
    );
    expect(ids).toEqual(['take']);
  });

  test('desktop is unchanged at 861px', async ({ page }) => {
    await page.setViewportSize({ width: 861, height: 700 });
    await page.goto('/');
    expect(await page.locator('.stage').evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
    expect(await page.locator('.split').evaluate((el) => getComputedStyle(el).display)).toBe('grid');
  });
});
