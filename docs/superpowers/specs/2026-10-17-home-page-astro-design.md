# saimanoj.com home page: Astro on Cloudflare Pages

Status: draft for review. Nothing in this document has been built in this repository yet.

## 1. Goal

Replace the current Jekyll home page at saimanoj.com with a new single-page site that shows Sai Manoj's backend
engineering experience to recruiters, hiring managers and developer peers, and sends them to LinkedIn.

Success looks like:

- A visitor knows who Sai is, what he does and what to do next within a few seconds, on a phone or a laptop.
- Every claim on the page comes from `full_experience.md` (the private resume source) or from Sai directly.
- The site is static, fast, cheap to host and easy to edit by changing one data file.
- Moving the domain over is reversible in minutes.

## 2. What exists today

- `sai-manoj-kumar/sai-manoj-kumar.github.io`, a Jekyll site (`jekyll-theme-hacker` starter, Primer CSS), served by
  GitHub Pages from `master`, with a `CNAME` of `saimanoj.com`.
- One placeholder post (`_posts/2019-01-29-hello-world.md`). It is template text and is not carried over.
- The domain and its DNS are in Sai's Cloudflare account.
- The visual design exists as a working prototype outside this repository:
  `/Users/saimanoj/claude_working_dir/home-redesign` (`index.html`, `styles.css`, `app.js`, `assets/`). It is the
  visual source of truth for the build. A separate trial copy with a palette switcher is at
  `/Users/saimanoj/claude_working_dir/home-palettes` and is not part of the build.

## 3. The design (as approved in the prototype)

Concept: the page is a physical object. A card with Sai's name sits over a photograph, then shrinks into a small
"Sai Manoj / Connect" stub that follows the visitor down the page. Sections are stacked folders, a coupon and a
letter. Sai's rate-limiter work is the live element: a ticket counter that lets the visitor take tickets from a
token bucket.

Palette (exactly two colours, with computed tints):

| Token | Value |
|---|---|
| ground (`--bg`) | `#f1d2b6` (apricot) |
| surface | `#ebc6a4` |
| ink and dark panels (`--ink`, `--field`) | `#0c3a40` (teal) |
| muted text | `#3f6468` |
| panel tint | `#1a5058` |
| hero photo tint | `#6a9a9e` |
| hover | `#24626a` |

Type: General Sans (400, 500, 700), fluid size steps, no monospace.

Sections, in order:

1. **Hero card.** "Sai Manoj / Backend / Engineer". Facts: Senior software engineer, India, Java, Python, C#. One
   sentence: "Services on public cloud. Tools for AI agents." Portrait. A "Connect on LinkedIn" button and a GitHub
   profile link. Behind it, one modern photo of a data-centre aisle in greyscale with the teal tint. The card
   carries no photo credit; the credit is in the footer only.
2. **Experience.** Four stacked folders. The tab names the company; the first line of the text names the project;
   the next line is the job title. There are no dates.
   - LinkedIn: Webhooks Platform, Senior Software Engineer. Holds the live ticket demo.
   - Microsoft: Defender, Software Engineer II. A memory before/after diagram (drawn to scale from the 30% figure).
   - Microsoft: Application Gateway, Software Engineer II. An illustrated header rewrite with made-up host names.
   - Microsoft: Network Monitoring, Software Engineer. An illustrated traceroute with made-up timings.
3. **Tech stack.** Four bars, all open: Backend, Cloud, Data, AI agent tooling.
4. **About.** A short letter, "about nine years of backend experience", with a LinkedIn link.
5. **Connect.** A coupon with two links: LinkedIn (primary) and GitHub.
6. **Footer.** Copyright, LinkedIn and GitHub profile addresses, and the photo credit.

Motion: the hero card shrinks to the stub on scroll; parts of each section rise in once; the demo's tokens and
tickets respond to clicks; the diagram bars draw in on reveal. All of it has a `prefers-reduced-motion` fallback,
and the page reads in full with JavaScript off.

### The live demo

A token bucket, written in plain browser JavaScript (no libraries, no server). Capacity 5 tokens; one token returns
every 2 seconds; refill is computed lazily from elapsed time. A request spends one token and shows
"200 Admitted"; with none left it shows "429 Too Many Requests" with a live "Try again in Ns" countdown that
updates until the next token arrives. It is per visitor and resets on reload: an illustration of rate limiting, not
a working limit. Without JavaScript the button is disabled and a sentence explains the demo.

## 4. Content rules

These come from Sai's instructions and the resume source. They apply to every line on the page.

- The name is "Sai Manoj".
- Contact is LinkedIn and GitHub **profile** links only. No email address, no resume download, no links to
  individual GitHub repositories.
- Experience is taken from `full_experience.md`. PhonePe is left out on purpose (it was iOS-only work). Role dates
  are not shown.
- Internal codenames and sensitive details are never published (for example the internal framework names and the
  duration of the rate-limit incident). The 1 billion requests a day (API Gateway) and 100 million events a day
  (three webhook services) figures are never merged.
- Years: "about nine years of backend experience". The 12+ total is never stated.
- The stack lists tools Sai uses: Java, Python, C#, C and C++, Kafka, Microservices and MapReduce, Azure, AWS,
  Cloudflare, GitHub Actions, PostgreSQL, Redis, DynamoDB, and GenAI skills and plugins. No TypeScript, Dart or
  OAuth. The page does not make iOS a focus.
- Illustration text is always labelled as an illustration, with made-up names and numbers.

## 5. Architecture

Astro, static output only (`output: 'static'`). No server code, no adapter, no database.

```
/                      Astro project root (replaces the Jekyll files on the astro branch)
  astro.config.mjs
  package.json
  src/
    pages/index.astro          composes the sections
    components/Hero.astro  Experience.astro  Folder.astro  TechStack.astro  About.astro  Connect.astro  Footer.astro
    components/diagrams/       MemoryBars.astro  HeaderRewrite.astro  Traceroute.astro  TicketDemo.astro
    data/site.js               name, links, facts, roles, stack, about text (the only file Sai edits for content)
    scripts/limiter.js         the token bucket and the 429 countdown
    scripts/motion.js          scroll choreography, reveals, stub visibility
    styles/global.css          the prototype stylesheet, ported unchanged (one file: it changes as a whole)
  public/
    fonts/                     General Sans woff2, fetched at build time and git-ignored (see section 5)
    favicon.svg  og.jpg  portrait.jpg  hero.jpg
  scripts/fetch-fonts.mjs      downloads the official, unmodified General Sans files before the build
  og/og-card.html              source of the share image (rendered once to public/og.jpg)
  design/prototype/            frozen snapshot of the approved prototype (reference only, not built)
  tests/                       unit, built-HTML and browser tests
  docs/superpowers/            this spec and the implementation plan
```

Decisions:

- **Plain JavaScript and CSS.** No TypeScript, no CSS framework. The prototype's CSS and JS are ported nearly as-is,
  split into the files above. Scripts are loaded once on the page, deferred.
- **Content in one data file.** Components take their text from `src/data/site.js`, so a change to a job
  description is one edit, and the rules in section 4 are easy to review in one place.
- **Fonts self-hosted, not committed.** General Sans is licensed under the ITF Free Font License (Fontshare, version
  2.0), which was checked on 2026-10-17. It allows free commercial use and says self-hosting on your own website
  with `@font-face` is permitted, with no attribution required. Two limits apply: the font files may not be
  modified (no subsetting or format conversion), and they may not be redistributed, including through publicly
  accessible servers. This repository is public, so the font files are **not committed**. A prebuild step
  (`scripts/fetch-fonts.mjs`) downloads the official WOFF2 files from Fontshare and writes them to `public/fonts`
  (git-ignored). They are served unchanged from saimanoj.com with `font-display: swap`, so visitors make no
  third-party font request. If the download fails, the build fails loudly. The licence text is re-read when the
  plan is executed, in case the terms changed.
- **Images.** Two photographs only: the hero aisle photo and the portrait. They are resized and served as JPEG with
  width and height attributes. The hero photo is CC BY-SA 4.0 (PiDatacenters, via Wikimedia Commons) and is credited
  in the footer; it is shown tinted in CSS and no altered file is distributed.
- **Head and sharing.** Title, description, canonical URL, Open Graph and Twitter tags, a favicon, and a share image.
  The share image is a name card with a small portrait: 1200 x 630, apricot ground, teal ink, "Sai Manoj" and
  "Senior software engineer" set in General Sans, the small portrait beside the name. It is rendered once from
  `og/og-card.html` to `public/og.jpg` and re-rendered only when the name or title changes. (Images made with the
  font are permitted by the licence.)
- **Accessibility.** Skip link, one `h1`, real headings and landmarks, visible focus, alt text, `aria-live` on the
  demo's ticket list with the countdown excluded from announcements, 4.5:1 text contrast, no horizontal scroll at
  390 px.

## 6. Hosting, preview and cutover

Cloudflare Pages, connected to the GitHub repository (build command `npm run build`, output `dist`).

**Branches.**

- `master` stays the Jekyll site until cutover. Before any change to it, the current commit is tagged
  `jekyll-final`, and a `jekyll-rollback` branch is created at the same commit so GitHub Pages can be pointed back
  at it quickly.
- `astro` is where the work happens.
- The Pages project's **production branch is `release`**, a branch that does not exist until cutover. This keeps
  every `astro` build a preview deployment.

**Private preview.** Preview deployments sit behind a Cloudflare Access policy that admits only Sai's email (a
one-time code). The preview address is not public. Sai reviews the site there on a laptop and a phone.

**Cutover (only after Sai approves the preview):**

1. Fast-forward `release` to the approved `astro` commit; Pages publishes the production deployment.
2. In the Pages project add the custom domains `saimanoj.com` and `www.saimanoj.com`. Because the domain is in the
   same Cloudflare account, Cloudflare updates the DNS records; the old records that point at GitHub Pages are
   replaced.
3. Check HTTPS, the apex and `www` addresses, and the page itself.
4. After a day of watching: turn GitHub Pages off in the repository settings (otherwise GitHub would try to build
   a Jekyll site that no longer exists), merge `astro` into `master`, make `master` the Pages production branch and
   delete `release`. The `jekyll-final` tag and a `jekyll-rollback` branch stay for good.

**Rollback (minutes).** In Cloudflare, remove the custom domains from Pages and restore the GitHub Pages DNS records
(the four GitHub `A` records for the apex and a `CNAME` for `www`); re-enable GitHub Pages from the
`jekyll-rollback` branch. The Jekyll site is never deleted, only retired.

**Old addresses.** The only old page is the 2019 placeholder post, which is dropped. The apex `/` and `/index.html`
continue to work.

## 7. Quality gates

Before the preview is shown and again before cutover:

- `npm run build` succeeds with no warnings.
- The taste-skill lint and the browser inspector at 1440, 768 and 390 px. One failure is expected and accepted: the
  skill requires four pictures and Sai chose to show fewer. Any other failure blocks the release.
- The demo is tested in a real browser: five admissions, then 429 with a correct countdown, and the refill rate.
- Page checked in Chrome, Safari and Firefox, and on a real phone.
- Reduced motion on, and JavaScript off: the page reads in full.
- Lighthouse on mobile: performance, accessibility, best practices and SEO each at 95 or better, as a target.
- Links verified: LinkedIn, GitHub, and the photo credit.
- No font files are tracked by git (`git ls-files | grep -i woff` returns nothing), and the served font files match
  the ones Fontshare provides.
- The share image previews correctly (name card with the small portrait) in a link-preview check.

## 8. Not in scope

A blog or writing section, analytics, a contact form, a CMS, a dark-mode switch, internationalisation, an email
address or resume download (Sai's decision), and any server-side feature.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Cutover breaks the domain | Preview first, `jekyll-final` tag, a written rollback of two DNS steps |
| Font files end up public in the repository | They are git-ignored and fetched at build time; the licence forbids redistributing them |
| Fontshare download unavailable at build time | The build stops with a clear error; fallback is Fontshare's own CSS link, which the licence allows |
| The CC BY-SA photo's share-alike terms | The credit is in the footer and the tint is applied in CSS only; swap for a CC0 photo if preferred |
| Content drifts from the truth | All text lives in `site.js` and is checked against `full_experience.md` and section 4 |
| Page too busy on small phones | Folders become non-sticky and the stub shrinks below 860 px, as in the prototype |

## 10. Decisions settled in review

- Private preview behind Cloudflare Access (no public preview link).
- Fonts: self-hosting is allowed by the licence; the files are fetched at build time and kept out of the public
  repository (section 5).
- Share image: a small portrait with a name card.
- Photo credit: in the footer only.

No open questions remain.
