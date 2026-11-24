// 브라우저 저장(localStorage). 읽기·쓰기 모두 try/catch — 저장이 막힌 환경에서도 화면은 돈다.

import { normStoreSettings } from './backup.js';

export const STORAGE_KEY = 'alba_pay.web.v1';

export function emptyState() {
  return {
    storeSettings: normStoreSettings({}),
    workers: [],
    holidayOverrides: [],
  };
}

export function loadState(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const s = JSON.parse(raw);
    return {
      ...emptyState(),
      ...s,
      storeSettings: normStoreSettings(s.storeSettings || {}),
      workers: Array.isArray(s.workers) ? s.workers : [],
      holidayOverrides: Array.isArray(s.holidayOverrides) ? s.holidayOverrides : [],
    };
  } catch {
    return emptyState();
  }
}

/** → true(저장됨) / false(저장 못 함) */
export function saveState(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function newWorkerId() {
  return `w${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** 오늘 기준 재직 중인 근무자 수(퇴사일이 오늘보다 앞서면 제외) */
export function activeWorkerCount(state, today) {
  return (state.workers || []).filter((w) => !w.endDate || w.endDate >= today).length;
}
// 대종님 2026-11-24 지시: 웹판은 요금제 없음 — 재직 근무자 수 한도(앱 무료판 2명)를 두지 않는다.
