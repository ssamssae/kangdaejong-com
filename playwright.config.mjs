import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // T-261026-008: tests/*.test.mjs 는 node:test 파일이다. playwright 가 집으면 작업자가 안 끝난다.
  testMatch: "**/*.spec.mjs",
  testIgnore: "protein.spec.mjs",
  outputDir: "/tmp/kangdaejong-com-playwright",
  reporter: "line",
  use: {
    ...devices["Pixel 7"],
    baseURL: "http://127.0.0.1:4321",
    // T-261026-008: 실제 Chrome(channel "chrome")은 충돌 보고 도우미가 브라우저보다 오래 남아
    //   표준 오류를 물고 있어 작업자가 5분 뒤 강제 종료됐다. 기본 headless shell 은 도우미를 안 띄운다.
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4321",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
