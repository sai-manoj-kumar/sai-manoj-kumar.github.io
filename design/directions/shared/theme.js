/* Theme switch for the direction prototypes: system | light | dark.
   System is pure CSS; light and dark set data-theme on <html>. Storage is optional. */
const root = document.documentElement;
const KEY = 'theme';

function read() {
  try { return localStorage.getItem(KEY) || 'system'; } catch { return 'system'; }
}
function write(v) {
  try { localStorage.setItem(KEY, v); } catch { /* private mode: the choice lasts until reload */ }
}
function apply(v) {
  if (v === 'light' || v === 'dark') root.setAttribute('data-theme', v);
  else root.removeAttribute('data-theme');
}

const current = read();
apply(current);
document.querySelectorAll('input[name="theme"]').forEach((input) => {
  input.checked = input.value === current;
  input.addEventListener('change', () => { if (input.checked) { write(input.value); apply(input.value); } });
});
