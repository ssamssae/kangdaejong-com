import {test,expect} from '@playwright/test';
import {appSupport} from '../src/data/app-support.mjs';
import {paidServices} from '../src/data/paid-services.mjs';
import {handleProductRequest,GUIDE_NAMES} from '../workshop-router/product-guides.mjs';

for(const [id,support] of Object.entries(appSupport))test(`${id}: home entry, privacy and saved web-app origin survive language changes`,async({page,context})=>{
  await page.goto('/');
  const row=page.locator(`[data-product-id="${id}"]`);
  await row.getByRole('link',{name:/앱 안내와 지원/}).click();
  await expect(page).toHaveURL(new RegExp(`/apps/${support.slug}/$`));
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',`https://kangdaejong.com/apps/${support.slug}/`);
  await expect(page.locator('[data-app-web]')).toHaveAttribute('href',support.web);
  await expect(page.locator('[data-app-privacy]')).toHaveAttribute('href',support.privacy);
  if(support.iosPrivacy)await expect(page.getByRole('link',{name:'iOS 개인정보처리방침 ↗'})).toHaveAttribute('href',support.iosPrivacy);
  const koreanTitle=await page.title();
  await page.getByRole('button',{name:'EN',exact:true}).click();
  await expect(page).toHaveTitle(/App guide and support/);
  await expect(page).not.toHaveTitle(/Small tools I build myself/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await expect(page).toHaveTitle(/App guide and support/);
  await page.getByRole('button',{name:'한국어',exact:true}).click();
  await expect(page).toHaveTitle(koreanTitle);
  // Navigation is intercepted before loading the real app; no saved data is touched.
  await context.route(support.web,route=>route.fulfill({body:'Existing web app'}));
  await page.locator('[data-app-web]').click();
  await expect(page).toHaveURL(support.web);
});

for(const service of paidServices)test(`${service.slug}: public introduction keeps transactions and history on the original origin`,async({page,context,request})=>{
  const apiRequests=[];
  page.on('request',r=>{if(r.method()!=='GET'||new URL(r.url()).pathname.startsWith('/api/'))apiRequests.push(r.url());});
  await page.goto(`/${service.slug}/`);
  await expect(page.getByRole('heading',{level:1})).toHaveText(service.name);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',`https://kangdaejong.com/${service.slug}/`);
  await expect(page.locator('[data-service-start]')).toHaveAttribute('href',service.start);
  if(service.sample)await expect(page.locator('[data-service-sample]')).toHaveAttribute('href',service.sample);
  if(service.history)await expect(page.locator('[data-service-history]')).toHaveAttribute('href',service.history);
  if(service.slug==='tojeong')await expect(page.locator('main')).toContainText('현재 테스트 결제를 제공합니다. 실제 판매는 준비 중입니다.');
  expect(await page.locator('form,input,iframe').count()).toBe(0);
  expect(apiRequests).toEqual([]);
  expect(await (await request.get('/sitemap.xml')).text()).toContain(`https://kangdaejong.com/${service.slug}/`);
  const target=new URL(service.start);target.hash='';
  await context.route(target.href,route=>route.fulfill({body:'Existing transaction app'}));
  await page.locator('[data-service-start]').click();
  await expect(page).toHaveURL(service.start);
});

for(const guide of GUIDE_NAMES)test(`${guide}: both languages, reload and guide links work under /product`,async({page,context})=>{
  test.setTimeout(60000);
  await context.route('**/product/**',async route=>{
    const incoming=new URL(route.request().url());
    const response=await handleProductRequest(new Request('https://kangdaejong.com'+incoming.pathname+incoming.search),async(source,init)=>{
      const result=await fetch(source,init);
      const location=result.headers.get('location');
      if(location&&new URL(location,source).href==='https://kangdaejong.com/product'+new URL(source).pathname+new URL(source).search)return fetch(location);
      return result;
    });
    await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});
  });
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`/product/${guide}/?lang=ko`);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',`https://kangdaejong.com/product/${guide}/`);
  await expect(page.locator('html')).toHaveAttribute('lang','ko');
  await page.getByRole('combobox',{name:'언어 선택'}).selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await page.getByRole('combobox',{name:'Language'}).selectOption('ko');
  await expect(page.locator('html')).toHaveAttribute('lang','ko');
  const other=GUIDE_NAMES.find(name=>name!==guide);
  const link=page.locator(`a[href^="https://kangdaejong.com/product/${other}/"]:visible`).first();
  await expect(link).toBeVisible();await link.click();
  await expect(page).toHaveURL(new RegExp(`/product/${other}/`));
  await expect(page.locator('main')).not.toBeEmpty();
  expect(errors).toEqual([]);
});
