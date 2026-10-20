const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright E2E configuration for PrepSmart AI
 * Uses the locally installed Microsoft Edge browser on Windows
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for deterministic test execution
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    channel: 'msedge',
    headless: true,
    storageState: './tests/e2e/storage-state.json',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'Desktop Edge',
      use: {
        channel: 'msedge',
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'Mobile Edge',
      use: {
        channel: 'msedge',
        viewport: { width: 390, height: 844 },
        isMobile: true,
      },
    },
  ],
});
