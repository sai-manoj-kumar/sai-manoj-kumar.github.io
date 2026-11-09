/* The rate-limiter demo: DOM glue around the pure token bucket. */
import { createBucket, describeDenial } from './bucket.js';

const list = document.getElementById('tickets');
const label = document.getElementById('bucket-label');
const chips = document.querySelectorAll('#dispenser .chip');

const dispenser = document.getElementById('dispenser');

if (dispenser && list && label) {
  const bucket = createBucket({ capacity: 5, everyMs: 2000 });
  let served = 0;

  const pad = (n) => String(n).padStart(4, '0');

  function paint() {
    const tokens = bucket.available();
    chips.forEach((chip, i) => chip.classList.toggle('empty', i >= tokens));
    label.textContent = `${tokens} of ${bucket.capacity} tokens left`;
  }

  function addTicket(left, right, denied, readyAt) {
    const li = document.createElement('li');
    li.className = `ticket${denied ? ' deny' : ''}`;
    const a = document.createElement('span');
    const b = document.createElement('span');
    a.textContent = left;
    b.textContent = right;
    if (denied) {
      li.setAttribute('data-ready', String(readyAt));
      b.setAttribute('aria-live', 'off');
    }
    li.append(a, b);
    list.insertBefore(li, list.firstChild);
    while (list.children.length > 4) list.removeChild(list.lastChild);
  }

  /* A ticket travels the diagram: Clients, the gateway, which asks the rate limiter and gets the answer back, then on to the backend if
     admitted or back to Clients as a 429 if denied. Positions come from the nodes themselves, so it follows the layout on any screen size.
     Reduced motion gets no parcels; the diagram still flashes. */
  const arch = document.querySelector('figure.arch');
  const map = document.querySelector('.arch-map');
  const layer = document.querySelector('.arch-parcels');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FLASH_MS = 450;
  const FLIGHT_MS = 1500;
  let flashTimer = null;

  function flash(ok) {
    if (!arch) return;
    arch.dataset.flash = ok ? 'admit' : 'deny';
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => delete arch.dataset.flash, FLASH_MS);
  }

  function centre(el, box) {
    const r = el.getBoundingClientRect();
    return [Math.round((r.left - box.left + r.width / 2 - 7) * 10) / 10, Math.round((r.top - box.top + r.height / 2 - 7) * 10) / 10];
  }

  function send(ok) {
    if (calm || !map || !layer || !layer.animate) return;
    const box = map.getBoundingClientRect();
    const at = (sel, i = 0) => centre(document.querySelectorAll(sel)[i], box);
    const clients = at('.arch-clients .arch-node');
    const gate = at('.arch-gateway .arch-node');
    const hot = at('.arch-node.hot');
    /* Admitted tickets land at the left edge of the service, clear of its name. */
    const service = at('.arch-services .arch-node');
    const edge = document.querySelector('.arch-services .arch-node').getBoundingClientRect().left - box.left + 4;
    const end = ok ? [Math.round(edge * 10) / 10, service[1]] : clients;
    const parcel = document.createElement('span');
    parcel.className = `arch-parcel ${ok ? 'ok' : 'no'}`;
    layer.append(parcel);
    const frame = ([x, y], offset, opacity = 1) => ({ transform: `translate(${x}px, ${y}px)`, opacity, offset });
    const run = parcel.animate([
      frame(clients, 0, 0), frame(clients, 0.04), frame(gate, 0.28), frame(hot, 0.46), frame(hot, 0.54), frame(gate, 0.72), frame(end, 0.96), frame(end, 1, 0),
    ], { duration: FLIGHT_MS, easing: 'ease-in-out', fill: 'both' });
    run.onfinish = () => parcel.remove();
  }

  const denyText = (readyAt) => `429 Too Many Requests. ${describeDenial(readyAt)}`;

  function takeOne() {
    served += 1;
    const result = bucket.tryTake();
    if (result.ok) {
      addTicket(`No. ${pad(served)}`, '200 Admitted', false);
    } else {
      addTicket(`No. ${pad(served)}`, denyText(result.readyAt), true, result.readyAt);
    }
    paint();
    flash(result.ok);
    send(result.ok);
  }

  /* Auto-play: while the demo is on screen and the tab is showing, a ticket is sent every AUTO_MS, so a visitor sees
     the admitted tickets, then the 429s, then the refill rhythm. There is nothing to click. data-auto on the
     dispenser says whether it is on or off (waiting or paused). Reduced motion never plays by itself. The list is
     never announced to screen readers. */
  const AUTO_MS = 700;
  const canAuto = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window;
  let mode = 'off';
  let timer = null;
  let onScreen = false;
  let watcher = null;

  function setMode(next) {
    mode = next;
    dispenser.dataset.auto = next;
  }
  function play() {
    if (mode !== 'off' || !onScreen || document.hidden) return;
    setMode('on');
    timer = setInterval(takeOne, AUTO_MS);
  }
  function pause() {
    if (mode !== 'on') return;
    clearInterval(timer);
    setMode('off');
  }

  dispenser.dataset.auto = 'off';
  if (canAuto) {
    watcher = new IntersectionObserver((entries) => {
      onScreen = entries.at(-1).isIntersecting;
      if (onScreen) play();
      else pause();
    }, { threshold: 0.5 });
    watcher.observe(map || dispenser);
    document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));
  }

  /* Repaint the chips and keep every denied ticket's countdown live. */
  setInterval(() => {
    paint();
    list.querySelectorAll('.ticket.deny').forEach((ticket) => {
      const b = ticket.lastChild;
      const text = denyText(Number(ticket.getAttribute('data-ready')));
      if (b.textContent !== text) b.textContent = text;
    });
  }, 250);

  paint();
}
