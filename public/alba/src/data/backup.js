// 백업 파일 형식(앱 「백업 파일 만들기」와 같은 JSON). 앱 백업 ↔ 웹 백업 서로 읽을 수 있다.

import { pad2 } from '../engine/dates.js';
import { RECORD_TYPES } from '../engine/payroll.js';

export const BACKUP_APP = 'alba_pay';
export const SCHEMA_VERSION = 1;
export const APP_VERSION = '1.0.0+4';

export class BackupError extends Error {}

/** Dart DateTime.toIso8601String() 과 같은 꼴(현지 시각, 시간대 표시 없음) */
export function localIso(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}

export function backupFileName(d = new Date()) {
  return `알바급여_백업_${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}_${pad2(d.getHours())}${pad2(d.getMinutes())}.json`;
}

function normContract(c) {
  return {
    effectiveFrom: c.effectiveFrom ?? null,
    workdays: [...(c.workdays || [])].map(Number).sort((a, b) => a - b),
    start: c.start,
    end: c.end,
    breakStart: c.breakStart ?? null,
    breakEnd: c.breakEnd ?? null,
    hourlyWage: Number(c.hourlyWage) || 0,
    breakPaid: Boolean(c.breakPaid),
    restWeekday: Number(c.restWeekday) || 7,
    boundaryPolicy: c.boundaryPolicy === 'payInCurrentMonth' ? 'payInCurrentMonth' : 'deferToNextMonth',
    taxWithholding: c.taxWithholding !== false,
  };
}

function normRecord(r) {
  return { date: r.date, type: r.type, minutes: Number(r.minutes) || 0, note: r.note ?? '' };
}

function normWorker(w) {
  return {
    id: String(w.id),
    name: w.name ?? '',
    startDate: w.startDate ?? null,
    endDate: w.endDate ?? null,
    bank: w.bank ?? null,
    accountNumber: w.accountNumber ?? null,
    accountHolder: w.accountHolder ?? null,
    healthCheckDate: w.healthCheckDate ?? null,
    contracts: (w.contracts || []).map(normContract),
    records: (w.records || []).filter((r) => r && r.date && RECORD_TYPES.includes(r.type)).map(normRecord)
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function normOverride(o) {
  return { date: o.date, name: o.name ?? '', kind: o.kind ?? 'storeDesignated', storeOpen: o.storeOpen !== false };
}

export function normStoreSettings(s = {}) {
  return {
    businessSize: s.businessSize === 'over5' ? 'over5' : 'under5',
    storeName: s.storeName ?? '',
    payDay: Number(s.payDay) || 10,
    ownerHealthCheckDate: s.ownerHealthCheckDate ?? null,
  };
}

/** 앱 상태 → 백업 객체(키 순서까지 앱과 같게) */
export function toBackup(state, now = new Date()) {
  return {
    app: BACKUP_APP,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: localIso(now),
    appVersion: APP_VERSION,
    storeSettings: normStoreSettings(state.storeSettings),
    workers: (state.workers || []).map(normWorker),
    holidayOverrides: (state.holidayOverrides || []).map(normOverride),
  };
}

export function serializeBackup(backup) {
  return JSON.stringify(backup, null, 2);
}

/** 백업 글자 → 검사된 백업 객체. 문제가 있으면 BackupError(앱과 같은 문구). */
export function parseBackup(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new BackupError('JSON 형식이 아닙니다. 알바 급여 계산기에서 만든 백업 파일(.json)을 고르세요');
  }
  if (!obj || typeof obj !== 'object' || obj.app !== BACKUP_APP) {
    throw new BackupError('알바 급여 계산기 백업 파일이 아닙니다');
  }
  const v = Number(obj.schemaVersion);
  if (v > SCHEMA_VERSION) {
    throw new BackupError(`더 새로운 버전의 앱에서 만든 백업입니다 (형식 v${v}). 앱을 업데이트한 뒤 불러오세요`);
  }
  try {
    return {
      app: BACKUP_APP,
      schemaVersion: v || SCHEMA_VERSION,
      exportedAt: obj.exportedAt ?? null,
      appVersion: obj.appVersion ?? '',
      storeSettings: normStoreSettings(obj.storeSettings || {}),
      workers: (obj.workers || []).map(normWorker),
      holidayOverrides: (obj.holidayOverrides || []).filter((o) => o && o.date).map(normOverride),
    };
  } catch (e) {
    throw new BackupError(`백업 파일을 읽는 중 오류: ${e.message}`);
  }
}

/** 불러오기 창 요약 */
export function summarize(backup) {
  const d = backup.exportedAt ? backup.exportedAt.slice(0, 10).replaceAll('-', '.') : '';
  return {
    created: d,
    appVersion: backup.appVersion,
    workerCount: backup.workers.length,
    workerNames: backup.workers.map((w) => w.name),
    recordCount: backup.workers.reduce((a, w) => a + w.records.length, 0),
    holidayCount: backup.holidayOverrides.length,
  };
}

/** 덮어쓰기: 지금 데이터를 모두 지우고 파일 내용으로 바꾼다 */
export function restoreOverwrite(state, backup) {
  return {
    ...state,
    storeSettings: { ...backup.storeSettings },
    workers: backup.workers.map((w) => structuredClone(w)),
    holidayOverrides: backup.holidayOverrides.map((o) => ({ ...o })),
  };
}

/** 합치기: 같은 근무자·같은 날짜는 파일 쪽으로 바꾸고, 나머지는 그대로. 매장 설정은 유지. */
export function restoreMerge(state, backup) {
  const workers = (state.workers || []).map((w) => structuredClone(w));
  for (const fw of backup.workers) {
    let target = workers.find((w) => w.id === fw.id) || workers.find((w) => w.name && w.name === fw.name);
    if (!target) {
      workers.push(structuredClone(fw));
      continue;
    }
    const keep = new Map((target.records || []).map((r) => [r.date, r]));
    for (const r of fw.records) keep.set(r.date, { ...r });
    const contracts = new Map((target.contracts || []).map((c) => [c.effectiveFrom, c]));
    for (const c of fw.contracts) contracts.set(c.effectiveFrom, { ...c });
    Object.assign(target, {
      name: fw.name, startDate: fw.startDate, endDate: fw.endDate, bank: fw.bank,
      accountNumber: fw.accountNumber, accountHolder: fw.accountHolder, healthCheckDate: fw.healthCheckDate,
      contracts: [...contracts.values()].sort((a, b) => String(a.effectiveFrom).localeCompare(String(b.effectiveFrom))),
      records: [...keep.values()].sort((a, b) => a.date.localeCompare(b.date)),
    });
  }
  const ov = new Map((state.holidayOverrides || []).map((o) => [o.date, o]));
  for (const o of backup.holidayOverrides) ov.set(o.date, { ...o });
  return {
    ...state,
    workers,
    holidayOverrides: [...ov.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}
