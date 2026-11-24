// 월 정산 엔진 (순수 함수). 입력 = 백업 JSON 구조, 출력 = 일별·주별 줄과 월 합계.
// 규칙의 근거는 정답지(엑셀 덤프·화면 글자)이며, 추정한 부분은 README 「추정」 절에 적었다.

import {
  addDays, daysInMonth, isoWeekday, monthEnd, monthStart, weekStartOf, ymd, md,
  WEEKDAY_KO, addMonths,
} from './dates.js';
import { makeHolidayResolver } from './holidays.js';
import { durText, clock, parseClock } from './format.js';
import { withholding } from './tax.js';

export const RECORD_TYPES = ['normal', 'late', 'earlyLeave', 'absent', 'extraWork', 'approvedLeave', 'storeClosed'];
export const DEFER = 'deferToNextMonth';
export const PAY_NOW = 'payInCurrentMonth';

const PAID_HOLIDAY_KINDS_OVER5 = new Set(['publicHoliday', 'substituteHoliday', 'electionDay', 'laborDay']);

/** a/b 반올림(0.5는 올림) — a·b 는 0 이상 정수 */
export function roundDiv(a, b) {
  if (a < 0) return -roundDiv(-a, b);
  return Math.floor((2 * a + b) / (2 * b));
}

/** 분 → 소수 둘째 자리 시간 */
export function hours2(minutes) {
  return Math.round((minutes * 100) / 60) / 100;
}

function hundredths(h) {
  return Math.round(h * 100);
}

/** 그 날짜에 적용되는 근로계약(효력 시작일이 가장 늦은 것) */
export function contractFor(worker, date) {
  const list = (worker?.contracts || []).filter((c) => !c.effectiveFrom || c.effectiveFrom <= date);
  if (!list.length) return null;
  return list.slice().sort((a, b) => (a.effectiveFrom || '').localeCompare(b.effectiveFrom || '')).at(-1);
}

/** 계약 시간 정보(분) */
export function contractTimes(c) {
  const start = parseClock(c.start);
  const end = parseClock(c.end);
  const bs = c.breakStart ? parseClock(c.breakStart) : null;
  const be = c.breakEnd ? parseClock(c.breakEnd) : null;
  const breakMin = bs != null && be != null ? Math.max(0, be - bs) : 0;
  const dailyMin = Math.max(0, end - start - breakMin); // 하루 소정근로
  const paidDailyMin = dailyMin + (c.breakPaid ? breakMin : 0);
  const days = (c.workdays || []).length;
  return { start, end, breakStart: bs, breakEnd: be, breakMin, dailyMin, paidDailyMin, days, weeklyMin: dailyMin * days };
}

/** 주휴수당(주) = 주 소정근로 15시간 이상이면 min(주 소정, 40h) ÷ 40 × 8h × 시급 */
export function weeklyHolidayPay(c) {
  if (!c) return 0;
  const t = contractTimes(c);
  if (t.weeklyMin < 15 * 60) return 0;
  return roundDiv(Math.min(t.weeklyMin, 2400) * 8 * c.hourlyWage, 2400);
}

/** 근무 요일 표기: [1..5] → '월~금' */
export function workdaysText(workdays) {
  const w = [...new Set(workdays || [])].sort((a, b) => a - b);
  if (!w.length) return '';
  const consecutive = w.every((d, i) => i === 0 || d === w[i - 1] + 1);
  if (consecutive && w.length >= 3) return `${WEEKDAY_KO[w[0]]}~${WEEKDAY_KO[w.at(-1)]}`;
  return w.map((d) => WEEKDAY_KO[d]).join('·');
}

export function isEmployed(worker, date) {
  if (worker.startDate && date < worker.startDate) return false;
  if (worker.endDate && date > worker.endDate) return false;
  return true;
}

export function employedInRange(worker, from, to) {
  if (worker.startDate && worker.startDate > to) return false;
  if (worker.endDate && worker.endDate < from) return false;
  return true;
}

function withNote(note, text) {
  const n = (note || '').trim();
  return n ? `${n} · ${text}` : text;
}

function payOf(minutes, wage) {
  return roundDiv(minutes * wage, 60);
}

/**
 * 하루 줄 계산.
 * ctx = { worker, size, resolveHoliday, recordsByDate }
 */
export function dayLine(ctx, date) {
  const { worker, size } = ctx;
  const wd = isoWeekday(date);
  const c = contractFor(worker, date);
  const rest = c?.restWeekday ?? 7;
  const holiday = ctx.resolveHoliday(date);
  const rec = ctx.recordsByDate.get(date) || null;
  const base = {
    date, wd, isRest: wd === rest, contractDay: false,
    D: null, E: null, F: null, paidMin: 0, extraMin: 0, G: 0, H: 0,
    status: '휴무', remark: '', pay: 0, extraPay: 0, type: 'off', holiday, record: rec, contract: c,
    employed: true, lateMin: 0, earlyMin: 0,
  };
  if (!isEmployed(worker, date)) {
    return { ...base, employed: false, remark: worker.startDate && date < worker.startDate ? '입사 전' : '퇴사 후' };
  }
  if (!c) return base;
  const t = contractTimes(c);
  const wage = c.hourlyWage;
  const contractDay = (c.workdays || []).includes(wd);
  const over5 = size === 'over5';
  const paidHoliday = holiday && holiday.kind !== 'storeDesignated'
    && (holiday.kind === 'laborDay' || (over5 && PAID_HOLIDAY_KINDS_OVER5.has(holiday.kind)));

  if (!contractDay) {
    if (rec && rec.type === 'extraWork' && rec.minutes > 0) {
      const mult = over5 ? 1.5 : 1;
      const pay = roundDiv(rec.minutes * wage * mult * 2, 120);
      return {
        ...base, type: 'extraOff', D: t.start, E: t.start + rec.minutes, F: 0,
        paidMin: rec.minutes, extraMin: rec.minutes, G: hours2(rec.minutes), H: hours2(rec.minutes),
        status: '추가근무', remark: withNote(rec.note, `계약 외 근무 ${durText(rec.minutes)} (주휴 미반영)`),
        pay, extraPay: pay,
      };
    }
    return { ...base, remark: wd === rest ? '주휴일' : holiday ? holiday.name : '' };
  }

  const day = { ...base, contractDay: true };
  const normal = () => ({
    ...day, type: 'normal', D: t.start, E: t.end, F: t.breakMin, paidMin: t.paidDailyMin,
    G: hours2(t.paidDailyMin), status: '정상', pay: payOf(t.paidDailyMin, wage),
  });
  const closedPay = over5 ? roundDiv(t.dailyMin * wage * 7, 600) : 0; // 휴업수당 70%

  if (rec && rec.type !== 'normal') {
    const min = Math.max(0, Number(rec.minutes) || 0);
    switch (rec.type) {
      case 'late':
      case 'earlyLeave': {
        const paid = Math.max(0, t.paidDailyMin - min);
        const isLate = rec.type === 'late';
        const line = {
          ...day, type: rec.type, D: isLate ? t.start + min : t.start, E: isLate ? t.end : t.end - min, F: t.breakMin,
          paidMin: paid, G: hours2(paid), status: isLate ? '지각' : '조퇴',
          remark: withNote(rec.note, `${durText(min)} ${isLate ? '지각' : '조퇴'}`),
          lateMin: isLate ? min : 0, earlyMin: isLate ? 0 : min,
        };
        return applyHolidayWork(line, { paidHoliday, holiday, t, wage, over5 });
      }
      case 'absent':
        return { ...day, type: 'absent', status: '결근', remark: withNote(rec.note, '무단결근 · 이 주 주휴수당 미발생') };
      case 'extraWork': {
        const paid = t.paidDailyMin + min;
        const mult = over5 ? 1.5 : 1;
        const extraPay = roundDiv(min * wage * mult * 2, 120);
        const line = {
          ...day, type: 'extraWork', D: t.start, E: t.end + min, F: t.breakMin, paidMin: paid, extraMin: min,
          G: hours2(paid), H: hours2(min), status: '추가근무',
          remark: withNote(rec.note, `추가근무 ${durText(min)} (계약 종료 ${clock(t.end)})`),
          pay: payOf(t.paidDailyMin, wage) + extraPay, extraPay,
        };
        return applyHolidayWork(line, { paidHoliday, holiday, t, wage, over5 });
      }
      case 'approvedLeave':
        return { ...day, type: 'approvedLeave', status: '휴가', remark: withNote(rec.note, '승인 휴가 (결근 아님)') };
      case 'storeClosed':
        return { ...day, type: 'storeClosed', status: '매장휴무', remark: withNote(rec.note, '매장 휴무 (결근 아님)'), pay: closedPay };
      default:
        break;
    }
  }
  if (paidHoliday) {
    if (rec && rec.type === 'normal') {
      return applyHolidayWork(normal(), { paidHoliday, holiday, t, wage, over5 });
    }
    return {
      ...day, type: 'paidHoliday', D: t.start, E: t.end, F: t.breakMin, status: '유급휴일',
      remark: `${holiday.name} · 쉬어도 일급 지급`, pay: payOf(t.dailyMin, wage),
    };
  }
  if (holiday && holiday.storeOpen === false && !(rec && rec.type === 'normal')) {
    return { ...day, type: 'storeClosed', status: '매장휴무', remark: `${holiday.name} · 매장 휴무 (결근 아님)`, pay: closedPay };
  }
  return normal();
}

/** 유급휴일에 근무: 노동절 = 일급 + 근무분(5인 이상 150%) · 5인 이상 공휴일 = 근무분 150% */
function applyHolidayWork(line, { paidHoliday, holiday, t, wage, over5 }) {
  if (!paidHoliday) {
    if (line.type === 'late' || line.type === 'earlyLeave') line.pay = payOf(line.paidMin, wage);
    return line;
  }
  const base = holiday.kind === 'laborDay' ? payOf(t.dailyMin, wage) : 0;
  const mult = over5 ? 1.5 : 1;
  const work = roundDiv(line.paidMin * wage * mult * 2, 120);
  return {
    ...line, type: 'holidayWork', status: '휴일근무', extraPay: 0,
    remark: `${holiday.name} 근무 · 유급휴일분·가산은 앱 계산값 기준 (수식 미반영)`,
    pay: base + work,
  };
}

/** 한 주(월~일) 상태: 개근 / 결근 있음 / 근무 없음 (엑셀 소계 수식과 같은 기준) */
export function weekStatus(lines) {
  if (lines.some((l) => l.contractDay && l.status === '결근')) return '결근 있음';
  if (!lines.some((l) => l.contractDay && l.G > 0)) return '근무 없음';
  return '개근';
}

export const STATUS_REMARK = {
  개근: '주휴수당 발생 (지각·조퇴·승인 휴가·매장휴무는 결근 아님)',
  '결근 있음': '주휴수당 미발생 (결근)',
  '근무 없음': '주휴수당 미발생 (이 주 근무 없음)',
};

function makeCtx(data, worker) {
  const recordsByDate = new Map();
  for (const r of worker.records || []) recordsByDate.set(r.date, r);
  return {
    worker,
    size: data.storeSettings?.businessSize === 'over5' ? 'over5' : 'under5',
    resolveHoliday: makeHolidayResolver(data.holidayOverrides || []),
    recordsByDate,
  };
}

function rangeLines(ctx, from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(dayLine(ctx, d));
  return out;
}

/** 주휴 판정(한 주 전체 줄 기준). 퇴사 주: 주휴일 전 퇴사면 미발생. */
function weekPay(ctx, fullLines, weekEnd) {
  const worker = ctx.worker;
  const c = contractFor(worker, weekEnd) || fullLines.map((l) => l.contract).filter(Boolean).at(-1) || null;
  const weekly = weeklyHolidayPay(c);
  const status = weekStatus(fullLines);
  const restDate = addDays(weekStartOf(weekEnd), (c?.restWeekday ?? 7) - 1);
  const retiredBeforeRest = Boolean(worker.endDate && worker.endDate < restDate && worker.endDate >= weekStartOf(weekEnd));
  const outside = fullLines.every((l) => !l.employed);
  let pay = status === '개근' ? weekly : 0;
  if (retiredBeforeRest || outside) pay = 0;
  return { status, pay, weekly, retiredBeforeRest, outside, restDate, contract: c };
}

/**
 * 근무자 1명의 월 정산.
 * @param {object} data  백업 JSON 구조 { storeSettings, workers, holidayOverrides }
 * @param {object|string} workerOrId
 */
export function computeMonth(data, workerOrId, y, m) {
  const worker = typeof workerOrId === 'string'
    ? (data.workers || []).find((w) => w.id === workerOrId)
    : workerOrId;
  if (!worker) throw new Error('근무자를 찾을 수 없습니다');
  const ctx = makeCtx(data, worker);
  const first = monthStart(y, m);
  const last = monthEnd(y, m);
  const header = contractFor(worker, last) || (worker.contracts || [])[0] || null;
  const weekly = weeklyHolidayPay(header);
  const times = header ? contractTimes(header) : null;
  const policy = header?.boundaryPolicy === PAY_NOW ? PAY_NOW : DEFER;

  const groups = [];
  let ws = weekStartOf(first);
  let idx = 1;
  while (ws <= last) {
    const we = addDays(ws, 6);
    const from = ws < first ? first : ws;
    const to = we > last ? last : we;
    const lines = rangeLines(ctx, from, to);
    const kind = ws < first ? 'carryIn' : we > last ? 'boundary' : 'regular';
    const g = {
      kind, idx, weekStart: ws, weekEnd: we, lines,
      G: sumH(lines.map((l) => l.G)), H: sumH(lines.map((l) => l.H)),
      K: lines.reduce((a, l) => a + l.pay, 0),
      status: '', remark: '', L: 0, lFormula: false,
    };
    if (kind === 'regular') {
      const wp = weekPay(ctx, lines, we);
      g.status = wp.status;
      g.remark = STATUS_REMARK[wp.status];
      g.L = wp.pay;
      g.lFormula = true;
      g.weekInfo = wp;
      if (wp.retiredBeforeRest && wp.status === '개근') {
        g.status = '퇴사 주';
        g.remark = '주휴일 전 퇴사 → 주휴수당 미발생';
        g.lFormula = false;
      }
    } else if (kind === 'carryIn') {
      const prevLines = rangeLines(ctx, ws, addDays(first, -1));
      const full = [...prevLines, ...lines];
      const wp = weekPay(ctx, full, we);
      const prev = addMonths(y, m, -1);
      const prevContract = contractFor(worker, monthEnd(prev.y, prev.m)) || header;
      const prevPolicy = prevContract?.boundaryPolicy === PAY_NOW ? PAY_NOW : DEFER;
      const prevHasContractDay = prevLines.some((l) => l.contractDay);
      const restDate = wp.restDate;
      const head = `주휴일 ${md(restDate)}(${WEEKDAY_KO[isoWeekday(restDate)]})이 ${m}월 → `;
      g.status = '전월 이월';
      g.weekInfo = wp;
      if (prevPolicy === PAY_NOW && prevHasContractDay) {
        const prevPaid = prevLines.some((l) => l.contractDay && l.status === '결근') ? 0 : wp.weekly;
        const absentNow = lines.some((l) => l.contractDay && l.status === '결근');
        g.prepaid = true;
        if (prevPaid > 0 && absentNow) {
          g.L = -prevPaid;
          g.remark = `${head}전월 선지급분 차감 (결근)`;
        } else {
          g.L = 0;
          g.remark = `${head}전월 정산에서 당월 선지급 처리 (이달 0원)`;
        }
      } else {
        g.L = wp.pay;
        g.remark = `${head}전월 정산에서 '이관' 선택분`;
      }
    } else {
      const range = `${md(ws)}~${md(we)}`;
      const hasContractDay = lines.some((l) => l.contractDay);
      if (!hasContractDay) {
        g.status = '근무일 없음';
        g.remark = `${range} 주 · 이달에 계약 근무일이 없음`;
        g.L = 0;
        g.noWorkday = true;
      } else {
        g.status = '월 경계 주';
        g.remark = policy === PAY_NOW ? `${range} 주 · 당월 지급 (다음 달 초 결근 시 차감)` : `${range} 주 · 다음 달로 이관`;
        g.lFormula = true;
        const absent = lines.some((l) => l.contractDay && l.status === '결근');
        g.L = policy === PAY_NOW && !absent ? weekly : 0;
      }
      g.range = range;
      g.policy = policy;
    }
    groups.push(g);
    ws = addDays(ws, 7);
    idx += 1;
  }

  const allLines = groups.flatMap((g) => g.lines);
  const G = sumH(groups.map((g) => g.G));
  const H = sumH(groups.map((g) => g.H));
  const K = groups.reduce((a, g) => a + g.K, 0);
  const L = groups.reduce((a, g) => a + g.L, 0);
  const gross = K + L;
  const taxOn = header ? header.taxWithholding !== false : true;
  const { incomeTax, localTax } = withholding(gross, taxOn);
  const extraPay = allLines.reduce((a, l) => a + (l.extraPay || 0), 0);
  const regular = groups.filter((g) => g.kind === 'regular');
  const carryIn = groups.find((g) => g.kind === 'carryIn') || null;
  const boundary = groups.find((g) => g.kind === 'boundary') || null;
  return {
    worker, y, m, first, last, size: ctx.size, contract: header, times, weekly, policy,
    groups, lines: allLines, carryIn, boundary, regular,
    totals: {
      G, H, K, L, gross, incomeTax, localTax, net: gross - incomeTax - localTax,
      extraPay, basePay: K - extraPay, baseHours: Math.round((G - H) * 100) / 100,
      regularHolidayPay: regular.reduce((a, g) => a + g.L, 0),
    },
    counts: {
      late: allLines.filter((l) => l.status === '지각').length,
      earlyLeave: allLines.filter((l) => l.status === '조퇴').length,
      absent: allLines.filter((l) => l.status === '결근').length,
      gaeguen: groups.filter((g) => g.status === '개근').length,
      paidWeeks: regular.filter((g) => g.L > 0).length,
    },
    employedInMonth: employedInRange(worker, first, last),
    taxOn,
  };
}

function sumH(values) {
  return values.reduce((a, v) => a + hundredths(v), 0) / 100;
}

/** 근무자 1명의 어느 날 줄(달력·편집 창용) */
export function computeDay(data, worker, date) {
  return dayLine(makeCtx(data, worker), date);
}

/** 지급일: 다음 달 payDay (그 달에 없는 날이면 말일) */
export function payDate(y, m, payDay = 10) {
  const n = addMonths(y, m, 1);
  const d = Math.min(Math.max(1, payDay || 10), daysInMonth(n.y, n.m));
  return ymd(n.y, n.m, d);
}
