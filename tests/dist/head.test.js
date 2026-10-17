import test from 'node:test';
import assert from 'node:assert/strict';
import { doc } from './helpers.js';

const meta = (selector) => doc.querySelector(selector)?.getAttribute('content');

test('title, description and canonical', () => {
  assert.equal(doc.title, 'Sai Manoj');
  assert.match(meta('meta[name="description"]'), /senior software engineer in India/);
  assert.equal(doc.querySelector('link[rel="canonical"]').getAttribute('href'), 'https://saimanoj.com/');
  assert.equal(doc.documentElement.getAttribute('lang'), 'en');
});

test('share tags point at the name card', () => {
  assert.equal(meta('meta[property="og:image"]'), 'https://saimanoj.com/og.jpg');
  assert.equal(meta('meta[property="og:image:width"]'), '1200');
  assert.equal(meta('meta[property="og:image:height"]'), '630');
  assert.equal(meta('meta[name="twitter:card"]'), 'summary_large_image');
});

test('the skip link is the first thing in the body', () => {
  const first = doc.body.querySelector('a');
  assert.equal(first.getAttribute('href'), '#work');
  assert.equal(first.textContent.trim(), 'Skip to experience');
});

test('fonts come from this site, not Fontshare', () => {
  assert.doesNotMatch(doc.documentElement.outerHTML, /fontshare/i);
});
