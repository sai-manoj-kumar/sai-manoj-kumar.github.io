/* The Light / Dark / System switch. System is plain CSS (prefers-color-scheme), so it needs no code and
   follows the OS live. This file handles the two overrides: it sets data-theme on <html>, remembers the
   choice, and keeps the theme-color metas in step. The head script in Base.astro applies a stored choice
   before first paint; this runs afterwards and wires up the radios. */
const root = document.documentElement;
const KEY = 'theme';
const COLOR = { light: '#f1ebdc', dark: '#472913' };

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

const current = read();
apply(current);
document.querySelectorAll('input[name="theme"]').forEach((input) => {
  input.checked = input.value === current;
  input.addEventListener('change', () => {
    if (!input.checked) return;
    write(input.value);
    apply(input.value);
  });
});
