import { defineConfig, devices } from '@playwright/test';

const mainPort = process.env.MAIN_PORT ?? '3000';
const studentPort = process.env.STUDENT_PORT ?? '3001';
const adminPort = process.env.ADMIN_PORT ?? '3002';

const mainBaseUrl = process.env.PLAYWRIGHT_MAIN_BASE_URL ?? `http://127.0.0.1:${mainPort}`;
const studentBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.PLAYWRIGHT_STUDENT_BASE_URL ??
  `http://127.0.0.1:${studentPort}/student`;
const adminBaseUrl =
  process.env.PLAYWRIGHT_ADMIN_BASE_URL ?? `http://127.0.0.1:${adminPort}/admin`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  projects: [
    {
      name: 'main',
      testMatch: /main-smoke\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: mainBaseUrl,
      },
      webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
        ? undefined
        : {
            command: 'pnpm --filter @aah/main dev',
            url: `${mainBaseUrl}/api/health`,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
    },
    {
      name: 'student',
      testMatch: /student-smoke\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: studentBaseUrl,
      },
      webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
        ? undefined
        : {
            command: 'pnpm --filter @aah/student dev',
            url: `${studentBaseUrl}/api/health`,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
    },
    {
      name: 'admin',
      testMatch: /admin-smoke\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: adminBaseUrl,
      },
      webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
        ? undefined
        : {
            command: 'pnpm --filter @aah/admin dev',
            url: `${adminBaseUrl}/api/health`,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
    },
  ],
});
