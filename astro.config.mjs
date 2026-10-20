import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://saimanoj.com',
  output: 'static',
  // Inline the stylesheet: a linked one can arrive after Safari and Firefox have first styled the body, and the
  // pinned-stage slides then play their hide transition on load (a visible flash of all four slides).
  build: { inlineStylesheets: 'always' },
});
