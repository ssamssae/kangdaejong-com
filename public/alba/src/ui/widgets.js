// 여러 화면이 함께 쓰는 조각: 윗막대·달 바꾸기·근무자 칩·빈 화면·스위치·분할 단추.

import { h, icon } from './dom.js';
import { monthTitle, shiftMonth, initial } from './view-model.js';

export function topbar({ title, back, right = [] }) {
  // 탭 첫 화면(뒤로 없음) = 왼쪽 큰 제목, 하위 화면 = 뒤로 + 가운데 제목
  return h('header', { class: back ? 'topbar' : 'topbar root' },
    h('div', { class: 'tb-left' }, back ? iconButton('back', '뒤로', back) : null),
    h('h1', { class: 'tb-title' }, title),
    h('div', { class: 'tb-right' }, right));
}

export function iconButton(name, label, onclick, cls = '') {
  return h('button', { class: `icon-btn ${cls}`.trim(), 'aria-label': label, title: label, onclick }, icon(name, 26));
}

export function textButton(label, onclick, { disabled = false, cls = '' } = {}) {
  return h('button', { class: `text-btn ${cls}`.trim(), disabled, onclick }, label);
}

export function monthSwitcher(app) {
  const { y, m } = app.ui.month;
  const go = (n) => app.setUi({ month: shiftMonth(app.ui.month, n) });
  return h('div', { class: 'month' },
    iconButton('left', '이전 달', () => go(-1)),
    h('div', { class: 'month-title' }, monthTitle(y, m)),
    iconButton('right', '다음 달', () => go(1)));
}

export function avatar(name, cls = '') {
  return h('span', { class: `avatar ${cls}`.trim(), 'aria-hidden': 'true' }, initial(name));
}

export function workerChips(app, { onAdd }) {
  const ws = app.state.workers || [];
  return h('div', { class: 'chips worker-chips', role: 'tablist' },
    ws.map((w) => h('button', {
      class: `wchip${app.ui.workerId === w.id ? ' on' : ''}`,
      role: 'tab',
      'aria-selected': app.ui.workerId === w.id ? 'true' : 'false',
      onclick: () => app.setUi({ workerId: w.id }),
    }, avatar(w.name), h('span', { class: 'wchip-name' }, w.name))),
    h('button', { class: 'wchip add', onclick: onAdd }, icon('plus', 22), h('span', null, '추가')));
}

export function emptyWorkers(app) {
  return h('div', { class: 'empty' },
    icon('people', 64, 'empty-ic'),
    h('div', { class: 'empty-title' }, '등록된 근무자가 없습니다'),
    h('div', { class: 'empty-sub' }, '근무자를 추가하고 근로계약을 설정하면 달력과 정산이 채워집니다.'),
    h('button', { class: 'pill-btn primary', onclick: () => app.push({ name: 'workerForm', workerId: null }) },
      icon('personAdd', 22), '근무자 추가'));
}

/**
 * 투명 날짜·시간 입력을 누르면 선택 창을 직접 연다(onclick 에 단다).
 * PC 크로미움은 글자 칸(연·월·일·시·분)을 눌러도 창이 안 열리고 오른쪽 끝 아이콘만 여는데,
 * 입력이 투명이라 아이콘이 안 보인다. 휴대폰은 원래 열리고, 이미 열려 있으면 브라우저가 무시한다.
 */
export function openPicker(e) {
  try {
    e.currentTarget?.showPicker?.();
  } catch {
    // showPicker 를 막는 환경(사용자 동작 아님·옛 브라우저)에서는 브라우저 기본 동작에 맡긴다
  }
}

export function toggleSwitch(on, onchange, label) {
  return h('button', {
    class: `switch${on ? ' on' : ''}`, role: 'switch', 'aria-checked': on ? 'true' : 'false', 'aria-label': label,
    onclick: (e) => { e.stopPropagation(); onchange(!on); },
  }, h('span', { class: 'knob' }));
}

/** 분할 단추(회색 띠 안에서 고른 칸 = 흰 알약) */
export function segmented(options, value, onpick, cls = '') {
  return h('div', { class: `seg ${cls}`.trim(), role: 'radiogroup' },
    options.map(([v, label]) => h('button', {
      class: `seg-btn${v === value ? ' on' : ''}`, role: 'radio', 'aria-checked': v === value ? 'true' : 'false',
      onclick: () => { if (v !== value) onpick(v); },
    }, label)));
}

/** 화면 맨 아래 폭 가득 주 단추 자리 */
export function bottomCta(...children) {
  return h('div', { class: 'bottom-cta' }, children);
}

/** 넓은 화면에서 두 단으로 나눠 채우는 묶음(휴대폰 폭에서는 그냥 한 줄로 쌓임) */
export function cols(...children) {
  return h('div', { class: 'cols' }, children);
}

export function card(...children) {
  return h('section', { class: 'card' }, children);
}

export function sectionLabel(text) {
  return h('div', { class: 'section-label' }, text);
}

export function listItem({ iconName, avatarName, title, sub, onclick, danger = false, chevron = true }) {
  return h('button', { class: `list-item${danger ? ' danger' : ''}`, onclick },
    avatarName ? avatar(avatarName, 'lg') : iconName ? h('span', { class: 'li-ic' }, icon(iconName, 26)) : null,
    h('span', { class: 'li-text' }, h('span', { class: 'li-title' }, title), sub ? h('span', { class: 'li-sub' }, sub) : null),
    chevron ? h('span', { class: 'li-chev' }, icon('right', 26)) : null);
}
