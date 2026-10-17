import test from 'node:test';
import assert from 'node:assert/strict';
import { doc, html } from './helpers.js';

const folders = () => [...doc.querySelectorAll('article.folder')];

test('four folders; the tab is always the company, then project, then title', () => {
  assert.equal(folders().length, 4);
  assert.deepEqual(folders().map((f) => f.querySelector('.tab').textContent.trim()), [
    'LinkedIn', 'Microsoft', 'Microsoft', 'Microsoft',
  ]);
  assert.deepEqual(folders().map((f) => f.querySelector('.text h3').textContent.trim()), [
    'Webhooks Platform', 'Defender', 'Application Gateway', 'Network Monitoring',
  ]);
  assert.deepEqual(folders().map((f) => f.querySelector('.text p.role').textContent.trim()), [
    'Senior Software Engineer', 'Software Engineer II', 'Software Engineer II', 'Software Engineer',
  ]);
  for (const f of folders()) {
    assert.equal(f.querySelector('.text h3').nextElementSibling.className, 'role', 'title follows project');
  }
});

test('folders alternate light and dark', () => {
  assert.deepEqual(
    folders().map((f) => (f.classList.contains('tone-light') ? 'light' : 'dark')),
    ['light', 'dark', 'light', 'dark'],
  );
});

test('the demo has a plain fallback when JavaScript is off', () => {
  const take = doc.getElementById('take');
  assert.ok(take.hasAttribute('disabled'), 'button starts disabled');
  assert.match(doc.getElementById('fallback').textContent, /needs JavaScript/);
  assert.equal(doc.getElementById('tickets').getAttribute('aria-live'), 'polite');
  assert.equal(doc.querySelectorAll('#dispenser .chip').length, 5);
});

test('illustrations are labelled as illustrations', () => {
  assert.match(html, /Made-up host names\./);
  assert.match(html, /Made-up timings\./);
  assert.match(html, /A header rewrite, illustrated/);
  assert.match(html, /A traceroute, illustrated/);
  assert.match(html, /Drawn to scale: 30% lower\./);
});

test('the demo note says two seconds', () => {
  assert.match(doc.querySelector('#limiter .note').textContent, /a new one every two seconds/);
});
