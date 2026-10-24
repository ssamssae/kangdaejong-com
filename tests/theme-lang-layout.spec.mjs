// T-261011-068: 기기 설정을 따르는 다크 모드, PC 넓은 레이아웃, 한국어/EN 즉시 전환, 가벼운 아이콘.
// 공용 헤더는 라이브(kangdaejong.com/mb-components.js)가 아니라 이 저장소의 사본으로 검사한다.
import {test, expect} from '@playwright/test';
import {brand, rgb} from './brand-colors.mjs';
import {fileURLToPath} from 'node:url';
import catalog from '../public/brand/products/catalog.json' with {type:'json'};
const components=fileURLToPath(new URL('../public/mb-components.js',import.meta.url));
test.beforeEach(async({page})=>{ await page.route('https://kangdaejong.com/mb-components.js',route=>route.fulfill({path:components,contentType:'application/javascript'})); });
const header=page=>page.locator('mb-header');

// T-261024-050: 회사 홈은 다크를 풀었다(대종님 「다크도 풀자」) — 기기 설정이 다크여도 첫이름과 같은 라이트 값 하나. 다크 블록은 작업장·대표소개·단백질 몫이다.
test('company home stays light even when the device prefers dark',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.emulateMedia({colorScheme:'light'}); await page.goto('/');
 await expect(page.locator('body')).toHaveCSS('background-color',rgb('light','--bg'));
 expect(await header(page).evaluate(e=>getComputedStyle(e).getPropertyValue('--mb-bg').trim())).toBe(brand.light['--mb-host-bg']);
 await page.emulateMedia({colorScheme:'dark'}); await page.goto('/');
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await expect(page.locator('body')).toHaveCSS('background-color',rgb('light','--bg'));
 await expect(page.locator('body')).toHaveCSS('color',rgb('light','--fg'));
 await expect(page.locator('h1 span')).toHaveCSS('color',rgb('light','--accent'));
 await expect(page.locator('.project-card').first()).toHaveCSS('background-color',rgb('light','--bg-elev'));
 expect(await header(page).evaluate(e=>getComputedStyle(e.shadowRoot.querySelector('.header')).backgroundColor)).toBe(rgb('light','--bg'));
 expect(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme)).toBe('light');
 expect(await page.locator('meta[name="color-scheme"]').getAttribute('content')).toBe('light');
 for(const path of ['/organization/','/system/','/ipta/','/tools/text/','/404-missing/']) { await page.goto(path); await expect(page.locator('html')).toHaveAttribute('data-theme','light'); await expect(page.locator('body')).toHaveCSS('background-color',rgb('light','--bg')); }
 await page.goto('/'); await page.screenshot({path:test.info().outputPath('home-device-dark-stays-light.png'),fullPage:true});
});

// T-261024-050: 첫이름과 같은 부품 값 — 버튼 56px·모서리 14px·글자 17/26, 카드 20px·안쪽 24px(900px 이상), 글 링크 15px 굵게 밑줄.
test('home parts share the 첫이름 tone values from the shared tone file',async({page})=>{
 await page.setViewportSize({width:1440,height:900}); await page.goto('/'); await page.evaluate(()=>document.fonts.ready);
 const read=(selector,props)=>page.locator(selector).first().evaluate((e,props)=>Object.fromEntries(props.map(p=>[p,getComputedStyle(e)[p]])),props);
 expect(await read('.intro-links .mb-btn--primary',['height','borderTopLeftRadius','fontSize','lineHeight','fontWeight','paddingLeft','backgroundColor','color'])).toEqual({height:brand.light['--tone-control-height'],borderTopLeftRadius:brand.light['--tone-radius-control'],fontSize:brand.light['--tone-body-size'],lineHeight:brand.light['--tone-body-line'],fontWeight:brand.light['--tone-weight-bold'],paddingLeft:brand.light['--tone-control-padding'],backgroundColor:rgb('light','--cta-bg'),color:rgb('light','--cta-fg')});
 expect(await read('.project-card',['borderTopLeftRadius','paddingTop','borderTopWidth','backgroundColor'])).toEqual({borderTopLeftRadius:brand.light['--tone-radius-card'],paddingTop:'24px',borderTopWidth:'0px',backgroundColor:rgb('light','--bg-elev')});
 expect(await read('.project-card > a',['fontSize','fontWeight','textDecorationLine','minHeight'])).toEqual({fontSize:brand.light['--tone-label-size'],fontWeight:brand.light['--tone-weight-bold'],textDecorationLine:'underline',minHeight:brand.light['--tone-tap-height']});
 expect(await read('h1',['fontSize','lineHeight','fontWeight'])).toEqual({fontSize:'44px',lineHeight:'56px',fontWeight:brand.light['--tone-weight-bold']});
 expect(await read('body',['fontSize','lineHeight'])).toEqual({fontSize:brand.light['--tone-body-size'],lineHeight:brand.light['--tone-body-line']});
 expect(await read('.mb-chip',['minHeight','fontSize','borderTopLeftRadius'])).toEqual({minHeight:brand.light['--tone-chip-height'],fontSize:brand.light['--tone-caption-size'],borderTopLeftRadius:brand.light['--tone-radius-pill']});
 expect(await header(page).evaluate(e=>{const s=getComputedStyle(e.shadowRoot.querySelector('.links a'));return {fontSize:s.fontSize,fontWeight:s.fontWeight,minHeight:s.minHeight};})).toEqual({fontSize:brand.light['--tone-label-size'],fontWeight:brand.light['--tone-weight-bold'],minHeight:brand.light['--tone-tap-height']});
 await page.setViewportSize({width:390,height:844}); await page.goto('/');
 expect(await read('h1',['fontSize','lineHeight'])).toEqual({fontSize:brand.light['--tone-display-size'],lineHeight:brand.light['--tone-display-line']});
 expect(await read('.project-card',['paddingTop'])).toEqual({paddingTop:brand.light['--tone-card-padding']});
});

// T-261024-050: PC 폭은 첫이름과 같은 공용 톤 값(--tone-page-max 1080px). 공용 원본의 --page-max(1440px)는 작업장 몫으로 남는다.
test('desktop uses the 첫이름 page width and mobile keeps its gutters',async({page})=>{
 await page.setViewportSize({width:1600,height:900}); await page.goto('/');
 const widths=await page.evaluate(()=>({main:document.querySelector('main').getBoundingClientRect().width,header:document.querySelector('mb-header').shadowRoot.querySelector('.inner').getBoundingClientRect().width,footer:document.querySelector('footer').getBoundingClientRect().width,apps:getComputedStyle(document.querySelector('.app-grid')).gridTemplateColumns.split(' ').length,overflow:document.documentElement.scrollWidth<=innerWidth}));
 const pageMax=parseInt(brand.light['--tone-page-max']);
 expect(widths).toEqual({main:pageMax,header:pageMax,footer:pageMax,apps:3,overflow:true});
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
 const tiles=page.locator('.bridge-links .bridge-tile'); await expect(tiles).toHaveCount(5);
 for(const tile of await tiles.all()) { await expect.poll(()=>tile.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true); }
 expect(await bridge.locator('.project-visual').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
 const ld=await page.locator('script[type="application/ld+json"]').textContent(); const graph=JSON.parse(ld)['@graph'];
 expect(graph.map(n=>n['@type'])).toEqual(['Organization','Person','WebSite']);
 expect(await page.evaluate(()=>[...document.querySelectorAll('h1,h2,h3')][0].tagName)).toBe('H1');
});
