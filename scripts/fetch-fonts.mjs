// Downloads the official General Sans woff2 files from Fontshare, unmodified, at build time.
// The ITF Free Font License allows self-hosting but forbids redistribution, and this
// repository is public, so the files are git-ignored and never committed.
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FONT_CSS_URL = 'https://api.fontshare.com/v2/css?f[]=general-sans@400,500,700&display=swap';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

export function parseFontCss(css) {
  const faces = [];
  for (const block of css.match(/@font-face\s*{[^}]*}/g) ?? []) {
    const weight = /font-weight:\s*(\d+)/.exec(block)?.[1];
    const url = /url\(['"]?([^'")]+)['"]?\)\s*format\(['"]woff2['"]\)/.exec(block)?.[1];
    if (weight && url) {
      faces.push({ weight: Number(weight), url: url.startsWith('//') ? `https:${url}` : url });
    }
  }
  if (faces.length === 0) {
    throw new Error('No woff2 @font-face rules found in the Fontshare CSS. Its format may have changed.');
  }
  return faces;
}

export function buildFontFaceCss(faces) {
  return faces
    .map(
      ({ weight }) => `@font-face {
  font-family: 'General Sans';
  src: url('/fonts/general-sans-${weight}.woff2') format('woff2');
  font-weight: ${weight};
  font-style: normal;
  font-display: swap;
}
`,
    )
    .join('\n');
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const fontsDir = path.join(root, 'public/fonts');
  const cssFile = path.join(root, 'src/styles/fonts.generated.css');
  const wanted = [400, 500, 700].map((w) => path.join(fontsDir, `general-sans-${w}.woff2`));

  if (!process.argv.includes('--force') && existsSync(cssFile) && wanted.every((f) => existsSync(f))) {
    console.log('fetch-fonts: General Sans files already present (use --force to refresh).');
    return;
  }

  let cssResponse;
  try {
    cssResponse = await fetch(FONT_CSS_URL, { headers: { 'user-agent': USER_AGENT } });
  } catch (error) {
    throw new Error(
      `Could not reach Fontshare (${error.cause?.code ?? error.message}). The site needs the General Sans files in public/fonts, ` +
        'so connect to the internet and run "npm run fonts" once. The build stops here rather than ship a fallback font.',
    );
  }
  if (!cssResponse.ok) throw new Error(`Fontshare CSS request failed with status ${cssResponse.status}`);
  const faces = parseFontCss(await cssResponse.text());

  await mkdir(fontsDir, { recursive: true });
  await mkdir(path.dirname(cssFile), { recursive: true });
  for (const face of faces) {
    const response = await fetch(face.url);
    if (!response.ok) throw new Error(`Font download failed (${response.status}): ${face.url}`);
    await writeFile(path.join(fontsDir, `general-sans-${face.weight}.woff2`), Buffer.from(await response.arrayBuffer()));
  }
  await writeFile(cssFile, buildFontFaceCss(faces));
  console.log(`fetch-fonts: fetched ${faces.length} General Sans files, unmodified.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`fetch-fonts: ${error.message}`);
    process.exit(1);
  });
}
