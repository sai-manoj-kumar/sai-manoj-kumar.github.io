import { test, expect } from '@playwright/test';
import { wheelToY, roleTops } from './helpers.js';

test.use({ viewport: { width: 1440, height: 900 } });

const state = (page) =>
  page.evaluate(() => [...document.querySelectorAll('.role')].map((r) => ({
    slug: r.dataset.role,
    open: r.classList.contains('open'),
    body: Math.round(r.querySelector('.role-body').getBoundingClientRect().height),
    text: r.querySelector('.role-body').textContent.trim().length,
  })));

test('on load only the first role is open, but every role keeps its text in the page', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(700);
  const roles = await state(page);
  expect(roles.map((r) => r.open)).toEqual([true, false, false, false]);
  expect(roles[0].body).toBeGreaterThan(0);
  for (const r of roles.slice(1)) {
    expect(r.body, `${r.slug} body is clipped, not removed`).toBe(0);
    expect(r.text, `${r.slug} text stays readable to assistive tech and find-in-page`).toBeGreaterThan(40);
  }
  const display = await page.locator('.role-body').evaluateAll((els) => els.map((e) => [getComputedStyle(e).display, getComputedStyle(e).visibility]));
  for (const [d, v] of display) { expect(d).not.toBe('none'); expect(v).toBe('visible'); }
});

test('each role opens as its heading passes the middle of the screen, and stays open', async ({ page }) => {
  await page.goto('/');
  for (let i = 1; i < 4; i += 1) {
    const tops = await roleTops(page); // read fresh: every role that opens pushes the later ones down
    await wheelToY(page, tops[i] - 300);
    await page.waitForTimeout(800);
    const roles = await state(page);
    expect(roles[i].open, `role ${i} opens`).toBe(true);
    expect(roles[i].body).toBeGreaterThan(0);
    if (i < 3) expect(roles[i + 1].open, `role ${i + 1} is still closed`).toBe(false);
  }
  await wheelToY(page, 0);
  await page.waitForTimeout(300);
  expect((await state(page)).map((r) => r.open)).toEqual([true, true, true, true]);
});

test('clicking a role heading or summary changes nothing', async ({ page }) => {
  await page.goto('/');
  const tops = await roleTops(page);
  await wheelToY(page, tops[1] - 300);
  await page.waitForTimeout(800);
  await page.locator('.role').nth(1).locator('h3').click();
  await page.locator('.role').nth(1).locator('.summary').click();
  await page.locator('.role').first().locator('h3').click();
  await page.waitForTimeout(700);
  expect((await state(page)).slice(0, 2).map((r) => r.open)).toEqual([true, true]);
});

test('landing mid-page after a reload opens every role above the middle of the screen', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo({ top: document.querySelector('[data-role="rewrite"]').offsetTop + 200, behavior: 'instant' }));
  await page.waitForTimeout(200);
  await page.reload();
  await page.waitForTimeout(900);
  const expected = await page.evaluate(() => [...document.querySelectorAll('.role')].map((r, i) => i === 0 || r.getBoundingClientRect().top <= window.innerHeight * 0.5));
  expect((await state(page)).map((r) => r.open)).toEqual(expected);
  expect(expected.filter(Boolean).length).toBeGreaterThanOrEqual(3);
});

test('an anchor jump to the rate limiter leaves no earlier role closed', async ({ page }) => {
  await page.goto('/#limiter');
  await page.waitForTimeout(900);
  expect((await state(page)).map((r) => r.open)).toEqual([true, true, true, true]);
});

test('on a tall 1920x1200 screen the last role still opens', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1200 });
  await page.goto('/');
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await wheelToY(page, height - 1200);
  await page.waitForTimeout(800);
  expect((await state(page)).map((r) => r.open)).toEqual([true, true, true, true]);
});

test('the opening never moves the heading the reader is looking at', async ({ page }) => {
  await page.goto('/');
  const tops = await roleTops(page);
  await wheelToY(page, tops[1] - 300);
  await page.waitForTimeout(100);
  const before = await page.locator('.role').nth(1).locator('h3').evaluate((e) => e.getBoundingClientRect().top);
  await page.waitForTimeout(800);
  const after = await page.locator('.role').nth(1).locator('h3').evaluate((e) => e.getBoundingClientRect().top);
  expect(Math.abs(after - before)).toBeLessThanOrEqual(2);
});

test.describe('Reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('every role is open and nothing animates', async ({ page }) => {
    await page.goto('/');
    const roles = await state(page);
    for (const r of roles) expect(r.body, r.slug).toBeGreaterThan(0);
    expect(await page.locator('.role-body').first().evaluate((e) => getComputedStyle(e).transitionDuration)).toMatch(/^0s/);
  });
});

test.describe('JavaScript off', () => {
  test.use({ javaScriptEnabled: false });
  test('every role is open', async ({ page }) => {
    await page.goto('/');
    for (const r of await state(page)) expect(r.body, r.slug).toBeGreaterThan(0);
  });
});
