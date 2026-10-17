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

  take.disabled = false;
  take.addEventListener('click', () => {
    served += 1;
    const result = bucket.tryTake();
    if (result.ok) {
      addTicket(`No. ${pad(served)}`, '200 Admitted', false);
    } else {
      addTicket(`No. ${pad(served)}`, denyText(result.readyAt), true, result.readyAt);
    }
    paint();
  });

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
