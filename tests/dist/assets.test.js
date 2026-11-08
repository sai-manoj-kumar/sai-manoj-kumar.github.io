import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const dist = (p) => new URL(`../../dist/${p}`, import.meta.url);

test('the share image is a 1200 x 630 card', async () => {
  const meta = await sharp(fileURLToPath(dist('og.jpg'))).metadata();
  assert.equal(meta.width, 1200);
  assert.equal(meta.height, 630);
  assert.ok(statSync(dist('og.jpg')).size < 250_000, 'share image stays small');
});

test('favicons exist', () => {
  for (const f of ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png']) {
    assert.ok(statSync(dist(f)).size > 0, f);
  }
});

test('cache and security headers are published', () => {
  const headers = readFileSync(dist('_headers'), 'utf8');
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /\/_astro\/\*/);
});

test('the favicon follows the colour scheme', () => {
  const svg = readFileSync(dist('favicon.svg'), 'utf8');
  assert.match(svg, /prefers-color-scheme:\s*dark/);
  assert.doesNotMatch(svg, /#0c3a40|#f1d2b6/i, 'no colours from the old apricot and teal palette');
});

test('the share image uses the dark palette, not the old apricot ground', async () => {
  const { data } = await sharp(fileURLToPath(dist('og.jpg'))).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  // the average colour of a mostly deep-green card is dark; the old apricot card was light
  const [r, g, b] = data;
  assert.ok(r + g + b < 3 * 128, `average colour ${r},${g},${b} should be dark`);
});

test('the favicon uses the white, ink and blue palette', () => {
  const svg = readFileSync(dist('favicon.svg'), 'utf8');
  for (const hex of ['#14161a', '#ffffff', '#7b9bff']) assert.ok(svg.toLowerCase().includes(hex), `favicon has ${hex}`);
  for (const hex of ['#2b170a', '#f1ebdc', '#c79a3e', '#0f2a24', '#f3faf6', '#3ee0b0']) assert.ok(!svg.toLowerCase().includes(hex), `favicon drops ${hex}`);
});

test('favicon.ico exists and starts with the ICO header bytes 00 00 01 00', () => {
  const ico = readFileSync(dist('favicon.ico'));
  assert.deepEqual([...ico.subarray(0, 4)], [0, 0, 1, 0]);
});
