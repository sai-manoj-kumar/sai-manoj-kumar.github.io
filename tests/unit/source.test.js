import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSource, cleanSource } from '../../src/scripts/source.js';

const from = (over) => resolveSource({ host: 'saimanoj.com', ...over });

test('no referrer and no tag is direct', () => {
  assert.equal(from({}), 'direct');
  assert.equal(from({ referrer: '' }), 'direct');
});

test('a ?ref= tag wins over the referrer, and ?utm_source= wins over ?ref=', () => {
  assert.equal(from({ search: '?ref=linkedin-profile', referrer: 'https://www.google.com/' }), 'linkedin-profile');
  assert.equal(from({ search: '?ref=a&utm_source=b' }), 'b');
});

test('known referrers merge into one name', () => {
  assert.equal(from({ referrer: 'https://t.co/abc123' }), 'twitter');
  assert.equal(from({ referrer: 'https://lnkd.in/xyz' }), 'linkedin');
  assert.equal(from({ referrer: 'https://www.linkedin.com/in/someone' }), 'linkedin');
  assert.equal(from({ referrer: 'android-app://com.linkedin.android/' }), 'linkedin');
  assert.equal(from({ referrer: 'https://www.google.co.in/' }), 'google');
  assert.equal(from({ referrer: 'https://github.com/sai-manoj-kumar' }), 'github');
});

test('an unknown referrer keeps only its hostname', () => {
  assert.equal(from({ referrer: 'https://www.example.org/some/path?token=secret#frag' }), 'example.org');
});

test('a referrer from this site, or one that is not a URL, is direct', () => {
  assert.equal(from({ referrer: 'https://saimanoj.com/missing' }), 'direct');
  assert.equal(from({ referrer: 'https://www.saimanoj.com/' }), 'direct');
  assert.equal(from({ referrer: 'not a url' }), 'direct');
});

test('an empty or junk tag falls back to the referrer', () => {
  assert.equal(from({ search: '?ref=', referrer: 'https://t.co/x' }), 'twitter');
  assert.equal(from({ search: '?ref=%20%3C%3E', referrer: 'https://t.co/x' }), 'twitter');
});

test('cleanSource keeps [a-z0-9._-], lowercases and caps at 40 characters', () => {
  assert.equal(cleanSource('My Site!<script>'), 'mysitescript');
  assert.equal(cleanSource('a'.repeat(100)).length, 40);
  assert.equal(cleanSource(undefined), '');
  assert.equal(cleanSource(null), '');
});
