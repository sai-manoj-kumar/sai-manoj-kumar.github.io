import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../../src/styles/global.css', import.meta.url), 'utf8');

/* Every declaration of a property family, as [property, value, rule text], skipping custom property definitions. */
function declarations(family) {
  const found = [];
  const pattern = new RegExp(`(?<![\\w-])(${family})([a-z-]*)\\s*:\\s*([^;}]+)`, 'g');
  for (const m of css.matchAll(pattern)) found.push([m[1] + m[2], m[3].trim()]);
  return found;
}

const SPACING = 'padding|margin|gap|row-gap|column-gap|scroll-margin|scroll-padding';

test('spacing comes from the scale: no pixel literals in padding, margin or gap', () => {
  const literals = declarations(SPACING).filter(([, value]) => /\d+(\.\d+)?px/.test(value));
  assert.deepEqual(literals, [], 'use var(--space-1..6) or a named fluid token');
});

test('corner radius comes from the scale: a radius token, a circle, or none', () => {
  const stray = declarations('border-radius').filter(([, value]) => !/^(var\(--radius-(sm|md|lg)\)|50%|0)$/.test(value));
  assert.deepEqual(stray, [], 'use var(--radius-sm|md|lg) or 50% for a circle');
});

test('the scales are defined once, in the root', () => {
  const root = css.slice(css.indexOf('--space-1:'), css.indexOf('}', css.indexOf('--space-1:')));
  const token = (name) => root.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();
  assert.deepEqual(
    ['space-1', 'space-2', 'space-3', 'space-4', 'space-5', 'space-6'].map(token),
    ['4px', '8px', '12px', '16px', '24px', '32px'],
  );
  assert.deepEqual(['radius-sm', 'radius-md', 'radius-lg'].map(token), ['4px', '6px', '8px']);
  assert.equal(css.match(/--space-1:/g).length, 1);
});

test('control sizes come from tokens: no 44px or 48px literal in width, height or min-height', () => {
  const stray = declarations('width|height|min-height').filter(([, value]) => /\b(44|48)px\b/.test(value));
  assert.deepEqual(stray, [], 'use var(--control) for chrome controls and var(--control-lg) for the primary button');
});

test('the control tokens are defined, and the lane inset is half a control', () => {
  const root = css.slice(css.indexOf('--space-1:'), css.indexOf('}', css.indexOf('--space-1:')));
  const token = (name) => root.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();
  assert.equal(token('control'), '44px');
  assert.equal(token('control-lg'), '48px');
  assert.equal(token('lane-inset'), 'calc(var(--control) / 2)');
});

test('motion timing comes from tokens: no seconds or milliseconds literal in transition or animation', () => {
  const stray = declarations('transition|animation').filter(([, value]) => /\d(\.\d+)?m?s\b/.test(value));
  assert.deepEqual(stray, [], 'use var(--duration-fast) or var(--duration-base)');
});

test('the durations are defined once: fast for hover, base for state changes and entrances', () => {
  const root = css.slice(css.indexOf('--space-1:'), css.indexOf('}', css.indexOf('--space-1:')));
  const token = (name) => root.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();
  assert.equal(token('duration-fast'), '0.18s');
  assert.equal(token('duration-base'), '0.25s');
});
