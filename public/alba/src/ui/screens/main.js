// 현황 · 근태 · 정산 탭

import { h, icon } from '../dom.js';
import {
  topbar, iconButton, textButton, monthSwitcher, workerChips, emptyWorkers, card, segmented,
} from '../widgets.js';
import { homeView, attView, settleView, PAY_NOW, DEFER } from '../view-model.js';
import { computeMonth, contractFor } from '../../engine/payroll.js';
import { monthEnd } from '../../engine/dates.js';
import { DISCLAIMER } from '../texts.js';
import { payslipModel } from '../../payslip/model.js';

const WEEK_HEAD = ['월', '화', '수', '목', '금', '토', '일'];

function openAddWorker(app) {
  app.push({ name: 'workerForm', workerId: null });
}

// ── 현황 ───────────────────────────────────────────────
export function homeScreen(app) {
  const { y, m } = app.ui.month;
  const bar = topbar({
    title: '근무 현황',
    right: [
      iconButton('download', '엑셀 내보내기', () => app.push({ name: 'export' })),
      iconButton('gearOutline', '설정', () => app.tab('settings')),
    ],
  });
  if (!(app.state.workers || []).length) return h('div', { class: 'screen white' }, bar, h('main', { class: 'body' }, emptyWorkers(app)));
  const v = homeView(app.state, y, m);
  return h('div', { class: 'screen white' }, bar, h('main', { class: 'body cal-body' },
    monthSwitcher(app),
    h('div', { class: 'cal-head' }, WEEK_HEAD.map((d, i) => h('span', { class: i === 6 ? 'sun' : '' }, d))),
    h('div', { class: 'home-cal' }, v.weeks.map((week) => h('div', { class: 'home-week' }, week.map((c) => (c.inMonth
      ? h('button', {
        class: `hday${c.date === app.today ? ' today' : ''}`,
        onclick: () => app.tab('att'),
        'aria-label': `${c.day}일 ${c.badges.map((b) => b.text).join(', ')}`,
      }, h('span', { class: `num${c.isSun ? ' sun' : ''}` }, c.day),
      c.badges.map((b) => h('span', { class: `badge b-${b.kind}` }, b.text)))
      : h('div', { class: 'hday out' }, h('span', { class: 'num' }, c.day))))))),
    h('div', { class: 'home-foot' },
      h('span', null, v.footer),
      textButton('정산 보기', () => app.tab('settle'), { cls: 'link' }))));
}

// ── 근태 ───────────────────────────────────────────────
export function attendanceScreen(app) {
  const bar = topbar({ title: '근태 입력', right: [textButton('정산', () => app.tab('settle'), { cls: 'link' })] });
  if (!(app.state.workers || []).length) return h('div', { class: 'screen white' }, bar, h('main', { class: 'body' }, emptyWorkers(app)));
  const { y, m } = app.ui.month;
  const v = attView(app.state, app.ui.workerId, y, m);
  const body = [workerChips(app, { onAdd: () => openAddWorker(app) }), monthSwitcher(app)];
  if (v.empty) {
    body.push(h('div', { class: 'notice-box gray' }, v.empty));
    if (v.empty === '근로계약이 없습니다') {
      body.push(h('button', { class: 'pill-btn primary block', onclick: () => app.push({ name: 'contract', workerId: v.worker.id }) }, '근로계약 설정'));
    }
  } else {
    body.push(h('div', { class: 'att-head' }, WEEK_HEAD.map((d, i) => h('span', { class: i === 6 ? 'sun' : '' }, d)), h('span', { class: 'jh' }, '주휴')));
    body.push(h('div', { class: 'att-grid' }, v.weeks.map((w) => h('div', { class: 'att-week' },
      w.days.map((d) => {
        if (!d.inMonth) return h('div', { class: 'aday out' }, h('span', { class: 'num' }, d.day));
        const kind = d.cell.kind;
        return h('button', {
          class: `aday k-${kind}${d.date === app.today ? ' today' : ''}`,
          'aria-label': `${d.day}일 ${d.cell.label}`.trim(),
          onclick: () => openDayEditor(app, v.worker, d.line),
        }, h('span', { class: `num${d.isSun && kind === 'off' ? ' sun' : ''}` }, d.day), d.cell.label ? h('span', { class: 'lbl' }, d.cell.label) : null);
      }),
      weekCell(w.badge)))));
    body.push(h('div', { class: 'att-sum' }, v.summary));
  }
  return h('div', { class: 'screen white' }, bar, h('main', { class: 'body cal-body' }, body));
}

function weekCell(b) {
  const ic = { carry: 'arrowLeft', ok: 'check', no: 'close', defer: 'arrowRight', now: 'check' }[b.kind];
  return h('div', { class: `wk wk-${b.kind}` }, icon(ic, 18), h('span', null, b.label));
}

function openDayEditor(app, worker, line) {
  if (!line.employed) {
    app.toast('재직 기간 밖의 날짜입니다. 근무자 정보의 근로 시작일·퇴사일을 확인하세요');
    return;
  }
  app.openOverlay({ type: 'day', workerId: worker.id, date: line.date, init: true });
}

// ── 정산 ───────────────────────────────────────────────
export function settlementScreen(app) {
  const bar = topbar({ title: '정산', right: [iconButton('download', '엑셀 내보내기', () => app.push({ name: 'export' }))] });
  if (!(app.state.workers || []).length) return h('div', { class: 'screen' }, bar, h('main', { class: 'body' }, emptyWorkers(app)));
  const { y, m } = app.ui.month;
  const worker = app.state.workers.find((w) => w.id === app.ui.workerId);
  const body = [workerChips(app, { onAdd: () => openAddWorker(app) }), monthSwitcher(app)];
  const v = attView(app.state, worker.id, y, m);
  if (v.empty) {
    body.push(h('div', { class: 'notice-box gray' }, v.empty));
  } else {
    const res = computeMonth(app.state, worker, y, m);
    const s = settleView(res);
    if (s.notice) body.push(h('div', { class: 'notice-box warn' }, icon('warn', 22), h('span', null, s.notice)));
    body.push(h('section', { class: 'card sum-card' },
      h('div', { class: 'sum-title' }, s.grossTitle),
      h('div', { class: 'sum-gross' }, s.gross),
      h('div', { class: 'sum-net' }, h('span', null, s.netLabel), h('strong', null, s.net)),
      s.taxRows.map(([a, b]) => h('div', { class: 'sum-tax' }, h('span', null, a), h('span', { class: 'neg' }, b))),
      h('div', { class: 'sum-line' }, s.line)));
    if (s.boundary) {
      const setPolicy = (p) => app.update((st) => {
        const w = st.workers.find((x) => x.id === worker.id);
        const c = contractFor(w, monthEnd(y, m));
        if (c) c.boundaryPolicy = p;
      });
      body.push(h('section', { class: 'card boundary-card' },
        h('div', { class: 'bd-title' }, s.boundary.title),
        h('div', { class: 'bd-q' }, s.boundary.question),
        segmented([[DEFER, '다음 달로 이관'], [PAY_NOW, '당월 지급']], s.boundary.policy, setPolicy, 'bd-seg'),
        h('div', { class: 'bd-note' }, s.boundary.note)));
    }
    body.push(h('section', { class: 'card detail-card' },
      detailRow(s.base), detailRow(s.extra),
      h('div', { class: 'detail' },
        h('div', { class: 'd-head' }, h('div', null, h('div', { class: 'd-label' }, s.weekly.label), h('div', { class: 'd-sub' }, s.weekly.sub)), h('div', { class: 'd-amt' }, s.weekly.amount)),
        h('div', { class: 'weeks' }, s.weekly.rows.map((r) => h('div', { class: 'wrow' },
          h('span', { class: 'w-range' }, r.range), h('span', { class: `w-st st-${r.kind}` }, r.status), h('span', { class: 'w-amt' }, r.amount))))),
      s.boundaryPaid ? detailRow(s.boundaryPaid) : null,
      s.carry ? detailRow(s.carry) : null));
    body.push(h('section', { class: 'card account-card' },
      h('div', null, h('div', { class: 'd-sub' }, s.account.label), h('div', { class: 'acc' }, nowrapWords(s.account.text))),
      h('button', { class: 'pill-btn primary', onclick: () => app.push({ name: 'export' }) }, icon('download', 22), '엑셀')));
    // 웹판에만 있는 급여명세서 PDF(대종님 2026-11-24 승인). 숫자는 이 화면과 같은 settleView 글자를 쓴다.
    body.push(h('button', { class: 'pill-btn block payslip-btn', disabled: Boolean(app.ui.payslipBusy), onclick: () => downloadPayslip(app, worker.id, y, m) },
      icon('doc', 22), app.ui.payslipBusy ? '만드는 중…' : '급여명세서 PDF'));
    body.push(h('div', { class: 'foot-note' }, s.footer));
  }
  return h('div', { class: 'screen' }, bar, h('main', { class: 'body settle-body' }, body), h('div', { class: 'disclaimer' }, DISCLAIMER));
}

/** 급여명세서 PDF 만들어 내려받기(A4 한 장) */
async function downloadPayslip(app, workerId, y, m) {
  if (app.ui.payslipBusy) return;
  app.setUi({ payslipBusy: true });
  try {
    const model = payslipModel(app.state, workerId, y, m, app.now());
    const bytes = await app.makePayslipPdf(model);
    app.download(bytes, model.fileName, 'application/pdf');
    app.ui.payslipBusy = false;
    app.toast('저장했습니다');
  } catch (e) {
    app.ui.payslipBusy = false;
    app.toast(`급여명세서를 만들지 못했습니다: ${e.message}`);
  }
}

/** 띄어쓰기에서만 줄바꿈되게 낱말마다 감싼다(글자는 그대로) */
function nowrapWords(text) {
  return String(text).split(' ').flatMap((w, i) => (i ? [' ', h('span', { class: 'w' }, w)] : [h('span', { class: 'w' }, w)]));
}

function detailRow(d) {
  return h('div', { class: 'detail' }, h('div', { class: 'd-head' },
    h('div', null, h('div', { class: 'd-label' }, d.label), h('div', { class: 'd-sub' }, d.sub)),
    h('div', { class: 'd-amt' }, d.amount)));
}
