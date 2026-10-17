import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { doc, html } from './helpers.js';

const text = doc.body.textContent;

test('exactly one h1, and the three section headings are h2', () => {
  assert.equal(doc.querySelectorAll('h1').length, 1);
  assert.deepEqual(
    [...doc.querySelectorAll('h2')].map((h) => h.textContent.trim()),
    ['Experience', 'Tech stack', 'Connect with me'],
  );
});

test('every image has alt text, width and height', () => {
  for (const img of doc.querySelectorAll('img')) {
    assert.ok(img.hasAttribute('alt'), `alt on ${img.getAttribute('src')}`);
    assert.ok(img.getAttribute('width') && img.getAttribute('height'), `size on ${img.getAttribute('src')}`);
  }
  assert.equal(doc.querySelectorAll('img').length, 3, 'hero photo, hero portrait, about portrait');
});

test('only allow-listed hosts are linked, and nothing loads from Fontshare', () => {
  const allowed = new Set(['www.linkedin.com', 'github.com', 'commons.wikimedia.org', 'creativecommons.org', 'saimanoj.com']);
  for (const m of html.matchAll(/(?:src|href|content)="(https?:\/\/[^"]+)"/g)) {
    assert.ok(allowed.has(new URL(m[1]).hostname), `unexpected host: ${m[1]}`);
  }
  assert.doesNotMatch(html, /fontshare|fonts\.googleapis|fonts\.gstatic/i);
});

test('no email, resume or repository links', () => {
  assert.doesNotMatch(html, /mailto:/i);
  assert.doesNotMatch(html, /\.pdf|resume/i);
  assert.doesNotMatch(html, /github\.com\/sai-manoj-kumar\/[A-Za-z]/);
});

test('no email address in any file the site publishes', () => {
  const dist = new URL('../../dist/', import.meta.url);
  const files = readdirSync(dist, { recursive: true }).filter((f) => !f.endsWith('.woff2') && /\.[a-z0-9]+$|_headers$/i.test(f));
  for (const required of ['index.html', 'robots.txt', 'og.jpg', 'images/hero.jpg', 'images/portrait.jpg']) {
    assert.ok(files.includes(required), `${required} must be part of the scan (found ${files.length} files)`);
  }
  for (const f of files) {
    // latin1 reads any byte sequence, so images are scanned for embedded EXIF/XMP too
    const body = readFileSync(new URL(f, dist), 'latin1');
    assert.doesNotMatch(body, /mailto:/i, `mailto: in ${f}`);
    assert.doesNotMatch(body, /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/, `email address in ${f}`);
  }
});

test('LinkedIn is the contact route, and it is a profile link', () => {
  const links = [...doc.querySelectorAll('a[href*="linkedin.com"]')].map((a) => a.getAttribute('href'));
  assert.ok(links.length >= 2, 'LinkedIn linked from the hero card and the connect section');
  for (const href of links) assert.equal(href, 'https://www.linkedin.com/in/sai-manoj-kumar');
});

test('forbidden terms never reach the page', () => {
  assert.doesNotMatch(text, /OAuth|TypeScript|\bDart\b|Gaap|restli|PhonePe|\b12\+|decade/i);
});

test('General Sans is shipped but not tracked by git', () => {
  const shipped = readdirSync(new URL('../../dist/fonts/', import.meta.url)).filter((f) => f.endsWith('.woff2'));
  assert.deepEqual(shipped.sort(), ['general-sans-400.woff2', 'general-sans-500.woff2', 'general-sans-700.woff2']);
  const tracked = execSync('git ls-files public/fonts src/styles/fonts.generated.css', { encoding: 'utf8' }).trim();
  assert.equal(tracked, '', 'font files must not be committed');
});

test('robots.txt is published', () => {
  assert.ok(existsSync(new URL('../../dist/robots.txt', import.meta.url)));
});
