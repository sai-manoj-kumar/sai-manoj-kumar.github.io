import { test, expect } from '@playwright/test';

for (const scheme of ['light', 'dark']) {
  for (const width of [320, 390, 861, 1440]) {
    test(`/projects fits the screen, ${scheme} at ${width}px`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/projects');
      await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 'no sideways scroll').toBeLessThanOrEqual(0);
      const boxes = await page.locator('.project').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()));
      expect(boxes).toHaveLength(2);
      expect(boxes[1].top, 'the projects stack top to bottom').toBeGreaterThanOrEqual(boxes[0].bottom);
      for (const b of boxes) expect(b.right).toBeLessThanOrEqual(width);
    });
  }
}

test('each project links to its own site, and the name takes you back home', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.getByRole('link', { name: 'Cloud Cert Mastery' })).toHaveAttribute('href', 'https://cloudcertmastery.com');
  await expect(page.getByRole('link', { name: 'Steadion' })).toHaveAttribute('href', 'https://steadion.fit');
  await page.getByRole('link', { name: 'Sai Manoj', exact: true }).first().click();
  await expect(page).toHaveURL('/');
});

test('the home page ends with a small link that opens /projects, and it is a usable tap target', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  const link = page.locator('footer a[href="/projects/"]');
  await link.scrollIntoViewIfNeeded();
  const box = await link.boundingBox();
  expect(box.height, 'at least a 24px target (WCAG 2.2)').toBeGreaterThanOrEqual(24);
  const size = await link.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size, 'smaller than the body text').toBeLessThan(14);
  await link.click();
  await expect(page).toHaveURL('/projects/');
  await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible();
});
