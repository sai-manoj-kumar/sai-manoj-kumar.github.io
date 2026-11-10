import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { doc as home } from './helpers.js';

const html = readFileSync(new URL('../../dist/projects/index.html', import.meta.url), 'utf8');
const { document: doc } = parseHTML(html);
const sitemap = readFileSync(new URL('../../dist/sitemap.xml', import.meta.url), 'utf8');

test('/projects is its own page: title, canonical and share URL point at /projects', () => {
  assert.equal(doc.title, 'Projects | Sai Manoj');
  assert.equal(doc.querySelector('link[rel="canonical"]').getAttribute('href'), 'https://saimanoj.com/projects');
  assert.equal(doc.querySelector('meta[property="og:url"]').getAttribute('content'), 'https://saimanoj.com/projects');
  assert.ok(doc.querySelector('meta[name="description"]').getAttribute('content').length > 20);
  assert.equal(doc.querySelector('meta[name="robots"]'), null, 'it is meant to be indexed');
  assert.equal(doc.documentElement.getAttribute('lang'), 'en');
});

test('it lists the two side projects, each linking to its own site', () => {
  assert.deepEqual([...doc.querySelectorAll('h1')].map((h) => h.textContent.trim()), ['Projects']);
  const items = [...doc.querySelectorAll('main li')];
  assert.equal(items.length, 2);
  assert.deepEqual(
    items.map((li) => li.querySelector('a').getAttribute('href')),
    ['https://cloudcertmastery.com', 'https://steadion.fit'],
  );
  assert.deepEqual(
    items.map((li) => li.querySelector('h2').textContent.trim()),
    ['Cloud Cert Mastery', 'Steadion'],
  );
  for (const li of items) assert.ok(li.querySelector('p').textContent.trim().length > 20, 'a sentence about each');
});

test('it is a landmarked page that links back home and has no skip link to a missing anchor', () => {
  assert.equal(doc.querySelectorAll('main').length, 1);
  const back = doc.querySelector('header a[href="/"]');
  assert.ok(back, 'a link home in the header');
  for (const a of doc.querySelectorAll('a[href^="#"]')) assert.ok(doc.getElementById(a.getAttribute('href').slice(1)), a.outerHTML);
});

test('it tracks nothing and carries none of the home page', () => {
  assert.equal(doc.querySelectorAll('[data-track]').length, 0);
  assert.equal(doc.querySelectorAll('script[type="application/ld+json"]').length, 0);
  assert.equal(doc.querySelectorAll('#limiter, .pipeline, .role').length, 0);
  assert.doesNotMatch(html, /fontshare|mailto:/i);
});

test('the sitemap lists the home page and /projects', () => {
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs, ['https://saimanoj.com/', 'https://saimanoj.com/projects']);
});

test('the home page ends with one small link to /projects, and its canonical is unchanged', () => {
  const link = home.querySelector('footer a[href="/projects"]');
  assert.ok(link, 'a /projects link in the footer');
  assert.equal(link.textContent.trim(), 'Side projects');
  assert.equal(home.querySelectorAll('a[href="/projects"]').length, 1, 'only the footer links there');
  assert.equal(home.querySelector('link[rel="canonical"]').getAttribute('href'), 'https://saimanoj.com/');
});
