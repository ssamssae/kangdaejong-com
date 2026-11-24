// 설정 탭과 그 아래 화면(휴일·매장 휴무, 엑셀 내보내기, 사용 안내, 참고자료, 개인정보처리방침)

import { h, icon } from '../dom.js';
import {
  topbar, card, sectionLabel, listItem, segmented, monthSwitcher, bottomCta,
} from '../widgets.js';
import {
  settingsWorkerSub, holidayItems, toggleHoliday, exportView,
} from '../view-model.js';
import {
  DISCLAIMER, VERSION_LINE, SIZE_DESC, HOLIDAY_INFO, PAYDAY_DESC, GUIDE, REFERENCE,
  PRIVACY, PRIVACY_TITLE, PRIVACY_DATE, PRIVACY_URL, EXPORT_BULLETS,
} from '../texts.js';
import { toBackup, serializeBackup, backupFileName, parseBackup, BackupError } from '../../data/backup.js';
import { seedSample, SAMPLE_DONE_MESSAGE } from '../../data/sample.js';
import { exportPayrollXlsx } from '../../xlsx/payroll-workbook.js';

const back = (app) => () => app.pop();

export function settingsScreen(app) {
  const st = app.state;
  const size = st.storeSettings.businessSize;
  const setSize = (v) => app.update((s) => { s.storeSettings.businessSize = v; });
  return h('div', { class: 'screen' }, topbar({ title: '설정' }), h('main', { class: 'body' },
    sectionLabel('사업장'),
    card(
      h('div', { class: 'field-label' }, '상시 근로자 수'),
      segmented([['under5', '5인 미만'], ['over5', '5인 이상']], size, setSize, 'size-seg'),
      h('p', { class: 'desc' }, SIZE_DESC[size]),
      h('div', { class: 'hr' }),
      h('label', { class: 'text-field' },
        h('input', {
          type: 'text', placeholder: '매장 이름 (선택)', value: st.storeSettings.storeName || '', 'aria-label': '매장 이름 (선택)',
          oninput: (e) => { st.storeSettings.storeName = e.target.value; app.persist(); },
        }),
        h('span', { class: 'helper focus-helper' }, '엑셀 제목과 파일 이름에 붙습니다')),
      h('div', { class: 'payday-row' },
        h('span', { class: 'row-title' }, '급여 지급일'),
        h('button', { class: 'dropdown', onclick: () => app.openOverlay({ type: 'payday' }) },
          `매월 ${st.storeSettings.payDay}일`, icon('drop', 24))),
      h('p', { class: 'desc' }, PAYDAY_DESC)),
    // 대종님 2026-11-24 지시: 웹판은 요금제 없음(앱의 「요금제」 구역을 뺌)
    sectionLabel('근무자 · 근로계약'),
    h('section', { class: 'card list' },
      (st.workers || []).map((w) => listItem({ avatarName: w.name, title: w.name, sub: settingsWorkerSub(w), onclick: () => app.push({ name: 'contract', workerId: w.id }) })),
      h('div', { class: 'hr' }),
      listItem({ iconName: 'personAdd', title: '근무자 추가', sub: '이름·근로 시작일·계좌를 넣고 이어서 근로계약을 설정', chevron: false, onclick: () => app.push({ name: 'workerForm', workerId: null }) })),
    sectionLabel('급여 · 휴일'),
    h('section', { class: 'card list' },
      listItem({ title: '휴일 · 매장 휴무 설정', sub: '공휴일마다 영업/휴무를 정하면 주휴수당에 자동 반영', onclick: () => app.push({ name: 'holidays' }) }),
      listItem({ title: '엑셀 내보내기', sub: '요약 + 근무자별 시트, A4 가로 1장', onclick: () => app.push({ name: 'export' }) })),
    sectionLabel('데이터 · 이 휴대폰에만 저장'),
    h('section', { class: 'card list' },
      listItem({ iconName: 'upload', title: '백업 파일 만들기', sub: '근무자·계약·근태·휴일·매장 설정을 JSON 파일 1개로. 공유하거나 폴더에 저장', chevron: false, onclick: () => makeBackup(app) }),
      listItem({ iconName: 'restore', title: '백업 불러오기', sub: '새 휴대폰에 그대로 복원(덮어쓰기) 또는 지금 데이터와 합치기', chevron: false, onclick: () => pickBackup(app) }),
      listItem({ iconName: 'flask', title: '샘플 데이터 넣기', sub: '체험용 근무자 2명과 근태. 이미 있으면 건너뜀', chevron: false, onclick: () => insertSample(app) }),
      listItem({ iconName: 'trashX', title: '모든 데이터 삭제', sub: '근무자·계약·근태·설정 전부. 되돌릴 수 없음', chevron: false, danger: true, onclick: () => app.openOverlay({ type: 'deleteAll' }) })),
    sectionLabel('도움말'),
    h('section', { class: 'card list' },
      listItem({ title: '사용 안내', sub: '근무자 등록부터 엑셀·백업까지 6단계', onclick: () => app.push({ name: 'guide' }) }),
      listItem({ title: '참고자료 · 휴일과 주휴수당', sub: '법정 휴일, 2026년 바뀐 점, 2027년 공휴일, 휴게·세금', onclick: () => app.push({ name: 'reference' }) }),
      listItem({ title: '개인정보처리방침', sub: '수집 정보 없음 · 모든 데이터는 이 기기 안에만', onclick: () => app.push({ name: 'privacy' }) })),
    h('div', { class: 'foot-note' }, DISCLAIMER),
    h('div', { class: 'foot-note small' }, VERSION_LINE)));
}

function makeBackup(app) {
  try {
    const now = new Date();
    app.download(serializeBackup(toBackup(app.state, now)), backupFileName(now), 'application/json');
    app.toast('저장했습니다');
  } catch (e) {
    app.toast(`백업 파일을 내보내지 못했습니다: ${e.message}`);
  }
}

async function pickBackup(app) {
  const file = await app.pickFile('.json,application/json');
  if (!file) return;
  let text;
  try {
    text = await file.text();
  } catch (e) {
    app.toast(`파일을 열지 못했습니다: ${e.message}`);
    return;
  }
  try {
    const backup = parseBackup(text);
    app.openOverlay({ type: 'restore', backup });
  } catch (e) {
    app.toast(e instanceof BackupError ? e.message : `백업 파일을 읽지 못했습니다: ${e.message}`);
  }
}

function insertSample(app) {
  const { state, added } = seedSample(app.state);
  if (!added) return;
  app.replaceState(state);
  app.toast(SAMPLE_DONE_MESSAGE);
}

// ── 휴일 · 매장 휴무 ─────────────────────────────────────
export function holidaysScreen(app) {
  const st = app.state;
  const size = st.storeSettings.businessSize;
  const items = holidayItems(st, app.today);
  return h('div', { class: 'screen' }, topbar({ title: '휴일 · 매장 휴무', back: back(app) }), h('main', { class: 'body' },
    segmented([['under5', '사업장 5인 미만'], ['over5', '5인 이상']], size, (v) => app.update((s) => { s.storeSettings.businessSize = v; }), 'size-seg wide'),
    h('div', { class: 'notice-box blue-line' }, HOLIDAY_INFO[size]),
    h('div', { class: 'section-label' }, '다가오는 휴일 · 출처: 우주항공청 월력요항'),
    h('section', { class: 'card list holidays' }, items.map((it) => h('div', { class: 'hol' },
      h('div', { class: 'hol-date' }, h('span', null, it.md), h('span', { class: it.isSun ? 'sun' : '' }, it.wd)),
      h('div', { class: 'hol-text' }, h('div', { class: 'hol-name' }, it.name), h('div', { class: `hol-desc t-${it.tone}` }, it.desc)),
      it.control.type === 'tag'
        ? h('span', { class: 'tag' }, it.control.text)
        : h('button', {
          class: `hol-toggle${it.control.open ? '' : ' on'}`,
          onclick: () => app.update((s) => { s.holidayOverrides = toggleHoliday(s.holidayOverrides, it.holiday); }),
        }, it.control.open ? '영업' : '매장 휴무'))))));
}

// ── 엑셀 내보내기 ─────────────────────────────────────────
export function exportScreen(app, route) {
  const { y, m } = app.ui.month;
  const v = exportView(app.state, y, m);
  const make = () => {
    if (!v.count) return;
    route.busy = true;
    app.render();
    setTimeout(() => {
      try {
        const { bytes, fileName } = exportPayrollXlsx(app.state, y, m, new Date());
        app.download(bytes, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        route.busy = false;
        app.toast('저장했습니다');
      } catch (e) {
        route.busy = false;
        app.toast(`파일을 만들지 못했습니다: ${e.message}`);
      }
    }, 30);
  };
  return h('div', { class: 'screen' }, topbar({ title: '엑셀 내보내기', back: back(app) }), h('main', { class: 'body' },
    monthSwitcher(app),
    v.count ? [
      h('section', { class: 'card' },
        h('div', { class: 'field-label' }, '만들어질 파일'),
        h('div', { class: 'file-name' }, v.fileName),
        h('div', { class: 'd-sub' }, v.sheets),
        h('div', { class: 'hr' }),
        v.rows.map((r) => h('div', { class: 'exp-row' }, h('span', null, r.name), h('span', null, r.text))),
        h('div', { class: 'exp-row total' }, h('span', null, v.total.name), h('span', null, v.total.text))),
      h('section', { class: 'card' }, EXPORT_BULLETS.map((b) => h('p', { class: 'desc' }, b))),
    ] : h('div', { class: 'notice-box gray' }, '근무자가 없습니다')),
    v.count ? bottomCta(h('button', { class: 'pill-btn primary block', disabled: route.busy, onclick: make }, icon('download', 22), route.busy ? '만드는 중…' : '엑셀 파일 만들기')) : null);
}

// ── 도움말 ────────────────────────────────────────────────
export function guideScreen(app) {
  return h('div', { class: 'screen' }, topbar({ title: '사용 안내', back: back(app) }), h('main', { class: 'body' },
    GUIDE.map(([title, body], i) => h('section', { class: 'card step' },
      h('span', { class: 'step-no' }, String(i + 1)),
      h('div', null, h('div', { class: 'step-title' }, title), h('p', { class: 'desc' }, body))))));
}

export function referenceScreen(app) {
  return h('div', { class: 'screen' }, topbar({ title: '참고자료', back: back(app) }), h('main', { class: 'body' },
    REFERENCE.map(([title, lines]) => h('section', { class: 'card ref' },
      h('h2', null, title), lines.map((l) => h('p', null, l))))));
}

export function privacyScreen(app) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PRIVACY_URL);
      app.toast('주소를 복사했습니다');
    } catch {
      app.toast(PRIVACY_URL);
    }
  };
  return h('div', { class: 'screen' }, topbar({ title: '개인정보처리방침', back: back(app) }), h('main', { class: 'body' },
    h('section', { class: 'card ref' },
      h('h2', null, PRIVACY_TITLE), h('p', { class: 'muted' }, PRIVACY_DATE)),
    PRIVACY.map(([title, body]) => h('section', { class: 'card ref' }, h('h2', null, title), h('p', null, body))),
    h('section', { class: 'card ref url-card' }, h('span', { class: 'url' }, PRIVACY_URL),
      h('button', { class: 'pill-btn', onclick: copy }, '주소 복사'))));
}
