import {test,expect} from '@playwright/test';
import {unzipSync} from 'fflate';
import fs from 'node:fs';

test('Korean name edits export self-contained vector, transparent PNG and complete ZIP',async({page})=>{
 await page.goto('/logo/');await expect(page.locator('#download-zip')).toBeEnabled({timeout:45000});
 await page.getByLabel('상호 / 브랜드 이름').fill('달빛책방');await page.locator('#tagline').fill('나의 작은 시작');
 await expect(page.locator('#logo-preview')).toHaveAttribute('aria-busy','false');
 await page.getByLabel('열린 궤도',{exact:true}).click();
 await page.locator('#layout').selectOption('horizontal');
 await expect(page.locator('#download-zip')).toBeEnabled();
 const download=page.waitForEvent('download');await page.locator('#download-zip').click();const file=await download;const path=await file.path();const zip=unzipSync(fs.readFileSync(path));
 expect(Object.keys(zip)).toHaveLength(10);const svg=new TextDecoder().decode(zip['logo.svg']);expect(svg).toContain('<path');expect(svg).not.toContain('<text');expect(svg).not.toMatch(/<script|https?:\/\/(?!www.w3.org)/);
 const png=zip['logo-transparent-2048.png'];expect(new DataView(png.buffer,png.byteOffset).getUint32(16)).toBe(2048);expect(new DataView(png.buffer,png.byteOffset).getUint32(20)).toBe(2048);
 const social=zip['social-1200x630.png'];expect(new DataView(social.buffer,social.byteOffset).getUint32(16)).toBe(1200);expect(new DataView(social.buffer,social.byteOffset).getUint32(20)).toBe(630);
 expect(new TextDecoder().decode(zip['brand.json'])).toContain('달빛책방');
 await page.reload();await expect(page.locator('#brand-name')).toHaveValue('달빛책방');
});
for(const width of [390,1440])test(`editor cards fit and font switch works at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/logo/');await expect(page.locator('#download-zip')).toBeEnabled({timeout:45000});
 await expect(page.locator('#symbols button')).toHaveCount(4);
 const boxes=await page.locator('#symbols button').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
 const parent=await page.locator('#symbols').boundingBox();expect(boxes[3].right).toBeLessThanOrEqual(parent.x+parent.width+1);
 await page.locator('#font').selectOption('serif');await expect(page.locator('#download-svg')).toBeEnabled({timeout:45000});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`/tmp/T-260924-061-${width}.png`,fullPage:true});
});
test('unavailable provider never opens checkout and keeps demo downloads usable',async({page})=>{
 await page.route('**/logo/api/config',route=>route.fulfill({json:{ready:false,price:9900,credits:8}}));await page.goto('/logo/');await expect(page.locator('#generate')).toBeDisabled();await expect(page.locator('#download-svg')).toBeEnabled({timeout:45000});
});
