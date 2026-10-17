import test from 'node:test';
import assert from 'node:assert/strict';
import { createBucket, describeDenial } from '../../src/scripts/bucket.js';

function clockBucket(start = 0) {
  let t = start;
  const bucket = createBucket({ capacity: 5, everyMs: 2000, now: () => t });
  return { bucket, at: (ms) => { t = ms; } };
}

test('admits five requests, then denies the sixth with the time the next token arrives', () => {
  const { bucket, at } = clockBucket(0);
  for (let i = 0; i < 5; i += 1) {
    at(i * 100);
    assert.equal(bucket.tryTake().ok, true);
  }
  at(500);
  const denied = bucket.tryTake();
  assert.equal(denied.ok, false);
  assert.equal(denied.readyAt, 2000);
});

test('one token returns every two seconds', () => {
  const { bucket, at } = clockBucket(0);
  for (let i = 0; i < 5; i += 1) bucket.tryTake();
  at(1999);
  assert.equal(bucket.available(), 0);
  at(2000);
  assert.equal(bucket.available(), 1);
  at(4000);
  assert.equal(bucket.available(), 2);
});

test('the countdown restarts from the last refill, not from the click', () => {
  const { bucket, at } = clockBucket(0);
  for (let i = 0; i < 5; i += 1) bucket.tryTake();
  at(2100);
  assert.equal(bucket.tryTake().ok, true); // the token that arrived at 2000
  at(2200);
  const denied = bucket.tryTake();
  assert.equal(denied.ok, false);
  assert.equal(denied.readyAt, 4000);
});

test('a long idle period never holds more than five tokens', () => {
  const { bucket, at } = clockBucket(0);
  at(60000);
  assert.equal(bucket.available(), 5);
});

test('taking from a full bucket starts the refill clock at that moment', () => {
  const { bucket, at } = clockBucket(0);
  at(10000);
  for (let i = 0; i < 5; i += 1) {
    at(10000 + i * 100);
    assert.equal(bucket.tryTake().ok, true);
  }
  at(10500);
  assert.equal(bucket.tryTake().readyAt, 12000);
});

test('a clock that moves backwards neither throws nor invents tokens', () => {
  const { bucket, at } = clockBucket(1000);
  for (let i = 0; i < 5; i += 1) bucket.tryTake();
  at(500);
  assert.doesNotThrow(() => bucket.available());
  assert.equal(bucket.available(), 0);
  assert.equal(bucket.tryTake().ok, false);
});

test('after the clock jumps back an hour the wait is still at most one refill', () => {
  const { bucket, at } = clockBucket(3600000);
  for (let i = 0; i < 5; i += 1) bucket.tryTake();
  at(0);
  const denied = bucket.tryTake();
  assert.equal(denied.ok, false);
  assert.ok(denied.readyAt - 0 <= 2000, `readyAt ${denied.readyAt} is more than 2s after now`);
  at(2000);
  assert.equal(bucket.available(), 1, 'refill resumes from the new clock');
});

test('describeDenial rounds up to whole seconds and says "now" when ready', () => {
  assert.equal(describeDenial(2000, 500), 'Try again in 2s');
  assert.equal(describeDenial(2000, 1999), 'Try again in 1s');
  assert.equal(describeDenial(2000, 1000), 'Try again in 1s');
  assert.equal(describeDenial(2000, 2000), 'Try again now');
  assert.equal(describeDenial(2000, 2500), 'Try again now');
});
