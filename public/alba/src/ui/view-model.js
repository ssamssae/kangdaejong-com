// 화면에 보일 글자를 만드는 순수 함수(DOM 없음). 테스트가 정답지 화면 글자와 대조한다.

import {
  addDays, daysInMonth, isoWeekday, monthEnd, monthStart, weekStartOf, ymd, dotted, md, pad2,
  WEEKDAY_KO, WEEKDAY_KO_LONG, parts, addMonths,
} from '../engine/dates.js';
import {
  computeMonth, contractFor, contractTimes, employedInRange, weeklyHolidayPay, PAY_NOW, DEFER, roundDiv,
} from '../engine/payroll.js';
import { comma, won, minusWon, durText, clock, parseClock } from '../engine/format.js';
import { listHolidays, STATUTORY_KINDS } from '../engine/holidays.js';
import { exportWorkers, xlsxFileName } from '../xlsx/payroll-workbook.js';
import { OVER5_NOTICE } from './texts.js';

export const monthTitle = (y, m) => `${y}년 ${m}월`;

export function dayTitle(date) {
  const { m, d } = parts(date);
  return `${m}월 ${d}일 ${WEEKDAY_KO_LONG[isoWeekday(date)]}`;
}

/** 달력 주(월~일) 목록: 그 달을 덮는 주들 */
export function calendarWeeks(y, m) {
  const first = monthStart(y, m);
  const last = monthEnd(y, m);
  const weeks = [];
  for (let ws = weekStartOf(first); ws <= last; ws = addDays(ws, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(ws, i)));
  }
  return weeks;
}

export const initial = (name) => (name || '?').trim().charAt(0) || '?';

function hh(min) {
  return min % 60 === 0 ? pad2(Math.floor(min / 60) % 24) : clock(min);
}

function hoursNum(h) {
  return `${Number(h.toFixed(2))}`;
}

/** 이 달에 보일 근무자(재직 + 근로계약 있음) */
export function monthWorkers(state, y, m) {
  return exportWorkers(state, y, m);
}

/** 현황 달력 딱지 */
export function homeBadge(line, worker) {
  const i = initial(worker.name);
  switch (line.type) {
    case 'normal': return { text: `${i} ${hh(line.D)}-${hh(line.E)}`, kind: 'normal' };
    case 'extraWork': return { text: `${i} ${hh(line.D)}-${hh(line.E)}`, kind: 'extra' };
    case 'extraOff': return { text: `${i} +${hoursNum(line.G)}h`, kind: 'extra' };
    case 'late': return { text: `${i} 지각`, kind: 'late' };
    case 'earlyLeave': return { text: `${i} 조퇴`, kind: 'early' };
    case 'absent': return { text: `${i} 결근`, kind: 'absent' };
    case 'approvedLeave': return { text: `${i} 휴가`, kind: 'off' };
    case 'storeClosed': return { text: `${i} 휴무`, kind: 'off' };
    case 'paidHoliday': return { text: `${i} 유급`, kind: 'off' };
    case 'holidayWork': return { text: `${i} ${hh(line.D)}-${hh(line.E)}`, kind: 'extra' };
    default: return null;
  }
}

export function homeView(state, y, m) {
  const workers = monthWorkers(state, y, m);
  const results = workers.map((w) => computeMonth(state, w, y, m));
  const byDate = new Map();
  for (const res of results) {
    for (const l of res.lines) {
      const b = homeBadge(l, res.worker);
      if (!b) continue;
      if (!byDate.has(l.date)) byDate.set(l.date, []);
      byDate.get(l.date).push(b);
    }
  }
  const weeks = calendarWeeks(y, m).map((week) => week.map((date) => {
    const p = parts(date);
    return {
      date, day: p.d, inMonth: p.m === m && p.y === y, isSun: isoWeekday(date) === 7,
      badges: byDate.get(date) || [],
    };
  }));
  const total = results.reduce((a, r) => a + r.totals.gross, 0);
  return {
    weeks,
    footer: `${m}월 예상 인건비 ${won(total)} · ${results.length}명`,
    count: results.length,
  };
}

/** 근태 달력 칸 글자 */
export function attCell(line) {
  switch (line.type) {
    case 'normal': return { label: `${hoursNum(line.G)}h`, kind: 'work' };
    case 'late': return { label: '지각', kind: 'late' };
    case 'earlyLeave': return { label: '조퇴', kind: 'early' };
    case 'absent': return { label: '결근', kind: 'absent' };
    case 'extraWork': return { label: `+${hoursNum(line.H)}h`, kind: 'extra' };
    case 'extraOff': return { label: `추가 ${hoursNum(line.G)}h`, kind: 'extra' };
    case 'approvedLeave': return { label: '휴가', kind: 'leave' };
    case 'storeClosed': return { label: '휴무', kind: 'leave' };
    case 'paidHoliday': return { label: '유급', kind: 'leave' };
    case 'holidayWork': return { label: `${hoursNum(line.G)}h`, kind: 'extra' };
    default: return { label: '', kind: line.contractDay ? 'work' : 'off' };
  }
}

/** 근태 화면 오른쪽 「주휴」 칸 */
export function weekBadge(g) {
  if (g.kind === 'carryIn') return { label: '이월', kind: 'carry' };
  if (g.kind === 'boundary') {
    return g.policy === PAY_NOW && !g.noWorkday ? { label: '당월', kind: 'now' } : { label: '이관', kind: 'defer' };
  }
  return g.L > 0 ? { label: '발생', kind: 'ok' } : { label: '미발생', kind: 'no' };
}

export function attView(state, workerId, y, m) {
  const worker = (state.workers || []).find((w) => w.id === workerId);
  if (!worker) return null;
  const first = monthStart(y, m);
  const last = monthEnd(y, m);
  if (!contractFor(worker, last) && !(worker.contracts || []).length) {
    return { worker, empty: '근로계약이 없습니다' };
  }
  if (!employedInRange(worker, first, last)) {
    const why = worker.startDate && worker.startDate > last ? `근로 시작 ${dotted(worker.startDate)}` : `퇴사 ${dotted(worker.endDate)}`;
    return { worker, empty: `이 달은 재직 기간이 아닙니다 (${why})` };
  }
  const res = computeMonth(state, worker, y, m);
  const lineByDate = new Map(res.lines.map((l) => [l.date, l]));
  const weeks = res.groups.map((g) => ({
    group: g,
    badge: weekBadge(g),
    days: Array.from({ length: 7 }, (_, i) => {
      const date = addDays(g.weekStart, i);
      const line = lineByDate.get(date);
      const p = parts(date);
      return {
        date, day: p.d, inMonth: Boolean(line), isSun: isoWeekday(date) === 7,
        line, cell: line ? attCell(line) : null,
      };
    }),
  }));
  return { worker, res, weeks, summary: attSummary(res) };
}

export function attSummary(res) {
  const c = res.counts;
  return `지각 ${c.late} · 조퇴 ${c.earlyLeave} · 결근 ${c.absent} · 추가 ${durText(res.totals.H * 60)} · 주휴 ${c.paidWeeks}주 발생`;
}

function weekStatusText(g, res) {
  if (g.L > 0) return { text: '발생', kind: 'ok' };
  if (g.weekInfo?.outside) return { text: '이 주에는 재직하지 않음 (입사 전 또는 퇴사 후)', kind: 'muted' };
  if (g.status === '퇴사 주') return { text: '미발생 (주휴일 전 퇴사)', kind: 'no' };
  if (g.status === '결근 있음') return { text: '미발생 (결근)', kind: 'no' };
  if (g.status === '근무 없음') return { text: '미발생 (근무 없음)', kind: 'no' };
  if (res.weekly === 0) return { text: '미발생 (주 15시간 미만)', kind: 'no' };
  return { text: '미발생', kind: 'no' };
}

export function settleView(res) {
  const t = res.totals;
  const weekly = res.weekly;
  const w = res.worker;
  const holder = w.accountHolder || w.name;
  const b = res.boundary;
  const view = {
    notice: res.size === 'over5' ? OVER5_NOTICE : null,
    grossTitle: `${res.m}월 지급 합계 (세전)`,
    gross: won(t.gross),
    netLabel: res.taxOn ? '세금 3.3% 공제 후 실수령' : '실수령액 (세금 공제 안 함)',
    net: won(t.net),
    taxRows: res.taxOn ? [
      ['소득세 3% (10원 미만 절사)', minusWon(t.incomeTax)],
      ['지방소득세 (소득세의 10%)', minusWon(t.localTax)],
    ] : [],
    line: `유급 ${durText(t.baseHours * 60)} · 추가 ${durText(t.H * 60)} · 주휴 ${res.counts.paidWeeks}주 발생`,
    boundary: null,
    base: { label: '기본급', sub: `유급 ${durText(t.baseHours * 60)} × ${comma(res.contract.hourlyWage)}원`, amount: won(t.basePay) },
    extra: { label: '추가근무', sub: `${durText(t.H * 60)} · 주휴 미반영`, amount: won(t.extraPay) },
    weekly: {
      label: '주휴수당',
      sub: `이달에 끝나는 주 ${res.counts.paidWeeks}주 × ${comma(weekly)}원`,
      amount: won(t.regularHolidayPay),
      rows: res.regular.map((g) => {
        const s = weekStatusText(g, res);
        return { range: `${g.weekStart}~${g.weekEnd}`, status: s.text, kind: s.kind, amount: comma(g.L) };
      }),
    },
    boundaryPaid: null,
    carry: null,
    account: { label: '입금 계좌', text: `${w.bank || ''} ${w.accountNumber || ''} · ${holder}`.trim() },
    footer: '시급제 · 세금은 사업소득 3.3% 원천징수 기준',
  };
  if (b && !b.noWorkday) {
    view.boundary = {
      title: `월 경계 주 · ${b.weekStart}~${b.weekEnd}`,
      question: `이 주의 주휴일이 다음 달입니다. 주휴수당 ${comma(weekly)}원을 어느 달 급여에 넣을까요?`,
      note: b.policy === PAY_NOW ? '이달 선지급 · 다음 달 초 결근 시 다음 달에서 차감' : `이달 0원 · 다음 달 급여에 ${comma(weekly)}원 포함`,
      policy: b.policy,
    };
    if (b.policy === PAY_NOW) {
      view.boundaryPaid = { label: '월 경계 주 · 당월 지급', sub: `${b.weekStart}~${b.weekEnd}`, amount: won(b.L) };
    }
  }
  const ci = res.carryIn;
  if (ci && ci.weekInfo && !ci.weekInfo.outside) {
    view.carry = {
      label: '전월 이월 주휴수당',
      sub: ci.prepaid
        ? `${ci.weekStart}~${ci.weekEnd} · 전월 정산에서 당월 선지급 처리 (이달 0원)`
        : `${ci.weekStart}~${ci.weekEnd} · 전월에서 이관`,
      amount: won(ci.L),
    };
  }
  return view;
}

/** 근무 시간 머리줄: '08:00 ~ 15:00 · 휴게 13:00~13:30 · 소정 6시간 30분' */
export function contractLine(c) {
  const t = contractTimes(c);
  const brk = t.breakMin > 0 ? ` · 휴게 ${clock(t.breakStart)}~${clock(t.breakEnd)}` : '';
  return `${clock(t.start)} ~ ${clock(t.end)}${brk} · 소정 ${durText(t.dailyMin)}`;
}

export const DAY_TYPES = [
  ['normal', '정상'], ['late', '지각'], ['earlyLeave', '조퇴'], ['absent', '결근'],
  ['extraWork', '추가'], ['approvedLeave', '휴가'], ['storeClosed', '매장 휴무'],
];

/**
 * 날짜 편집 창 글자. sel = 고른 종류, minutes = 지각·조퇴·추가 분
 */
export function dayEditorView({ line, size, sel, minutes }) {
  const c = line.contract;
  const t = contractTimes(c);
  const wage = c.hourlyWage;
  const weekly = weeklyHolidayPay(c);
  const over5 = size === 'over5';
  const mult = over5 ? 3 : 2; // ×1.5 이면 3/2
  const dailyPay = roundDiv(t.paidDailyMin * wage, 60);
  const title = dayTitle(line.date);
  if (!line.contractDay) {
    const v = { title, sub: '계약 근무일 아님', contractDay: false, stepper: null };
    if (sel === 'extraWork') {
      v.stepper = { label: '추가 근무 시간', value: durText(minutes) };
      v.info = {
        tone: 'green', title: `추가근무 ${durText(minutes)} → +${comma(roundDiv(minutes * wage * mult, 120))}원`,
        body: '계약 외 근무라 주휴수당 계산에는 들어가지 않습니다. 5인 이상 사업장은 50% 가산.',
      };
    } else {
      v.info = { tone: 'gray', title: '계약 근무일이 아닙니다', body: '대타·행사로 나왔다면 추가근무로 기록하세요. 주휴수당에는 영향이 없습니다.' };
    }
    return v;
  }
  const v = { title, sub: contractLine(c), contractDay: true, stepper: null, info: null };
  const h = line.holiday;
  const paidHoliday = line.type === 'paidHoliday' || line.type === 'holidayWork';
  switch (sel) {
    case 'normal':
      if (paidHoliday) {
        const labor = h.kind === 'laborDay';
        v.info = {
          tone: 'blue',
          title: labor ? (over5 ? '유급휴일 · 근무하면 250% · 주휴 유지' : '모든 사업장 유급휴일 · 쉬어도 일급, 근무하면 200% · 주휴 유지') : '유급휴일 근무 → 150% · 주휴 유지',
          body: h.name,
        };
      } else {
        v.info = {
          tone: 'blue',
          title: `정상 출근 · ${durText(t.paidDailyMin)} × ${comma(wage)}원 = ${comma(dailyPay)}원`,
          body: `이번 주 주휴수당 ${comma(weekly)}원 유지`,
        };
      }
      break;
    case 'late':
    case 'earlyLeave': {
      const word = sel === 'late' ? '지각' : '조퇴';
      v.stepper = { label: '빠진 시간', value: durText(minutes) };
      v.info = {
        tone: 'orange',
        title: `${word} ${durText(minutes)} → ${comma(roundDiv(minutes * wage, 60))}원 공제`,
        body: `지각·조퇴는 결근이 아니므로 이번 주 주휴수당 ${comma(weekly)}원은 그대로입니다.`,
      };
      break;
    }
    case 'absent':
      v.info = {
        tone: 'red',
        title: `결근 → ${durText(t.paidDailyMin)} 무급, ${comma(dailyPay)}원 미지급`,
        body: `이번 주 개근이 깨져 주휴수당 ${comma(weekly)}원도 발생하지 않습니다. 승인된 휴가였다면 휴가로 바꾸세요.`,
      };
      break;
    case 'extraWork':
      v.stepper = { label: '추가 근무 시간', value: durText(minutes) };
      v.info = {
        tone: 'green',
        title: `추가근무 ${durText(minutes)} → +${comma(roundDiv(minutes * wage * mult, 120))}원`,
        body: '계약 외 근무라 주휴수당 계산에는 들어가지 않습니다. 5인 이상 사업장은 50% 가산.',
      };
      break;
    case 'approvedLeave':
      v.info = {
        tone: 'gray',
        title: `승인 휴가 → 무급 (유급 약정 시 ${comma(dailyPay)}원)`,
        body: '결근이 아니라 근무일에서 빠집니다. 주휴수당 유지. 한 주 내내 근무가 없으면 주휴 미발생.',
      };
      break;
    case 'storeClosed':
      v.info = {
        tone: 'gray',
        title: '매장 휴무 → 근무일에서 제외 · 무급',
        body: '매장 사정으로 쉰 날은 결근이 아니므로 주휴수당 유지. 5인 이상은 휴업수당 70%.',
      };
      break;
    default:
      if (paidHoliday) {
        v.info = { tone: 'blue', title: '유급휴일 → 쉬어도 일급 · 주휴 유지', body: h?.name || '' };
      }
  }
  return v;
}

/** 편집 창 처음 상태: 기록 → 종류·분 */
export function editorInitial(line) {
  const rec = line.record;
  if (!line.contractDay) {
    return rec && rec.type === 'extraWork' ? { sel: 'extraWork', minutes: rec.minutes } : { sel: 'none', minutes: 60 };
  }
  if (rec) {
    const dflt = rec.type === 'late' ? 30 : rec.type === 'earlyLeave' ? 60 : 60;
    return { sel: rec.type, minutes: rec.minutes || dflt };
  }
  if (line.type === 'paidHoliday') return { sel: null, minutes: 60 };
  if (line.type === 'storeClosed') return { sel: 'storeClosed', minutes: 60 };
  return { sel: 'normal', minutes: 60 };
}

/** 지각·조퇴·추가 시간 범위 */
export function stepperRange(sel, line) {
  if (sel === 'late' || sel === 'earlyLeave') {
    const t = contractTimes(line.contract);
    return { step: 15, min: 15, max: Math.max(15, t.dailyMin - 15), init: sel === 'late' ? 30 : 60 };
  }
  return { step: 30, min: 30, max: 480, init: 60 };
}

// ── 근로계약 화면 ──────────────────────────────────────────────

/** 법정 휴게: 근로 4시간 이상 30분, 8시간 이상 60분 */
export function requiredBreak(spanMin, breakMin) {
  const work = spanMin - breakMin;
  if (work >= 480) return 60;
  if (work >= 240) return 30;
  return 0;
}

export function contractView(draft) {
  const start = parseClock(draft.start);
  const end = parseClock(draft.end);
  const bs = parseClock(draft.breakStart);
  const be = parseClock(draft.breakEnd);
  const breakMin = bs != null && be != null ? Math.max(0, be - bs) : 0;
  const span = end - start;
  const req = requiredBreak(span, breakMin);
  const winFrom = start + 60;
  const winTo = end - 60;
  const windowText = `${clock(winFrom)}~${clock(winTo)}`;
  const dailyMin = Math.max(0, span - breakMin);
  const days = (draft.workdays || []).length;
  const weeklyMin = dailyMin * days;
  const wage = Number(draft.hourlyWage) || 0;
  const weekly = weeklyMin >= 900 ? roundDiv(Math.min(weeklyMin, 2400) * 8 * wage, 2400) : 0;
  const paidWeeklyHours = roundDiv(Math.min(weeklyMin, 2400) * 8, 40);
  let breakInfo;
  let breakOk = true;
  if (winTo - winFrom < breakMin || winTo <= winFrom) {
    breakInfo = '근무 시간이 짧아 시작 1시간 후 ~ 종료 1시간 전 구간에 휴게를 넣을 수 없어요. 근무 시간을 늘리거나 휴게를 줄여 주세요.';
    breakOk = breakMin === 0;
  } else if (breakMin > 0 && (bs < winFrom || be > winTo)) {
    breakInfo = `휴게는 근무 시작 1시간 후부터 종료 1시간 전 사이(${windowText})에서 시작하고 끝나야 해요.`;
    breakOk = false;
  } else if (breakMin < req) {
    breakInfo = `${req}분 이상 필요해요 (근로기준법 제54조). 지금은 ${breakMin}분입니다.`;
    breakOk = false;
  } else {
    breakInfo = `${windowText} 구간 안에 ${breakMin}분 · 법정 기준(${req ? `${req}분 이상` : '의무 없음, 근로 4시간 미만'}) 충족`;
  }
  return {
    minWage: '2026년 최저시급 10,320원',
    breakWindow: `설정 가능 ${windowText} · ${req ? `${req}분 이상` : '의무 없음, 근로 4시간 미만'}`,
    breakLen: `${breakMin}분`,
    breakInfo,
    breakOk,
    daily: `하루 소정 ${durText(dailyMin)}`,
    weeklyLine: `${days}일 × ${durText(dailyMin)} = ${durText(weeklyMin)}`,
    weeklyPay: weekly > 0 ? won(weekly) : '주 15시간 미만 · 주휴수당 없음',
    formula: weekly > 0
      ? `${durText(Math.min(weeklyMin, 2400))} ÷ 40시간 × 8시간 × ${comma(wage)}원 = ${durText(paidWeeklyHours)} 유급`
      : '',
  };
}

/** 저장 전 검사 → 오류 문구 또는 null */
export function validateContract(draft) {
  const start = parseClock(draft.start);
  const end = parseClock(draft.end);
  if (start == null || end == null) return `HH:mm 형식이어야 합니다: ${draft.start}`;
  if (end <= start) return '근무 종료 시각이 시작 시각보다 늦어야 해요.';
  const bs = parseClock(draft.breakStart);
  const be = parseClock(draft.breakEnd);
  if (bs != null && be != null) {
    if (be <= bs) return '휴게 종료 시각이 휴게 시작 시각보다 늦어야 해요.';
  }
  const v = contractView(draft);
  if (!v.breakOk) return v.breakInfo;
  return null;
}

// ── 설정·휴일·내보내기·불러오기 ──────────────────────────────

export function settingsWorkerSub(w) {
  const acc = [w.bank, w.accountNumber].filter(Boolean).join(' ');
  const parts2 = [];
  if (acc) parts2.push(acc);
  if (w.startDate) parts2.push(`근로 시작 ${dotted(w.startDate)}`);
  if (w.endDate) parts2.push(`퇴사 ${dotted(w.endDate)}`);
  return parts2.join(' · ');
}

export function holidayItems(state, today) {
  const { y, m, d } = parts(today);
  const until = ymd(y + 1, m, Math.min(d, daysInMonth(y + 1, m)));
  const size = state.storeSettings?.businessSize === 'over5' ? 'over5' : 'under5';
  return listHolidays(state.holidayOverrides, today, until).map((h) => {
    const wd = isoWeekday(h.date);
    const item = { date: h.date, md: md(h.date), wd: WEEKDAY_KO[wd], isSun: wd === 7, name: h.name, holiday: h };
    if (wd === 7) return { ...item, desc: '일요일(주휴일)과 겹침', tone: 'muted', control: { type: 'tag', text: '주휴일' } };
    if (h.kind === 'laborDay') {
      return {
        ...item,
        desc: size === 'over5' ? '유급휴일 · 근무하면 250% · 주휴 유지' : '모든 사업장 유급휴일 · 쉬어도 일급, 근무하면 200% · 주휴 유지',
        tone: 'muted', control: { type: 'tag', text: '유급휴일' },
      };
    }
    if (size === 'over5' && STATUTORY_KINDS.has(h.kind)) {
      return { ...item, desc: '유급휴일 → 쉬어도 일급 · 주휴 유지', tone: 'muted', control: { type: 'tag', text: '유급휴일' } };
    }
    return h.storeOpen
      ? { ...item, desc: '영업 → 평소 근무일. 무단으로 쉬면 그 주 주휴 미발생', tone: 'warn', control: { type: 'toggle', open: true } }
      : { ...item, desc: '매장 휴무 → 근무일 제외 · 무급 · 주휴 유지', tone: 'muted', control: { type: 'toggle', open: false } };
  });
}

/** 휴일 영업/휴무 바꾸기 → 새 holidayOverrides */
export function toggleHoliday(overrides, h) {
  const list = (overrides || []).filter((o) => o.date !== h.date);
  const nextOpen = !h.storeOpen;
  if (h.builtin && nextOpen) return list; // 내장 공휴일 기본값(영업)으로 돌아감
  return [...list, { date: h.date, name: h.name, kind: h.kind, storeOpen: nextOpen }].sort((a, b) => a.date.localeCompare(b.date));
}

export function exportView(state, y, m) {
  const workers = exportWorkers(state, y, m);
  const results = workers.map((w) => computeMonth(state, w, y, m));
  const gross = results.reduce((a, r) => a + r.totals.gross, 0);
  const net = results.reduce((a, r) => a + r.totals.net, 0);
  return {
    fileName: xlsxFileName(y, m, state.storeSettings?.storeName),
    sheets: `시트 ${workers.length + 1}장: 요약 + ${workers.map((w) => w.name).join('·')}`,
    rows: results.map((r) => ({
      name: r.worker.name,
      text: `${comma(r.totals.gross)} / ${comma(r.totals.net)} (${r.counts.gaeguen}주)`,
    })),
    total: { name: `${results.length}명 합계`, text: `${comma(gross)} / ${comma(net)}` },
    count: results.length,
  };
}

export function restoreLines(s) {
  return [
    ['만든 날짜', `${s.created} (앱 ${s.appVersion})`],
    ['근무자', `${s.workerCount}명 · ${s.workerNames.join(', ')}`],
    ['근태 기록', `${s.recordCount}건 · 휴일 설정 ${s.holidayCount}건`],
  ];
}

export function paydayOptions() {
  return Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `매월 ${i + 1}일` }));
}

export function shiftMonth({ y, m }, n) {
  return addMonths(y, m, n);
}

export { DEFER, PAY_NOW };
