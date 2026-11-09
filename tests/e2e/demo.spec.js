import { test, expect } from '@playwright/test';

// The demo has no controls: it plays by itself while it is on screen. Every test drives it with a fake clock, so the
// 0.7 s rhythm and the refill are exact. Reduced motion is the one case where it never plays.
test.use({ reducedMotion: 'no-preference' });

// The site scrolls smoothly on purpose. Playwright would chase a scroll-into-view while that animation runs,
// so the demo specs switch smooth scrolling off.
async function openPage(page) {
  await page.goto('/');
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
}

const tickets = (page) => page.locator('#tickets .ticket');
const auto = (page) => page.locator('#dispenser').getAttribute('data-auto');

/* `watch` scrolls the demo into view and waits until it has noticed and started. */
async function start(page, { watch = true } = {}) {
  await page.clock.install({ time: 0 });
  await openPage(page);
  await page.clock.pauseAt(10000);
  if (watch) {
    await page.locator('#dispenser').scrollIntoViewIfNeeded();
    await expect(page.locator('#dispenser')).toHaveAttribute('data-auto', 'on', { timeout: 3000 });
  }
}

/* Run the clock one tick at a time until the newest ticket is a 429. */
async function untilDenied(page) {
  for (let i = 0; i < 30; i += 1) {
    await page.clock.runFor(700);
    if (await page.locator('#tickets .ticket').first().evaluate((el) => el.classList.contains('deny'))) return;
  }
  throw new Error('the demo never answered 429');
}

test('there is nothing to click: no button, link or focusable element in the demo', async ({ page }) => {
  await openPage(page);
  expect(await page.locator('#dispenser button, #dispenser a, #dispenser input, #dispenser [tabindex]').count()).toBe(0);
});

test('it sends a ticket every 0.7 s: admitted first, then 429s as the bucket runs dry, then admitted again as tokens refill', async ({ page }) => {
  await start(page);
  expect(await tickets(page).count()).toBe(0);
  await page.clock.runFor(2200);
  await expect(tickets(page)).toHaveCount(3);
  await expect(page.locator('#tickets .ticket.deny')).toHaveCount(0);
  await untilDenied(page);
  const denied = page.locator('#tickets .ticket.deny').first();
  await expect(denied).toContainText('429 Too Many Requests. Try again in');
  await page.clock.runFor(8000);
  expect(await tickets(page).count()).toBeLessThanOrEqual(4);
  await expect(page.locator('#tickets .ticket', { hasText: '200 Admitted' }).first()).toBeVisible();
});

test('a minute of it keeps the list at four tickets and throws nothing', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page);
  for (let i = 0; i < 12; i += 1) await page.clock.runFor(5000);
  expect(await tickets(page).count()).toBeLessThanOrEqual(4);
  await expect(page.locator('#tickets .ticket.deny').first()).toContainText(/Try again (in [12]s|now)/);
  expect(errors).toEqual([]);
});

test('it does nothing while the demo is off screen', async ({ page }) => {
  await start(page, { watch: false });
  expect(await auto(page)).toBe('off');
  await page.clock.runFor(8000);
  expect(await tickets(page).count()).toBe(0);
});

test('it pauses when the demo scrolls away and carries on when it comes back', async ({ page }) => {
  await start(page);
  await page.clock.runFor(1500);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect(page.locator('#dispenser')).toHaveAttribute('data-auto', 'off', { timeout: 3000 });
  const frozen = await page.locator('#tickets .ticket').first().innerText();
  await page.clock.runFor(8000);
  expect(await page.locator('#tickets .ticket').first().innerText()).toBe(frozen);
  await page.locator('#dispenser').scrollIntoViewIfNeeded();
  await expect(page.locator('#dispenser')).toHaveAttribute('data-auto', 'on', { timeout: 3000 });
  await page.clock.runFor(1500);
  expect(await page.locator('#tickets .ticket').first().innerText()).not.toBe(frozen);
});

test('the list is never announced to a screen reader', async ({ page }) => {
  await start(page);
  await expect(page.locator('#tickets')).toHaveAttribute('aria-live', 'off');
});

test.describe('The demo on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('it is a section in the flow, not pinned, after the roles', async ({ page }) => {
    await openPage(page);
    const fixed = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((el) => ['fixed', 'sticky'].includes(getComputedStyle(el).position)).map((el) => el.className));
    expect(fixed).toEqual([]);
    const order = await page.evaluate(() => {
      const pos = (sel) => document.querySelector(sel).getBoundingClientRect().top + scrollY;
      return [pos('#work'), pos('#limiter'), pos('#stack'), pos('#about')];
    });
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});

test.describe('Tickets travel the diagram', () => {
  const points = (page, which) => page.evaluate((w) => {
    const parcel = document.querySelectorAll('.arch-parcel')[w];
    const frames = parcel.getAnimations()[0].effect.getKeyframes();
    const xy = (f) => f.transform.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/).slice(1).map(Number);
    const map = document.querySelector('.arch-map').getBoundingClientRect();
    const centre = (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return [r.left - map.left + r.width / 2 - 7, r.top - map.top + r.height / 2 - 7]; };
    return { cls: parcel.className, path: frames.map(xy), clients: centre('.arch-clients .arch-node'), hot: centre('.arch-node.hot') };
  }, which);

  test('an admitted ticket leaves Clients, stops at the rate limiter and ends at the service; then it is gone', async ({ page }) => {
    await start(page);
    await page.clock.runFor(700);
    await expect(page.locator('.arch-parcel')).toHaveCount(1);
    const p = await points(page, 0);
    expect(p.cls).toMatch(/\bok\b/);
    const first = p.path[0];
    const last = p.path.at(-1);
    expect(Math.abs(first[0] - p.clients[0])).toBeLessThan(2);
    expect(p.path.some(([x, y]) => Math.abs(x - p.hot[0]) < 2 && Math.abs(y - p.hot[1]) < 2), 'it stops at the rate limiter').toBe(true);
    expect(last[0], 'and ends past the limiter, at the service').toBeGreaterThan(p.hot[0] + 40);
    await expect(page.locator('.arch-parcel')).toHaveCount(0, { timeout: 4000 });
  });

  test('a denied ticket goes to the rate limiter and comes back to Clients, marked as denied', async ({ page }) => {
    await start(page);
    await untilDenied(page);
    const count = await page.locator('.arch-parcel').count();
    const p = await points(page, count - 1);
    expect(p.cls).toMatch(/\bno\b/);
    const last = p.path.at(-1);
    expect(Math.abs(last[0] - p.clients[0])).toBeLessThan(2);
    expect(Math.abs(last[1] - p.clients[1])).toBeLessThan(2);
    expect(p.path.some(([x, y]) => Math.abs(x - p.hot[0]) < 2 && Math.abs(y - p.hot[1]) < 2)).toBe(true);
  });

  test('the rate limiter node flashes with each ticket: accent glow when admitted, dark when denied, then settles', async ({ page }) => {
    await start(page);
    const arch = page.locator('figure.arch');
    await expect(arch).not.toHaveAttribute('data-flash', /.+/);
    await page.clock.runFor(700);
    await expect(arch).toHaveAttribute('data-flash', 'admit');
    await page.clock.runFor(460);
    await expect(arch).not.toHaveAttribute('data-flash', /.+/);
    await page.clock.runFor(240); // back on the 0.7 s beat, so each step below ends exactly on a ticket
    await untilDenied(page);
    await expect(arch).toHaveAttribute('data-flash', 'deny');
    await page.clock.runFor(460);
    await expect(arch).not.toHaveAttribute('data-flash', /.+/);
  });

  test('the tokens in the rate limiter node drain as tickets are admitted', async ({ page }) => {
    await start(page);
    await page.clock.runFor(1400);
    await expect(page.locator('.arch-node.hot .chip.empty')).toHaveCount(2);
    await expect(page.locator('.arch-node.hot #bucket-label')).toHaveText('3 of 5 tokens left');
  });

  test.describe('Reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('nothing plays and nothing travels: the diagram stays at rest with all five tokens', async ({ page }) => {
      await start(page, { watch: false });
      await page.locator('#dispenser').scrollIntoViewIfNeeded();
      await page.clock.runFor(8000);
      expect(await tickets(page).count()).toBe(0);
      expect(await page.locator('.arch-parcel').count()).toBe(0);
      expect(await auto(page)).toBe('off');
      await expect(page.locator('#bucket-label')).toHaveText('5 of 5 tokens left');
    });
  });
});
