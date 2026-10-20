import { test, expect } from '@playwright/test';

test.describe('JavaScript off (Review Focus 1)', () => {
  test.use({ javaScriptEnabled: false });

  test('the page reads in full and the demo explains itself', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#fallback')).toBeVisible();
    await expect(page.locator('#take')).toBeDisabled();
    await expect(page.locator('.role').first()).toBeVisible();
    expect(await page.locator('.role').first().evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await expect(page.locator('#stack .group')).toHaveCount(4);
  });
});

test.describe('Reduced motion (Review Focus 2)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('every section is visible and nothing animates in', async ({ page }) => {
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.classList.contains('anim'))).toBe(false);
    for (const selector of ['.role', '#stack .group', '#about', '#connect']) {
      const el = page.locator(selector).first();
      await expect(el).toBeVisible();
      expect(await el.evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    }
  });
});

test.describe('A 320 px phone (Review Focus 4)', () => {
  test.use({ viewport: { width: 320, height: 700 } });

  test('nothing scrolls sideways', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('Keyboard', () => {
  test('tabbing through the page never lands on an invisible element', async ({ page }) => {
    await page.goto('/');
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
    const landed = [];
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      landed.push(
        await page.evaluate(() => {
          const el = document.activeElement;
          const style = getComputedStyle(el);
          const box = el.getBoundingClientRect();
          const name = `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}`;
          const invisible = style.visibility === 'hidden' || Number(style.opacity) === 0 || box.width === 0 || box.height === 0;
          return { name, invisible };
        }),
      );
    }
    expect(landed.filter((e) => e.invisible).map((e) => e.name)).toEqual([]);
    expect(landed.map((e) => e.name)).toContain('button#take'); // the walk really did reach the demo
  });
});
