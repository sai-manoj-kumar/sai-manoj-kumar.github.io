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

  document.addEventListener('change', (event) => {
    if (event.target instanceof HTMLInputElement && event.target.name === 'theme' && event.target.checked) {
      send('theme', event.target.value);
    }
  });

  /* A role counts as read once it has opened, which reveal.js does as it passes the middle of the screen. */
  document.addEventListener('role-open', (event) => send('role', event.detail, true));

  /* The rate limiter counts the same way, but it is not a role, so reveal.js does not watch it. */
  const limiter = document.getElementById('limiter');
  if (limiter && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) send('role', 'demo', true);
    }, { rootMargin: '-50% 0px -50% 0px' }).observe(limiter);
  }
}

try {
  start();
} catch {
  /* an old browser without one of these APIs: count nothing rather than break */
}
