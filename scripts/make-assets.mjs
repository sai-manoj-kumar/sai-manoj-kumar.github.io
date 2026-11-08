// One-off asset generation: favicons and the share image.
// Run with `npm run assets` after changing the sources; outputs are committed.
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const at = (...p) => path.join(root, ...p);

await sharp(at('public/favicon.svg'), { density: 300 }).resize(32, 32).png().toFile(at('public/favicon-32.png'));
await sharp(at('public/favicon.svg'), { density: 300 }).resize(180, 180).png().toFile(at('public/apple-touch-icon.png'));

// favicon.ico: one 48x48 PNG wrapped as a PNG-in-ICO (ICONDIR, one ICONDIRENTRY, then the PNG bytes).
const ico48 = await sharp(at('public/favicon.svg'), { density: 300 }).resize(48, 48).png().toBuffer();
const icoHead = Buffer.alloc(22);
icoHead.writeUInt16LE(0, 0); // reserved
icoHead.writeUInt16LE(1, 2); // type: icon
icoHead.writeUInt16LE(1, 4); // image count
icoHead.writeUInt8(48, 6); // width
icoHead.writeUInt8(48, 7); // height
icoHead.writeUInt8(0, 8); // colours in palette
icoHead.writeUInt8(0, 9); // reserved
icoHead.writeUInt16LE(1, 10); // colour planes
icoHead.writeUInt16LE(32, 12); // bits per pixel
icoHead.writeUInt32LE(ico48.length, 14); // PNG byte size
icoHead.writeUInt32LE(22, 18); // offset to the PNG
writeFileSync(at('public/favicon.ico'), Buffer.concat([icoHead, ico48]));

// The share image: render og/og-card.html with the real font.
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(at('og/og-card.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: at('public/og.jpg'), type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();

console.log('make-assets: images, favicons and share image written to public/');
