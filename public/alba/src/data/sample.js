// 「샘플 데이터 넣기」 = 앱 샘플과 같은 자료(정답지 backup-sample.json 의 근무자·근태·휴일 설정).

export const SAMPLE_WORKERS = [
  {
    id: 'kim',
    name: '김민지',
    startDate: '2026-03-02',
    endDate: null,
    bank: '카카오뱅크',
    accountNumber: '3333-01-2345678',
    accountHolder: null,
    healthCheckDate: null,
    contracts: [
      {
        effectiveFrom: '2026-03-02',
        workdays: [1, 2, 3, 4, 5],
        start: '08:00',
        end: '15:00',
        breakStart: '13:00',
        breakEnd: '13:30',
        hourlyWage: 10320,
        breakPaid: false,
        restWeekday: 7,
        boundaryPolicy: 'deferToNextMonth',
        taxWithholding: true,
      },
    ],
    records: [
      { date: '2026-11-04', type: 'late', minutes: 30, note: '' },
      { date: '2026-11-13', type: 'earlyLeave', minutes: 60, note: '' },
      { date: '2026-11-19', type: 'absent', minutes: 0, note: '' },
      { date: '2026-11-21', type: 'extraWork', minutes: 240, note: '토요일 대타' },
      { date: '2026-11-25', type: 'extraWork', minutes: 60, note: '마감 연장' },
    ],
  },
  {
    id: 'lee',
    name: '이준호',
    startDate: '2026-09-01',
    endDate: null,
    bank: '국민은행',
    accountNumber: '123456-01-234567',
    accountHolder: null,
    healthCheckDate: null,
    contracts: [
      {
        effectiveFrom: '2026-09-01',
        workdays: [2, 3, 4, 5, 6],
        start: '15:00',
        end: '21:00',
        breakStart: '18:00',
        breakEnd: '18:30',
        hourlyWage: 10320,
        breakPaid: true,
        restWeekday: 7,
        boundaryPolicy: 'deferToNextMonth',
        taxWithholding: true,
      },
    ],
    records: [{ date: '2026-11-12', type: 'late', minutes: 15, note: '' }],
  },
];

export const SAMPLE_HOLIDAY_OVERRIDES = [
  { date: '2027-02-08', name: '설 연휴', kind: 'publicHoliday', storeOpen: false },
  { date: '2026-12-31', name: '연말 정리', kind: 'storeDesignated', storeOpen: false },
];

export const SAMPLE_DONE_MESSAGE = '샘플 근무자 2명(김민지·이준호)과 2026년 11월 근태를 넣었습니다';

/** 샘플 넣기. 이미 있으면(같은 id) 건너뜀. → { state, added } */
export function seedSample(state) {
  const workers = [...(state.workers || [])];
  let added = 0;
  for (const w of SAMPLE_WORKERS) {
    if (workers.some((x) => x.id === w.id)) continue;
    workers.push(structuredClone(w));
    added += 1;
  }
  const overrides = [...(state.holidayOverrides || [])];
  for (const o of SAMPLE_HOLIDAY_OVERRIDES) {
    if (!overrides.some((x) => x.date === o.date)) overrides.push({ ...o });
  }
  return { state: { ...state, workers, holidayOverrides: overrides }, added };
}
