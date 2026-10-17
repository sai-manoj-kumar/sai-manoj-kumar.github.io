import test from 'node:test';
import assert from 'node:assert/strict';
import { doc } from './helpers.js';

test('tech stack: four bars, all open by default', () => {
  const bars = [...doc.querySelectorAll('#stack details.bar')];
  assert.equal(bars.length, 4);
  assert.ok(bars.every((b) => b.hasAttribute('open')), 'every bar is open');
  assert.deepEqual(bars.map((b) => b.querySelector('summary').textContent.trim()), [
    'Backend', 'Cloud', 'Data', 'AI agent tooling',
  ]);
  assert.equal(doc.querySelector('#stack h2').textContent.trim(), 'Tech stack');
});

test('about: nine years of backend and one LinkedIn link in the letter', () => {
  const about = doc.getElementById('about');
  assert.match(about.textContent, /about nine years of backend experience/);
  const letterLinks = [...about.querySelectorAll('.sheet a')].map((a) => a.getAttribute('href'));
  assert.deepEqual(letterLinks, ['https://www.linkedin.com/in/sai-manoj-kumar']);
});

test('connect: LinkedIn and GitHub profile only', () => {
  const hrefs = [...doc.querySelectorAll('#connect a')].map((a) => a.getAttribute('href'));
  assert.deepEqual(hrefs, ['https://www.linkedin.com/in/sai-manoj-kumar', 'https://github.com/sai-manoj-kumar']);
});

test('footer: copyright, profile links and the photo credit', () => {
  const footer = doc.querySelector('footer');
  assert.match(footer.textContent, /© 2026 Sai Manoj/);
  assert.match(footer.textContent, /Racks Amravati Data Center/);
  assert.match(footer.textContent, /CC BY-SA 4\.0/);
  const hrefs = [...footer.querySelectorAll('a')].map((a) => a.getAttribute('href'));
  assert.ok(hrefs.includes('https://www.linkedin.com/in/sai-manoj-kumar'));
  assert.ok(hrefs.includes('https://github.com/sai-manoj-kumar'));
  assert.ok(hrefs.includes('https://creativecommons.org/licenses/by-sa/4.0'));
});
