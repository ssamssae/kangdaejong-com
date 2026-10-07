# 기능 확인 경로

## 노래찾기 앱 등록 — T-261007-020

- 진입점: `/#products` → 노래찾기 행. 공개 전에는 스토어 링크 없이 「iPhone · App Store 출시 준비 중」만 표시한다. App Store 공개 후 `src/data/home.ts`에 `appId`를 넣고 상태 문구를 지운다. 허구의 다운로드 링크를 넣지 않는다.
- 앱 행의 App Store·Google Play 링크는 `appId`·`package`가 있을 때만 렌더링한다(노래찾기는 iPhone 전용).
- 스토어 제출용 안내: `/privacy-noraechatgi/`, `/support-noraechatgi/`.
- 아이콘: 앱 저장소 `assets/icon/icon-1024.png`를 512px JPG로 변환. `product-icon-sources.json` sha256으로 확인.
- 검증: `tests/noraechatgi.spec.mjs`, `one-page.spec.mjs`(앱 7개), `site-renewal.spec.mjs`.

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
