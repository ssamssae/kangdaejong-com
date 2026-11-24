// 근로계약 설정 · 근무자 정보(추가) 화면

import { h, icon } from '../dom.js';
import { topbar, iconButton, card, segmented, toggleSwitch, bottomCta } from '../widgets.js';
import { contractView, validateContract, PAY_NOW, DEFER } from '../view-model.js';
import { contractFor } from '../../engine/payroll.js';
import { comma } from '../../engine/format.js';
import { dotted } from '../../engine/dates.js';
import { newWorkerId } from '../../data/store.js';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

/** 새 근무자 기본 계약(앱 기본값은 확인하지 못함 — 추정) */
function defaultContract(worker) {
  return {
    effectiveFrom: worker?.startDate || null,
    workdays: [1, 2, 3, 4, 5],
    start: '09:00',
    end: '18:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    hourlyWage: 10320,
    breakPaid: false,
    restWeekday: 7,
    boundaryPolicy: DEFER,
    taxWithholding: true,
  };
}

function setDirty(route, root) {
  route.dirty = true;
  const btn = root?.querySelector('.save-btn');
  if (btn) btn.disabled = false;
}

// ── 근로계약 설정 ─────────────────────────────────────────
export function contractScreen(app, route) {
  const worker = app.state.workers.find((w) => w.id === route.workerId);
  if (!worker) { app.ui.stack.pop(); return h('div'); }
  if (!route.draft) {
    const c = (worker.contracts || []).length ? contractFor(worker, '9999-12-31') : null;
    route.draft = structuredClone(c || defaultContract(worker));
    route.isNew = !c;
    route.dirty = route.isNew;
  }
  const d = route.draft;
  const v = contractView(d);
  const rerender = () => { route.dirty = true; app.render(); };
  const save = () => {
    const err = validateContract(d);
    if (err) { app.toast(err); return; }
    app.update((st) => {
      const w = st.workers.find((x) => x.id === worker.id);
      const list = w.contracts || (w.contracts = []);
      const clean = { ...d, workdays: [...d.workdays].sort((a, b) => a - b), hourlyWage: Number(d.hourlyWage) || 0 };
      if (!list.length) list.push({ ...clean, effectiveFrom: clean.effectiveFrom || w.startDate });
      else {
        const cur = contractFor(w, '9999-12-31');
        Object.assign(cur, clean);
      }
    }, { render: false });
    app.ui.stack.pop();
    app.toast('저장했습니다');
  };
  const timePill = (key, cls) => h('label', { class: `time-pill ${cls}` },
    cls.includes('work') ? icon('clock', 20) : null,
    h('span', null, d[key] || '--:--'),
    h('input', {
      type: 'time', value: d[key] || '', step: 300, 'aria-label': key,
      onchange: (e) => { d[key] = e.target.value; rerender(); },
    }));
  return h('div', { class: 'screen' },
    topbar({
      title: '근로계약 설정',
      back: () => app.pop(),
      right: [
        iconButton('person', '근무자 정보 (이름·계좌·퇴사일·보건증)', () => app.push({ name: 'workerForm', workerId: worker.id })),
      ],
    }),
    h('main', { class: 'body' },
      card(
        h('div', { class: 'field-label' }, '시급'),
        h('label', { class: 'wage-field' },
          h('input', {
            type: 'text', inputmode: 'numeric', value: comma(Number(d.hourlyWage) || 0), 'aria-label': '시급',
            oninput: (e) => {
              const n = Number(e.target.value.replace(/[^\d]/g, '')) || 0;
              d.hourlyWage = n;
              e.target.value = n ? comma(n) : '';
              setDirty(route, app.root);
            },
            onchange: () => app.render(),
          }),
          h('span', null, '원')),
        h('div', { class: 'helper' }, v.minWage)),
      card(
        h('div', { class: 'field-label' }, '근무 요일'),
        h('div', { class: 'chips day-chips' }, DAYS.map((label, i) => {
          const wd = i + 1;
          const on = d.workdays.includes(wd);
          return h('button', {
            class: `chip${on ? ' on' : ''}`, 'aria-pressed': on ? 'true' : 'false',
            onclick: () => { d.workdays = on ? d.workdays.filter((x) => x !== wd) : [...d.workdays, wd].sort((a, b) => a - b); rerender(); },
          }, label);
        }))),
      card(
        h('div', { class: 'field-label' }, '근무 시간 · 숫자를 누르면 시간 선택 창이 열립니다'),
        h('div', { class: 'time-row' }, timePill('start', 'work'), h('span', { class: 'tilde' }, '~'), timePill('end', 'work')),
        h('div', { class: 'break-head' }, h('span', { class: 'field-label' }, '휴게 시간'), h('span', { class: 'helper' }, v.breakWindow)),
        h('div', { class: 'time-row' }, timePill('breakStart', 'brk'), h('span', { class: 'tilde' }, '~'), timePill('breakEnd', 'brk'), h('span', { class: 'brk-len' }, v.breakLen)),
        h('div', { class: `notice-box ${v.breakOk ? 'blue' : 'red'}` }, v.breakInfo),
        h('div', { class: 'switch-row' },
          h('div', null, h('div', { class: 'row-title big' }, '휴게시간 급여 처리'), h('div', { class: 'row-sub' }, '1인 근무 등으로 휴게를 쓰기 어려울 때. 휴게를 근무로 보고 시급을 지급합니다. 주휴수당 기준은 그대로입니다.')),
          toggleSwitch(d.breakPaid, (val) => { d.breakPaid = val; rerender(); }, '휴게시간 급여 처리')),
        h('div', { class: 'helper' }, v.daily)),
      card(
        h('div', { class: 'field-label' }, '월말·월초에 걸친 주의 주휴수당 (기본값)'),
        segmented([[DEFER, '다음 달로 이관'], [PAY_NOW, '당월 지급']], d.boundaryPolicy, (p) => { d.boundaryPolicy = p; rerender(); }, 'bd-seg'),
        h('div', { class: 'switch-row' },
          h('div', null, h('div', { class: 'row-title big' }, '세금 3.3% 공제 표시'), h('div', { class: 'row-sub' }, '정산과 엑셀에 세전·세후를 함께 표시')),
          toggleSwitch(d.taxWithholding !== false, (val) => { d.taxWithholding = val; rerender(); }, '세금 3.3% 공제 표시'))),
      h('section', { class: 'card weekly-card' },
        h('div', { class: 'wk-row' }, h('span', null, '주 소정근로시간'), h('strong', null, v.weeklyLine)),
        h('div', { class: 'wk-row' }, h('span', null, '주휴수당 · 매주'), h('strong', { class: 'big' }, v.weeklyPay)),
        v.formula ? h('div', { class: 'wk-formula' }, v.formula) : null)),
    bottomCta(h('button', { class: 'pill-btn primary block save-btn', disabled: !route.dirty, onclick: save }, '저장')));
}

// ── 근무자 정보 / 근무자 추가 ──────────────────────────────
export function workerFormScreen(app, route) {
  const existing = route.workerId ? app.state.workers.find((w) => w.id === route.workerId) : null;
  if (!route.draft) {
    route.draft = existing
      ? { name: existing.name, startDate: existing.startDate, bank: existing.bank || '', accountNumber: existing.accountNumber || '', accountHolder: existing.accountHolder || '', healthCheckDate: existing.healthCheckDate, endDate: existing.endDate }
      : { name: '', startDate: app.today, bank: '', accountNumber: '', accountHolder: '', healthCheckDate: null, endDate: null };
  }
  const d = route.draft;
  const rerender = () => app.render();
  const text = (key, label, hint) => h('label', { class: 'text-field' },
    h('span', { class: 'tf-label' }, label),
    h('input', { type: 'text', value: d[key] || '', placeholder: hint, oninput: (e) => { d[key] = e.target.value; } }));
  const datePill = (key, emptyText, { clearable = false } = {}) => h('div', { class: 'date-wrap' },
    h('label', { class: 'date-pill' }, icon('event', 22),
      h('span', null, d[key] ? dotted(d[key]) : emptyText),
      h('input', { type: 'date', value: d[key] || '', onchange: (e) => { d[key] = e.target.value || (clearable ? null : d[key]); rerender(); } })),
    clearable && d[key] ? h('button', { class: 'clear-date', 'aria-label': '지우기', onclick: () => { d[key] = null; rerender(); } }, icon('close', 18)) : null);
  const save = () => {
    const name = (d.name || '').trim();
    if (!name) { app.toast('이름을 입력하세요'); return; }
    if (d.endDate && d.startDate && d.endDate < d.startDate) { app.toast('퇴사일은 근로 시작일보다 앞설 수 없습니다'); return; }
    // 대종님 2026-11-24 지시: 웹판은 요금제 없음 — 재직 근무자 수 한도 검사를 하지 않는다.
    const fields = {
      name, startDate: d.startDate || null, endDate: d.endDate || null,
      bank: (d.bank || '').trim() || null, accountNumber: (d.accountNumber || '').trim() || null,
      accountHolder: (d.accountHolder || '').trim() || null, healthCheckDate: d.healthCheckDate || null,
    };
    if (existing) {
      app.update((st) => Object.assign(st.workers.find((w) => w.id === existing.id), fields), { render: false });
      app.ui.stack.pop();
      app.toast('저장했습니다');
    } else {
      const id = newWorkerId();
      app.update((st) => { st.workers.push({ id, ...fields, contracts: [], records: [] }); }, { render: false });
      app.ui.workerId = id;
      app.replace({ name: 'contract', workerId: id });
      app.toast('저장했습니다. 이어서 근무 요일·시간·시급을 설정하세요');
    }
  };
  return h('div', { class: 'screen' },
    topbar({ title: existing ? '근무자 정보' : '근무자 추가', back: () => app.pop() }),
    h('main', { class: 'body' },
      card(
        h('div', { class: 'field-label' }, '기본 정보'),
        text('name', '이름', '예: 김민지'),
        h('div', { class: 'date-row' }, h('span', { class: 'row-title' }, '근로 시작일'), datePill('startDate', '')),
        h('div', { class: 'helper' }, '퇴직금·주휴 판정의 기준일입니다. 근로계약서의 근로 개시일과 같게 두세요.')),
      card(
        h('div', { class: 'field-label' }, '급여 계좌 · 엑셀 명세서에 그대로 표시'),
        text('bank', '은행', '예: 카카오뱅크'),
        text('accountNumber', '계좌번호', ''),
        text('accountHolder', '예금주', '비우면 근무자 이름')),
      card(
        h('div', { class: 'field-label' }, '보건증 (건강진단결과서)'),
        h('div', { class: 'date-row' }, h('span', { class: 'row-title' }, '검진일'), datePill('healthCheckDate', '미등록', { clearable: true })),
        h('div', { class: 'helper' }, '검진일부터 1년간 유효합니다. 등록해 두면 만료 1개월 전에 알려 드립니다 (리스크 탭, 다음 단계).')),
      card(
        h('div', { class: 'field-label' }, '퇴사'),
        h('div', { class: 'date-row' }, h('span', { class: 'row-title' }, '퇴사일'), datePill('endDate', '재직 중', { clearable: true })),
        h('div', { class: 'helper' }, '그만둔 사람은 삭제하지 말고 퇴사일을 넣으세요. 기록은 남고 재직 인원에서만 빠집니다.')),
      existing ? h('button', { class: 'danger-btn', onclick: () => app.openOverlay({ type: 'deleteWorker', workerId: existing.id }) }, icon('trash', 22), '근무자 삭제') : null),
    bottomCta(h('button', { class: 'pill-btn primary block save-btn', onclick: save }, '저장')));
}
