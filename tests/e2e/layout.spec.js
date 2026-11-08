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

test.describe('The rate limiter demo and diagram are one panel', () => {
  const box = (page, sel) => page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  });

  test('on a wide screen the panel uses the full column and reads left to right: button, limiter, services', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const panel = await box(page, '#dispenser');
    const take = await box(page, '#take');
    const hot = await box(page, '.arch-node.hot');
    const services = await box(page, '.arch-services');
    expect(panel.width).toBeGreaterThan(900);
    expect(take.right).toBeLessThanOrEqual(hot.left);
    expect(hot.right).toBeLessThanOrEqual(services.left);
    expect(panel.right).toBeLessThanOrEqual(1440);
    const tokens = await page.locator('.arch-node.hot .chip').count();
    expect(tokens).toBe(5);
  });

  test('on a phone it reads top to bottom, with the button first, and nothing overflows', async ({ page }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const take = await box(page, '#take');
      const hot = await box(page, '.arch-node.hot');
      const services = await box(page, '.arch-services');
      const panel = await box(page, '#dispenser');
      expect(take.bottom).toBeLessThanOrEqual(hot.top);
      expect(hot.bottom).toBeLessThanOrEqual(services.top);
      expect(panel.right).toBeLessThanOrEqual(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    }
  });

  test('the rate limiter is the one filled node, in the accent colour, and its tokens are readable on it', async ({ page }) => {
    await page.goto('/');
    const fills = await page.locator('figure.arch .arch-node').evaluateAll((els) => els.map((e) => [e.firstChild.textContent.trim(), getComputedStyle(e).backgroundColor]));
    const accent = await page.evaluate(() => { const p = document.createElement('i'); p.style.color = 'var(--accent)'; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c; });
    expect(fills.filter(([, bg]) => bg === accent).map(([n]) => n)).toEqual(['Rate limiter']);
    const chip = await page.locator('.arch-node.hot .chip').first().evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(chip).not.toBe(accent);
  });
});
