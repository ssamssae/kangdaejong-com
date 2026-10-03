import {test, expect} from '@playwright/test';
import icons from '../src/data/product-icon-sources.json' with {type:'json'};
for(const width of [390,1440]) test(`home corrections and organization tone at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900}); await page.goto('/');
 await expect(page.locator('main')).not.toContainText('문의노트');
 for(const name of ['더치페이 계산기','약먹자','계산기알람']) {
  const row=page.locator('.app-row').filter({has:page.getByRole('heading',{name,exact:true})});
  const image=row.locator('img'); await expect(image).toHaveCount(1);
  await expect(image).toHaveAttribute('src',icons.icons.find(i=>i.name===name)?.icon || 'missing-icon');
  await image.scrollIntoViewIfNeeded(); await expect.poll(()=>image.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
 }
 const home=await page.evaluate(()=>({bg:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(document.body).fontFamily,width:document.querySelector('main').getBoundingClientRect().width}));
 await page.goto('/organization/');
 const company=await page.evaluate(()=>({bg:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(document.body).fontFamily,width:document.querySelector('main').getBoundingClientRect().width}));
 expect(company).toEqual(home);
 await expect(page.locator('h1 span')).toHaveCSS('color','rgb(36, 88, 204)');
 await expect(page.locator('dl')).toContainText('878-21-02478');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:test.info().outputPath(`organization-${width}.png`),fullPage:true});
});
test('night motion visibly moves, freezes, and resumes',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/#mood'); await page.getByRole('button',{name:'잠깐 쉬기',exact:true}).click();
 const corner=page.locator('#mood'); const orb=corner.locator('.mood-orb');
 const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const pos=()=>orb.evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y};});
 await corner.getByRole('button',{name:'움직임 멈추기'}).click(); await settle();
 const frozen=await pos(); await page.waitForTimeout(400); expect(await pos()).toEqual(frozen);
 await corner.getByRole('button',{name:'움직임 켜기'}).click();
 const start=await pos(); await page.waitForTimeout(1800); const end=await pos();
 expect(Math.hypot(end.x-start.x,end.y-start.y)).toBeGreaterThan(3);
 await corner.screenshot({path:test.info().outputPath('night-moving.png')});
 await corner.getByRole('button',{name:'움직임 멈추기'}).click(); await settle();
 const stopped=await pos(); await page.waitForTimeout(400); expect(await pos()).toEqual(stopped);
});
