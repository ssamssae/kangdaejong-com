// T-261011-068: 기기 설정을 따르는 다크 모드, PC 넓은 레이아웃, 한국어/EN 즉시 전환, 가벼운 아이콘.
// 공용 헤더는 라이브(kangdaejong.com/mb-components.js)가 아니라 이 저장소의 사본으로 검사한다.
import {test, expect} from '@playwright/test';
import {brand, rgb} from './brand-colors.mjs';
import {fileURLToPath} from 'node:url';
import catalog from '../public/brand/products/catalog.json' with {type:'json'};
const components=fileURLToPath(new URL('../public/mb-components.js',import.meta.url));
test.beforeEach(async({page})=>{ await page.route('https://kangdaejong.com/mb-components.js',route=>route.fulfill({path:components,contentType:'application/javascript'})); });
const header=page=>page.locator('mb-header');

test('dark mode follows the device setting and keeps light untouched',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.emulateMedia({colorScheme:'light'}); await page.goto('/');
 await expect(page.locator('body')).toHaveCSS('background-color',rgb('light','--bg'));
 expect(await header(page).evaluate(e=>getComputedStyle(e).getPropertyValue('--mb-bg').trim())).toBe(brand.light['--mb-host-bg']);
 await page.emulateMedia({colorScheme:'dark'}); await page.goto('/');
 await expect(page.locator('body')).toHaveCSS('background-color',rgb('dark','--bg'));
 await expect(page.locator('body')).toHaveCSS('color',rgb('dark','--fg'));
 await expect(page.locator('h1 span')).toHaveCSS('color',rgb('dark','--accent'));
 await expect(page.locator('.project-card').first()).toHaveCSS('background-color',rgb('dark','--bg-elev'));
 expect(await header(page).evaluate(e=>getComputedStyle(e.shadowRoot.querySelector('.header')).backgroundColor)).toBe(rgb('dark','--bg'));
 expect(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme)).toBe('dark');
 for(const path of ['/organization/','/system/','/ipta/']) { await page.goto(path); await expect(page.locator('body')).toHaveCSS('background-color',rgb('dark','--bg')); }
 await page.goto('/'); await page.screenshot({path:test.info().outputPath('home-dark.png'),fullPage:true});
});

test('desktop uses the wide page width and mobile keeps its gutters',async({page})=>{
 await page.setViewportSize({width:1600,height:900}); await page.goto('/');
 const widths=await page.evaluate(()=>({main:document.querySelector('main').getBoundingClientRect().width,header:document.querySelector('mb-header').shadowRoot.querySelector('.inner').getBoundingClientRect().width,footer:document.querySelector('footer').getBoundingClientRect().width,apps:getComputedStyle(document.querySelector('.app-grid')).gridTemplateColumns.split(' ').length,overflow:document.documentElement.scrollWidth<=innerWidth}));
 expect(widths).toEqual({main:1440,header:1440,footer:1440,apps:3,overflow:true});
 await expect(page.locator('.section-title > span').first()).toHaveCSS('letter-spacing','normal');
 await page.setViewportSize({width:390,height:844}); await page.goto('/');
 expect(await page.evaluate(()=>({main:document.querySelector('main').getBoundingClientRect().width,overflow:document.documentElement.scrollWidth<=innerWidth}))).toEqual({main:350,overflow:true});
});

test('the header toggle switches the whole page to English and back without reloading',async({page})=>{
 await page.setViewportSize({width:1440,height:900}); await page.goto('/');
 const toggle=lang=>header(page).locator(`.lang-button[data-lang="${lang}"]`);
 await expect(toggle('ko')).toHaveAttribute('aria-pressed','true');
 await toggle('en').click();
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 await expect(page.locator('h1')).toContainText('Daejong Kang');
 await expect(page.locator('#projects-title')).toHaveText('Tools I build');
 await expect(page.locator('.text-tool-card:not(.web-service-card) h3')).toHaveText('복붙 정리기 · Text Cleaner');
 await expect(page.locator('.text-tool-card:not(.web-service-card) > a')).toHaveText('Clean up text→');
 await expect(page.locator('.web-service-card h3')).toHaveText('Cheotireum (First Name)');
 await expect(page.locator('.book-action').first()).toHaveText('Read free ↗ · PDF, 69 pages');
 expect(await header(page).evaluate(e=>[...e.shadowRoot.querySelectorAll('.links a .link-title')].map(a=>a.textContent.trim()))).toEqual(['Projects','Apps','Contact']);
 await expect(page).toHaveTitle(/Daejong Kang/);
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('lang','en');
 await expect(page.locator('h1')).toContainText('Daejong Kang');
 await expect(toggle('en')).toHaveAttribute('aria-pressed','true');
 await page.locator('.pause-details summary').click(); await page.locator('.mood-options button[data-choice="rest"]').click();
 await expect(page.locator('.mood-quote')).not.toContainText(/[가-힣]/);
 await toggle('ko').click();
 await expect(page.locator('html')).toHaveAttribute('lang','ko');
 await expect(page.locator('h1')).toHaveText('안녕하세요.만드는 사람 강대종이에요.');
 await expect(page.locator('.text-tool-card:not(.web-service-card) h3')).toHaveText('복붙 정리기');
 await expect(page.locator('.web-service-card h3')).toHaveText('첫이름');
 await expect(page.locator('.mood-quote')).toContainText(/[가-힣]/);
 expect(await page.evaluate(()=>localStorage.getItem('mb-lang'))).toBe('ko');
});

test('product icons use catalog WebP aliases with 2x sources and valid JSON-LD is present',async({page})=>{
 await page.setViewportSize({width:1440,height:900}); await page.goto('/');
 const images=page.locator('.app-row img, .project-icon'); await expect(images).toHaveCount(11);
 for(const image of await images.all()) {
  const id=await image.evaluate(el=>el.closest('[data-product-id]').dataset.productId);
  const entry=catalog.products.find(product=>product.id===id);
  expect(entry,`catalog entry for ${id}`).toBeDefined();
  await expect(image).toHaveAttribute('src',entry.icon); await expect(image).toHaveAttribute('srcset',`${entry.icon}, ${entry.icon2x} 2x`);
  await image.scrollIntoViewIfNeeded(); await expect.poll(()=>image.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
 }
 for(const entry of catalog.products.filter(i=>i.icon2x)) {
  expect(entry.files.icon.source).toMatch(/-96\.webp$/);
  expect(entry.files.icon2x.source).toMatch(/-192\.webp$/);
 }
 // T-261011-068 후속: 그록봇이 만든 브릿지 4칸 카드·자비스 아이콘·브릿지 타일 4개.
 const bridge=page.locator('#projects .project-card').filter({has:page.getByRole('heading',{name:'텔레그램 브릿지',exact:true})});
 await expect(bridge.locator('.project-visual')).toHaveAttribute('alt','Claude, Codex, Grok, Cursor 네 가지 오픈소스 텔레그램 브릿지');
 await expect(bridge.locator('.project-mark')).toHaveCount(0);
 const jarvis=page.locator('#projects .project-card').filter({has:page.getByRole('heading',{name:'자비스',exact:true})});
 await expect(jarvis.locator('.project-icon')).toHaveAttribute('src',catalog.products.find(i=>i.id==='jarvis').icon);
 await page.locator('#open-tools summary').click();
 const tiles=page.locator('.bridge-links .bridge-tile'); await expect(tiles).toHaveCount(4);
 for(const tile of await tiles.all()) { await expect.poll(()=>tile.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true); }
 expect(await bridge.locator('.project-visual').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
 const ld=await page.locator('script[type="application/ld+json"]').textContent(); const graph=JSON.parse(ld)['@graph'];
 expect(graph.map(n=>n['@type'])).toEqual(['Organization','Person','WebSite']);
 expect(await page.evaluate(()=>[...document.querySelectorAll('h1,h2,h3')][0].tagName)).toBe('H1');
});
