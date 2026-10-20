import { cleanSource } from './source.js';

/* The events the page may report, and the only labels each may carry. The browser and the Pages Function
   (functions/e.js) both use this list, so the dataset can only ever hold values we chose. */
export const EVENT_LABELS = {
  visit: ['page'],
  link: ['linkedin:hero', 'github:hero', 'linkedin:about', 'linkedin:connect', 'github:connect'],
  role: ['demo', 'memory', 'rewrite', 'trace'],
  end: ['connect'],
  theme: ['system', 'light', 'dark'],
};

/* A request body `{ e, l, s }` becomes `{ event, label, source }`, or null when anything is off. */
export function parseEvent(body) {
  if (!body || typeof body !== 'object') return null;
  const { e, l, s } = body;
  if (typeof e !== 'string' || typeof l !== 'string') return null;
  if (!Object.hasOwn(EVENT_LABELS, e) || !EVENT_LABELS[e].includes(l)) return null;
  return { event: e, label: l, source: cleanSource(s) || 'direct' };
}
