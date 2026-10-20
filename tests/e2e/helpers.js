/* Scroll the way a person does: with the mouse wheel. window.scrollTo() ignores `overflow: hidden`
   on <body>, which once hid a page-wide scroll bug, so layout tests must use this. */
export async function wheelToY(page, targetY) {
  await page.mouse.move(900, 450);
  for (let i = 0; i < 80; i += 1) {
    const y = await page.evaluate(() => window.scrollY);
    const delta = targetY - y;
    if (Math.abs(delta) <= 40) return;
    await page.mouse.wheel(0, Math.sign(delta) * Math.min(500, Math.abs(delta)));
    await page.waitForTimeout(60);
  }
  throw new Error(`could not wheel to ${targetY}`);
}

/* Where each role starts, in page coordinates. */
export const roleTops = (page) =>
  page.evaluate(() => [...document.querySelectorAll('.role')].map((r) => Math.round(r.getBoundingClientRect().top + window.scrollY)));
