// 급여명세서를 캔버스 2D 문맥에 그린다. 단위 = pt(A4 595.28 × 841.89). 브라우저 글꼴로 그리므로 한글이 그대로 나온다.
// ctx 는 fillRect·fillText·measureText·beginPath·moveTo·arcTo·closePath·fill 만 쓴다(테스트는 가짜 ctx 로 기록).

export const A4 = { w: 595.28, h: 841.89 };
export const MARGIN = 48;

const FONT = '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", Pretendard, "Noto Sans KR", "Malgun Gothic", sans-serif';
const C = {
  ink: '#191f28', sub: '#4e5968', muted: '#6b7684', faint: '#8b95a1', line: '#e5e8eb',
  box: '#f2f4f6', blue: '#3182f6', blueInk: '#1b64da', blueWeak: '#e8f3ff', red: '#d22030',
};

function roundRect(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

/** 글자 하나 그리기. max 를 넘으면 글자 크기를 줄여(최소 7pt) 한 줄에 맞춘다. → 그린 폭 */
function text(ctx, s, x, y, { size = 11, weight = 400, color = C.ink, align = 'left', max = Infinity } = {}) {
  let sz = size;
  ctx.font = `${weight} ${sz}px ${FONT}`;
  let width = ctx.measureText(s).width;
  while (width > max && sz > 7) {
    sz = Math.max(7, sz - 0.5);
    ctx.font = `${weight} ${sz}px ${FONT}`;
    width = ctx.measureText(s).width;
  }
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
  return width;
}

/** 띄어쓰기 단위로 줄 나누기(낱말이 한 줄보다 길면 글자 단위) */
export function wrapLines(ctx, s, max, font) {
  ctx.font = font;
  const lines = [];
  let cur = '';
  for (const word of String(s).split(' ')) {
    const next = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(next).width <= max) { cur = next; continue; }
    if (cur) lines.push(cur);
    cur = '';
    for (const ch of word) {
      if (ctx.measureText(cur + ch).width > max && cur) { lines.push(cur); cur = ''; }
      cur += ch;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

const hr = (ctx, x1, x2, y, color = C.line, t = 0.8) => { ctx.fillStyle = color; ctx.fillRect(x1, y, x2 - x1, t); };

/**
 * @param model payslipModel() 결과
 * @returns 마지막으로 쓴 높이(pt) — 한 장 안에 들어갔는지 테스트가 본다
 */
export function drawPayslip(ctx, model) {
  const L = MARGIN;
  const R = A4.w - MARGIN;
  const W = R - L;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, A4.w, A4.h);

  // 머리: 제목 · 몇 월분 · 매장 이름
  let y = L + 24;
  text(ctx, model.title, L, y, { size: 26, weight: 800 });
  text(ctx, model.period, R, y, { size: 14, weight: 700, color: C.sub, align: 'right' });
  if (model.store) {
    y += 20;
    text(ctx, model.store, L, y, { size: 12, color: C.muted, max: W });
  }
  y += 16;

  // 기본 정보(회색 상자): 2칸 × 2줄 + 입금 계좌 한 줄
  const boxTop = y;
  const boxH = 92;
  roundRect(ctx, L, boxTop, W, boxH, 12, C.box);
  const half = W / 2;
  model.info.forEach(([k, v], i) => {
    const cx = L + 18 + (i % 2) * half;
    const cy = boxTop + 26 + Math.floor(i / 2) * 24;
    text(ctx, k, cx, cy, { size: 10.5, color: C.muted });
    text(ctx, v, cx + 64, cy, { size: 12, weight: 700, max: half - 90 });
  });
  const ay = boxTop + 26 + 2 * 24;
  text(ctx, model.account.label, L + 18, ay, { size: 10.5, color: C.muted });
  text(ctx, model.account.text, L + 18 + 64, ay, { size: 12, weight: 700, max: W - 100 });
  y = boxTop + boxH + 28;

  // 지급 내역
  text(ctx, '지급 내역', L, y, { size: 13, weight: 700 });
  text(ctx, '금액', R, y, { size: 10.5, color: C.muted, align: 'right' });
  y += 9;
  hr(ctx, L, R, y, C.ink, 1);
  for (const it of model.items) {
    y += 18;
    text(ctx, it.label, L, y, { size: 12, weight: 700 });
    text(ctx, it.amount, R, y, { size: 12, weight: 700, align: 'right' });
    y += 14;
    text(ctx, it.sub, L, y, { size: 9.5, color: C.muted, max: W - 110 });
    for (const wk of it.weeks || []) {
      y += 13;
      text(ctx, wk.range, L + 12, y, { size: 9.5, color: C.sub });
      text(ctx, wk.status, R - 70, y, { size: 9.5, weight: 600, color: wk.kind === 'no' ? C.red : C.blueInk, align: 'right' });
      text(ctx, wk.amount, R, y, { size: 9.5, weight: 600, color: C.sub, align: 'right' });
    }
    y += 8;
    hr(ctx, L, R, y);
  }
  y += 22;
  text(ctx, model.gross.label, L, y, { size: 12.5, weight: 800 });
  text(ctx, model.gross.amount, R, y, { size: 15, weight: 800, align: 'right' });
  y += 10;

  // 공제 내역(세금 3.3% 공제를 끈 근무자는 없음)
  if (model.deductions.length) {
    y += 26;
    text(ctx, '공제 내역', L, y, { size: 13, weight: 700 });
    y += 9;
    hr(ctx, L, R, y, C.ink, 1);
    for (const d of model.deductions) {
      y += 19;
      text(ctx, d.label, L, y, { size: 11, color: C.sub });
      text(ctx, d.amount, R, y, { size: 11.5, weight: 600, color: C.red, align: 'right' });
    }
    y += 9;
    hr(ctx, L, R, y);
    y += 20;
    text(ctx, model.deductionTotal.label, L, y, { size: 12, weight: 700 });
    text(ctx, model.deductionTotal.amount, R, y, { size: 12.5, weight: 700, color: C.red, align: 'right' });
    y += 8;
  }

  // 실수령(파란 상자)
  y += 14;
  roundRect(ctx, L, y, W, 54, 12, C.blueWeak);
  text(ctx, model.net.label, L + 18, y + 32, { size: 12, weight: 700, color: C.blueInk });
  text(ctx, model.net.amount, R - 18, y + 35, { size: 22, weight: 800, color: C.blue, align: 'right' });
  y += 54;

  // 근무 요약 · 알림 글
  y += 22;
  text(ctx, model.line, L, y, { size: 10.5, color: C.sub, max: W });
  const noteFont = `400 9.5px ${FONT}`;
  for (const n of model.notes) {
    for (const ln of wrapLines(ctx, n, W, noteFont)) {
      y += 14;
      text(ctx, ln, L, y, { size: 9.5, color: C.muted });
    }
  }

  // 맨 아래 한 줄
  hr(ctx, L, R, A4.h - 40);
  text(ctx, model.made, L, A4.h - 26, { size: 9, color: C.faint });
  text(ctx, '1 / 1', R, A4.h - 26, { size: 9, color: C.faint, align: 'right' });
  return y;
}
