# 기능 확인 경로

## 사이트 변경 누락 방지 — T-261013-046

- 진입: 회사홈과 작업장 제품 카드, 복붙 정리기, 대표소개, 단백질, 제품 설명서, 종료 안내, 초소 방문객. 대상은 `public/brand/sites.json`, 독립 발견 기록은 `docs/site-discovery.json`.
- 조작: 아이콘 정본 변경 → 두 사이트의 같은 제품 ID 카드 확인. 새 제품/사이트 등록 없이 빌드하면 실패한다. `npm run deploy:site` 또는 작업장 기존 자동 배포 후 공개 검사가 실행된다.
- 기대: 390/1440px × light/dark에서 동일 아이콘, 가로 넘침 없음, 다크 흰 카드 없음. 제품 검색은 유지한다. 실패·미확인은 전체 완료로 계산하지 않는다.
- 근거: `tests/test_site_release.sh`, PR 필수 `site-release-contract`, `site-release-report/*/report.json` 및 PNG. 웹 배포와 Telegram 미리보기 상태는 분리한다. [실행 절차](site-release.md).

## 복붙 정리기 — T-261013-025

- 진입점: 홈페이지 `/#projects` → 「만드는 도구」 마지막 「복붙 정리기」 카드 → 「글 정리하기」 → `https://kangdaejong.com/tools/text/`. PC·휴대전화 브라우저에서 로그인·설치 없이 사용한다. 도구 하단 「홈페이지」는 `/#projects`로 돌아간다.
- 헤더 보완(T-261013-031): 상단의 정식 스튜디오 로고(`/brand/current/logo.svg`)와 「홈페이지」 링크는 모두 `/`로 이동한다. 로고 아래에 도구 이름을 표시한다. 320/390/1440px에서 로고 실제 로드·상단 링크 가시성·클릭 이동을 `text-cleaner.spec.mjs`로 검사한다. 로고 이미지만 같은 출처에서 읽도록 CSP `img-src`에 self를 허용하며, 글 처리 API는 없고 `connect-src`는 none을 유지한다.
- 조작: 「원문」에 글 붙여넣기 → 「정리하기」 → 줄바꿈 유지·끊긴 줄 연결·한 줄로 중 선택 → 「결과 복사」. 원문은 보존한다. 원문을 수정하면 이전 결과와 복사 버튼을 무효화한다. 「비우기」는 한 번 되돌릴 수 있고, 예시는 기존 글을 덮지 않는다.
- 처리: `public/tools/text/index.html`의 독립 HTML에 정리·복사 스크립트가 들어 있다. 입력 글을 서버로 전송하거나 저장하지 않는다. CSP `connect-src 'none'`으로 연결을 차단한다. 복사가 거절되면 결과를 선택하고 수동 복사를 안내한다. canonical에서 사이트맵을 자동 생성한다. 홈페이지 카드의 EN 문구는 기존 사전에 포함한다.
- 공통 톤(T-261013-042): `/brand/current/tokens.css`의 색·폭과 `/studio-page.css`의 글꼴·제목 규칙을 직접 읽는다. 도구 배치는 `public/tools/text/style.css`에 있다. 시스템 라이트·다크 전환 때 입력·결과를 유지하며 홈페이지와 같은 색으로 바뀐다. Pretendard 1.3.9 전체 가변 글꼴은 같은 출처의 `tools/text/fonts/`에서 읽는다(SIL OFL 동봉). 입력 문자에 따른 외부 글꼴 요청은 없다. CSP는 스타일·글꼴에 self만 허용한다.
- 톤 검증: `text-cleaner.spec.mjs`에서 320/390/768/1440/1920px × 라이트·다크의 배경·글자색·글꼴·제목 크기·굵기·본문 폭을 홈페이지와 비교한다. 화면 넘침·글꼴 로드·테마 전환 후 결과 보존·콘솔 오류도 확인한다. 입력 비전송 검사는 정적 자산 로딩 후 글 입력으로 생긴 요청을 관측한다. 2026-10-13 로컬 결과와 화면 근거는 `/Users/user/reports/T-261013-042/`에 기록한다. 실제 휴대전화 기기 조작은 미확인이다.
- 자동 검증: `node --test tests/text-cleaner.unit.mjs`(배포 HTML의 실제 정리 함수 10개), `npm run build`, `npx playwright test tests/text-cleaner.spec.mjs tests/home-tone.spec.mjs tests/one-page.spec.mjs tests/theme-lang-layout.spec.mjs`(진입·복귀·옵션·복사 API 성공/거절·원문 보존·저장/전송 없음·320/390/768/1440px·홈 회귀). 복사 API 자동 검사는 성공/거절을 모의한다. 실제 클립보드는 별도 Aside 검사로 확인한다.
- 2026-10-13 로컬 화면 검토: 도구 390/1440px와 홈페이지 390/1440px의 스크린샷에서 새 카드·입력창·버튼·복귀 링크를 확인했다. 근거: `/Users/user/reports/T-261013-025/playwright/`. 실제 휴대전화 기기 조작은 미확인이다.
- 공개 검증: 머지한 커밋에서 `npm run build` → 기존 `npx wrangler pages deploy dist --project-name=kangdaejong-com --branch=main` → 홈페이지 카드와 `/tools/text/` HTTP·내용 확인 → Aside에서 카드 진입·예시 정리·실제 복사/붙여넣기. 배포 ID·머지 커밋·readback은 T-261013-025 체크포인트에 기록한다. GitHub Actions는 공유 소스 검사와 머지 게이트만 수행하며 자동 배포하지 않는다.

## 사다리요 개인정보 처리 안내 — T-261012-019

- 진입점: `/privacy-sadariyo/` (App Store·Google Play 제출용 개인정보처리방침 URL). 홈 앱 목록(`src/data/home.ts`) 반영은 심사 통과 뒤 별도 단계(T-261012-018)라 이번에는 페이지만 더한다.
- 기대 결과: h1 「사다리요 개인정보 처리 안내」, 수집 없음·기기 안 저장(앱이 밖으로 보내지 않음)·네트워크/광고/분석 없음·권한 없음·문의 메일, canonical `https://kangdaejong.com/privacy-sadariyo/`. 앱 안 안내(`ssamssae/sadariyo` `lib/about/about_sheet.dart`)와 같은 내용이다.
- 검증: `tests/sadariyo.spec.mjs`. 라이브 응답은 배포 뒤 여러 번 받아 200 을 확인한다.
- 사이트맵: canonical 이 경로와 같아 `dist/sitemap.xml` 에 자동으로 들어간다. `tests/audit-fixes.spec.mjs` 의 사이트맵 목록 검사는 이 변경 전부터 origin/main 에서 RED 다(목록 10개, 실제 12개 — 노래찾기 2페이지 미반영).

## 살아있음·우리 사이 앱 등록 — T-261011-070

- 진입점: `/#products` 「생활에 가까운 앱」. 계산기알람 다음, 노래찾기 앞(출시 순서). 2026-10-11 실측: 살아있음 App Store id6812609143(1.0.5, 10/05 출시)·Google Play `com.daejongkang.stillhere` 공개, 우리 사이 App Store id6816725770(1.0.0, 10/07 출시)·Google Play 미공개. 우리 사이 행은 App Store 링크 1개만 둔다. Google Play 주소를 추측해 넣지 않는다.
- 아이콘: App Store artworkUrl512 JPG를 96/192px WebP로 줄였다(`public/product-icons/<appId>-<sha8>-96/192.webp`). 원본 주소·sha256은 `product-icon-sources.json`에 있다.
- 영어: `i18n-en.json`에 앱 이름·설명·스토어 링크 이름 7개.
- 우리 사이 소개(`/our-sai/`) 안내 문구: App Store 다운로드 링크, Android는 준비 중.
- 1100px 이상 3열: 마지막 줄 밑줄 규칙을 앱 개수와 무관하게 바꿨다(`nth-child(3n+1):nth-last-child(-n+3)`와 그 뒤 형제). 9개면 마지막 줄 세 칸 모두 밑줄이 없다. 650~1099px 2열의 기존 밑줄 규칙은 그대로다.
- 검증: `tests/life-apps.spec.mjs`(링크·아이콘·390/1440px·마지막 줄 밑줄·우리 사이 안내 문구), 앱 개수 검사 7→9(`one-page`·`site-renewal`), 아이콘 수 9→11(`theme-lang-layout`).

## 다크 모드·PC 넓은 레이아웃·한국어/EN 전환·가벼운 아이콘 — T-261011-068

- 다크 모드: 기기 설정(prefers-color-scheme)을 따르고 토글은 없다. `SiteLayout`의 `theme="auto"`가 `<html data-theme="auto">`를 켜고, `src/styles/tokens.css`의 다크 블록이 토큰을 덮는다(초소와 같은 파란 계열: 바탕 #121519, 강조 #7aa2ff). 라이트는 `var(--토큰, 원래색)` 대체값으로 픽셀 그대로. 공용 헤더·푸터는 호스트의 `--mb-host-*` 변수를 상속해 같이 어두워지고, 변수를 정의하지 않는 founder 는 라이트 그대로다. 로고·사진·단백질·전자책 템플릿 페이지는 켜지 않았다.
- PC 넓은 레이아웃: `tokens.css`의 `--page-max`가 1000px → 1440px. 홈 본문(`.home-width`)·하위 페이지(`.studio-width`)·푸터·공용 헤더(`--mb-max`)가 같은 값을 쓴다. 1100px 이상에서 앱 목록은 3열. 모바일(650px 이하)은 그대로.
- 한국어/EN 전환: 홈 헤더의 `한국어 | EN` 버튼(`<mb-header lang-toggle>`) → `mb-lang-change` 이벤트 → `src/scripts/lang-toggle.js`가 본문·헤더·푸터(shadow DOM)·aria-label 류 속성을 `src/data/i18n-en.json`(한국어 문자열 → 영어)으로 바꾼다. 새로고침 없이 즉시 바뀌고 `localStorage['mb-lang']`에 기억한다. 영어 문구를 고치려면 JSON 값만 고친다. 한국어 문구를 바꾸면 같은 키를 JSON에도 맞춘다(없는 키는 한국어 그대로 남는다).
- 아이콘: `public/product-icons/*-96.webp`(+`-192.webp` 2x). 1024px PNG 원본 4장(3.4MB)과 512px JPG 4장을 지우고 `product-icon-sources.json`의 `icon`/`icon2x`/`derivedFrom`으로 가리킨다. 원본 출처(`source`, `sha256`)는 그대로 둔다.
- 그록봇 서비스 아이콘(2026-10-11 후속, PR #142 흡수): 텔레그램 브릿지 카드 위에 4칸 카드 그림(`public/product-screens/telegram-bridges-531861e1-480/960.webp`, `index.astro`의 `bridgesVisual`), 자비스 카드 아이콘(`product-icon-sources.json`의 「자비스」), 접힌 설치 안내의 브릿지 행마다 타일(`home.ts` `tools[].icon`). 원본은 제우스 `~/icons-20261011/`(README 에 용도), 저장소에는 WebP 만 둔다. 계산기알람·입타 원본은 이미 쓰던 파일과 같다(sha256 일치).
- 함께 고친 것: 섹션 소제목이 제목의 자간(-.045em)을 물려받아 글자가 겹치던 것(`letter-spacing:0`), 인사이트 배너 제목이 h1보다 먼저 오던 제목 순서(h2 → p), 작은 링크 탭 영역 44px, `_headers`에 HSTS·X-Frame-Options·Permissions-Policy와 `/_astro/*`·`/product-icons/*` 1년 캐시, Google Fonts 요청을 JetBrains Mono만(Noto Serif KR은 전자책 템플릿 페이지만 `fonts="mono-serif"`), 홈 JSON-LD(Organization·Person·WebSite), 헤더 메뉴 `/worklog` → `/worklog/`, 헤더 정의 전 높이 예약(CLS).
- 검증: `npm run build`, `npm run verify:shared-header`, `verify:shared-footer`, `verify:favicon-brand`, `verify:tone-pairs`, `npx playwright test tests/theme-lang-layout.spec.mjs tests/home-corrections.spec.mjs tests/one-page.spec.mjs tests/header-navigation.spec.mjs`. 390/1440/1920px 라이트·다크 스크린샷, EN 전환·새로고침 유지·한국어 복귀.
- 배포: 머지 후 `npm run build` → `npx wrangler pages deploy dist --project-name=kangdaejong-com --branch=main`. 공용 헤더(`/mb-components.js`)는 founder 도 라이브로 읽으므로 배포 뒤 founder 헤더가 라이트 그대로인지 확인한다.

## 노래찾기 앱 등록 — T-261007-020

- 진입점: `/#products` → 노래찾기 행. 2026-10-08 01:06 KST App Store 공개(id6820080312, 1.0.0) → `src/data/home.ts`에 `appId`를 넣고 상태 문구를 지웠다. 행에는 App Store 링크 1개만 표시한다. 허구의 다운로드 링크를 넣지 않는다.
- 앱 행의 App Store·Google Play 링크는 `appId`·`package`가 있을 때만 렌더링한다(노래찾기는 iPhone 전용).
- 스토어 제출용 안내: `/privacy-noraechatgi/`, `/support-noraechatgi/`.
- 아이콘: 앱 저장소 `assets/icon/icon-1024.png`를 512px JPG로 변환. `product-icon-sources.json` sha256으로 확인.
- 링크가 1개뿐인 행도 링크를 제목과 같은 왼쪽 선에 둔다(`home-simple.css`의 `.store-links` 왼쪽 정렬). 공통 `site.css`는 오른쪽 정렬이라 설명이 링크보다 길면 링크가 밀린다.
- 검증: `tests/noraechatgi.spec.mjs`(href·상태 문구 없음·390/1440px 왼쪽 정렬), `one-page.spec.mjs`(앱 7개), `site-renewal.spec.mjs`.

## 오늘 뭐 먹지? 메뉴 추첨기 — 제거됨

2026-09-29 사용자 요청(T-260929-001)으로 메인에서 제거했다. 대표 프로젝트 아래에는 함께 만드는 서비스가 바로 이어진다.

## 문의노트 종료 — T-261003-017

- 2026-10-03 사용자 요청으로 홈페이지에서 제거하고 Sites 접근을 소유자 전용으로 변경했다.
- 익명 접속은 HTTP 401, 접근 정책 revision 3, 허용 역할 owner 1명, 예약 작업 0개를 확인했다.
- 소스와 DB는 보존한다. 대기 개발 T-260927-041 및 T-260927-043은 취소 상태로 종료한다.

## 헤더·톤·앱 로고·움직임 — T-261003-017

- 홈·소개·상세 페이지와 작업장은 동일 `mb-header`를 쓴다. 프로젝트·앱·연락은 홈의 해당 구역, 둘러보기는 기존 상세 목적지를 제공한다. 키보드 ArrowDown/Escape, 외부 클릭, 320~1440px에서 메뉴 위치를 검사한다.
- 흰 배경, 파란 강조색 #2458cc, Pretendard, 최대 본문 1000px을 기준으로 맞춘다. 공유 이미지는 현재 승인 로고로 렌더링하며 manifest hash가 포함된 이미지 주소를 쓴다.
- 세 앱 아이콘은 각 저장소 main의 iOS 1024px 원본을 복사했다. `product-icon-sources.json`의 revision·sha256으로 재확인할 수 있다. App Store 배포 버전과는 구분한다.
- `/#mood` → 잠깐 쉬기 → 움직임 멈추기/켜기: 정지 시 좌표 고정, 재개 1.8초 후 이동거리 3 CSS px 초과. OS 동작 줄이기와 숨겨진 문서는 정지한다.
- 검증: `tests/home-corrections.spec.mjs`, `header-navigation.spec.mjs`, `mood-corner.spec.mjs`, `one-page.spec.mjs`, `site-renewal.spec.mjs`. 로컬·배포 근거는 T-261003-017 체크포인트에 구분한다.

## 단일 페이지 홈페이지 — T-261003-016

- 진입점: `/`. 상단 프로젝트·앱·연락은 같은 페이지의 해당 구역으로 이동한다. 1.0/2.0/3.0 선택 메뉴를 제거했다.
- 프로젝트 → 텔레그램 브릿지 설치 안내: 접힌 설치·시연 구역이 열리고 4종 브릿지 저장소/릴리스와 자막 영상을 확인한다.
- 앱 6개 → 기존 App Store/Google Play 링크. 책 3개 → 기존 크몽 링크. 문의·SNS 12개·무료 양식은 한 홈에서 접근한다.
- `/archive/`는 `/`로 301 이동한다. 브라우저는 기존 fragment를 이어받는다. 로컬 정적 미리보기에서는 스크립트가 query와 fragment를 보존한다. JS를 끄면 홈 이동 링크를 제공한다.
- `/#books`, `/archive/#books`, `/#open-tools`, `/archive/#mood`의 기존 앵커를 유지한다. mood는 접힌 쉬어가기 구역을 연다. JS 없이도 summary를 눌러 콘텐츠를 볼 수 있다.
- 하단 사업자 정보를 펼치면 기존 등록번호·전화·이메일·호스팅 제공자를 확인한다. 상세·지원·법적 페이지는 기존 경로를 유지한다.
- 로컬 검증: `npm run build`, `npm run verify:homepage-renewal`, `npx playwright test tests/one-page.spec.mjs tests/home-tone.spec.mjs tests/books-anchor.spec.mjs tests/social-banner.spec.mjs tests/preparing-home.spec.mjs tests/mood-corner.spec.mjs tests/header-navigation.spec.mjs tests/site-renewal.spec.mjs tests/digital-products.spec.mjs --workers=2`.
- 화면 폭 320~1440px, 키보드 이동, 동작 줄이기, JS 비활성, 링크·그림 로딩을 확인한다. 공개 배포 여부와 실측은 티켓 체크포인트에 별도로 기록한다.
- 배포 연결: 저장소 GitHub Actions는 공유 소스 검사/PR 머지만 수행한다. 기존 Cloudflare Pages에 같은 머지 버전으로 `npx wrangler pages deploy dist --project-name=kangdaejong-com --branch=main` 후 공개 홈과 archive 리다이렉트를 검증한다. 배포 설정 변경은 없다.

## 로고꾸러미 종료 — T-260924-066
2026-09-29: `https://logo.kangdaejong.com/`와 `https://kangdaejong.com/logo/`에서 종료 안내를 표시하고 HTTP 410을 반환한다. `/logo/api/config`와 주문·생성 경로도 410이며 공급자·주문 저장소에 접근하지 않는다. 회사 메인에서 로고꾸러미 링크를 제거했다. 브라우저 저장값과 서버 주문 데이터는 폐쇄 작업으로 삭제하지 않는다. 공개 반영은 배포 후 별도 확인한다.

## 호스팅 제공자 표시 — T-260930-006

- 진입/조작: 공개 첫 화면을 열고 하단 사업자정보 확인. 로그인 불필요.
- 기대: 홈페이지 및 로고 종료 화면 하단에 Cloudflare, Inc. 표시. 홈페이지는 Cloudflare Pages, 로고는 Cloudflare Workers. 종료 화면 410 및 신규 주문 차단 유지.
- 검증: 관련 소스 검사와 빌드 후 공개 화면 확인. 배포 실측은 T-260930-006 종결 근거에 기록.

## 사진꾸러미 종료 — T-260925-011

2026-09-30 사용자 요청으로 무료 공개 기능과 AI·유료 출시를 종료한다.
- 진입/조작: 로그인 없이 `https://kangdaejong.com/photo/` 접속 → 종료 안내 → 회사 홈 링크.
- 기대: 9월 30일 종료 안내·문의처·호스팅 제공자 표시. 사진 입력·보정·다운로드·결제 UI 없음. 메인 서비스 링크 없음. 기존 브라우저 스타일 저장값 유지.
- `/photo`, `/photo/*`는 기존 `logo-kureomi` Worker에서 HTTP 410, `no-store`, `noindex`를 반환한다. API GET/POST/HEAD도 저장소·공급자 호출 전에 차단한다. 로고 종료 상태는 유지한다.
- 로컬 상용 서버 `npm start`는 포트·DB·공급자 초기화 전에 종료한다. 내부 테스트용 `createApp`과 소스/데이터는 보존한다. 새 계정·DNS·유료 호출·데이터 삭제 없음.
- 검증: `node --test tests/logo/*.test.mjs tests/photo-closure.test.mjs`, `npm run build`, 공유 header/footer 검사, `npx playwright test --config playwright.photo-public.config.mjs`. 데스크톱·모바일·WebKit 화면, 저장값 보존, 홈 이동을 확인한다.
- 승인된 배포: 같은 머지 커밋에서 `npx wrangler deploy --config logo-worker/wrangler.jsonc`, `npx wrangler pages deploy dist --project-name kangdaejong-com --branch main`. 기존 로고 Worker 라우트·DO·secret을 보존하며 사진 경로 두 개만 추가한다.
- 공개 검증: 위 브라우저 검사에 `PHOTO_PUBLIC_URL=https://kangdaejong.com` 지정, `/photo`·API 410과 홈페이지 링크 제거를 별도 조회. 실제 시각·배포 버전·결과는 T-260925-011 종료 근거에 기록한다.

## T-261012-029 · 우리 사이 다크 모드·단백질 한국어/EN 전환

- 「우리 사이」 안내 4페이지(OurSaiLayout): `theme="auto"` 만 켠다. 레이아웃의 보라색·800px 지정은 회사 공용 스타일에 덮여 라이트에서도 쓰이지 않으므로(실측: 브랜드·링크 #2458cc, 폭 none) 다크도 회사 토큰(#7aa2ff 등)을 그대로 따른다.
- 전환 로직은 `src/scripts/lang-toggle-core.js` 의 `startLangToggle(dict)` 하나다. 홈 = `lang-toggle.js`(i18n-en.json), 단백질 = `lang-toggle-protein.js`(i18n-protein-en.json). `SiteLayout langToggle` 이 공용 헤더에 전환 버튼을 띄운다. 대표소개(ssamssae.github.io)의 `lang-toggle.js` 는 이 core 의 사본이다 — 고칠 땐 양쪽을 같이.
- core 보강: 검색칸 `placeholder` 번역, 페이지 스크립트가 나중에 바꾼 문구·속성(3D 뷰어 aria-label)은 새 원문으로 인식, 처음부터 마크업에 있던 영어(카드의 'Glycine')는 한국어 복귀 때 역번역하지 않음.
- 단백질 사전 318항목: 아미노산 20종 반복 문구는 틀로 생성(이름·3D로 보기·구조 그림·PubChem·회전 모형·창 제목), 공용 헤더·푸터는 홈 사전 값 재사용. protein.spec.mjs 에 전환 검사 1개.

## T-261012-024 · 단백질 도감 다크 모드·넓은 폭

단백질 도감(protein.kangdaejong.com)도 홈과 같은 톤: `ProteinAtlas` 가 `SiteLayout theme="auto"` 를 켜고, 본문 폭은 `--page-max`(1440px). 분자 그림은 다크용 `public/protein/dark/<slug>.webp`(바탕 #121519, `npm run render:protein-dark` — 저장소의 SDF·고정 3Dmol 로 원본과 같은 구도, manifest 의 pixelBounds ±2px 확인 후에만 저장)를 `<picture media="(prefers-color-scheme: dark)">` 로 쓰고 다크에선 `mix-blend-mode:lighten` 으로 카드에 녹인다(라이트의 multiply 는 다크에서 분자를 검게 묻는다). 확대 창·3D 뷰어 정적 그림 링크는 `data-dark-href`, 3D 뷰어 바탕은 다크 #191d23. protein.spec.mjs 에 다크 검사 1개.

## T-261003-018 · 사이트 디자인 통일

공통 톤: 홈·system·organization·ipta·digital-products·전자책 양식·our-sai와 단백질 도감을 390/1440px로 열어 흰 배경, 제목 34/51px, 1000px 본문 폭과 가로 넘침을 확인. protein.spec.mjs는 메뉴 열기·20개 구조·검색/필터·3D·확대 조작 검사. site-renewal.spec.mjs의 전체 링크·모바일 검사도 유지.


## 전자책 판매 종료 — T-261003-019

- 승인: 2026-10-03 사용자 전자책 오프보딩 및 홈페이지 반영 요청. 크몽 3종 판매 중지, 원본 보존.
- 진입: 대표 홈페이지 `/#books`, `/digital-products/`, 작업장 `/products/`의 전자책.
- 기대: 판매 종료 안내, 신규 구매 링크 및 가격 없음. 공개 무료 양식 링크 정상.
- 검증: 양쪽 빌드, 기존 전자책 화면 회귀 및 뉴스레터 구매 hop 제거 검사. 공개 반영·크몽 실측 근거는 `/Users/user/reports/T-261003-019/`에 기록.

## 무료 실습 양식 제공 종료 — T-261004-002

- `/digital-products/`는 흰 배경·파란 강조색과 구분선 목록으로 전자책 판매 종료 및 2026-10-04 양식 제공 종료를 안내한다.
- 무료 양식 14종은 `archive/free-templates/`에 원본을 보존하고 배포 산출물에서 제외한다. 기존 HTML·Markdown URL은 Cloudflare Pages `_redirects`의 두 prefix 규칙으로 종료 안내에 301 연결한다.
- 홈·설치 지원 안내에서 무료 양식 제공/다운로드 링크를 제거했다. 실제 배포 후 28개 기존 URL(HTML14/Markdown14) redirect 및 본문 비노출을 확인한다.
- 검증: build, `python3 -m unittest discover -s tests -p test_free_template_retirement.py`, 390/1440px 화면. 근거 `/Users/user/reports/T-261004-002/`. main 머지 후 기존 Cloudflare Pages 공개 배포는 사용자 오프보딩 및 카드톤 수정 요청 범위다.

- 후속 사용자 지시로 digital-products 페이지 자체도 종료. 원본은 archive에 보존. 기존 28개 양식 URL과 /digital-products 두 주소는 제품 목록 #retired-products로 301 연결. 별도 종료 안내 페이지는 배포하지 않는다.


## 인사이트 상단 배너 — T-261004-011

- 진입점: `https://kangdaejong.com/`. 로그인 없이 첫 화면의 소개글 위에 인사이트 배너를 표시한다.
- 조작: `인사이트 모아보기`를 누르면 `https://work.kangdaejong.com/insights/` 목록으로 이동한다.
- 기대: 320/390/1440px에서 가로 넘침 없이 제목과 버튼이 보이며, 키보드로 버튼을 선택할 수 있다.
- 검증 근거: T-261004-011의 로컬·공개 화면 및 링크 검사 결과. 구현·머지·공개 반영은 체크포인트에서 구분한다.


## 기록실 서비스 종료 — T-261004-012

- 홈페이지의 기록실 체험 링크를 제거했다. 콜타 등 다른 서비스와 인사이트 배너는 유지한다.
- 기록실 도메인은 종료 안내와 HTTP 410을 제공한다. 원본 소스·사용자 데이터는 보존한다.
- 확인: 홈에서 기록실 링크 없음, 인사이트 배너 정상, 기록실 공개 루트 및 API 410. 실제 배포 근거는 해당 티켓 체크포인트 참조.

## 전수검사 개선 — T-261004-013

- 홈 → 320px에서 전자책 각 행의 `판매 종료`가 보이고 가짜 링크 화살표가 없다. 소개 메타는 판매 중인 책을 홍보하지 않는다. 인사이트 배너와 기존 기록실 종료를 보존한다.
- `/ipta/` → Mac/Windows 다운로드 버튼은 기본·hover·focus에서 흰 글씨를 유지한다. 공용 링크 색 덮어쓰기로 생겼던 대비 문제를 공통 버튼 규칙으로 수정했다.
- 임의의 없는 주소 → `404.html`의 안내·홈 링크와 HTTP 404. Cloudflare Pages의 SPA 홈 fallback을 막는다. 기존 종료/이동 리다이렉트는 유지한다.
- `npm run build` → 빌드된 HTML의 현재 자기 canonical과 noindex를 기준으로 `dist/sitemap.xml` 생성. 종료 안내와 외부 이동 페이지는 제외한다.
- 콜타는 T-261002-007에서 2026-10-02 종료된 상태다. 서버/터널/메일을 재개하지 않는다. `callta-retired/worker.mjs`가 기존 호스트의 1033 오류를 종료 안내(410)로 바꾸고 모든 API를 차단한다. 홈페이지 운영 링크도 제거한다.
- 검증: `npx playwright test tests/audit-fixes.spec.mjs --workers=1`과 `node --test callta-retired/worker.test.mjs`. 기존 버전에서 4개 결함 재현 후 수정 버전에서 통과.
- 배포: 머지 버전의 `npm run build`, `npx wrangler pages deploy dist --project-name=kangdaejong-com --branch=main`, `npx wrangler deploy --config callta-retired/wrangler.jsonc`. 별도 자동 배포 설정 변경 없음. 공개 실측은 T-261004-013 체크포인트에 연결한다.

## 살아있음 1.0.6 출시 안내 준비 (T-261012-009)

- 진입: `/privacy-stillhere/`와 하단의 `/support-stillhere/` 링크.
- 기대: 계정 없는 초대·확인 코드 연결, 암호문 중계와 처리 정보, 7일 메시지·30일 미사용 보관함 만료, 연결 해제와 구버전 Drive 안내가 함께 표시된다.
- 근거: StillHere main `21bc7d522821813dd9b9e53f9cb7919a4398ff95`의 relay 제한·수신 확인·삭제 처리와 연결 화면. `npm run build` 통과. 2026-10-13 Aside 로컬 미리보기에서 두 페이지 문구·레이아웃·페이지 간 링크 확인.
- 공개 반영: 미실행. 현재 공개 페이지는 1.0.5 기준이다. 이 PR은 출시 자료 준비이며, 공개 안내 배포는 사용자 확인 후 기존 Pages 배포 경로로 수행한다.
