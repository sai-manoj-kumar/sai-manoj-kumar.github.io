import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../../functions/e.js';

function call(body, env) {
  const rows = [];
  const bound = env ?? { EVENTS: { writeDataPoint: (row) => rows.push(row) } };
  const request = new Request('https://saimanoj.com/e', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });
  return onRequestPost({ request, env: bound }).then((response) => ({ response, rows }));
}

test('a valid event is written as event, label and source, with nothing else', async () => {
  const { response, rows } = await call({ e: 'link', l: 'linkedin:connect', s: 'T.co' });
  assert.equal(response.status, 204);
  assert.deepEqual(rows, [{ indexes: ['link'], blobs: ['link', 'linkedin:connect', 't.co'] }]);
});

test('an unknown event, bad JSON or an oversized body writes nothing', async () => {
  for (const [body, status] of [
    [{ e: 'purchase', l: 'page' }, 400],
    ['not json', 400],
    [{ e: 'visit', l: 'page', s: 'x'.repeat(1000) }, 413],
  ]) {
    const { response, rows } = await call(body);
    assert.equal(response.status, status);
    assert.deepEqual(rows, []);
  }
});

test('a missing dataset binding is not an error for the visitor', async () => {
  const { response } = await call({ e: 'end', l: 'connect' }, {});
  assert.equal(response.status, 204);
});
