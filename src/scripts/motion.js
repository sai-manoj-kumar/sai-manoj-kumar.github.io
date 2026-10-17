/* Motion: entrances and the hero card shrinking into a stub.
   Everything here is an enhancement; without it the page reads in full. */
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

function start() {
  root.classList.add('anim');

  /* Entrances: heading, text, picture, staggered by the --d on each part. */
  const targets = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    targets.forEach((t) => io.observe(t));
  } else {
    targets.forEach((t) => t.classList.add('in'));
  }

  /* Pinned story: the hero card shrinks to a stub and stays. */
  const hero = document.getElementById('top');
  const card = document.getElementById('card');
  const inner = document.getElementById('card-inner');
  const stub = document.getElementById('stub');
  const room = document.querySelector('.room');
  if (!hero || !card || !inner || !stub) return;

  let vw, vh, cw, ch, m, s1, x0, y0, x1, y1;
  let ticking = false;
  let hideStub = false;

  function update() {
    ticking = false;
    const y = window.scrollY || window.pageYOffset;
    const p = clamp(y / (vh * 0.75), 0, 1);
    const e = ease(p);

    card.style.setProperty('--tx', lerp(x0, x1, e).toFixed(1) + 'px');
    card.style.setProperty('--ty', lerp(y0, y1, e).toFixed(1) + 'px');
    card.style.setProperty('--ts', lerp(1, s1, e).toFixed(4));
    inner.style.setProperty('--c', (1 - clamp((p - 0.15) / 0.35, 0, 1)).toFixed(3));
    card.style.opacity = p > 0.9 ? String(clamp(1 - (p - 0.9) / 0.1, 0, 1)) : '';
    card.style.visibility = p >= 1 ? 'hidden' : '';
    stub.classList.toggle('on', p >= 0.98 && !hideStub);

    if (room) {
      const span = Math.max(1, hero.offsetHeight - vh);
      room.style.setProperty('--room-s', (1 + 0.1 * clamp(y / span, 0, 1)).toFixed(4));
    }
  }

  function measure() {
    vw = window.innerWidth; vh = window.innerHeight;
    cw = card.offsetWidth; ch = card.offsetHeight;
    m = clamp(vw * 0.025, 16, 32);
    const stubW = vw < 860 ? 150 : 210;
    s1 = stubW / cw;
    x0 = (vw - cw) / 2; y0 = (vh - ch) / 2;
    x1 = m; y1 = vh - m - ch * s1;
    update();
  }

  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }

  /* The stub points at Connect, so it steps aside while Connect or the footer is on screen. */
  if ('IntersectionObserver' in window) {
    const seen = {};
    const so = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { seen[e.target.id || e.target.tagName] = e.isIntersecting; });
        hideStub = !!(seen.connect || seen.FOOTER);
        update();
      },
      { threshold: 0.05 },
    );
    const connect = document.getElementById('connect');
    const footer = document.querySelector('footer');
    if (connect) so.observe(connect);
    if (footer) so.observe(footer);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  measure();

  /* Hero parts rise in once, a beat after load. */
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      document.querySelectorAll('.card .rv').forEach((n) => n.classList.add('in'));
    });
  });
}

if (!reduce) start();
