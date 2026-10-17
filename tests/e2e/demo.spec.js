import { test, expect } from '@playwright/test';

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
