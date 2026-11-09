/* The Light / Dark / System switch. System is plain CSS (prefers-color-scheme), so it needs no code and
   follows the OS live. This file handles the two overrides: it sets data-theme on <html>, remembers the
   choice, and keeps the theme-color metas in step. The head script in Base.astro applies a stored choice
   before first paint; this runs afterwards and wires up the one button that steps through the three. */
const root = document.documentElement;
const KEY = 'theme';
const COLOR = { light: '#ffffff', dark: '#0e0f12' };

function read() {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function write(value) {
  try {
    if (value === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, value);
  } catch {
    /* storage is blocked: the choice lasts until the page is closed */
  }
}

function themeColor(value) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    const scheme = meta.getAttribute('data-scheme');
    if (value === 'system') {
      meta.setAttribute('content', COLOR[scheme]);
      meta.setAttribute('media', `(prefers-color-scheme: ${scheme})`);
    } else {
      meta.setAttribute('content', COLOR[value]);
      meta.removeAttribute('media');
    }
  });
}

function apply(value) {
  if (value === 'light' || value === 'dark') root.setAttribute('data-theme', value);
  else root.removeAttribute('data-theme');
  themeColor(value);
}

const NAME = { system: 'System', light: 'Light', dark: 'Dark' };
const ORDER = ['system', 'light', 'dark'];
const cycle = document.querySelector('.theme-cycle');
let current = read();
apply(current);

function show() {
  if (!cycle) return;
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  cycle.dataset.mode = current;
  cycle.setAttribute('aria-label', `Theme: ${NAME[current]}. Switch to ${NAME[next]}`);
}

if (cycle) {
  cycle.addEventListener('click', () => {
    current = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    write(current);
    apply(current);
    show();
    document.dispatchEvent(new CustomEvent('themechange', { detail: current }));
  });
  show();
}
