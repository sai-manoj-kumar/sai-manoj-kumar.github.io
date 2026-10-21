import test from 'node:test';
import assert from 'node:assert/strict';
import { doc } from './helpers.js';

const meta = (selector) => doc.querySelector(selector)?.getAttribute('content');

test('title, description and canonical', () => {
  assert.equal(doc.title, 'Sai Manoj | Senior Software Engineer');
  assert.match(meta('meta[name="description"]'), /senior software engineer\. Backend systems that run at scale/);
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

test('person structured data, favicon and sitemap are in place', () => {
  const ld = JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent);
  const person = ld['@graph'].find((n) => n['@type'] === 'Person');
  assert.equal(person.name, 'Sai Manoj');
  assert.equal(person.jobTitle, 'Senior Software Engineer');
  assert.deepEqual(person.sameAs, ['https://www.linkedin.com/in/sai-manoj-kumar', 'https://github.com/sai-manoj-kumar']);
  assert.equal(meta('meta[property="og:site_name"]'), 'Sai Manoj');
  assert.equal(meta('meta[name="twitter:title"]'), 'Sai Manoj | Senior Software Engineer');
  assert.ok(doc.querySelector('link[rel="icon"][href="/favicon.ico"]'));
});
