# 회사 로고 중앙 관리

정본 저장소는 kangdaejong-com이다. `scripts/render-studio-brand.mjs`의 −β 벡터와 색상·배치가 단일 원본이며, 생성된 파일을 소비 사이트에 복제하지 않는다.

## 고정 소비 주소

- 심볼/벡터 favicon: https://kangdaejong.com/brand/current/logo.svg
- ICO favicon: https://kangdaejong.com/brand/current/favicon.ico
- 2048 PNG: https://kangdaejong.com/brand/current/icon.png
- Apple 아이콘: https://kangdaejong.com/brand/current/apple-touch-icon.png
- 회사 공유 이미지: https://kangdaejong.com/brand/current/social.png
- 버전·파일 SHA256 목록: https://kangdaejong.com/brand/manifest.json
- 공통 헤더: https://kangdaejong.com/mb-components.js

manifest 버전은 모든 출력 파일의 SHA256에서 자동 생성한다. 소비자는 버전값을 하드코딩하지 않는다. 회사 SiteLayout의 OG/Twitter 이미지 URL에는 manifest의 social.png SHA256 앞 16자리를 `?v=`로 붙여 이미지 교체 시 크롤러가 새 주소를 읽도록 한다. 이미지 원본은 위 중앙 주소를 유지한다. `/brand/*`는 재검증 캐시와 CORS를 제공한다. HTML이 직접 이미지 주소를 사용하므로 JavaScript를 실행하지 않는 공유 크롤러도 읽을 수 있다. 최초 소비자 전환 이후 로고 변경은 이 저장소/회사 Pages 프로젝트만 배포한다.

## 변경 절차

1. 정본 렌더 스크립트의 그림·색·배치를 수정한다.
2. `npm run brand:render` 후 `python3 tests/test_brand_assets.py`, `npm run build`, `npm run verify:favicon-brand`, `python3 tests/test_studio_brand.py`를 실행한다. 생성 PNG도 시각 검수한다.
3. 원본과 생성 결과를 함께 PR 검토·머지하고 `kangdaejong-com` Pages의 dist를 배포한다.
4. 공개 manifest와 자산 hash, 실제 소비 사이트 로고를 확인한다. 추가 소비 사이트의 재빌드·배포는 필요 없다.

초기 연결 대상: 회사 홈페이지, 작업장(work), 단백질(protein), 로고꾸러미(logo). 첫이름·초소·콜타 등 서비스 자체 아이콘은 이 계약으로 교체하지 않는다. 소비 사이트에 남은 이전 이름의 파일은 기존 외부 링크 호환용이며 디자인 정본이 아니다. 정본 렌더가 루트의 기존 회사 파일도 갱신한다.

열어 둔 브라우저 탭은 새로고침 전까지 바뀌지 않을 수 있다. Telegram 등 외부 플랫폼 자체 미리보기 캐시는 사이트의 Cache-Control과 별개여서 즉시 갱신을 보장할 수 없다. 이미 보낸 메시지는 그대로 남을 수 있으므로 새 버전 공유는 `https://kangdaejong.com/?v=2`처럼 페이지 버전을 붙인 링크의 실제 미리보기로 확인한다(대표 canonical은 루트 유지). 중앙 도메인 장애 시 회사 이미지에도 영향이 있으며, 로컬 복사본을 자동 폴백하면 옛 이미지가 남을 수 있으므로 사용하지 않는다.

T-261003-017: 승인된 로고 도형은 유지하고 공유 카드는 흰 배경·파란 제목으로 맞춘다. `brand:render`의 마지막 `render-share-card.mjs` 단계가 `brand/current/social.png`와 manifest hash를 갱신한다. 기존 메시지의 Telegram 미리보기 캐시는 별도이므로 실제 응답 메타데이터와 이미지 hash로 배포를 검증한다.

T-261012-032: 공유 카드는 회사홈 다크 팔레트로 바꿨다(바탕 #121519·제목 #e3e7ed·강조 #7aa2ff). 링크 미리보기는 보는 사람 설정과 무관한 그림 한 장이라 라이트·다크 겸용 1장이다. 이 저장소 밖에서 버전값(`social.png?v=<sha16>`)을 직접 적는 곳 — 작업장(ssamssae/daejong-page) `src/layouts/Layout.astro`·`scripts/verify-og-images.mjs`·`scripts/verify-offboarding-ui.mjs`·`tests/test_product_offboarding.py`·`public/privacy*.html`·`public/dead-ends/detail.html`, 대표소개(ssamssae/ssamssae.github.io) `index.html` 2곳 — 은 카드를 다시 그리면 같이 바꾼다(T-261012-041 로 폐기 — 아래). 작업장 `verify-og-images.mjs` 가 빌드 결과의 모든 HTML 을 검사해 옛 버전을 막는다. 작업장 글별 카드(src/lib/og-image.mjs)도 같은 다크 팔레트이고 주소에 `?v=OG_IMAGE_VERSION` 을 붙인다.

T-261012-041: 소비 사이트(작업장·대표소개)는 공용 카드를 버전 없는 고정 주소 `https://kangdaejong.com/brand/current/social.png` 하나로만 가리킨다. 그래서 카드를 바꿀 때 고칠 곳은 이 저장소의 그림(`npm run brand:render`)과 배포뿐이고, 소비 사이트는 손대지도 다시 배포하지도 않는다(위 「변경 절차」 4번과 같은 계약). `/brand/*` 는 `max-age=0, must-revalidate` 라 고정 주소가 늘 최신 그림을 준다. 이 저장소의 SiteLayout 은 manifest 에서 `?v=` 를 자동으로 붙이므로 손으로 적는 곳이 없다. 재발 방지 검사 = 작업장 `scripts/verify-og-images.mjs`(빌드 결과 모든 HTML 이 고정 주소와 정확히 같아야 함)·대표소개 `scripts/verify-founder-shared-header.mjs`(고정 주소, `social.png?` 금지). 이미 공유된 링크의 미리보기는 메신저가 따로 저장한 사본이라 이 계약과 무관하다 — 텔레그램은 @WebpageBot 에 주소를 보내 새로 가져오게 한다.

T-261012-040: 같은 계약을 따라 종료 안내 화면(`logo-worker/closed.mjs`·`photo-app/closed.mjs` — Worker 와 이 사이트 빌드가 같이 씀), 작업장 이동 껍데기(`src/components/RedirectStub.astro`, `src/lib/og-image.mjs` 의 `SHARED_OG_IMAGE`)·`public/privacy-miniexpense.html`, 초소 방문객 페이지, 제품 안내 사이트(product.kangdaejong.com 첫 화면·브릿지 설명서 4개)도 고정 주소를 쓴다. `src/pages/protein.astro`(이동 껍데기)는 SiteLayout 처럼 manifest 에서 `?v=` 를 붙인다. 이 저장소 `scripts/verify-dark-cards.mjs`(`tests/test_dark_cards.sh`)가 빌드 결과(dist·dist-protein)의 모든 HTML 이 공용 카드(고정 주소 또는 manifest 버전)와 다크 모드를 갖는지 검사한다.

## 공용 톤 파일 — 색·톤·공용 부품은 한 파일 (T-261013-004 색, T-261024-026 톤)

색(라이트·다크)과 PC 폭(`--page-max`)의 원본은 `public/brand/current/tokens.css` 하나다. 공개 주소 `https://kangdaejong.com/brand/current/tokens.css`(고정, `/brand/*` 캐시 = 매번 재확인). 회사의 모든 사이트가 페이지 머리말에서 이 파일을 읽고, 사이트 스타일에는 `var(--이름)` 만 쓴다(대체값 없음). 다크는 기기 설정을 따라 기본으로 켜지고, 라이트로 고정할 페이지만 `<html data-theme="light">`.

**색을 바꾸는 법**
1. `public/brand/current/tokens.css` 의 값을 고친다(라이트 = `:root`, 다크 = 아래 다크 블록).
2. 다크 값이 바뀌었으면 `npm run brand:render` 로 공유 카드를 다시 그린다 — 안 그리면 `npm run build` 가 「공유 카드가 옛 색」으로 멈춘다(`public/brand/current/social.tokens` 지문). 단백질 분자 그림은 `scripts/render-amino-acids*.mjs` 가 같은 원본을 읽는다.
3. 회사홈만 배포한다. 다른 사이트는 다시 배포하지 않아도 다음 방문부터 새 색이다.

**톤(모양·글자·크기) — T-261024-026** — 같은 파일에 첫이름(토스 톤) 값을 `--tone-*` 이름으로 둔다: 글꼴 `--tone-font`, 글자 `--tone-{display,title,subtitle,body,label,caption}-{size,line}`(30/40·24/32·20/28·17/26·15/22·13/18), 굵기 `--tone-weight-bold`(700), 모서리 `--tone-radius-{control,card,sheet,pill}`(14·20·24·999), 버튼 높이 `--tone-control-height`(56), 카드 안쪽 `--tone-card-padding`(20), 화면 좌우 `--tone-gutter`(20). 다크에서도 같다. 사이트 자기 값(`--radius-card` 등)과 겹치지 않게 `--tone-` 을 붙였다 — 사이트는 검토한 뒤 자기 값을 `var(--tone-*)` 로 바꿔 연결한다.

**공용 부품 — T-261024-026** — class 를 붙인 곳에만 적용된다: `.mb-btn` + `.mb-btn--primary`(파란 버튼)·`.mb-btn--secondary`(회색 버튼)·`.mb-btn--block`(가로 꽉), `.mb-card`(회색 면 카드), `.mb-chip`(작은 알약 표시), `.mb-eyebrow`(구역 위 작은 라벨). 색 규칙은 class 를 두 번 써서(`.mb-btn.mb-btn--primary`) 사이트 공용 초기화(`.studio-page a { color: inherit }`)에 지지 않는다. 회사 홈(`src/pages/index.astro`·`InsightBanner`)이 첫 사용처다.

**막는 검사** — `scripts/verify-palette-copies.mjs`(`tests/test_palette_copies.sh`): 회사 팔레트 색 값이나 `--tone-*` 정의가 원본 밖에 복사되면 실패(테마와 무관한 색은 그 줄에 `tokens:fixed`). `scripts/verify-tone-pairs.mjs`: 원본에 토스 톤 값·공용 부품이 있고 홈이 숫자를 다시 적지 않고 그 값·부품을 쓰는지(CI·배포에서 실행). `scripts/verify-dark-cards.mjs`: 빌드 결과의 모든 HTML 이 공용 tokens.css 를 읽는지. 그림 생성기·테스트는 `scripts/brand-tokens.mjs`(빌드 첫 단계가 만드는 `tokens.json`)로 같은 원본을 읽는다.
