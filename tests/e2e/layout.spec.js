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

  test('on a wide screen the panel uses the full column and reads left to right: clients, gateway, backend, with the limiter below the gateway', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const panel = await box(page, '#dispenser');
    const clients = await box(page, '.arch-clients .arch-node');
    const gateway = await box(page, '.arch-gateway');
    const hot = await box(page, '.arch-node.hot');
    const services = await box(page, '.arch-services');
    expect(panel.width).toBeGreaterThan(900);
    expect(clients.right).toBeLessThanOrEqual(gateway.left);
    expect(gateway.right).toBeLessThanOrEqual(services.left);
    expect(hot.top, 'the limiter is below the gateway, not between the gateway and the backend').toBeGreaterThanOrEqual(gateway.bottom);
    expect(hot.left).toBeLessThan(services.left);
    expect(hot.right).toBeLessThanOrEqual(services.left);
    expect(panel.right).toBeLessThanOrEqual(1440);
    const tokens = await page.locator('.arch-node.hot .chip').count();
    expect(tokens).toBe(5);
  });

  test('on a phone it reads top to bottom, with Clients first, and nothing overflows', async ({ page }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const clients = await box(page, '.arch-clients .arch-node');
      const gateway = await box(page, '.arch-gateway');
      const hot = await box(page, '.arch-node.hot');
      const services = await box(page, '.arch-services');
      const panel = await box(page, '#dispenser');
      expect(clients.bottom).toBeLessThanOrEqual(gateway.top);
      // The limiter is beside the gateway (the gateway asks it), not between the gateway and the backend.
      expect(hot.left, 'limiter is to the right of the gateway').toBeGreaterThanOrEqual(gateway.right);
      expect(Math.min(hot.bottom, gateway.bottom) - Math.max(hot.top, gateway.top), 'in the same row').toBeGreaterThan(20);
      expect(gateway.bottom).toBeLessThanOrEqual(services.top);
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

test.describe('The top bar on a phone is one compact row', () => {
  for (const width of [320, 375, 390, 860]) {
    test(`at ${width}px the name, both profile buttons and the theme button share one row`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const rects = await page.evaluate(() => {
        const r = (sel) => { const b = document.querySelector(sel).getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height }; };
        return { bar: r('.topbar'), name: r('.topbar-name'), li: r('[data-track="linkedin:topbar"]'), gh: r('[data-track="github:topbar"]'), cycle: r('.theme-cycle'), theme: getComputedStyle(document.querySelector('fieldset.theme')).display };
      });
      expect(rects.bar.height).toBeLessThan(80);
      for (const k of ['name', 'li', 'gh', 'cycle']) {
        expect(rects[k].top, k).toBeGreaterThanOrEqual(rects.bar.top);
        expect(rects[k].bottom, k).toBeLessThanOrEqual(rects.bar.bottom);
      }
      expect(Math.abs(rects.li.top - rects.cycle.top)).toBeLessThan(2);
      for (const k of ['li', 'gh', 'cycle']) {
        expect(rects[k].width, `${k} is at least a 44px target`).toBeGreaterThanOrEqual(44);
        expect(rects[k].height).toBeGreaterThanOrEqual(44);
      }
      expect(rects.theme, 'the three-way switch is replaced by the single button').toBe('none');
      expect(rects.cycle.right).toBeLessThanOrEqual(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    });
  }

  test('the profile buttons are icons on a phone but still have their names, and show their words on a wide screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'LinkedIn' }).first()).toBeVisible();
    expect(await page.locator('[data-track="linkedin:topbar"] .topbar-text').evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 1440, height: 800 });
    expect(await page.locator('[data-track="linkedin:topbar"] .topbar-text').evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(30);
    await expect(page.locator('.theme-cycle')).toBeHidden();
    await expect(page.locator('fieldset.theme')).toBeVisible();
  });

  test('the theme button cycles System, Light, Dark, System; announces the mode; and remembers it', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const button = page.locator('.theme-cycle');
    const state = () => page.evaluate(() => ({ attr: document.documentElement.getAttribute('data-theme'), stored: localStorage.getItem('theme'), label: document.querySelector('.theme-cycle').getAttribute('aria-label'), mode: document.querySelector('.theme-cycle').dataset.mode, checked: document.querySelector('input[name="theme"]:checked').value }));
    expect(await state()).toMatchObject({ attr: null, mode: 'system', checked: 'system' });
    expect((await state()).label).toMatch(/^Theme: System/);
    await button.click();
    expect(await state()).toMatchObject({ attr: 'light', stored: 'light', mode: 'light', checked: 'light' });
    expect((await state()).label).toMatch(/^Theme: Light/);
    await button.click();
    expect(await state()).toMatchObject({ attr: 'dark', stored: 'dark', mode: 'dark', checked: 'dark' });
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(14, 15, 18)');
    await button.click();
    expect(await state()).toMatchObject({ attr: null, stored: null, mode: 'system', checked: 'system' });
    await button.click();
    await page.reload();
    expect(await state()).toMatchObject({ attr: 'light', mode: 'light', checked: 'light' });
  });

  test('with JavaScript off the theme button is hidden, like the switch', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 800 } });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('.theme-cycle')).toBeHidden();
    await context.close();
  });
});
