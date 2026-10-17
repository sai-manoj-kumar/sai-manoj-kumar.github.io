import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFontCss, buildFontFaceCss } from '../../scripts/fetch-fonts.mjs';

// Same structure Fontshare returns today: per weight, woff2 then woff then truetype.
const block = (weight, id) => `@font-face {
  font-family: 'General Sans';
  src: url('//cdn.fontshare.com/wf/${id}.woff2') format('woff2'),
       url('//cdn.fontshare.com/wf/${id}.woff') format('woff'),
       url('//cdn.fontshare.com/wf/${id}.ttf') format('truetype');
  font-weight: ${weight};
  font-display: swap;
  font-style: normal;
}`;
const sample = `/* General Sans */\n${block(400, 'AAA')}\n${block(500, 'BBB')}\n${block(700, 'CCC')}\n`;

test('parseFontCss returns one woff2 URL per weight, with an https scheme', () => {
  const faces = parseFontCss(sample);
  assert.deepEqual(faces, [
    { weight: 400, url: 'https://cdn.fontshare.com/wf/AAA.woff2' },
    { weight: 500, url: 'https://cdn.fontshare.com/wf/BBB.woff2' },
    { weight: 700, url: 'https://cdn.fontshare.com/wf/CCC.woff2' },
  ]);
});

test('parseFontCss fails loudly when the format has changed', () => {
  assert.throws(() => parseFontCss(''), /No woff2 @font-face rules/);
  assert.throws(() => parseFontCss('<html>Not found</html>'), /No woff2 @font-face rules/);
});

test('buildFontFaceCss points at local files and never at Fontshare', () => {
  const css = buildFontFaceCss(parseFontCss(sample));
  assert.match(css, /url\('\/fonts\/general-sans-400\.woff2'\) format\('woff2'\)/);
  assert.match(css, /font-display: swap/);
  assert.doesNotMatch(css, /fontshare/i);
  assert.equal((css.match(/@font-face/g) || []).length, 3);
});
