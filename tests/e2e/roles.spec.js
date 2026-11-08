import { test, expect } from '@playwright/test';

/* Every role is shown in full, always: no closed state, no scroll effect, nothing to click. */
const state = (page) =>
  page.evaluate(() => [...document.querySelectorAll('.role')].map((r) => ({
    slug: r.dataset.role,
    body: Math.round(r.querySelector('.role-body').getBoundingClientRect().height),
    opacity: getComputedStyle(r.querySelector('.role-body')).opacity,
    filter: getComputedStyle(r.querySelector('.role-body')).filter,
    transform: getComputedStyle(r.querySelector('.role-body')).transform,
    headOpacity: getComputedStyle(r.querySelector('.role-head')).opacity,
  })));

for (const [width, height] of [[1440, 900], [390, 844], [320, 700]]) {
  test(`all four roles are fully shown on load at ${width}x${height}, and nothing hides or blurs them`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.waitForTimeout(300);
    const roles = await state(page);
    expect(roles.map((r) => r.slug)).toEqual(['webhooks', 'memory', 'rewrite', 'trace']);
    for (const r of roles) {
      expect(r.body, `${r.slug} body is open`).toBeGreaterThan(60);
      expect(r.opacity).toBe('1');
      expect(r.headOpacity).toBe('1');
      expect(r.filter).toBe('none');
      expect(r.transform).toBe('none');
    }
  });
}

test('roles stay the same height while the page is scrolled, and the page has no reveal class', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const before = (await state(page)).map((r) => r.body);
  await page.mouse.move(700, 450);
  for (let i = 0; i < 30; i += 1) { await page.mouse.wheel(0, 300); await page.waitForTimeout(30); }
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  expect((await state(page)).map((r) => r.body)).toEqual(before);
  expect(await page.evaluate(() => document.documentElement.classList.contains('reveal'))).toBe(false);
});

test('clicking a role heading or summary changes nothing', async ({ page }) => {
  await page.goto('/');
  const before = await state(page);
  await page.locator('.role').nth(1).locator('h3').click();
  await page.locator('.role').nth(1).locator('.summary').click();
  await page.waitForTimeout(300);
  expect(await state(page)).toEqual(before);
});

test('a link straight to a section lands on it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#limiter');
  await page.waitForTimeout(1200);
  const top = await page.locator('#limiter').evaluate((e) => Math.round(e.getBoundingClientRect().top));
  expect(top).toBeLessThanOrEqual(120);
  expect(top).toBeGreaterThanOrEqual(0);
});
