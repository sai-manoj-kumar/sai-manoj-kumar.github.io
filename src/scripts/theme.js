/* The Light / Dark / System switch. System is plain CSS (prefers-color-scheme), so it needs no code and
   follows the OS live. This file handles the two overrides: it sets data-theme on <html>, remembers the
   choice, and keeps the theme-color metas in step. The head script in Base.astro applies a stored choice
   before first paint; this runs afterwards and wires up the radios. */
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

/* The phone button steps through the same three radios, so the choice, the storage and the theme-color metas all go
   through the one code path above. */
const radios = [...document.querySelectorAll('input[name="theme"]')];
const cycle = document.querySelector('.theme-cycle');
if (cycle && radios.length === 3) {
  const NAME = { system: 'System', light: 'Light', dark: 'Dark' };
  const at = () => Math.max(0, radios.findIndex((r) => r.checked));
  const sync = () => {
    const now = radios[at()].value;
    const next = radios[(at() + 1) % 3].value;
    cycle.dataset.mode = now;
    cycle.setAttribute('aria-label', `Theme: ${NAME[now]}. Switch to ${NAME[next]}`);
  };
  radios.forEach((r) => r.addEventListener('change', sync));
  cycle.addEventListener('click', () => {
    const next = radios[(at() + 1) % 3];
    next.checked = true;
    next.dispatchEvent(new Event('change', { bubbles: true }));
  });
  sync();
}
