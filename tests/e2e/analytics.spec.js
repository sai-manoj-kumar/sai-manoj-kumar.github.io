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
  await page.locator('#connect a.btn').click();
  await expect.poll(async () => (await beacons(page)).length).toBe(3); // the observers report a frame later
  const sent = await beacons(page);
  expect(sent.map((b) => b.s)).toEqual(['test-link', 'test-link', 'test-link']);
  expect(sent.map((b) => `${b.e}:${b.l}`).sort()).toEqual(['end:connect', 'link:linkedin:connect', 'visit:page']);
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
  await page.locator('#connect a.btn').click();
  expect(await beacons(page)).toEqual([]);
});
