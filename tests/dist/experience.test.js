import test from 'node:test';
import assert from 'node:assert/strict';
import { doc, html } from './helpers.js';

const roles = () => [...doc.querySelectorAll('article.role')];

test('four roles in order: project, then company and title', () => {
  assert.equal(roles().length, 4);
  assert.deepEqual(roles().map((r) => r.querySelector('h3').textContent.trim()), [
    'Webhooks Platform', 'Defender', 'Application Gateway', 'Network Monitoring',
  ]);
  assert.deepEqual(roles().map((r) => r.querySelector('p.who').textContent.trim()), [
    'LinkedIn, Senior Software Engineer',
    'Microsoft, Software Engineer II',
    'Microsoft, Software Engineer II',
    'Microsoft, Software Engineer',
  ]);
  for (const r of roles()) assert.equal(r.querySelector('h3').nextElementSibling.className, 'who', 'title follows project');
});

test('each role names the slide it is shown with, and only the demo role is #limiter', () => {
  assert.deepEqual(roles().map((r) => r.getAttribute('data-slide')), ['demo', 'memory', 'rewrite', 'trace']);
  assert.deepEqual(roles().map((r) => r.id), ['limiter', '', '', '']);
});

test('the demo has a plain fallback when JavaScript is off', () => {
  const take = doc.getElementById('take');
  assert.ok(take.hasAttribute('disabled'), 'button starts disabled');
  assert.match(doc.getElementById('fallback').textContent, /needs JavaScript/);
  assert.equal(doc.getElementById('tickets').getAttribute('aria-live'), 'polite');
  assert.equal(doc.querySelectorAll('#dispenser .chip').length, 5);
});

test('illustrations are labelled as illustrations', () => {
  assert.match(html, /A header rewrite, illustrated/);
  assert.match(html, /A traceroute, illustrated/);
  assert.match(html, /Drawn to scale: 30% lower\./);
});

test('the made-up notes are gone, and the demo sentence says two seconds', () => {
  assert.doesNotMatch(html, /Made-up/);
  assert.match(doc.querySelector('#limiter .note').textContent, /a new one every two seconds/);
});

test('the demo note has a wording for each layout', () => {
  const note = doc.querySelector('#limiter .note');
  assert.match(note.querySelector('.only-wide').textContent, /panel on the left/);
  assert.match(note.querySelector('.only-narrow').textContent, /top of the page/);
});
