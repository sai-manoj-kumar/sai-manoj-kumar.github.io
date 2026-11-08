# Redesign "the system, drawn": Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the pinned-stage mint site with one wide column: a hero sentence over a live webhook-pipeline diagram, roles that open by themselves as you scroll, a separate rate-limiter demo, and a plain white/near-black look with one blue accent.

**Architecture:** Astro static page, plain CSS tokens in `src/styles/global.css`, no new dependencies. The pipeline is HTML/CSS with a CSS-only animation. Roles are server-rendered open; a small script closes them visually (only when motion is allowed) and re-opens each one as it passes the middle of the screen, never closing it again. Analytics keep the allow-list shape in `src/scripts/events.js`.

**Tech Stack:** Astro 7.4, plain CSS, vanilla JS modules, Cloudflare Pages + `functions/e.js`, `node --test` (unit, dist), Playwright (e2e, Chrome).

**Spec:** `docs/superpowers/specs/2026-11-08-system-drawn-redesign-design.md`

## Global Constraints

- Keep Astro 7.4 static output, the Pages Function `functions/e.js`, `wrangler.toml`, `public/_headers`, `public/robots.txt`, `public/sitemap.xml`, title, description, share text and structured data (minus its `image` field).
- One `h1` (the hero sentence). Top bar name is a link, not a heading.
- Theme: System / Light / Dark switch kept; `data-theme` on `<html>`, `localStorage` key `theme`; the head script in `src/layouts/Base.astro` still applies a stored choice before first paint.
- Palette (spec guess, builder may nudge hue/lightness to pass contrast, one blue accent, no second hue): light bg `#ffffff`, surface `#f4f5f7`, ink `#14161a`, muted `#5a6070`, line `#e3e5ea`, accent `#2f5bea`, accent-ink `#ffffff`; dark bg `#0e0f12`, surface `#181a1f`, ink `#ecedf0`, muted `#9aa0ad`, line `#2a2d34`, accent `#7b9bff`, accent-ink `#0e0f12`. `chip-off`, `deny`, `deny-ink` stay as tokens for the demo, in the same neutral family. No cream, beige, orange, terracotta or serif anywhere.
- Font: keep General Sans (already loaded and preloaded). No serif.
- Text contrast at least 4.5:1 and graphics at least 3:1 in both themes (`tests/unit/contrast.test.js`).
- Breakpoint stays 860/861px. Check 320, 375, 390, 860, 861, 1440 px, light and dark, with and without JavaScript.
- Respect `prefers-reduced-motion`: no flow animation, no role animation, every role open.
- Roles show no dates (enforced by `tests/unit/site-data.test.js`); this overrides the spec's "company and dates".
- Top bar ruling: sticky on 861px and wider, ordinary (scrolls away) on phones, so it never covers content on a phone. Roles use `scroll-margin-top` so anchor jumps are not hidden under it.
- Commit messages: no Co-authored-by line; end every commit message with `Claude-Session: https://claude.ai/code/session_013n9drw2Exs2GMj9xuw6S2Z`. Use shell commands, not python. Work on branch `redesign-from-scratch`.
- Do not use the design-taste-frontend skill (owner instruction).

## Review Focus

- A reload or anchor jump lands mid-page: every role above the screen's middle must already be open, not stuck closed (position check, not an edge-crossing observer).
- A closed role's text stays in the accessibility tree and find-in-page (clip it with `grid-template-rows: 0fr` + `overflow: hidden`; never `display:none` or `visibility:hidden`), because screen-reader users do not scroll the way sighted users do.
- Tall screens: at 1440x900 and 1920x1200 the last role can still reach the middle line and open (page must stay scrollable far enough).
- 320px phone: top bar (name, LinkedIn, GitHub, theme switch) fits or wraps without sideways scroll, and the vertical pipeline fits.
- With JavaScript off or reduced motion: all four roles are open and the pipeline shows static events; with them on, no role has any close control and clicking a role heading does nothing.

---

## File Structure

- `src/styles/global.css`: tokens (Task 1), then layout, top bar, hero/pipeline, roles, demo, sections (Tasks 3-5). Rewritten section by section; leftovers from the old stage/phone layout are deleted as each task removes their markup.
- `src/data/site.js`: content. `src/data/slides.js`: deleted.
- `src/components/`: `TopBar.astro` (rewrite), `Hero.astro` (new, replaces `Intro.astro`), `Pipeline.astro` (new), `Experience.astro` (rewrite), `RateLimiter.astro` (new), `TechStack.astro`, `About.astro`, `Footer.astro` (edit); deleted: `Stage.astro`, `Intro.astro`, `Connect.astro`.
- `src/scripts/`: `reveal.js` (new, replaces `motion.js` and `stage.js`), `analytics.js`, `events.js` (edit), `theme.js` (colour map).
- Photos: `public/images/*` deleted; `design/prototype/assets/*` untouched.

---

### Task 1: Palette, type tokens and brand assets

**Files:**
- Modify: `src/styles/global.css` (the three token blocks at the top; add `--line`), `src/scripts/theme.js` (`COLOR`), `src/layouts/Base.astro` (two `theme-color` metas, `og:image:alt`), `public/favicon.svg`, `og/og-card.html`
- Test: `tests/unit/contrast.test.js`, `tests/dist/theme.test.js`, `tests/dist/assets.test.js`, `tests/e2e/theme.spec.js`

**Interfaces:**
- Produces: CSS custom properties `--bg --surface --ink --muted --line --accent --accent-ink --chip-off --deny --deny-ink` for light, dark-by-media and dark-by-switch (identical values in the last two). Every later task uses only these tokens, no literal colours.

- [ ] **Step 1: Update `tests/unit/contrast.test.js`.** In "the palettes match the spec" assert the new `bg` and `accent` for light and dark from Global Constraints; add `line` to the parsed tokens and assert it differs from `bg`; keep the text and graphics ratio loops (add `['muted','surface']` stays) and the media-versus-switch equality test. Run `npm test`; expect the palette test to FAIL.
- [ ] **Step 2: Replace the token values** in the three blocks of `global.css` with the Global Constraints palette and add `--line`. Remove the old mint comment. Run `npm test`; expect PASS. If a ratio fails, nudge lightness only and keep the test's thresholds.
- [ ] **Step 3: Colour map and metas.** `COLOR` in `theme.js` and both `theme-color` metas in `Base.astro` become the new light/dark `bg`. Change `og:image:alt` to `Sai Manoj, senior software engineer`.
- [ ] **Step 4: Favicon and share card.** `favicon.svg`: light = ink `#14161a` square with `#ffffff` "SM"; dark media query = `#7b9bff` square with `#0e0f12` text. `og/og-card.html`: no portrait; dark `#0e0f12` ground, `Sai Manoj` large, `Senior software engineer` beneath, a thin `#7b9bff` rule. Run `npm run assets` to regenerate `public/og.jpg`, favicons and the `.ico`. (It also regenerates the photos; they are deleted in Task 3.)
- [ ] **Step 5: Update the asset and theme tests to the new values.** `assets.test.js`: favicon includes `#14161a`, `#ffffff`, `#7b9bff` and none of the mint/apricot hexes; the share image is still dark on average. `theme.test.js` / `theme.spec.js`: swap any mint hex for the new `bg` values (read them to see which assertions pin the old hexes). Remove the "stage photo" and "phone crop" tests from `assets.test.js` now (the photos go in Task 3).
- [ ] **Step 6: Run `npm test && npm run build && npm run test:dist`;** expect all PASS apart from tests Task 3 will rewrite (`stage.test.js`). Commit: `Switch to a white and ink palette with one blue accent`.

---

### Task 2: Content data and the analytics contract

**Files:**
- Modify: `src/data/site.js`, `src/scripts/events.js`, `tests/unit/site-data.test.js`, `tests/unit/analytics.test.js`, `tests/unit/events-endpoint.test.js`, `scripts/stats.sh`
- Delete: `src/data/slides.js`, `tests/unit/slides.test.js`

**Interfaces:**
- Produces in `site.js`:
  - `site.hero = { sentence: 'I own the systems that deliver 100M webhook events a day.', figure: '100M', pipelineLabel: 'How a webhook event is delivered', stages: [{ id, label, fact? }, ...] }` with stages, in order: `event` "Event"; `queue` "Queue"; `delivery` "Delivery service ×3" with fact "30% fewer failed deliveries"; `endpoint` "Customer endpoint" with fact "25% lower latency".
  - Each `site.experience[i]` gains `slug` (`'webhooks' | 'memory' | 'rewrite' | 'trace'`), `summary` (one line), and `visual` becomes `'memory' | 'rewrite' | 'trace' | null` (null for the LinkedIn role). Summaries (my copy, owner may edit): webhooks "Owner of three webhook delivery services that carry about 100 million events a day."; memory "Cut a mobile security app's memory use by 30%."; rewrite "Led Header Rewrite on a web traffic load balancer."; trace "Wrote the agent that checks network paths and connectivity."
  - `site.limiter = { heading: 'Rate limiter', note: <the existing LinkedIn role note text> }`.
  - Removed: `hero.facts`, `hero.cta`, `hero.githubLabel`, `hero.photoAlt`, `hero.portraitAlt`, `connect`, `photoCredit`, each role's `note`.
- Produces in `events.js`: `EVENT_LABELS = { visit: ['page'], link: ['linkedin:topbar','github:topbar','linkedin:about'], role: ['webhooks','memory','rewrite','trace','demo'], theme: ['system','light','dark'] }` (the `end` event is removed). `role:demo` now means the rate-limiter piece came into view.

- [ ] **Step 1: Write failing tests.** `site-data.test.js`: experience roles carry `slug` in the order `webhooks, memory, rewrite, trace`, `summary` present, `visual` in `[null,'memory','rewrite','trace']`; `hero.sentence` equals the sentence above and contains `hero.figure`; `hero.stages.map(s=>s.id)` equals `event,queue,delivery,endpoint`; facts attach to `delivery` and `endpoint` only; no `connect` or `photoCredit` keys; the "traffic figures are never merged" test still passes with the summaries. `analytics.test.js`: every label in the new `EVENT_LABELS` parses; `{e:'end',l:'connect'}`, `{e:'link',l:'linkedin:hero'}` and `{e:'role',l:'bogus'}` are rejected. Run `npm test`; expect FAIL.
- [ ] **Step 2: Edit `site.js` and `events.js`** to the interfaces above; delete `slides.js` and its test. Update `events-endpoint.test.js` if it names a removed label.
- [ ] **Step 3: Update `scripts/stats.sh`** so any label or event it lists matches the new allow-list (read it first; keep its keychain usage untouched).
- [ ] **Step 4: Run `npm test`;** expect PASS (the build and dist tests are expected to fail until Task 3; do not run them yet). Commit: `Rewrite the content data and analytics labels for the new page`.

---

### Task 3: Page shell, top bar and the pipeline hero

**Files:**
- Create: `src/components/Hero.astro`, `src/components/Pipeline.astro`
- Rewrite: `src/pages/index.astro`, `src/components/TopBar.astro`, `src/components/Footer.astro`, `src/styles/global.css` (everything below the token blocks)
- Modify: `src/layouts/Base.astro` (drop the `swap` logic and the portrait structured-data `image`; add the `reveal` class rule from Task 4's step 2), `src/pages/404.astro` (only if its classes change)
- Delete: `src/components/Stage.astro`, `Intro.astro`, `Connect.astro`, `src/scripts/stage.js`, `src/scripts/motion.js`, `public/images/` (all three jpgs), the photo steps in `scripts/make-assets.mjs`, and the photo `<img>` uses in `About.astro`
- Test: delete `tests/dist/stage.test.js`, `tests/e2e/stage.spec.js`, `tests/e2e/phone.spec.js`, `tests/e2e/topbar.spec.js`; create `tests/dist/page.test.js`, `tests/e2e/layout.spec.js`; edit `tests/dist/head.test.js`, `tests/dist/closing-sections.test.js`, `tests/dist/page-rules.test.js`, `tests/dist/analytics.test.js`, `tests/e2e/focus.spec.js`, `tests/e2e/motion.spec.js`, `tests/e2e/visitors.spec.js`

**Interfaces:**
- Consumes: `site.hero`, `site.links`, `site.name` (Task 2).
- Produces: page order inside `<main>`: `<Hero/>`, `<Experience/>`, `<RateLimiter/>`, `<TechStack/>`, `<About/>` (Tasks 4-5 fill the last four; until then keep the existing components in that order). Markup contract used by tests and later tasks:
  - `header.topbar` containing `a.topbar-name[href="#top"]`, `a.topbar-link[data-track="linkedin:topbar"]`, `a.topbar-link[data-track="github:topbar"]` (each with the existing `Icon` and a text label "LinkedIn" / "GitHub"), and the theme switch.
  - `section.hero` with the only `h1` (figure wrapped in `<span class="figure">`), then `ol.pipeline[aria-label]` with one `li[data-stage="event|queue|delivery|endpoint"]` per stage; a stage's fact is real text inside its `li`; moving events are `span.dot[aria-hidden="true"]` inside `ol.pipeline` (decorative).
  - `body` begins with the skip link to `#work`; `div#top` wraps the page; no `.split`, `.stage`, `.reader`.

- [ ] **Step 1: Write failing tests.** `tests/dist/page.test.js` (using `helpers.js`): exactly one `h1` whose text equals `site.hero.sentence`; `.topbar` has the name link and exactly two profile links tagged `linkedin:topbar` and `github:topbar` pointing at `site.links`; `.hero` contains no `a` or `button`; `ol.pipeline` has four `li[data-stage]` in order, the delivery `li` text contains "30% fewer failed deliveries" and the endpoint `li` contains "25% lower latency"; no element with class `stage`, `split`, `reader`, `connect` and no `img` anywhere on the page; footer has the copyright and both profile links and no "Photo:" credit. `tests/e2e/layout.spec.js`: at 320, 375, 390, 860, 861, 1440 px nothing scrolls sideways (`scrollWidth <= innerWidth`) in light and dark; the top bar is `position: sticky` at 861 and 1440 and `static` at 860 and below; the pipeline is laid out horizontally at 1440 (stage `li`s share a `top` within 4px) and vertically at 390 (each `li` below the previous). Run the dist/e2e tests; expect FAIL.
- [ ] **Step 2: Rewrite `index.astro`, `TopBar.astro`, `Footer.astro`; create `Hero.astro` and `Pipeline.astro`** to the markup contract. Footer: copyright, year and the two profile links only.
- [ ] **Step 3: Rewrite `global.css` below the tokens.** One centred column: `max-width` about 46rem for text, the pipeline allowed to run wider (about 64rem); thin `--line` rules between sections, no boxes or shadows. Hero: `h1` at `--step-head` or larger, `.figure` in `--accent`. Pipeline: nodes as plain bordered labels, connecting lines in `--line`, `.dot` elements (small `--accent` squares) animated along the line with a CSS keyframe (staggered delays, delivery stage shows three lanes); facts in `--accent` text under their node. Below 861px the pipeline switches to a vertical stack with the same animation on the vertical axis. `@media (prefers-reduced-motion: reduce)` stops the animation and parks the dots at rest. Port forward unchanged: `.btn`, `.theme` switch rules, `.skip`, the 404 `.lost` rules, focus rings. Delete every `.split/.stage/.slide/.room/.reader/.connect/.intro/.only-*` rule and the phone media block that reorders the DOM.
- [ ] **Step 4: Delete the removed components, scripts and photo files;** remove the `portrait` use in `About.astro` and the `image` field in `Base.astro` structured data; in `Base.astro` remove the `swap` class logic. Remove `hero-*`/portrait steps from `scripts/make-assets.mjs`.
- [ ] **Step 5: Fix the tests that named removed parts.** `head.test.js`: the structured-data `image` assertion goes, the skip link still comes first. `closing-sections.test.js`: drop the connect and photo-credit assertions, keep tech stack, about and footer. `page-rules.test.js`: h1/h2 counts follow the new page (h2: Experience, rate limiter, Tech stack once Tasks 4-5 land; assert `h1` count only for now and revisit in Task 5), "every image has alt" passes vacuously, keep allow-listed hosts. `dist/analytics.test.js`: tracked labels are exactly `linkedin:topbar`, `github:topbar`, `linkedin:about`. `focus.spec.js`: targets become the top bar LinkedIn link, `#take`, and the selected theme option. `motion.spec.js` / `visitors.spec.js`: remove name/stub/entrance assertions that refer to deleted parts; keep the reduced-motion, 320px and keyboard checks, retargeted to the new page.
- [ ] **Step 6: Run `npm test && npm run build && npm run test:dist && npx playwright test --project=chrome`;** expect PASS. Commit: `Rebuild the page shell as one column with the pipeline hero`.

---

### Task 4: Roles that open as you scroll

**Files:**
- Rewrite: `src/components/Experience.astro`
- Create: `src/scripts/reveal.js`
- Modify: `src/layouts/Base.astro` (head script adds `reveal` class), `src/scripts/analytics.js`, `src/styles/global.css` (roles section)
- Test: create `tests/dist/experience.test.js` (rewrite), `tests/e2e/roles.spec.js`; edit `tests/e2e/analytics.spec.js`, `tests/e2e/helpers.js`

**Interfaces:**
- Consumes: `site.experience[].{slug,project,company,title,summary,paragraphs,visual}` (Task 2); diagrams in `src/components/diagrams/{MemoryBars,HeaderRewrite,Traceroute}.astro`.
- Produces: markup `section#work` (`h2` "Experience") > `article.role[data-role="<slug>"]` > `.role-head` (`h3`, `p.who` "Company, Title", `p.summary`) and `.role-body` > `.role-inner` (paragraphs, then the diagram for memory/rewrite/trace). The first role is rendered with class `open`. `reveal.js` adds `open` to each role whose top has passed the middle of the screen, never removes it, and dispatches `document.dispatchEvent(new CustomEvent('role-open', { detail: slug }))` once per role. Head script sets `html.reveal` before first paint only when `prefers-reduced-motion` is not `reduce`.
- Helper: `roleTops(page)` in `tests/e2e/helpers.js` keeps its signature (reads `.role`).

- [ ] **Step 1: Write failing tests.** `experience.test.js` (dist): four `article.role` in order webhooks, memory, rewrite, trace; each has `.role-head` and `.role-body` with its paragraphs; diagrams appear exactly once each, inside memory/rewrite/trace only, none in webhooks; the first role has class `open`; there is no `button`, `summary`, `details`, `[aria-expanded]` or `[role=button]` inside `#work`. `roles.spec.js` (e2e, 1440x900): on load only the first role's body is visible-sized (height > 0) and the other three bodies have height 0 but their text is still in the DOM and in `innerText`-via-`textContent`; wheel to each role in turn (`wheelToY(page, top - 300)`) and assert it gains `open` when its heading passes the middle, and body height > 0; scroll back to top and assert all earlier roles are still open; clicking a role heading changes nothing; reload with `scrollY` set to mid-page (`page.evaluate(()=>scrollTo(0, document.querySelector('[data-role=rewrite]').offsetTop))` then `page.reload()`) and assert every role above the middle is open; at 1920x1200 the last role opens by wheel scrolling to the bottom. Reduced motion (`test.use({reducedMotion:'reduce'})`) and JavaScript off: all four bodies have height > 0 with no animation. Run; expect FAIL.
- [ ] **Step 2: Write `Experience.astro` and the roles CSS.** Closed state applies only under `html.reveal`: `.role-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.5s var(--ease) }`, `.role-inner { overflow: hidden; min-height: 0 }`, `.role.open .role-body { grid-template-rows: 1fr }`. Never use `display:none`/`visibility:hidden` on a closed body. No cursor, chevron, hover or focus style on `.role-head` (it must not look clickable). Roles separated by a `--line` rule; `scroll-margin-top` equal to the sticky top bar height at 861px and wider.
- [ ] **Step 3: Write `reveal.js`:** on load and on `scroll`/`resize` (rAF-throttled, passive), open every `.role:not(.open)` whose `getBoundingClientRect().top <= innerHeight * 0.5`, dispatch `role-open` for each newly opened role (including the one rendered open, once, when its top is already above the middle or on first run). Import it from `index.astro`'s script block beside `analytics.js`. It runs and fires events even when `reveal` is off.
- [ ] **Step 4: Head script.** In `Base.astro`'s inline script add `if (!matchMedia('(prefers-reduced-motion: reduce)').matches) root.classList.add('reveal')`, before first paint, so there is no open-then-close flash.
- [ ] **Step 5: Analytics.** In `analytics.js`: replace the old `.role[data-slide]` observer with `document.addEventListener('role-open', e => send('role', e.detail, true))`; remove the `connect` end observer. Update `tests/e2e/analytics.spec.js` "reading down to a role reports it once" to wheel to the second role and expect `role:memory` once, and add: the first-load beacons include `role:webhooks` after a short scroll.
- [ ] **Step 6: Run `npm run build && npm run test:dist && npx playwright test --project=chrome`;** expect PASS. Commit: `Open each role on its own as it scrolls into view`.

---

### Task 5: Rate limiter piece, tech stack and About

**Files:**
- Create: `src/components/RateLimiter.astro`
- Modify: `src/pages/index.astro` (order), `src/components/TechStack.astro`, `src/components/About.astro`, `src/components/diagrams/TicketDemo.astro` (keep ids), `src/styles/global.css`, `src/scripts/analytics.js`
- Test: `tests/e2e/demo.spec.js`, `tests/dist/page-rules.test.js`, `tests/dist/closing-sections.test.js`, `tests/dist/experience.test.js`, `tests/e2e/analytics.spec.js`

**Interfaces:**
- Consumes: `site.limiter` (Task 2), `TicketDemo.astro` and `limiter.js` (unchanged ids: `#dispenser`, `#take`, `#tickets`, `#bucket-label`, `#fallback`, `.chip`).
- Produces: `section#limiter[data-role="demo"]` with `h2` = `site.limiter.heading`, the note paragraph, then `<TicketDemo />`. Page order: Hero, Experience, RateLimiter, TechStack, About.

- [ ] **Step 1: Write failing tests.** `page-rules.test.js`: `h2` texts are exactly `Experience`, `Rate limiter`, `Tech stack` (About keeps its aria-label); `#limiter` exists once, contains `#take`, comes after `#work` and before `#stack`; no `.stage`. `demo.spec.js`: keep the five-then-429-then-refill and thirty-rapid-clicks tests unchanged (they must pass unmodified against the new section); add that at 390px the demo is not pinned or sticky and `#take` is reachable by Tab after the last role. `analytics.spec.js`: scrolling `#limiter` to the middle reports `role:demo` once. Run; expect FAIL on the new assertions.
- [ ] **Step 2: Create `RateLimiter.astro`;** place it after `Experience` in `index.astro`. In `analytics.js` add an `IntersectionObserver` (`rootMargin: '-50% 0px -50% 0px'`) on `#limiter` sending `role:demo` once.
- [ ] **Step 3: Restyle the demo, stack and About** with the page tokens: demo panel on `--surface`, chips in `--accent`, denied tickets in `--deny`; stack as plain rows divided by `--line`; About as a text column with the closing LinkedIn link underlined in `--accent` (drop the `mark` highlight and the `.sign` italic if it reads as serif; keep the name and role as plain sans). Remove the leftover `.mini`, `.connect`, `.rv` and `.only-*` CSS.
- [ ] **Step 4: Run the full suite** (`npm test && npm run build && npm run test:dist && npx playwright test --project=chrome`); expect PASS. Commit: `Give the rate limiter its own section and restyle the closing sections`.

---

### Task 6: Whole-page verification

**Files:**
- Modify: whatever the checks find; `README`/docs only if they mention removed parts (`grep -rn "stage\|pinned\|mint" --include=*.md .` outside `docs/superpowers`).
- Test: `tests/e2e/visitors.spec.js`

- [ ] **Step 1: Run `npm test`, `npm run build`, `npm run test:dist`, `npx playwright test --project=chrome`;** all must pass with no skipped tests added.
- [ ] **Step 2: Screenshot** the built page (`node scripts/serve-dist.mjs 4321`, Playwright or Chrome DevTools) at 320, 390, 861, 1440 px in light and dark, and with JavaScript off at 390; save under the scratchpad, look at each one and fix anything that crowds, overflows, shows a stray old colour, or looks like cream/orange/serif.
- [ ] **Step 3: Confirm by grep** that no mint hex, no `Connect`, `stage`, `slide`, `photoCredit`, `hero-stage`, `portrait` or `swap` remains in `src/`, `tests/`, `functions/`, `scripts/`, `public/`: `grep -rniE "0a7d63|3ee0b0|f3faf6|photoCredit|hero-stage|portrait|\.stage|swap" src tests functions scripts public`.
- [ ] **Step 4: Confirm the Function still builds:** `functions/e.js` imports `../src/scripts/events.js`; `npm test` includes `events-endpoint.test.js`. Note in the final report that the Cloudflare Pages deploy of this branch is the real check and must be looked at after the pull request is up.
- [ ] **Step 5: Commit any fixes:** `Polish the redesign after a full check`. Then stop; do not merge. Hand over to superpowers:finishing-a-development-branch.
