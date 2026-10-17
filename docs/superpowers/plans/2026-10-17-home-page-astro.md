# saimanoj.com home page (Astro on Cloudflare Pages) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Jekyll home page at saimanoj.com with a static Astro site that ports the approved "ticketed object" prototype, is reviewed on a private Cloudflare Pages preview, and is cut over only after Sai approves.

**Architecture:** A static Astro site (no server code). All page text lives in one data file (`src/data/site.js`); section components render from it. The token-bucket demo is a pure module (`bucket.js`) with a thin DOM layer (`limiter.js`). Fonts are downloaded unmodified at build time and never committed. Hosting is Cloudflare Pages; the production branch is `release`, so every `astro` build is a preview behind Cloudflare Access.

**Tech Stack:** Node 24, Astro 7.4.0 (static output), plain JavaScript and CSS, `node:test` for unit and built-HTML tests, `linkedom` for reading built HTML, `@playwright/test` 1.64.1 (system Chrome) for browser tests, `sharp` 0.35.5 for image processing, Cloudflare Pages and Cloudflare Access.

**Spec:** `docs/superpowers/specs/2026-10-17-home-page-astro-design.md` (read it first; this plan implements it).

## Global Constraints

Every task's requirements include these. Values are copied from the spec and from Sai's instructions.

- Astro with `output: 'static'`. No server code, no adapter, no database.
- Plain JavaScript and CSS only: no TypeScript, no CSS framework.
- All page text lives in `src/data/site.js`. Illustration labels inside diagram components are also content and follow the same rules.
- The name is exactly "Sai Manoj".
- Contact is LinkedIn `https://www.linkedin.com/in/sai-manoj-kumar` and GitHub profile `https://github.com/sai-manoj-kumar` only. No email address, no resume or PDF link, no link to any individual GitHub repository.
- Experience comes from the resume source. PhonePe is not shown. No dates or durations are shown for roles.
- Never publish internal codenames (for example "Gaap", "restli"), or the duration of the rate-limit incident. The "100 million events a day" figure belongs to the three webhook delivery services; the "1 billion requests a day" figure belongs to the API Gateway; they are never merged.
- Years: "about nine years of backend experience". Never state "12+", "more than a decade" or "a decade of".
- The stack lists only: Java, Python, C#, C and C++, Kafka, Microservices and MapReduce, Azure, AWS, Cloudflare, GitHub Actions, load balancing (Application Gateway), PostgreSQL, Redis, DynamoDB, GenAI skills and plugins. No TypeScript, Dart or OAuth. iOS is not a focus of the page.
- Illustrations are always labelled as illustrations, with made-up names and numbers.
- Palette (apricot and teal): ground `#f1d2b6`, surface `#ebc6a4`, ink and dark panels `#0c3a40`, muted `#3f6468`, panel tint `#1a5058`, hero photo tint `#6a9a9e`, hover `#24626a`. Type: General Sans 400, 500, 700.
- Two photographs only (hero aisle photo, portrait). The hero photo credit appears in the footer only, never on the hero card.
- Fonts: General Sans (ITF Free Font License v2.0). Files are served unmodified (no subsetting, no format conversion) and are **never committed** to the public repository.
- Demo: token bucket, capacity 5, one token returns every 2000 ms, lazy refill, "Try again in Ns" counts down live.
- Node 22 or newer (`.nvmrc` is 24).
- Branches: work on `astro`. `master` (Jekyll, live) is not touched until the cutover task. Nothing is pushed, tagged or changed in Cloudflare or GitHub settings without Sai's explicit approval at that moment.
- Commits do not include a `Co-authored-by` line.

## Review Focus

Failure modes the spec implies but a straight port would not exercise. Each has a test in the task that owns the code.

1. **JavaScript off.** The page must read in full; the demo shows its plain explanation and a disabled button. (Task 7: built-HTML test; Task 9: Playwright test with JavaScript disabled.)
2. **Reduced motion.** Every section must be visible and the `anim` class must not be added. (Task 9.)
3. **Button mashing.** Thirty rapid clicks on the demo must leave at most four tickets, throw no page error, and keep the countdown sensible. (Task 9.)
4. **A 320 px phone.** No horizontal scroll. (Task 9.)
5. **Fontshare unreachable or its CSS format changes during a build.** The build must fail loudly with a clear message, never ship the fallback font silently; offline development with the files already present must still work. (Task 4.)
6. **System clock moves backwards** while the demo is open. The bucket must not throw or invent tokens. (Task 3.)

---

## File Structure

```
astro.config.mjs               Astro config (static, site URL)
package.json  .nvmrc  .gitignore  README.md
playwright.config.js           browser tests against the built site
design/prototype/              frozen snapshot of the approved prototype (reference only, not built)
scripts/fetch-fonts.mjs        downloads the official General Sans woff2 files, writes @font-face CSS
scripts/make-assets.mjs        one-off image, favicon and share-image generation
og/og-card.html                source of the share image
src/data/site.js               every line of page text
src/scripts/bucket.js          pure token bucket + denial wording
src/scripts/limiter.js         DOM glue for the demo
src/scripts/motion.js          reveals, hero card to stub choreography
src/styles/global.css          the prototype stylesheet, unchanged
src/styles/fonts.generated.css written by fetch-fonts (git-ignored)
src/layouts/Base.astro         head, skip link, slot
src/components/                Hero, Stub, Experience, Folder, TechStack, About, Connect, Footer
src/components/diagrams/       TicketDemo, MemoryBars, HeaderRewrite, Traceroute
src/pages/index.astro          composes everything
public/                        images, favicons, robots.txt, _headers (fonts are written here but git-ignored)
tests/unit/                    node:test, no build needed
tests/dist/                    node:test against the built HTML (run after npm run build)
tests/e2e/                     Playwright
```

---

### Task 1: Scaffold Astro, retire the Jekyll files on this branch, freeze the prototype

**Files:**
- Create: `package.json`, `astro.config.mjs`, `.nvmrc`, `src/pages/index.astro`, `design/prototype/` (copy), `README.md` (replace)
- Modify: `.gitignore`
- Delete (on the `astro` branch only): `Gemfile`, `_config.yml`, `_data/`, `_includes/`, `_layouts/`, `_posts/`, `_sass/`, `assets/`, `index.html`, `version.md`, `favicon.ico`, `CNAME`
- Keep: `LICENSE.txt`, `.gitattributes`, `.github/FUNDING.yml`, `docs/`

**Interfaces:**
- Produces: `npm run build` writes `dist/`; scripts `test`, `test:dist`, `test:e2e`, `preview`, `dev`; the prototype snapshot under `design/prototype/` that later tasks copy from.

- [ ] **Step 1: Confirm you are on the right branch with a clean tree**

```bash
cd /Users/saimanoj/claude_working_dir/saimanoj-site
git branch --show-current
git status --short
```
Expected: `astro`, and no output from `git status`.

- [ ] **Step 2: Freeze the prototype into the repo**

```bash
mkdir -p design/prototype
cp -R /Users/saimanoj/claude_working_dir/home-redesign/index.html \
      /Users/saimanoj/claude_working_dir/home-redesign/styles.css \
      /Users/saimanoj/claude_working_dir/home-redesign/app.js \
      /Users/saimanoj/claude_working_dir/home-redesign/assets design/prototype/
ls design/prototype design/prototype/assets
```
Expected: `app.js assets index.html styles.css` and `credits.json datacenter.jpg portrait.jpg`.

- [ ] **Step 3: Remove the Jekyll files from this branch**

```bash
git rm -r -q Gemfile _config.yml _data _includes _layouts _posts _sass assets index.html version.md favicon.ico CNAME
git status --short | head -5
```
Expected: lines starting with `D `. `master` is unaffected because this is the `astro` branch.

- [ ] **Step 4: Write the project files**

`package.json`:
```json
{
  "name": "saimanoj-site",
  "private": true,
  "type": "module",
  "version": "1.0.0",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "node --test \"tests/unit/*.test.js\"",
    "test:dist": "node --test \"tests/dist/*.test.js\"",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "astro": "7.4.0"
  },
  "devDependencies": {
    "@playwright/test": "1.64.1",
    "linkedom": "0.18.13",
    "sharp": "0.35.5"
  }
}
```

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://saimanoj.com',
  output: 'static',
});
```

`.nvmrc`:
```
24
```

`.gitignore` (replace the Jekyll entries):
```
node_modules/
dist/
.astro/
.DS_Store
test-results/
playwright-report/
# General Sans is not redistributable: fetched at build time, never committed
public/fonts/
src/styles/fonts.generated.css
```

`src/pages/index.astro`:
```astro
---
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Sai Manoj</title>
  </head>
  <body>
    <h1>Sai Manoj</h1>
  </body>
</html>
```

`README.md`:
```markdown
# saimanoj.com

Personal home page, built with Astro and hosted on Cloudflare Pages.

- Content: `src/data/site.js`
- Develop: `npm install && npm run dev`
- Build: `npm run build` (downloads the General Sans fonts first; see `scripts/fetch-fonts.mjs`)
- Test: `npm test`, then `npm run build && npm run test:dist && npm run test:e2e`
- Design and plan: `docs/superpowers/`
```

- [ ] **Step 5: Install and prove the build works**

```bash
npm install
npx astro --version
npm run build
grep -c "Sai Manoj" dist/index.html
```
Expected: `7.4.0`, a successful build, and a count of 1 or more.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Scaffold Astro, retire Jekyll files on this branch, freeze the prototype"
```

---

### Task 2: Site data and the content rules

**Files:**
- Create: `src/data/site.js`
- Test: `tests/unit/site-data.test.js`

**Interfaces:**
- Produces: `export const site` with shape
  `{ name, url, title, description, shareDescription, links: {linkedin, github}, hero: {titleWords: string[], facts: string[], sentence, cta, githubLabel, photoAlt, portraitAlt}, experience: Array<{company, project, title, tone: 'light'|'dark', visual: 'ticketDemo'|'memory'|'rewrite'|'trace', paragraphs: string[], note?: string}>, stack: Array<{title, items: Array<[string, string]>}>, about: {paragraphs: string[], closing: {before, linkText, after}, signRole, tearCta}, connect: {heading, text, linkedinLabel, githubLabel}, footer: {year: number}, photoCredit: {title, titleUrl, author, license, licenseUrl, source, note}}`

- [ ] **Step 1: Write the failing test**

`tests/unit/site-data.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { site } from '../../src/data/site.js';

const everything = JSON.stringify(site);
const experienceText = JSON.stringify(site.experience);

test('name and contact rules', () => {
  assert.equal(site.name, 'Sai Manoj');
  assert.equal(site.links.linkedin, 'https://www.linkedin.com/in/sai-manoj-kumar');
  assert.equal(site.links.github, 'https://github.com/sai-manoj-kumar');
  assert.doesNotMatch(everything, /mailto:|@[a-z0-9-]+\./i, 'no email address');
  assert.doesNotMatch(everything, /resume|curriculum|\.pdf/i, 'no resume');
  assert.doesNotMatch(everything, /github\.com\/sai-manoj-kumar\/[a-z]/i, 'no repository links');
});

test('experience has four roles with the company and project in the same fields', () => {
  assert.equal(site.experience.length, 4);
  for (const role of site.experience) {
    assert.ok(['LinkedIn', 'Microsoft'].includes(role.company), `company: ${role.company}`);
    assert.ok(role.project && role.title, 'project and title present');
    assert.ok(role.paragraphs.length > 0, 'has paragraphs');
    assert.ok(['light', 'dark'].includes(role.tone), `tone: ${role.tone}`);
    assert.ok(['ticketDemo', 'memory', 'rewrite', 'trace'].includes(role.visual), `visual: ${role.visual}`);
  }
  assert.deepEqual(
    site.experience.map((r) => r.project),
    ['Webhooks Platform', 'Defender', 'Application Gateway', 'Network Monitoring'],
  );
});

test('PhonePe is left out and roles show no dates', () => {
  assert.doesNotMatch(everything, /PhonePe|Share\.Market/i);
  assert.doesNotMatch(experienceText, /\b(19|20)\d{2}\b/, 'no years');
  assert.doesNotMatch(
    experienceText,
    /January|February|March|April|May\b|June|July|August|September|October|November|December/,
    'no months',
  );
});

test('forbidden terms never appear', () => {
  assert.doesNotMatch(everything, /OAuth|TypeScript|\bDart\b|Gaap|restli|\b12\+|decade/i);
});

test('years: nine years of backend, stated in the about letter', () => {
  assert.match(site.about.paragraphs[0], /about nine years of backend experience/);
});

test('traffic figures are never merged', () => {
  const sentences = site.experience
    .flatMap((r) => r.paragraphs)
    .join(' ')
    .split(/(?<=\.)\s+/);
  for (const s of sentences) {
    if (/1 billion/.test(s)) {
      assert.match(s, /API Gateway/, s);
      assert.doesNotMatch(s, /webhook delivery/, s);
    }
    if (/100 million/.test(s)) {
      assert.match(s, /webhook delivery services/, s);
      assert.doesNotMatch(s, /API Gateway/, s);
    }
  }
});

test('stack has four groups and the right tools', () => {
  assert.deepEqual(
    site.stack.map((g) => g.title),
    ['Backend', 'Cloud', 'Data', 'AI agent tooling'],
  );
  const stackText = JSON.stringify(site.stack);
  for (const tool of ['Azure', 'AWS', 'Cloudflare', 'PostgreSQL', 'Redis', 'DynamoDB', 'GitHub Actions', 'Kafka']) {
    assert.match(stackText, new RegExp(tool), `${tool} listed`);
  }
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test`
Expected: FAIL with `Cannot find module '.../src/data/site.js'`.

- [ ] **Step 3: Write the data file**

`src/data/site.js`:
```js
export const site = {
  name: 'Sai Manoj',
  url: 'https://saimanoj.com',
  title: 'Sai Manoj',
  description:
    'Sai Manoj is a senior software engineer in India. Backend services on public cloud, and tools for AI coding agents.',
  shareDescription: 'Senior software engineer. Backend services on public cloud, and tools for AI coding agents.',
  links: {
    linkedin: 'https://www.linkedin.com/in/sai-manoj-kumar',
    github: 'https://github.com/sai-manoj-kumar',
  },
  hero: {
    titleWords: ['Sai Manoj', 'Backend', 'Engineer'],
    facts: ['Senior software engineer', 'India', 'Java, Python, C#'],
    sentence: 'Services on public cloud. Tools for AI agents.',
    cta: 'Connect on LinkedIn',
    githubLabel: 'GitHub',
    photoAlt: 'A long aisle between white server racks in a data center in Amravati, India',
    portraitAlt: 'Portrait of Sai Manoj',
  },
  experience: [
    {
      company: 'LinkedIn',
      project: 'Webhooks Platform',
      title: 'Senior Software Engineer',
      tone: 'light',
      visual: 'ticketDemo',
      paragraphs: [
        'Sole owner and the DRI engineer for three webhook delivery services that carry about 100 million events a day. I also maintain the authentication middleware on the API Gateway, which handles about 1 billion requests a day.',
        'Designed a new retry mechanism that cut failed deliveries by 30%, and moved webhook processing to a new framework that cut latency by 25%.',
        'Built a monitoring dashboard and debugging tools for on-call, and shared GenAI skills and plugins that speed up root-cause analysis across teams.',
      ],
      note: 'The demo is a token bucket, the idea behind rate limiting at a gateway: five tokens, and a new one every two seconds.',
    },
    {
      company: 'Microsoft',
      project: 'Defender',
      title: 'Software Engineer II',
      tone: 'dark',
      visual: 'memory',
      paragraphs: [
        'Led the integration of a partner VPN into Microsoft Defender, a mobile security app, and cut its memory use by 30% to meet product requirements.',
        'Built telemetry and crash reporting for production monitoring, and an on-prem lab to validate anti-phishing detection. Wrote cross-platform test automation in Python and bash for weekly regression runs, and mentored five new hires.',
      ],
    },
    {
      company: 'Microsoft',
      project: 'Application Gateway',
      title: 'Software Engineer II',
      tone: 'light',
      visual: 'rewrite',
      paragraphs: [
        'Application Gateway is a web traffic load balancer. I led the Header Rewrite feature, which lets customers change header values as traffic is routed. I defined the public API contract, took it through design approval, and built the backend logic to run rewrites at scale on a busy gateway.',
        'Took on-call rotations, wrote troubleshooting guides, and mentored four new teammates.',
      ],
    },
    {
      company: 'Microsoft',
      project: 'Network Monitoring',
      title: 'Software Engineer',
      tone: 'dark',
      visual: 'trace',
      paragraphs: [
        "Wrote the agent for Service Connectivity Monitor in C and C++. It sends pings and traceroutes to check network connectivity and path health. I drove the agent's design and set up its unit and end-to-end tests.",
        'Built the backend for ExpressRoute monitoring with microservices and MapReduce, to process large volumes of network path data, and did the relational data modeling.',
      ],
    },
  ],
  stack: [
    {
      title: 'Backend',
      items: [
        ['Java, Python, C#', 'The languages I work in'],
        ['C and C++', 'A network monitoring agent at Microsoft'],
        ['Kafka', 'The API Gateway and the webhooks platform at LinkedIn'],
        ['Microservices, MapReduce', 'ExpressRoute monitoring at Microsoft'],
      ],
    },
    {
      title: 'Cloud',
      items: [
        ['Azure, AWS, Cloudflare', 'Where I deploy and run services'],
        ['GitHub Actions', 'CI/CD pipelines I write and fix'],
        ['Load balancing', 'Application Gateway at Microsoft'],
      ],
    },
    {
      title: 'Data',
      items: [
        ['PostgreSQL', 'Relational databases and data modeling'],
        ['Redis', 'In-memory data store'],
        ['DynamoDB', 'NoSQL database'],
      ],
    },
    {
      title: 'AI agent tooling',
      items: [['GenAI skills and plugins', 'Root-cause analysis and alert correlation for webhook workflows']],
    },
  ],
  about: {
    paragraphs: [
      "I'm a senior software engineer with about nine years of backend experience, most of it on services that run on public cloud and handle a lot of traffic.",
      "I've worked on a web traffic load balancer, network monitoring and a webhooks platform. Along the way I've mentored new hires and interviewed candidates.",
      "These days I'm building GenAI skills and plugins that help engineers debug faster.",
    ],
    closing: {
      before: "If you're hiring, or building something and want another engineer to talk to, ",
      linkText: 'say hello on LinkedIn',
      after: '.',
    },
    signRole: 'Senior software engineer',
    tearCta: 'Say hello on LinkedIn',
  },
  connect: {
    heading: 'Connect with me',
    text: 'Hiring, building something, or just curious? A message is the easiest way in.',
    linkedinLabel: 'Message me on LinkedIn',
    githubLabel: 'Find me on GitHub',
  },
  footer: { year: 2026 },
  photoCredit: {
    title: 'Racks Amravati Data Center',
    titleUrl: 'https://commons.wikimedia.org/wiki/File:Racks_Amravati_Data_Center.jpg',
    author: 'PiDatacenters',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'Wikimedia Commons',
    note: 'Shown in greyscale and tinted.',
  },
};
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/data/site.js tests/unit/site-data.test.js
git commit -m "Add site data and the content-rule tests"
```

---

### Task 3: The token bucket

**Files:**
- Create: `src/scripts/bucket.js`
- Test: `tests/unit/bucket.test.js`

**Interfaces:**
- Produces:
  - `createBucket({ capacity = 5, everyMs = 2000, now = Date.now }) -> { capacity: number, available(): number, tryTake(): {ok: true, tokensLeft: number} | {ok: false, readyAt: number} }`
  - `describeDenial(readyAt: number, t?: number) -> string` (`"Try again in Ns"` or `"Try again now"`)

- [ ] **Step 1: Write the failing tests**

`tests/unit/bucket.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBucket, describeDenial } from '../../src/scripts/bucket.js';

function clockBucket(start = 0) {
  let t = start;
  const bucket = createBucket({ capacity: 5, everyMs: 2000, now: () => t });
  return { bucket, at: (ms) => { t = ms; } };
}

test('admits five requests, then denies the sixth with the time the next token arrives', () => {
  const { bucket, at } = clockBucket(0);
  for (let i = 0; i < 5; i += 1) {
    at(i * 100);
    assert.equal(bucket.tryTake().ok, true);
  }
  at(500);
  const denied = bucket.tryTake();
  assert.equal(denied.ok, false);
  assert.equal(denied.readyAt, 2000);
});

test('one token returns every two seconds', () => {
  const { bucket, at } = clockBucket(0);
  for (let i = 0; i < 5; i += 1) bucket.tryTake();
  at(1999);
  assert.equal(bucket.available(), 0);
  at(2000);
  assert.equal(bucket.available(), 1);
  at(4000);
  assert.equal(bucket.available(), 2);
});

test('the countdown restarts from the last refill, not from the click', () => {
  const { bucket, at } = clockBucket(0);
  for (let i = 0; i < 5; i += 1) bucket.tryTake();
  at(2100);
  assert.equal(bucket.tryTake().ok, true); // the token that arrived at 2000
  at(2200);
  const denied = bucket.tryTake();
  assert.equal(denied.ok, false);
  assert.equal(denied.readyAt, 4000);
});

test('a long idle period never holds more than five tokens', () => {
  const { bucket, at } = clockBucket(0);
  at(60000);
  assert.equal(bucket.available(), 5);
});

test('taking from a full bucket starts the refill clock at that moment', () => {
  const { bucket, at } = clockBucket(0);
  at(10000);
  for (let i = 0; i < 5; i += 1) {
    at(10000 + i * 100);
    assert.equal(bucket.tryTake().ok, true);
  }
  at(10500);
  assert.equal(bucket.tryTake().readyAt, 12000);
});

test('a clock that moves backwards neither throws nor invents tokens', () => {
  const { bucket, at } = clockBucket(1000);
  for (let i = 0; i < 5; i += 1) bucket.tryTake();
  at(500);
  assert.doesNotThrow(() => bucket.available());
  assert.equal(bucket.available(), 0);
  assert.equal(bucket.tryTake().ok, false);
});

test('describeDenial rounds up to whole seconds and says "now" when ready', () => {
  assert.equal(describeDenial(2000, 500), 'Try again in 2s');
  assert.equal(describeDenial(2000, 1999), 'Try again in 1s');
  assert.equal(describeDenial(2000, 1000), 'Try again in 1s');
  assert.equal(describeDenial(2000, 2000), 'Try again now');
  assert.equal(describeDenial(2000, 2500), 'Try again now');
});
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npm test`
Expected: FAIL with `Cannot find module '.../src/scripts/bucket.js'`.

- [ ] **Step 3: Write the implementation**

`src/scripts/bucket.js`:
```js
/* A token bucket with lazy refill: no timer adds tokens; the count is worked out
   from the time that has passed. Capacity is the burst size; everyMs is the refill rate. */
export function createBucket({ capacity = 5, everyMs = 2000, now = Date.now } = {}) {
  let tokens = capacity;
  let last = now();

  function refill() {
    const t = now();
    const add = Math.floor((t - last) / everyMs);
    if (add > 0) {
      tokens = Math.min(capacity, tokens + add);
      last = tokens === capacity ? t : last + add * everyMs;
    }
  }

  return {
    capacity,
    available() {
      refill();
      return tokens;
    },
    tryTake() {
      refill();
      if (tokens > 0) {
        if (tokens === capacity) last = now();
        tokens -= 1;
        return { ok: true, tokensLeft: tokens };
      }
      return { ok: false, readyAt: last + everyMs };
    },
  };
}

export function describeDenial(readyAt, t = Date.now()) {
  const rest = readyAt - t;
  return rest > 0 ? `Try again in ${Math.ceil(rest / 1000)}s` : 'Try again now';
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: PASS, all tests from Tasks 2 and 3.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/bucket.js tests/unit/bucket.test.js
git commit -m "Add the token bucket and its tests"
```

---

### Task 4: Fetch the official fonts at build time

**Files:**
- Create: `scripts/fetch-fonts.mjs`
- Test: `tests/unit/fetch-fonts.test.js`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces: `parseFontCss(css: string) -> Array<{weight: number, url: string}>` (woff2 only, absolute `https:` URLs; throws if none found), `buildFontFaceCss(faces) -> string`, and a CLI that writes `public/fonts/general-sans-{400,500,700}.woff2` and `src/styles/fonts.generated.css`. npm scripts `fonts`, `prebuild`, `predev`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/fetch-fonts.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFontCss, buildFontFaceCss } from '../../scripts/fetch-fonts.mjs';

// Same structure Fontshare returns today: per weight, woff2 then woff then truetype.
const block = (weight, id) => `@font-face {
  font-family: 'General Sans';
  src: url('//cdn.fontshare.com/wf/${id}.woff2') format('woff2'),
       url('//cdn.fontshare.com/wf/${id}.woff') format('woff'),
       url('//cdn.fontshare.com/wf/${id}.ttf') format('truetype');
  font-weight: ${weight};
  font-display: swap;
  font-style: normal;
}`;
const sample = `/* General Sans */\n${block(400, 'AAA')}\n${block(500, 'BBB')}\n${block(700, 'CCC')}\n`;

test('parseFontCss returns one woff2 URL per weight, with an https scheme', () => {
  const faces = parseFontCss(sample);
  assert.deepEqual(faces, [
    { weight: 400, url: 'https://cdn.fontshare.com/wf/AAA.woff2' },
    { weight: 500, url: 'https://cdn.fontshare.com/wf/BBB.woff2' },
    { weight: 700, url: 'https://cdn.fontshare.com/wf/CCC.woff2' },
  ]);
});

test('parseFontCss fails loudly when the format has changed', () => {
  assert.throws(() => parseFontCss(''), /No woff2 @font-face rules/);
  assert.throws(() => parseFontCss('<html>Not found</html>'), /No woff2 @font-face rules/);
});

test('buildFontFaceCss points at local files and never at Fontshare', () => {
  const css = buildFontFaceCss(parseFontCss(sample));
  assert.match(css, /url\('\/fonts\/general-sans-400\.woff2'\) format\('woff2'\)/);
  assert.match(css, /font-display: swap/);
  assert.doesNotMatch(css, /fontshare/i);
  assert.equal((css.match(/@font-face/g) || []).length, 3);
});
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npm test`
Expected: FAIL with `Cannot find module '.../scripts/fetch-fonts.mjs'`.

- [ ] **Step 3: Write the script**

`scripts/fetch-fonts.mjs`:
```js
// Downloads the official General Sans woff2 files from Fontshare, unmodified, at build time.
// The ITF Free Font License allows self-hosting but forbids redistribution, and this
// repository is public, so the files are git-ignored and never committed.
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FONT_CSS_URL = 'https://api.fontshare.com/v2/css?f[]=general-sans@400,500,700&display=swap';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

export function parseFontCss(css) {
  const faces = [];
  for (const block of css.match(/@font-face\s*{[^}]*}/g) ?? []) {
    const weight = /font-weight:\s*(\d+)/.exec(block)?.[1];
    const url = /url\(['"]?([^'")]+)['"]?\)\s*format\(['"]woff2['"]\)/.exec(block)?.[1];
    if (weight && url) {
      faces.push({ weight: Number(weight), url: url.startsWith('//') ? `https:${url}` : url });
    }
  }
  if (faces.length === 0) {
    throw new Error('No woff2 @font-face rules found in the Fontshare CSS. Its format may have changed.');
  }
  return faces;
}

export function buildFontFaceCss(faces) {
  return faces
    .map(
      ({ weight }) => `@font-face {
  font-family: 'General Sans';
  src: url('/fonts/general-sans-${weight}.woff2') format('woff2');
  font-weight: ${weight};
  font-style: normal;
  font-display: swap;
}
`,
    )
    .join('\n');
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const fontsDir = path.join(root, 'public/fonts');
  const cssFile = path.join(root, 'src/styles/fonts.generated.css');
  const wanted = [400, 500, 700].map((w) => path.join(fontsDir, `general-sans-${w}.woff2`));

  if (!process.argv.includes('--force') && existsSync(cssFile) && wanted.every((f) => existsSync(f))) {
    console.log('fetch-fonts: General Sans files already present (use --force to refresh).');
    return;
  }

  const cssResponse = await fetch(FONT_CSS_URL, { headers: { 'user-agent': USER_AGENT } });
  if (!cssResponse.ok) throw new Error(`Fontshare CSS request failed with status ${cssResponse.status}`);
  const faces = parseFontCss(await cssResponse.text());

  await mkdir(fontsDir, { recursive: true });
  for (const face of faces) {
    const response = await fetch(face.url);
    if (!response.ok) throw new Error(`Font download failed (${response.status}): ${face.url}`);
    await writeFile(path.join(fontsDir, `general-sans-${face.weight}.woff2`), Buffer.from(await response.arrayBuffer()));
  }
  await writeFile(cssFile, buildFontFaceCss(faces));
  console.log(`fetch-fonts: fetched ${faces.length} General Sans files, unmodified.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`fetch-fonts: ${error.message}`);
    process.exit(1);
  });
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Wire the script into npm and run it for real**

In `package.json` `scripts`, add these three lines (keep the others):
```json
    "fonts": "node scripts/fetch-fonts.mjs",
    "predev": "npm run fonts",
    "prebuild": "npm run fonts",
```
Then:
```bash
npm run fonts
ls -la public/fonts
head -8 src/styles/fonts.generated.css
git status --short
```
Expected: three `.woff2` files, a generated CSS file starting with `@font-face`, and `git status` showing only `package.json`, `scripts/` and `tests/` (the fonts and generated CSS are ignored).

- [ ] **Step 6: Prove the failure mode (Review Focus 5)**

```bash
rm -rf public/fonts src/styles/fonts.generated.css
node --input-type=module -e "
import { parseFontCss } from './scripts/fetch-fonts.mjs';
try { parseFontCss('<html>moved</html>'); } catch (e) { console.log('FAILED LOUDLY:', e.message); }"
npm run fonts
```
Expected: the first command prints `FAILED LOUDLY: No woff2 @font-face rules found...`; the second re-downloads the three files. Then run `npm run fonts` once more: it should say the files are already present and download nothing (offline development still works).

- [ ] **Step 7: Commit**

```bash
git add scripts/fetch-fonts.mjs tests/unit/fetch-fonts.test.js package.json
git commit -m "Fetch the official General Sans files at build time instead of committing them"
```

---

### Task 5: Base layout and global styles

**Files:**
- Create: `src/layouts/Base.astro`, `src/styles/global.css` (copy), `tests/dist/helpers.js`, `tests/dist/head.test.js`
- Modify: `src/pages/index.astro`, `public/robots.txt` (create)

**Interfaces:**
- Consumes: `site` from Task 2; `fonts.generated.css` from Task 4.
- Produces: `Base.astro` taking optional props `{ title?: string, description?: string }` and a default slot; `tests/dist/helpers.js` exporting `html` (string) and `doc` (linkedom document) for every built-HTML test.

- [ ] **Step 1: Write the test helper and the failing head test**

`tests/dist/helpers.js`:
```js
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

export const html = readFileSync(new URL('../../dist/index.html', import.meta.url), 'utf8');
export const { document: doc } = parseHTML(html);
```

`tests/dist/head.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { doc } from './helpers.js';

const meta = (selector) => doc.querySelector(selector)?.getAttribute('content');

test('title, description and canonical', () => {
  assert.equal(doc.title, 'Sai Manoj');
  assert.match(meta('meta[name="description"]'), /senior software engineer in India/);
  assert.equal(doc.querySelector('link[rel="canonical"]').getAttribute('href'), 'https://saimanoj.com/');
  assert.equal(doc.documentElement.getAttribute('lang'), 'en');
});

test('share tags point at the name card', () => {
  assert.equal(meta('meta[property="og:image"]'), 'https://saimanoj.com/og.jpg');
  assert.equal(meta('meta[property="og:image:width"]'), '1200');
  assert.equal(meta('meta[property="og:image:height"]'), '630');
  assert.equal(meta('meta[name="twitter:card"]'), 'summary_large_image');
});

test('the skip link is the first thing in the body', () => {
  const first = doc.body.querySelector('a');
  assert.equal(first.getAttribute('href'), '#work');
  assert.equal(first.textContent.trim(), 'Skip to experience');
});

test('fonts come from this site, not Fontshare', () => {
  assert.doesNotMatch(doc.documentElement.outerHTML, /fontshare/i);
});
```

- [ ] **Step 2: Run it against the placeholder build and watch it fail**

Run: `npm run build && npm run test:dist`
Expected: FAIL (the placeholder page has no canonical link, no share tags, no skip link).

- [ ] **Step 3: Copy the stylesheet and write the layout**

```bash
mkdir -p src/layouts src/styles public
cp design/prototype/styles.css src/styles/global.css
```

`src/layouts/Base.astro`:
```astro
---
import '../styles/fonts.generated.css';
import '../styles/global.css';
import { site } from '../data/site.js';

const { title = site.title, description = site.description } = Astro.props;
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
    <link rel="canonical" href={canonical} />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={site.shareDescription} />
    <meta property="og:url" content={canonical} />
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
    <script is:inline>document.documentElement.classList.add('js');</script>
  </head>
  <body>
    <a class="skip" href="#work">Skip to experience</a>
    <slot />
  </body>
</html>
```

`src/pages/index.astro` (still a stub; later tasks fill it):
```astro
---
import Base from '../layouts/Base.astro';
---
<Base>
  <h1>Sai Manoj</h1>
</Base>
```

`public/robots.txt`:
```
User-agent: *
Allow: /
```

- [ ] **Step 4: Build and run the tests**

Run: `npm run build && npm run test:dist`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/layouts src/styles/global.css src/pages/index.astro public/robots.txt tests/dist
git commit -m "Add the base layout, global styles and head tests"
```

---

### Task 6: Hero card, stub and motion

**Files:**
- Create: `src/components/Hero.astro`, `src/components/Stub.astro`, `src/scripts/motion.js`, `public/images/hero.jpg`, `public/images/portrait.jpg` (copies), `tests/dist/hero.test.js`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `site.hero`, `site.links`, `site.name`.
- Produces: elements with ids `top`, `card`, `card-inner`, `stub`; `motion.js` (module, no exports) that adds `html.anim`, reveals `.rv` elements, and runs the card-to-stub choreography. It looks up `#connect` and `footer` for hiding the stub.

- [ ] **Step 1: Write the failing test**

`tests/dist/hero.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { doc } from './helpers.js';

test('one h1 with the three title words', () => {
  const h1s = doc.querySelectorAll('h1');
  assert.equal(h1s.length, 1);
  assert.deepEqual([...h1s[0].querySelectorAll('span')].map((s) => s.textContent), ['Sai Manoj', 'Backend', 'Engineer']);
});

test('hero facts and sentence', () => {
  const text = doc.querySelector('header.hero .facts').textContent;
  for (const line of ['Senior software engineer', 'India', 'Java, Python, C#', 'Services on public cloud. Tools for AI agents.']) {
    assert.ok(text.includes(line), line);
  }
});

test('hero links are LinkedIn and the GitHub profile only', () => {
  const hrefs = [...doc.querySelectorAll('header.hero a')].map((a) => a.getAttribute('href'));
  assert.deepEqual(hrefs, ['https://www.linkedin.com/in/sai-manoj-kumar', 'https://github.com/sai-manoj-kumar']);
});

test('the photo credit is not on the hero card', () => {
  assert.doesNotMatch(doc.querySelector('header.hero').textContent, /PiDatacenters|Photo:/);
});

test('both hero images have alt text and dimensions', () => {
  for (const img of doc.querySelectorAll('header.hero img')) {
    assert.ok(img.getAttribute('alt'), 'alt');
    assert.ok(img.getAttribute('width') && img.getAttribute('height'), 'width and height');
  }
});

test('the stub points at the connect section', () => {
  assert.ok(doc.querySelector('a#stub[href="#connect"]'));
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run build && npm run test:dist`
Expected: FAIL in `hero.test.js` (no `header.hero` yet).

- [ ] **Step 3: Write the components and the motion script**

```bash
mkdir -p src/components public/images
cp design/prototype/assets/datacenter.jpg public/images/hero.jpg
cp design/prototype/assets/portrait.jpg public/images/portrait.jpg
```

`src/components/Hero.astro`:
```astro
---
import { site } from '../data/site.js';

const { hero, links } = site;
---
<header class="hero" id="top">
  <div class="stage">
    <img class="room" src="/images/hero.jpg" width="1920" height="1281" alt={hero.photoAlt} fetchpriority="high" />
  </div>

  <div class="card" id="card">
    <div class="card-inner" id="card-inner">
      <h1 class="title rv" style="--d:0">
        {hero.titleWords.map((word) => <span>{word}</span>)}
      </h1>
      <div class="card-body">
        <div class="facts">
          {hero.facts.map((fact, i) => <p class="rv" style={`--d:${i + 1}`}>{fact}</p>)}
          <p class="sentence rv" style="--d:4">{hero.sentence}</p>
        </div>
        <figure class="plate rv" style="--d:3">
          <img src="/images/portrait.jpg" width="800" height="800" alt={hero.portraitAlt} />
        </figure>
      </div>
      <div class="card-foot rv" style="--d:5">
        <a class="btn" href={links.linkedin}>{hero.cta}</a>
        <a class="textlink" href={links.github}>{hero.githubLabel}</a>
      </div>
    </div>
  </div>
</header>
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

`src/scripts/motion.js`:
```js
/* Motion: entrances and the hero card shrinking into a stub.
   Everything here is an enhancement; without it the page reads in full. */
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

function start() {
  root.classList.add('anim');

  /* Entrances: heading, text, picture, staggered by the --d on each part. */
  const targets = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    targets.forEach((t) => io.observe(t));
  } else {
    targets.forEach((t) => t.classList.add('in'));
  }

  /* Pinned story: the hero card shrinks to a stub and stays. */
  const hero = document.getElementById('top');
  const card = document.getElementById('card');
  const inner = document.getElementById('card-inner');
  const stub = document.getElementById('stub');
  const room = document.querySelector('.room');
  if (!hero || !card || !inner || !stub) return;

  let vw, vh, cw, ch, m, s1, x0, y0, x1, y1;
  let ticking = false;
  let hideStub = false;

  function update() {
    ticking = false;
    const y = window.scrollY || window.pageYOffset;
    const p = clamp(y / (vh * 0.75), 0, 1);
    const e = ease(p);

    card.style.setProperty('--tx', lerp(x0, x1, e).toFixed(1) + 'px');
    card.style.setProperty('--ty', lerp(y0, y1, e).toFixed(1) + 'px');
    card.style.setProperty('--ts', lerp(1, s1, e).toFixed(4));
    inner.style.setProperty('--c', (1 - clamp((p - 0.15) / 0.35, 0, 1)).toFixed(3));
    card.style.opacity = p > 0.9 ? String(clamp(1 - (p - 0.9) / 0.1, 0, 1)) : '';
    card.style.visibility = p >= 1 ? 'hidden' : '';
    stub.classList.toggle('on', p >= 0.98 && !hideStub);

    if (room) {
      const span = Math.max(1, hero.offsetHeight - vh);
      room.style.setProperty('--room-s', (1 + 0.1 * clamp(y / span, 0, 1)).toFixed(4));
    }
  }

  function measure() {
    vw = window.innerWidth; vh = window.innerHeight;
    cw = card.offsetWidth; ch = card.offsetHeight;
    m = clamp(vw * 0.025, 16, 32);
    const stubW = vw < 860 ? 150 : 210;
    s1 = stubW / cw;
    x0 = (vw - cw) / 2; y0 = (vh - ch) / 2;
    x1 = m; y1 = vh - m - ch * s1;
    update();
  }

  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }

  /* The stub points at Connect, so it steps aside while Connect or the footer is on screen. */
  if ('IntersectionObserver' in window) {
    const seen = {};
    const so = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { seen[e.target.id || e.target.tagName] = e.isIntersecting; });
        hideStub = !!(seen.connect || seen.FOOTER);
        update();
      },
      { threshold: 0.05 },
    );
    const connect = document.getElementById('connect');
    const footer = document.querySelector('footer');
    if (connect) so.observe(connect);
    if (footer) so.observe(footer);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  measure();

  /* Hero parts rise in once, a beat after load. */
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      document.querySelectorAll('.card .rv').forEach((n) => n.classList.add('in'));
    });
  });
}

if (!reduce) start();
```

`src/pages/index.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../components/Hero.astro';
import Stub from '../components/Stub.astro';
---
<Base>
  <Hero />
  <main></main>
  <Stub />
  <script>
    import '../scripts/motion.js';
  </script>
</Base>
```

- [ ] **Step 4: Run the tests**

Run: `npm run build && npm run test:dist`
Expected: PASS (head and hero tests).

- [ ] **Step 5: Look at it**

```bash
npm run preview -- --port 4321
```
Open `http://localhost:4321/` in a browser. The hero card should sit over the tinted aisle photo, and scrolling should shrink it into a "Sai Manoj / Connect" stub at the bottom left. (Only the hero exists so far, so the stub stays visible.) Stop the server with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add src public/images tests/dist/hero.test.js
git commit -m "Add the hero card, the stub and the motion script"
```

---

### Task 7: Experience folders, the four visuals and the live demo

**Files:**
- Create: `src/components/Experience.astro`, `src/components/Folder.astro`, `src/components/diagrams/TicketDemo.astro`, `src/components/diagrams/MemoryBars.astro`, `src/components/diagrams/HeaderRewrite.astro`, `src/components/diagrams/Traceroute.astro`, `src/scripts/limiter.js`, `tests/dist/experience.test.js`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `site.experience`; `createBucket`, `describeDenial` from Task 3.
- Produces: `#work` section; the demo's element ids `dispenser`, `take`, `tickets`, `bucket-label`, `fallback` (used by Task 9's browser tests).

- [ ] **Step 1: Write the failing test**

`tests/dist/experience.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { doc, html } from './helpers.js';

const folders = () => [...doc.querySelectorAll('article.folder')];

test('four folders; the tab is always the company, then project, then title', () => {
  assert.equal(folders().length, 4);
  assert.deepEqual(folders().map((f) => f.querySelector('.tab').textContent.trim()), [
    'LinkedIn', 'Microsoft', 'Microsoft', 'Microsoft',
  ]);
  assert.deepEqual(folders().map((f) => f.querySelector('.text h3').textContent.trim()), [
    'Webhooks Platform', 'Defender', 'Application Gateway', 'Network Monitoring',
  ]);
  assert.deepEqual(folders().map((f) => f.querySelector('.text p.role').textContent.trim()), [
    'Senior Software Engineer', 'Software Engineer II', 'Software Engineer II', 'Software Engineer',
  ]);
  for (const f of folders()) {
    assert.equal(f.querySelector('.text h3').nextElementSibling.className, 'role', 'title follows project');
  }
});

test('folders alternate light and dark', () => {
  assert.deepEqual(
    folders().map((f) => (f.classList.contains('tone-light') ? 'light' : 'dark')),
    ['light', 'dark', 'light', 'dark'],
  );
});

test('the demo has a plain fallback when JavaScript is off', () => {
  const take = doc.getElementById('take');
  assert.ok(take.hasAttribute('disabled'), 'button starts disabled');
  assert.match(doc.getElementById('fallback').textContent, /needs JavaScript/);
  assert.equal(doc.getElementById('tickets').getAttribute('aria-live'), 'polite');
  assert.equal(doc.querySelectorAll('#dispenser .chip').length, 5);
});

test('illustrations are labelled as illustrations', () => {
  assert.match(html, /Made-up host names\./);
  assert.match(html, /Made-up timings\./);
  assert.match(html, /A header rewrite, illustrated/);
  assert.match(html, /A traceroute, illustrated/);
  assert.match(html, /Drawn to scale: 30% lower\./);
});

test('the demo note says two seconds', () => {
  assert.match(doc.querySelector('#limiter .note').textContent, /a new one every two seconds/);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run build && npm run test:dist`
Expected: FAIL in `experience.test.js`.

- [ ] **Step 3: Write the components**

`src/components/Folder.astro`:
```astro
---
const { role, index } = Astro.props;
const id = role.visual === 'ticketDemo' ? 'limiter' : undefined;
---
<article class={`folder tone-${role.tone}`} style={`--i:${index}`} id={id}>
  <div class="tabs"><span class="tab lead">{role.company}</span></div>
  <div class="folder-body">
    <slot />
    <div class="text rv" style="--d:1">
      <h3>{role.project}</h3>
      <p class="role">{role.title}</p>
      {role.paragraphs.map((paragraph) => <p>{paragraph}</p>)}
      {role.note && <p class="note">{role.note}</p>}
    </div>
  </div>
</article>
```

`src/components/Experience.astro`:
```astro
---
import { site } from '../data/site.js';
import Folder from './Folder.astro';
import TicketDemo from './diagrams/TicketDemo.astro';
import MemoryBars from './diagrams/MemoryBars.astro';
import HeaderRewrite from './diagrams/HeaderRewrite.astro';
import Traceroute from './diagrams/Traceroute.astro';

const visuals = { ticketDemo: TicketDemo, memory: MemoryBars, rewrite: HeaderRewrite, trace: Traceroute };
---
<section class="work" id="work" aria-labelledby="work-h">
  <h2 id="work-h" class="work-head">Experience</h2>
  <div class="folders">
    {site.experience.map((role, index) => {
      const Visual = visuals[role.visual];
      return (
        <Folder role={role} index={index}>
          <Visual />
        </Folder>
      );
    })}
  </div>
</section>
```

`src/components/diagrams/TicketDemo.astro`:
```astro
<div class="pic dispenser rv" id="dispenser">
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

`src/components/diagrams/MemoryBars.astro`:
```astro
<div class="pic panel paper stat rv">
  <p class="panel-title">Memory use, before and after</p>
  <div class="mem" role="img" aria-label="Memory use before and after, drawn to scale: 100 before, 70 after">
    <p class="mem-row"><span>Before</span><i style="--w:100%"></i></p>
    <p class="mem-row"><span>After</span><i style="--w:70%"></i></p>
  </div>
  <p class="panel-note">Drawn to scale: 30% lower.</p>
</div>
```

`src/components/diagrams/HeaderRewrite.astro`:
```astro
<div class="pic panel ink rewrite rv">
  <p class="panel-title">A header rewrite, illustrated</p>
  <ol class="steps">
    <li class="step" style="--k:0"><span>Backend sends</span><span>Location: http://backend-1.internal/cart</span></li>
    <li class="step rule" style="--k:1"><span>Rule</span><span>Replace the backend host with the public host</span></li>
    <li class="step" style="--k:2"><span>Client receives</span><span>Location: https://shop.example.com/cart</span></li>
  </ol>
  <p class="panel-note">Made-up host names.</p>
</div>
```

`src/components/diagrams/Traceroute.astro`:
```astro
<div class="pic panel paper trace rv">
  <p class="panel-title">A traceroute, illustrated</p>
  <ol class="hops">
    <li class="hop" style="--k:0;--w:6%"><span>Local router</span><i></i><b>2 ms</b></li>
    <li class="hop" style="--k:1;--w:29%"><span>Network edge</span><i></i><b>9 ms</b></li>
    <li class="hop" style="--k:2;--w:58%"><span>Transit</span><i></i><b>18 ms</b></li>
    <li class="hop" style="--k:3;--w:100%"><span>Destination</span><i></i><b>31 ms</b></li>
  </ol>
  <p class="panel-note">Made-up timings.</p>
</div>
```

`src/scripts/limiter.js`:
```js
/* The rate-limiter demo: DOM glue around the pure token bucket. */
import { createBucket, describeDenial } from './bucket.js';

const take = document.getElementById('take');
const list = document.getElementById('tickets');
const label = document.getElementById('bucket-label');
const chips = document.querySelectorAll('#dispenser .chip');

if (take && list && label) {
  const bucket = createBucket({ capacity: 5, everyMs: 2000 });
  let served = 0;

  const pad = (n) => String(n).padStart(4, '0');

  function paint() {
    const tokens = bucket.available();
    chips.forEach((chip, i) => chip.classList.toggle('empty', i >= tokens));
    label.textContent = `${tokens} of ${bucket.capacity} tokens left`;
  }

  function addTicket(left, right, denied, readyAt) {
    const li = document.createElement('li');
    li.className = `ticket${denied ? ' deny' : ''}`;
    const a = document.createElement('span');
    const b = document.createElement('span');
    a.textContent = left;
    b.textContent = right;
    if (denied) {
      li.setAttribute('data-ready', String(readyAt));
      b.setAttribute('aria-live', 'off');
    }
    li.append(a, b);
    list.insertBefore(li, list.firstChild);
    while (list.children.length > 4) list.removeChild(list.lastChild);
  }

  const denyText = (readyAt) => `429 Too Many Requests. ${describeDenial(readyAt)}`;

  take.disabled = false;
  take.addEventListener('click', () => {
    served += 1;
    const result = bucket.tryTake();
    if (result.ok) {
      addTicket(`No. ${pad(served)}`, '200 Admitted', false);
    } else {
      addTicket(`No. ${pad(served)}`, denyText(result.readyAt), true, result.readyAt);
    }
    paint();
  });

  /* Repaint the chips and keep every denied ticket's countdown live. */
  setInterval(() => {
    paint();
    list.querySelectorAll('.ticket.deny').forEach((ticket) => {
      const b = ticket.lastChild;
      const text = denyText(Number(ticket.getAttribute('data-ready')));
      if (b.textContent !== text) b.textContent = text;
    });
  }, 250);

  paint();
}
```

`src/pages/index.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../components/Hero.astro';
import Experience from '../components/Experience.astro';
import Stub from '../components/Stub.astro';
---
<Base>
  <Hero />
  <main>
    <Experience />
  </main>
  <Stub />
  <script>
    import '../scripts/motion.js';
  </script>
</Base>
```

- [ ] **Step 4: Run the tests**

Run: `npm test && npm run build && npm run test:dist`
Expected: PASS.

- [ ] **Step 5: Try the demo by hand**

```bash
npm run preview -- --port 4321
```
In the browser, scroll to "LinkedIn", click "Take a ticket" six times quickly: five "200 Admitted", then "429 Too Many Requests. Try again in 2s" counting down to "Try again now", and a token returning every two seconds. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add src tests/dist/experience.test.js
git commit -m "Add the experience folders, the diagrams and the live demo"
```

---

### Task 8: Tech stack, About, Connect and Footer

**Files:**
- Create: `src/components/TechStack.astro`, `src/components/About.astro`, `src/components/Connect.astro`, `src/components/Footer.astro`, `tests/dist/closing-sections.test.js`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `site.stack`, `site.about`, `site.connect`, `site.footer`, `site.photoCredit`, `site.links`.
- Produces: sections `#stack`, `#about`, `#connect` and the page `<footer>` (the motion script looks for `#connect` and `footer`).

- [ ] **Step 1: Write the failing test**

`tests/dist/closing-sections.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { doc } from './helpers.js';

test('tech stack: four bars, all open by default', () => {
  const bars = [...doc.querySelectorAll('#stack details.bar')];
  assert.equal(bars.length, 4);
  assert.ok(bars.every((b) => b.hasAttribute('open')), 'every bar is open');
  assert.deepEqual(bars.map((b) => b.querySelector('summary').textContent.trim()), [
    'Backend', 'Cloud', 'Data', 'AI agent tooling',
  ]);
  assert.equal(doc.querySelector('#stack h2').textContent.trim(), 'Tech stack');
});

test('about: nine years of backend and one LinkedIn link in the letter', () => {
  const about = doc.getElementById('about');
  assert.match(about.textContent, /about nine years of backend experience/);
  const letterLinks = [...about.querySelectorAll('.sheet a')].map((a) => a.getAttribute('href'));
  assert.deepEqual(letterLinks, ['https://www.linkedin.com/in/sai-manoj-kumar']);
});

test('connect: LinkedIn and GitHub profile only', () => {
  const hrefs = [...doc.querySelectorAll('#connect a')].map((a) => a.getAttribute('href'));
  assert.deepEqual(hrefs, ['https://www.linkedin.com/in/sai-manoj-kumar', 'https://github.com/sai-manoj-kumar']);
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

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run build && npm run test:dist`
Expected: FAIL in `closing-sections.test.js`.

- [ ] **Step 3: Write the components**

`src/components/TechStack.astro`:
```astro
---
import { site } from '../data/site.js';
---
<section class="stack" id="stack" aria-labelledby="stack-h">
  <div class="stack-wrap">
    <div class="stack-col">
      <h2 id="stack-h" class="giant rv">Tech stack</h2>
      <div class="bars">
        {site.stack.map((group, i) => (
          <details class="bar rv" style={`--d:${i + 1}`} open>
            <summary>{group.title}</summary>
            <ul class="items">
              {group.items.map(([name, note]) => (
                <li><span>{name}</span><span>{note}</span></li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  </div>
</section>
```

`src/components/About.astro`:
```astro
---
import { site } from '../data/site.js';

const { about, links, name } = site;
const [first, ...rest] = about.paragraphs;
---
<section class="about" id="about" aria-label={`About ${name}`}>
  <div class="sheet rv">
    <img class="mini" src="/images/portrait.jpg" width="88" height="88" alt={name} loading="lazy" />
    <p>{first}</p>
    {rest.map((paragraph) => <p>{paragraph}</p>)}
    <p>
      {about.closing.before}<mark><a href={links.linkedin}>{about.closing.linkText}</a></mark>{about.closing.after}
    </p>
    <p class="sign"><span class="name">{name}</span><span class="role">{about.signRole}</span></p>
    <div class="scallops" aria-hidden="true"></div>
  </div>
  <div class="tear rv" style="--d:1">
    <span class="dots" aria-hidden="true"></span>
    <a class="btn on-light" href={links.linkedin}>{about.tearCta}</a>
  </div>
</section>
```

`src/components/Connect.astro`:
```astro
---
import { site } from '../data/site.js';

const { connect, links } = site;
---
<section class="connect" id="connect" aria-labelledby="connect-h">
  <div class="coupon rv">
    <span class="notch top" aria-hidden="true"></span>
    <span class="notch bottom" aria-hidden="true"></span>
    <div class="coupon-left">
      <h2 id="connect-h" class="coupon-head">{connect.heading}</h2>
      <p>{connect.text}</p>
    </div>
    <div class="coupon-right">
      <a class="bar-link primary" href={links.linkedin}>
        <svg width="22" height="22" viewBox="0 0 19 18" fill="currentColor" aria-hidden="true"><path d="M3.94 2A2 2 0 1 1 2 0a2 2 0 0 1 1.94 2zM4 5.48H0V18h4zm6.32 0H6.34V18h3.94v-6.57c0-3.66 4.77-4 4.77 0V18H19v-7.93c0-6.17-7.06-5.94-8.72-2.91z"/></svg>
        {connect.linkedinLabel}
      </a>
      <a class="bar-link" href={links.github}>
        <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
        {connect.githubLabel}
      </a>
    </div>
  </div>
</section>
```

`src/components/Footer.astro`:
```astro
---
import { site } from '../data/site.js';

const { footer, links, name, photoCredit: c } = site;
const profile = (url) => url.replace('https://www.', '').replace('https://', '');
---
<footer class="back">
  <div class="back-row">
    <p>© {footer.year} {name}</p>
    <p><a href={links.linkedin}>{profile(links.linkedin)}</a></p>
    <p><a href={links.github}>{profile(links.github)}</a></p>
  </div>
  <p class="credits">
    Photo: <a href={c.titleUrl}>“{c.title}”</a> by {c.author}, <a href={c.licenseUrl}>{c.license}</a>, via {c.source}. {c.note}
  </p>
</footer>
```

`src/pages/index.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../components/Hero.astro';
import Experience from '../components/Experience.astro';
import TechStack from '../components/TechStack.astro';
import About from '../components/About.astro';
import Connect from '../components/Connect.astro';
import Footer from '../components/Footer.astro';
import Stub from '../components/Stub.astro';
---
<Base>
  <Hero />
  <main>
    <Experience />
    <TechStack />
    <About />
    <Connect />
  </main>
  <Footer />
  <Stub />
  <script>
    import '../scripts/motion.js';
  </script>
</Base>
```

- [ ] **Step 4: Run the tests**

Run: `npm test && npm run build && npm run test:dist`
Expected: PASS.

- [ ] **Step 5: Compare against the prototype**

```bash
npm run preview -- --port 4321
```
Open `http://localhost:4321/` and `design/prototype/index.html` (open the file directly) side by side. Scroll both: sections, colours and spacing should match. Stop the server. Any visible difference is a bug in the port; fix it before committing.

- [ ] **Step 6: Commit**

```bash
git add src tests/dist/closing-sections.test.js
git commit -m "Add tech stack, about, connect and footer"
```

---

### Task 9: Whole-page rules and browser tests

**Files:**
- Create: `tests/dist/page-rules.test.js`, `playwright.config.js`, `tests/e2e/demo.spec.js`, `tests/e2e/visitors.spec.js`

**Interfaces:**
- Consumes: the built site, the demo's ids from Task 7.
- Produces: `npm run test:dist` and `npm run test:e2e` as the release gates.

- [ ] **Step 1: Write the whole-page tests**

`tests/dist/page-rules.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { doc, html } from './helpers.js';

const text = doc.body.textContent;

test('exactly one h1, and the three section headings are h2', () => {
  assert.equal(doc.querySelectorAll('h1').length, 1);
  assert.deepEqual(
    [...doc.querySelectorAll('h2')].map((h) => h.textContent.trim()),
    ['Experience', 'Tech stack', 'Connect with me'],
  );
});

test('every image has alt text, width and height', () => {
  for (const img of doc.querySelectorAll('img')) {
    assert.ok(img.hasAttribute('alt'), `alt on ${img.getAttribute('src')}`);
    assert.ok(img.getAttribute('width') && img.getAttribute('height'), `size on ${img.getAttribute('src')}`);
  }
  assert.equal(doc.querySelectorAll('img').length, 3, 'hero photo, hero portrait, about portrait');
});

test('only allow-listed hosts are linked, and nothing loads from Fontshare', () => {
  const allowed = new Set(['www.linkedin.com', 'github.com', 'commons.wikimedia.org', 'creativecommons.org', 'saimanoj.com']);
  for (const m of html.matchAll(/(?:src|href|content)="(https?:\/\/[^"]+)"/g)) {
    assert.ok(allowed.has(new URL(m[1]).hostname), `unexpected host: ${m[1]}`);
  }
  assert.doesNotMatch(html, /fontshare|fonts\.googleapis|fonts\.gstatic/i);
});

test('no email, resume or repository links', () => {
  assert.doesNotMatch(html, /mailto:/i);
  assert.doesNotMatch(html, /\.pdf|resume/i);
  assert.doesNotMatch(html, /github\.com\/sai-manoj-kumar\/[A-Za-z]/);
});

test('forbidden terms never reach the page', () => {
  assert.doesNotMatch(text, /OAuth|TypeScript|\bDart\b|Gaap|restli|PhonePe|\b12\+|decade/i);
});

test('General Sans is shipped but not tracked by git', () => {
  const shipped = readdirSync(new URL('../../dist/fonts/', import.meta.url)).filter((f) => f.endsWith('.woff2'));
  assert.deepEqual(shipped.sort(), ['general-sans-400.woff2', 'general-sans-500.woff2', 'general-sans-700.woff2']);
  const tracked = execSync('git ls-files public/fonts src/styles/fonts.generated.css', { encoding: 'utf8' }).trim();
  assert.equal(tracked, '', 'font files must not be committed');
});

test('robots.txt is published', () => {
  assert.ok(existsSync(new URL('../../dist/robots.txt', import.meta.url)));
});
```

- [ ] **Step 2: Write the Playwright config and tests**

`playwright.config.js`:
```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4321', channel: 'chrome' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
```

`tests/e2e/demo.spec.js`:
```js
import { test, expect } from '@playwright/test';

test('admits five, then answers 429 with a live countdown, then refills', async ({ page }) => {
  await page.goto('/');
  const take = page.locator('#take');
  await expect(take).toBeEnabled();

  for (let i = 0; i < 5; i += 1) await take.click();
  await expect(page.locator('#tickets .ticket', { hasText: '200 Admitted' })).toHaveCount(4); // list keeps the last four
  await expect(page.locator('#bucket-label')).toHaveText('0 of 5 tokens left');

  await take.click();
  const denied = page.locator('#tickets .ticket.deny').first();
  await expect(denied).toContainText(/429 Too Many Requests\. Try again in [12]s/);
  await expect(denied).toContainText('Try again now', { timeout: 3000 });
  await expect(page.locator('#bucket-label')).toHaveText('1 of 5 tokens left');
});

test('thirty rapid clicks keep the list at four tickets and throw nothing (Review Focus 3)', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  const take = page.locator('#take');
  for (let i = 0; i < 30; i += 1) await take.click();
  expect(await page.locator('#tickets .ticket').count()).toBeLessThanOrEqual(4);
  await expect(page.locator('#tickets .ticket.deny').first()).toContainText(/Try again (in [12]s|now)/);
  expect(errors).toEqual([]);
});
```

`tests/e2e/visitors.spec.js`:
```js
import { test, expect } from '@playwright/test';

test.describe('JavaScript off (Review Focus 1)', () => {
  test.use({ javaScriptEnabled: false });

  test('the page reads in full and the demo explains itself', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#fallback')).toBeVisible();
    await expect(page.locator('#take')).toBeDisabled();
    await expect(page.locator('.folder .text').first()).toBeVisible();
    expect(await page.locator('.folder .text').first().evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await expect(page.locator('#stack details[open]')).toHaveCount(4);
  });
});

test.describe('Reduced motion (Review Focus 2)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('every section is visible and nothing animates in', async ({ page }) => {
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.classList.contains('anim'))).toBe(false);
    for (const selector of ['.folder .text', '#stack .bar', '#about .sheet', '#connect .coupon']) {
      const el = page.locator(selector).first();
      await expect(el).toBeVisible();
      expect(await el.evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    }
  });
});

test.describe('A 320 px phone (Review Focus 4)', () => {
  test.use({ viewport: { width: 320, height: 700 } });

  test('nothing scrolls sideways', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
```

- [ ] **Step 3: Run everything**

```bash
npm test
npm run build
npm run test:dist
npx playwright test
```
Expected: all pass. If a Playwright test cannot find Chrome, run `npx playwright install chrome` once, then retry. If `320 px` fails, find the overflowing element with `document.querySelectorAll('body *')` and fix the CSS rule in `src/styles/global.css` (the prototype passes at 320 px, so a failure means the port differs from it).

- [ ] **Step 4: Commit**

```bash
git add tests playwright.config.js
git commit -m "Add whole-page rule tests and browser tests for the demo and the visitor edge cases"
```

---

### Task 10: Images, favicons, the share image and Cloudflare headers

**Files:**
- Create: `scripts/make-assets.mjs`, `og/og-card.html`, `public/favicon.svg`, `public/_headers`, `tests/dist/assets.test.js`
- Modify: `package.json` (script `assets`), `public/images/hero.jpg` and `public/images/portrait.jpg` (re-encoded in place)
- Generate and commit: `public/og.jpg`, `public/favicon-32.png`, `public/apple-touch-icon.png`

**Interfaces:**
- Consumes: `design/prototype/assets/datacenter.jpg`, `design/prototype/assets/portrait.jpg`, `public/fonts/*.woff2` (for the share image only).
- Produces: `npm run assets` regenerates all of the above.

- [ ] **Step 1: Write the failing test**

`tests/dist/assets.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import sharp from 'sharp';

const dist = (p) => new URL(`../../dist/${p}`, import.meta.url);

test('the share image is a 1200 x 630 card', async () => {
  const meta = await sharp(dist('og.jpg')).metadata();
  assert.equal(meta.width, 1200);
  assert.equal(meta.height, 630);
  assert.ok(statSync(dist('og.jpg')).size < 250_000, 'share image stays small');
});

test('the hero photo is web-sized', async () => {
  const meta = await sharp(dist('images/hero.jpg')).metadata();
  assert.equal(meta.width, 1920);
  assert.ok(statSync(dist('images/hero.jpg')).size < 450_000, 'hero under 450 KB');
});

test('favicons exist', () => {
  for (const f of ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png']) {
    assert.ok(statSync(dist(f)).size > 0, f);
  }
});

test('cache and security headers are published', () => {
  const headers = readFileSync(dist('_headers'), 'utf8');
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /\/_astro\/\*/);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run build && npm run test:dist`
Expected: FAIL in `assets.test.js` (no `og.jpg`, hero not re-encoded).

- [ ] **Step 3: Write the sources**

`public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0c3a40"/>
  <text x="32" y="44" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="34" fill="#f1d2b6">SM</text>
</svg>
```

`public/_headers`:
```
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=604800

/images/*
  Cache-Control: public, max-age=86400
```

`og/og-card.html`:
```html
<!doctype html>
<meta charset="utf-8">
<style>
  @font-face { font-family: 'General Sans'; src: url('../public/fonts/general-sans-700.woff2') format('woff2'); font-weight: 700; }
  @font-face { font-family: 'General Sans'; src: url('../public/fonts/general-sans-500.woff2') format('woff2'); font-weight: 500; }
  html, body { margin: 0; }
  body {
    width: 1200px; height: 630px; box-sizing: border-box; padding: 0 96px;
    display: flex; align-items: center; gap: 72px;
    background: #f1d2b6; color: #0c3a40; font-family: 'General Sans', system-ui, sans-serif;
  }
  .copy { flex: 1; }
  h1 { margin: 0; font-size: 120px; line-height: 0.95; letter-spacing: -0.03em; font-weight: 700; }
  p { margin: 28px 0 0; font-size: 48px; line-height: 1.1; font-weight: 500; }
  img { display: block; width: 240px; height: 300px; padding: 10px; background: #ebc6a4; object-fit: cover; object-position: 50% 22%; }
</style>
<body>
  <div class="copy"><h1>Sai Manoj</h1><p>Senior software engineer</p></div>
  <img src="../public/images/portrait.jpg" alt="">
</body>
```

`scripts/make-assets.mjs`:
```js
// One-off asset generation: web-sized images, favicons and the share image.
// Run with `npm run assets` after changing the sources; outputs are committed.
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const at = (...p) => path.join(root, ...p);

// Re-encode from the frozen prototype sources so repeated runs never degrade quality.
await sharp(at('design/prototype/assets/datacenter.jpg'))
  .resize({ width: 1920, withoutEnlargement: true })
  .jpeg({ quality: 78, mozjpeg: true })
  .toFile(at('public/images/hero.jpg'));

await sharp(at('design/prototype/assets/portrait.jpg'))
  .resize(800, 800, { fit: 'cover' })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(at('public/images/portrait.jpg'));

await sharp(at('public/favicon.svg'), { density: 300 }).resize(32, 32).png().toFile(at('public/favicon-32.png'));
await sharp(at('public/favicon.svg'), { density: 300 }).resize(180, 180).png().toFile(at('public/apple-touch-icon.png'));

// The share image: render og/og-card.html with the real font.
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(at('og/og-card.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: at('public/og.jpg'), type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();

console.log('make-assets: images, favicons and share image written to public/');
```

Add to `package.json` scripts: `"assets": "node scripts/make-assets.mjs"`.

- [ ] **Step 4: Generate, rebuild, test**

```bash
npm run fonts
npm run assets
npm run build
npm run test:dist
```
Expected: PASS. If the hero test reports more than 450 KB, lower the hero JPEG `quality` in `scripts/make-assets.mjs` from 78 to 72, then re-run `npm run assets && npm run build && npm run test:dist`. Open `public/og.jpg` and look at it: apricot card, "Sai Manoj" and "Senior software engineer" in General Sans, small portrait at the right.

- [ ] **Step 5: Commit**

```bash
git add scripts/make-assets.mjs og public package.json tests/dist/assets.test.js
git commit -m "Add web-sized images, favicons, the name-card share image and Cloudflare headers"
```

---

### Task 11: Quality gates

**Files:** none created. This task runs the gates and fixes what they find in the owning component or stylesheet.

- [ ] **Step 1: Everything automated, from a clean build**

```bash
rm -rf dist .astro
npm test && npm run build && npm run test:dist && npx playwright test
```
Expected: all pass.

- [ ] **Step 2: The design lint and the browser inspector**

```bash
npm run preview -- --port 4321 &
SKILL=/Users/saimanoj/.claude-account2/skills/design-taste-frontend/scripts
node $SKILL/lint.mjs src/styles/global.css src/scripts src/components src/pages
node $SKILL/inspect.mjs http://localhost:4321/
kill %1
```
Expected: lint `0 FAIL, 0 WARN`. Inspector: exactly one FAIL, `[few-pictures]` (the skill wants four pictures; Sai chose two, so this is accepted), and at most the warnings `[no-footage]` and `[pinned-over-picture]`. Any other FAIL or WARN is a regression from the prototype: fix it in the owning file.

- [ ] **Step 3: Lighthouse on mobile**

```bash
npm run preview -- --port 4321 &
npx --yes lighthouse@latest http://localhost:4321/ --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless=new" --quiet --output=json --output-path=/tmp/lh.json
node -e "const r=require('/tmp/lh.json');for(const[k,v]of Object.entries(r.categories))console.log(k,Math.round(v.score*100))"
kill %1
```
Expected: each category 95 or better. If performance is lower, read the failed audits in `/tmp/lh.json` (most likely image weight or the font preload); fix and re-run. Put the four real scores in the commit message in step 5, for example `Pass the quality gates (lighthouse 98/100/100/100)`.

- [ ] **Step 4: Manual checks (Sai does these on the preview in Task 12)**

Safari, Firefox and a real phone; reduced motion on (macOS: System Settings, Accessibility, Display, Reduce motion); JavaScript off (browser developer settings). Tick each as done in the pull request description.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "Pass the quality gates (lighthouse 98/100/100/100)"
```
Use the scores you measured, not these example numbers. If nothing needed fixing, skip the commit.

---

### Task 12: Cloudflare Pages project and the private preview

**Needs Sai's approval at each step marked APPROVAL. These steps change GitHub and Cloudflare account settings, which Claude does not do without being asked in the moment.**

**Files:** none.

- [ ] **Step 1: APPROVAL: push the branch, the rollback tag and the rollback branch**

```bash
cd /Users/saimanoj/claude_working_dir/saimanoj-site
git tag jekyll-final master
git push origin astro
git push origin jekyll-final
git push origin jekyll-final:refs/heads/jekyll-rollback
git ls-remote --heads --tags origin | grep -E "astro|jekyll"
```
Expected: `astro`, `jekyll-rollback` heads and the `jekyll-final` tag listed. `master` is unchanged, so GitHub Pages keeps serving the live Jekyll site.

- [ ] **Step 2: APPROVAL: create the Pages project (Cloudflare dashboard)**

Workers and Pages, Create, Pages, Connect to Git, pick `sai-manoj-kumar/sai-manoj-kumar.github.io`. Settings:
- Project name: `saimanoj-site`
- Production branch: `release`
- Framework preset: Astro
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable (production and preview): `NODE_VERSION` = `24`

Save and deploy. If the dashboard refuses a production branch that does not exist yet, create a placeholder first, then retry:
```bash
git switch --orphan release-placeholder
printf '{"name":"placeholder","scripts":{"build":"mkdir -p dist && echo Not yet > dist/index.html"}}\n' > package.json
git add package.json && git commit -m "Placeholder so Pages accepts the release branch"
git push origin release-placeholder:release
git switch astro
```

- [ ] **Step 3: APPROVAL: make previews private (Cloudflare dashboard)**

In the Pages project, Settings, General, Access policy: enable it. In Zero Trust, Access, Applications, open the application created for the project's preview deployments and set the policy to Allow, selector Emails, value Sai's own email address, with the one-time PIN login method. Remove any other allow rule.

- [ ] **Step 4: Verify the preview and that it is private**

The `astro` branch build gives a preview address like `https://astro.saimanoj-site.pages.dev` (the exact address is shown on the deployment page).
```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://astro.saimanoj-site.pages.dev/
```
Expected: a redirect (302) to a Cloudflare Access login page, not 200. Then open the address in a browser, enter the email, enter the one-time code, and confirm the full site loads, the fonts look right (General Sans, not a fallback), and the demo works.

- [ ] **Step 5: Sai reviews the preview**

Sai checks the page on a laptop and a phone, in Safari and Firefox, with reduced motion, and with JavaScript off (the manual list from Task 11). **Do not continue to Task 13 until Sai says the preview is approved.**

---

### Task 13: Cutover, retirement of Jekyll, and the rollback path

**Needs Sai's explicit approval to start, and again before step 5. Claude does not run these on its own initiative.**

**Files:** none (git operations and dashboard changes).

- [ ] **Step 1: APPROVAL: publish the approved build as production**

```bash
cd /Users/saimanoj/claude_working_dir/saimanoj-site
git push origin astro:release
```
If `release` is the placeholder branch from Task 12 step 2 (its history is unrelated), the push is rejected; then replace it deliberately with `git push --force origin astro:release`. A normal push is enough in every other case.

Pages builds a production deployment at `https://saimanoj-site.pages.dev`. Wait for it to finish, open it, and confirm it matches the approved preview. (This address is public; that is expected, the site is meant to be public.)

- [ ] **Step 2: APPROVAL: move the domain (Cloudflare dashboard)**

First remove the records that point at GitHub Pages in the DNS tab for saimanoj.com: the apex `A` records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (and any `AAAA` records for GitHub) and the `www` `CNAME` to `sai-manoj-kumar.github.io`. Then in the Pages project, Custom domains, Set up a custom domain: `saimanoj.com`, then `www.saimanoj.com`. Cloudflare creates the new records and issues certificates.

- [ ] **Step 3: Verify the live domain**

```bash
curl -sI https://saimanoj.com | head -5
curl -s https://saimanoj.com | grep -c "Backend"
curl -sI https://www.saimanoj.com | head -3
```
Expected: `HTTP/2 200`, a `cf-ray` header, a count of 1 or more, and `www` returning 200 or a redirect to the apex. Open https://saimanoj.com in a browser and check it matches the approved preview. If anything is wrong, go straight to Rollback below.

- [ ] **Step 4: Watch for a day**

Leave `jekyll-final`, `jekyll-rollback` and GitHub Pages as they are for 24 hours. Rollback stays a few-minutes job in that time.

- [ ] **Step 5: APPROVAL: retire the Jekyll site**

In the GitHub repository settings, Pages, unpublish the site (otherwise GitHub tries to build Jekyll from `master` after the merge). Then:
```bash
git switch master
git merge --ff-only astro
git push origin master
```
In the Pages project, Settings, Builds, set the production branch to `master`, redeploy, confirm https://saimanoj.com still serves the site, then delete the `release` branch:
```bash
git push origin --delete release
git switch astro
```
`jekyll-final` and `jekyll-rollback` stay, so the old site can always be restored.

- [ ] **Rollback (any time before step 5; and after it, via `jekyll-rollback`)**

1. Cloudflare, Pages project, Custom domains: remove `saimanoj.com` and `www.saimanoj.com`.
2. Cloudflare DNS for saimanoj.com, grey cloud (DNS only): add four `A` records for the apex to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, and a `CNAME` for `www` to `sai-manoj-kumar.github.io`.
3. GitHub repository settings, Pages: source branch `jekyll-rollback`, folder `/ (root)`, custom domain `saimanoj.com`, enforce HTTPS.
4. Wait for the certificate, then `curl -sI https://saimanoj.com`: the response is the old Jekyll site (`server: GitHub.com`).

---

## Self-Review

**Spec coverage.** Section 3 (design, sections, demo): Tasks 6 to 8, with demo behaviour pinned in Tasks 3, 7 and 9. Section 4 (content rules): Task 2 tests plus Task 9 built-page tests. Section 5 (architecture, fonts, images, head, share image, accessibility): Tasks 1, 4, 5, 10; accessibility via alt/size tests (Task 9), skip link (Task 5) and the live-region handling in `limiter.js` (Task 7). Section 6 (hosting, private preview, cutover, rollback): Tasks 12 and 13. Section 7 (gates): Tasks 9 and 11. Section 8 (not in scope) and section 10 (decisions) are honoured: no blog, analytics or form; private preview; font fetched not committed; share image name card with small portrait; credit in footer only.

**Spec changes made while writing this plan** (already applied to the spec): one stylesheet (`global.css`) instead of three; a frozen `design/prototype/` snapshot and a `tests/` tree; a `jekyll-rollback` branch next to the `jekyll-final` tag; and the final state after cutover (master becomes the production branch, `release` is deleted). None changes behaviour.

**Placeholder scan.** No "TBD", "TODO" or "similar to Task N" in any step. Dashboard steps in Tasks 12 and 13 name the exact fields and values; the only deliberately unspecified value is Sai's own email address, which must not be written into this public repository.

**Type and name consistency.** `createBucket`, `describeDenial`, `tryTake`, `available`, `capacity` (Task 3) match their use in `limiter.js` (Task 7). Element ids `dispenser`, `take`, `tickets`, `bucket-label`, `fallback` (Task 7) match the Playwright selectors (Task 9). `site` keys in Task 2 match every component. `helpers.js` exports `html` and `doc` (Task 5) as imported by all later dist tests.

**Review Focus coverage.** 1 and 2: Task 9 (`visitors.spec.js`) plus Task 7's static fallback test. 3: Task 9 (`demo.spec.js`). 4: Task 9. 5: Task 4 (parse failure test and the manual failure demonstration). 6: Task 3 (clock moves backwards).
