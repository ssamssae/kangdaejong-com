import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

// Approved centered −β artwork (T-260924-075). Keep one source for every size.
const paths = `<path d="M36 121h46" stroke="#a94830" stroke-width="17" stroke-linecap="round"/><path d="M111 204V78c0-25 17-40 39-40 24 0 39 15 39 34 0 22-17 35-38 35h-18m0 0h18c29 0 47 17 47 41 0 25-17 42-43 42-17 0-31-7-44-19" fill="none" stroke="#a94830" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>`;
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g transform="translate(11 7)">${paths}</g></svg>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="#f7f6f2"/><g transform="translate(38 38) scale(.703125) translate(11 7)">${paths}</g></svg>`;
writeFileSync('public/favicon.svg', svg);
writeFileSync('public/minusbeta-badge.svg', svg);
const browser = await chromium.launch({channel:'chrome',headless:true});
try {
  const page = await browser.newPage({viewport:{width:2048,height:2048},deviceScaleFactor:1});
  const renderIcon = async (size) => {
    await page.setViewportSize({width:size,height:size});
    await page.setContent(`<style>body{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`);
    return page.screenshot();
  };
  writeFileSync('public/studio-icon.png', await renderIcon(2048));
  writeFileSync('public/apple-touch-icon.png', await renderIcon(180));
  const sizes = [16,32,48,256], icons = [];
  for (const size of sizes) icons.push(await renderIcon(size));
  const directory = Buffer.alloc(6 + 16 * sizes.length);
  directory.writeUInt16LE(1,2); directory.writeUInt16LE(sizes.length,4);
  let offset = directory.length;
  icons.forEach((png,i) => {
    const entry = 6 + i * 16;
    directory[entry] = directory[entry+1] = sizes[i] === 256 ? 0 : sizes[i];
    directory.writeUInt16LE(1,entry+4); directory.writeUInt16LE(32,entry+6);
    directory.writeUInt32LE(png.length,entry+8); directory.writeUInt32LE(offset,entry+12);
    offset += png.length;
  });
  writeFileSync('public/favicon.ico', Buffer.concat([directory,...icons]));
  await page.setViewportSize({width:1200,height:630});
  await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;background:#f7f6f2;color:#a94830;width:1200px;height:630px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:'Apple SD Gothic Neo',sans-serif}svg{width:290px;height:290px;display:block}h1{font-size:54px;letter-spacing:-2px;margin:12px 0 14px;line-height:1.2}p{font:20px Arial,sans-serif;letter-spacing:4px;margin:0}footer{font-size:20px;color:#74786f;margin-top:40px}</style>${mark}<h1>마이너스베타스튜디오</h1><p>MINUS BETA STUDIO</p><footer>새로운 서비스를 준비 중입니다.</footer>`);
  await page.evaluate(()=>document.fonts.ready);
  const social = await page.screenshot();
  writeFileSync('public/og-studio-centered-20260924.png',social);
  // Keep old inbound image URLs consistent with the current identity.
  writeFileSync('public/og-studio-20260924.png',social);
} finally {
  await browser.close();
}
