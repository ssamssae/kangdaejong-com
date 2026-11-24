// 날짜 도우미. 날짜는 모두 'YYYY-MM-DD' 글자로 다룬다(시간대 영향 없음).

const DAY_MS = 86400000;

export const WEEKDAY_KO = ['', '월', '화', '수', '목', '금', '토', '일'];
export const WEEKDAY_KO_LONG = ['', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];

function toUtc(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms) {
  const dt = new Date(ms);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function ymd(y, m, d) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function parts(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

export function addDays(iso, n) {
  return fromUtc(toUtc(iso) + n * DAY_MS);
}

export function diffDays(a, b) {
  return Math.round((toUtc(a) - toUtc(b)) / DAY_MS);
}

/** 1 = 월 … 7 = 일 (ISO 요일) */
export function isoWeekday(iso) {
  const w = new Date(toUtc(iso)).getUTCDay();
  return w === 0 ? 7 : w;
}

export function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function monthStart(y, m) {
  return ymd(y, m, 1);
}

export function monthEnd(y, m) {
  return ymd(y, m, daysInMonth(y, m));
}

export function addMonths(y, m, n) {
  const idx = y * 12 + (m - 1) + n;
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
}

/** 주는 월요일 시작 · 일요일 끝 */
export function weekStartOf(iso) {
  return addDays(iso, -(isoWeekday(iso) - 1));
}

/** 엑셀 날짜 일련번호(1900 체계) */
export function excelSerial(iso) {
  return Math.round((toUtc(iso) - Date.UTC(1899, 11, 30)) / DAY_MS);
}

/** 'M/D' (엑셀 소계 줄 표기) */
export function md(iso) {
  const { m, d } = parts(iso);
  return `${m}/${d}`;
}

/** 'YYYY.MM.DD' (화면 표기) */
export function dotted(iso) {
  return iso.replaceAll('-', '.');
}

export function todayIso(now = new Date()) {
  return ymd(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
