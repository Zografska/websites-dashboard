import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173/',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
    // A dummy key switches tracking on in the e2e build; specs intercept every PostHog request,
    // so nothing leaves the machine (ANALYTICS_SPEC §11). The real key exists only in the deploy job.
    // Test mode is forced off, so a local .env file can't switch it on for the e2e build.
    env: { VITE_POSTHOG_KEY: 'phc_test_dummy', VITE_ANALYTICS_TEST: '' },
    timeout: 120_000,
  },
})
