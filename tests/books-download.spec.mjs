import {test,expect} from '@playwright/test';
// T-261019-023: 홈 무료 전자책 3권 — 읽기 링크 옆에 같은 파일을 내려받는 버튼 3개.
const files=['/books/solo-company-ai-automation.pdf','/books/solo-ai-team.pdf','/books/phone-controls-my-computer-ai.pdf'];

test('each free e-book row keeps its read link and adds a same-file download button',async({page})=>{
 await page.goto('/#books');
 const rows=page.locator('#books .book-item');
 await expect(rows).toHaveCount(3);
 for(let i=0;i<3;i++){
  const row=rows.nth(i);
  await expect(row.locator('a.book-row')).toHaveAttribute('href',files[i]);
  const download=row.locator('a.book-download');
  await expect(download).toHaveCount(1);
  await expect(download).toHaveAttribute('href',files[i]);
  await expect(download).toHaveAttribute('download',/\.pdf$/);
  await expect(download).toBeVisible();
  await expect(download).toContainText('다운로드');
  await expect(download).toHaveAttribute('aria-label',/다운로드/);
 }
 // 읽기 링크 3개는 그대로 (기존 검사와 같은 선택자)
 await expect(page.locator('#books a.book-row[href^="/books/"][href$=".pdf"]')).toHaveCount(3);
});

test('download buttons stay tappable on phones',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/#books');
 const buttons=await page.locator('#books a.book-download').all();
 expect(buttons.length).toBe(3);
 for(const button of buttons){
  await expect(button).toBeVisible();
  const box=await button.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
 }
});

test('download links resolve to the PDF files',async({page})=>{
 await page.goto('/');
 const hrefs=await page.locator('#books a.book-download').evaluateAll(links=>links.map(link=>link.getAttribute('href')));
 expect(hrefs).toEqual(files);
 for(const href of hrefs){
  const res=await page.request.get(href);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('pdf');
 }
});
