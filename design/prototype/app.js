/* Sai Manoj: motion and the rate-limiter demo.
   Everything here is an enhancement. Without it the page reads in full. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- The rate limiter: a token bucket, five tokens, one new every three seconds ---- */
  (function limiter() {
    var take = document.getElementById('take');
    var list = document.getElementById('tickets');
    var label = document.getElementById('bucket-label');
    var chips = document.querySelectorAll('#dispenser .chip');
    if (!take || !list || !label) return;

    var CAP = 5, EVERY = 2000;
    var tokens = CAP, last = Date.now(), served = 0;

    function refill() {
      var now = Date.now();
      var add = Math.floor((now - last) / EVERY);
      if (add > 0) {
        tokens = Math.min(CAP, tokens + add);
        last = tokens === CAP ? now : last + add * EVERY;
      }
    }
    function paint() {
      for (var i = 0; i < chips.length; i++) chips[i].classList.toggle('empty', i >= tokens);
      label.textContent = tokens + ' of ' + CAP + ' tokens left';
    }
    function pad(n) { return ('0000' + n).slice(-4); }
    /* A denied ticket counts down to the moment the next token arrives. */
    function denyText(ready) {
      var rest = ready - Date.now();
      return '429 Too Many Requests. ' + (rest > 0 ? 'Try again in ' + Math.ceil(rest / 1000) + 's' : 'Try again now');
    }
    function addTicket(text, denied, ready) {
      var li = document.createElement('li');
      li.className = 'ticket' + (denied ? ' deny' : '');
      var a = document.createElement('span'), b = document.createElement('span');
      a.textContent = text[0]; b.textContent = text[1];
      if (denied) { li.setAttribute('data-ready', ready); b.setAttribute('aria-live', 'off'); }
      li.appendChild(a); li.appendChild(b);
      list.insertBefore(li, list.firstChild);
      while (list.children.length > 4) list.removeChild(list.lastChild);
    }

    take.disabled = false;
    take.addEventListener('click', function () {
      refill();
      served += 1;
      if (tokens > 0) {
        if (tokens === CAP) last = Date.now();
        tokens -= 1;
        addTicket(['No. ' + pad(served), '200 Admitted'], false);
      } else {
        var ready = last + EVERY;
        addTicket(['No. ' + pad(served), denyText(ready)], true, ready);
      }
      paint();
    });
    setInterval(function () {
      refill(); paint();
      var denied = list.querySelectorAll('.ticket.deny');
      for (var i = 0; i < denied.length; i++) {
        var b = denied[i].lastChild, t = denyText(+denied[i].getAttribute('data-ready'));
        if (b.textContent !== t) b.textContent = t;
      }
    }, 250);
    paint();
  })();

  if (reduce) return;
  root.classList.add('anim');

  /* ---- Entrances: heading, text, picture, staggered by the --d on each part ---- */
  var targets = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('in'); });
  }

  /* ---- Pinned story: the hero card shrinks to a stub and stays ---- */
  var hero = document.getElementById('top');
  var card = document.getElementById('card');
  var inner = document.getElementById('card-inner');
  var stub = document.getElementById('stub');
  var room = document.querySelector('.room');
  if (!hero || !card || !inner || !stub) return;

  var vw, vh, cw, ch, m, s1, x0, y0, x1, y1, ticking = false, hideStub = false;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function measure() {
    vw = window.innerWidth; vh = window.innerHeight;
    cw = card.offsetWidth; ch = card.offsetHeight;
    m = clamp(vw * 0.025, 16, 32);
    var stubW = vw < 860 ? 150 : 210;
    s1 = stubW / cw;
    x0 = (vw - cw) / 2; y0 = (vh - ch) / 2;
    x1 = m; y1 = vh - m - ch * s1;
    update();
  }

  function update() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    var p = clamp(y / (vh * 0.75), 0, 1);
    var e = ease(p);

    card.style.setProperty('--tx', lerp(x0, x1, e).toFixed(1) + 'px');
    card.style.setProperty('--ty', lerp(y0, y1, e).toFixed(1) + 'px');
    card.style.setProperty('--ts', lerp(1, s1, e).toFixed(4));
    inner.style.setProperty('--c', (1 - clamp((p - 0.15) / 0.35, 0, 1)).toFixed(3));
    card.style.opacity = p > 0.9 ? String(clamp(1 - (p - 0.9) / 0.1, 0, 1)) : '';
    card.style.visibility = p >= 1 ? 'hidden' : '';
    stub.classList.toggle('on', p >= 0.98 && !hideStub);

    if (room) {
      var span = Math.max(1, hero.offsetHeight - vh);
      room.style.setProperty('--room-s', (1 + 0.1 * clamp(y / span, 0, 1)).toFixed(4));
    }
  }

  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }

  /* The stub points at Connect, so it steps aside while Connect or the footer is on screen. */
  if ('IntersectionObserver' in window) {
    var seen = {};
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen[e.target.id || e.target.tagName] = e.isIntersecting; });
      hideStub = !!(seen.connect || seen.FOOTER);
      update();
    }, { threshold: 0.05 });
    var c1 = document.getElementById('connect'), c2 = document.querySelector('footer');
    if (c1) so.observe(c1);
    if (c2) so.observe(c2);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  measure();

  /* Hero parts rise in once, a beat after load. */
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      document.querySelectorAll('.card .rv').forEach(function (n) { n.classList.add('in'); });
    });
  });
})();
