# saimanoj.com

Personal home page, built with Astro and hosted on Cloudflare Pages.

- Content: `src/data/site.js`
- Develop: `npm install && npm run dev`
- Build: `npm run build` (downloads the General Sans fonts first; see `scripts/fetch-fonts.mjs`)
- Test: `npm test`, then `npm run build && npm run test:dist && npm run test:e2e`
- Design and plan: `docs/superpowers/specs/2026-10-20-stage-redesign-design.md` and `docs/superpowers/plans/2026-10-20-stage-redesign.md`
- Visual reference: `design/directions/stage/` (the approved prototype)
- Browser tests also run in Firefox and WebKit: `npx playwright install firefox webkit`, then `ALL_BROWSERS=1 npm run test:e2e`

## Analytics

Counts only: no cookies, no storage, no IPs, nothing sent to a third party, and nothing sent at all when the browser says Do Not Track or Global Privacy Control.

- **Traffic:** Cloudflare Web Analytics, switched on in the Pages dashboard (Metrics > Enable). No code.
- **Events:** `src/scripts/analytics.js` sends visits, link clicks, roles read, reaching Connect and theme changes to `functions/e.js`, which writes them to the `EVENTS` Analytics Engine dataset (`wrangler.toml`). The allowed names and labels are in `src/scripts/events.js`.
- **Landing source:** `src/scripts/source.js` uses `?ref=` or `?utm_source=` if present, then the referrer's hostname, then `direct`. Tag the links you control, for example `https://saimanoj.com/?ref=linkedin-profile`, `?ref=resume`, `?ref=email`, since apps often strip the referrer.
- **Read it:** `scripts/stats.sh` (columns for 1, 7 and 30 days; pass other day counts as arguments, e.g. `scripts/stats.sh 3 14`). The account ID and token (Account Analytics: Read) come from `CF_ACCOUNT_ID` / `CF_API_TOKEN`, else from the macOS keychain items `saimanoj-site-cf-account-id` and `saimanoj-site-cf-analytics`; add each once with `security add-generic-password -s <item> -a "$USER" -w`.
