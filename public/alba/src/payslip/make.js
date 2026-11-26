// 브라우저에서 급여명세서 PDF 바이트 만들기: 캔버스에 그림 → RGB 화소 → zlib 압축(CompressionStream) → A4 한 쪽 PDF.
// 서버·외부 패키지 없음. 불러오기만으로는 document 를 건드리지 않는다.

import { A4, drawPayslip } from './draw.js';
import { imagePdf } from './pdf.js';

/** 화소 배율: 1pt = 3화소(약 216dpi) — 인쇄해도 글자가 또렷하다 */
export const SCALE = 3;

/** zlib(deflate) 압축 — PDF FlateDecode 와 같은 형식 */
export async function deflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** RGBA → RGB (바탕이 흰색 불투명이라 알파는 버린다) */
export function rgbaToRgb(rgba) {
  const n = rgba.length / 4;
  const out = new Uint8Array(n * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    out[j] = rgba[i];
    out[j + 1] = rgba[i + 1];
    out[j + 2] = rgba[i + 2];
  }
  return out;
}

/** payslipModel() → PDF 바이트(Uint8Array) */
export async function makePayslipPdf(model, { scale = SCALE, doc = globalThis.document, created = new Date() } = {}) {
  await doc.fonts?.ready;
  const canvas = doc.createElement('canvas');
  canvas.width = Math.round(A4.w * scale);
  canvas.height = Math.round(A4.h * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(canvas.width / A4.w, canvas.height / A4.h);
  drawPayslip(ctx, model);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const z = await deflate(rgbaToRgb(data));
  return imagePdf({ width: canvas.width, height: canvas.height, data: z, title: model.docTitle, created });
}
