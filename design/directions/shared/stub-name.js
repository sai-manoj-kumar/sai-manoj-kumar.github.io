/* Stub engine A: the big name (#name) shrinks into the stub (#stub) as the page scrolls.
   data-side="left|right" on #stub picks the corner. Without JS or with reduced motion the name just sits in the hero. */
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function start() {
  const name = document.getElementById('name');
  const stub = document.getElementById('stub');
  const hero = document.getElementById('top');
  const foot = document.querySelector('.hero-foot');
  if (!name || !stub || !hero) return;
  const right = stub.dataset.side === 'right';

  let x0, y0, x1, y1, s1, vh;
  let hideStub = false;
  let ticking = false;

  function measure() {
    root.classList.remove('anim');
    name.style.removeProperty('--ts');
    const r = name.getBoundingClientRect();
    const vw = window.innerWidth;
    vh = window.innerHeight;
    root.classList.add('anim');
    const m = clamp(vw * 0.022, 16, 32);
    const stubW = vw < 860 ? 140 : 200;
    s1 = stubW / r.width;
    x0 = r.left; y0 = r.top;
    x1 = right ? vw - m - stubW : m + 10;
    y1 = vh - m - r.height * s1 - 14;
    update();
  }

  function update() {
    ticking = false;
    const p = clamp(window.scrollY / (vh * 0.6), 0, 1);
    const e = ease(p);
    name.style.setProperty('--tx', lerp(x0, x1, e).toFixed(1) + 'px');
    name.style.setProperty('--ty', lerp(y0, y1, e).toFixed(1) + 'px');
    name.style.setProperty('--ts', lerp(1, s1, e).toFixed(4));
    name.style.visibility = p >= 1 ? 'hidden' : '';
    root.style.setProperty('--p', e.toFixed(3));
    if (foot) foot.classList.toggle('gone', p > 0.33);
    const on = p >= 0.98 && !hideStub;
    stub.classList.toggle('on', on);
    if (on) stub.removeAttribute('tabindex'); else stub.setAttribute('tabindex', '-1');
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
