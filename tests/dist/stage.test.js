import test from 'node:test';
import assert from 'node:assert/strict';
import { doc } from './helpers.js';

const squash = (el) => el.textContent.replace(/\s+/g, ' ').trim();

test('one h1, and it is the headline sentence', () => {
  const h1s = doc.querySelectorAll('h1');
  assert.equal(h1s.length, 1);
  assert.equal(h1s[0].textContent.trim(), 'Backend systems that run at scale. Tools that make AI agents useful.');
  assert.ok(h1s[0].classList.contains('sentence'));
  assert.equal(doc.getElementById('name'), null);
  assert.equal(doc.getElementById('stub'), null);
  assert.equal(doc.querySelector('.name'), null);
});

test('the intro carries the facts, the sentence and the two profile links', () => {
  const intro = doc.querySelector('.intro');
  for (const line of ['Senior software engineer', 'Backend systems that run at scale. Tools that make AI agents useful.']) {
    assert.ok(intro.textContent.includes(line), line);
  }
  assert.deepEqual([...intro.querySelectorAll('a')].map((a) => a.getAttribute('href')), [
    'https://www.linkedin.com/in/sai-manoj-kumar',
    'https://github.com/sai-manoj-kumar',
  ]);
});

test('the stage photo has alt text and sizes, and phones get the portrait crop', () => {
  const img = doc.querySelector('.stage picture img.room');
  assert.equal(img.getAttribute('src'), '/images/hero-stage.jpg');
  assert.ok(img.getAttribute('alt'), 'alt');
  assert.ok(img.getAttribute('width') && img.getAttribute('height'), 'width and height');
  const source = doc.querySelector('.stage picture source');
  assert.equal(source.getAttribute('media'), '(max-width: 860px)');
  assert.equal(source.getAttribute('srcset'), '/images/hero-phone.jpg');
});

test('the photo credit is not in the stage or the intro', () => {
  assert.doesNotMatch(doc.querySelector('.stage').textContent, /PiDatacenters|Photo:/);
  assert.doesNotMatch(doc.querySelector('.intro').textContent, /PiDatacenters|Photo:/);
});

test('the top bar has the name link and a Connect link', () => {
  const name = doc.querySelector('.topbar a.topbar-name[href="#top"]');
  assert.ok(name);
  assert.equal(name.textContent.trim(), 'Sai Manoj');
  const connect = doc.querySelector('.topbar a.topbar-connect[href="#connect"]');
  assert.ok(connect);
  assert.equal(connect.textContent.trim(), 'Connect');
  assert.equal(name.hasAttribute('data-track'), false);
  assert.equal(connect.hasAttribute('data-track'), false);
});

test('the stage has four slides in order, only the demo is on, and the demo exists once', () => {
  const slides = [...doc.querySelectorAll('.stage .slide')];
  assert.deepEqual(slides.map((s) => s.getAttribute('data-slide')), ['demo', 'memory', 'rewrite', 'trace']);
  assert.deepEqual(slides.filter((s) => s.classList.contains('on')).map((s) => s.getAttribute('data-slide')), ['demo']);
  for (const id of ['dispenser', 'take', 'tickets', 'bucket-label', 'fallback']) {
    assert.equal(doc.querySelectorAll(`#${id}`).length, 1, `exactly one #${id}`);
  }
});

test('each diagram is in the stage and inline in its role, with identical text', () => {
  for (const name of ['memory', 'rewrite', 'trace']) {
    const pinned = doc.querySelector(`.stage .slide[data-slide="${name}"] .viz`);
    const inline = doc.querySelector(`.role[data-slide="${name}"] .viz`);
    assert.ok(pinned && inline, `${name} appears twice`);
    assert.equal(squash(pinned), squash(inline), `${name} copies match`);
  }
  assert.equal(doc.querySelector('.role[data-slide="demo"] .viz'), null, 'the demo role has no inline diagram');
});

test('the page shell has the landmarks and the section ids the links need', () => {
  assert.ok(doc.querySelector('aside.stage[aria-label]'));
  assert.ok(doc.querySelector('.reader > header.topbar nav[aria-label="Sections"]'));
  assert.equal(doc.querySelectorAll('main').length, 1);
  assert.ok(doc.querySelector('.reader > footer'));
  for (const id of ['work', 'stack', 'about', 'connect']) assert.ok(doc.getElementById(id), `#${id}`);
  assert.deepEqual([...doc.querySelectorAll('.topbar nav a')].map((a) => a.getAttribute('href')), ['#work', '#stack', '#about']);
});
