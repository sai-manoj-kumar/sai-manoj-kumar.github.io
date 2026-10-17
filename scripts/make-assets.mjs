// One-off asset generation: web-sized images, favicons and the share image.
// Run with `npm run assets` after changing the sources; outputs are committed.
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const at = (...p) => path.join(root, ...p);

// Re-encode from the frozen prototype sources so repeated runs never degrade quality.
await sharp(at('design/prototype/assets/datacenter.jpg'))
  .resize({ width: 1920, withoutEnlargement: true })
  .jpeg({ quality: 68, mozjpeg: true })
  .toFile(at('public/images/hero.jpg'));

await sharp(at('design/prototype/assets/portrait.jpg'))
  .resize(800, 800, { fit: 'cover' })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(at('public/images/portrait.jpg'));

await sharp(at('public/favicon.svg'), { density: 300 }).resize(32, 32).png().toFile(at('public/favicon-32.png'));
await sharp(at('public/favicon.svg'), { density: 300 }).resize(180, 180).png().toFile(at('public/apple-touch-icon.png'));

// The share image: render og/og-card.html with the real font.
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(at('og/og-card.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: at('public/og.jpg'), type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();

console.log('make-assets: images, favicons and share image written to public/');
