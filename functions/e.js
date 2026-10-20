/* POST /e: records one anonymous event in the Analytics Engine dataset bound as EVENTS.
   Only names and labels from src/scripts/events.js get through; there is no IP, header or user agent in the row. */
import { parseEvent } from '../src/scripts/events.js';

const MAX_BYTES = 512;
const headers = { 'Cache-Control': 'no-store' };

/* The cap is enforced before the body is buffered: a missing or oversized Content-Length is refused, and the
   stream is cancelled as soon as more than MAX_BYTES arrive. Returns null when the body is too big. */
async function readCapped(request) {
  const length = request.headers.get('content-length');
  if (length === null || !(Number(length) <= MAX_BYTES) || !request.body) return null;

  const reader = request.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    if (received > MAX_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(await new Blob(chunks).arrayBuffer());
}

export async function onRequestPost({ request, env }) {
  const text = await readCapped(request);
  if (text === null) return new Response(null, { status: 413, headers });

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400, headers });
  }

  const event = parseEvent(body);
  if (!event) return new Response(null, { status: 400, headers });

  env.EVENTS?.writeDataPoint({ indexes: [event.event], blobs: [event.event, event.label, event.source] });
  return new Response(null, { status: 204, headers });
}
