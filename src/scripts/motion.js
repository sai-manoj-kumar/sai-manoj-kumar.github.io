/* Motion: the name shrinks into the stub, and the parts of each section rise in once.
   Everything here is an enhancement: without JavaScript, or with reduced motion, the page reads in full,
   the name stays where it is and the stub is never shown. */
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* Entrances: each part rises 24px and fades in once, a beat after its neighbour. */
function entrances() {
  const groups = [['.work', '.role'], ['.stack', '.group'], ['.about', ':scope > *'], ['.connect', ':scope > *']];
  const targets = [];
  for (const [parentSelector, childSelector] of groups) {
    const parent = document.querySelector(parentSelector);
    if (!parent) continue;
    parent.querySelectorAll(childSelector).forEach((el, i) => {
      el.classList.add('rv');
      el.style.setProperty('--d', String(Math.min(i, 4)));
      targets.push(el);
    });
  }
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('in'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          observer.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  targets.forEach((el) => observer.observe(el));
}

/* The name runs along the bottom of the first screen; scrolling shrinks it into the stub at the bottom right.
   The name gets its own `.is-fixed` class so html.anim (the entrances) is never toggled while measuring. */
function nameToStub() {
  const name = document.getElementById('name');
  const stub = document.getElementById('stub');
  if (!name || !stub) return;

  let x0, y0, x1, y1, s1, vh;
  let hideStub = false;
  let ticking = false;

  function measure() {
    name.classList.remove('is-fixed');
    name.style.removeProperty('--ts');
    const rect = name.getBoundingClientRect();
    const vw = window.innerWidth;
    vh = window.innerHeight;
    name.classList.add('is-fixed');
    const margin = clamp(vw * 0.022, 16, 32);
    const stubWidth = vw < 860 ? 140 : 200;
    s1 = stubWidth / rect.width;
    x0 = rect.left;
    y0 = rect.top;
    x1 = vw - margin - stubWidth;
    y1 = vh - margin - rect.height * s1 - 14;
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
    const showStub = p >= 0.98 && !hideStub;
    stub.classList.toggle('on', showStub);
    stub.inert = !showStub; // visibility waits 0.25s to hide, so keep a fast Tab off a vanishing stub
  }

  /* The stub points at Connect, so it steps aside while Connect or the footer is on screen. */
  if ('IntersectionObserver' in window) {
    const seen = {};
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { seen[e.target.id || e.target.tagName] = e.isIntersecting; });
        hideStub = !!(seen.connect || seen.FOOTER);
        update();
      },
      { threshold: 0.05 },
    );
    const connect = document.getElementById('connect');
    const footer = document.querySelector('footer');
    if (connect) observer.observe(connect);
    if (footer) observer.observe(footer);
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  measure();
}

if (!reduce) {
  root.classList.add('anim');
  entrances();
  nameToStub();
}
