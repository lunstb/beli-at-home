import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // Tests depend on shared state (users, friendships)
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'mobile-chrome', use: { ...devices['iPhone 16'], browserName: 'chromium' } },
  ],
  webServer: [
    {
      command: 'cd backend && NODE_ENV=test PORT=3001 npx tsx src/index.ts',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      env: { NODE_ENV: 'test', STORAGE_MODE: 'local' },
    },
    {
      command: 'cd frontend && npx vite --port 5173',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
