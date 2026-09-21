import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testIgnore: "protein.spec.mjs",
  outputDir: "/tmp/kangdaejong-com-playwright",
  reporter: "line",
  use: {
    ...devices["Pixel 7"],
    baseURL: "http://127.0.0.1:4321",
    channel: "chrome",
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4321",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
