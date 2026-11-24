// 겹창: 날짜 편집 창(아래에서 올라옴) · 백업 불러오기 · 모든 데이터 삭제 · 근무자 삭제 · 지급일 목록

import { h, icon } from '../dom.js';
import {
  dayEditorView, editorInitial, stepperRange, DAY_TYPES, restoreLines, paydayOptions,
} from '../view-model.js';
import { computeDay } from '../../engine/payroll.js';
import { restoreOverwrite, restoreMerge, summarize } from '../../data/backup.js';
import { RESTORE, DELETE_ALL } from '../texts.js';

export function renderOverlay(app) {
  const ov = app.ui.overlay;
  if (!ov) return null;
  switch (ov.type) {
    case 'day': return dayEditor(app, ov);
    case 'restore': return restoreDialog(app, ov);
    case 'deleteAll': return deleteAllDialog(app);
    case 'deleteWorker': return deleteWorkerDialog(app, ov);
    case 'payday': return paydayMenu(app);
    default: return null;
  }
}

function scrim(app, child, cls = '') {
  return h('div', { class: `overlay ${cls}`.trim() },
    h('div', { class: 'scrim', onclick: () => app.closeOverlay(), 'aria-label': 'Scrim' }),
    child);
}

function sheet(app, ...children) {
  return scrim(app, h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' },
    h('button', { class: 'handle', 'aria-label': 'Dismiss', onclick: () => app.closeOverlay() }, h('span')),
    children), 'bottom');
}

function dialog(app, ...children) {
  return scrim(app, h('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true' }, children), 'center');
}

// ── 날짜 편집 창 ──────────────────────────────────────────
function lineWithoutRecord(app, worker, date) {
  const w = { ...worker, records: (worker.records || []).filter((r) => r.date !== date) };
  return computeDay(app.state, w, date);
}

function dayEditor(app, ov) {
  const worker = app.state.workers.find((w) => w.id === ov.workerId);
  if (!worker) return null;
  const line = computeDay(app.state, worker, ov.date);
  if (ov.init) {
    Object.assign(ov, editorInitial(line));
    ov.init = false;
  }
  const size = app.state.storeSettings.businessSize;
  const v = dayEditorView({ line, size, sel: ov.sel, minutes: ov.minutes });
  const pick = (sel) => {
    ov.sel = sel;
    if (['late', 'earlyLeave', 'extraWork'].includes(sel)) {
      const r = stepperRange(sel, line);
      const keep = line.record && line.record.type === sel ? line.record.minutes : r.init;
      ov.minutes = keep;
    }
    app.render();
  };
  const stepBy = (dir) => {
    const r = stepperRange(ov.sel, line);
    ov.minutes = Math.min(r.max, Math.max(r.min, ov.minutes + dir * r.step));
    app.render();
  };
  const chips = line.contractDay
    ? [DAY_TYPES.slice(0, 4), DAY_TYPES.slice(4)]
    : [[['none', '없음'], ['extraWork', '추가근무']]];
  return sheet(app,
    h('div', { class: 'sheet-title' }, v.title),
    h('div', { class: 'sheet-sub' }, v.sub),
    chips.map((row) => h('div', { class: 'chips type-chips' }, row.map(([key, label]) => h('button', {
      class: `chip${ov.sel === key ? ' on' : ''}`, 'aria-pressed': ov.sel === key ? 'true' : 'false', onclick: () => pick(key),
    }, label)))),
    v.stepper ? h('div', { class: 'stepper' },
      h('span', { class: 'st-label' }, v.stepper.label),
      h('div', { class: 'st-ctl' },
        h('button', { class: 'round', 'aria-label': '줄이기', onclick: () => stepBy(-1) }, icon('minus', 22)),
        h('strong', { class: 'st-val' }, v.stepper.value),
        h('button', { class: 'round', 'aria-label': '늘리기', onclick: () => stepBy(1) }, icon('plus', 22)))) : null,
    v.info ? h('div', { class: `info-box tone-${v.info.tone}` }, h('div', { class: 'info-title' }, v.info.title), v.info.body ? h('div', { class: 'info-body' }, v.info.body) : null) : null,
    h('button', { class: 'pill-btn primary block', onclick: () => saveDay(app, ov, worker, line) }, '저장'));
}

function saveDay(app, ov, worker, line) {
  const base = lineWithoutRecord(app, worker, ov.date);
  const old = line.record;
  let rec = null;
  if (line.contractDay) {
    const derived = base.type === 'normal' ? 'normal' : base.type === 'storeClosed' ? 'storeClosed' : base.type === 'paidHoliday' ? null : 'normal';
    if (ov.sel && ov.sel !== derived) {
      const withMin = ['late', 'earlyLeave', 'extraWork'].includes(ov.sel);
      rec = { date: ov.date, type: ov.sel, minutes: withMin ? ov.minutes : 0, note: old && old.type === ov.sel ? old.note || '' : '' };
    }
  } else if (ov.sel === 'extraWork') {
    rec = { date: ov.date, type: 'extraWork', minutes: ov.minutes, note: old && old.type === 'extraWork' ? old.note || '' : '' };
  }
  app.ui.overlay = null;
  app.update((st) => {
    const w = st.workers.find((x) => x.id === worker.id);
    w.records = (w.records || []).filter((r) => r.date !== ov.date);
    if (rec) w.records.push(rec);
    w.records.sort((a, b) => a.date.localeCompare(b.date));
  });
}

// ── 백업 불러오기 ─────────────────────────────────────────
function restoreDialog(app, ov) {
  const s = summarize(ov.backup);
  const apply = (mode) => {
    const next = mode === 'overwrite' ? restoreOverwrite(app.state, ov.backup) : restoreMerge(app.state, ov.backup);
    app.ui.overlay = null;
    app.replaceState(next);
    const recs = next.workers.reduce((a, w) => a + (w.records || []).length, 0);
    app.toast(`${mode === 'overwrite' ? '덮어쓰기' : '합치기'}로 복원했습니다: 근무자 ${next.workers.length}명, 근태 ${recs}건`);
  };
  return dialog(app,
    h('h2', { class: 'dlg-title' }, '백업 불러오기'),
    h('div', { class: 'restore-lines' }, restoreLines(s).map(([a, b]) => h('div', null, h('span', { class: 'rl-k' }, a), '  ', h('span', null, b)))),
    h('p', { class: 'desc' }, RESTORE.overwrite),
    h('p', { class: 'desc' }, RESTORE.merge),
    h('div', { class: 'dlg-actions' },
      h('button', { class: 'text-btn link', onclick: () => app.closeOverlay() }, '취소'),
      h('button', { class: 'text-btn link', onclick: () => apply('merge') }, '합치기'),
      h('button', { class: 'text-btn danger', onclick: () => apply('overwrite') }, '덮어쓰기')));
}

// ── 모든 데이터 삭제 ──────────────────────────────────────
function deleteAllDialog(app) {
  return dialog(app,
    h('h2', { class: 'dlg-title' }, DELETE_ALL.title),
    h('p', { class: 'desc' }, DELETE_ALL.body),
    h('p', { class: 'desc' }, DELETE_ALL.hint),
    h('div', { class: 'dlg-actions' },
      h('button', { class: 'text-btn link', onclick: () => app.closeOverlay() }, '취소'),
      h('button', {
        class: 'text-btn danger',
        onclick: () => { app.ui.overlay = null; app.resetAll(); app.toast('모든 데이터를 지웠습니다'); },
      }, '모두 삭제')));
}

// ── 근무자 삭제 ──────────────────────────────────────────
function deleteWorkerDialog(app, ov) {
  const w = app.state.workers.find((x) => x.id === ov.workerId);
  if (!w) return null;
  return dialog(app,
    h('h2', { class: 'dlg-title' }, `근무자 "${w.name}" 삭제`),
    h('p', { class: 'desc' }, '근로계약과 근태 기록이 함께 지워지며 되돌릴 수 없습니다.'),
    h('p', { class: 'desc' }, '그만둔 사람은 삭제 대신 퇴사일을 입력해 두면 기록이 남고 재직 인원에서만 빠집니다.'),
    h('div', { class: 'dlg-actions' },
      h('button', { class: 'text-btn link', onclick: () => app.closeOverlay() }, '취소'),
      h('button', {
        class: 'text-btn danger',
        onclick: () => {
          app.ui.overlay = null;
          app.ui.stack = app.ui.stack.filter((r) => r.workerId !== w.id);
          app.update((st) => { st.workers = st.workers.filter((x) => x.id !== w.id); });
        },
      }, '삭제')));
}

// ── 급여 지급일 목록 ──────────────────────────────────────
function paydayMenu(app) {
  const cur = app.state.storeSettings.payDay;
  return scrim(app, h('div', { class: 'menu', role: 'listbox' },
    paydayOptions().map((o) => h('button', {
      class: `menu-item${o.value === cur ? ' on' : ''}`, role: 'option', 'aria-selected': o.value === cur ? 'true' : 'false',
      onclick: () => { app.ui.overlay = null; app.update((st) => { st.storeSettings.payDay = o.value; }); },
    }, o.label))), 'menu-host');
}
