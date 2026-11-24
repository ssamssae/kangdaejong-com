// 「알바급여대장_YYYY-MM.xlsx」 만들기: 요약 시트 + 근무자별 시트.
// 칸 배치·수식·서식·열 너비·병합·인쇄 설정은 앱이 만든 엑셀(정답지)과 같다.

import { Workbook, sheetRef } from './writer.js';
import {
  computeMonth, contractFor, employedInRange, payDate, workdaysText,
} from '../engine/payroll.js';
import { excelSerial, md, monthEnd, monthStart, WEEKDAY_KO, isoWeekday } from '../engine/dates.js';
import { clock } from '../engine/format.js';

// ── 서식(정답 엑셀 styles.xml 에서 읽은 그대로) ─────────────────────────────
const WON = '#,##0"원"';
const NEG_WON = '-#,##0"원";-#,##0"원";0"원"';
const S = {
  sumTitle: { b: 1, sz: '18', color: '000000', h: 'left' },
  sumPayDate: { b: 1, sz: '12', color: '000000', h: 'right' },
  sumPeriod: { sz: '9', color: '5B6472', h: 'left' },
  kpiLabel: { b: 1, sz: '9', color: '5B6472', fill: 'F1F3F6', h: 'left' },
  kpiLabelNet: { b: 1, sz: '9', color: '5B6472', fill: 'E7EDFC', h: 'left' },
  kpiValue: { fmt: WON, b: 1, sz: '18', color: '15181E', fill: 'F1F3F6', h: 'left' },
  kpiTax: { fmt: WON, b: 1, sz: '18', color: 'B91C1C', fill: 'F1F3F6', h: 'left' },
  kpiNet: { fmt: WON, b: 1, sz: '18', color: '2457D6', fill: 'E7EDFC', h: 'left' },
  sumHead: { b: 1, sz: '9.5', color: 'FFFFFF', fill: '1F2A44', border: 1, h: 'center', wrap: 1 },
  rName: { b: 1, sz: '9.5', color: '008000', border: 1, h: 'left' },
  rText: { sz: '9.5', color: '008000', border: 1, h: 'left' },
  rHours: { fmt: '0.00', sz: '9.5', color: '008000', border: 1, h: 'right' },
  rMoney: { fmt: '#,##0', sz: '9.5', color: '008000', border: 1, h: 'right' },
  rGross: { fmt: '#,##0', b: 1, sz: '10.5', color: '008000', border: 1, h: 'right' },
  rTax: { fmt: '#,##0', sz: '9.5', color: 'B91C1C', border: 1, h: 'right' },
  rNet: { fmt: '#,##0', b: 1, sz: '10.5', color: '2457D6', border: 1, h: 'right' },
  rNote: { sz: '9.5', color: '5B6472', border: 1, h: 'left' },
  rCheck: { sz: '9.5', color: '0000FF', border: 1, h: 'center' },
  tText: { b: 1, sz: '10', color: '000000', fill: 'F1F3F6', border: 1, h: 'left' },
  tHours: { fmt: '0.00', b: 1, sz: '10', color: '000000', fill: 'F1F3F6', border: 1, h: 'right' },
  tMoney: { fmt: '#,##0', b: 1, sz: '10', color: '000000', fill: 'F1F3F6', border: 1, h: 'right' },
  tGross: { fmt: '#,##0', b: 1, sz: '10.5', color: '000000', fill: 'F1F3F6', border: 1, h: 'right' },
  tTax: { fmt: '#,##0', b: 1, sz: '10', color: 'B91C1C', fill: 'F1F3F6', border: 1, h: 'right' },
  tNet: { fmt: '#,##0', b: 1, sz: '10.5', color: '2457D6', fill: 'F1F3F6', border: 1, h: 'right' },
  rulesTitle: { b: 1, sz: '8.5', color: '15181E', h: 'left' },
  rulesText: { sz: '8.5', color: '5B6472', h: 'left' },
  // 근무자 시트
  wTitle: { b: 1, sz: '13', color: '000000', h: 'left' },
  wPeriod: { sz: '8', color: '5B6472', h: 'right' },
  hLabel: { b: 1, sz: '8', color: '5B6472', fill: 'F1F3F6', border: 1, h: 'left' },
  inText: { sz: '8.5', color: '0000FF', border: 1, h: 'left' },
  inDate: { fmt: 'yyyy-mm-dd', sz: '8.5', color: '0000FF', border: 1, h: 'left' },
  inMoney: { fmt: '#,##0', sz: '8.5', color: '0000FF', border: 1, h: 'right' },
  inCenter: { sz: '8.5', color: '0000FF', border: 1, h: 'center' },
  inInt: { fmt: '0', sz: '8.5', color: '0000FF', border: 1, h: 'right' },
  inTime: { fmt: 'hh:mm', sz: '8.5', color: '0000FF', border: 1, h: 'center' },
  inTimeLeft: { fmt: 'hh:mm', sz: '8.5', color: '0000FF', border: 1, h: 'left' },
  calcHours: { fmt: '0.00', sz: '8.5', color: '000000', border: 1, h: 'right' },
  calcMoneyB: { fmt: '#,##0', b: 1, sz: '8.5', color: '000000', border: 1, h: 'right' },
  note: { sz: '7.5', color: '5B6472', h: 'left', wrap: 1 },
  wHead: { b: 1, sz: '8.5', color: 'FFFFFF', fill: '1F2A44', border: 1, h: 'center', wrap: 1 },
  dateSun: { fmt: 'm/d', sz: '8.5', color: 'B91C1C', border: 1, h: 'center' },
  textSun: { sz: '8.5', color: 'B91C1C', border: 1, h: 'center' },
  date: { fmt: 'm/d', sz: '8.5', color: '000000', border: 1, h: 'center' },
  text: { sz: '8.5', color: '000000', border: 1, h: 'center' },
  inBreak: { fmt: '0', sz: '8.5', color: '0000FF', border: 1, h: 'center' },
  dayHours: { fmt: '0.00', sz: '8.5', color: '000000', border: 1, h: 'center' },
  dayMoney: { fmt: '#,##0', sz: '8.5', color: '000000', border: 1, h: 'right' },
  subLabel: { b: 1, sz: '8.5', color: '000000', fill: 'E7EDFC', border: 1, h: 'left' },
  subHours: { fmt: '0.00', b: 1, sz: '8.5', color: '000000', fill: 'E7EDFC', border: 1, h: 'center' },
  subMoney: { fmt: '#,##0', b: 1, sz: '8.5', color: '000000', fill: 'E7EDFC', border: 1, h: 'right' },
  subStatus: { sz: '8.5', color: '000000', fill: 'E7EDFC', border: 1, h: 'center' },
  subRemark: { sz: '8.5', color: '5B6472', fill: 'E7EDFC', border: 1, h: 'left' },
  subCarry: { fmt: '#,##0', b: 1, sz: '8.5', color: '0000FF', fill: 'E7EDFC', border: 1, h: 'right' },
  totLabel: { b: 1, sz: '8.5', color: '000000', fill: 'F1F3F6', border: 1, h: 'left' },
  totHours: { fmt: '0.00', b: 1, sz: '8.5', color: '000000', fill: 'F1F3F6', border: 1, h: 'center' },
  totMoney: { fmt: '#,##0', b: 1, sz: '8.5', color: '000000', fill: 'F1F3F6', border: 1, h: 'right' },
  grossLabel: { b: 1, sz: '10', color: 'FFFFFF', fill: '2457D6', border: 1, h: 'left' },
  grossValue: { fmt: WON, b: 1, sz: '10', color: 'FFFFFF', fill: '2457D6', border: 1, h: 'right' },
  taxLabel: { sz: '8.5', color: '5B6472', border: 1, h: 'left' },
  taxValue: { fmt: NEG_WON, sz: '8.5', color: 'B91C1C', border: 1, h: 'right' },
  netLabel: { b: 1, sz: '10', color: '000000', fill: 'E7EDFC', border: 1, h: 'left' },
  netValue: { fmt: WON, b: 1, sz: '10', color: '000000', fill: 'E7EDFC', border: 1, h: 'right' },
};
const ZEBRA = 'F8F9FB';
const zebra = (st, on) => (on ? { ...st, fill: ZEBRA } : st);

// ── 글자(정답 엑셀 그대로) ───────────────────────────────────────────────
const RULES = [
  '· 주휴수당(주) = min(주 소정근로시간, 40h) ÷ 40 × 8h × 시급. 주 15시간 이상이고 그 주 소정근로일을 개근(실제 근무 1일 이상)해야 발생. 지각·조퇴·승인 휴가·매장휴무는 결근이 아님, 무단결근만 그 주 주휴 미발생.',
  '· 추가근무(계약 시간 초과, 계약 외 근무일)는 시급 × 시간만 지급하고 주휴수당 계산에 미포함. 5인 이상 사업장이면 연장·휴일 가산 50% 별도 검토.',
  '· 휴게: 근로 4시간 이상 30분, 8시간 이상 1시간을 근로시간 도중에 부여(근로기준법 제54조). 휴게 급여처리 "예"는 휴게를 유급으로 보는 임금 보전이며 주휴 기준(소정근로시간)은 그대로.',
  '· 월말·월초에 걸친 주의 주휴수당은 주휴일이 속한 달에 지급하는 "이관"이 기본. 근무자 시트 K6을 "당월"로 바꾸면 당월에 선지급.',
  '· 세금 3.3% = 소득세 3%(10원 미만 절사) + 지방소득세(소득세의 10%, 10원 미만 절사). 근무자 시트 K3이 "아니오"면 공제하지 않음. 초록 글씨는 다른 시트에서 가져온 값, 이체 확인 칸은 ☑로 바꿔 체크.',
  '· 이 문서는 알바 급여 계산기 앱이 입력된 근태로 계산한 참고용 자료입니다. 지급·신고 전 노무사(근로·퇴직금·4대보험)·세무사(세금) 확인을 권합니다. 인쇄: A4 가로 1장 (요약·근무자 시트 각각).',
];
const SHEET_GUIDE = '파란 글씨 = 직접 입력·수정 / 검정 = 수식. 상태는 목록(정상·지각·조퇴·결근·추가근무·휴가·매장휴무·휴무)에서 선택, 색은 자동. 유급 시간 = (퇴근−출근) − 휴게(휴게 급여처리 "예"면 포함) · 추가근무 = 계약 시간 초과분(계약 외 근무일은 전부, 주휴 미반영) · 승인 휴가·매장휴무는 결근이 아니며 한 주 내내 근무가 없으면 주휴 미발생';
const FOOTNOTE = '* 세금은 사업소득 3.3% 원천징수 기준(4대보험 가입 시 보험료·근로소득세 공제로 대체) · 수식은 5인 미만 사업장 기준(연장·휴일 가산 없음) · 주휴수당 = min(주 소정근로, 40h) ÷ 40 × 8h × 시급, 주 15h 이상 + 소정근로일 개근 + 그 주 실제 근무 1일 이상 · 휴게 급여처리는 임금 보전일 뿐 휴게 미부여 자체는 위반 소지 · 참고용 계산이며 지급 전 노무사 확인을 권합니다';
const WEEK_REMARK_F = (r) => `IF(I${r}="개근","주휴수당 발생 (지각·조퇴·승인 휴가·매장휴무는 결근 아님)",IF(I${r}="결근 있음","주휴수당 미발생 (결근)","주휴수당 미발생 (이 주 근무 없음)"))`;
const WEEK_STATUS_F = (a, b) => `IF(COUNTIFS(C${a}:C${b},"○",I${a}:I${b},"결근")>0,"결근 있음",IF(SUMPRODUCT((C${a}:C${b}="○")*(G${a}:G${b}>0))=0,"근무 없음","개근"))`;

const frac = (min) => min / 1440;
const yesNo = (b) => (b ? '예' : '아니오');

/** 엑셀 TEXT(x,"0.0") */
function text1(h) {
  const hh = Math.round(h * 100);
  const tenths = Math.floor((hh + 5) / 10);
  return (tenths / 10).toFixed(1);
}

/** 시트 이름: 엑셀 금지 글자 빼고 31자, 겹치면 (2)… */
export function sheetNames(names) {
  const used = new Set(['요약']);
  return names.map((n) => {
    let base = String(n || '근무자').replace(/[\[\]:*?/\\]/g, '').trim().slice(0, 31) || '근무자';
    let name = base;
    for (let i = 2; used.has(name); i++) name = `${base.slice(0, 27)} (${i})`;
    used.add(name);
    return name;
  });
}

/** 이 달 엑셀에 들어가는 근무자 = 그 달에 재직했고 근로계약이 있는 사람 */
export function exportWorkers(data, y, m) {
  const first = monthStart(y, m);
  const last = monthEnd(y, m);
  return (data.workers || []).filter((w) => employedInRange(w, first, last) && contractFor(w, last));
}

export function xlsxFileName(y, m, storeName = '') {
  const ym = `${y}-${String(m).padStart(2, '0')}`;
  const store = String(storeName || '').trim().replace(/[\\/:*?"<>|]/g, '');
  return store ? `알바급여대장_${store}_${ym}.xlsx` : `알바급여대장_${ym}.xlsx`;
}

/** 근무자 시트 줄 배치(요약 시트 수식이 이 행 번호를 쓴다) */
function layout(res) {
  let r = 9;
  const groups = res.groups.map((g) => {
    const first = r;
    r += g.lines.length;
    const last = r - 1;
    const sub = r;
    r += 1;
    return { g, first, last, sub };
  });
  return { groups, total: r, lastSub: r - 1 };
}

/**
 * data = 백업 구조, (y, m) = 대상 월 → Workbook
 */
export function buildPayrollWorkbook(data, y, m, { created } = {}) {
  const wb = new Workbook();
  const workers = exportWorkers(data, y, m);
  const names = sheetNames(workers.map((w) => w.name));
  const results = workers.map((w) => computeMonth(data, w, y, m));
  const layouts = results.map(layout);
  const first = monthStart(y, m);
  const last = monthEnd(y, m);
  const pay = payDate(y, m, data.storeSettings?.payDay ?? 10);
  const store = String(data.storeSettings?.storeName || '').trim();
  const titlePrefix = store ? `${store} · ` : '';
  const n = workers.length;

  // ── 요약 ──
  const sum = wb.addSheet('요약');
  sum.cols = [10, 30, 10, 10.5, 13, 12, 14, 12, 14, 34, 34, 8];
  sum.freezeRows = 7;
  const lastRow = 7 + n;
  const totRow = 8 + n;
  sum.row(1, 30);
  sum.str('A1', `${titlePrefix}${y}년 ${m}월 급여 요약`, S.sumTitle);
  sum.str('J1', `지급일 ${pay}`, S.sumPayDate);
  sum.str('A2', `정산 기간 ${first} ~ ${last} · 시급제 · 숫자는 모두 근무자 시트에서 가져온 수식 (수정은 각 근무자 시트의 파란 칸에서)`, S.sumPeriod);
  sum.row(3, 6);
  sum.row(4, 16);
  sum.str('A4', '근무자', S.kpiLabel);
  sum.str('D4', '지급 합계 (세전)', S.kpiLabel);
  sum.str('G4', '세금 3.3%', S.kpiLabel);
  sum.str('J4', '실수령 합계 (세후)', S.kpiLabelNet);
  const gSum = results.reduce((a, r) => a + r.totals.gross, 0);
  const tSum = results.reduce((a, r) => a + r.totals.incomeTax + r.totals.localTax, 0);
  const nSum = results.reduce((a, r) => a + r.totals.net, 0);
  sum.row(5, 30);
  sum.fstr('A5', `COUNTA(A8:A${lastRow})&"명"`, `${n}명`, S.kpiValue);
  sum.fnum('D5', `SUM(G8:G${lastRow})`, gSum, S.kpiValue);
  sum.fnum('G5', `SUM(H8:H${lastRow})`, tSum, S.kpiTax);
  sum.fnum('J5', `SUM(I8:I${lastRow})`, nSum, S.kpiNet);
  sum.row(6, 8);
  sum.row(7, 30);
  ['이름', '계약 (요일 · 시간 · 휴게)', '유급 시간(h)', '추가근무(h)', '시급분 급여(원)', '주휴수당(원)', '지급 합계 세전(원)', '세금 3.3%(원)', '실수령 세후(원)', '급여 계좌', '비고 (근태 · 주휴)', '이체 확인']
    .forEach((t, i) => sum.str(`${'ABCDEFGHIJKL'[i]}7`, t, S.sumHead));
  results.forEach((res, i) => {
    const r = 8 + i;
    const z = i % 2 === 1;
    const q = sheetRef(names[i]);
    const L = layouts[i];
    const c = res.contract;
    const t = res.times;
    const holder = res.worker.accountHolder || res.worker.name;
    sum.row(r, 30);
    sum.fstr(`A${r}`, `${q}!B3`, res.worker.name, zebra(S.rName, z));
    sum.fstr(`B${r}`, `${q}!B4&" "&TEXT(${q}!H4,"hh:mm")&"~"&TEXT(${q}!J4,"hh:mm")&" · 휴게 "&${q}!L4&"분"&IF(${q}!K5="예"," (유급)","")`,
      `${workdaysText(c.workdays)} ${clock(t.start)}~${clock(t.end)} · 휴게 ${t.breakMin}분${c.breakPaid ? ' (유급)' : ''}`, zebra(S.rText, z));
    sum.fnum(`C${r}`, `${q}!G${L.total}`, res.totals.G, zebra(S.rHours, z));
    sum.fnum(`D${r}`, `${q}!H${L.total}`, res.totals.H, zebra(S.rHours, z));
    sum.fnum(`E${r}`, `${q}!K${L.total}`, res.totals.K, zebra(S.rMoney, z));
    sum.fnum(`F${r}`, `${q}!L${L.total}`, res.totals.L, zebra(S.rMoney, z));
    sum.fnum(`G${r}`, `${q}!K${L.total + 1}`, res.totals.gross, zebra(S.rGross, z));
    sum.fnum(`H${r}`, `${q}!K${L.total + 2}+${q}!K${L.total + 3}`, res.totals.incomeTax + res.totals.localTax, zebra(S.rTax, z));
    sum.fnum(`I${r}`, `${q}!K${L.total + 4}`, res.totals.net, zebra(S.rNet, z));
    sum.fstr(`J${r}`, `${q}!B6&" "&${q}!D6&" ("&${q}!H6&")"`, `${res.worker.bank || ''} ${res.worker.accountNumber || ''} (${holder})`, zebra(S.rText, z));
    const range = `${q}!$I$9:$I$${L.lastSub}`;
    const ci = L.groups.find((x) => x.g.kind === 'carryIn');
    const bd = L.groups.find((x) => x.g.kind === 'boundary');
    let f = `"지각 "&COUNTIF(${range},"지각")&" · 조퇴 "&COUNTIF(${range},"조퇴")&" · 결근 "&COUNTIF(${range},"결근")&" · 추가 "&TEXT(${q}!H${L.total},"0.0")&"h · 주휴 "&COUNTIF(${range},"개근")&"주 발생"`;
    let v = `지각 ${res.counts.late} · 조퇴 ${res.counts.earlyLeave} · 결근 ${res.counts.absent} · 추가 ${text1(res.totals.H)}h · 주휴 ${res.counts.gaeguen}주 발생`;
    if (ci) { f += `&IF(${q}!L${ci.sub}>0," + 이월","")`; if (ci.g.L > 0) v += ' + 이월'; }
    if (bd) { f += `&IF(${q}!L${bd.sub}>0," + 경계 주 당월","")`; if (bd.g.L > 0) v += ' + 경계 주 당월'; }
    sum.fstr(`K${r}`, f, v, zebra(S.rNote, z));
    sum.str(`L${r}`, '☐', zebra(S.rCheck, z));
  });
  sum.row(totRow, 24);
  sum.str(`A${totRow}`, '합계', S.tText);
  sum.fstr(`B${totRow}`, `COUNTA(A8:A${lastRow})&"명"`, `${n}명`, S.tText);
  const tot = (key) => results.reduce((a, r) => a + r.totals[key], 0);
  const hoursSum = (key) => Math.round(results.reduce((a, r) => a + Math.round(r.totals[key] * 100), 0)) / 100;
  sum.fnum(`C${totRow}`, `SUM(C8:C${lastRow})`, hoursSum('G'), S.tHours);
  sum.fnum(`D${totRow}`, `SUM(D8:D${lastRow})`, hoursSum('H'), S.tHours);
  sum.fnum(`E${totRow}`, `SUM(E8:E${lastRow})`, tot('K'), S.tMoney);
  sum.fnum(`F${totRow}`, `SUM(F8:F${lastRow})`, tot('L'), S.tMoney);
  sum.fnum(`G${totRow}`, `SUM(G8:G${lastRow})`, gSum, S.tGross);
  sum.fnum(`H${totRow}`, `SUM(H8:H${lastRow})`, tSum, S.tTax);
  sum.fnum(`I${totRow}`, `SUM(I8:I${lastRow})`, nSum, S.tNet);
  sum.empty(`J${totRow}`, S.tText);
  sum.empty(`K${totRow}`, S.tText);
  sum.empty(`L${totRow}`, S.tText);
  const rulesRow = totRow + 2;
  sum.row(rulesRow, 13);
  sum.str(`A${rulesRow}`, '계산 규칙 요약', S.rulesTitle);
  RULES.forEach((t, i) => {
    sum.row(rulesRow + 1 + i, 13);
    sum.str(`A${rulesRow + 1 + i}`, t, S.rulesText);
  });
  const sumLast = rulesRow + RULES.length;
  sum.dimension = `A1:L${sumLast}`;
  sum.printArea = `$A$1:$L$${sumLast}`;
  ['A1:I1', 'J1:L1', 'A2:L2', 'A4:C4', 'D4:F4', 'G4:I4', 'J4:L4', 'A5:C5', 'D5:F5', 'G5:I5', 'J5:L5']
    .forEach((x) => sum.merge(x));
  for (let r = rulesRow; r <= sumLast; r++) sum.merge(`A${r}:L${r}`);

  // ── 근무자 시트 ──
  results.forEach((res, i) => {
    const sh = wb.addSheet(names[i]);
    const w = res.worker;
    const c = res.contract;
    const t = res.times;
    const L = layouts[i];
    sh.cols = [7.5, 4.5, 4.5, 7, 7, 7.5, 10, 10.5, 9.5, 46, 11.5, 12.5];
    sh.freezeRows = 8;
    sh.row(1, 20);
    sh.str('A1', `${titlePrefix}${w.name} · ${y}년 ${m}월 급여 명세`, S.wTitle);
    sh.str('J1', `정산 ${first} ~ ${last} · 지급일 ${pay} · 시급제`, S.wPeriod);
    sh.row(2, 4);
    sh.row(3, 14);
    sh.str('A3', '이름', S.hLabel);
    sh.str('B3', w.name, S.inText);
    sh.str('D3', '근로 시작일', S.hLabel);
    if (w.startDate) sh.num('E3', excelSerial(w.startDate), S.inDate);
    sh.str('G3', '시급(원)', S.hLabel);
    sh.num('H3', c.hourlyWage, S.inMoney);
    sh.str('J3', '세금 3.3% 공제 (예/아니오)', S.hLabel);
    sh.str('K3', yesNo(c.taxWithholding !== false), S.inCenter);
    sh.row(4, 14);
    sh.str('A4', '계약 요일', S.hLabel);
    sh.str('B4', workdaysText(c.workdays), S.inText);
    sh.str('D4', '주 계약일수', S.hLabel);
    sh.num('E4', t.days, S.inInt);
    sh.str('G4', '계약 출근', S.hLabel);
    sh.num('H4', frac(t.start), S.inTime);
    sh.str('I4', '계약 퇴근', S.hLabel);
    sh.num('J4', frac(t.end), S.inTimeLeft);
    sh.str('K4', '휴게(분)', S.hLabel);
    sh.num('L4', t.breakMin, S.inInt);
    sh.row(5, 14);
    const b5 = Math.round((t.dailyMin * 100) / 60) / 100;
    sh.str('A5', '일 소정근로(h)', S.hLabel);
    sh.fnum('B5', 'ROUND((J4-H4)*24-L4/60,2)', b5, S.calcHours);
    sh.str('D5', '주 소정근로(h)', S.hLabel);
    sh.fnum('E5', 'ROUND(B5*E4,2)', Math.round(b5 * 100 * t.days) / 100, S.calcHours);
    sh.str('G5', '주휴수당(원/주)', S.hLabel);
    sh.fnum('H5', 'IF(E5>=15,ROUND(MIN(E5,40)/40*8*H3,0),0)', res.weekly, S.calcMoneyB);
    sh.str('J5', '휴게 급여처리 (예/아니오)', S.hLabel);
    sh.str('K5', yesNo(c.breakPaid), S.inCenter);
    sh.row(6, 14);
    sh.str('A6', '급여 계좌', S.hLabel);
    sh.str('B6', w.bank || '', S.inText);
    sh.str('D6', w.accountNumber || '', S.inText);
    sh.str('G6', '예금주', S.hLabel);
    sh.str('H6', w.accountHolder || w.name, S.inText);
    sh.str('J6', '월 경계 주 주휴 (이관/당월)', S.hLabel);
    sh.str('K6', res.policy === 'payInCurrentMonth' ? '당월' : '이관', S.inCenter);
    sh.row(7, 22);
    sh.str('A7', SHEET_GUIDE, S.note);
    sh.row(8, 16);
    ['날짜', '요일', '계약', '출근', '퇴근', '휴게(분)', '유급 시간(h)', '추가근무(h)', '상태', '비고', '일급(원)', '주휴수당(원)']
      .forEach((x, k) => sh.str(`${'ABCDEFGHIJKL'[k]}8`, x, S.wHead));

    for (const { g, first: a, last: b, sub } of L.groups) {
      g.lines.forEach((l, k) => {
        const r = a + k;
        const sun = isoWeekday(l.date) === 7;
        sh.row(r, 12.5);
        sh.num(`A${r}`, excelSerial(l.date), sun ? S.dateSun : S.date);
        sh.str(`B${r}`, WEEKDAY_KO[isoWeekday(l.date)], sun ? S.textSun : S.text);
        if (l.contractDay) sh.str(`C${r}`, '○', sun ? S.textSun : S.text);
        if (l.D != null) sh.num(`D${r}`, frac(l.D), S.inTime);
        if (l.E != null) sh.num(`E${r}`, frac(l.E), S.inTime);
        if (l.F != null) sh.num(`F${r}`, l.F, S.inBreak);
        sh.fnum(`G${r}`, `IF(OR(D${r}="",E${r}=""),0,ROUND((E${r}-D${r})*24-IF(F${r}="",0,F${r})/60+IF($K$5="예",IF(F${r}="",0,F${r})/60,0),2))`, l.G, S.dayHours);
        sh.fnum(`H${r}`, `IF(G${r}=0,0,IF(C${r}="○",MAX(0,ROUND(G${r}-$B$5-IF($K$5="예",$L$4/60,0),2)),G${r}))`, l.H, S.dayHours);
        sh.str(`I${r}`, l.status, S.inCenter);
        if (l.remark) sh.str(`J${r}`, l.remark, S.inText);
        sh.fnum(`K${r}`, `ROUND(G${r}*$H$3,0)`, l.pay, S.dayMoney);
      });
      sh.row(sub, 13.5);
      sh.str(`A${sub}`, `${g.idx}주차 ${md(g.weekStart)}~${md(g.weekEnd)} 소계`, S.subLabel);
      sh.fnum(`G${sub}`, `SUM(G${a}:G${b})`, g.G, S.subHours);
      sh.fnum(`H${sub}`, `SUM(H${a}:H${b})`, g.H, S.subHours);
      sh.fnum(`K${sub}`, `SUM(K${a}:K${b})`, g.K, S.subMoney);
      if (g.kind === 'regular' && g.lFormula) {
        sh.fstr(`I${sub}`, WEEK_STATUS_F(a, b), g.status, S.subStatus);
        sh.fstr(`J${sub}`, WEEK_REMARK_F(sub), g.remark, S.subRemark);
        sh.fnum(`L${sub}`, `IF(I${sub}="개근",$H$5,0)`, g.L, S.subMoney);
      } else if (g.kind === 'regular') {
        sh.str(`I${sub}`, g.status, S.subStatus);
        sh.str(`J${sub}`, g.remark, S.subRemark);
        sh.num(`L${sub}`, g.L, S.subMoney);
      } else if (g.kind === 'carryIn') {
        sh.str(`I${sub}`, g.status, S.subStatus);
        sh.str(`J${sub}`, g.remark, S.subRemark);
        sh.num(`L${sub}`, g.L, S.subCarry);
      } else if (g.noWorkday) {
        sh.str(`I${sub}`, g.status, S.subStatus);
        sh.str(`J${sub}`, g.remark, S.subRemark);
        sh.num(`L${sub}`, g.L, S.subMoney);
      } else {
        sh.str(`I${sub}`, g.status, S.subStatus);
        sh.fstr(`J${sub}`, `IF($K$6="당월","${g.range} 주 · 당월 지급 (다음 달 초 결근 시 차감)","${g.range} 주 · 다음 달로 이관")`, g.remark, S.subRemark);
        sh.fnum(`L${sub}`, `IF($K$6="당월",IF(COUNTIFS(C${a}:C${b},"○",I${a}:I${b},"결근")>0,0,$H$5),0)`, g.L, S.subMoney);
      }
    }
    const T = L.total;
    const subs = L.groups.map((x) => x.sub);
    const plus = (col) => subs.map((r) => `${col}${r}`).join('+');
    sh.row(T, 15);
    sh.str(`A${T}`, '합계 (유급 시간 · 추가근무 · 시급분 급여 · 주휴수당)', S.totLabel);
    sh.fnum(`G${T}`, plus('G'), res.totals.G, S.totHours);
    sh.fnum(`H${T}`, plus('H'), res.totals.H, S.totHours);
    sh.empty(`I${T}`, S.totLabel);
    sh.empty(`J${T}`, S.totLabel);
    sh.fnum(`K${T}`, plus('K'), res.totals.K, S.totMoney);
    sh.fnum(`L${T}`, plus('L'), res.totals.L, S.totMoney);
    const holder = w.accountHolder || w.name;
    sh.row(T + 1, 18);
    sh.fstr(`A${T + 1}`, `"${m}월 지급 합계 · 세전 (시급분 + 주휴수당) · 입금 계좌: "&B6&" "&D6&" ("&H6&")"`,
      `${m}월 지급 합계 · 세전 (시급분 + 주휴수당) · 입금 계좌: ${w.bank || ''} ${w.accountNumber || ''} (${holder})`, S.grossLabel);
    sh.fnum(`K${T + 1}`, `K${T}+L${T}`, res.totals.gross, S.grossValue);
    sh.row(T + 2, 13);
    sh.str(`A${T + 2}`, '소득세 3% (10원 미만 절사) · 세금 3.3% 공제가 "예"일 때', S.taxLabel);
    sh.fnum(`K${T + 2}`, `IF($K$3="예",ROUNDDOWN(K${T + 1}*0.03,-1),0)`, res.totals.incomeTax, S.taxValue);
    sh.row(T + 3, 13);
    sh.str(`A${T + 3}`, '지방소득세 (소득세의 10%, 10원 미만 절사)', S.taxLabel);
    sh.fnum(`K${T + 3}`, `IF($K$3="예",ROUNDDOWN(K${T + 2}*0.1,-1),0)`, res.totals.localTax, S.taxValue);
    sh.row(T + 4, 18);
    sh.fstr(`A${T + 4}`, 'IF($K$3="예","실수령액 · 세후 (지급 합계 − 소득세 − 지방소득세)","실수령액 (세금 공제 안 함)")',
      res.taxOn ? '실수령액 · 세후 (지급 합계 − 소득세 − 지방소득세)' : '실수령액 (세금 공제 안 함)', S.netLabel);
    sh.fnum(`K${T + 4}`, `K${T + 1}-K${T + 2}-K${T + 3}`, res.totals.net, S.netValue);
    sh.row(T + 5, 20);
    sh.str(`A${T + 5}`, FOOTNOTE, S.note);
    sh.dimension = `A1:L${T + 5}`;
    sh.printArea = `$A$1:$L$${T + 5}`;
    sh.printTitles = '$8:$8';
    ['A1:I1', 'J1:L1', 'B3:C3', 'E3:F3', 'B4:C4', 'E4:F4', 'B5:C5', 'E5:F5', 'B6:C6', 'D6:F6', 'A7:L7'].forEach((x) => sh.merge(x));
    subs.forEach((r) => sh.merge(`A${r}:F${r}`));
    sh.merge(`A${T}:F${T}`);
    for (let k = 1; k <= 4; k++) { sh.merge(`A${T + k}:J${T + k}`); sh.merge(`K${T + k}:L${T + k}`); }
    sh.merge(`A${T + 5}:L${T + 5}`);
  });
  return { workbook: wb, results, workers, fileName: xlsxFileName(y, m, store), created };
}

/** → { bytes: Uint8Array, fileName } */
export function exportPayrollXlsx(data, y, m, created = new Date()) {
  const { workbook, fileName, results } = buildPayrollWorkbook(data, y, m, { created });
  return { bytes: workbook.toZip(created), fileName, results };
}
