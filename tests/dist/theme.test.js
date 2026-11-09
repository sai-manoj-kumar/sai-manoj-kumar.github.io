import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { doc, html } from './helpers.js';

const astro = new URL('../../dist/_astro/', import.meta.url);
const allCss = [html, ...(existsSync(astro) ? readdirSync(astro) : []).filter((f) => f.endsWith('.css')).map((f) => readFileSync(new URL(f, astro), 'utf8'))].join('\n');
const headScript = () => [...doc.querySelectorAll('head script')].map((s) => s.textContent).find((t) => t.includes('localStorage')) ?? '';

test('the theme control is one button in the top bar, and the old three-way radio switch is gone', () => {
  assert.equal(doc.querySelectorAll('.topbar button.theme-cycle').length, 1);
  assert.equal(doc.querySelectorAll('fieldset.theme, input[name="theme"]').length, 0);
});

test('the head script reads the stored choice before first paint, safely', () => {
  const script = headScript();
  assert.match(script, /classList\.add\('js'\)/);
  assert.match(script, /localStorage\.getItem\('theme'\)/);
  assert.match(script, /setAttribute\('data-theme'/);
  assert.match(script, /try\s*{/, 'storage access is inside try/catch');
  assert.doesNotMatch(script, /swap|min-width: 861px/, 'the pinned stage is gone, so no layout class is set');
});

test('the colour scheme and theme-color metas exist for both modes', () => {
  assert.equal(doc.querySelector('meta[name="color-scheme"]').getAttribute('content'), 'light dark');
  const colors = [...doc.querySelectorAll('meta[name="theme-color"]')];
  assert.deepEqual(colors.map((m) => [m.getAttribute('data-scheme'), m.getAttribute('content'), m.getAttribute('media')]), [
    ['light', '#ffffff', '(prefers-color-scheme: light)'],
    ['dark', '#0e0f12', '(prefers-color-scheme: dark)'],
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

test('the top bar also has a one-button theme cycle for phones, labelled with the current mode', () => {
  const button = doc.querySelector('.topbar button.theme-cycle');
  assert.ok(button, 'a cycle button in the top bar');
  assert.equal(button.getAttribute('type'), 'button');
  assert.match(button.getAttribute('aria-label'), /^Theme: System\b/);
  assert.equal(button.getAttribute('data-mode'), 'system');
  assert.equal(button.querySelectorAll('svg[aria-hidden="true"]').length, 3, 'one icon per mode, only the current one shown');
});

test('the profile links keep their names as text, so icon-only buttons still have an accessible name', () => {
  const names = [...doc.querySelectorAll('.topbar a.topbar-link')].map((a) => a.textContent.trim());
  assert.deepEqual(names, ['LinkedIn', 'GitHub']);
  assert.equal(doc.querySelectorAll('.topbar a.topbar-link .topbar-text').length, 2);
});
