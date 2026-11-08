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
    assert.ok([null, 'memory', 'rewrite', 'trace'].includes(role.visual), `visual: ${role.visual}`);
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

test('roles carry no leftover layout fields', () => {
  for (const role of site.experience) assert.equal('tone' in role, false, `tone on ${role.project}`);
  assert.equal('titleWords' in site.hero, false);
  assert.equal('tearCta' in site.about, false);
});

test('the hero sentence and the pipeline carry the facts the owner chose', () => {
  assert.equal(site.hero.sentence, 'I managed the systems that deliver 100M webhook events a day.');
  assert.ok(site.hero.sentence.includes(site.hero.figure));
  assert.equal(site.hero.figure, '100M');
  assert.deepEqual(site.hero.stages.map((s) => s.id), ['event', 'queue', 'delivery', 'endpoint']);
  assert.deepEqual(site.hero.stages.filter((s) => s.fact).map((s) => [s.id, s.fact]), [
    ['delivery', '30% fewer failed deliveries'],
    ['endpoint', '25% lower latency'],
  ]);
  assert.ok(site.hero.pipelineLabel);
});

test('roles carry a slug and a one-line summary, and only three have a diagram', () => {
  assert.deepEqual(site.experience.map((r) => r.slug), ['webhooks', 'memory', 'rewrite', 'trace']);
  assert.deepEqual(site.experience.map((r) => r.visual), [null, 'memory', 'rewrite', 'trace']);
  for (const role of site.experience) {
    assert.ok(role.summary && !/\n/.test(role.summary), `summary on ${role.project}`);
    assert.equal('note' in role, false, `note moved to site.limiter (${role.project})`);
  }
});

test('the rate limiter has its own heading and note, and the removed parts are gone', () => {
  assert.equal(site.limiter.heading, 'Rate limiter');
  assert.equal(site.limiter.tagline, 'A crucial part of Gateways that I built');
  assert.match(site.limiter.note, /token bucket/);
  assert.match(site.limiter.note, /two seconds/);
  for (const key of ['connect', 'photoCredit']) assert.equal(key in site, false, key);
  for (const key of ['facts', 'cta', 'githubLabel', 'photoAlt', 'portraitAlt']) assert.equal(key in site.hero, false, key);
});
