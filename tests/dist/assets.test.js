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

test('the stage photo is a web-sized crop', async () => {
  const meta = await sharp(fileURLToPath(dist('images/hero-stage.jpg'))).metadata();
  assert.equal(meta.width, 1100);
  assert.equal(meta.height, 1281);
  assert.ok(statSync(dist('images/hero-stage.jpg')).size < 450_000, 'stage photo under 450 KB');
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

test('the phone crop of the hero is sharp but light', async () => {
  const meta = await sharp(fileURLToPath(dist('images/hero-phone.jpg'))).metadata();
  assert.equal(meta.width, 800);
  assert.equal(meta.height, 1281);
  assert.ok(statSync(dist('images/hero-phone.jpg')).size < 200_000, 'phone hero under 200 KB');
});

test('the favicon follows the colour scheme', () => {
  const svg = readFileSync(dist('favicon.svg'), 'utf8');
  assert.match(svg, /prefers-color-scheme:\s*dark/);
  assert.doesNotMatch(svg, /#0c3a40|#f1d2b6/i, 'no colours from the old apricot and teal palette');
});

test('the share image uses the dark palette, not the old apricot ground', async () => {
  const { data } = await sharp(fileURLToPath(dist('og.jpg'))).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  // the average colour of a mostly tobacco-brown card is dark and warm; the old apricot card was light
  const [r, g, b] = data;
  assert.ok(r + g + b < 3 * 128, `average colour ${r},${g},${b} should be dark`);
});
