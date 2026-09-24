import sharp from 'sharp';
import { catalog, validateOptions } from './catalog.mjs';
sharp.concurrency(2);
sharp.cache({ memory: 32, files: 0, items: 20 });
export async function correctPhoto(bytes, input) {
  const { category, preset, strength } = validateOptions(input);
  const options = { limitInputPixels: catalog.maxPixels, failOn: 'warning' };
  let meta;
  try { meta = await sharp(bytes, options).metadata(); } catch { throw Object.assign(new Error('읽을 수 없는 사진입니다. JPG·PNG·WebP 파일을 확인해주세요.'), { status: 400 }); }
  if (!['jpeg', 'png', 'webp'].includes(meta.format) || (meta.pages ?? 1) !== 1) throw Object.assign(new Error('움직이지 않는 JPG·PNG·WebP 사진만 지원합니다.'), { status: 400 });
  // Re-encode the comparison image: strip GPS/EXIF and keep orientation consistent.
  const original = await sharp(bytes, options).rotate().resize({ width: catalog.maxEdge, height: catalog.maxEdge, fit: 'inside', withoutEnlargement: true }).toColourspace('srgb').png().toBuffer();
  const amount = strength / 100;
  const look = {
    portrait: { natural: [0.05, 0], soft: [0.07, -0.05], bright: [0.15, 0.025] },
    product: { natural: [0.03, 0], clean: [0.065, 0], bright: [0.13, 0] },
    space: { natural: [0.05, 0.02], food: [0.06, 0.12], interior: [0.17, 0.015] },
  }[category][preset];
  // Global tonal adjustments only: no face reshaping, invented objects, or geometry edits.
  const output = await sharp(original).modulate({ brightness: 1 + look[0] * amount, saturation: 1 + look[1] * amount }).png().toBuffer();
  const resultMeta = await sharp(output).metadata();
  return { original, output, width: resultMeta.width, height: resultMeta.height };
}
