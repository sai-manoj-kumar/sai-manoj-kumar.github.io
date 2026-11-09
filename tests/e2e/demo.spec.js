import { test, expect } from '@playwright/test';

// The demo has no controls: it plays by itself while it is on screen. Every test drives it with a fake clock, so the
// 1.2 s rhythm and the refill are exact. Reduced motion is the one case where it never plays.
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
    await page.clock.runFor(1200);
    if (await page.locator('#tickets .ticket').first().evaluate((el) => el.classList.contains('deny'))) return;
  }
  throw new Error('the demo never answered 429');
}

test('there is nothing to click: no button, link or focusable element in the demo', async ({ page }) => {
  await openPage(page);
  expect(await page.locator('#dispenser button, #dispenser a, #dispenser input, #dispenser [tabindex]').count()).toBe(0);
});

test('it sends a ticket every 1.2 s: admitted first, then 429s as the bucket runs dry, then admitted again as tokens refill', async ({ page }) => {
  await start(page);
  expect(await tickets(page).count()).toBe(0);
  await page.clock.runFor(3600);
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
    const lane = (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); const wide = r.width > r.height; const m = (x, y) => [x - map.left - 7, y - map.top - 7]; return wide ? [m(r.left, r.top + r.height / 2), m(r.right, r.top + r.height / 2)] : [m(r.left + r.width / 2, r.top), m(r.left + r.width / 2, r.bottom)]; };
    return { lanes: { in: lane('.arch-in'), ask: lane('.arch-ask .arch-lane'), go: lane('.arch-go') }, cls: parcel.className, path: frames.map(xy), clients: centre('.arch-clients .arch-node'), gate: centre('.arch-gateway .arch-node'), hot: centre('.arch-node.hot'), service: centre('.arch-services .arch-node') };
  }, which);

  test('an admitted ticket goes Clients, gateway, asks the rate limiter, comes back to the gateway, then ends at the backend; then it is gone', async ({ page }) => {
    await start(page);
    await page.clock.runFor(1200);
    await expect(page.locator('.arch-parcel')).toHaveCount(1);
    const p = await points(page, 0);
    expect(p.cls).toMatch(/\bok\b/);
    const first = p.path[0];
    const last = p.path.at(-1);
    expect(Math.abs(first[0] - p.clients[0])).toBeLessThan(2);
    const near = ([x, y], to) => Math.abs(x - to[0]) < 2 && Math.abs(y - to[1]) < 2;
    const askedAt = p.path.findIndex((pt) => near(pt, p.hot));
    expect(askedAt, 'it goes to the rate limiter').toBeGreaterThan(0);
    expect(p.path.slice(0, askedAt).some((pt) => near(pt, p.gate)), 'after the gateway').toBe(true);
    expect(p.path.slice(askedAt + 1).some((pt) => near(pt, p.gate)), 'and returns to the gateway with the answer').toBe(true);
    expect(last[0], 'then ends at the backend').toBeGreaterThan(p.gate[0] + 40);
    expect(Math.abs(last[1] - p.service[1])).toBeLessThan(2);
    await expect(page.locator('.arch-parcel')).toHaveCount(0, { timeout: 5000 });
  });

  /* The dot rides the grey lines: it never cuts across a box from one centre to the next. */
  const idx = (path, to, from = 0) => path.findIndex((pt, i) => i >= from && Math.abs(pt[0] - to[0]) < 1.5 && Math.abs(pt[1] - to[1]) < 1.5);
  const rides = (path, [a, b], from = 0) => {
    const i = idx(path, a, from);
    const j = idx(path, b, i + 1);
    return i >= 0 && j === i + 1 ? j : -1;
  };

  test('an admitted ticket rides the line from Clients to the gateway, then moves to the centre; asks along its line; and leaves along the line to the backend', async ({ page }) => {
    await start(page);
    await page.clock.runFor(1200);
    await expect(page.locator('.arch-parcel')).toHaveCount(1);
    const p = await points(page, 0);
    const intoGate = rides(p.path, p.lanes.in);
    expect(intoGate, 'along the lane from Clients to the gateway').toBeGreaterThan(0);
    expect(idx(p.path, p.gate, intoGate), 'and only then to the centre of the gateway box').toBe(intoGate + 1);
    const down = rides(p.path, p.lanes.ask, intoGate);
    expect(down, 'down the question line to the rate limiter').toBeGreaterThan(intoGate);
    expect(idx(p.path, p.hot, down)).toBe(down + 1);
    const up = rides(p.path, [p.lanes.ask[1], p.lanes.ask[0]], down + 1);
    expect(up, 'and back up the same line with the answer').toBeGreaterThan(down);
    const out = rides(p.path, p.lanes.go, up);
    expect(out, 'then along the line to the backend').toBeGreaterThan(up);
  });

  test('a denied ticket comes back along the same line into Clients', async ({ page }) => {
    await start(page);
    await untilDenied(page);
    const count = await page.locator('.arch-parcel').count();
    const p = await points(page, count - 1);
    const home = rides(p.path, [p.lanes.in[1], p.lanes.in[0]], idx(p.path, p.hot));
    expect(home, 'back along the lane from the gateway to Clients').toBeGreaterThan(0);
    expect(idx(p.path, p.clients, home)).toBe(home + 1);
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
    const near = ([x, y], to) => Math.abs(x - to[0]) < 2 && Math.abs(y - to[1]) < 2;
    const askedAt = p.path.findIndex((pt) => near(pt, p.hot));
    expect(askedAt).toBeGreaterThan(0);
    expect(p.path.slice(askedAt + 1).some((pt) => near(pt, p.gate)), 'the gateway gets the no, then answers 429').toBe(true);
  });

  test('the rate limiter node flashes with each ticket: accent glow when admitted, dark when denied, then settles', async ({ page }) => {
    await start(page);
    const arch = page.locator('figure.arch');
    await expect(arch).not.toHaveAttribute('data-flash', /.+/);
    await page.clock.runFor(1200);
    await expect(arch).toHaveAttribute('data-flash', 'admit');
    await page.clock.runFor(460);
    await expect(arch).not.toHaveAttribute('data-flash', /.+/);
    await page.clock.runFor(740); // back on the 1.2 s beat, so each step below ends exactly on a ticket
    await untilDenied(page);
    await expect(arch).toHaveAttribute('data-flash', 'deny');
    await page.clock.runFor(460);
    await expect(arch).not.toHaveAttribute('data-flash', /.+/);
  });

  test('the tokens in the rate limiter node drain as tickets are admitted', async ({ page }) => {
    await start(page);
    await page.clock.runFor(2500);
    await expect(page.locator('.arch-node.hot .chip.empty')).toHaveCount(2);
    await expect(page.locator('.arch-node.hot #bucket-label')).toHaveText('3 of 5 tokens left');
  });

  test.describe('On a phone', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('an admitted ticket never passes through the rate limiter on its way to the backend', async ({ page }) => {
      await start(page);
      await page.clock.runFor(1200);
      await expect(page.locator('.arch-parcel')).toHaveCount(1);
      const { path, hot, back } = await page.evaluate(() => {
        const parcel = document.querySelector('.arch-parcel');
        const xy = (f) => f.transform.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/).slice(1).map(Number);
        const map = document.querySelector('.arch-map').getBoundingClientRect();
        const h = document.querySelector('.arch-node.hot').getBoundingClientRect();
        const g = document.querySelector('.arch-gateway .arch-node').getBoundingClientRect();
        return { path: parcel.getAnimations()[0].effect.getKeyframes().map(xy), hot: { l: h.left - map.left, r: h.right - map.left, t: h.top - map.top, b: h.bottom - map.top }, back: g.left - map.left };
      });
      const inside = ([x, y]) => x + 7 > hot.l && x + 7 < hot.r && y + 7 > hot.t && y + 7 < hot.b;
      const visits = path.map((pt, i) => [inside(pt), i]).filter(([yes]) => yes).map(([, i]) => i);
      const lastVisit = visits.at(-1);
      expect(lastVisit, 'it does visit the limiter').toBeGreaterThan(0);
      expect(path.slice(lastVisit + 1).every((pt) => !inside(pt)), 'and everything after leaves it behind, heading for the backend').toBe(true);
      expect(path.slice(lastVisit + 1).every(([x]) => x + 7 <= hot.l + 0.5), 'the way on to the backend stays on the gateway side').toBe(true);
    });
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
