# saimanoj.com

Personal home page, built with Astro and hosted on Cloudflare Pages.

- Content: `src/data/site.js`
- Develop: `npm install && npm run dev`
- Build: `npm run build` (downloads the General Sans fonts first; see `scripts/fetch-fonts.mjs`)
- Test: `npm test`, then `npm run build && npm run test:dist && npm run test:e2e`
- Design and plan: `docs/superpowers/specs/2026-10-20-stage-redesign-design.md` and `docs/superpowers/plans/2026-10-20-stage-redesign.md`
- Visual reference: `design/directions/stage/` (the approved prototype)
- Browser tests also run in Firefox and WebKit: `npx playwright install firefox webkit`, then `ALL_BROWSERS=1 npm run test:e2e`
