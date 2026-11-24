// 앱에 든 공휴일 자료(assets/holidays/2026.json·2027.json)와 같은 내용.
// 출처: 우주항공청 월력요항 + 관공서의 공휴일에 관한 규정 개정(2026-04-30) + 공직선거법 선거일.

export const HOLIDAY_SOURCES = {
  2026: '우주항공청 2026년 월력요항(2025-06-30) + 관공서의 공휴일에 관한 규정 개정(2026-04-30, 노동절·제헌절 추가) + 공직선거법 선거일',
  2027: '우주항공청 2027년 월력요항(2026-06-29 발표), 한국천문연구원 달력자료',
};

export const BUILTIN_HOLIDAYS = [
  { date: '2026-01-01', name: '1월 1일', kind: 'publicHoliday' },
  { date: '2026-02-16', name: '설 연휴', kind: 'publicHoliday' },
  { date: '2026-02-17', name: '설날', kind: 'publicHoliday' },
  { date: '2026-02-18', name: '설 연휴', kind: 'publicHoliday' },
  { date: '2026-03-01', name: '3·1절', kind: 'publicHoliday' },
  { date: '2026-03-02', name: '대체공휴일 (3·1절)', kind: 'substituteHoliday' },
  { date: '2026-05-01', name: '노동절', kind: 'laborDay' },
  { date: '2026-05-05', name: '어린이날', kind: 'publicHoliday' },
  { date: '2026-05-24', name: '부처님오신날', kind: 'publicHoliday' },
  { date: '2026-05-25', name: '대체공휴일 (부처님오신날)', kind: 'substituteHoliday' },
  { date: '2026-06-03', name: '제9회 전국동시지방선거', kind: 'electionDay' },
  { date: '2026-06-06', name: '현충일', kind: 'publicHoliday' },
  { date: '2026-07-17', name: '제헌절', kind: 'publicHoliday' },
  { date: '2026-08-15', name: '광복절', kind: 'publicHoliday' },
  { date: '2026-08-17', name: '대체공휴일 (광복절)', kind: 'substituteHoliday' },
  { date: '2026-09-24', name: '추석 연휴', kind: 'publicHoliday' },
  { date: '2026-09-25', name: '추석', kind: 'publicHoliday' },
  { date: '2026-09-26', name: '추석 연휴', kind: 'publicHoliday' },
  { date: '2026-10-03', name: '개천절', kind: 'publicHoliday' },
  { date: '2026-10-05', name: '대체공휴일 (개천절)', kind: 'substituteHoliday' },
  { date: '2026-10-09', name: '한글날', kind: 'publicHoliday' },
  { date: '2026-12-25', name: '기독탄신일', kind: 'publicHoliday' },
  { date: '2027-01-01', name: '1월 1일', kind: 'publicHoliday' },
  { date: '2027-02-06', name: '설 연휴', kind: 'publicHoliday' },
  { date: '2027-02-07', name: '설날', kind: 'publicHoliday' },
  { date: '2027-02-08', name: '설 연휴', kind: 'publicHoliday' },
  { date: '2027-02-09', name: '대체공휴일 (설날)', kind: 'substituteHoliday' },
  { date: '2027-03-01', name: '3·1절', kind: 'publicHoliday' },
  { date: '2027-05-01', name: '노동절', kind: 'laborDay' },
  { date: '2027-05-03', name: '대체공휴일 (노동절)', kind: 'substituteHoliday' },
  { date: '2027-05-05', name: '어린이날', kind: 'publicHoliday' },
  { date: '2027-05-13', name: '부처님오신날', kind: 'publicHoliday' },
  { date: '2027-06-06', name: '현충일', kind: 'publicHoliday' },
  { date: '2027-07-17', name: '제헌절', kind: 'publicHoliday' },
  { date: '2027-07-19', name: '대체공휴일 (제헌절)', kind: 'substituteHoliday' },
  { date: '2027-08-15', name: '광복절', kind: 'publicHoliday' },
  { date: '2027-08-16', name: '대체공휴일 (광복절)', kind: 'substituteHoliday' },
  { date: '2027-09-14', name: '추석 연휴', kind: 'publicHoliday' },
  { date: '2027-09-15', name: '추석', kind: 'publicHoliday' },
  { date: '2027-09-16', name: '추석 연휴', kind: 'publicHoliday' },
  { date: '2027-10-03', name: '개천절', kind: 'publicHoliday' },
  { date: '2027-10-04', name: '대체공휴일 (개천절)', kind: 'substituteHoliday' },
  { date: '2027-10-09', name: '한글날', kind: 'publicHoliday' },
  { date: '2027-10-11', name: '대체공휴일 (한글날)', kind: 'substituteHoliday' },
  { date: '2027-12-25', name: '기독탄신일', kind: 'publicHoliday' },
  { date: '2027-12-27', name: '대체공휴일 (기독탄신일)', kind: 'substituteHoliday' },
];

const BUILTIN_BY_DATE = new Map(BUILTIN_HOLIDAYS.map((h) => [h.date, h]));

/** 공휴일 종류(매장 지정 휴무 제외) */
export const STATUTORY_KINDS = new Set(['publicHoliday', 'substituteHoliday', 'laborDay', 'electionDay']);

/**
 * 날짜별 휴일 정보 = 내장 자료 + 사업장 설정(holidayOverrides).
 * 설정이 있으면 이름·종류·영업 여부를 설정 쪽으로 본다. 내장 공휴일 기본값은 영업(storeOpen=true).
 */
export function makeHolidayResolver(overrides = []) {
  const ov = new Map((overrides || []).map((o) => [o.date, o]));
  return function resolve(date) {
    const o = ov.get(date);
    const b = BUILTIN_BY_DATE.get(date);
    if (o) {
      return {
        date,
        name: o.name ?? b?.name ?? '',
        kind: o.kind ?? b?.kind ?? 'storeDesignated',
        storeOpen: o.storeOpen !== false,
        builtin: Boolean(b),
        overridden: true,
      };
    }
    if (b) return { ...b, storeOpen: true, builtin: true, overridden: false };
    return null;
  };
}

/** from~to(포함) 사이의 휴일 목록(내장 + 매장 지정), 날짜순 */
export function listHolidays(overrides, from, to) {
  const resolve = makeHolidayResolver(overrides);
  const dates = new Set(BUILTIN_HOLIDAYS.map((h) => h.date));
  for (const o of overrides || []) dates.add(o.date);
  return [...dates]
    .filter((d) => d >= from && d <= to)
    .sort()
    .map((d) => resolve(d));
}
