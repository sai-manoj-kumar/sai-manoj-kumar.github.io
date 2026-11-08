/* Roles open on their own as the reader scrolls down to them, and stay open. Nothing here ever closes a role.
   A role opens once its top has passed the middle of the screen. This is a position check, not an
   edge-crossing observer, so a reload or an anchor jump that lands mid-page opens every role above the
   middle too. Closed styling only exists under html.reveal (see global.css); without JavaScript, or with
   reduced motion, every role is simply open.
   Each role that opens is announced once as a `role-open` event, which analytics.js listens for. */
const roles = [...document.querySelectorAll('.role')];
const announced = new Set();
let ticking = false;

/* A role wholly above the screen opens without animation, and the page is moved by what it grew (browser scroll
   anchoring is switched off in global.css so this is the only correction, the same in every browser), so the
   words the reader is looking at do not jump (Safari has no scroll anchoring of its own). */
function openAbove(role) {
  const before = role.getBoundingClientRect().height;
  role.classList.add('snap', 'open');
  const grew = role.getBoundingClientRect().height - before;
  role.classList.remove('snap');
  if (grew > 0) window.scrollBy({ top: grew, behavior: 'instant' });
}

function update() {
  ticking = false;
  const middle = window.innerHeight * 0.5;
  for (const role of roles) {
    const box = role.getBoundingClientRect();
    if (box.top > middle) continue;
    if (!role.classList.contains('open')) {
      if (box.bottom <= 0) openAbove(role);
      else role.classList.add('open');
    }
    if (!announced.has(role)) {
      announced.add(role);
      document.dispatchEvent(new CustomEvent('role-open', { detail: role.dataset.role }));
    }
  }
}

function queue() {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(update);
}

window.addEventListener('scroll', queue, { passive: true });
window.addEventListener('resize', queue);
window.addEventListener('load', queue);
update();
