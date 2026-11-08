import { test, expect } from '@playwright/test';
import { wheelToY, roleTops } from './helpers.js';

test.use({ viewport: { width: 1440, height: 900 } });

/* Replace sendBeacon so nothing leaves the test, and keep what the page tried to send. */
async function record(page, { dnt = false } = {}) {
  await page.addInitScript((dntOn) => {
    window.__beacons = [];
    navigator.sendBeacon = (url, body) => {
      window.__beacons.push({ url, ...JSON.parse(body) });
      return true;
    };
    if (dntOn) Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' });
  }, dnt);
}
const beacons = (page) => page.evaluate(() => window.__beacons);
const keepOnPage = (page) => page.evaluate(() => document.addEventListener('click', (e) => e.preventDefault()));

test('a plain visit reports one visit from direct', async ({ page }) => {
  await record(page);
  await page.goto('/');
  expect(await beacons(page)).toEqual([{ url: '/e', e: 'visit', l: 'page', s: 'direct' }]);
});

test('a ?ref= tag becomes the source on every event', async ({ page }) => {
  await record(page);
  await page.goto('/?ref=Test-Link');
  await keepOnPage(page);
  await page.locator('.topbar-link[data-track="linkedin:topbar"]').click();
  await expect.poll(async () => (await beacons(page)).length).toBe(2);
  const sent = await beacons(page);
  expect(sent.map((b) => b.s)).toEqual(['test-link', 'test-link']);
  expect(sent.map((b) => `${b.e}:${b.l}`).sort()).toEqual(['link:linkedin:topbar', 'visit:page']);
});

test('the theme switch reports the choice', async ({ page }) => {
  await record(page);
  await page.goto('/');
  await page.locator('.theme label', { hasText: 'Dark' }).click();
  expect((await beacons(page)).at(-1)).toMatchObject({ e: 'theme', l: 'dark' });
});

test('reading down to a role reports it once', async ({ page }) => {
  await record(page);
  await page.goto('/');
  const tops = await roleTops(page);
  await wheelToY(page, tops[1] - 200);
  const roles = (await beacons(page)).filter((b) => b.e === 'role').map((b) => b.l);
  expect(roles).toContain('memory');
  expect(new Set(roles).size).toBe(roles.length);
});

test('Do Not Track sends nothing at all', async ({ page }) => {
  await record(page, { dnt: true });
  await page.goto('/');
  await keepOnPage(page);
  await page.locator('.topbar-link[data-track="linkedin:topbar"]').click();
  expect(await beacons(page)).toEqual([]);
});

test('the first role is reported once its heading passes the middle, not on load', async ({ page }) => {
  await record(page);
  await page.goto('/');
  await page.waitForTimeout(300);
  expect((await beacons(page)).filter((b) => b.e === 'role')).toEqual([]);
  const tops = await roleTops(page);
  await wheelToY(page, tops[0] - 300);
  await expect.poll(async () => (await beacons(page)).filter((b) => b.e === 'role').map((b) => b.l)).toEqual(['webhooks']);
});

test('the rate limiter reports itself once, when it reaches the middle of the screen', async ({ page }) => {
  await record(page);
  await page.goto('/');
  await page.waitForTimeout(300);
  expect((await beacons(page)).filter((b) => b.l === 'demo')).toEqual([]);
  // read fresh each time: roles above the demo open as the reader passes them and push it down
  const limiterTop = () => page.evaluate(() => Math.round(document.getElementById('limiter').getBoundingClientRect().top + scrollY));
  for (let i = 0; i < 4; i += 1) await wheelToY(page, (await limiterTop()) - 300);
  await expect.poll(async () => (await beacons(page)).filter((b) => b.e === 'role' && b.l === 'demo').length).toBe(1);
  await wheelToY(page, (await limiterTop()) - 700);
  await wheelToY(page, (await limiterTop()) - 300);
  await page.waitForTimeout(300);
  expect((await beacons(page)).filter((b) => b.l === 'demo').length).toBe(1);
});
