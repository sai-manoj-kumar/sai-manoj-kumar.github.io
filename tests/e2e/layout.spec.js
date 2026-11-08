import { test, expect } from '@playwright/test';

const WIDTHS = [320, 375, 390, 860, 861, 1440];

for (const scheme of ['light', 'dark']) {
  for (const width of WIDTHS) {
    test(`one column, nothing scrolls sideways, ${scheme} at ${width}px`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const topbar = await page.locator('.topbar').boundingBox();
      expect(topbar.x + topbar.width).toBeLessThanOrEqual(width + 0.5);
    });
  }
}

test('the top bar is sticky from 861px up and scrolls away on phones', async ({ page }) => {
  for (const [width, position] of [[1440, 'sticky'], [861, 'sticky'], [860, 'static'], [390, 'static']]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    expect(await page.locator('.topbar').evaluate((el) => getComputedStyle(el).position), `${width}px`).toBe(position);
  }
});

test('the pipeline runs left to right on a wide screen', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const tops = await page.locator('.pipeline > li').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(80);
  const lefts = await page.locator('.pipeline > li').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().left));
  expect([...lefts].sort((a, b) => a - b)).toEqual(lefts);
});

test('the pipeline runs top to bottom on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const boxes = await page.locator('.pipeline > li').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()));
  for (let i = 1; i < boxes.length; i += 1) expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom - 1);
});

test('the hero sentence and the whole pipeline fit the first screen on a desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const bottom = await page.locator('.pipeline').evaluate((el) => el.getBoundingClientRect().bottom);
  expect(bottom).toBeLessThanOrEqual(900);
});

test('events are moving along the pipeline, and stop with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const running = () => page.locator('.pipeline .dot').first().evaluate((el) => getComputedStyle(el).animationName !== 'none' && getComputedStyle(el).animationPlayState === 'running');
  expect(await running()).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await running()).toBe(false);
});
