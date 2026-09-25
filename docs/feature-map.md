# 기능 확인 경로

## 오늘 뭐 먹지? 메뉴 추첨기

- 사전 조건: 로그인 불필요, JavaScript 사용. 저장소 차단 시에도 현재 페이지에서 사용 가능.
- 진입점: https://kangdaejong.com/#menu-picker — 대표 프로젝트 아래.
- 조작: `오늘 먹은 메뉴 제외하기` → `쌀국수` 체크 → `메뉴 뽑기` → `이 메뉴 먹었어요`. `제외 목록 초기화`로 다시 전체 후보 사용.
- 기대 결과: 체크한 메뉴 제외, 후보가 둘 이상이면 직전 결과 반복 방지. 한 개만 남으면 해당 메뉴 추첨. 모두 제외하면 안내와 비활성 추첨 버튼 표시. 저장된 제외 목록은 브라우저의 현지 날짜가 바뀌면 해제. 개인 목록을 서버에 전송하지 않음.
- 검증: `npm run build`, `npx playwright test tests/menu-picker.spec.mjs --workers=1`, 공유 header/footer 필수 검사.
- 실측: 2026-09-25 KST, T-260925-039. 로컬 Chrome 회귀 검사 5건 통과. 제외·재추첨·새로고침 유지·지난 날짜 초기화·후보 소진·저장소 차단·키보드·390/1440px 화면 확인. 변경 전에는 해당 UI 부재로 제외/추첨 검사가 실패함.
- 근거: `tests/menu-picker.spec.mjs`, Playwright의 테스트별 스크린샷. 작업 로그는 볼칸 `/Users/user/reports/T-260925-039/`.
- 배포 후 동일 검사는 `MENU_TEST_URL=https://kangdaejong.com/ npx playwright test tests/menu-picker.spec.mjs --workers=1`로 실행. 이 명령은 로컬 preview도 잠깐 실행하지만 검사 대상 URL은 공개 홈페이지다.
- 미확인: Safari·Firefox 및 사용자 개인 브라우저의 저장 상태. 공개 방문자에게 특정 메뉴를 미리 제외하지 않음.
