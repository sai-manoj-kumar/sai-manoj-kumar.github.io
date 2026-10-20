import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

const html = readFileSync(new URL('../../dist/404.html', import.meta.url), 'utf8');
const { document: doc } = parseHTML(html);

test('the 404 page says what happened and links home', () => {
  assert.equal(doc.title, 'Page not found');
  assert.deepEqual([...doc.querySelectorAll('h1')].map((h) => h.textContent.trim()), ['Page not found']);
  const home = [...doc.querySelectorAll('main a')].find((a) => a.getAttribute('href') === '/');
  assert.ok(home, 'a link to / inside main');
  assert.equal(home.textContent.trim(), 'Go to the home page');
});

test('search engines skip it, and it does not claim to be the home page', () => {
  assert.equal(doc.querySelector('meta[name="robots"]')?.getAttribute('content'), 'noindex');
  assert.equal(doc.querySelector('link[rel="canonical"]'), null);
  assert.equal(doc.querySelector('meta[property="og:url"]'), null);
});

test('no link points at an in-page anchor that is not on this page', () => {
  // the home page's "Skip to experience" link targets #work, which does not exist here
  for (const a of doc.querySelectorAll('a[href^="#"]')) {
    const id = a.getAttribute('href').slice(1);
    assert.ok(doc.getElementById(id), `#${id} has no target on the 404 page`);
  }
});

test('it carries none of the home page', () => {
  assert.equal(doc.querySelectorAll('img').length, 0);
  assert.equal(doc.querySelectorAll('h2').length, 0);
  assert.doesNotMatch(html, /fontshare|mailto:/i);
});

test('it is a landmarked page', () => {
  assert.equal(doc.querySelectorAll('main').length, 1);
  assert.equal(doc.documentElement.getAttribute('lang'), 'en');
});

test('it uses the new design tokens, not a hard-coded palette', () => {
  assert.doesNotMatch(html, /#f1d2b6|#0c3a40/i);
});
