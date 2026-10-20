import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../../src/styles/global.css', import.meta.url), 'utf8');

/* The text between the first `{` after `header` and its closing `}`. */
function block(header) {
  const at = css.indexOf(header);
  assert.notEqual(at, -1, `global.css has "${header}"`);
  const open = css.indexOf('{', at);
  return css.slice(open + 1, css.indexOf('}', open));
}
const tokens = (body) => Object.fromEntries([...body.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2].toLowerCase()]));

const light = tokens(block(':root {'));
const dark = tokens(block(':root[data-theme="dark"] {'));
const darkViaMedia = tokens(block(':root:not([data-theme="light"]) {'));

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const TEXT = [['ink', 'bg'], ['ink', 'surface'], ['muted', 'bg'], ['muted', 'surface'], ['accent-ink', 'accent']];
const GRAPHICS = [['accent', 'bg'], ['accent', 'surface']];

test('the palettes match the spec', () => {
  assert.equal(light.bg, '#f1ebdc');
  assert.equal(light.accent, '#525e1b');
  assert.equal(dark.bg, '#472913');
  assert.equal(dark.accent, '#c79a3e');
});

test('the dark palette is identical whether it comes from the OS or from the switch', () => {
  assert.deepEqual(darkViaMedia, dark);
});

for (const [name, palette] of [['light', light], ['dark', dark]]) {
  test(`${name}: every text pair is at least 4.5:1`, () => {
    for (const [fg, bg] of TEXT) {
      assert.ok(ratio(palette[fg], palette[bg]) >= 4.5, `${fg} on ${bg}: ${ratio(palette[fg], palette[bg]).toFixed(2)}`);
    }
  });
  test(`${name}: graphics are at least 3:1`, () => {
    for (const [fg, bg] of GRAPHICS) {
      assert.ok(ratio(palette[fg], palette[bg]) >= 3, `${fg} on ${bg}: ${ratio(palette[fg], palette[bg]).toFixed(2)}`);
    }
  });
}
