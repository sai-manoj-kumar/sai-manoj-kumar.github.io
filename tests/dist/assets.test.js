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

test('the hero photo is web-sized', async () => {
  const meta = await sharp(fileURLToPath(dist('images/hero.jpg'))).metadata();
  assert.equal(meta.width, 1920);
  assert.ok(statSync(dist('images/hero.jpg')).size < 450_000, 'hero under 450 KB');
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
