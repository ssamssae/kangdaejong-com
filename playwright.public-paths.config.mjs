import {defineConfig} from '@playwright/test';
import base from './playwright.config.mjs';
export default defineConfig({
  ...base,
  testMatch:['public-paths.spec.mjs','header-navigation.spec.mjs','home-corrections.spec.mjs'],
  outputDir:'/tmp/kangdaejong-public-paths-playwright',
  use:{...base.use,channel:'chromium',baseURL:'http://127.0.0.1:4329'},
  // An unopened loopback port can time out on WSL. Wait for this owned server's
  // ready message instead of probing the port before the server is started.
  webServer:{command:'npm run preview -- --host 127.0.0.1 --port 4329',wait:{stdout:/http:\/\/127\.0\.0\.1:4329/},timeout:30000,gracefulShutdown:{signal:'SIGTERM',timeout:5000}},
});
