import { defineConfig } from '@playwright/test';
const live = process.env.DIGITAL_BASE_URL;
export default defineConfig({testDir:'./tests',testMatch:'digital-products.spec.mjs',workers:1,reporter:'line',outputDir:'./test-results/digital-products',use:{channel:'chrome',baseURL:live||'http://127.0.0.1:14342'},webServer:live?undefined:{command:'npm run preview -- --host 127.0.0.1 --port 14342',url:'http://127.0.0.1:14342',reuseExistingServer:false,timeout:30000}});
