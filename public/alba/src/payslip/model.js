// 급여명세서(A4 한 장) 글자 모델 — 웹판에만 있는 기능(대종님 2026-11-24 승인).
// 금액·계산 글자는 정산 화면 글자(settleView)를 그대로 옮긴다. 그래서 명세서 숫자는 정산 화면과 다를 수 없다.

import { computeMonth, payDate } from '../engine/payroll.js';
import { dotted, pad2, todayIso } from '../engine/dates.js';
import { comma, minusWon } from '../engine/format.js';
import { settleView, PAY_NOW } from '../ui/view-model.js';
import { DISCLAIMER } from '../ui/texts.js';

/** '급여명세서_김민지_2026-11.pdf' (파일 이름에 못 쓰는 글자는 뺌) */
export function payslipFileName(name, y, m) {
  const safe = String(name || '').replace(/[\\/:*?"<>|]/g, '').trim() || '근무자';
  return `급여명세서_${safe}_${y}-${pad2(m)}.pdf`;
}

/**
 * @returns 그리기에 필요한 글자 묶음. 근로계약이 없으면 오류(정산 화면도 숫자를 안 보여 줌).
 */
export function payslipModel(state, workerId, y, m, now = new Date()) {
  const worker = (state.workers || []).find((w) => w.id === workerId);
  if (!worker) throw new Error('근무자를 찾을 수 없습니다');
  const res = computeMonth(state, worker, y, m);
  if (!res.contract) throw new Error('근로계약이 없습니다');
  const s = settleView(res);
  const t = res.totals;
  const items = [
    { label: s.base.label, sub: s.base.sub, amount: s.base.amount },
    { label: s.extra.label, sub: s.extra.sub, amount: s.extra.amount },
    { label: s.weekly.label, sub: s.weekly.sub, amount: s.weekly.amount, weeks: s.weekly.rows },
  ];
  if (s.boundaryPaid) items.push({ label: s.boundaryPaid.label, sub: s.boundaryPaid.sub, amount: s.boundaryPaid.amount });
  if (s.carry) items.push({ label: s.carry.label, sub: s.carry.sub, amount: s.carry.amount });
  const notes = [];
  if (s.boundary && s.boundary.policy !== PAY_NOW) notes.push(`${s.boundary.title} · ${s.boundary.note}`);
  if (s.notice) notes.push(s.notice);
  notes.push(s.footer, DISCLAIMER);
  return {
    fileName: payslipFileName(worker.name, y, m),
    docTitle: `급여명세서 · ${worker.name} · ${y}년 ${m}월`,
    title: '급여명세서',
    period: `${y}년 ${m}월분`,
    store: String(state.storeSettings?.storeName || '').trim(),
    info: [
      ['성명', worker.name],
      ['지급일', dotted(payDate(y, m, state.storeSettings?.payDay ?? 10))],
      ['정산 기간', `${dotted(res.first)} ~ ${dotted(res.last)}`],
      ['시급', `${comma(res.contract.hourlyWage)}원`],
    ],
    account: { label: s.account.label, text: s.account.text },
    items,
    gross: { label: s.grossTitle, amount: s.gross },
    deductions: s.taxRows.map(([label, amount]) => ({ label, amount })),
    deductionTotal: s.taxRows.length ? { label: '공제 합계', amount: minusWon(t.incomeTax + t.localTax) } : null,
    net: { label: s.netLabel, amount: s.net },
    line: s.line,
    notes,
    made: `만든 날 ${dotted(todayIso(now))} · 알바 급여 계산기 웹판`,
  };
}
