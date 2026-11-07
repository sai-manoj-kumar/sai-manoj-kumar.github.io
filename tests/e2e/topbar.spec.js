import { test, expect } from '@playwright/test';

const WIDTHS = [320, 390, 861, 1440];

test('the Connect link is visible at 320, 390, 861 and 1440px and nothing in the top bar passes the right edge', async ({ page }) => {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await page.waitForTimeout(200);
    await expect(page.locator('.topbar-connect'), `Connect at ${width}px`).toBeVisible();
    const rights = await page.evaluate(() =>
      [...document.querySelectorAll('.topbar a, .topbar label')]
        .filter((el) => el.getClientRects().length > 0)
        .map((el) => ({ text: el.textContent.trim(), right: el.getBoundingClientRect().right, vw: window.innerWidth })),
    );
    expect(rights.length).toBeGreaterThan(1);
    for (const r of rights) expect(r.right, `${r.text} at ${width}px`).toBeLessThanOrEqual(r.vw);
  }
});

test.describe('JavaScript off', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 800 } });

  test('with JavaScript off the Connect link jumps to the Connect section', async ({ page }) => {
    await page.goto('/');
    await page.locator('.topbar-connect').click();
    // the page may scroll smoothly, so wait for it to land
    await expect
      .poll(() => page.evaluate(() => document.getElementById('connect').getBoundingClientRect().top), { timeout: 5000 })
      .toBeLessThan(800);
    expect(await page.evaluate(() => document.getElementById('connect').getBoundingClientRect().top)).toBeGreaterThanOrEqual(-1);
  });
});
