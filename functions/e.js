/* POST /e: records one anonymous event in the Analytics Engine dataset bound as EVENTS.
   Only names and labels from src/scripts/events.js get through; there is no IP, header or user agent in the row. */
import { parseEvent } from '../src/scripts/events.js';

const MAX_BYTES = 512;
const headers = { 'Cache-Control': 'no-store' };

export async function onRequestPost({ request, env }) {
  const text = await request.text();
  if (text.length > MAX_BYTES) return new Response(null, { status: 413, headers });

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
