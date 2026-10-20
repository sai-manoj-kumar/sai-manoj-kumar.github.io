# saimanoj.com redesign: the split stage

Status: draft for review. The look in this document exists as a working prototype
(`design/directions/stage/`, with `design/directions/shared/`). It is **not built in the Astro source yet**. The only
changes already made in `src/` are three copy edits and the removal of two illustration notes (section 2.4).

## 1. Goal

Replace the visual design of the live Astro site at saimanoj.com with a new identity. The content, the hard content
rules, the token-bucket demo and the quality bar stay. Only the look and the page's staging change.

Success looks like:

- A visitor sees the live rate-limiter demo on the first screen and can keep using it while reading.
- The site reads and works on a phone, with JavaScript off, and with reduced motion.
- Light, dark and system themes all work and none flashes the wrong theme on load.
- Lighthouse mobile is 95 or better in all four categories, as before (97/100/100/100 on the current site).
- Every content rule from `2026-10-17-home-page-astro-design.md` section 4 still holds.

## 2. Decisions settled in review

### 2.1 What was wrong, what stays

- The look and feel was wrong. The **apricot and teal palette** and the **physical-object concept** (folders with tabs,
  the letter, the coupon, the hero card over a photograph) are dropped.
- The **name that shrinks into a "Sai Manoj / Connect" stub** stays. It is the part Sai liked.
- General Sans, the single-page structure and all copy stay. Copy edits are in 2.4.

### 2.2 Direction chosen: the split stage

Twelve directions were dealt across three rounds, and nine prototypes were built and judged in a browser. Sai chose
the **split stage**; the closest alternative was "one motif" (a circle token as the system).

Why the stage: the rate-limiter demo and the role diagrams are what set this portfolio apart, and this is the one
layout where the page's single live thing stays in front of the visitor from top to bottom.

### 2.3 Added by Sai during review

- A **Light / Dark / System theme switch**. This reverses "no dark-mode switch" in the 2026-10-17 spec section 8.
- **Cloudflare preview deployments may be public** (the earlier Cloudflare Access gate is no longer needed).

### 2.4 Copy changes already made

Made in `src/data/site.js` and the diagram components on branch `redesign` (the live site on `master` is untouched):

- Defender: "...cut its memory use by 30% on end-user mobile devices." (was "...to meet product requirements.")
- Defender: "...and mentored junior engineers." (was "...mentored five new hires.")
- Connect link: "Collaborate on GitHub" (was "Find me on GitHub"). The small hero link stays "GitHub".
- The notes "Made-up host names." and "Made-up timings." are removed from the header-rewrite and traceroute diagrams,
  and the two matching assertions are removed from `tests/dist/experience.test.js`. The illustrations stay labelled
  by their titles ("A header rewrite, illustrated", "A traceroute, illustrated"), which the test still checks. The
  memory diagram keeps "Drawn to scale: 30% lower."

Not changed, and now inconsistent with "junior engineers" in the Defender role: the About letter says "mentored new
hires" and Application Gateway says "mentored four new teammates". Sai to decide whether to align them.

## 3. Design

### 3.1 Layout (screens 861px and wider)

A two-column grid, `47% | 1fr`, `align-items: start`.

- **Left, the stage:** `position: sticky; top: 0; height: 100svh`. It holds the aisle photograph (`object-fit: cover`,
  greyscale, `brightness(0.55)`, applied in CSS so no altered file is distributed) and, over it, one *slide* at a time.
- **Right, the reader:** a single column, max measure 46ch, side padding `clamp(28px, 5vw, 72px)`. It holds, in
  order: a top bar (section links and the theme switch), the intro, Experience, Tech stack, About, Connect, footer.
- The first screen is the stage on the left and, on the right, the top bar, a short intro (the hero sentence, the facts
  line, the LinkedIn button and the GitHub link) and the name running along the bottom.
- Below 861px the layout is one column (3.9).

### 3.2 The pinned stage and slide swapping

The stage holds four *slides* stacked in one grid cell. Only the active slide is visible.

| Slide | Content | Shown while reading |
|---|---|---|
| `demo` | The live token-bucket demo and its caption | Before Experience, the LinkedIn role, and after Experience |
| `memory` | Memory before/after bars | Defender |
| `rewrite` | Header rewrite | Application Gateway |
| `trace` | Traceroute | Network Monitoring |

Rules:

- The active role is the **last role whose top has passed the middle of the viewport**, while the Experience section
  straddles that line. Otherwise the active slide is `demo`. No scroll hijacking: this is `position: sticky` plus a
  scroll listener, throttled with `requestAnimationFrame`.
- A swap is a crossfade with a 10px rise, 0.55s, `cubic-bezier(0.2, 0.7, 0.2, 1)`. Inactive slides are
  `visibility: hidden` so they are out of the tab order and the accessibility tree.
- The demo is **one element with one set of ids** (`#dispenser`, `#take`, `#tickets`, `#bucket-label`, `#fallback`).
  Its state survives swaps; returning to it shows the same tickets and tokens.
- The three diagram components are rendered twice from the same Astro components: once in the stage, once inline in
  their role. The `swap` class on `<html>` (added by script on wide screens) hides the inline copies. Without that
  class (phones, no JavaScript) the stage shows only the demo and the diagrams stay inline in their roles.
- Diagram slides are up to 600px wide and the demo 420px. In the stage the header-rewrite rows put the label above
  the value so URLs never break mid-word.

### 3.3 The name and the stub

- The h1 is the name. Its DOM text is **"Sai Manoj"**; the lowercase look is `text-transform: lowercase`. It is set in
  General Sans 500 at `clamp(5rem, 12vw, 12.5rem)`, tracking `-0.045em`, on one line along the bottom of the first
  screen, overlapping the stage edge by about a tenth of the viewport width.
- With JavaScript and no reduced motion, scrolling shrinks the name (translate and scale, `will-change: transform`)
  into a stub at the **bottom-right**, over the first 0.6 of a viewport of scroll. The name is hidden at the end and
  the real stub link (`a#stub`, "Sai Manoj / Connect", `href="#connect"`) fades in.
- The stub steps aside while the Connect section or the footer is on screen. While hidden it is `visibility: hidden`
  and `tabindex="-1"`, so keyboard users never land on an invisible link.
- Without JavaScript or with reduced motion the name just sits in place and the stub is never shown.

### 3.4 Reader sections

- **Intro:** the hero sentence at the lead size, the facts line in the muted ink, the LinkedIn button and the GitHub
  link. Balanced line breaks (`text-wrap: balance`).
- **Experience** (`h2`): four roles, each an `article` with `data-slide`, an `h3` (project name, `clamp(2rem, 1.2rem +
  2.4vw, 3.5rem)`), a muted line "Company, Title", the paragraphs, then either the inline diagram or, for the LinkedIn
  role, the demo note with "The working demo is the panel on the left."
- **Tech stack** (`h2`): four plain groups (group name in the muted ink, then rows with the item at left and its note at
  right). These are no longer `details` elements.
- **About:** a 44px circular portrait, the paragraphs, the closing paragraph with the LinkedIn link marked up as a
  `mark`, and the sign-off (name in italics, role beneath).
- **Connect** (`h2` "Connect with me"): one full-bleed field in the accent colour, running to the right edge of the
  page. It holds the text, a LinkedIn button and the "Collaborate on GitHub" link.
- **Footer:** copyright, the LinkedIn and GitHub profile addresses, and the photo credit for the aisle photograph
  (CC BY-SA 4.0, PiDatacenters, via Wikimedia Commons).

### 3.5 Theme

- Three choices: **System** (default), **Light**, **Dark**. System is plain CSS (`prefers-color-scheme`). Light and
  Dark set `data-theme` on `<html>`.
- The switch is a `fieldset` with a visually hidden legend and three real radio inputs, targets at least 44px high, in
  the top bar. It is hidden without JavaScript (where the page follows the OS).
- **No flash:** a tiny inline script in `<head>` (extending the one that already adds the `js` class in
  `Base.astro`) reads the stored choice and sets `data-theme` before first paint. All `localStorage` access is in
  `try/catch`, because it can throw or return nothing (private windows, blocked storage).
- System follows the OS **live with no script**: the palette comes from the `prefers-color-scheme` media query and the
  `theme-color` metas carry matching `media` attributes, so no change listener is needed. The script only handles the
  two overrides.
- `<meta name="color-scheme" content="light dark">`, and two `theme-color` metas with `media` queries (light `#f1ebdc`,
  dark `#472913`). The script keeps `theme-color` in step when the user overrides the OS.
- Palettes are defined as tokens on `:root`, repeated under `@media (prefers-color-scheme: dark)` guarded by
  `:root:not([data-theme="light"])`, and again under `:root[data-theme="dark"]`. Components hold no literal colours.

### 3.6 Palette (tobacco and olive)

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#f1ebdc` | `#472913` |
| `--surface` | `#e6dcc6` | `#55321a` |
| `--ink` | `#2b170a` | `#e4e0cf` |
| `--muted` | `#6f5a43` | `#c0ad92` |
| `--accent` | `#525e1b` (olive) | `#c79a3e` (ochre) |
| `--accent-ink` | `#f1ebdc` | `#2b170a` |
| `--chip-off` | `#cbbf9f` | `#6e4a2c` |
| `--deny` / `--deny-ink` | `#2b170a` / `#f1ebdc` | `#e4e0cf` / `#2b170a` |

Measured contrast (WCAG ratio):

| Pair | Light | Dark |
|---|---|---|
| ink on bg | 14.36 | 9.95 |
| ink on surface | 12.54 | 8.54 |
| muted on bg | 5.48 | 6.04 |
| muted on surface | 4.79 | 5.19 |
| accent-ink on accent (buttons) | 5.93 | 6.60 |
| accent on bg (button shape, graphics) | 5.93 | 5.09 |
| accent on surface (bars, chips, graphics) | 5.18 | 4.37 |
| empty token on surface | 1.34 | 1.44 |

All text pairs are at least 4.5:1. Graphics are at least 3:1 except the empty token, which is a decorative state: the
text label "N of 5 tokens left" carries the information. The caption over the photograph is white on 55% black (14.35).

### 3.7 Type

General Sans (400, 500, 700), self-hosted and fetched at build time exactly as today (the licence rules in the
2026-10-17 spec section 5 are unchanged). Steps (all `clamp`): small 0.8125-0.875rem, body 1.0625-1.1875rem, lead
1.25-1.625rem, head 2-2.75rem, plus the name and the role titles above. No monospace.

### 3.8 Motion, reduced motion, no JavaScript

- Motion in this design is the name-to-stub move, the slide crossfade, and button and link feedback. **Entrance
  animations for sections are not part of the prototype**; adding them is an open item (section 7).
- With `prefers-reduced-motion: reduce`: no name morph (the name stays, the stub is not shown), slide swaps are
  instant (the prototype does not yet disable the transition, see section 7), no smooth scrolling.
- With JavaScript off: the page reads in full, the demo shows its disabled state and its explanation sentence, the
  stage shows only the demo slide, diagrams are inline, the theme follows the OS and the switch is hidden.

### 3.9 Phones (860px and narrower)

- One column. The stage is a 62svh block at the top (not sticky) holding the demo; the name sits under it at 21vw; the
  reader follows. Section links in the top bar are hidden; the theme switch stays.
- No slide swapping: the diagrams stay inline under each role's text.
- The Connect field runs edge to edge. Diagram rows stack label over value.

### 3.10 Accessibility

Skip link to Experience, one `h1`, three `h2`, real landmarks and visible focus (3px `currentColor`), alt text on every
image, `aria-live="polite"` on the ticket list with the countdown excluded from announcements, `aria-hidden` only on
purely decorative nodes, 44px targets on the switch, no horizontal scroll at 390px. **Open:** the stage comes before
the reader in the DOM, so confirm the tab order and landmark labelling in the build (section 7).

### 3.11 Content rules (unchanged)

All of section 4 of the 2026-10-17 spec stands: the name is "Sai Manoj"; contact is LinkedIn and GitHub **profile**
links only and no email appears anywhere (page, meta tags, structured data, manifest, text files, image metadata); no
resume, no repository links; PhonePe left out; no role dates; "about nine years of backend experience" and never the
12+ figure; the stack list as written (no TypeScript, Dart or OAuth, no iOS focus); the 100 million events a day and
1 billion requests a day figures are never merged; no internal codenames or incident durations; illustration text is
labelled as an illustration.

### 3.12 Assets

- Hero photograph: the existing aisle photograph (`public/images/hero.jpg`, `hero-phone.jpg`). It is shown at a
  large size in the stage, so the build produces a web-sized crop with `scripts/make-assets.mjs` (the prototype scales
  the full 1920px image and shows aliasing in small frames; the stage frame is large, but check it).
- Portrait: `public/images/portrait.jpg`, used only in About. The hero card portrait is gone, so the page has
  **two images** (the aisle photograph and the portrait).
- Share image: re-rendered from `og/og-card.html` with the dark palette (`#472913`, `#e4e0cf`, `#c79a3e`), 1200x630,
  "Sai Manoj" and "Senior software engineer" with the small portrait. No email.
- Favicon: `favicon.svg` with an internal `prefers-color-scheme` rule (light: `#2b170a` ground, `#f1ebdc` letters;
  dark: `#c79a3e` ground, `#2b170a` letters); `favicon-32.png` and `apple-touch-icon.png` static, in the light colours.

## 4. Architecture (Astro)

Static output only, as today. The prototype is the visual reference: `design/directions/stage/` and
`design/directions/shared/` (`base.css`, `theme.js`) stay in the repository, without font files.

| Area | Change |
|---|---|
| `src/styles/global.css` | Rewrite: tokens (3.5, 3.6), stage and reader layout, components. One file, as today. |
| `src/layouts/Base.astro` | Theme script in `<head>`, `color-scheme` and `theme-color` metas, new `<body>` structure. |
| `src/components/` | New: `Stage.astro` (photo and slides), `ThemeSwitch.astro`, `Intro.astro`. Changed: `Experience.astro` (roles, no folders), `TechStack.astro` (plain groups), `About.astro`, `Connect.astro`, `Footer.astro`, `Stub.astro`. Removed: `Folder.astro`, `Hero.astro` (card). The four `diagrams/*` components keep their markup and are rendered in two places. |
| `src/scripts/` | New: `theme.js` (switch and storage), `stage.js` (slide swap). Changed: `motion.js` (name to stub, bottom-right; entrances if added). Unchanged: `bucket.js`, `limiter.js`. |
| `src/pages/index.astro`, `404.astro` | Compose the new components. 404 adopts the tokens and theme; its layout stays simple. |
| `src/data/site.js` | Content stays the single source. Remove `tone` from the roles (no longer used). |
| `public/`, `og/` | Assets as in 3.12. |
| `tests/` | See below. |

**Tests.** Rule tests are kept as they are: `page-rules.test.js` (h1/h2 structure, allow-listed hosts, no email, no
resume, forbidden terms, LinkedIn profile URL), `site-data`, `bucket`, `fetch-fonts`. Tests coupled to the old markup
move to stable hooks: `experience.test.js` (`article.folder`, `.tab`), `closing-sections.test.js` (`.sheet a`,
`#stack details.bar`), `hero.test.js` (`header.hero`, `picture img.room`, the h1 spans), the image count in
`page-rules.test.js` (3 becomes 2), and `tests/e2e/visitors.spec.js` (`.folder .text`). New tests: a dist test for the
theme switch (three radios, head script, both palettes present in the built CSS); Playwright specs for the theme
(Dark sets `data-theme`, it survives a reload with no flash, System follows `emulateMedia`, blocked `localStorage`
does not throw) and for the stage (slides swap as roles are scrolled to, one visible at a time, the demo keeps its
state). **E2E scrolling must use real mouse-wheel input** (`mouse.wheel`), because `window.scrollTo()` ignores
`overflow: hidden` on the body, which hid a page-wide scroll bug during prototyping.

## 5. Hosting, preview and release

Cloudflare Pages is unchanged. Work happens on branch `redesign` (from `master`). Pushing it makes a preview
deployment.

- To make previews public, the Cloudflare Access application covering `*.saimanoj-site.pages.dev` has to be removed or
  loosened in the dashboard. That is a Cloudflare setting, so **Sai makes that change**; the exact steps are prepared
  for them. Verify that preview responses carry `X-Robots-Tag: noindex` (Pages sets it on previews); add it in
  `public/_headers` for non-production hosts if it is missing. Production stays indexable.
- Sai reviews the preview on a laptop and a phone, in both themes.
- **On Sai's explicit yes in chat**, merge `redesign` into `master`; Pages redeploys production. DNS is not touched.
- Rollback: promote the previous deployment in Cloudflare Pages (instant) or `git revert` the merge. The Jekyll
  fallback (`jekyll-rollback`, `jekyll-final`) remains as the deeper fallback.

## 6. Quality gates (before the preview is shown, and again before merge)

- `npm test`, then `npm run build && npm run test:dist && npm run test:e2e`, all green.
- The taste-skill lint and inspector at 1440, 768 and 390px, in light and dark. Expected and accepted: the "four
  pictures" floor (Sai chose to show fewer). Anything else blocks.
- Lighthouse mobile at least 95 in performance, accessibility, best practices and SEO, in light and dark.
- Chrome, Firefox and Safari, and a real phone: sticky stage, name morph, slide swap, theme switch.
- Keyboard-only pass; reduced motion on; JavaScript off; no horizontal scroll at 390px.
- Contrast: every token pair actually used, in both modes (3.6).
- `git ls-files | grep -i woff` returns nothing; the share image previews as a name card; no email address in any
  published file (the existing dist scan).

## 7. Open items carried from the prototype

These are known gaps to close in the build, not decisions:

1. Slide and stub transitions do not yet respect `prefers-reduced-motion`; add the fallback.
2. The name's DOM text must be "Sai Manoj" (the prototype's literal lowercase is a prototype shortcut).
3. Section entrance animations are not in the prototype. The skill's inspector flags a page that barely moves, so add a
   restrained entrance for the parts of each section (transform and opacity only, with a reduced-motion fallback).
4. The reading column's top bar uses negative margins to reach the edge; replace with a cleaner structure.
5. Stage-before-reader DOM order: verify tab order and landmarks; reorder with grid placement if needed.
6. At 768px and below the large name crosses the stage photograph; the inspector warns about this ("pinned over
   picture"). Decide whether to accept it or move the name below the photograph on phones.
7. Cross-browser: only Chrome has been tested. `100svh` and `position: sticky` need Safari 15.4 or newer.
8. Lighthouse has not been measured on the new design.
9. The role titles, the name and the intro lines use more font sizes than the skill's target of about five.
10. The LinkedIn role's note says "The working demo is the panel on the left." That is wrong on phones, where the demo
    block sits above the content. Word it so it is true in both layouts (for example, one version per layout, shown
    by breakpoint).

## 8. Not in scope

New content or pages, a blog, analytics, a contact form, a CMS, a font change, per-page themes, an email address or a
resume download, and any server-side feature.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Two copies of each diagram drift apart | Both are rendered from the same Astro components; a dist test compares the text of each. |
| A page-wide scroll bug from a layout rule | E2E scroll tests use real wheel input (section 4). |
| Wrong theme flashes on load | Inline pre-paint script; storage access in `try/catch`; System is CSS-only. |
| The pinned half crowds a small laptop window | At 861px the stage is 47% wide; check 1024px and 1280px widths in the gates. |
| Public previews get indexed | Verify `noindex` on previews before sharing the link. |
