/* A token bucket with lazy refill: no timer adds tokens; the count is worked out
   from the time that has passed. Capacity is the burst size; everyMs is the refill rate. */
export function createBucket({ capacity = 5, everyMs = 2000, now = Date.now } = {}) {
  let tokens = capacity;
  let last = now();

  function refill() {
    const t = now();
    if (t < last) last = t; // the clock moved backwards: restart the refill clock from here
    const add = Math.floor((t - last) / everyMs);
    if (add > 0) {
      tokens = Math.min(capacity, tokens + add);
      last = tokens === capacity ? t : last + add * everyMs;
    }
  }

  return {
    capacity,
    available() {
      refill();
      return tokens;
    },
    tryTake() {
      refill();
      if (tokens > 0) {
        if (tokens === capacity) last = now();
        tokens -= 1;
        return { ok: true, tokensLeft: tokens };
      }
      return { ok: false, readyAt: last + everyMs };
    },
  };
}

export function describeDenial(readyAt, t = Date.now()) {
  const rest = readyAt - t;
  return rest > 0 ? `Try again in ${Math.ceil(rest / 1000)}s` : 'Try again now';
}
