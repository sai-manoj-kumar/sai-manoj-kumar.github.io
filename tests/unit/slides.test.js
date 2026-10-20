import test from 'node:test';
import assert from 'node:assert/strict';
import { slideName } from '../../src/data/slides.js';
import { site } from '../../src/data/site.js';

test('the demo role maps to the demo slide, the diagram roles map to themselves', () => {
  assert.equal(slideName('ticketDemo'), 'demo');
  assert.equal(slideName('memory'), 'memory');
  assert.equal(slideName('rewrite'), 'rewrite');
  assert.equal(slideName('trace'), 'trace');
});

test('an unknown visual is a loud error, not a silently missing slide', () => {
  assert.throws(() => slideName('bogus'), /Unknown visual: bogus/);
});

test('every role in site.js has a slide, and the four slides are all different', () => {
  const names = site.experience.map((r) => slideName(r.visual));
  assert.deepEqual(names, ['demo', 'memory', 'rewrite', 'trace']);
});
