// 숫자·시간 표기. 화면·엑셀·테스트가 함께 쓴다.

/** 1646040 → '1,646,040' (음수는 '-' 그대로) */
export function comma(n) {
  const neg = n < 0;
  const s = String(Math.abs(Math.round(n)));
  const out = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return neg ? `-${out}` : out;
}

/** 1646040 → '1,646,040원' */
export function won(n) {
  return `${comma(n)}원`;
}

/** 공제 표기: 49380 → '−49,380원' (U+2212) */
export function minusWon(n) {
  return `−${comma(n)}원`;
}

/** 분 → '6시간 30분' · '5시간' · '30분' · 0 → '0시간' */
export function durText(minutes) {
  const total = Math.round(minutes);
  if (total === 0) return '0시간';
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/** 분 → '08:00' */
export function clock(minutes) {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** '08:00' → 480 */
export function parseClock(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 24 || mi > 59) return null;
  return h * 60 + mi;
}

/** 시간(소수) → '6.5h' · '6h' · '5.75h' */
export function hoursShort(hours) {
  return `${Number(hours.toFixed(2))}h`;
}

/** 숫자 → 엑셀 <v> 글자. 정수는 그대로, 소수는 6자리 반올림 후 최단 표기. */
export function xlsxNumber(x) {
  if (Number.isInteger(x)) return String(x);
  const r = Number(x.toFixed(6));
  if (Number.isInteger(r)) return String(r);
  return String(r);
}
