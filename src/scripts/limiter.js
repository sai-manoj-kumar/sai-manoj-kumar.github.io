/* The rate-limiter demo: DOM glue around the pure token bucket. */
import { createBucket, describeDenial } from './bucket.js';

const take = document.getElementById('take');
const list = document.getElementById('tickets');
const label = document.getElementById('bucket-label');
const chips = document.querySelectorAll('#dispenser .chip');

if (take && list && label) {
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
  }

  /* Auto-play: while the demo is on screen and the tab is showing, a ticket is taken every AUTO_MS, so a visitor sees
     the admitted tickets, then the 429s, then the refill rhythm, without touching anything. data-auto on the
     dispenser says which it is: off (waiting or paused), on (playing) or manual (the visitor clicked, so it stays
     theirs). Reduced motion never plays by itself. While it plays the list is not announced to screen readers. */
  const AUTO_MS = 700;
  const dispenser = document.getElementById('dispenser');
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

  take.disabled = false;
  take.addEventListener('click', () => {
    if (mode !== 'manual') {
      clearInterval(timer);
      if (watcher) watcher.disconnect();
      setMode('manual');
      list.setAttribute('aria-live', 'polite');
    }
    takeOne();
  });

  dispenser.dataset.auto = 'off';
  if (canAuto) {
    list.setAttribute('aria-live', 'off');
    watcher = new IntersectionObserver((entries) => {
      onScreen = entries.at(-1).isIntersecting;
      if (onScreen) play();
      else pause();
    }, { threshold: 0.5 });
    watcher.observe(dispenser);
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
