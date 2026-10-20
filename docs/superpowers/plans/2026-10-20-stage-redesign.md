# saimanoj.com split-stage redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the visual design of the live Astro site with the approved "split stage": a pinned left half that shows the live rate-limiter demo and swaps to each role's diagram, a scrolling reading column, a name that shrinks into a stub, and a Light / Dark / System theme.

**Architecture:** Same static Astro site and the same content file (`src/data/site.js`). The markup and `global.css` are rewritten around two columns. The four diagram components are rendered twice (pinned in the stage, inline in each role) from the same source. Three small browser scripts add behaviour: `theme.js` (switch and storage), `stage.js` (slide swapping), `motion.js` (name to stub, section entrances). Everything degrades: no JavaScript, reduced motion and phones all get a readable single-column page.

**Tech Stack:** Astro 7.4.0 (static output), plain JavaScript and CSS, `node:test` for unit and built-HTML tests, `linkedom` to read built HTML, `@playwright/test` 1.64.1 for browser tests, `sharp` for images.

**Spec:** `docs/superpowers/specs/2026-10-20-stage-redesign-design.md` (read it first; this plan implements it). The visual reference is the prototype in `design/directions/stage/` and `design/directions/shared/`.

## Global Constraints

Every task's requirements include these. Values are copied from the spec and from the 2026-10-17 spec section 4.

- Astro with `output: 'static'`. No server code, no adapter, no database.
- Plain JavaScript and CSS only: no TypeScript, no CSS framework.
- All page text lives in `src/data/site.js`. Illustration labels inside the diagram components are content too and follow the same rules.
- The name is exactly "Sai Manoj" in the DOM (the lowercase look is CSS `text-transform: lowercase`).
- Contact is LinkedIn `https://www.linkedin.com/in/sai-manoj-kumar` and GitHub profile `https://github.com/sai-manoj-kumar` only. LinkedIn is the one way to contact Sai. No email address anywhere (page text, `mailto:`, meta tags, structured data, manifest, text files, image metadata). No resume download. No links to individual GitHub repositories.
- PhonePe is left out. No dates or durations for roles. No internal codenames ("Gaap", "restli") and no incident durations. The "100 million events a day" (three webhook delivery services) and "1 billion requests a day" (API Gateway) figures are never merged.
- Years: "about nine years of backend experience". Never "12+", "more than a decade" or "a decade of".
- The stack lists only the tools in `site.js`: no TypeScript, Dart or OAuth, and no iOS focus.
- Illustrations are labelled as illustrations by their titles ("A header rewrite, illustrated", "A traceroute, illustrated"); the memory diagram keeps "Drawn to scale: 30% lower."
- Palette (tobacco and olive). Light: `--bg #f1ebdc`, `--surface #e6dcc6`, `--ink #2b170a`, `--muted #6f5a43`, `--accent #525e1b`, `--accent-ink #f1ebdc`, `--chip-off #cbbf9f`, `--deny #2b170a`, `--deny-ink #f1ebdc`. Dark: `--bg #472913`, `--surface #55321a`, `--ink #e4e0cf`, `--muted #c0ad92`, `--accent #c79a3e`, `--accent-ink #2b170a`, `--chip-off #6e4a2c`, `--deny #e4e0cf`, `--deny-ink #2b170a`. All text pairs at least 4.5:1, graphics at least 3:1.
- Type: General Sans 400/500/700, self-hosted, fetched at build time by `scripts/fetch-fonts.mjs`, served unmodified, **never committed**. No monospace.
- Two images on the page: the aisle photograph (stage) and the portrait (About). The aisle photo credit (CC BY-SA 4.0, PiDatacenters, via Wikimedia Commons) is in the footer only.
- Demo: token bucket, capacity 5, one token returns every 2000 ms, lazy refill, "Try again in Ns" counts down live. `bucket.js` and `limiter.js` are not changed.
- Breakpoint: **860px**. Screens 861px and wider get the pinned stage; 860px and narrower get one column.
- Node 22 or newer (`.nvmrc` is 24).
- Work on branch `redesign` (from `master`). Nothing is pushed, merged, or changed in Cloudflare or GitHub settings without Sai's explicit approval in chat at that step. DNS is never touched.
- Commits have **no** `Co-authored-by` line. Each commit message ends with the line `Claude-Session: https://claude.ai/code/session_01JGxmMQ6Vsu1QyZGeiHApX6` (pass it as a second `-m`).
- Use shell commands (not Python) for any scripting while debugging.

## Review Focus

Failure modes the spec implies but a straight port would not exercise. Each has a test in the task that owns the code.

1. **A layout rule that stops the page scrolling.** A prototype bug made `<body>` inherit `overflow: hidden` from a class named like the stage. `window.scrollTo()` hides this, a real mouse wheel does not. (Task 4: wheel-scroll test at five sizes; Task 6: pinned stage stays at the top.)
2. **Diagrams shown twice or not at all.** On wide screens with JavaScript each diagram must appear once (in the stage); on phones and with JavaScript off it must appear once (inline in its role); and the demo must exist exactly once. (Task 3: built-HTML test; Task 6: browser tests for JS off, phone and resize.)
3. **Theme storage is blocked, throws, or holds junk.** The page must still render, the switch must still change the theme for the visit, and a stored value like `purple` must be ignored. (Task 5.)
4. **Resizing across the 860px breakpoint** with the page open must restore the inline diagrams and drop the swap, and back again, with nothing stuck hidden. (Task 6.)
5. **Reduced motion and keyboard.** With reduced motion the name never morphs, the stub never appears, and every section is visible; tabbing never lands on an invisible element (the theme radios included). (Task 7.)

---

## File Structure

```
src/
  data/site.js                      Content (keeps one source). Drops `tone`, `titleWords`, `about.tearCta`.
  data/slides.js                    NEW. slideName(visual): maps a role's visual to its stage slide name.
  layouts/Base.astro                Head: theme script, color-scheme + theme-color metas.
  components/
    Name.astro                      NEW. The h1 (the name).
    Stub.astro                      The "Sai Manoj / Connect" link.
    Stage.astro                     NEW. Pinned half: photo and the four slides.
    TopBar.astro                    NEW. Section links and the theme switch.
    ThemeSwitch.astro               NEW. System / Light / Dark radios.
    Intro.astro                     NEW. Hero sentence, facts, LinkedIn and GitHub links.
    Experience.astro                Four roles (no folders).
    TechStack.astro                 Four plain groups (no details/summary).
    About.astro                     Letter with the small portrait.
    Connect.astro                   The accent field with two links.
    Footer.astro                    Copyright, profile addresses, photo credit.
    diagrams/MemoryBars.astro       New markup (`viz`), no notes about made-up data.
    diagrams/HeaderRewrite.astro    New markup, rendered in the stage and inline.
    diagrams/Traceroute.astro       New markup, rendered in the stage and inline.
    diagrams/TicketDemo.astro       The demo (rendered once, in the stage).
    Hero.astro, Folder.astro        DELETED.
  scripts/
    theme.js                        NEW. Switch behaviour and storage.
    stage.js                        NEW. Slide swapping while scrolling.
    motion.js                       REWRITTEN. Name to stub, section entrances.
    bucket.js, limiter.js           Unchanged.
  styles/global.css                 REWRITTEN. Tokens, layout, components, responsive, reduced motion.
  pages/index.astro, 404.astro      Compose the new components.
public/
  images/hero-stage.jpg             NEW. 1100 x 1281 centre crop of the aisle photo.
  images/hero.jpg                   DELETED. images/hero-phone.jpg, portrait.jpg unchanged.
  favicon.svg                       Light/dark via an internal media query.
scripts/make-assets.mjs             Writes hero-stage.jpg instead of hero.jpg.
og/og-card.html                     Dark palette.
tests/
  unit/slides.test.js               NEW.
  unit/contrast.test.js             NEW. Reads the tokens out of global.css.
  unit/site-data.test.js            Drops the `tone` assertion.
  dist/stage.test.js                NEW (replaces hero.test.js).
  dist/theme.test.js                NEW.
  dist/experience.test.js, closing-sections.test.js, page-rules.test.js, head.test.js, assets.test.js   Updated.
  e2e/helpers.js                    NEW. Real-wheel scrolling helper.
  e2e/stage.spec.js                 NEW.
  e2e/theme.spec.js                 NEW.
  e2e/motion.spec.js                NEW.
  e2e/visitors.spec.js              Updated.
playwright.config.js                Optional Firefox and WebKit projects.
README.md                           Points at the new spec and plan.
```

---

### Task 1: Baseline commits on `redesign`

Nothing is built yet. This task puts the approved spec, the visual reference and the already-made copy edits into git so every later diff is clean.

**Files:**
- Commit: `docs/superpowers/specs/2026-10-20-stage-redesign-design.md`, `docs/superpowers/plans/2026-10-20-stage-redesign.md`
- Commit: `design/directions/stage/`, `design/directions/shared/`
- Commit: `src/data/site.js`, `src/components/diagrams/HeaderRewrite.astro`, `src/components/diagrams/Traceroute.astro`, `tests/dist/experience.test.js` (the copy edits and the removed notes)
- Do not add: `design/directions/motif/`, `design/directions/tiles/`, `design/directions/sentence/` (scratch prototypes, pending Sai's decision to delete them)

**Interfaces:**
- Produces: a clean `redesign` branch where `npm test` and `npm run test:dist` pass (18 unit, 39 built-page tests).

- [ ] **Step 1: Confirm the branch and the starting state**

Run: `cd ~/claude_working_dir/saimanoj-site && git branch --show-current && git status --short`
Expected: `redesign`, then untracked `design/directions/`, `docs/superpowers/plans/2026-10-20-stage-redesign.md`, `docs/superpowers/specs/2026-10-20-stage-redesign-design.md`, and modified `src/data/site.js`, the two diagram components and `tests/dist/experience.test.js`.

- [ ] **Step 2: Verify the tests are green before committing anything**

Run: `npm test && npm run build && npm run test:dist`
Expected: 18 unit tests pass; build completes; 39 dist tests pass. (If the font download fails offline, the files already in `public/fonts/` are reused; see `scripts/fetch-fonts.mjs`.)

- [ ] **Step 3: Commit the copy edits**

```bash
git add src/data/site.js src/components/diagrams/HeaderRewrite.astro src/components/diagrams/Traceroute.astro tests/dist/experience.test.js
git commit -m "Reword two Defender lines and the GitHub link; drop the made-up notes from two diagrams" -m "Claude-Session: https://claude.ai/code/session_01JGxmMQ6Vsu1QyZGeiHApX6"
```

- [ ] **Step 4: Commit the spec, the plan and the visual reference**

```bash
git add docs/superpowers/specs/2026-10-20-stage-redesign-design.md docs/superpowers/plans/2026-10-20-stage-redesign.md
git commit -m "Add the split-stage redesign spec and plan" -m "Claude-Session: https://claude.ai/code/session_01JGxmMQ6Vsu1QyZGeiHApX6"
git add design/directions/stage design/directions/shared
git commit -m "Keep the split-stage prototype as the visual reference" -m "Claude-Session: https://claude.ai/code/session_01JGxmMQ6Vsu1QyZGeiHApX6"
```

- [ ] **Step 5: Confirm no font file or scratch prototype slipped in**

Run: `git ls-files | grep -iE 'woff|design/directions/(motif|tiles|sentence)' ; echo "exit: $?"`
Expected: no output from `git ls-files`, then `exit: 1`.

---

### Task 2: Data model: slide names and a simpler `site.js`

Roles no longer have a light/dark `tone`, and the hero no longer has three title words. A tiny helper maps a role's `visual` to the name of the stage slide that shows it. Both the stage and the roles use it.

**Files:**
- Create: `src/data/slides.js`
- Modify: `src/data/site.js` (remove `tone` from the four roles, `hero.titleWords`, `about.tearCta`; change `photoCredit.note`)
- Test: `tests/unit/slides.test.js`; modify `tests/unit/site-data.test.js`

**Interfaces:**
- Produces: `export function slideName(visual: string): 'demo' | 'memory' | 'rewrite' | 'trace'` in `src/data/slides.js`. `slideName('ticketDemo')` returns `'demo'`; `'memory'`, `'rewrite'`, `'trace'` return themselves; anything else throws `Error('Unknown visual: <value>')`.
- Produces: `site.experience[i]` keeps `company, project, title, visual, paragraphs, note?` (no `tone`).

- [ ] **Step 1: Write the failing test for `slideName`**

`tests/unit/slides.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { slideName } from '../../src/data/slides.js';
import { site } from '../../src/data/site.js';

test('the demo role maps to the demo slide, the diagram roles map to themselves', () => {
  assert.equal(slideName('ticketDemo'), 'demo');
  assert.equal(slideName('memory'), 'memory');
  assert.equal(slideName('rewrite'), 'rewrite');
  assert.equal(slideName('trace'), 'trace');
});

test('an unknown visual is a loud error, not a silently missing slide', () => {
  assert.throws(() => slideName('bogus'), /Unknown visual: bogus/);
});

test('every role in site.js has a slide, and the four slides are all different', () => {
  const names = site.experience.map((r) => slideName(r.visual));
  assert.deepEqual(names, ['demo', 'memory', 'rewrite', 'trace']);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/unit/slides.test.js`
Expected: FAIL with `Cannot find module '.../src/data/slides.js'`.

- [ ] **Step 3: Write the helper**

`src/data/slides.js`:

```js
/* A role's `visual` names what it shows; the stage and the roles share these slide names. */
const SLIDES = { ticketDemo: 'demo', memory: 'memory', rewrite: 'rewrite', trace: 'trace' };

export function slideName(visual) {
  const name = SLIDES[visual];
  if (!name) throw new Error(`Unknown visual: ${visual}`);
  return name;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/unit/slides.test.js`
Expected: 3 tests pass.

- [ ] **Step 5: Update the data-shape test (it still demands `tone`)**

In `tests/unit/site-data.test.js`, in the test `experience has four roles with the company and project in the same fields`, delete the line:

```js
    assert.ok(['light', 'dark'].includes(role.tone), `tone: ${role.tone}`);
```

and add this test at the end of the file:

```js
test('roles carry no leftover layout fields', () => {
  for (const role of site.experience) assert.equal('tone' in role, false, `tone on ${role.project}`);
  assert.equal('titleWords' in site.hero, false);
  assert.equal('tearCta' in site.about, false);
});
```

- [ ] **Step 6: Run it to verify the new test fails**

Run: `node --test tests/unit/site-data.test.js`
Expected: FAIL on `roles carry no leftover layout fields` (`tone on Webhooks Platform`).

- [ ] **Step 7: Clean `site.js`**

In `src/data/site.js`: delete the four `tone: '...'` lines (one per role); delete the `titleWords: ['Sai Manoj', 'Backend', 'Engineer'],` line from `hero`; delete `tearCta: 'Say hello on LinkedIn',` from `about`; and replace the photo credit note:

```js
    note: 'Cropped, and shown in greyscale and darkened.',
```

(the old value was `'Shown in greyscale and tinted.'`; the stage crops the photo and darkens it in CSS).

- [ ] **Step 8: Run all unit tests**

Run: `npm test`
Expected: all pass (18 existing tests with the updated assertion, plus 3 new in `slides.test.js`, plus 1 new in `site-data.test.js`).

- [ ] **Step 9: Commit**

```bash
git add src/data/slides.js src/data/site.js tests/unit/slides.test.js tests/unit/site-data.test.js
git commit -m "Add slide names; drop layout-only fields from site.js" -m "Claude-Session: https://claude.ai/code/session_01JGxmMQ6Vsu1QyZGeiHApX6"
```

---

### Task 3: New markup, the stage photo, and the built-HTML tests

This replaces the card-and-folders markup with the stage-and-reader markup. Styling comes in Task 4, so after this task the page builds and its HTML is right but looks unstyled; the browser tests are red until Task 4 and are fixed there.

**Files:**
- Create: `src/components/Name.astro`, `Stage.astro`, `TopBar.astro`, `Intro.astro`
- Modify: `src/components/Stub.astro`, `Experience.astro`, `TechStack.astro`, `About.astro`, `Connect.astro`, `Footer.astro`, `diagrams/MemoryBars.astro`, `diagrams/HeaderRewrite.astro`, `diagrams/Traceroute.astro`, `diagrams/TicketDemo.astro`, `src/pages/index.astro`
- Delete: `src/components/Hero.astro`, `src/components/Folder.astro`, `public/images/hero.jpg`, `tests/dist/hero.test.js`
- Modify: `scripts/make-assets.mjs`
- Create: `public/images/hero-stage.jpg` (by running `npm run assets`)
- Test: create `tests/dist/stage.test.js`; modify `tests/dist/experience.test.js`, `closing-sections.test.js`, `page-rules.test.js`, `assets.test.js`

**Interfaces:**
- Consumes: `slideName(visual)` from `src/data/slides.js` (Task 2); `site` from `src/data/site.js`.
- Produces (DOM contract used by Tasks 4 to 7):
  - `h1#name.name` ("Sai Manoj"), `a#stub.stub[href="#connect"]`.
  - `div.split#top` containing `aside.stage` and `div.reader`.
  - `aside.stage` contains `picture` (`source[media="(max-width: 860px)"][srcset="/images/hero-phone.jpg"]`, `img.room[src="/images/hero-stage.jpg"]`) and `div.slides#slides` with four `div.slide[data-slide]` in the order `demo, memory, rewrite, trace`; only `demo` has class `on`.
  - `div.reader` contains `header.topbar`, `main` (h1 first, then `section.intro`, `section.work#work`, `section.stack#stack`, `section.about#about`, `section.connect#connect`) and `footer.end`.
  - Each role: `article.role[data-slide]`, `#limiter` on the demo role; each diagram is `div.viz` (rendered once in `.slide`, once in `.role`, except the demo).
  - The demo has exactly one set of ids: `#dispenser`, `#take`, `#tickets`, `#bucket-label`, `#fallback`.

- [ ] **Step 1: Write the failing built-HTML test for the stage and the page shell**

`tests/dist/stage.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { doc } from './helpers.js';

const squash = (el) => el.textContent.replace(/\s+/g, ' ').trim();

test('one h1, and it is the name', () => {
  const h1s = doc.querySelectorAll('h1');
  assert.equal(h1s.length, 1);
  assert.equal(h1s[0].textContent.trim(), 'Sai Manoj');
  assert.equal(h1s[0].id, 'name');
});

test('the intro carries the facts, the sentence and the two profile links', () => {
  const intro = doc.querySelector('.intro');
  for (const line of ['Senior software engineer', 'India', 'Java, Python, C#', 'Services on public cloud. Tools for AI agents.']) {
    assert.ok(intro.textContent.includes(line), line);
  }
  assert.deepEqual([...intro.querySelectorAll('a')].map((a) => a.getAttribute('href')), [
    'https://www.linkedin.com/in/sai-manoj-kumar',
    'https://github.com/sai-manoj-kumar',
  ]);
});

test('the stage photo has alt text and sizes, and phones get the portrait crop', () => {
  const img = doc.querySelector('.stage picture img.room');
  assert.equal(img.getAttribute('src'), '/images/hero-stage.jpg');
  assert.ok(img.getAttribute('alt'), 'alt');
  assert.ok(img.getAttribute('width') && img.getAttribute('height'), 'width and height');
  const source = doc.querySelector('.stage picture source');
  assert.equal(source.getAttribute('media'), '(max-width: 860px)');
  assert.equal(source.getAttribute('srcset'), '/images/hero-phone.jpg');
});

test('the photo credit is not in the stage or the intro', () => {
  assert.doesNotMatch(doc.querySelector('.stage').textContent, /PiDatacenters|Photo:/);
  assert.doesNotMatch(doc.querySelector('.intro').textContent, /PiDatacenters|Photo:/);
});

test('the stub points at the connect section', () => {
  assert.ok(doc.querySelector('a#stub[href="#connect"]'));
});

test('the stage has four slides in order, only the demo is on, and the demo exists once', () => {
  const slides = [...doc.querySelectorAll('.stage .slide')];
  assert.deepEqual(slides.map((s) => s.getAttribute('data-slide')), ['demo', 'memory', 'rewrite', 'trace']);
  assert.deepEqual(slides.filter((s) => s.classList.contains('on')).map((s) => s.getAttribute('data-slide')), ['demo']);
  for (const id of ['dispenser', 'take', 'tickets', 'bucket-label', 'fallback']) {
    assert.equal(doc.querySelectorAll(`#${id}`).length, 1, `exactly one #${id}`);
  }
});

test('each diagram is in the stage and inline in its role, with identical text', () => {
  for (const name of ['memory', 'rewrite', 'trace']) {
    const pinned = doc.querySelector(`.stage .slide[data-slide="${name}"] .viz`);
    const inline = doc.querySelector(`.role[data-slide="${name}"] .viz`);
    assert.ok(pinned && inline, `${name} appears twice`);
    assert.equal(squash(pinned), squash(inline), `${name} copies match`);
  }
  assert.equal(doc.querySelector('.role[data-slide="demo"] .viz'), null, 'the demo role has no inline diagram');
});

test('the page shell has the landmarks and the section ids the links need', () => {
  assert.ok(doc.querySelector('aside.stage[aria-label]'));
  assert.ok(doc.querySelector('.reader > header.topbar nav[aria-label="Sections"]'));
  assert.equal(doc.querySelectorAll('main').length, 1);
  assert.ok(doc.querySelector('.reader > footer'));
  for (const id of ['work', 'stack', 'about', 'connect']) assert.ok(doc.getElementById(id), `#${id}`);
  assert.deepEqual([...doc.querySelectorAll('.topbar nav a')].map((a) => a.getAttribute('href')), ['#work', '#stack', '#about', '#connect']);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run build && node --test tests/dist/stage.test.js`
Expected: FAIL (for example `Cannot read properties of null` on `.stage picture img.room`).

- [ ] **Step 3: Delete the old pieces**

Run:

```bash
git rm src/components/Hero.astro src/components/Folder.astro public/images/hero.jpg tests/dist/hero.test.js
```

- [ ] **Step 4: Rewrite the diagram components (new markup, no "made-up" notes)**

`src/components/diagrams/MemoryBars.astro`:

```astro
<div class="viz">
  <p class="viz-title">Memory use, before and after</p>
  <div class="bars" role="img" aria-label="Memory use before and after, drawn to scale: 100 before, 70 after">
    <p class="bar-row"><span>Before</span><i style="--w:100%"></i></p>
    <p class="bar-row"><span>After</span><i style="--w:70%"></i></p>
  </div>
  <p class="viz-note">Drawn to scale: 30% lower.</p>
</div>
```

`src/components/diagrams/HeaderRewrite.astro`:

```astro
<div class="viz">
  <p class="viz-title">A header rewrite, illustrated</p>
  <ol class="steps">
    <li><span>Backend sends</span><span>Location: http://backend-1.internal/cart</span></li>
    <li class="rule"><span>Rule</span><span>Replace the backend host with the public host</span></li>
    <li><span>Client receives</span><span>Location: https://shop.example.com/cart</span></li>
  </ol>
</div>
```

`src/components/diagrams/Traceroute.astro`:

```astro
<div class="viz">
  <p class="viz-title">A traceroute, illustrated</p>
  <ol class="hops">
    <li style="--w:6%"><span>Local router</span><i></i><b>2 ms</b></li>
    <li style="--w:29%"><span>Network edge</span><i></i><b>9 ms</b></li>
    <li style="--w:58%"><span>Transit</span><i></i><b>18 ms</b></li>
    <li style="--w:100%"><span>Destination</span><i></i><b>31 ms</b></li>
  </ol>
</div>
```

`src/components/diagrams/TicketDemo.astro` (same ids and behaviour; the `pic`/`rv` classes go):

```astro
<div class="dispenser" id="dispenser">
  <div class="bucket" aria-hidden="true">
    <span class="chip"></span><span class="chip"></span><span class="chip"></span><span class="chip"></span><span class="chip"></span>
  </div>
  <p class="bucket-label" id="bucket-label">5 of 5 tokens left</p>
  <button class="btn" type="button" id="take" disabled>Take a ticket</button>
  <ol class="tickets" id="tickets" aria-live="polite"></ol>
  <p class="fallback" id="fallback">This demo needs JavaScript. It lets you take five tickets, then answers 429 Too Many Requests until a new token arrives.</p>
</div>
<script>
  import '../../scripts/limiter.js';
</script>
```

- [ ] **Step 5: Write the stage, name, stub, top bar and intro**

`src/components/Name.astro`:

```astro
---
import { site } from '../data/site.js';
---
<h1 class="name" id="name">{site.name}</h1>
```

`src/components/Stub.astro`:

```astro
---
import { site } from '../data/site.js';
---
<a class="stub" id="stub" href="#connect" aria-label={`${site.name}: jump to connect`}>
  <span class="stub-name">{site.name}</span>
  <span class="stub-act">Connect</span>
</a>
```

`src/components/Stage.astro`:

```astro
---
import { site } from '../data/site.js';
import { slideName } from '../data/slides.js';
import TicketDemo from './diagrams/TicketDemo.astro';
import MemoryBars from './diagrams/MemoryBars.astro';
import HeaderRewrite from './diagrams/HeaderRewrite.astro';
import Traceroute from './diagrams/Traceroute.astro';

const visuals = { demo: TicketDemo, memory: MemoryBars, rewrite: HeaderRewrite, trace: Traceroute };
const { hero, experience } = site;
---
<aside class="stage" aria-label="Live demo and role diagrams">
  <picture>
    <source media="(max-width: 860px)" srcset="/images/hero-phone.jpg" width="800" height="1281" />
    <img class="room" src="/images/hero-stage.jpg" width="1100" height="1281" alt={hero.photoAlt} fetchpriority="high" />
  </picture>
  <div class="slides" id="slides">
    {experience.map((role) => {
      const name = slideName(role.visual);
      const Visual = visuals[name];
      return (
        <div class={`slide${name === 'demo' ? ' on' : ''}`} data-slide={name}>
          <Visual />
          <p class="stage-cap">{name === 'demo' ? role.note : `${role.project}, ${role.company}`}</p>
        </div>
      );
    })}
  </div>
</aside>
```

`src/components/TopBar.astro`:

```astro
<header class="topbar">
  <nav aria-label="Sections">
    <a href="#work">Experience</a>
    <a href="#stack">Tech stack</a>
    <a href="#about">About</a>
    <a href="#connect">Connect</a>
  </nav>
</header>
```

`src/components/Intro.astro`:

```astro
---
import { site } from '../data/site.js';

const { hero, links } = site;
---
<section class="intro" aria-label="Introduction">
  <p class="sentence">{hero.sentence}</p>
  <p class="facts">{hero.facts.join(' · ')}</p>
  <p class="actions">
    <a class="btn" href={links.linkedin}>{hero.cta}</a>
    <a class="textlink" href={links.github}>{hero.githubLabel}</a>
  </p>
</section>
```

- [ ] **Step 6: Rewrite the reading-column sections**

`src/components/Experience.astro`:

```astro
---
import { site } from '../data/site.js';
import { slideName } from '../data/slides.js';
import MemoryBars from './diagrams/MemoryBars.astro';
import HeaderRewrite from './diagrams/HeaderRewrite.astro';
import Traceroute from './diagrams/Traceroute.astro';

const inline = { memory: MemoryBars, rewrite: HeaderRewrite, trace: Traceroute };
---
<section class="work" id="work" aria-labelledby="work-h">
  <h2 id="work-h">Experience</h2>
  {site.experience.map((role) => {
    const name = slideName(role.visual);
    const Visual = inline[name];
    return (
      <article class="role" data-slide={name} id={name === 'demo' ? 'limiter' : undefined}>
        <h3>{role.project}</h3>
        <p class="who">{role.company}, {role.title}</p>
        {role.paragraphs.map((paragraph) => <p>{paragraph}</p>)}
        {name === 'demo' ? (
          <p class="note">
            {role.note}{' '}
            <span class="only-wide">The working demo is the panel on the left.</span>
            <span class="only-narrow">The working demo is at the top of the page.</span>
          </p>
        ) : (
          <Visual />
        )}
      </article>
    );
  })}
</section>
```

`src/components/TechStack.astro`:

```astro
---
import { site } from '../data/site.js';
---
<section class="stack" id="stack" aria-labelledby="stack-h">
  <h2 id="stack-h">Tech stack</h2>
  {site.stack.map((group) => (
    <div class="group">
      <h3 class="gname">{group.title}</h3>
      <ul>
        {group.items.map(([name, note]) => (
          <li><span class="item">{name}</span><span class="note">{note}</span></li>
        ))}
      </ul>
    </div>
  ))}
</section>
```

`src/components/About.astro`:

```astro
---
import { site } from '../data/site.js';

const { about, links, name } = site;
---
<section class="about" id="about" aria-label={`About ${name}`}>
  <img class="mini" src="/images/portrait.jpg" width="88" height="88" alt={name} loading="lazy" />
  {about.paragraphs.map((paragraph) => <p>{paragraph}</p>)}
  <p>
    {about.closing.before}<mark><a href={links.linkedin}>{about.closing.linkText}</a></mark>{about.closing.after}
  </p>
  <p class="sign"><em>{name}</em><span>{about.signRole}</span></p>
</section>
```

`src/components/Connect.astro`:

```astro
---
import { site } from '../data/site.js';

const { connect, links } = site;
---
<section class="connect" id="connect" aria-labelledby="connect-h">
  <h2 id="connect-h">{connect.heading}</h2>
  <p>{connect.text}</p>
  <p class="links">
    <a class="btn" href={links.linkedin}>{connect.linkedinLabel}</a>
    <a class="textlink" href={links.github}>{connect.githubLabel}</a>
  </p>
</section>
```

`src/components/Footer.astro`:

```astro
---
import { site } from '../data/site.js';

const { footer, links, name, photoCredit: c } = site;
const profile = (url) => url.replace('https://www.', '').replace('https://', '');
---
<footer class="end">
  <p>
    © {footer.year} {name} ·
    <a href={links.linkedin}>{profile(links.linkedin)}</a> ·
    <a href={links.github}>{profile(links.github)}</a>
  </p>
  <p class="credits">
    Photo: <a href={c.titleUrl}>“{c.title}”</a> by {c.author}, <a href={c.licenseUrl}>{c.license}</a>, via {c.source}. {c.note}
  </p>
</footer>
```

- [ ] **Step 7: Compose the page**

`src/pages/index.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import Stub from '../components/Stub.astro';
import Stage from '../components/Stage.astro';
import TopBar from '../components/TopBar.astro';
import Name from '../components/Name.astro';
import Intro from '../components/Intro.astro';
import Experience from '../components/Experience.astro';
import TechStack from '../components/TechStack.astro';
import About from '../components/About.astro';
import Connect from '../components/Connect.astro';
import Footer from '../components/Footer.astro';
---
<Base>
  <Stub />
  <div class="split" id="top">
    <Stage />
    <div class="reader">
      <TopBar />
      <main>
        <Name />
        <Intro />
        <Experience />
        <TechStack />
        <About />
        <Connect />
      </main>
      <Footer />
    </div>
  </div>
</Base>
```

- [ ] **Step 8: Make the stage crop (assets script)**

In `scripts/make-assets.mjs`, replace the first block that writes `public/images/hero.jpg`:

```js
await sharp(at('design/prototype/assets/datacenter.jpg'))
  .resize({ width: 1920, withoutEnlargement: true })
  .jpeg({ quality: 68, mozjpeg: true })
  .toFile(at('public/images/hero.jpg'));
```

with this, and move the `const aisle = ...` line above it (it is currently after) so `aisle` is defined first:

```js
// The stage shows a tall slice of the aisle photo (object-fit: cover in a column about 47% of the screen
// wide), so serve a centre crop at the source's own resolution: lighter than the full frame, and sharp.
const aisle = await sharp(at('design/prototype/assets/datacenter.jpg')).metadata();
const stageWidth = 1100;
await sharp(at('design/prototype/assets/datacenter.jpg'))
  .extract({ left: Math.round((aisle.width - stageWidth) / 2), top: 0, width: stageWidth, height: aisle.height })
  .jpeg({ quality: 68, mozjpeg: true })
  .toFile(at('public/images/hero-stage.jpg'));
```

Then delete the original `const aisle = await sharp(...).metadata();` line further down (it is now declared at the top), keeping `const phoneWidth = 800;` and the phone crop as they are.

- [ ] **Step 9: Generate the image and check its size**

Run: `npm run assets && node -e "import('sharp').then(async ({default: s}) => { const m = await s('public/images/hero-stage.jpg').metadata(); console.log(m.width, m.height); })"`
Expected: `1100 1281`.

- [ ] **Step 10: Update the other built-HTML tests**

`tests/dist/experience.test.js`: replace the whole file with:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { doc, html } from './helpers.js';

const roles = () => [...doc.querySelectorAll('article.role')];

test('four roles in order: project, then company and title', () => {
  assert.equal(roles().length, 4);
  assert.deepEqual(roles().map((r) => r.querySelector('h3').textContent.trim()), [
    'Webhooks Platform', 'Defender', 'Application Gateway', 'Network Monitoring',
  ]);
  assert.deepEqual(roles().map((r) => r.querySelector('p.who').textContent.trim()), [
    'LinkedIn, Senior Software Engineer',
    'Microsoft, Software Engineer II',
    'Microsoft, Software Engineer II',
    'Microsoft, Software Engineer',
  ]);
  for (const r of roles()) assert.equal(r.querySelector('h3').nextElementSibling.className, 'who', 'title follows project');
});

test('each role names the slide it is shown with, and only the demo role is #limiter', () => {
  assert.deepEqual(roles().map((r) => r.getAttribute('data-slide')), ['demo', 'memory', 'rewrite', 'trace']);
  assert.deepEqual(roles().map((r) => r.id), ['limiter', '', '', '']);
});

test('the demo has a plain fallback when JavaScript is off', () => {
  const take = doc.getElementById('take');
  assert.ok(take.hasAttribute('disabled'), 'button starts disabled');
  assert.match(doc.getElementById('fallback').textContent, /needs JavaScript/);
  assert.equal(doc.getElementById('tickets').getAttribute('aria-live'), 'polite');
  assert.equal(doc.querySelectorAll('#dispenser .chip').length, 5);
});

test('illustrations are labelled as illustrations', () => {
  assert.match(html, /A header rewrite, illustrated/);
  assert.match(html, /A traceroute, illustrated/);
  assert.match(html, /Drawn to scale: 30% lower\./);
});

test('the made-up notes are gone, and the demo sentence says two seconds', () => {
  assert.doesNotMatch(html, /Made-up/);
  assert.match(doc.querySelector('#limiter .note').textContent, /a new one every two seconds/);
});

test('the demo note has a wording for each layout', () => {
  const note = doc.querySelector('#limiter .note');
  assert.match(note.querySelector('.only-wide').textContent, /panel on the left/);
  assert.match(note.querySelector('.only-narrow').textContent, /top of the page/);
});
```

`tests/dist/closing-sections.test.js`: replace the whole file with:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { doc } from './helpers.js';

test('tech stack: four groups, plain lists', () => {
  const groups = [...doc.querySelectorAll('#stack .group')];
  assert.equal(groups.length, 4);
  assert.deepEqual(groups.map((g) => g.querySelector('.gname').textContent.trim()), [
    'Backend', 'Cloud', 'Data', 'AI agent tooling',
  ]);
  assert.equal(doc.querySelector('#stack h2').textContent.trim(), 'Tech stack');
  assert.equal(doc.querySelectorAll('#stack details').length, 0, 'no collapsible bars any more');
});

test('about: nine years of backend and one LinkedIn link in the letter', () => {
  const about = doc.getElementById('about');
  assert.match(about.textContent, /about nine years of backend experience/);
  const links = [...about.querySelectorAll('a')].map((a) => a.getAttribute('href'));
  assert.deepEqual(links, ['https://www.linkedin.com/in/sai-manoj-kumar']);
});

test('connect: LinkedIn and GitHub profile only, and the GitHub label invites collaboration', () => {
  const links = [...doc.querySelectorAll('#connect a')];
  assert.deepEqual(links.map((a) => a.getAttribute('href')), [
    'https://www.linkedin.com/in/sai-manoj-kumar',
    'https://github.com/sai-manoj-kumar',
  ]);
  assert.equal(links[1].textContent.trim(), 'Collaborate on GitHub');
});

test('footer: copyright, profile links and the photo credit', () => {
  const footer = doc.querySelector('footer');
  assert.match(footer.textContent, /© 2026 Sai Manoj/);
  assert.match(footer.textContent, /Racks Amravati Data Center/);
  assert.match(footer.textContent, /CC BY-SA 4\.0/);
  const hrefs = [...footer.querySelectorAll('a')].map((a) => a.getAttribute('href'));
  assert.ok(hrefs.includes('https://www.linkedin.com/in/sai-manoj-kumar'));
  assert.ok(hrefs.includes('https://github.com/sai-manoj-kumar'));
  assert.ok(hrefs.includes('https://creativecommons.org/licenses/by-sa/4.0'));
});
```

`tests/dist/page-rules.test.js`: change the image count line from

```js
  assert.equal(doc.querySelectorAll('img').length, 3, 'hero photo, hero portrait, about portrait');
```

to

```js
  assert.equal(doc.querySelectorAll('img').length, 2, 'stage photo and about portrait');
```

and in the `no email address in any file the site publishes` test change the required list entry `'images/hero.jpg'` to `'images/hero-stage.jpg'`; and change the LinkedIn test's message `'LinkedIn linked from the hero card and the connect section'` to `'LinkedIn linked from the intro and the connect section'`.

`tests/dist/assets.test.js`: replace the test `the hero photo is web-sized` with:

```js
test('the stage photo is a web-sized crop', async () => {
  const meta = await sharp(fileURLToPath(dist('images/hero-stage.jpg'))).metadata();
  assert.equal(meta.width, 1100);
  assert.equal(meta.height, 1281);
  assert.ok(statSync(dist('images/hero-stage.jpg')).size < 450_000, 'stage photo under 450 KB');
});
```

- [ ] **Step 11: Rebuild and run every unit and built-HTML test**

Run: `npm test && npm run build && npm run test:dist`
Expected: all unit tests pass; the build completes; all dist tests pass (the new `stage.test.js` included). `npm run test:e2e` is expected to be red until Task 4 and is not run here.

- [ ] **Step 12: Commit**

```bash
git add -A src public scripts tests
git commit -m "Rebuild the page markup as a pinned stage and a reading column" -m "Claude-Session: https://claude.ai/code/session_01JGxmMQ6Vsu1QyZGeiHApX6"
```

---

### Task 4: Styles, the contrast test, and scrolling that really works

The whole stylesheet is rewritten from the prototype. The page must scroll with a real mouse wheel at every size, the stage must stay pinned, and the colour tokens are checked by a test that reads them straight out of the CSS.

**Files:**
- Modify (replace entirely): `src/styles/global.css`
- Create: `tests/unit/contrast.test.js`, `tests/e2e/helpers.js`, `tests/e2e/stage.spec.js`
- Modify: `tests/e2e/visitors.spec.js`

**Interfaces:**
- Consumes: the DOM contract from Task 3.
- Produces: CSS classes used by later tasks: `html.js`, `html.swap`, `html.anim`, `.name.is-fixed`, `.stub.on`, `.slide.on`, `.rv` / `.rv.in`, `.theme` (switch), `.only-wide` / `.only-narrow`. Token names: `--bg --surface --ink --muted --accent --accent-ink --chip-off --deny --deny-ink`, `--pad`, `--m`.

- [ ] **Step 1: Write the failing contrast test (reads tokens from the stylesheet)**

`tests/unit/contrast.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../../src/styles/global.css', import.meta.url), 'utf8');

/* The text between the first `{` after `header` and its closing `}`. */
function block(header) {
  const at = css.indexOf(header);
  assert.notEqual(at, -1, `global.css has "${header}"`);
  const open = css.indexOf('{', at);
  return css.slice(open + 1, css.indexOf('}', open));
}
const tokens = (body) => Object.fromEntries([...body.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2].toLowerCase()]));

const light = tokens(block(':root {'));
const dark = tokens(block(':root[data-theme="dark"] {'));
const darkViaMedia = tokens(block(':root:not([data-theme="light"]) {'));

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const TEXT = [['ink', 'bg'], ['ink', 'surface'], ['muted', 'bg'], ['muted', 'surface'], ['accent-ink', 'accent']];
const GRAPHICS = [['accent', 'bg'], ['accent', 'surface']];

test('the palettes match the spec', () => {
  assert.equal(light.bg, '#f1ebdc');
  assert.equal(light.accent, '#525e1b');
  assert.equal(dark.bg, '#472913');
  assert.equal(dark.accent, '#c79a3e');
});

test('the dark palette is identical whether it comes from the OS or from the switch', () => {
  assert.deepEqual(darkViaMedia, dark);
});

for (const [name, palette] of [['light', light], ['dark', dark]]) {
  test(`${name}: every text pair is at least 4.5:1`, () => {
    for (const [fg, bg] of TEXT) {
      assert.ok(ratio(palette[fg], palette[bg]) >= 4.5, `${fg} on ${bg}: ${ratio(palette[fg], palette[bg]).toFixed(2)}`);
    }
  });
  test(`${name}: graphics are at least 3:1`, () => {
    for (const [fg, bg] of GRAPHICS) {
      assert.ok(ratio(palette[fg], palette[bg]) >= 3, `${fg} on ${bg}: ${ratio(palette[fg], palette[bg]).toFixed(2)}`);
    }
  });
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/unit/contrast.test.js`
Expected: FAIL (`global.css has ":root[data-theme="dark"] {"`), because the old stylesheet has no theme blocks.

- [ ] **Step 3: Replace the stylesheet**

Write `src/styles/global.css` with exactly this content:

```css
/* saimanoj.com: the split stage. Tobacco and olive, General Sans, light and dark.
   Components read the tokens; the only literal colours are the photo caption scrim. */

:root {
  --bg: #f1ebdc;
  --surface: #e6dcc6;
  --ink: #2b170a;
  --muted: #6f5a43;
  --accent: #525e1b;
  --accent-ink: #f1ebdc;
  --chip-off: #cbbf9f;
  --deny: #2b170a;
  --deny-ink: #f1ebdc;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #472913;
    --surface: #55321a;
    --ink: #e4e0cf;
    --muted: #c0ad92;
    --accent: #c79a3e;
    --accent-ink: #2b170a;
    --chip-off: #6e4a2c;
    --deny: #e4e0cf;
    --deny-ink: #2b170a;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #472913;
  --surface: #55321a;
  --ink: #e4e0cf;
  --muted: #c0ad92;
  --accent: #c79a3e;
  --accent-ink: #2b170a;
  --chip-off: #6e4a2c;
  --deny: #e4e0cf;
  --deny-ink: #2b170a;
  color-scheme: dark;
}

:root {
  --pad: clamp(28px, 5vw, 72px);
  --m: clamp(20px, 2.4vw, 36px);
  --step-small: clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem);
  --step-body: clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem);
  --step-lead: clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem);
  --step-head: clamp(2rem, 1.2rem + 1.6vw, 2.75rem);
  --font: "General Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --ease: cubic-bezier(0.2, 0.7, 0.2, 1);
}

*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body { background: var(--bg); color: var(--ink); font: 400 var(--step-body)/1.5 var(--font); -webkit-font-smoothing: antialiased; }
img { display: block; max-width: 100%; height: auto; }
picture { display: contents; }
a { color: inherit; }
:focus-visible { outline: 3px solid currentColor; outline-offset: 3px; }
::selection { background: var(--ink); color: var(--bg); }
.lead { font-size: var(--step-lead); }

.skip { position: absolute; left: -999px; top: 0; }
.skip:focus { left: var(--m); top: var(--m); z-index: 100; padding: 0.6rem 1rem; background: var(--ink); color: var(--bg); }

/* Controls ------------------------------------------------------------ */
.btn {
  display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 1.4rem; white-space: nowrap;
  background: var(--accent); color: var(--accent-ink); font: 500 var(--step-body)/1 var(--font);
  text-decoration: none; border: 0; border-radius: 0; cursor: pointer;
  transition: transform 0.18s var(--ease), filter 0.18s var(--ease);
}
.btn:hover { filter: brightness(1.08); transform: translateY(-2px); }
.btn:active { transform: translateY(1px); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.textlink { font-weight: 500; text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 0.28em; margin-left: 12px; }

/* Theme switch: three real radios. The inputs are clipped, not transparent, so keyboard focus can
   still be seen on the label beside them. Hidden without JavaScript (the page then follows the OS). */
.theme { border: 0; padding: 0; min-width: 0; display: inline-flex; gap: 2px; }
.theme legend { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.theme label { position: relative; }
.theme input { position: absolute; width: 1px; height: 1px; margin: 0; clip-path: inset(50%); }
.theme span { display: inline-flex; align-items: center; min-height: 44px; padding: 0 0.7rem; color: var(--muted); font-size: var(--step-small); font-weight: 500; cursor: pointer; }
.theme input:checked + span { background: var(--ink); color: var(--bg); }
.theme input:focus-visible + span { outline: 3px solid currentColor; outline-offset: 2px; }
html:not(.js) .theme { display: none; }

/* Layout: the stage (left, pinned) and the reader (right) -------------- */
.split { display: grid; grid-template-columns: 47% 1fr; align-items: start; }
.stage { position: sticky; top: 0; height: 100svh; overflow: hidden; background: var(--surface); display: grid; place-items: center; }
.room { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 40%; filter: grayscale(1) brightness(0.55) contrast(1.05); }

/* The pinned half: four slides in one grid cell, the one for the role being read is shown.
   Without the `swap` class (phones, no JavaScript) only the demo slide shows and the diagrams stay
   inline in their roles. The head script sets `swap` before first paint on wide screens. */
.slides { position: relative; width: min(600px, 92%); display: grid; margin-top: -6svh; }
.slide { grid-area: 1 / 1; align-self: center; display: flex; flex-direction: column; gap: 14px; opacity: 0; visibility: hidden; transform: translateY(10px); transition: opacity 0.55s var(--ease), transform 0.55s var(--ease), visibility 0s linear 0.55s; }
.slide.on { opacity: 1; visibility: visible; transform: none; transition-delay: 0s; }
.slide[data-slide="demo"] { width: min(420px, 100%); justify-self: center; }
.slide .dispenser { min-height: 380px; }
.slide .viz { padding: 24px; }
.slide .steps li { grid-template-columns: 1fr; gap: 2px; }
html:not(.swap) .slide:not([data-slide="demo"]) { display: none; }
html.swap .role .viz { display: none; }
.stage-cap { font-size: var(--step-small); color: #ffffff; background: color-mix(in srgb, #000 55%, transparent); padding: 8px 12px; }

.reader { min-width: 0; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; min-height: 64px; padding-inline: var(--pad) var(--m); }
.topbar nav { display: flex; gap: clamp(12px, 1.8vw, 28px); }
.topbar nav a { font-size: var(--step-small); font-weight: 500; text-decoration: none; padding: 12px 0; }
.topbar nav a:hover { text-decoration: underline; text-underline-offset: 0.3em; }

main > section, .end { padding-inline: var(--pad); }
main > section > * { max-width: 46ch; }

.intro { min-height: calc(100svh - 64px); display: flex; flex-direction: column; gap: 16px; justify-content: flex-start; padding-top: 14svh; }
.intro .sentence, .intro .facts { text-wrap: balance; }
.intro .sentence { font-size: var(--step-lead); line-height: 1.2; max-width: 26ch; font-weight: 500; }
.intro .facts { color: var(--muted); }

/* The name runs along the bottom of the first screen, then (with JavaScript) shrinks into the stub ----- */
.name { position: absolute; z-index: 20; right: var(--m); top: calc(100svh - 38px - 0.84em); font: 500 clamp(5rem, 12vw, 12.5rem)/0.84 var(--font); letter-spacing: -0.045em; text-transform: lowercase; white-space: nowrap; }
.name.is-fixed { position: fixed; right: auto; left: 0; top: 0; transform-origin: 0 0; transform: translate(var(--tx, 0px), var(--ty, 0px)) scale(var(--ts, 1)); will-change: transform; pointer-events: none; }
.stub { position: fixed; z-index: 30; right: var(--m); bottom: var(--m); display: flex; text-decoration: none; font-size: 15px; line-height: 1; opacity: 0; visibility: hidden; transform: translateY(8px); transition: opacity 0.25s var(--ease), transform 0.25s var(--ease), visibility 0s linear 0.25s; }
.stub.on { opacity: 1; visibility: visible; transform: none; transition-delay: 0s; }
.stub-name, .stub-act { padding: 14px 18px; font-weight: 700; line-height: 1; }
.stub-name { background: var(--ink); color: var(--bg); }
.stub-act { background: var(--accent); color: var(--accent-ink); font-weight: 500; }

/* Sections ------------------------------------------------------------ */
main h2 { font-size: var(--step-head); font-weight: 500; line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 36px; }
.work, .stack, .about { padding-top: clamp(88px, 10vw, 150px); }
.role { margin-bottom: clamp(64px, 8vw, 110px); display: flex; flex-direction: column; gap: 1em; }
.role h3 { font-size: clamp(2rem, 1.2rem + 2.4vw, 3.5rem); font-weight: 500; line-height: 1.02; letter-spacing: -0.03em; }
.role .who { color: var(--muted); font-weight: 500; }
.role .note { font-size: var(--step-small); color: var(--muted); }
.role .viz { margin-top: 8px; }
.only-narrow { display: none; }

.stack .group { margin-bottom: 36px; }
.stack .gname { color: var(--muted); font-size: var(--step-small); font-weight: 500; margin-bottom: 6px; }
.stack ul { list-style: none; padding: 0; }
.stack li { display: grid; grid-template-columns: 1fr auto; column-gap: 20px; align-items: baseline; padding: 6px 0; min-height: 36px; }
.stack .item { font-weight: 500; }
.stack .note { color: var(--muted); font-size: var(--step-small); text-align: right; max-width: 24ch; }

.about { display: flex; flex-direction: column; gap: 1.1em; }
.mini { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; object-position: 50% 20%; margin-bottom: 10px; }
mark { background: color-mix(in srgb, var(--accent) 30%, transparent); color: inherit; padding: 0 0.15em; }
.sign { display: flex; flex-direction: column; gap: 2px; margin-top: 0.6em; }
.sign em { font-size: 22px; font-style: italic; }
.sign span { font-size: var(--step-small); color: var(--muted); }

/* Connect: one field in the accent colour, running to the right edge of the page */
.connect { margin-top: clamp(88px, 10vw, 150px); padding-block: clamp(48px, 6vw, 88px); background: var(--accent); color: var(--accent-ink); }
.connect h2 { margin-bottom: 16px; }
.connect p { max-width: 36ch; }
.connect .links { margin-top: 28px; display: flex; gap: 20px; align-items: center; flex-wrap: wrap; max-width: none; }
.connect .btn { background: var(--accent-ink); color: var(--accent); }
.connect .textlink { margin: 0; }

.end { padding-block: 40px 36px; font-size: var(--step-small); color: var(--muted); display: flex; flex-direction: column; gap: 10px; }
.end a { color: var(--ink); }

/* Diagrams (labelled as illustrations by their titles) and the demo ------ */
.viz { display: flex; flex-direction: column; gap: 14px; padding: clamp(18px, 2.2vw, 32px); background: var(--surface); color: var(--ink); }
.viz-title { font-weight: 700; }
.viz-note { font-size: var(--step-small); color: var(--muted); }
.bars { display: flex; flex-direction: column; gap: 14px; }
.bar-row { display: grid; grid-template-columns: 4.5em 1fr; align-items: center; gap: 12px; font-weight: 500; }
.bar-row i { display: block; height: 44px; width: var(--w); background: var(--accent); }
.steps { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.steps li { display: grid; grid-template-columns: 8.5em 1fr; gap: 12px; padding: 12px 14px; background: var(--bg); font-weight: 500; line-height: 1.3; overflow-wrap: break-word; }
.steps li span:first-child { font-weight: 700; }
.steps li.rule { background: var(--accent); color: var(--accent-ink); }
.hops { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.hops li { display: grid; grid-template-columns: 8em 1fr 3.4em; align-items: center; gap: 12px; font-weight: 500; }
.hops i { display: block; height: 26px; }
.hops i::before { content: ""; display: block; height: 100%; width: var(--w); background: var(--accent); }
.hops b { text-align: right; font-variant-numeric: tabular-nums; }

.dispenser { display: flex; flex-direction: column; gap: 16px; padding: clamp(18px, 2.2vw, 32px); background: var(--surface); color: var(--ink); }
.bucket { display: flex; gap: 8px; }
.chip { width: 40px; height: 40px; background: var(--accent); transition: background-color 0.25s var(--ease), transform 0.25s var(--ease); }
.chip.empty { background: var(--chip-off); transform: scale(0.82); }
.bucket-label { font-weight: 500; font-variant-numeric: tabular-nums; }
.dispenser .btn { align-self: flex-start; }
.tickets { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 6px; margin-top: auto; font-size: var(--step-small); font-variant-numeric: tabular-nums; }
.ticket { display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; background: var(--bg); color: var(--ink); font-weight: 500; animation: ticket-in 0.3s var(--ease); }
.ticket.deny { background: var(--deny); color: var(--deny-ink); }
.fallback { margin-top: auto; }
html.js .fallback { display: none; }
@keyframes ticket-in { from { transform: translateY(-8px); opacity: 0; } to { transform: none; opacity: 1; } }

/* Entrances: set up by motion.js, only when motion is allowed -------------- */
html.anim .rv { opacity: 0; transform: translateY(24px); transition: opacity 0.7s var(--ease) calc(var(--d, 0) * 80ms), transform 0.7s var(--ease) calc(var(--d, 0) * 80ms); }
html.anim .rv.in { opacity: 1; transform: none; }

/* The 404 page ------------------------------------------------------- */
.lost { min-height: 100svh; max-width: 40rem; margin-inline: auto; padding: var(--m); display: grid; align-content: center; justify-items: start; gap: 1.25rem; }
.lost h1 { font-size: var(--step-head); font-weight: 700; line-height: 1.05; letter-spacing: -0.02em; }

/* Phones and narrow windows: one column ----------------------------------- */
@media (max-width: 860px) {
  .split { grid-template-columns: 1fr; }
  .stage { position: relative; height: 62svh; }
  .slides { width: min(78vw, 400px); margin-top: 0; }
  .slide .dispenser { min-height: 0; }
  .stage-cap { display: none; }
  .name { top: calc(62svh + 12px); right: auto; left: var(--m); font-size: 21vw; }
  .topbar { position: absolute; top: 0; left: 0; right: 0; padding-inline: var(--m); z-index: 5; }
  .topbar nav { display: none; }
  main > section, .end { padding-inline: var(--m); }
  .intro { min-height: 0; padding-top: calc(21vw * 0.84 + 28px); }
  .only-wide { display: none; }
  .only-narrow { display: inline; }
  .steps li { grid-template-columns: 1fr; gap: 4px; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .slide, .stub, .btn, .chip { transition: none; }
  .ticket { animation: none; }
}
```

- [ ] **Step 4: Run the contrast test to verify it passes**

Run: `node --test tests/unit/contrast.test.js`
Expected: all pass (palette check, media/explicit dark equality, text pairs at least 4.5, graphics at least 3, both modes).

- [ ] **Step 5: Write the real-wheel helper**

`tests/e2e/helpers.js`:

```js
/* Scroll the way a person does: with the mouse wheel. window.scrollTo() ignores `overflow: hidden`
   on <body>, which once hid a page-wide scroll bug, so layout tests must use this. */
export async function wheelToY(page, targetY) {
  await page.mouse.move(900, 450);
  for (let i = 0; i < 80; i += 1) {
    const y = await page.evaluate(() => window.scrollY);
    const delta = targetY - y;
    if (Math.abs(delta) <= 40) return;
    await page.mouse.wheel(0, Math.sign(delta) * Math.min(500, Math.abs(delta)));
    await page.waitForTimeout(60);
  }
  throw new Error(`could not wheel to ${targetY}`);
}

/* Where each role starts, in page coordinates. */
export const roleTops = (page) =>
  page.evaluate(() => [...document.querySelectorAll('.role')].map((r) => Math.round(r.getBoundingClientRect().top + window.scrollY)));
```

- [ ] **Step 6: Write the failing browser tests for scrolling and layout**

`tests/e2e/stage.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { wheelToY } from './helpers.js';

const SIZES = [[1920, 1080], [1440, 900], [1280, 720], [1024, 768], [861, 700], [820, 1180], [390, 844], [320, 700]];

test.describe('Scrolling and layout (Review Focus 1)', () => {
  for (const [width, height] of SIZES) {
    test(`the mouse wheel scrolls the page, and nothing scrolls sideways, at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await page.waitForTimeout(400);
      await wheelToY(page, 600);
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0);
    });
  }

  test('the stage stays pinned while the reader scrolls (wide screens)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await wheelToY(page, 2000);
    const stage = await page.locator('.stage').boundingBox();
    expect(Math.round(stage.y)).toBe(0);
    expect(Math.round(stage.height)).toBe(900);
    expect(Math.round(stage.width)).toBeGreaterThan(650);
  });

  test('on a phone the stage is a block at the top that scrolls away', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await wheelToY(page, 1500);
    const stage = await page.locator('.stage').boundingBox();
    expect(stage.y).toBeLessThan(0);
  });
});
```

- [ ] **Step 7: Update `visitors.spec.js` to the new hooks**

In `tests/e2e/visitors.spec.js`:

- In the JavaScript-off test, replace

```js
    await expect(page.locator('.folder .text').first()).toBeVisible();
    expect(await page.locator('.folder .text').first().evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await expect(page.locator('#stack details[open]')).toHaveCount(4);
```

with

```js
    await expect(page.locator('.role').first()).toBeVisible();
    expect(await page.locator('.role').first().evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await expect(page.locator('#stack .group')).toHaveCount(4);
```

- In the reduced-motion test, replace the selector list `['.folder .text', '#stack .bar', '#about .sheet', '#connect .coupon']` with `['.role', '#stack .group', '#about', '#connect']`.

- [ ] **Step 8: Run the whole e2e suite**

Run: `npm run test:e2e`
Expected: PASS for the eight wheel/overflow tests, the pinned-stage test, the phone test, the demo specs, the 404 spec and the visitors specs. (If the 320px overflow test fails, a section is wider than the screen: find it with the debugging snippet in Step 9.)

- [ ] **Step 9: If a size overflows, find the element (debugging only; skip if Step 8 was green)**

Create a throwaway script outside the repo, for example `/tmp/overflow.mjs` (use the session scratchpad if one is provided), with this content, and run it with the failing width and height as arguments:

```js
import { chromium } from '/Users/saimanoj/claude_working_dir/saimanoj-site/node_modules/playwright/index.mjs';
const [width, height] = process.argv.slice(2).map(Number);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width, height } });
await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
const offenders = await page.evaluate(() =>
  [...document.querySelectorAll('body, body *')]
    .filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX === 'visible' && el.clientWidth > 0)
    .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)} scrollWidth=${el.scrollWidth} clientWidth=${el.clientWidth}`));
console.log(offenders.join('\n') || 'no element overflows its own box');
await browser.close();
```

Start the server first with `node scripts/serve-dist.mjs 4321 &` (and `kill %1` afterwards), then run `node /tmp/overflow.mjs 320 700`. Fix the named element's width or font size in `global.css`, then rerun Step 8.

- [ ] **Step 10: Commit**

```bash
git add src/styles/global.css tests/unit/contrast.test.js tests/e2e/helpers.js tests/e2e/stage.spec.js tests/e2e/visitors.spec.js
git commit -m "Rewrite the stylesheet for the split stage; test colours and real-wheel scrolling" -m "Claude-Session: https://claude.ai/code/session_01JGxmMQ6Vsu1QyZGeiHApX6"
```

---

### Task 5: Light / Dark / System theme

System is plain CSS. The two overrides set `data-theme` on `<html>`. A tiny inline script in `<head>` applies a stored choice before first paint (no flash), and also sets the `swap` class on wide screens before first paint so the inline diagrams never flash and then vanish.

**Files:**
- Create: `src/components/ThemeSwitch.astro`, `src/scripts/theme.js`
- Modify (replace entirely): `src/layouts/Base.astro`
- Modify: `src/components/TopBar.astro`
- Test: create `tests/dist/theme.test.js`, `tests/e2e/theme.spec.js`; modify `tests/dist/head.test.js`

**Interfaces:**
- Consumes: the tokens and `.theme` styles from Task 4.
- Produces: `html[data-theme="light" | "dark"]` (absent means System); `localStorage` key `theme` with value `light` or `dark` (absent means System); `html.js`; `html.swap` set pre-paint when `matchMedia('(min-width: 861px)')` matches; `meta[name="theme-color"][data-scheme]` pair kept in step with the override.

- [ ] **Step 1: Write the failing built-HTML test**

`tests/dist/theme.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { doc, html } from './helpers.js';

const astro = new URL('../../dist/_astro/', import.meta.url);
const allCss = [html, ...readdirSync(astro).filter((f) => f.endsWith('.css')).map((f) => readFileSync(new URL(f, astro), 'utf8'))].join('\n');
const headScript = () => [...doc.querySelectorAll('head script')].map((s) => s.textContent).find((t) => t.includes('localStorage')) ?? '';

test('the switch is a fieldset of three radios, System first and checked', () => {
  const fieldset = doc.querySelector('.topbar fieldset.theme');
  assert.ok(fieldset, 'a theme fieldset in the top bar');
  assert.equal(fieldset.querySelector('legend').textContent.trim(), 'Theme');
  const radios = [...fieldset.querySelectorAll('input[type="radio"][name="theme"]')];
  assert.deepEqual(radios.map((r) => r.value), ['system', 'light', 'dark']);
  assert.deepEqual(radios.filter((r) => r.hasAttribute('checked')).map((r) => r.value), ['system']);
});

test('the head script reads the stored choice before first paint, safely', () => {
  const script = headScript();
  assert.match(script, /classList\.add\('js'\)/);
  assert.match(script, /localStorage\.getItem\('theme'\)/);
  assert.match(script, /setAttribute\('data-theme'/);
  assert.match(script, /try\s*{/, 'storage access is inside try/catch');
  assert.match(script, /min-width: 861px/, 'sets the swap class before first paint');
});

test('the colour scheme and theme-color metas exist for both modes', () => {
  assert.equal(doc.querySelector('meta[name="color-scheme"]').getAttribute('content'), 'light dark');
  const colors = [...doc.querySelectorAll('meta[name="theme-color"]')];
  assert.deepEqual(colors.map((m) => [m.getAttribute('data-scheme'), m.getAttribute('content'), m.getAttribute('media')]), [
    ['light', '#f1ebdc', '(prefers-color-scheme: light)'],
    ['dark', '#472913', '(prefers-color-scheme: dark)'],
  ]);
});

test('the built stylesheet defines both palettes', () => {
  assert.match(allCss, /prefers-color-scheme:\s*dark/);
  assert.match(allCss, /data-theme=["']?dark/);
  assert.match(allCss, /data-theme=["']?light/);
});

test('the 404 page applies the stored theme too', () => {
  const { document: lost } = parseHTML(readFileSync(new URL('../../dist/404.html', import.meta.url), 'utf8'));
  const script = [...lost.querySelectorAll('head script')].map((s) => s.textContent).find((t) => t.includes('localStorage'));
  assert.ok(script, 'the 404 page has the head script');
  assert.equal(lost.querySelectorAll('fieldset.theme').length, 0, 'but no switch on the 404 page');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run build && node --test tests/dist/theme.test.js`
Expected: FAIL (`a theme fieldset in the top bar`).

- [ ] **Step 3: Write the base layout with the head script and metas**

Replace `src/layouts/Base.astro` with:

```astro
---
import '../styles/fonts.generated.css';
import '../styles/global.css';
import { site } from '../data/site.js';

const { title = site.title, description = site.description, notFound = false } = Astro.props;
const canonical = new URL('/', site.url).href;
const ogImage = new URL('/og.jpg', site.url).href;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta name="color-scheme" content="light dark" />
    <meta name="theme-color" content="#f1ebdc" media="(prefers-color-scheme: light)" data-scheme="light" />
    <meta name="theme-color" content="#472913" media="(prefers-color-scheme: dark)" data-scheme="dark" />
    {notFound ? <meta name="robots" content="noindex" /> : <link rel="canonical" href={canonical} />}
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={site.shareDescription} />
    {!notFound && <meta property="og:url" content={canonical} />}
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Sai Manoj, senior software engineer, with a small portrait" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content={ogImage} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="preload" href="/fonts/general-sans-500.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/general-sans-700.woff2" as="font" type="font/woff2" crossorigin />
    <script is:inline>
      (function () {
        var root = document.documentElement;
        root.classList.add('js');
        // The stage is pinned from 861px up (global.css switches at 860px). Set before first paint so the
        // inline diagrams never flash and then disappear.
        if (window.matchMedia('(min-width: 861px)').matches) root.classList.add('swap');
        // Apply a stored theme before first paint. Storage can throw or hold junk: ignore both.
        try {
          var theme = localStorage.getItem('theme');
          if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
        } catch (e) {}
      })();
    </script>
  </head>
  <body>
    {!notFound && <a class="skip" href="#work">Skip to experience</a>}
    <slot />
  </body>
</html>
```

- [ ] **Step 4: Write the switch and its script**

`src/components/ThemeSwitch.astro`:

```astro
<fieldset class="theme">
  <legend>Theme</legend>
  <label><input type="radio" name="theme" value="system" checked /><span>System</span></label>
  <label><input type="radio" name="theme" value="light" /><span>Light</span></label>
  <label><input type="radio" name="theme" value="dark" /><span>Dark</span></label>
</fieldset>
<script>
  import '../scripts/theme.js';
</script>
```

`src/scripts/theme.js`:

```js
/* The Light / Dark / System switch. System is plain CSS (prefers-color-scheme), so it needs no code and
   follows the OS live. This file handles the two overrides: it sets data-theme on <html>, remembers the
   choice, and keeps the theme-color metas in step. The head script in Base.astro applies a stored choice
   before first paint; this runs afterwards and wires up the radios. */
const root = document.documentElement;
const KEY = 'theme';
const COLOR = { light: '#f1ebdc', dark: '#472913' };

function read() {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function write(value) {
  try {
    if (value === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, value);
  } catch {
    /* storage is blocked: the choice lasts until the page is closed */
  }
}

function themeColor(value) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    const scheme = meta.getAttribute('data-scheme');
    if (value === 'system') {
      meta.setAttribute('content', COLOR[scheme]);
      meta.setAttribute('media', `(prefers-color-scheme: ${scheme})`);
    } else {
      meta.setAttribute('content', COLOR[value]);
      meta.removeAttribute('media');
    }
  });
}

function apply(value) {
  if (value === 'light' || value === 'dark') root.setAttribute('data-theme', value);
  else root.removeAttribute('data-theme');
  themeColor(value);
}

const current = read();
apply(current);
document.querySelectorAll('input[name="theme"]').forEach((input) => {
  input.checked = input.value === current;
  input.addEventListener('change', () => {
    if (!input.checked) return;
    write(input.value);
    apply(input.value);
  });
});
```

Put the switch in the top bar: replace `src/components/TopBar.astro` with

```astro
---
import ThemeSwitch from './ThemeSwitch.astro';
---
<header class="topbar">
  <nav aria-label="Sections">
    <a href="#work">Experience</a>
    <a href="#stack">Tech stack</a>
    <a href="#about">About</a>
    <a href="#connect">Connect</a>
  </nav>
  <ThemeSwitch />
</header>
```

- [ ] **Step 5: Run the built-HTML tests**

Run: `npm run build && npm run test:dist`
Expected: PASS, including the five new theme tests. (`head.test.js` still passes: it checks the title, canonical, share tags and that the skip link is the first anchor.)

- [ ] **Step 6: Write the browser tests (they cover Review Focus 3)**

`tests/e2e/theme.spec.js`:

```js
import { test, expect } from '@playwright/test';

const LIGHT = 'rgb(241, 235, 220)'; // #f1ebdc
const DARK = 'rgb(71, 41, 19)'; // #472913
const bg = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const choose = (page, name) => page.locator('.theme label', { hasText: name }).click();
const themeAttr = (page) => page.evaluate(() => document.documentElement.getAttribute('data-theme'));

test.use({ viewport: { width: 1440, height: 900 } });

test('by default the page follows the OS, live', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  expect(await themeAttr(page)).toBeNull();
  expect(await bg(page)).toBe(LIGHT);
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await bg(page)).toBe(DARK);
});

test('Dark beats a light OS, Light beats a dark OS, and System gives control back to the OS', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await choose(page, 'Dark');
  expect(await themeAttr(page)).toBe('dark');
  expect(await bg(page)).toBe(DARK);

  await page.emulateMedia({ colorScheme: 'dark' });
  await choose(page, 'Light');
  expect(await themeAttr(page)).toBe('light');
  expect(await bg(page)).toBe(LIGHT);

  await choose(page, 'System');
  expect(await themeAttr(page)).toBeNull();
  expect(await bg(page)).toBe(DARK); // the OS is dark
});

test('the choice survives a reload and is applied before the page body exists (no flash)', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await choose(page, 'Dark');
  await page.addInitScript(() => {
    new MutationObserver(() => {
      if (window.__firstTheme === undefined && document.documentElement.getAttribute('data-theme')) {
        window.__firstTheme = { theme: document.documentElement.getAttribute('data-theme'), bodyExisted: !!document.body };
      }
    }).observe(document.documentElement, { attributes: true });
  });
  await page.reload();
  expect(await page.evaluate(() => window.__firstTheme)).toEqual({ theme: 'dark', bodyExisted: false });
  expect(await bg(page)).toBe(DARK);
  await expect(page.locator('.theme input[value="dark"]')).toBeChecked();
});

test('the theme-color metas follow an override', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await choose(page, 'Dark');
  const colors = await page.$$eval('meta[name="theme-color"]', (metas) => metas.map((m) => m.getAttribute('content')));
  expect(colors).toEqual(['#472913', '#472913']);
  await choose(page, 'System');
  const back = await page.$$eval('meta[name="theme-color"]', (metas) => metas.map((m) => m.getAttribute('content')));
  expect(back).toEqual(['#f1ebdc', '#472913']);
});

test('blocked or throwing storage does not break the page, and the switch still works for the visit', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const blocked = () => { throw new Error('storage blocked'); };
    Storage.prototype.getItem = blocked;
    Storage.prototype.setItem = blocked;
    Storage.prototype.removeItem = blocked;
  });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await choose(page, 'Dark');
  expect(await themeAttr(page)).toBe('dark');
  expect(await bg(page)).toBe(DARK);
  expect(errors).toEqual([]);
});

test('junk in storage is ignored', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'purple'));
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  expect(await themeAttr(page)).toBeNull();
  expect(await bg(page)).toBe(LIGHT);
  await expect(page.locator('.theme input[value="system"]')).toBeChecked();
});

test('with JavaScript off the switch is hidden and the page still follows the OS', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark', viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.theme')).toBeHidden();
  expect(await bg(page)).toBe(DARK);
  await context.close();
});
```

- [ ] **Step 7: Run the browser tests**

Run: `npm run test:e2e`
Expected: PASS, including the seven theme tests. (If "no flash" fails, the head script is running after the body starts: confirm it is inline in `<head>` and not `type="module"`.)

- [ ] **Step 8: Commit**

```bash
git add src/layouts/Base.astro src/components/ThemeSwitch.astro src/components/TopBar.astro src/scripts/theme.js tests/dist/theme.test.js tests/e2e/theme.spec.js
git commit -m "Add the Light / Dark / System theme with a no-flash head script" -m "Claude-Session: https://claude.ai/code/session_01JGxmMQ6Vsu1QyZGeiHApX6"
```

---

### Task 6: The pinned stage swaps slides as roles are read

**Files:**
- Create: `src/scripts/stage.js`
- Modify: `src/components/Stage.astro` (add the script tag)
- Test: modify `tests/e2e/stage.spec.js`; modify `tests/e2e/visitors.spec.js`

**Interfaces:**
- Consumes: `.slide[data-slide]`, `.role[data-slide]`, `#work`, `html.swap` (set pre-paint by Task 5).
- Produces: `.slide.on` moves to the slide named by the active role; `html.swap` is added or removed when the window crosses 861px.

- [ ] **Step 1: Write the failing browser tests (Review Focus 2 and 4)**

Append to `tests/e2e/stage.spec.js` (keep the existing imports and add `roleTops` to the helper import: `import { wheelToY, roleTops } from './helpers.js';`):

```js
const visibleSlides = (page) =>
  page.$$eval('.slide', (slides) =>
    slides.filter((s) => getComputedStyle(s).display !== 'none' && getComputedStyle(s).visibility === 'visible').map((s) => s.dataset.slide));
const inlineDiagramsShown = (page) =>
  page.$$eval('.role .viz', (v) => v.filter((el) => getComputedStyle(el).display !== 'none').length);

test.describe('The stage follows the role being read', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('one slide at a time: demo, memory, rewrite, traceroute, and back to the demo', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(400);
    expect(await visibleSlides(page)).toEqual(['demo']);
    expect(await inlineDiagramsShown(page)).toBe(0);

    const tops = await roleTops(page);
    const expected = ['demo', 'memory', 'rewrite', 'trace'];
    for (let i = 0; i < tops.length; i += 1) {
      await wheelToY(page, tops[i] - 300);
      await page.waitForTimeout(800); // the crossfade
      await expect(page.locator('.slide.on')).toHaveAttribute('data-slide', expected[i]);
      expect(await visibleSlides(page)).toEqual([expected[i]]);
    }

    const stackTop = await page.evaluate(() => document.getElementById('stack').getBoundingClientRect().top + window.scrollY);
    await wheelToY(page, stackTop - 100);
    await page.waitForTimeout(800);
    expect(await visibleSlides(page)).toEqual(['demo']);
  });

  test('the demo keeps its tickets while the stage shows other slides', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(400);
    await page.locator('#take').click();
    await page.locator('#take').click();
    expect(await page.locator('#tickets .ticket').count()).toBe(2);
    const tops = await roleTops(page);
    await wheelToY(page, tops[2] - 300);
    await page.waitForTimeout(800);
    expect(await visibleSlides(page)).toEqual(['rewrite']);
    await wheelToY(page, 0);
    await page.waitForTimeout(800);
    expect(await visibleSlides(page)).toEqual(['demo']);
    expect(await page.locator('#tickets .ticket').count()).toBe(2);
  });
});

test.describe('Phones and JavaScript off keep the diagrams inline', () => {
  test('a phone: no swapping, three inline diagrams, only the demo in the stage', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => document.documentElement.classList.contains('swap'))).toBe(false);
    expect(await inlineDiagramsShown(page)).toBe(3);
    expect(await visibleSlides(page)).toEqual(['demo']);
  });

  test.describe('JavaScript off on a wide screen', () => {
    test.use({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    test('the diagrams stay inline and only the demo is in the stage', async ({ page }) => {
      await page.goto('/');
      expect(await inlineDiagramsShown(page)).toBe(3);
      expect(await visibleSlides(page)).toEqual(['demo']);
      await expect(page.locator('#fallback')).toBeVisible();
    });
  });
});

test('resizing across 860px restores the inline diagrams and drops the swap, and back again (Review Focus 4)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => document.documentElement.classList.contains('swap'))).toBe(true);
  expect(await inlineDiagramsShown(page)).toBe(0);

  await page.setViewportSize({ width: 800, height: 900 });
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => document.documentElement.classList.contains('swap'))).toBe(false);
  expect(await inlineDiagramsShown(page)).toBe(3);
  expect(await visibleSlides(page)).toEqual(['demo']);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => document.documentElement.classList.contains('swap'))).toBe(true);
  expect(await inlineDiagramsShown(page)).toBe(0);
});
```

In `tests/e2e/visitors.spec.js`, inside the JavaScript-off test add (after the existing assertions):

```js
    expect(await page.locator('.role .viz:visible').count()).toBe(3);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run test:e2e -- stage.spec.js`
Expected: FAIL on `one slide at a time` (the active slide never leaves `demo`), because `stage.js` does not exist yet. The phone, JS-off and resize-restore parts may already pass or fail on the second half of the resize test (`swap` is never re-added after shrinking).

- [ ] **Step 3: Write the slide-swapping script**

`src/scripts/stage.js`:

```js
/* The pinned half shows the live demo, then swaps to the diagram of the role being read.
   It only runs where the half is pinned (861px and wider). Elsewhere, and without JavaScript, the diagrams stay
   inline in their roles. The head script in Base.astro sets `swap` before first paint; this keeps it correct
   as the window is resized. */
const root = document.documentElement;
const wide = window.matchMedia('(min-width: 861px)');
const slides = [...document.querySelectorAll('.slide')];
const roles = [...document.querySelectorAll('.role[data-slide]')];
const work = document.getElementById('work');

if (slides.length && roles.length && work) {
  let current = null;
  let ticking = false;

  function show(name) {
    if (name === current) return;
    current = name;
    slides.forEach((slide) => slide.classList.toggle('on', slide.dataset.slide === name));
  }

  /* The active role is the last one whose top has passed the middle of the screen,
     while the Experience section straddles that line. Otherwise: the demo. */
  function update() {
    ticking = false;
    if (!root.classList.contains('swap')) return;
    const middle = window.innerHeight * 0.5;
    const section = work.getBoundingClientRect();
    let active = 'demo';
    if (section.top <= middle && section.bottom > middle) {
      for (const role of roles) if (role.getBoundingClientRect().top <= middle) active = role.dataset.slide;
    }
    show(active);
  }

  function sync() {
    root.classList.toggle('swap', wide.matches);
    if (!wide.matches) show('demo');
    update();
  }

  wide.addEventListener('change', sync);
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener('resize', update);
  sync();
}
```

Add the script tag at the end of `src/components/Stage.astro`:

```astro
<script>
  import '../scripts/stage.js';
</script>
```

- [ ] **Step 4: Run the tests**

Run: `npm run build && npm run test:e2e`
Expected: PASS for all stage specs and everything before them.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/stage.js src/components/Stage.astro tests/e2e/stage.spec.js tests/e2e/visitors.spec.js
git commit -m "Swap the pinned slide to match the role being read" -m "Claude-Session: https://claude.ai/code/session_01JGxmMQ6Vsu1QyZGeiHApX6"
```

---

### Task 7: The name shrinks into the stub, and sections rise in

Everything in this task is an enhancement: with reduced motion or without JavaScript the page reads in full, the name stays where it is and the stub is never shown. The morph uses its own class on the name (`.is-fixed`) and never toggles `html.anim`, so the entrance transitions are not disturbed while the name is being measured.

**Files:**
- Modify (replace entirely): `src/scripts/motion.js`
- Modify: `src/components/Stub.astro` (no change to markup; confirm it is imported in `index.astro`, already done in Task 3)
- Test: create `tests/e2e/motion.spec.js`; modify `tests/e2e/visitors.spec.js`

**Interfaces:**
- Consumes: `#name`, `#stub`, `#connect`, `footer`, `.role`, `.group`, `.about > *`, `.connect > *`.
- Produces: `html.anim` (entrances enabled, only when motion is allowed); `.name.is-fixed` while the name travels; `.stub.on` while the stub is shown; `.rv` and `.rv.in` on entrance targets.

- [ ] **Step 1: Write the failing browser tests (Review Focus 5)**

`tests/e2e/motion.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { wheelToY } from './helpers.js';

test.use({ viewport: { width: 1440, height: 900 } });

const state = (page) =>
  page.evaluate(() => {
    const stub = document.getElementById('stub');
    const name = document.getElementById('name');
    const box = stub.getBoundingClientRect();
    return {
      stubOn: stub.classList.contains('on'),
      stubVisibility: getComputedStyle(stub).visibility,
      stubBox: [box.left, box.top, box.right, box.bottom].map(Math.round),
      nameVisibility: getComputedStyle(name).visibility,
      nameFixed: name.classList.contains('is-fixed'),
    };
  });

test('the name sits at the bottom of the first screen, then becomes the stub at the bottom right', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);
  let s = await state(page);
  expect(s.stubOn).toBe(false);
  expect(s.stubVisibility).toBe('hidden');
  expect(s.nameVisibility).toBe('visible');

  await wheelToY(page, 900);
  await page.waitForTimeout(500);
  s = await state(page);
  expect(s.stubOn).toBe(true);
  expect(s.nameVisibility).toBe('hidden');
  const [, , right, bottom] = s.stubBox;
  expect(right).toBeGreaterThan(1440 - 80);
  expect(right).toBeLessThanOrEqual(1440);
  expect(bottom).toBeGreaterThan(900 - 80);
  expect(bottom).toBeLessThanOrEqual(900);
});

test('the stub steps aside over Connect and cannot take keyboard focus while hidden', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);
  await wheelToY(page, 900);
  await page.waitForTimeout(400);
  expect((await state(page)).stubOn).toBe(true);
  await page.evaluate(() => document.getElementById('connect').scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(500);
  const s = await state(page);
  expect(s.stubOn).toBe(false);
  expect(s.stubVisibility).toBe('hidden');
  expect(await page.evaluate(() => { document.getElementById('stub').focus(); return document.activeElement.id; })).not.toBe('stub');
});

test('sections rise in once as they are scrolled to', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);
  const last = page.locator('.role').last();
  expect(await last.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
  await last.scrollIntoViewIfNeeded();
  await expect(last).toHaveClass(/\bin\b/);
  await page.waitForTimeout(1500); // the 0.7s rise plus its stagger delay
  expect(await last.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
});

test.describe('Reduced motion (Review Focus 5)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the name never moves, the stub never appears, and everything is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => document.documentElement.classList.contains('anim'))).toBe(false);
    await wheelToY(page, 1200);
    await page.waitForTimeout(400);
    const s = await state(page);
    expect(s.nameFixed).toBe(false);
    expect(s.stubOn).toBe(false);
    expect(s.stubVisibility).toBe('hidden');
    for (const selector of ['.role', '#stack .group', '#about', '#connect']) {
      expect(await page.locator(selector).first().evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    }
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run test:e2e -- motion.spec.js`
Expected: FAIL (the stub never becomes `on`, because the old `motion.js` still targets the removed card).

- [ ] **Step 3: Rewrite the motion script**

Replace `src/scripts/motion.js` with:

```js
/* Motion: the name shrinks into the stub, and the parts of each section rise in once.
   Everything here is an enhancement: without JavaScript, or with reduced motion, the page reads in full,
   the name stays where it is and the stub is never shown. */
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* Entrances: each part rises 24px and fades in once, a beat after its neighbour. */
function entrances() {
  const groups = [['.work', '.role'], ['.stack', '.group'], ['.about', ':scope > *'], ['.connect', ':scope > *']];
  const targets = [];
  for (const [parentSelector, childSelector] of groups) {
    const parent = document.querySelector(parentSelector);
    if (!parent) continue;
    parent.querySelectorAll(childSelector).forEach((el, i) => {
      el.classList.add('rv');
      el.style.setProperty('--d', String(Math.min(i, 4)));
      targets.push(el);
    });
  }
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('in'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          observer.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  targets.forEach((el) => observer.observe(el));
}

/* The name runs along the bottom of the first screen; scrolling shrinks it into the stub at the bottom right.
   The name gets its own `.is-fixed` class so html.anim (the entrances) is never toggled while measuring. */
function nameToStub() {
  const name = document.getElementById('name');
  const stub = document.getElementById('stub');
  if (!name || !stub) return;

  let x0, y0, x1, y1, s1, vh;
  let hideStub = false;
  let ticking = false;

  function measure() {
    name.classList.remove('is-fixed');
    name.style.removeProperty('--ts');
    const rect = name.getBoundingClientRect();
    const vw = window.innerWidth;
    vh = window.innerHeight;
    name.classList.add('is-fixed');
    const margin = clamp(vw * 0.022, 16, 32);
    const stubWidth = vw < 860 ? 140 : 200;
    s1 = stubWidth / rect.width;
    x0 = rect.left;
    y0 = rect.top;
    x1 = vw - margin - stubWidth;
    y1 = vh - margin - rect.height * s1 - 14;
    update();
  }

  function update() {
    ticking = false;
    const p = clamp(window.scrollY / (vh * 0.6), 0, 1);
    const e = ease(p);
    name.style.setProperty('--tx', lerp(x0, x1, e).toFixed(1) + 'px');
    name.style.setProperty('--ty', lerp(y0, y1, e).toFixed(1) + 'px');
    name.style.setProperty('--ts', lerp(1, s1, e).toFixed(4));
    name.style.visibility = p >= 1 ? 'hidden' : '';
    stub.classList.toggle('on', p >= 0.98 && !hideStub);
  }

  /* The stub points at Connect, so it steps aside while Connect or the footer is on screen. */
  if ('IntersectionObserver' in window) {
    const seen = {};
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { seen[e.target.id || e.target.tagName] = e.isIntersecting; });
        hideStub = !!(seen.connect || seen.FOOTER);
        update();
      },
      { threshold: 0.05 },
    );
    const connect = document.getElementById('connect');
    const footer = document.querySelector('footer');
    if (connect) observer.observe(connect);
    if (footer) observer.observe(footer);
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  measure();
}

if (!reduce) {
  root.classList.add('anim');
  entrances();
  nameToStub();
}
```

- [ ] **Step 4: Run the whole browser suite**

Run: `npm run build && npm run test:e2e`
Expected: PASS everywhere, including the four motion tests and the existing keyboard walk (it must still land on `button#take` and on no invisible element; the theme radios are clipped, not transparent, so they pass).

- [ ] **Step 5: Commit**

```bash
git add src/scripts/motion.js tests/e2e/motion.spec.js
git commit -m "Shrink the name into the stub and let sections rise in, with reduced-motion fallbacks" -m "Claude-Session: https://claude.ai/code/session_01JGxmMQ6Vsu1QyZGeiHApX6"
```

---

### Task 8: Share image, favicon, 404, README

**Files:**
- Modify: `og/og-card.html`, `public/favicon.svg`, `README.md`
- Regenerate (by `npm run assets`): `public/og.jpg`, `public/favicon-32.png`, `public/apple-touch-icon.png`
- Test: modify `tests/dist/assets.test.js`, `tests/dist/not-found.test.js`

- [ ] **Step 1: Write the failing asset tests**

Append to `tests/dist/assets.test.js`:

```js
test('the favicon follows the colour scheme', () => {
  const svg = readFileSync(dist('favicon.svg'), 'utf8');
  assert.match(svg, /prefers-color-scheme:\s*dark/);
  assert.doesNotMatch(svg, /#0c3a40|#f1d2b6/i, 'no colours from the old apricot and teal palette');
});

test('the share image uses the dark palette, not the old apricot ground', async () => {
  const { data } = await sharp(fileURLToPath(dist('og.jpg'))).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  // the average colour of a mostly tobacco-brown card is dark and warm; the old apricot card was light
  const [r, g, b] = data;
  assert.ok(r + g + b < 3 * 128, `average colour ${r},${g},${b} should be dark`);
});
```

Append to `tests/dist/not-found.test.js`:

```js
test('it uses the new design tokens, not a hard-coded palette', () => {
  assert.doesNotMatch(html, /#f1d2b6|#0c3a40/i);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run build && node --test tests/dist/assets.test.js tests/dist/not-found.test.js`
Expected: FAIL on the favicon test (`prefers-color-scheme`) and on the share image (the old apricot card is light).

- [ ] **Step 3: Replace the favicon (light and dark via an internal media query)**

`public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <style>
    rect { fill: #2b170a; }
    text { fill: #f1ebdc; }
    @media (prefers-color-scheme: dark) {
      rect { fill: #c79a3e; }
      text { fill: #2b170a; }
    }
  </style>
  <rect width="64" height="64"/>
  <text x="32" y="44" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="34">SM</text>
</svg>
```

- [ ] **Step 4: Restyle the share image source**

In `og/og-card.html`, change the three colour values: `background: #f1d2b6; color: #0c3a40;` becomes `background: #472913; color: #e4e0cf;`, and in the `img` rule `background: #ebc6a4;` becomes `background: #55321a;`. Nothing else changes.

- [ ] **Step 5: Regenerate the assets and look at the share image**

Run: `npm run assets`
Expected: `make-assets: images, favicons and share image written to public/`. Then open `public/og.jpg` (for example with the file viewer) and confirm: tobacco-brown ground, bone-coloured "Sai Manoj" and "Senior software engineer", small portrait on the right, no email, 1200 x 630.

- [ ] **Step 6: Update the README**

Replace the last bullet of `README.md` (`- Design and plan: ...`) with:

```md
- Design and plan: `docs/superpowers/specs/2026-10-20-stage-redesign-design.md` and `docs/superpowers/plans/2026-10-20-stage-redesign.md`
- Visual reference: `design/directions/stage/` (the approved prototype)
- Browser tests also run in Firefox and WebKit: `npx playwright install firefox webkit`, then `ALL_BROWSERS=1 npm run test:e2e`
```

- [ ] **Step 7: Run everything**

Run: `npm test && npm run build && npm run test:dist && npm run test:e2e`
Expected: all green.

- [ ] **Step 8: Commit**

```bash
git add og/og-card.html public README.md tests/dist
git commit -m "Restyle the favicon and share image for the new palette" -m "Claude-Session: https://claude.ai/code/session_01JGxmMQ6Vsu1QyZGeiHApX6"
```

---

### Task 9: Cross-browser tests and the quality gates

**Files:**
- Modify: `playwright.config.js`
- No product code unless a gate fails (then fix in the owning task's file and add a regression test).

- [ ] **Step 1: Add optional Firefox and WebKit projects**

Replace `playwright.config.js` with:

```js
import { defineConfig, devices } from '@playwright/test';

// `npm run test:e2e` builds first, then serves dist/ with scripts/serve-dist.mjs. It is a single
// process so Playwright can stop it; a leftover server would be reused by the next run and
// silently test a stale build, so reuse is off and a busy port fails loudly.
// Chrome is the default. ALL_BROWSERS=1 also runs Firefox and WebKit (npx playwright install firefox webkit).
const all = process.env.ALL_BROWSERS === '1';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4321' },
  projects: [
    { name: 'chrome', use: { channel: 'chrome' } },
    ...(all
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]
      : []),
  ],
  webServer: {
    command: 'node scripts/serve-dist.mjs 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
```

- [ ] **Step 2: Install the other browsers and run the suite in all three**

Run: `npx playwright install firefox webkit && npm run build && ALL_BROWSERS=1 npx playwright test`
Expected: every test passes in chrome, firefox and webkit. If one engine fails, treat it as a real finding: fix the cause (not the test), add a regression test, and rerun. Likely suspects: `100svh` and `position: sticky` (need Safari 15.4+), `color-mix()` (Safari 16.2+, Firefox 113+), `text-wrap: balance` (cosmetic only, safe to ignore if absent).

- [ ] **Step 3: Run the complete test suite once more, from a clean build**

Run: `rm -rf dist && npm test && npm run build && npm run test:dist && npm run test:e2e`
Expected: all green. Record the counts.

- [ ] **Step 4: Run the taste-skill gate on the built page**

Run (in two terminals, or background the first):

```bash
node scripts/serve-dist.mjs 4321 &
S=/Users/saimanoj/.claude-account2/skills/design-taste-frontend
node $S/scripts/lint.mjs src
node $S/scripts/inspect.mjs http://localhost:4321/
kill %1
```

Expected: lint reports no banned patterns. The inspector's FAILs are limited to the accepted items: `few-pictures` (Sai chose to show fewer) and, if present, `still-page` should not appear now that entrances exist. Record anything else; each remaining FAIL blocks the release until fixed or explicitly accepted by Sai. WARNs to expect and accept: `size-count`, `no-footage`.

- [ ] **Step 5: Lighthouse on mobile (light), and a dark-mode visual and contrast check**

With `node scripts/serve-dist.mjs 4321` running, run the Chrome DevTools MCP `lighthouse_audit` tool on `http://localhost:4321/` in mobile mode. Target: performance, accessibility, best practices and SEO each at least 95. The tool cannot force a dark colour scheme, so dark mode is covered by `tests/unit/contrast.test.js` (every text pair at least 4.5:1) and by a screenshot review: with `emulateMedia({ colorScheme: 'dark' })` at 1440, 768 and 390 px, look at the first screen, a role with each diagram, the Connect field and the footer, and confirm nothing is unreadable. If performance is under 95, the likely cause is the stage photo: check its size in the Network panel and lower the JPEG quality in `scripts/make-assets.mjs`.

- [ ] **Step 6: Manual checks that cannot be automated**

Do each and tick it off: a real phone (Safari on iOS or Chrome on Android) in both themes, scrolling the whole page; Safari on a Mac; keyboard only, top to bottom (the skip link works, focus is always visible, the stub is not reachable while hidden); JavaScript off (the page reads in full); 1024 px and 1280 px wide windows (the stage still looks right at about 47% width); `git ls-files | grep -i woff` prints nothing; and a link-preview check of the share image.

- [ ] **Step 7: Commit the config change**

```bash
git add playwright.config.js
git commit -m "Run the browser tests in Firefox and WebKit on request" -m "Claude-Session: https://claude.ai/code/session_01JGxmMQ6Vsu1QyZGeiHApX6"
```

---

### Task 10: Preview and release (needs Sai's approval at each step marked STOP)

No agent action in this task changes anything outside the local branch without Sai's explicit yes in chat at that step. DNS is never touched.

- [ ] **Step 1: STOP. Ask Sai to approve pushing the branch**

Say: "The redesign is built and the gates are green. May I push `redesign` to GitHub? That creates a Cloudflare Pages preview and changes nothing on the live site." Wait for a yes.

- [ ] **Step 2: Push the branch**

Run: `git push -u origin redesign`
Expected: the branch appears on GitHub and Cloudflare Pages starts a preview build.

- [ ] **Step 3: STOP. Hand Sai the click for public previews**

Cloudflare settings are Sai's to change. Send this note and wait for confirmation: "To make previews public: in the Cloudflare dashboard open Zero Trust, Access, Applications and delete (or loosen) the application that protects `*.saimanoj-site.pages.dev`. If it is the Pages built-in policy instead, open Workers & Pages, the `saimanoj-site` project, Settings, General, Access policy, and turn it off. Tell me when it is done."

- [ ] **Step 4: Verify the preview**

Find the preview URL in the Cloudflare Pages deployments list (it looks like `https://redesign.saimanoj-site.pages.dev`). Run:

```bash
curl -sI https://redesign.saimanoj-site.pages.dev/ | grep -i -E 'HTTP/|x-robots-tag'
```

Expected: `HTTP/2 200` and `x-robots-tag: noindex` (Pages sets this on previews). If `x-robots-tag` is missing, ask Sai before sharing the link, and add `X-Robots-Tag: noindex` for the preview host in `public/_headers` in a follow-up commit. Then open the preview on a laptop and a phone, in both themes, and confirm it looks the same as local.

- [ ] **Step 5: STOP. Sai reviews the preview**

Send Sai the preview link and wait. Apply any changes they ask for as new commits on `redesign` (each with its own test where behaviour changes), rerun Task 9 Steps 3 to 5, and push again.

- [ ] **Step 6: STOP. Ask for the go-ahead to ship**

Say: "Preview approved? May I merge `redesign` into `master`? Cloudflare will redeploy production; DNS is not touched." Wait for an explicit yes.

- [ ] **Step 7: Merge**

Run:

```bash
git switch master
git merge --ff-only redesign
git push origin master
```

Expected: a fast-forward merge (no merge commit) and Cloudflare redeploys production from `master`. If the merge is not a fast-forward, stop and tell Sai why before doing anything else.

- [ ] **Step 8: Verify production**

Run: `curl -sI https://saimanoj.com/ | head -3` (expect `HTTP/2 200`), then open `https://saimanoj.com/` in a browser and check the stage, the slide swap, the stub and the theme switch; confirm `curl -sI https://saimanoj.com/ | grep -i x-robots-tag` prints nothing (production must stay indexable); then run Lighthouse mobile on the production URL and record the scores.

- [ ] **Step 9: Rollback, only if something is wrong in production**

Preferred (instant): in Cloudflare, Workers & Pages, `saimanoj-site`, Deployments, find the last good production deployment and choose Rollback to this deployment. Or, in git: `git revert -m 1 <merge-sha>` is not needed for a fast-forward; instead `git revert <first-redesign-commit>^..<last-redesign-commit>` then push `master`. The Jekyll fallback (`jekyll-rollback` branch, `jekyll-final` tag) remains as the deeper fallback. Tell Sai before doing either.
