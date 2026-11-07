# Fresh Look Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give saimanoj.com the "mint and ink" palette, remove the moving name and corner stub, add a Connect link to the top bar, and lay the phone page out words-first.

**Architecture:** Static Astro site, one stylesheet (`src/styles/global.css`). The palette is a swap of the CSS custom properties plus the places that repeat them (theme-color metas, `theme.js`, favicon, share card). The name and stub are deleted outright. The phone reorder is CSS only: at 860px and below `.reader` and `main` become `display: contents` so `.topbar`, `.intro`, `.stage` and the sections are flex siblings ordered with `order`; desktop is untouched.

**Tech Stack:** Astro 7.4, plain CSS, `node --test` (unit and dist tests), Playwright (e2e), sharp (asset script).

**Spec:** `docs/superpowers/specs/2026-11-07-fresh-look-design.md`

## Global Constraints

- Palette (light / dark): bg `#f3faf6` / `#0a1f1a`; surface `#dff1e8` / `#12302a`; ink `#0f2a24` / `#e8f6ef`; muted `#4d6b62` / `#8fb5a8`; accent `#0a7d63` / `#3ee0b0`; accent-ink `#ffffff` / `#06241d`. These already pass the contrast test's thresholds (text pairs ≥ 4.5, graphics ≥ 3). A hex may move a few points only if a check fails; keep the hue family.
- `chip-off`: light `#b4d2c4`, dark `#1f4a40`. `deny`/`deny-ink`: light `#0f2a24`/`#f3faf6`, dark `#e8f6ef`/`#06241d`.
- No changes to copy, sections, the tech stack, About text, analytics events (`src/scripts/events.js`), `functions/e.js`, sitemap, structured data or redirects. The new Connect link has no `data-track`.
- Keep the "System / Light / Dark" switch, the 860/861px breakpoint, `prefers-reduced-motion` handling, and the no-JavaScript fallback.
- No fixed or sticky element on phones (the top bar scrolls with the page and covers nothing). The pinned stage on desktop (861px and up) stays.
- Update tests that mention the name or stub; never delete a test without replacing its intent.
- Commit messages: no `Co-authored-by` line.
- Verify at 320, 375, 390, 860, 861 and 1440px, both themes, with and without JavaScript.

## Review Focus

1. JavaScript off: the top bar Connect link and the h1 work with no script (Task 2).
2. 320px phone and 861px desktop: the fuller top bar (name, Connect, theme switch, section links) wraps instead of overflowing or leaving a control off-screen (Task 2).
3. Switching the theme to Light or Dark updates both `theme-color` metas to the new values, and OS-dark gives the same palette as the Dark switch (Task 1).
4. On phones the visual order (top bar, headline, photo strip, demo) differs from the DOM order (stage first). Keyboard order must stay sane: the only focusable thing in the stage on phones is `#take` (Task 3).
5. Reduced motion: no `anim` class, nothing stays hidden, and no leftover name or stub element exists (Task 2).

---

### Task 1: Mint and ink palette

**Files:**
- Modify: `src/styles/global.css:1-38` (both theme blocks), the `.room` filter rule
- Modify: `src/layouts/Base.astro:33-34`, `src/scripts/theme.js:7`
- Modify: `tests/unit/contrast.test.js`, `tests/dist/theme.test.js:33-34`, `tests/e2e/theme.spec.js:3-4,59,62`

**Interfaces:**
- Produces: the token names are unchanged (`--bg --surface --ink --muted --accent --accent-ink --chip-off --deny --deny-ink`), so later tasks use them as they are. `theme.js` `COLOR = { light: '#f3faf6', dark: '#0a1f1a' }`.

- [ ] **Step 1: Update the tests first.** In `contrast.test.js` change the "palettes match the spec" test to assert `light.bg === '#f3faf6'`, `light.accent === '#0a7d63'`, `dark.bg === '#0a1f1a'`, `dark.accent === '#3ee0b0'`. In `tests/dist/theme.test.js` the theme-color rows become `['light', '#f3faf6', ...]` and `['dark', '#0a1f1a', ...]`. In `tests/e2e/theme.spec.js` set `LIGHT = 'rgb(243, 250, 246)'`, `DARK = 'rgb(10, 31, 26)'`, and the meta expectations to `['#0a1f1a', '#0a1f1a']` and `['#f3faf6', '#0a1f1a']`.
- [ ] **Step 2: Run `npm test`.** Expected: the palette test FAILS (old values).
- [ ] **Step 3: Swap the tokens** in the three places in `global.css` (`:root`, the `prefers-color-scheme: dark` block, `:root[data-theme="dark"]`) using the Global Constraints values, and update the header comment ("Tobacco and olive" becomes "Mint and ink"). Keep the two dark blocks identical (an existing test enforces it).
- [ ] **Step 4: Update the two `theme-color` metas in `Base.astro` and `COLOR` in `theme.js`** to `#f3faf6` and `#0a1f1a`.
- [ ] **Step 5: Tune the photo.** The `.room` rule's `filter: grayscale(1) brightness(0.55) contrast(1.05)` was set for a brown page. Adjust it, or add a tint, so the photo sits well with green and gives a slight pine cast (for example by raising brightness a little and layering a pine colour with `mix-blend-mode` or a gradient overlay on `.stage`). No new image. Check by eye at 1440px in both themes.
- [ ] **Step 6: Run `npm test`.** Expected: all unit tests PASS, including the 4.5:1 and 3:1 checks.
- [ ] **Step 7: Commit** `git add -A src tests && git commit -m "Switch to the mint and ink palette"`.

### Task 2: Remove the moving name and stub; top bar Connect; headline becomes h1

**Files:**
- Delete: `src/components/Name.astro`, `src/components/Stub.astro`
- Modify: `src/pages/index.astro`, `src/components/Intro.astro`, `src/components/TopBar.astro`, `src/styles/global.css`, `src/scripts/motion.js`
- Modify tests: `tests/dist/stage.test.js`, `tests/e2e/motion.spec.js`, `tests/e2e/stage.spec.js` (nav assertion only if it changes)
- Test (new): `tests/e2e/topbar.spec.js`

**Interfaces:**
- Produces: markup `header.topbar` containing, in order, `a.topbar-name[href="#top"]` (text from `site.name`), `nav[aria-label="Sections"]` with three links `#work #stack #about` (Connect leaves the nav), `a.topbar-connect[href="#connect"]` with text "Connect", then the theme `fieldset`. The only `h1` is `.intro .sentence`. Task 3 relies on the `.topbar` and `.intro` class names.

- [ ] **Step 1: Write the failing dist tests** in `tests/dist/stage.test.js`: replace "one h1, and it is the name" with `one h1, and it is the headline sentence` (one `h1`; its text is `Backend systems that run at scale. Tools that make AI agents useful.`; it has class `sentence`; `#name` and `#stub` do not exist; no `.name` element). Replace "the stub points at the connect section" with `the top bar has the name link and a Connect link` (`a.topbar-name[href="#top"]` text "Sai Manoj"; `a.topbar-connect[href="#connect"]`; neither has `data-track`). Update the shell test's nav assertion to `['#work', '#stack', '#about']`.
- [ ] **Step 2: Write the failing e2e tests** in new `tests/e2e/topbar.spec.js`: `the Connect link is visible at 320, 390, 861 and 1440px and nothing in the top bar passes the right edge` (every `.topbar a, .topbar label` box has `right <= innerWidth`); `with JavaScript off the Connect link jumps to the Connect section` (`javaScriptEnabled: false`, click, `#connect` top within the viewport).
- [ ] **Step 3: Rewrite `tests/e2e/motion.spec.js`.** Delete the two name/stub tests and the `state` helper. Keep "sections rise in once as they are scrolled to". In the reduced-motion test assert `html` has no `anim` class, `document.getElementById('name')` and `getElementById('stub')` are `null`, and the four section selectors have opacity `1`.
- [ ] **Step 4: Run `npm run test:dist` after `npm run build`, and `npx playwright test --project=chrome tests/e2e/topbar.spec.js`.** Expected: FAIL.
- [ ] **Step 5: Implement.** Delete `Name.astro` and `Stub.astro` and their imports and uses in `index.astro`. In `Intro.astro` make the sentence `<h1 class="sentence">`. Rework `TopBar.astro` to the markup in Interfaces. In `global.css` remove every `.name`, `.stub`, `.stub-name`, `.stub-act`, `.is-fixed` rule (desktop and the 860px block), style `.topbar-name` (weight 700, no underline) and `.topbar-connect` (small `.btn`-like pill using `--accent`/`--accent-ink`, min-height 44px), let the bar wrap (`flex-wrap` stays), and reduce `.intro`'s `padding-top`/`min-height` to suit a first screen with no name (a calm top margin; tune by eye). On phones remove the `position: absolute` rules from `.topbar` so it flows normally (Task 3 finishes the reorder), and keep `.topbar nav { display: none }`. In `motion.js` delete `nameToStub` and its helpers (`clamp`, `lerp`, `ease`), keep `entrances()` and the `reduce` gate, and fix the file's header comment.
- [ ] **Step 6: Run `npm run build && npm run test:dist && npm test`, then `npx playwright test --project=chrome`.** Expected: all PASS.
- [ ] **Step 7: Commit** `git add -A && git commit -m "Drop the moving name and stub; add a Connect link to the top bar"`.

### Task 3: Phone layout, words first

**Files:**
- Modify: `src/styles/global.css` (the `@media (max-width: 860px)` block and the `.slides`, `.stage`, `.room` rules it overrides)
- Modify: `tests/e2e/stage.spec.js` (the phone-stage test)
- Test (new): `tests/e2e/phone.spec.js`

**Interfaces:**
- Consumes: `.topbar`, `.intro`, `.stage`, `main > section`, `footer.end` from Task 2 and the existing markup.
- Produces: at 860px and below `.split` is a flex column; `.reader` and `main` are `display: contents`; `order`: `.topbar` 1, `.intro` 2, `.stage` 3, `main > section` 4, `footer` 5. Desktop styles do not change.

- [ ] **Step 1: Write the failing tests.** In `tests/e2e/phone.spec.js` (viewport 390x844 unless noted): `the first screen reads top bar, headline, buttons, photo strip, demo` (vertical positions: topbar < `.intro h1` < `.intro .btn` < `.room` < `#dispenser`, each box `top` strictly greater than the previous); `the demo starts on the first screen at 375x667 and at 390x844` (`#dispenser` top < viewport height); `the photo is a short strip` (`.room` height between 100 and 0.3 × viewport height); `nothing is fixed or sticky on a phone` (after wheeling to 1500, no element in `body *` has computed `position` of `fixed` or `sticky`); `the only focusable element in the stage is #take` (query focusable elements inside `.stage`, expect `['take']` by id); `desktop is unchanged at 861px` (`.stage` computed `position` is `sticky`, `.split` is a grid). Replace the old "on a phone the stage is a block at the top that scrolls away" test in `stage.spec.js` with: stage `y` after scrolling 1500 is negative (still true) and is below the `.intro` on the page.
- [ ] **Step 2: Run `npx playwright test --project=chrome tests/e2e/phone.spec.js`.** Expected: FAIL (stage is still first).
- [ ] **Step 3: Implement the phone block.** `.split { display: flex; flex-direction: column; }`; `.reader, main { display: contents; }`; the `order` values in Interfaces; `.stage` becomes `position: relative; height: auto; display: flex; flex-direction: column; background: var(--surface)`; `.room` becomes in-flow (`position: static; height: clamp(120px, 22svh, 200px); width: 100%; object-position: 50% 40%`); `.slides` loses its negative margin and gets padding (`var(--m)`); `.intro { min-height: 0; padding-top: <small> }`; keep `.stage-cap { display: none }`. Tune spacing by eye so the demo's top edge is visible at 667px tall.
- [ ] **Step 4: Run the whole suite:** `npm run build && npm test && npm run test:dist && npx playwright test --project=chrome`. Expected: PASS, including the existing no-horizontal-overflow test at 320x700, 390x844 and 861x700, and the tab-order test in `visitors.spec.js`.
- [ ] **Step 5: Commit** `git add -A && git commit -m "Lay the phone page out words first, photo strip then demo"`.

### Task 4: Favicon and share card in the new colours

**Files:**
- Modify: `public/favicon.svg`, `og/og-card.html`, `scripts/make-assets.mjs`
- Regenerate: `public/favicon-32.png`, `public/apple-touch-icon.png`, `public/og.jpg`, `public/favicon.ico`
- Test: `tests/dist/assets.test.js`

**Interfaces:**
- Produces: `public/favicon.ico` written by `make-assets.mjs` as a single 48x48 PNG-in-ICO (6-byte ICONDIR + 16-byte ICONDIRENTRY + PNG bytes), made from `favicon.svg` with sharp.

- [ ] **Step 1: Write the failing test** in `assets.test.js`: `the favicon and share card use the mint palette` (read `dist/favicon.svg`; it contains `#0f2a24`, `#f3faf6`, `#3ee0b0`; it contains none of `#2b170a`, `#f1ebdc`, `#c79a3e`). `favicon.ico exists and starts with the ICO header bytes 00 00 01 00`.
- [ ] **Step 2: Run `npm run build && npm run test:dist`.** Expected: FAIL.
- [ ] **Step 3: Implement.** In `favicon.svg` light uses fill `#0f2a24` with text `#f3faf6`; dark uses `#3ee0b0` with text `#06241d`. In `og/og-card.html` swap the brown background and text for the dark palette (`#0a1f1a`, `#e8f6ef`, accent `#3ee0b0`) and any other old hex in the file. Add the `.ico` write to `make-assets.mjs`.
- [ ] **Step 4: Run `npm run assets`** (needs Chrome). Then `git status`: commit only the favicon, apple icon, `og.jpg` and `.ico` outputs; if `public/images/*` changed bytes with no visual change, discard them with `git checkout public/images`.
- [ ] **Step 5: Run `npm run build && npm run test:dist`.** Expected: PASS (share image still 1200x630 and under 250 KB).
- [ ] **Step 6: Commit** `git add -A && git commit -m "Redraw the favicon and share card in the mint palette"`.

### Task 5: Full check

**Files:** none (fix anything this finds in the file that owns it).

- [ ] **Step 1: Run everything:** `npm run build && npm test && npm run test:dist && npm run test:e2e`. Expected: all PASS.
- [ ] **Step 2: Look at it.** Serve `dist` with `node scripts/serve-dist.mjs` and screenshot at 320, 375, 390, 860, 861 and 1440px wide, light and dark. Confirm: no moving name, Connect link in the top bar, photo strip then demo on phones, pinned stage on desktop, readable text, no clipped controls.
- [ ] **Step 3: Check JavaScript off** at 390px and 1440px: headline, buttons and Connect link work, diagrams inline on phones, the demo shows its fallback text.
- [ ] **Step 4: Report** what passed, with the screenshots' locations, and anything left over. Do not push; the owner decides.
