/* Roles open as the reader scrolls down to them, in step with the scroll, and stay open. Nothing here ever closes
   a role: each role's progress only goes up.
   A role starts opening when its top reaches 85% of the way down the screen and is fully open when it reaches the
   middle, so the body grows as the page moves, like a page you are turning. Progress is worked out from the
   role's position, not from an observer, so a reload or an anchor jump that lands mid-page opens every role
   above the middle too. The styling only exists under html.reveal (see global.css); without JavaScript, or
   with reduced motion, every role is simply open.
   Each role that finishes opening is announced once as a `role-open` event, which analytics.js listens for. */
const START = 0.85;
const END = 0.5;

const roles = [...document.querySelectorAll('.role')].map((el) => ({
  el,
  inner: el.querySelector('.role-inner'),
  progress: el.classList.contains('open') ? 1 : 0,
  announced: false,
}));
let ticking = false;

/* The body is clipped to progress x its full height, so its full height is kept as --h. */
function measure(role) {
  role.el.style.setProperty('--h', `${role.inner.offsetHeight}px`);
}

function paint(role) {
  if (role.progress >= 1) role.el.classList.add('open');
  else role.el.style.setProperty('--p', role.progress.toFixed(3));
}

/* A role wholly above the screen opens at once, and the page is moved by what it grew (browser scroll anchoring
   is switched off in global.css so this is the only correction, the same in every browser), so the words the
   reader is looking at do not jump. */
function openAbove(role) {
  const before = role.el.getBoundingClientRect().height;
  role.el.classList.add('snap');
  role.progress = 1;
  paint(role);
  const grew = role.el.getBoundingClientRect().height - before;
  role.el.classList.remove('snap');
  if (grew > 0) window.scrollBy({ top: grew, behavior: 'instant' });
}

function update() {
  ticking = false;
  const height = window.innerHeight;
  const span = (START - END) * height;
  for (const role of roles) {
    const box = role.el.getBoundingClientRect();
    const wanted = Math.min(1, Math.max(0, (START * height - box.top) / span));
    if (wanted > role.progress) {
      if (box.bottom <= 0 && wanted >= 1) openAbove(role);
      else {
        role.progress = wanted;
        paint(role);
      }
    }
    if (box.top <= END * height && !role.announced) {
      role.announced = true;
      document.dispatchEvent(new CustomEvent('role-open', { detail: role.el.dataset.role }));
    }
  }
}

function queue() {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(update);
}

roles.forEach(measure);
if ('ResizeObserver' in window) {
  const watch = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const role = roles.find((r) => r.inner === entry.target);
      if (role) measure(role);
    }
  });
  roles.forEach((role) => watch.observe(role.inner));
}
window.addEventListener('scroll', queue, { passive: true });
window.addEventListener('resize', queue);
window.addEventListener('load', queue);
update();
