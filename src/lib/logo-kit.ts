import * as opentype from 'opentype.js';
import DOMPurify from 'dompurify';
import { zipSync, strToU8 } from 'fflate';

export const samples = [
  { name: '겹친 잎', svg: '<path d="M128 206C38 170 38 68 128 32c90 36 90 138 0 174Z" fill="currentColor"/><path d="M128 62v121M81 105l47 43 47-43" fill="none" stroke="white" stroke-width="9" stroke-linecap="round"/>' },
  { name: '열린 궤도', svg: '<circle cx="128" cy="128" r="73" fill="none" stroke="currentColor" stroke-width="23"/><path d="M59 169 192 67" stroke="white" stroke-width="38"/><path d="M55 163 192 62" stroke="currentColor" stroke-width="15" stroke-linecap="round"/><circle cx="195" cy="63" r="17" fill="currentColor"/>' },
  { name: '네 개의 면', svg: '<path d="m128 27 43 66-43 28-43-28Zm101 101-66 43-28-43 28-43ZM128 229l-43-66 43-28 43 28ZM27 128l66-43 28 43-28 43Z" fill="currentColor"/>' },
  { name: '작은 아치', svg: '<path d="M52 210V107a76 76 0 0 1 152 0v103h-32V107a44 44 0 0 0-88 0v103Z" fill="currentColor"/><circle cx="128" cy="155" r="22" fill="currentColor"/>' },
];
export type Design = { name: string; tagline: string; color: string; background: string; font: string; layout: string; symbol: string; spacing: number; scale: number };
const fonts = new Map<string, Promise<any>>();
export async function getFont(style: string) {
  const file = style === 'serif' ? 'NotoSerifKR' : 'NotoSansKR';
  if (!fonts.has(file)) fonts.set(file, fetch(`/logo/fonts/${file}.ttf`).then(r => { if (!r.ok) throw Error('글꼴을 불러오지 못했습니다.'); return r.arrayBuffer(); }).then(b => { const font = opentype.parse(b); font.variation?.set({ wght: 500 }); return font; }).catch(e => { fonts.delete(file); throw e; }));
  return fonts.get(file)!;
}
export const wrap = (body: string, w = 256, h = 256) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
export function cleanSymbol(source: string, color: string) {
  const safe = DOMPurify.sanitize(source, { USE_PROFILES: { svg: true, svgFilters: false }, FORBID_TAGS: ['style', 'image', 'use', 'foreignObject', 'a', 'animate', 'set'], FORBID_ATTR: ['style', 'href', 'xlink:href'] });
  const doc = new DOMParser().parseFromString(safe, 'image/svg+xml');
  if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') throw Error('벡터 파일을 읽지 못했습니다.');
  for (const el of [doc.documentElement, ...doc.querySelectorAll('*')]) {
    for (const attr of [...el.attributes]) {
      if (/^on/i.test(attr.name) || /(?:https?:|data:|javascript:)/i.test(attr.value)) el.removeAttribute(attr.name);
    }
    for (const name of ['fill', 'stroke']) {
      const value = el.getAttribute(name);
      if (value && !['none', 'transparent', 'white', '#fff', '#ffffff'].includes(value.toLowerCase()) && !/^url\(#/.test(value)) el.setAttribute(name, color);
    }
  }
  doc.documentElement.setAttribute('color', color);
  doc.documentElement.setAttribute('fill', color);
  return new XMLSerializer().serializeToString(doc.documentElement);
}
function textShape(font: any, text: string, size: number, max: number) {
  const path = font.getPath(text, 0, 0, size);
  const box = path.getBoundingBox();
  const width = box.x2 - box.x1, height = box.y2 - box.y1;
  const factor = width ? Math.min(1, max / width) : 1;
  return { d: path.toPathData(2), box, width: width * factor, height: height * factor, factor };
}
export async function compose(d: Design, kind = 'logo', transparent = false) {
  const font = await getFont(d.font);
  const wide = kind === 'social', icon = kind === 'icon';
  const w = wide ? 1200 : 1024, h = wide ? 630 : 1024;
  const title = textShape(font, d.name || '나의 브랜드', 102, wide ? 750 : 790);
  const sub = textShape(font, d.tagline, 30, wide ? 750 : 790);
  const horizontal = d.layout === 'horizontal' && !icon;
  const symbolSize = icon ? 760 : horizontal ? 220 * d.scale : (wide ? 150 : 300) * d.scale;
  const gap = 35 + d.spacing;
  const textHeight = title.height + (d.tagline ? sub.height + 30 : 0);
  const totalW = horizontal ? symbolSize + gap + Math.max(title.width, sub.width) : Math.max(symbolSize, title.width);
  const totalH = icon ? symbolSize : horizontal ? Math.max(symbolSize, textHeight) : symbolSize + gap + textHeight;
  // Fit the complete group, then center its actual bounds rather than its text baseline.
  const fit = Math.min(1, (w - 120) / totalW, (h - 90) / totalH);
  const offsetX = (w - totalW * fit) / 2, offsetY = (h - totalH * fit) / 2;
  const sx = horizontal || icon ? 0 : (totalW - symbolSize) / 2;
  const sy = horizontal ? (totalH - symbolSize) / 2 : 0;
  const clean = cleanSymbol(d.symbol, d.color);
  const symbol = clean.replace(/<svg\b[^>]*>/, m => m.replace(/\s(?:width|height|x|y)="[^"]*"/g, '').replace('>', ` x="${sx}" y="${sy}" width="${symbolSize}" height="${symbolSize}">`));
  const tx = horizontal ? symbolSize + gap : (totalW - title.width) / 2;
  const ty = horizontal ? (totalH - textHeight) / 2 : symbolSize + gap;
  const text = (shape: any, x: number, y: number) => `<path d="${shape.d}" fill="${d.color}" transform="translate(${x},${y}) scale(${shape.factor}) translate(${-shape.box.x1},${-shape.box.y1})"/>`;
  let body = transparent ? '' : `<rect width="${w}" height="${h}" fill="${d.background}"/>`;
  body += `<g transform="translate(${offsetX},${offsetY}) scale(${fit})">${symbol}${icon ? '' : text(title, tx, ty) + (d.tagline ? text(sub, horizontal ? tx : (totalW-sub.width)/2, ty+title.height+30) : '')}</g>`;
  return wrap(body, w, h);
}
export async function png(svg: string, width: number, height: number) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image(); img.src = url; await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d'); if (!ctx) throw Error('이미지 변환을 지원하지 않는 브라우저입니다.');
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(Error('PNG 변환 실패')), 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}
export function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export function ico(bytes: Uint8Array, size = 256) {
  const result = new Uint8Array(22 + bytes.length), view = new DataView(result.buffer);
  view.setUint16(2, 1, true); view.setUint16(4, 1, true); result[6] = size % 256; result[7] = size % 256;
  view.setUint16(10, 1, true); view.setUint16(12, 32, true); view.setUint32(14, bytes.length, true); view.setUint32(18, 22, true); result.set(bytes, 22); return result;
}
export async function bundle(d: Design) {
  const logo = await compose(d), transparent = await compose(d, 'logo', true), icon = await compose(d, 'icon'), social = await compose(d, 'social');
  const bytes = async (svg: string, w: number, h: number) => new Uint8Array(await (await png(svg, w, h)).arrayBuffer());
  const icon256 = await bytes(icon, 256, 256);
  const files = {
    'logo.svg': strToU8(logo), 'logo-transparent.svg': strToU8(transparent), 'logo-2048.png': await bytes(logo, 2048, 2048),
    'logo-transparent-2048.png': await bytes(transparent, 2048, 2048), 'favicon.svg': strToU8(icon), 'favicon.ico': ico(icon256),
    'apple-touch-icon.png': await bytes(icon, 180, 180), 'social-1200x630.png': await bytes(social, 1200, 630),
    'brand.json': strToU8(JSON.stringify({ name: d.name, tagline: d.tagline, color: d.color, background: d.background, font: d.font, layout: d.layout }, null, 2)),
    'README.txt': strToU8('로고꾸러미\nSVG는 글자를 윤곽선으로 변환한 벡터입니다.\nPNG는 2048px이며 투명 배경 파일이 별도로 있습니다.\nfavicon.ico / favicon.svg: 웹사이트 탭\napple-touch-icon.png: 홈 화면\nsocial-1200x630.png: 링크 미리보기\n견본 심볼은 독점 디자인이 아닙니다. 상표 등록 가능성은 별도 확인이 필요합니다.\n'),
  };
  return new Blob([zipSync(files)], { type: 'application/zip' });
}
