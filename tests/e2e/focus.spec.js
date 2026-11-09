import { test, expect } from '@playwright/test';

// Keyboard focus rings must be visible: `outline: ... currentColor` is invisible whenever the
// element's text colour equals the colour it sits on. For each control, Tab to it with the real
// keyboard and check the ring against the colour it is drawn on (the nearest ancestor with a
// background, since an outline is painted outside the element) with the WCAG contrast formula.

const TARGETS = [
  { name: 'top bar LinkedIn link', selector: '.topbar-link[data-track="linkedin:topbar"]' },
  { name: 'selected theme option', selector: '.theme input:checked + span', focus: '.theme input:checked' },
];

async function tabTo(page, focusSelector) {
  for (let i = 0; i < 80; i += 1) {
    await page.keyboard.press('Tab');
    if (await page.evaluate((s) => document.activeElement?.matches(s), focusSelector)) return;
  }
  throw new Error(`Tab never reached ${focusSelector}`);
}

for (const scheme of ['light', 'dark']) {
  test.describe(`${scheme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((s) => localStorage.setItem('theme', s), scheme);
      await page.setViewportSize({ width: 1440, height: 800 });
      await page.goto('/');
    });

    for (const t of TARGETS) {
      test(`${t.name} shows a keyboard focus ring with 3:1 contrast against what it sits on`, async ({ page }) => {
        expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe(scheme);
        await tabTo(page, t.focus ?? t.selector);

        const r = await page.evaluate((sel) => {
          const parse = (c) => {
            const m = c.match(/rgba?\(([^)]+)\)/);
            if (!m) throw new Error(`unparsed colour ${c}`);
            const [red, green, blue, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
            return { rgb: [red, green, blue], a };
          };
          const lum = ([red, green, blue]) => {
            const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
            return 0.2126 * f(red) + 0.7152 * f(green) + 0.0722 * f(blue);
          };
          const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
          const el = document.querySelector(sel);
          const cs = getComputedStyle(el);
          let p = el.parentElement;
          while (p && parse(getComputedStyle(p).backgroundColor).a === 0) p = p.parentElement;
          const bg = getComputedStyle(p ?? document.documentElement).backgroundColor;
          const ring = parse(cs.outlineColor);
          return {
            focused: el.matches(':focus-visible') || el.previousElementSibling?.matches(':focus-visible') === true,
            style: cs.outlineStyle, width: cs.outlineWidth, ring: cs.outlineColor, text: cs.color, bg,
            contrast: ratio(ring.rgb, parse(bg).rgb),
          };
        }, t.selector);

        expect(r.focused).toBe(true);
        expect(r.style).not.toBe('none');
        expect(r.ring, 'ring must not be the control text colour (currentColor)').not.toBe(r.text);
        expect(r.ring).not.toBe(r.bg);
        expect(r.contrast, `ring ${r.ring} on ${r.bg}`).toBeGreaterThanOrEqual(3);
      });
    }
  });
}
