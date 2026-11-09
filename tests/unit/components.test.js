import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../../src/styles/global.css', import.meta.url), 'utf8');

/* The declarations of the rule whose selector is exactly `selector`, or null when there is none. */
function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? null;
}

test('the shared card and icon button exist, and carry the box and the control', () => {
  const card = rule('.card');
  assert.ok(card, '.card rule');
  assert.match(card, /border:\s*1px solid var\(--line\)/);
  assert.match(card, /border-radius:\s*var\(--radius-lg\)/);
  assert.match(card, /padding:\s*var\(--card-pad\)/);
  const button = rule('.icon-btn');
  assert.ok(button, '.icon-btn rule');
  assert.match(button, /width:\s*var\(--control\)/);
  assert.match(button, /min-height:\s*var\(--control\)/);
  assert.match(button, /border:\s*1px solid var\(--line\)/);
  assert.match(button, /border-radius:\s*var\(--radius-md\)/);
});

test('the components that use them do not repeat the box or the control', () => {
  for (const selector of ['.viz', '.dispenser']) {
    const body = rule(selector);
    assert.ok(body, selector);
    assert.doesNotMatch(body, /border|padding:\s*var\(--card-pad\)/, `${selector} gets its box from .card`);
  }
  for (const selector of ['.topbar-link', '.theme-cycle']) {
    const body = rule(selector);
    if (body === null) continue;
    assert.doesNotMatch(body, /border|width:|height:|transition/, `${selector} gets its control from .icon-btn`);
  }
});

test('the primary icon button is a variant, not a rule keyed to the analytics attribute', () => {
  assert.ok(rule('.icon-btn[data-variant="primary"]'), 'primary variant rule');
  assert.doesNotMatch(css, /\[data-track/, 'styles never select on data-track');
});

test('reduced motion switches off the icon button transition by its shared class', () => {
  const list = css.match(/[^\n{}]*\{ transition: none; \}/)?.[0] ?? '';
  assert.match(list, /\.icon-btn/);
  assert.doesNotMatch(list, /\.topbar-link|\.theme-cycle/);
});
