// 앱 뼈대: 상태·화면 이동·겹창·알림·파일 내려받기. 불러오기만으로는 DOM 을 건드리지 않는다(start() 에서 시작).

import { h, icon } from './dom.js';
import { loadState, saveState, emptyState } from '../data/store.js';
import { todayIso, parts } from '../engine/dates.js';
import { homeScreen, attendanceScreen, settlementScreen } from './screens/main.js';
import { settingsScreen, holidaysScreen, exportScreen, guideScreen, referenceScreen, privacyScreen } from './screens/settings.js';
import { contractScreen, workerFormScreen } from './screens/forms.js';
import { renderOverlay } from './screens/overlays.js';
import { makePayslipPdf } from '../payslip/make.js';

// [키, 이름, 고른 탭 아이콘, 안 고른 탭 아이콘(외곽선)]
const TABS = [
  ['home', '현황', 'calendar', 'calendar'],
  ['att', '근태', 'editCal', 'editCal'],
  ['settle', '정산', 'receipt', 'receiptOutline'],
  ['settings', '설정', 'gear', 'gearOutline'],
];

const SCREENS = {
  holidays: holidaysScreen,
  export: exportScreen,
  guide: guideScreen,
  reference: referenceScreen,
  privacy: privacyScreen,
  contract: contractScreen,
  workerForm: workerFormScreen,
};

/** 아래 탭을 가리는 전체 화면(앱과 같이 근로계약·근무자 정보는 탭 막대 없음) */
const FULLSCREEN = new Set(['contract', 'workerForm', 'export']);

export function createApp(root, { storage = globalThis.localStorage, now = () => new Date() } = {}) {
  const today = todayIso(now());
  const t = parts(today);
  const app = {
    root,
    state: loadState(storage),
    ui: { tab: 'home', stack: [], month: { y: t.y, m: t.m }, workerId: null, overlay: null, toast: null },
    today,
    now,
    scroll: new Map(),
    /** 급여명세서 모델 → PDF 바이트(브라우저 캔버스로 그림). 테스트는 바꿔 끼운다. */
    makePayslipPdf: (model) => makePayslipPdf(model),
  };

  app.persist = () => {
    if (!saveState(app.state, storage)) app.toast('저장하지 못했습니다: 브라우저 저장소를 쓸 수 없습니다');
  };
  /** 자료 바꾸기 → 저장 → 다시 그리기 */
  app.update = (fn, { render = true } = {}) => {
    fn(app.state);
    app.persist();
    if (render) app.render();
  };
  app.replaceState = (next) => {
    app.state = next;
    app.persist();
    app.fixWorker();
    app.render();
  };
  app.setUi = (patch) => {
    Object.assign(app.ui, patch);
    app.render();
  };
  app.route = () => app.ui.stack.at(-1) || null;
  app.push = (route) => {
    app.ui.stack.push(route);
    app.render(true);
  };
  app.replace = (route) => {
    app.ui.stack[app.ui.stack.length - 1] = route;
    app.render(true);
  };
  app.pop = () => {
    app.ui.stack.pop();
    app.render();
  };
  app.tab = (name) => {
    app.ui.tab = name;
    app.ui.stack = [];
    app.render(true);
  };
  app.fixWorker = () => {
    const ws = app.state.workers || [];
    if (!ws.find((w) => w.id === app.ui.workerId)) app.ui.workerId = ws[0]?.id || null;
  };
  app.openOverlay = (ov) => {
    app.ui.overlay = ov;
    app.render();
  };
  app.closeOverlay = () => {
    app.ui.overlay = null;
    app.render();
  };
  let toastTimer = null;
  app.toast = (msg) => {
    app.ui.toast = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { app.ui.toast = null; app.render(); }, 3200);
    app.render();
  };
  app.download = (data, fileName, mime) => {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };
  app.pickFile = (accept) => new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.addEventListener('change', () => resolve(input.files?.[0] || null), { once: true });
    input.click();
  });
  app.resetAll = () => {
    app.state = emptyState();
    app.persist();
    app.ui.workerId = null;
  };

  app.render = (resetScroll = false) => {
    const key = routeKey(app);
    const prevMain = root.querySelector('main.body');
    if (prevMain && app.lastKey) app.scroll.set(app.lastKey, prevMain.scrollTop);
    app.fixWorker();
    const route = app.route();
    const screen = route ? SCREENS[route.name](app, route) : tabScreen(app);
    const full = route && FULLSCREEN.has(route.name);
    root.replaceChildren(h('div', { class: full ? 'app full' : 'app' },
      screen,
      full ? null : bottomNav(app),
      renderOverlay(app),
      app.ui.toast ? h('div', { class: `toast${full ? ' toast-low' : ''}`, role: 'status' }, app.ui.toast) : null));
    const main = root.querySelector('main.body');
    if (main) main.scrollTop = resetScroll ? 0 : (app.scroll.get(key) || 0);
    app.lastKey = key;
  };
  return app;
}

function routeKey(app) {
  const r = app.route();
  return r ? `${app.ui.tab}/${r.name}` : app.ui.tab;
}

function tabScreen(app) {
  switch (app.ui.tab) {
    case 'att': return attendanceScreen(app);
    case 'settle': return settlementScreen(app);
    case 'settings': return settingsScreen(app);
    default: return homeScreen(app);
  }
}

function bottomNav(app) {
  return h('nav', { class: 'tabs', 'aria-label': '아래 탭' },
    TABS.map(([key, label, icOn, icOff], i) => h('button', {
      class: `tab${app.ui.tab === key ? ' on' : ''}`,
      'aria-label': `${label} Tab ${i + 1} of 4`,
      'aria-current': app.ui.tab === key ? 'page' : null,
      onclick: () => app.tab(key),
    }, h('span', { class: 'tab-ic' }, icon(app.ui.tab === key ? icOn : icOff, 24)), h('span', { class: 'tab-label' }, label))));
}

export function start() {
  const root = document.getElementById('app');
  const app = createApp(root);
  app.render();
  globalThis.__albaApp = app;
  return app;
}
