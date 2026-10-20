import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { doc } from './helpers.js';
import { EVENT_LABELS } from '../../src/scripts/events.js';

test('every tracked link carries an allowed label, and the five links are all tagged', () => {
  const tracked = [...doc.querySelectorAll('[data-track]')];
  const labels = tracked.map((a) => a.getAttribute('data-track'));
  for (const label of labels) assert.ok(EVENT_LABELS.link.includes(label), `unknown link label: ${label}`);
  assert.deepEqual([...labels].sort(), [...EVENT_LABELS.link].sort());
});

test('each tracked link points at LinkedIn or GitHub, matching its label', () => {
  for (const a of doc.querySelectorAll('[data-track]')) {
    const [target] = a.getAttribute('data-track').split(':');
    assert.match(a.getAttribute('href'), new RegExp(`^https://(www\\.)?${target}\\.com/`));
  }
});

test('every role has a slide name the analytics allow-list knows', () => {
  const names = [...doc.querySelectorAll('.role[data-slide]')].map((r) => r.getAttribute('data-slide'));
  assert.equal(names.length, 4);
  for (const name of names) assert.ok(EVENT_LABELS.role.includes(name), `unknown role: ${name}`);
});

test('the 404 page tracks nothing', () => {
  const lost = readFileSync(new URL('../../dist/404.html', import.meta.url), 'utf8');
  const { document: lostDoc } = parseHTML(lost);
  assert.equal(lostDoc.querySelectorAll('[data-track]').length, 0);
  assert.doesNotMatch(lost, /sendBeacon/);
});

test('the shipped script has no cookie or storage calls of its own', () => {
  const scripts = readFileSync(new URL('../../src/scripts/analytics.js', import.meta.url), 'utf8');
  assert.doesNotMatch(scripts, /document\.cookie|localStorage|sessionStorage|indexedDB/);
});
