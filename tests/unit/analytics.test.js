import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_LABELS, parseEvent } from '../../src/scripts/events.js';

test('every allowed event and label parses, and the source is cleaned', () => {
  for (const [e, labels] of Object.entries(EVENT_LABELS)) {
    for (const l of labels) {
      assert.deepEqual(parseEvent({ e, l, s: 'LinkedIn Profile!' }), { event: e, label: l, source: 'linkedinprofile' });
    }
  }
});

test('a missing source becomes direct', () => {
  assert.equal(parseEvent({ e: 'end', l: 'connect' }).source, 'direct');
  assert.equal(parseEvent({ e: 'end', l: 'connect', s: '!!!' }).source, 'direct');
});

test('unknown events, labels and shapes are rejected', () => {
  assert.equal(parseEvent(null), null);
  assert.equal(parseEvent('link'), null);
  assert.equal(parseEvent({ e: 'link', l: 'email:hero' }), null);
  assert.equal(parseEvent({ e: 'purchase', l: 'page' }), null);
  assert.equal(parseEvent({ e: 'role', l: 'connect' }), null);
  assert.equal(parseEvent({ e: 'link' }), null);
  assert.equal(parseEvent({ e: 7, l: 'page' }), null);
});

test('prototype keys are not events', () => {
  assert.equal(parseEvent({ e: '__proto__', l: 'page' }), null);
  assert.equal(parseEvent({ e: 'constructor', l: 'page' }), null);
  assert.equal(parseEvent({ e: 'toString', l: 'page' }), null);
});
