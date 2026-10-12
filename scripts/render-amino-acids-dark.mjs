// T-261012-024: 다크 모드용 아미노산 그림(public/protein/dark/<slug>.webp).
// 기존 그림(render-amino-acids.mjs 가 만든 public/protein/<slug>.png)과 같은 구도로 바탕만 어둡게 찍는다.
// 저장소에 있는 구조 파일(public/protein/structures/*.sdf)과 고정 3Dmol(vendor)만 쓴다 — 네트워크 없음.
// 구도 재현: 원본과 같은 회전·zoomTo·여백 맞춤 루프를 흰 바탕에서 돌려, 원자 영역 경계가 manifest.json 에
// 기록된 pixelBounds 와 ±2px 안에서 같을 때만 바탕색을 바꿔 찍는다(다르면 실패 — 구도가 어긋난 그림을 만들지 않는다).
// 사용: node scripts/render-amino-acids-dark.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { readBrandTokens } from './brand-tokens.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/protein');
const DARK_OUT = join(OUT, 'dark');
const VENDOR = join(ROOT, 'public/protein/vendor/3dmol-2.5.5');
// 공용 tokens.css 다크 --bg. 라이트 그림의 바탕(라이트 --bg)과 같은 관계로 카드(--bg-elev) 안에 놓인다(T-261013-004: 값은 원본에서 읽음).
const DARK_BACKGROUND = parseInt(readBrandTokens().dark['--bg'].slice(1), 16);
const BOUNDS_TOLERANCE = 2;

async function atomBounds(page, image) {
  return page.evaluate(async (base64) => {
    const imageElement = new Image();
    imageElement.src = `data:image/png;base64,${base64}`;
    await imageElement.decode();
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    const context = canvas.getContext('2d');
    context.drawImage(imageElement, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let left = canvas.width;
    let top = canvas.height;
    let right = -1;
    let bottom = -1;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const offset = (y * canvas.width + x) * 4;
        if (data[offset] < 245 || data[offset + 1] < 245 || data[offset + 2] < 245) {
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
    }
    return { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1 };
  }, image.toString('base64'));
}

async function renderDark(page, slug, sdf, recorded) {
  await page.setViewportSize({ width: 1000, height: 1000 });
  await page.setContent(`<!doctype html>
    <html><head><style>
      * { box-sizing: border-box; }
      html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: ${readBrandTokens().light['--bg']}; }
      #viewer { position: absolute; inset: 0; }
    </style></head><body><div id="viewer"></div></body></html>`);
  await page.addScriptTag({ path: join(VENDOR, '3Dmol-min.js') });
  await page.evaluate(({ sdfText }) => {
    const viewer = globalThis.$3Dmol.createViewer('viewer', { antialias: true });
    viewer.setBackgroundColor(0xffffff, 1);
    viewer.addModel(sdfText, 'sdf');
    viewer.setStyle({}, {
      stick: { radius: 0.13, colorscheme: 'Jmol' },
      sphere: { scale: 0.30, colorscheme: 'Jmol' },
    });
    viewer.rotate(8, 'x');
    viewer.rotate(-12, 'y');
    viewer.zoomTo();
    viewer.render();
    globalThis.__aminoViewer = viewer;
    globalThis.__aminoReady = true;
  }, { sdfText: sdf });
  await page.waitForFunction(() => globalThis.__aminoReady === true);
  await page.waitForTimeout(120);

  // render-amino-acids.mjs 와 같은 여백 맞춤 루프(같은 조건·같은 배율).
  let pixelBounds;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const image = await page.screenshot({ type: 'png' });
    pixelBounds = await atomBounds(page, image);
    const minimumMargin = Math.min(pixelBounds.left, pixelBounds.top, 999 - pixelBounds.right, 999 - pixelBounds.bottom);
    const longestSide = Math.max(pixelBounds.width, pixelBounds.height);
    if (minimumMargin >= 60 && longestSide >= 650 && longestSide <= 800) break;
    const factor = minimumMargin < 60 || longestSide > 800
      ? Math.min(0.90, 800 / longestSide)
      : Math.min(1.24, 720 / longestSide);
    await page.evaluate((scale) => {
      globalThis.__aminoViewer.zoom(scale);
      globalThis.__aminoViewer.render();
    }, factor);
    await page.waitForTimeout(80);
  }

  for (const key of ['left', 'top', 'right', 'bottom']) {
    if (Math.abs(pixelBounds[key] - recorded[key]) > BOUNDS_TOLERANCE) {
      throw new Error(`${slug}: 구도가 원본과 다르다 (${key} ${pixelBounds[key]} ≠ 기록 ${recorded[key]})`);
    }
  }

  await page.evaluate(({ background }) => {
    globalThis.__aminoViewer.setBackgroundColor(background, 1);
    globalThis.__aminoViewer.render();
  }, { background: DARK_BACKGROUND });
  await page.waitForTimeout(80);
  const dark = await page.screenshot({ type: 'png' });
  const webp = await sharp(dark).webp({ quality: 86 }).toBuffer();
  await writeFile(join(DARK_OUT, `${slug}.webp`), webp);
  return { slug, bounds: pixelBounds, bytes: webp.length };
}

async function main() {
  const manifest = JSON.parse(await readFile(join(OUT, 'manifest.json'), 'utf8'));
  await mkdir(DARK_OUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  try {
    for (const amino of manifest.aminoAcids) {
      const sdf = await readFile(join(OUT, amino.files.structure), 'utf8');
      const result = await renderDark(page, amino.slug, sdf, amino.rendering.pixelBounds);
      console.log(`${result.slug}: bounds ${result.bounds.left},${result.bounds.top}-${result.bounds.right},${result.bounds.bottom} → dark/${result.slug}.webp ${Math.round(result.bytes / 1024)}KB`);
    }
  } finally {
    await browser.close();
  }
}

await main();
