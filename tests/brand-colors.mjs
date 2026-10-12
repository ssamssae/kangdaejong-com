// T-261013-004: 테스트가 기대하는 색은 공용 원본(public/brand/current/tokens.css)에서 계산한다 — 테스트에 색 값을 다시 적지 않는다.
import { readBrandTokens } from '../scripts/brand-tokens.mjs';

export const brand = readBrandTokens();
// rgb('light', '--bg') → 'rgb(r, g, b)' 문자열(브라우저 getComputedStyle 형식)
export function rgb(mode, name) {
  const hex = brand[mode][name];
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`${mode} ${name} 는 #rrggbb 가 아니다: ${hex}`);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}
