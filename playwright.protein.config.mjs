import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'protein.spec.mjs',
  outputDir: '/tmp/protein-kangdaejong-playwright',
  reporter: 'line',
  use: { ...devices['Pixel 7'], baseURL: 'http://127.0.0.1:4328', channel: 'chromium' },
  webServer: {
    command: 'astro preview --host 127.0.0.1 --port 4328',
    wait: {stdout:/http:\/\/127\.0\.0\.1:4328/},
    gracefulShutdown: {signal:'SIGTERM',timeout:5000},
    timeout: 30000,
  },
});
