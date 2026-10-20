/* Split stage: the pinned half shows the live demo, then swaps to the diagram for the role being read.
   Only runs where the half is actually pinned (wide screens). Elsewhere the diagrams stay inline in the
   reading column, which is also what a visitor without JavaScript gets. */
const root = document.documentElement;
const mq = window.matchMedia('(min-width: 861px)');
const slides = [...document.querySelectorAll('.slide')];
const roles = [...document.querySelectorAll('.role[data-slide]')];
const work = document.getElementById('work');

if (slides.length && roles.length && work) {
  let current = null;
  let ticking = false;

  function show(name) {
    if (name === current) return;
    current = name;
    slides.forEach((s) => s.classList.toggle('on', s.dataset.slide === name));
  }

  /* The active role is the last one whose top has passed the middle of the screen. */
  function update() {
    ticking = false;
    if (!root.classList.contains('swap')) return;
    const mid = window.innerHeight * 0.5;
    const w = work.getBoundingClientRect();
    let active = 'demo';
    if (w.top <= mid && w.bottom > mid) {
      for (const r of roles) if (r.getBoundingClientRect().top <= mid) active = r.dataset.slide;
    }
    show(active);
  }

  function sync() {
    root.classList.toggle('swap', mq.matches);
    if (!mq.matches) show('demo');
    update();
  }

  mq.addEventListener('change', sync);
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  sync();
}
