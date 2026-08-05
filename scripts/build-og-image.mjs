// build-og-image.mjs — 링크 미리보기용 OG 이미지(1200×630 PNG)를 브랜드 자산에서 생성한다.
//
// ■왜 PNG 인가 (T-260805-087)
//   repo 의 브랜드 자산은 SVG(minusbeta-badge.svg / minusbeta-lockup-dark.svg)뿐인데,
//   ★카카오톡·슬랙·X 의 링크 미리보기는 SVG 를 og:image 로 읽지 않는다. 래스터가 필수다.
//   그래서 같은 브랜드 요소(mβ 마크 · Minus Beta STUDIO 로크업 · 팔레트)를 그대로 쓰되
//   1200×630 PNG 로 굽는다. 새 팔레트·새 서체를 만들지 않는다.
//
// ■왜 한글이 안 들어가나
//   이 이미지는 라틴 로크업만 담는다. 한글 제목·설명은 og:title / og:description 이
//   ★텍스트로 전달하므로 이미지에 구울 필요가 없고, 구우면 노드마다 한글 폰트 유무에
//   따라 결과가 갈린다(생성 노드 desktop3060ti 는 fc-list :lang=ko 가 0건).
//   ⇒ 이미지는 폰트 의존이 없는 라틴만, 한글은 메타 텍스트로. 재생성이 어느 노드에서든 같다.
//
// 사용법: node scripts/build-og-image.mjs   → public/og-image.png
//   산출물은 repo 에 커밋한다(빌드 파이프라인에 이미지 스텝이 없다). 이 스크립트는 출처 기록용.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og-image.png');

// 팔레트 = minusbeta-lockup-dark.svg 와 동일 값. 여기서 새로 고르지 않는다.
const BG = '#22262C';
const MINT = '#4FE0C0';
const FG = '#F5F5F5';
const DIM = '#A0A0A0';
const RULE = '#3A3F47';
const FONT = 'Helvetica, Arial, sans-serif'; // 로크업 SVG 와 같은 스택

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BG}"/>
  <text x="96" y="212" font-family="${FONT}" font-weight="700" font-size="148" fill="${MINT}" letter-spacing="4">mβ</text>
  <text x="96" y="356" font-family="${FONT}" font-weight="700" font-size="82" fill="${FG}" letter-spacing="1">Minus Beta</text>
  <text x="100" y="416" font-family="${FONT}" font-weight="500" font-size="32" fill="${DIM}" letter-spacing="18">STUDIO</text>
  <line x1="96" y1="470" x2="1104" y2="470" stroke="${RULE}" stroke-width="2"/>
  <text x="96" y="540" font-family="${FONT}" font-weight="700" font-size="38" fill="${MINT}" letter-spacing="0">Tools Worth Keeping.</text>
  <text x="1104" y="540" font-family="${FONT}" font-weight="500" font-size="30" fill="${DIM}" text-anchor="end">kangdaejong.com</text>
</svg>`;

const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
writeFileSync(OUT, png);
const meta = await sharp(png).metadata();
console.log(`og-image.png ${meta.width}x${meta.height} ${png.length}B → ${OUT}`);
