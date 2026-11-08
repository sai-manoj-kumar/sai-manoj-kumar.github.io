import test from 'node:test';
import assert from 'node:assert/strict';
import { doc } from './helpers.js';

test('tech stack: four groups, plain lists', () => {
  const groups = [...doc.querySelectorAll('#stack .group')];
  assert.equal(groups.length, 4);
  assert.deepEqual(groups.map((g) => g.querySelector('.gname').textContent.trim()), [
    'Backend', 'Cloud', 'Data', 'AI agent tooling',
  ]);
  assert.equal(doc.querySelector('#stack h2').textContent.trim(), 'Tech stack');
  assert.equal(doc.querySelectorAll('#stack details').length, 0, 'no collapsible bars any more');
});

test('about: nine years of backend and one LinkedIn link in the letter', () => {
  const about = doc.getElementById('about');
  assert.match(about.textContent, /about nine years of backend experience/);
  const links = [...about.querySelectorAll('a')].map((a) => a.getAttribute('href'));
  assert.deepEqual(links, ['https://www.linkedin.com/in/sai-manoj-kumar']);
});

test('footer: copyright and the profile links', () => {
  const footer = doc.querySelector('footer');
  assert.match(footer.textContent, /© 2026 Sai Manoj/);
  const hrefs = [...footer.querySelectorAll('a')].map((a) => a.getAttribute('href'));
  assert.ok(hrefs.includes('https://www.linkedin.com/in/sai-manoj-kumar'));
  assert.ok(hrefs.includes('https://github.com/sai-manoj-kumar'));
});
