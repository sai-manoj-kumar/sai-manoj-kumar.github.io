import test from 'node:test';
import assert from 'node:assert/strict';
import { doc } from './helpers.js';
import { site } from '../../src/data/site.js';

test('one h1, and it is the hero sentence with the figure marked up', () => {
  const h1s = doc.querySelectorAll('h1');
  assert.equal(h1s.length, 1);
  assert.equal(h1s[0].textContent.replace(/\s+/g, ' ').trim(), site.hero.sentence);
  assert.equal(h1s[0].querySelector('.figure').textContent, site.hero.figure);
});

test('the top bar has the name link and exactly the two profile links, tagged for the top bar', () => {
  const bar = doc.querySelector('header.topbar');
  assert.equal(bar.querySelector('a.topbar-name').getAttribute('href'), '#top');
  assert.equal(bar.querySelector('a.topbar-name').textContent.trim(), site.name);
  const tracked = [...bar.querySelectorAll('a[data-track]')];
  assert.deepEqual(tracked.map((a) => [a.getAttribute('data-track'), a.getAttribute('href')]), [
    ['linkedin:topbar', site.links.linkedin],
    ['github:topbar', site.links.github],
  ]);
  assert.equal(bar.querySelectorAll('h1,h2,h3').length, 0, 'the name is a link, not a heading');
  assert.equal(bar.querySelectorAll('fieldset.theme').length, 1);
});

test('the hero has no buttons or links: the connect buttons live in the top bar only', () => {
  const hero = doc.querySelector('section.hero');
  assert.ok(hero);
  assert.equal(hero.querySelectorAll('a, button').length, 0);
});

test('the pipeline lists four stages in order, with the numbers as real text', () => {
  const stages = [...doc.querySelectorAll('ol.pipeline > li[data-stage]')];
  assert.deepEqual(stages.map((s) => s.getAttribute('data-stage')), ['event', 'queue', 'delivery', 'endpoint']);
  assert.ok(doc.querySelector('ol.pipeline').getAttribute('aria-label'));
  assert.match(stages[2].textContent, /Delivery service ×3/);
  assert.match(stages[2].textContent, /30% fewer failed deliveries/);
  assert.match(stages[3].textContent, /Customer endpoint/);
  assert.match(stages[3].textContent, /25% lower latency/);
  for (const dot of doc.querySelectorAll('.pipeline .dot')) assert.equal(dot.getAttribute('aria-hidden'), 'true');
});

test('nothing from the old split layout, photos or Connect band is left', () => {
  for (const sel of ['.stage', '.split', '.reader', '.slides', '.connect', '#connect', 'img', 'picture']) {
    assert.equal(doc.querySelectorAll(sel).length, 0, sel);
  }
  assert.equal(doc.getElementById('top').tagName, 'DIV');
});

test('the footer has the copyright and the two profile links, and no photo credit', () => {
  const footer = doc.querySelector('footer');
  assert.match(footer.textContent, /© 2026 Sai Manoj/);
  assert.doesNotMatch(footer.textContent, /Photo|Wikimedia|CC BY/);
  assert.deepEqual([...footer.querySelectorAll('a')].map((a) => a.getAttribute('href')), [site.links.linkedin, site.links.github]);
});

test('page order: hero, experience, rate limiter, tech stack, about', () => {
  const ids = [...doc.querySelectorAll('main > section')].map((s) => s.id || s.className.split(' ')[0]);
  assert.deepEqual(ids, ['hero', 'work', 'limiter', 'stack', 'about']);
});

test('the rate limiter section says what it is, then explains the demo', () => {
  const section = doc.getElementById('limiter');
  assert.equal(section.querySelector('h2').textContent.trim(), 'Rate limiter');
  assert.equal(section.querySelector('.tagline').textContent.trim(), 'A crucial part of Gateways that I built');
  const kids = [...section.children].filter((c) => c.tagName !== 'SCRIPT').map((c) => c.className || c.tagName.toLowerCase());
  assert.deepEqual(kids.slice(0, 3), ['h2', 'tagline', 'note']);
});

test('the rate limiter is one demo: the diagram, the tokens and the log in a single panel', () => {
  const section = doc.getElementById('limiter');
  assert.deepEqual([...section.children].filter((c) => c.tagName !== 'SCRIPT').map((c) => c.className || c.tagName.toLowerCase()), ['h2', 'tagline', 'note', 'dispenser']);
  const demo = doc.getElementById('dispenser');
  const arch = demo.querySelector('figure.arch');
  assert.ok(arch, 'the diagram is inside the demo');
  const names = [...arch.querySelectorAll('.arch-node')].map((n) => n.firstChild.textContent.trim());
  assert.deepEqual(names, ['Clients', 'Authentication', 'Rate limiter', 'Backend services']);
  assert.equal(arch.querySelector('.arch-gateway .arch-label').textContent.trim(), 'API Gateway');
  const hot = arch.querySelectorAll('.arch-node.hot');
  assert.equal(hot.length, 1);
  assert.ok(hot[0].closest('.arch-gateway'), 'the rate limiter sits inside the gateway');
  assert.equal(arch.querySelectorAll('.arch-services .arch-node').length, 1);
  assert.equal(demo.querySelectorAll('button, a, input').length, 0, 'there is nothing to click in the demo');
  assert.equal(hot[0].querySelectorAll('.bucket .chip').length, 5, 'the five tokens live inside the rate limiter');
  assert.ok(hot[0].querySelector('#bucket-label'));
  assert.ok(demo.querySelector('ol#tickets'), 'the log is in the same panel');
  assert.ok(demo.querySelector('#fallback'));
  assert.equal(doc.querySelectorAll('#take').length, 0);
});

test('the diagram explains itself in words, and the lanes and the layer tickets travel on are decoration', () => {
  const arch = doc.querySelector('figure.arch');
  const caption = arch.querySelector('figcaption').textContent;
  assert.match(caption, /authentication/i);
  assert.match(caption, /429/);
  assert.match(caption, /never sees it/i);
  for (const el of arch.querySelectorAll('.arch-lane, .arch-parcels')) assert.equal(el.getAttribute('aria-hidden'), 'true');
  assert.match(arch.querySelector('.arch-back').textContent, /429 Too Many Requests/);
  assert.equal(arch.querySelectorAll('.arch-parcel').length, 0, 'no tickets in flight until the demo sends one');
});
