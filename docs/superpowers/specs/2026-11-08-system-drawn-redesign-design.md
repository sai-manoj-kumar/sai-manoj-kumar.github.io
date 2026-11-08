# saimanoj.com: redesign from scratch, "the system, drawn"

Date: 2026-11-08. Status: draft for approval.

## Intent and why

The owner looked at the current site (mint and ink, pinned left half, scrolling right half) and said it "doesn't look
right". They could not name why, so this is a redesign from scratch, not a recolour. Instead of tuning the old
layout, start from what the site is for.

The site should be "a great showcase of their experience". The one thing a visitor should leave believing: **the
owner is a senior engineer who owns systems at scale.** The one fact to show first: **100 million webhook events a
day.** The way to show it: draw the system they own, with events flowing through it and the real numbers at each
stage, then let each role open into its story.

The owner asked for "simple and clean", and said the result must not look like the Claude homepage. They told the
builder not to use the design-taste skill and to start from scratch, so the old layout, palette, photo treatment
and file structure are not a starting point. Content, analytics, SEO and the working rate-limiter demo carry over.

## Goals

1. A first screen that says "I managed the systems that deliver 100M webhook events a day" over a live pipeline
   diagram, and nothing else competing with it.
2. One wide single column on every screen size. No pinned half, no side-by-side stage.
3. Each role is a case study that opens by itself as the reader scrolls to it, and stays open.
4. A simple, clean look: white or neutral near-black, one blue accent, one sans-serif font, almost no decoration.
5. LinkedIn and GitHub live in the top bar and nowhere else in the hero.
6. The rate-limiter demo remains a working, separate piece of the page.
7. Still fully readable with JavaScript off and with reduced motion on.

## Non-goals

- No change to the owner's copy except the new hero sentence and the removal of copy that belongs to removed parts
  (photo credit, old hero line, Connect band).
- No new pages, framework, or analytics service. Keep Astro, static output, Cloudflare Pages and the Pages Function.
- No change to the SEO setup (title, structured data, sitemap, redirects) unless something there names a removed
  part.
- No blog, no project grid, no testimonials.

## Anti-goals (a failure even if it technically works)

- Looks like the Claude homepage: cream or beige background, orange or terracotta accent, serif headlines.
- Looks like the previous mint site, or like an ops console or terminal (the owner was shown dark control-room,
  warm-paper and blueprint moods and chose none of them).
- A role the reader can close, a toggle, a chevron or any control that suggests the roles are collapsible.
- Content jumping under the reader's eyes while they scroll: a role opening must not move what they are reading.
- The pipeline diagram being the only way to learn the 100M, 30% and 25% facts; they also appear as text.
- Contrast below WCAG AA in either theme, or losing the System / Light / Dark switch.
- Putting LinkedIn or GitHub buttons inside the hero block.

## Decided by the owner

- Direction "B, the system, drawn": hero sentence plus live pipeline diagram; roles are case studies.
- The hero sentence: "I managed the systems that deliver 100M webhook events a day."
- The pipeline: Event → Queue → Delivery service ×3 → Customer endpoint, with events flowing and a number at each
  stage. (The owner saw this as a sketch with 30% fewer failed deliveries and 25% lower latency; where each number
  attaches is the builder's call, see below.)
- LinkedIn and GitHub live in the top bar, not in the hero.
- The rate-limiter demo stays as its own piece.
- Single wide column. The left half is not pinned.
- Simple and clean; one accent colour; not like the Claude homepage.
- The photo is dropped.
- Roles open on their own as the reader scrolls to them, and there is no way to close one.

## Decided by me (the owner has not seen these; each is a guess to check)

- **Colour.** True white in light mode and neutral near-black in dark mode, near-black or off-white text, thin grey
  lines, and one blue accent, for example `#2f5bea` light and a lighter blue in dark. The builder may shift the hue
  or lightness to pass contrast but keeps one blue accent and no second hue.
- **Type.** One sans-serif family, headline large, body quiet. `General Sans` is what the site loads today; the
  builder may keep it or choose another sans if it lays out better. No serif anywhere.
- **Top bar.** Name on the left; LinkedIn, GitHub and the theme switch on the right. It stays at the top of the
  screen while scrolling, thin, with no content hidden behind it. (If it covers anything on a phone, it scrolls
  away on phones instead.)
- **Order of the page.** Top bar, hero, roles (newest first), rate limiter, tech stack, About, footer.
- **Connect band removed.** The bottom Connect section is dropped because the buttons are in the top bar. The
  LinkedIn link inside the About closing sentence stays.
- **Roles and visuals.** There are four roles in `src/data/site.js`: LinkedIn Webhooks Platform, Microsoft
  Defender, Microsoft Application Gateway, Microsoft Network Monitoring. Today the first role's visual is the
  rate-limiter demo (`ticketDemo`) and the other three carry the memory, header-rewrite and traceroute diagrams.
  In the new design the LinkedIn role has no inline visual (the hero pipeline is its picture), the three diagrams
  stay inside Defender, Application Gateway and Network Monitoring, and the demo, with its explanatory `note`
  ("a token bucket... five tokens, and a new one every two seconds"), becomes the standalone rate-limiter piece.
- **First role open.** The newest role (LinkedIn Webhooks Platform) begins open on load so a visitor sees what an
  opened role looks like; the rest open as they scroll to them.
- **Phone diagram.** On narrow screens the pipeline turns vertical, top to bottom, with the same stages and
  numbers.
- **Analytics.** Event names keep their allowlist shape in `src/scripts/events.js` and the Pages Function.
  `linkedin:hero` and `github:hero` are replaced by `linkedin:topbar` and `github:topbar`; `linkedin:connect`,
  `github:connect` and `end: connect` go away with the Connect band; `role` events fire once when a role opens,
  using labels for the roles (the old `demo` label now means the rate-limiter piece came into view); `linkedin:about` and `theme` events stay. The builder updates the allowlist, the
  function and `scripts/stats.sh` together.

## Behaviour

**Hero.** The sentence is the page's single `h1`. Below it, the diagram shows the four stages as labelled nodes
joined by lines. Small marks (events) travel from Event to Customer endpoint continuously, passing through the
Queue and splitting across the three delivery services. At the delivery stage show "30% fewer failed deliveries"
and at the endpoint stage "25% lower latency" (my reading of where they attach; the builder confirms against the
role copy before shipping). The same facts are in real text so a screen reader or a reader with motion off gets
them; the diagram itself is described by a short accessible label and is not read node by node.

**Roles.** Each role is a heading, the company and title (no dates, as in the data today), a one-line summary, and its body (what they owned,
numbers, an inline diagram where one exists). While closed a role shows only its heading and one-line summary. It
opens when it reaches the middle of the viewport, with a short smooth expansion, and stays open for the rest of
the visit. Nothing in a role is clickable to close it. The expansion must not move content the reader is looking
at: roles open below the viewport centre, and the page must not shift the reader's position.

**No JavaScript, reduced motion, print.** Every role is open and readable. The diagram shows static events at
rest. Reduced motion stops the flow and the expansion animation.

**Rate limiter.** The existing token-bucket demo (take a ticket, get a 429 when the bucket is empty) keeps its
behaviour and its analytics, restyled to match, placed after the roles.

**Theme.** System / Light / Dark switch stays in the top bar. The choice is remembered as today (`localStorage`
key `theme`, `data-theme` on the root). Dark follows the system by default.

## Constraints

- Static Astro site on Cloudflare Pages; keep the build, the Pages Function and CF Web Analytics custom events.
- `theme-color` metas, `src/scripts/theme.js` colour map, favicon and share card must match the new palette.
- Breakpoints for testing: 320, 375, 390, 860, 861, 1440 px wide, light and dark, with and without JavaScript.
- The existing tests (unit, dist, e2e) pin palette values, the pinned stage, the name shrink, hero buttons and the
  Connect band. They must be rewritten to the new design, not deleted. Add tests for role opening on scroll, no
  close control, no-JavaScript fallback, and the top bar links.
- Keep the Pages build passing; confirm the Pages Function and the Analytics Engine binding still build
  (an earlier build failure on Pages was suspected, never verified).
- Respect `prefers-reduced-motion`. Contrast WCAG AA both themes.

## What is left to the builder

Exact spacing, type sizes and measure of the column; the exact blue; how the pipeline is drawn (SVG or HTML) and
how the flow animation is paced; where each number attaches in the diagram; the scroll trigger mechanism (for
example IntersectionObserver) and its thresholds; labels for the `role` analytics events; the accessible text for
the diagram; footer wording after the photo credit is removed.
