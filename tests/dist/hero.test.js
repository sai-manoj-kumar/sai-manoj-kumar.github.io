import test from 'node:test';
import assert from 'node:assert/strict';
import { doc } from './helpers.js';

test('one h1 with the three title words', () => {
  const h1s = doc.querySelectorAll('h1');
  assert.equal(h1s.length, 1);
  assert.deepEqual([...h1s[0].querySelectorAll('span')].map((s) => s.textContent), ['Sai Manoj', 'Backend', 'Engineer']);
});

test('hero facts and sentence', () => {
  const text = doc.querySelector('header.hero .facts').textContent;
  for (const line of ['Senior software engineer', 'India', 'Java, Python, C#', 'Services on public cloud. Tools for AI agents.']) {
    assert.ok(text.includes(line), line);
  }
});

test('hero links are LinkedIn and the GitHub profile only', () => {
  const hrefs = [...doc.querySelectorAll('header.hero a')].map((a) => a.getAttribute('href'));
  assert.deepEqual(hrefs, ['https://www.linkedin.com/in/sai-manoj-kumar', 'https://github.com/sai-manoj-kumar']);
});

test('the photo credit is not on the hero card', () => {
  assert.doesNotMatch(doc.querySelector('header.hero').textContent, /PiDatacenters|Photo:/);
});

test('both hero images have alt text and dimensions', () => {
  const imgs = doc.querySelectorAll('header.hero img');
  assert.equal(imgs.length, 2, 'hero photo and portrait');
  for (const img of imgs) {
    assert.ok(img.getAttribute('alt'), 'alt');
    assert.ok(img.getAttribute('width') && img.getAttribute('height'), 'width and height');
  }
});

test('the stub points at the connect section', () => {
  assert.ok(doc.querySelector('a#stub[href="#connect"]'));
});
