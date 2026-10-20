import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../../functions/e.js';

/* `lie` overrides Content-Length, to model a client that under-reports the size of what it sends. */
function call(body, { env, lie, omitLength } = {}) {
  const rows = [];
  const bound = env ?? { EVENTS: { writeDataPoint: (row) => rows.push(row) } };
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  const headers = {};
  if (!omitLength) headers['content-length'] = String(lie ?? Buffer.byteLength(text));
  const request = new Request('https://saimanoj.com/e', { method: 'POST', body: text, headers });
  return onRequestPost({ request, env: bound }).then((response) => ({ response, rows }));
}

test('a valid event is written as event, label and source, with nothing else', async () => {
  const { response, rows } = await call({ e: 'link', l: 'linkedin:connect', s: 'T.co' });
  assert.equal(response.status, 204);
  assert.deepEqual(rows, [{ indexes: ['link'], blobs: ['link', 'linkedin:connect', 't.co'] }]);
});

test('an unknown event or bad JSON writes nothing', async () => {
  for (const body of [{ e: 'purchase', l: 'page' }, 'not json']) {
    const { response, rows } = await call(body);
    assert.equal(response.status, 400);
    assert.deepEqual(rows, []);
  }
});

test('an oversized body is refused by its declared size, without being read', async () => {
  const { response, rows } = await call({ e: 'visit', l: 'page', s: 'x'.repeat(1000) });
  assert.equal(response.status, 413);
  assert.deepEqual(rows, []);
});

test('a client that under-reports its size is cut off at the cap while streaming', async () => {
  const { response, rows } = await call({ e: 'visit', l: 'page', s: 'x'.repeat(1000) }, { lie: 20 });
  assert.equal(response.status, 413);
  assert.deepEqual(rows, []);
});

test('a missing Content-Length is refused', async () => {
  const { response, rows } = await call({ e: 'end', l: 'connect' }, { omitLength: true });
  assert.equal(response.status, 413);
  assert.deepEqual(rows, []);
});

test('a missing dataset binding is not an error for the visitor', async () => {
  const { response } = await call({ e: 'end', l: 'connect' }, { env: {} });
  assert.equal(response.status, 204);
});
