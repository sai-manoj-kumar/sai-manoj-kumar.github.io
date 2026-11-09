import test from 'node:test';
import assert from 'node:assert/strict';
import { doc, html } from './helpers.js';
import { site } from '../../src/data/site.js';

const roles = [...doc.querySelectorAll('#work article.role')];

test('four roles in order, each with a head (project, company and title, summary) and a body', () => {
  assert.deepEqual(roles.map((r) => r.getAttribute('data-role')), ['webhooks', 'memory', 'rewrite', 'trace']);
  roles.forEach((role, i) => {
    const data = site.experience[i];
    assert.equal(role.querySelector('.role-head h3').textContent.trim(), data.project);
    assert.equal(role.querySelector('.role-head .who').textContent.trim(), `${data.company}, ${data.title}`);
    assert.equal(role.querySelector('.role-head .summary').textContent.trim(), data.summary);
    assert.equal(role.querySelectorAll('.role-body > p').length, data.paragraphs.length);
  });
});

test('the three diagrams sit inside Defender, Application Gateway and Network Monitoring, and nowhere else', () => {
  const found = roles.map((r) => r.querySelectorAll('.role-body .viz').length);
  assert.deepEqual(found, [0, 1, 1, 1]);
  assert.equal(doc.querySelectorAll('.viz').length, 3);
});

test('every role is shown in full: there is no open or closed state in the markup', () => {
  assert.equal(doc.querySelectorAll('.open, .snap').length, 0);
  assert.equal(doc.querySelectorAll('.role-inner').length, 0);
  assert.equal(doc.querySelectorAll('.role-body').length, 4);
});

test('there is no way to close a role: no buttons, details, summaries or aria-expanded in Experience', () => {
  const work = doc.getElementById('work');
  assert.equal(work.querySelectorAll('button, details, summary, [aria-expanded], [role="button"], [tabindex]').length, 0);
  assert.equal(work.querySelectorAll('a').length, 0);
});

test('the demo is not a role: it is its own section after Experience', () => {
  assert.equal(doc.querySelectorAll('#work #dispenser').length, 0);
  assert.equal(doc.querySelectorAll('#limiter #dispenser').length, 1);
  assert.ok(doc.querySelector('#dispenser').closest('#limiter'));
});

test('illustrations are labelled as illustrations', () => {
  const titles = [...doc.querySelectorAll('.viz-title')].map((t) => t.textContent.trim());
  assert.equal(titles.length, 3);
  assert.match(doc.querySelector('.bars').getAttribute('aria-label'), /drawn to scale/);
});

test('the demo has a plain fallback when JavaScript is off', () => {
  assert.match(doc.getElementById('fallback').textContent, /needs JavaScript/);
});

test('nothing scroll-driven is set up: no reveal class and no role-opening script', () => {
  assert.doesNotMatch(html, /reveal/);
  assert.doesNotMatch(html, /role-open/);
});
