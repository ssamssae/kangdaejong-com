import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'./test',testMatch:'ui.spec.mjs',workers:1,
  outputDir:'/tmp/sajin-kureomi-playwright',reporter:'line',
  use:{baseURL:'http://127.0.0.1:4390',channel:'chrome'},
  projects:[{name:'desktop',use:{viewport:{width:1440,height:1000}}},{name:'mobile',use:{...devices['Pixel 7'],channel:'chrome'}}],
  webServer:{command:'node test/serve.mjs',url:'http://127.0.0.1:4390',reuseExistingServer:false,timeout:30_000},
});
