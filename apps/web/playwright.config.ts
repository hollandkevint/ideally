import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Enhanced reporting for OAuth testing
  reporter: [
    ['html', {
      outputFolder: 'playwright-report',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    ['list'],
    process.env.CI ? ['github'] : ['line'],
    ['./tests/reporters/oauth-reporter.ts'],
    ['json', {
      outputFile: 'playwright-report/test-results.json'
    }],
    ['junit', {
      outputFile: 'playwright-report/junit-results.xml'
    }]
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Increased timeout for OAuth flows
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Test file patterns
  testIgnore: ['**/tests/setup.ts', '**/*.test.ts', '**/vitest.config.ts'],

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // OAuth testing requires specific permissions
        contextOptions: {
          permissions: ['notifications'],
        }
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        contextOptions: {
          permissions: ['notifications'],
        }
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes for server startup
  },
});