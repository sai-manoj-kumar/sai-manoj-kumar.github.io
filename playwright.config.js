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
