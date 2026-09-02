import { defineConfig } from '@playwright/test'

export default defineConfig({
  fullyParallel: true,
  reporter: 'list',
  retries: process.env.CI ? 2 : 0,
  testDir: './e2e',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    browserName: 'chromium',
    trace: 'on-first-retry',
  },
})
