import { test, expect } from '@playwright/test';
import { wheelToY, roleTops } from './helpers.js';

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

const visibleSlides = (page) =>
  page.$$eval('.slide', (slides) =>
    slides.filter((s) => getComputedStyle(s).display !== 'none' && getComputedStyle(s).visibility === 'visible').map((s) => s.dataset.slide));
const inlineDiagramsShown = (page) =>
  page.$$eval('.role .viz', (v) => v.filter((el) => getComputedStyle(el).display !== 'none').length);

test.describe('The stage follows the role being read', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('one slide at a time: demo, memory, rewrite, traceroute, and back to the demo', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(400);
    expect(await visibleSlides(page)).toEqual(['demo']);
    expect(await inlineDiagramsShown(page)).toBe(0);

    const tops = await roleTops(page);
    const expected = ['demo', 'memory', 'rewrite', 'trace'];
    for (let i = 0; i < tops.length; i += 1) {
      await wheelToY(page, tops[i] - 300);
      await page.waitForTimeout(800); // the crossfade
      await expect(page.locator('.slide.on')).toHaveAttribute('data-slide', expected[i]);
      expect(await visibleSlides(page)).toEqual([expected[i]]);
    }

    const stackTop = await page.evaluate(() => document.getElementById('stack').getBoundingClientRect().top + window.scrollY);
    await wheelToY(page, stackTop - 100);
    await page.waitForTimeout(800);
    expect(await visibleSlides(page)).toEqual(['demo']);
  });

  test('the demo keeps its tickets while the stage shows other slides', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(400);
    await page.locator('#take').click();
    await page.locator('#take').click();
    expect(await page.locator('#tickets .ticket').count()).toBe(2);
    const tops = await roleTops(page);
    await wheelToY(page, tops[2] - 300);
    await page.waitForTimeout(800);
    expect(await visibleSlides(page)).toEqual(['rewrite']);
    await wheelToY(page, 0);
    await page.waitForTimeout(800);
    expect(await visibleSlides(page)).toEqual(['demo']);
    expect(await page.locator('#tickets .ticket').count()).toBe(2);
  });
});

test.describe('Phones and JavaScript off keep the diagrams inline', () => {
  test('a phone: no swapping, three inline diagrams, only the demo in the stage', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => document.documentElement.classList.contains('swap'))).toBe(false);
    expect(await inlineDiagramsShown(page)).toBe(3);
    expect(await visibleSlides(page)).toEqual(['demo']);
  });

  test.describe('JavaScript off on a wide screen', () => {
    test.use({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    test('the diagrams stay inline and only the demo is in the stage', async ({ page }) => {
      await page.goto('/');
      expect(await inlineDiagramsShown(page)).toBe(3);
      expect(await visibleSlides(page)).toEqual(['demo']);
      await expect(page.locator('#fallback')).toBeVisible();
    });
  });
});

test('resizing across 860px restores the inline diagrams and drops the swap, and back again (Review Focus 4)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => document.documentElement.classList.contains('swap'))).toBe(true);
  expect(await inlineDiagramsShown(page)).toBe(0);

  await page.setViewportSize({ width: 800, height: 900 });
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => document.documentElement.classList.contains('swap'))).toBe(false);
  expect(await inlineDiagramsShown(page)).toBe(3);
  expect(await visibleSlides(page)).toEqual(['demo']);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => document.documentElement.classList.contains('swap'))).toBe(true);
  expect(await inlineDiagramsShown(page)).toBe(0);
});
