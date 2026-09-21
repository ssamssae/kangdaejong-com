import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'protein.spec.mjs',
  outputDir: '/tmp/protein-kangdaejong-playwright',
  reporter: 'line',
  use: { ...devices['Pixel 7'], baseURL: 'http://127.0.0.1:4328', channel: 'chrome' },
  webServer: {
    command: 'astro preview --config astro.protein.config.mjs --host 127.0.0.1 --port 4328',
    url: 'http://127.0.0.1:4328',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
