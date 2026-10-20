/* Stub engine B: a small name mark in the hero's corner travels to the bottom corner and becomes the stub.
   data-side="left|right" on #stub picks the corner. Without JS or with reduced motion it stays a plain mark. */
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function start() {
  const stub = document.getElementById('stub');
  if (!stub) return;
  const right = stub.dataset.side === 'right';
  root.classList.add('anim');

  let x0, y0, x1, y1, vh;
  let hideStub = false;
  let ticking = false;

  function measure() {
    const vw = window.innerWidth;
    vh = window.innerHeight;
    const m = clamp(vw * 0.028, 20, 40);
    x0 = m; y0 = m;
    x1 = right ? vw - m - 205 : m;
    y1 = vh - m - stub.offsetHeight;
    update();
  }

  function update() {
    ticking = false;
    const p = clamp(window.scrollY / (vh * 0.7), 0, 1);
    const e = ease(p);
    stub.style.setProperty('--tx', lerp(x0, x1, e).toFixed(1) + 'px');
    stub.style.setProperty('--ty', lerp(y0, y1, e).toFixed(1) + 'px');
    stub.style.setProperty('--p', e.toFixed(3));
    stub.style.setProperty('--q', clamp((e - 0.8) / 0.2, 0, 1).toFixed(3));
    const hidden = hideStub && p >= 1;
    stub.classList.toggle('off', hidden);
    if (hidden) stub.setAttribute('tabindex', '-1'); else stub.removeAttribute('tabindex');
  }

  if ('IntersectionObserver' in window) {
    const seen = {};
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { seen[e.target.id || e.target.tagName] = e.isIntersecting; });
      hideStub = !!(seen.connect || seen.FOOTER);
      update();
    }, { threshold: 0.05 });
    const connect = document.getElementById('connect');
    const footer = document.querySelector('footer');
    if (connect) io.observe(connect);
    if (footer) io.observe(footer);
  }

  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  measure();
}

if (!reduce) start();
