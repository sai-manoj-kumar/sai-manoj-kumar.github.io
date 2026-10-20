/* The pinned half shows the live demo, then swaps to the diagram of the role being read.
   It only runs where the half is pinned (861px and wider). Elsewhere, and without JavaScript, the diagrams stay
   inline in their roles. The head script in Base.astro sets `swap` before first paint; this keeps it correct
   as the window is resized. */
const root = document.documentElement;
const wide = window.matchMedia('(min-width: 861px)');
const slides = [...document.querySelectorAll('.slide')];
const roles = [...document.querySelectorAll('.role[data-slide]')];
const work = document.getElementById('work');

if (slides.length && roles.length && work) {
  let current = null;
  let ticking = false;

  function show(name) {
    if (name === current) return;
    current = name;
    slides.forEach((slide) => slide.classList.toggle('on', slide.dataset.slide === name));
  }

  /* The active role is the last one whose top has passed the middle of the screen,
     while the Experience section straddles that line. Otherwise: the demo. */
  function update() {
    ticking = false;
    if (!root.classList.contains('swap')) return;
    const middle = window.innerHeight * 0.5;
    const section = work.getBoundingClientRect();
    let active = 'demo';
    if (section.top <= middle && section.bottom > middle) {
      for (const role of roles) if (role.getBoundingClientRect().top <= middle) active = role.dataset.slide;
    }
    show(active);
  }

  function sync() {
    root.classList.toggle('swap', wide.matches);
    if (!wide.matches) show('demo');
    update();
  }

  wide.addEventListener('change', sync);
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener('resize', update);
  sync();
}
