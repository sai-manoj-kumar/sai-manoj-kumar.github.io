import { test, expect } from '@playwright/test';

// The demo plays by itself when motion is allowed, which would add tickets under a test that is counting clicks, so the
// manual tests below run with reduced motion; the auto-play tests turn it back on.
test.use({ reducedMotion: 'reduce' });

// The site scrolls smoothly on purpose. Playwright scrolls a button into view before clicking it
// and would chase it while that animation runs, so the demo specs switch smooth scrolling off.
async function openPage(page) {
  await page.goto('/');
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
}

test('admits five, then answers 429 with a live countdown, then refills', async ({ page }) => {
  // A fake clock makes the refill timing exact: time only moves when the test says so.
  await page.clock.install({ time: 0 });
  await openPage(page);
  const take = page.locator('#take');
  const label = page.locator('#bucket-label');
  await expect(take).toBeEnabled();
  await page.clock.pauseAt(10000);

  for (let i = 0; i < 5; i += 1) await take.click();
  await expect(page.locator('#tickets .ticket', { hasText: '200 Admitted' })).toHaveCount(4); // list keeps the last four
  await expect(label).toHaveText('0 of 5 tokens left');

  await take.click();
  const denied = page.locator('#tickets .ticket.deny').first();
  await expect(denied).toContainText('429 Too Many Requests. Try again in 2s');

  await page.clock.runFor(1000);
  await expect(denied).toContainText('Try again in 1s');
  await expect(label).toHaveText('0 of 5 tokens left');

  await page.clock.runFor(1000);
  await expect(denied).toContainText('Try again now');
  await expect(label).toHaveText('1 of 5 tokens left');

  await page.clock.runFor(2000);
  await expect(label).toHaveText('2 of 5 tokens left');
});

test('thirty rapid clicks keep the list at four tickets and throw nothing (Review Focus 3)', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openPage(page);
  const take = page.locator('#take');
  await take.scrollIntoViewIfNeeded();
  // force: mash as fast as a thumb would, without Playwright waiting for the button between clicks
  for (let i = 0; i < 30; i += 1) await take.click({ force: true });
  expect(await page.locator('#tickets .ticket').count()).toBeLessThanOrEqual(4);
  await expect(page.locator('#tickets .ticket.deny').first()).toContainText(/Try again (in [12]s|now)/);
  expect(errors).toEqual([]);
});

test.describe('The demo on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('it is a section in the flow, not pinned, and Tab reaches it after the roles', async ({ page }) => {
    await openPage(page);
    const fixed = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((el) => ['fixed', 'sticky'].includes(getComputedStyle(el).position)).map((el) => el.className));
    expect(fixed).toEqual([]);
    const order = await page.evaluate(() => {
      const pos = (sel) => document.querySelector(sel).getBoundingClientRect().top + scrollY;
      return [pos('#work'), pos('#limiter'), pos('#stack'), pos('#about')];
    });
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    await expect(page.locator('#take')).toBeEnabled();
    await page.locator('#take').focus();
    await expect(page.locator('#take')).toBeFocused();
  });
});

test.describe('Auto-play', () => {
  test.use({ reducedMotion: 'no-preference' });

  const tickets = (page) => page.locator('#tickets .ticket');
  const auto = (page) => page.locator('#dispenser').getAttribute('data-auto');

  /* A fake clock, so the 0.7 s rhythm is exact. `watch` scrolls the demo into view and waits until it has noticed. */
  async function start(page, { watch = true } = {}) {
    await page.clock.install({ time: 0 });
    await openPage(page);
    await page.clock.pauseAt(10000);
    if (watch) {
      await page.locator('#dispenser').scrollIntoViewIfNeeded();
      await expect(page.locator('#dispenser')).toHaveAttribute('data-auto', 'on', { timeout: 3000 });
    }
  }

  test('it takes a ticket by itself every 0.7 s: admitted first, then 429s as the bucket runs dry, then admitted again as tokens refill', async ({ page }) => {
    await start(page);
    expect(await tickets(page).count()).toBe(0);
    await page.clock.runFor(2200);
    await expect(tickets(page)).toHaveCount(3);
    await expect(page.locator('#tickets .ticket.deny')).toHaveCount(0);
    await page.clock.runFor(6000);
    await expect(page.locator('#tickets .ticket.deny').first()).toContainText('429 Too Many Requests');
    await page.clock.runFor(1000);
    expect(await tickets(page).count()).toBeLessThanOrEqual(4);
    await expect(page.locator('#tickets .ticket', { hasText: '200 Admitted' }).first()).toBeVisible();
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

  test('the first click takes over for good: auto-play stops and the list is announced again', async ({ page }) => {
    await start(page);
    await expect(page.locator('#tickets')).toHaveAttribute('aria-live', 'off');
    await page.clock.runFor(1500);
    await page.locator('#take').click();
    expect(await auto(page)).toBe('manual');
    await expect(page.locator('#tickets')).toHaveAttribute('aria-live', 'polite');
    const newest = () => page.evaluate(() => document.querySelector('#tickets .ticket span').textContent);
    const mine = await newest();
    await page.clock.runFor(10000);
    expect(await newest()).toBe(mine);
    expect(await auto(page)).toBe('manual');
  });

  test.describe('Reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('nothing plays by itself', async ({ page }) => {
      await start(page, { watch: false });
      await page.locator('#dispenser').scrollIntoViewIfNeeded();
      await page.clock.runFor(8000);
      expect(await tickets(page).count()).toBe(0);
      expect(await auto(page)).toBe('off');
      await expect(page.locator('#tickets')).toHaveAttribute('aria-live', 'polite');
    });
  });
});
