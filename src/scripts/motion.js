/* Motion: the parts of each section rise in once as they are scrolled to.
   Everything here is an enhancement: without JavaScript, or with reduced motion, the page reads in full. */
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  /* Firefox and Safari would play a fade-out when .rv is first applied, so transitions only switch on
     (rv-ready) after the hidden state has been styled, and only then do we start watching. */
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      targets.forEach((el) => el.classList.add('rv-ready'));
      targets.forEach((el) => observer.observe(el));
    });
  });
}

if (!reduce) {
  root.classList.add('anim');
  entrances();
}
