/* Privacy-first counting: no cookies, no storage, no identifiers. Each event is a fixed name and label (see
   events.js) plus the landing source (source.js), sent to our own /e endpoint. Nothing runs when the browser
   says Do Not Track or Global Privacy Control. */
import { resolveSource } from './source.js';

function start() {
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return;

  const source = resolveSource({
    search: location.search,
    referrer: document.referrer,
    host: location.hostname,
  });
  const seen = new Set();

  function send(e, l, once = false) {
    const key = `${e}:${l}`;
    if (once && seen.has(key)) return;
    seen.add(key);
    try {
      navigator.sendBeacon('/e', JSON.stringify({ e, l, s: source }));
    } catch {
      /* analytics must never break the page */
    }
  }

  send('visit', 'page');

  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('[data-track]') : null;
    if (link) send('link', link.dataset.track);
  });

  document.addEventListener('themechange', (event) => send('theme', event.detail));

  /* A role counts as read once it crosses the middle of the screen, and so does the rate limiter. */
  if ('IntersectionObserver' in window) {
    const middle = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) send('role', entry.target.dataset.role, true);
    }, { rootMargin: '-50% 0px -50% 0px' });
    document.querySelectorAll('.role[data-role], #limiter[data-role]').forEach((el) => middle.observe(el));
  }
}

try {
  start();
} catch {
  /* an old browser without one of these APIs: count nothing rather than break */
}
