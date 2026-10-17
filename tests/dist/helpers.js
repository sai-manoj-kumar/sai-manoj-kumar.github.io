import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

export const html = readFileSync(new URL('../../dist/index.html', import.meta.url), 'utf8');
export const { document: doc } = parseHTML(html);
