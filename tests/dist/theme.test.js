import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { doc, html } from './helpers.js';

const astro = new URL('../../dist/_astro/', import.meta.url);
const allCss = [html, ...readdirSync(astro).filter((f) => f.endsWith('.css')).map((f) => readFileSync(new URL(f, astro), 'utf8'))].join('\n');
const headScript = () => [...doc.querySelectorAll('head script')].map((s) => s.textContent).find((t) => t.includes('localStorage')) ?? '';

test('the switch is a fieldset of three radios, System first and checked', () => {
  const fieldset = doc.querySelector('.topbar fieldset.theme');
  assert.ok(fieldset, 'a theme fieldset in the top bar');
  assert.equal(fieldset.querySelector('legend').textContent.trim(), 'Theme');
  const radios = [...fieldset.querySelectorAll('input[type="radio"][name="theme"]')];
  assert.deepEqual(radios.map((r) => r.value), ['system', 'light', 'dark']);
  assert.deepEqual(radios.filter((r) => r.hasAttribute('checked')).map((r) => r.value), ['system']);
});

test('the head script reads the stored choice before first paint, safely', () => {
  const script = headScript();
  assert.match(script, /classList\.add\('js'\)/);
  assert.match(script, /localStorage\.getItem\('theme'\)/);
  assert.match(script, /setAttribute\('data-theme'/);
  assert.match(script, /try\s*{/, 'storage access is inside try/catch');
  assert.match(script, /min-width: 861px/, 'sets the swap class before first paint');
});

test('the colour scheme and theme-color metas exist for both modes', () => {
  assert.equal(doc.querySelector('meta[name="color-scheme"]').getAttribute('content'), 'light dark');
  const colors = [...doc.querySelectorAll('meta[name="theme-color"]')];
  assert.deepEqual(colors.map((m) => [m.getAttribute('data-scheme'), m.getAttribute('content'), m.getAttribute('media')]), [
    ['light', '#f1ebdc', '(prefers-color-scheme: light)'],
    ['dark', '#472913', '(prefers-color-scheme: dark)'],
  ]);
});

test('the built stylesheet defines both palettes', () => {
  assert.match(allCss, /prefers-color-scheme:\s*dark/);
  assert.match(allCss, /data-theme=["']?dark/);
  assert.match(allCss, /data-theme=["']?light/);
});

test('the 404 page applies the stored theme too', () => {
  const { document: lost } = parseHTML(readFileSync(new URL('../../dist/404.html', import.meta.url), 'utf8'));
  const script = [...lost.querySelectorAll('head script')].map((s) => s.textContent).find((t) => t.includes('localStorage'));
  assert.ok(script, 'the 404 page has the head script');
  assert.equal(lost.querySelectorAll('fieldset.theme').length, 0, 'but no switch on the 404 page');
});
