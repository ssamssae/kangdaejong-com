import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'ai-setup.spec.mjs',workers:1,reporter:'line',outputDir:'./test-results/ai-setup',use:{channel:'chrome',baseURL:'http://127.0.0.1:14339'},webServer:{command:'npm run preview -- --host 127.0.0.1 --port 14339',url:'http://127.0.0.1:14339',reuseExistingServer:false,timeout:30000}});
