import { test, expect } from '@playwright/test';
import { wheelToY } from './helpers.js';

test.use({ viewport: { width: 1440, height: 900 } });

const state = (page) =>
  page.evaluate(() => {
    const stub = document.getElementById('stub');
    const name = document.getElementById('name');
    const box = stub.getBoundingClientRect();
    return {
      stubOn: stub.classList.contains('on'),
      stubVisibility: getComputedStyle(stub).visibility,
      stubBox: [box.left, box.top, box.right, box.bottom].map(Math.round),
      nameVisibility: getComputedStyle(name).visibility,
      nameFixed: name.classList.contains('is-fixed'),
    };
  });

test('the name sits at the bottom of the first screen, then becomes the stub at the bottom right', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);
  let s = await state(page);
  expect(s.stubOn).toBe(false);
  expect(s.stubVisibility).toBe('hidden');
  expect(s.nameVisibility).toBe('visible');

  await wheelToY(page, 900);
  await page.waitForTimeout(500);
  s = await state(page);
  expect(s.stubOn).toBe(true);
  expect(s.nameVisibility).toBe('hidden');
  const [, , right, bottom] = s.stubBox;
  expect(right).toBeGreaterThan(1440 - 80);
  expect(right).toBeLessThanOrEqual(1440);
  expect(bottom).toBeGreaterThan(900 - 80);
  expect(bottom).toBeLessThanOrEqual(900);
});

test('the stub steps aside over Connect and cannot take keyboard focus while hidden', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);
  await wheelToY(page, 900);
  await page.waitForTimeout(400);
  expect((await state(page)).stubOn).toBe(true);
  await page.evaluate(() => document.getElementById('connect').scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(500);
  const s = await state(page);
  expect(s.stubOn).toBe(false);
  expect(s.stubVisibility).toBe('hidden');
  expect(await page.evaluate(() => { document.getElementById('stub').focus(); return document.activeElement.id; })).not.toBe('stub');
});

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

  test('the name never moves, the stub never appears, and everything is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => document.documentElement.classList.contains('anim'))).toBe(false);
    await wheelToY(page, 1200);
    await page.waitForTimeout(400);
    const s = await state(page);
    expect(s.nameFixed).toBe(false);
    expect(s.stubOn).toBe(false);
    expect(s.stubVisibility).toBe('hidden');
    for (const selector of ['.role', '#stack .group', '#about', '#connect']) {
      expect(await page.locator(selector).first().evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    }
  });
});
