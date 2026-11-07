# saimanoj.com: fresh look, no moving name, better phone

Date: 2026-11-07. Status: draft for approval.

## Intent and why

The owner finds the brown and olive palette dull and wants something fresher. On a phone, the large name that
runs across the screen as you scroll feels wrong. The site should feel better on a phone in general. This is a
look-and-feel redesign: content, sections, the live rate-limiter demo, the pinned left half on desktop, the
analytics events and the SEO setup all stay.

## Goals

1. New "mint and ink" colour system, light and dark, replacing the tobacco and olive tokens everywhere.
2. Remove the moving name: the big name that sits at the bottom of the first screen and shrinks into a fixed
   corner stub. Remove the stub too.
3. A Connect link in the top bar replaces the stub, on desktop and on phones.
4. A phone layout that puts words first: top bar, headline, facts, buttons, a short photo strip, the demo, then
   the existing sections in the existing order.
5. Keep the desktop split layout: the left half stays pinned with the photo, the demo and the role diagrams while
   the right half scrolls.

## Non-goals

- No changes to copy, experience content, the tech stack, or the About text.
- No new sections, pages, fonts or frameworks.
- No change to the analytics events, the Pages Function, the sitemap, the structured data or the redirects.
- No spacing or naming clean-up beyond what the new look needs. (An earlier audit lists those; they are a
  separate piece of work.)

## Anti-goals (a failure even if it technically works)

- Anything that follows the reader down the screen on a phone: no fixed or sticky element except the top bar's
  normal behaviour, and the top bar must not cover content.
- A palette that looks fresh but fails contrast. Text must keep meeting WCAG AA in both themes.
- Losing the "System / Light / Dark" switch or the no-JavaScript fallback.

## Colour (decided: option A, "Mint and ink")

Values below are the owner-approved direction; the builder may nudge a hex by a few points if a contrast check
requires it, and must keep the hue family.

| Token | Light | Dark |
|---|---|---|
| bg | `#f3faf6` | `#0a1f1a` |
| surface | `#dff1e8` | `#12302a` |
| ink | `#0f2a24` | `#e8f6ef` |
| muted | `#4d6b62` | `#8fb5a8` |
| accent | `#0a7d63` | `#3ee0b0` |
| accent-ink | `#ffffff` | `#06241d` |

`chip-off`, `deny` and `deny-ink` keep their roles and get new values from the same family. The accent is used
where it is today: buttons, diagram bars, highlighted words and the Connect band. The `theme-color` metas and
the colour map in `src/scripts/theme.js` must change to the new `bg` values.

## Layout

**Top bar (all widths).** A small static name on the left that links to the top of the page, then the Connect
link (jumps to the Connect section), then the theme switch. On desktop the section links (Experience, Tech
stack, About) stay beside them. On phones those section links stay hidden as now. Nothing in the bar moves or
changes size on scroll.

**Phone (up to 860px), first screen, top to bottom:** top bar; headline sentence; facts line; the LinkedIn
button and GitHub link; a short photo strip (roughly a quarter of the screen height, cropped to the interesting
part of the existing phone image); the rate-limiter demo. After that: Experience (with each role's diagram inline),
Tech stack, About, Connect, footer, as now.

**Desktop (861px and up):** unchanged structure. Left half pinned with the photo and the four slides that follow
the role being read; right half scrolls. The big name is gone, so the first screen of the right half is the top
bar, headline, facts and buttons with the space the name used to fill left open.

**Photo:** keep the existing photo. It is currently greyscale and darkened; the builder should tune that
treatment so it sits well with green (a slight pine tint is welcome) without needing a new image.

## Decisions I made (the owner has not seen these)

- The page needs one `h1`. The headline sentence becomes the `h1`; the small name in the top bar is a link, not
  a heading. The `<title>`, structured data and share text are unchanged.
- The top bar name uses the same name text as the site data ("Sai Manoj"), not lowercase-only styling.
- The photo strip on phones is decorative (`alt` stays as today).

## Constraints

- Static Astro site on Cloudflare Pages; keep it static, keep the existing build.
- Tests that assert the name or stub (`tests/dist/stage.test.js`, `tests/dist/head.test.js`,
  `tests/e2e/motion.spec.js`, `tests/e2e/stage.spec.js`, `tests/unit/contrast.test.js`) must be updated to match
  the new design, not deleted; the contrast test should cover the new tokens.
- `src/scripts/motion.js` has the name-shrink logic: remove it, keep the entrance animations.
- Respect `prefers-reduced-motion`.
- Check the result at 375px, 390px, 860px, 861px and 1440px wide, in both themes, with and without JavaScript.

## What is left to the builder

Exact spacing and type sizes, the crop of the photo strip, the exact hover and focus styles for the Connect link,
and wording of the accessible labels. Follow the existing tokens and conventions in `src/styles/global.css`.
