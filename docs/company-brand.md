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

T-261024-030: 공유 카드를 회사홈 밝은 톤(공용 톤 파일의 라이트 값 = 첫이름 값)과 해요체(「다듬어요.」)로 바꿨다. 색 지문(`social.tokens`)도 라이트 값으로 잰다. 회사 SiteLayout 의 `og:image:alt` 를 카드 글자와 맞췄다.

T-261012-040: 같은 계약을 따라 종료 안내 화면(`logo-worker/closed.mjs`·`photo-app/closed.mjs` — Worker 와 이 사이트 빌드가 같이 씀), 작업장 이동 껍데기(`src/components/RedirectStub.astro`, `src/lib/og-image.mjs` 의 `SHARED_OG_IMAGE`)·`public/privacy-miniexpense.html`, 초소 방문객 페이지, 제품 안내 사이트(product.kangdaejong.com 첫 화면·브릿지 설명서 4개)도 고정 주소를 쓴다. `src/pages/protein.astro`(이동 껍데기)는 SiteLayout 처럼 manifest 에서 `?v=` 를 붙인다. 이 저장소 `scripts/verify-dark-cards.mjs`(`tests/test_dark_cards.sh`)가 빌드 결과(dist·dist-protein)의 모든 HTML 이 공용 카드(고정 주소 또는 manifest 버전)와 다크 모드를 갖는지 검사한다.

## 공용 톤 파일 — 색·톤·공용 부품은 한 파일 (T-261013-004 색, T-261024-026 톤)

색(라이트 하나)·모양·글자·간격·공용 부품·PC 폭(`--page-max`)의 원본은 `public/brand/current/tokens.css` 하나다. 공개 주소 `https://kangdaejong.com/brand/current/tokens.css`(고정, `/brand/*` 캐시 = 매번 재확인). 회사의 모든 사이트가 페이지 머리말에서 이 파일을 읽고, 사이트 스타일에는 `var(--이름)`·공용 부품 class 만 쓴다(대체값·숫자 복사 없음).

**다크 모드는 없다 — 전부 라이트, T-261024-058** (대종님 「응 다크를풀고 전부 라이트」, 2026-10-24 21:0x; T-261024-050 「다크도 풀자」는 회사 홈만이었다). 원본에 다크 블록이 없으므로 회사 홈·작업장(/work)·대표소개(/founder)·단백질(/protein)·종료 안내·제품 안내가 기기 설정과 무관하게 같은 라이트 값으로 그려진다. 모든 화면은 `<html data-theme="light">` + `<meta name="color-scheme" content="light">`(`SiteLayout` 고정, 단백질 도감의 `theme="auto"` 분기·다크 분자 그림 세트·`render:protein-dark`·`tests/test_protein_dark.sh` 는 `_retired/` 로). `scripts/brand-tokens.mjs` 는 원본에 다크 규칙이 다시 들어오면 빌드를 멈춘다. 재발 방지 = `scripts/verify-tone-copies.mjs`(원본 밖 다크 규칙·톤 정의 복사·직접 숫자 래칫, 저장소 3곳 같은 코드)·`scripts/verify-dark-cards.mjs`(빌드 결과의 모든 HTML 이 light)·`scripts/verify-tone-pairs.mjs`(`theme="auto"` 0건·원본 다크 블록 0)·`scripts/site-release/contract.mjs auditScreen`(라이브 전 사이트 대표 화면을 다크 기기 에뮬레이션으로 열어도 바탕이 밝고 `data-theme="auto|dark"` 선언이 없음)·`tests/theme-lang-layout.spec.mjs`·`tests/protein.spec.mjs`.

**색·모양을 바꾸는 법**
1. `public/brand/current/tokens.css` 의 값을 고친다(색 = `:root`, 모양·글자·간격 = `--tone-*`, 부품 = `.mb-*`). 다크 블록을 만들지 않는다.
2. 공유 카드가 읽는 색(`--bg`·`--fg`·`--fg-dim`·`--fg-mute`·`--accent`·`--border`)이 바뀌었으면 `npm run brand:render` 로 공유 카드를 다시 그린다 — 안 그리면 `npm run build` 가 「공유 카드가 옛 색」으로 멈춘다(`public/brand/current/social.tokens` 지문).
3. 회사홈만 배포한다(`npm run deploy:site`). 작업장·대표소개·제품 안내·종료 안내는 다시 배포하지 않아도 다음 방문부터 새 값이다(실행 시점에 읽는다). 작업장 글 카드(그림)는 색 지문 버전이라 다음 작업장 빌드에서 자동으로 다시 그려진다.

**톤(모양·글자·크기) — T-261024-026** — 같은 파일에 첫이름(토스 톤) 값을 `--tone-*` 이름으로 둔다: 글꼴 `--tone-font`, 글자 `--tone-{display,title,subtitle,body,label,caption}-{size,line}`(30/40·24/32·20/28·17/26·15/22·13/18), 굵기 `--tone-weight-bold`(700), 모서리 `--tone-radius-{control,card,sheet,pill}`(14·20·24·999), 버튼 높이 `--tone-control-height`(56), 카드 안쪽 `--tone-card-padding`(20), 화면 좌우 `--tone-gutter`(20). 다크에서도 같다. 사이트 자기 값(`--radius-card` 등)과 겹치지 않게 `--tone-` 을 붙였다 — 사이트는 검토한 뒤 자기 값을 `var(--tone-*)` 로 바꿔 연결한다.

**톤 값 확장 — T-261024-050** (첫이름 `web/studio.css` 스펙 v3·`landing.css` 를 라이브에서 실측해 맞춤): 버튼·입력칸 좌우 안쪽 `--tone-control-padding`(16), 입력칸 테두리 `--tone-input-border`(2), 여러 줄 입력칸 최소 높이 `--tone-textarea-min`(96), 손가락 최소 높이 `--tone-tap-height`(44), 칩 높이 `--tone-chip-height`(26), 공용 헤더 높이 `--tone-header-height`(64), PC 본문 폭 `--tone-page-max`(1080)·긴 글 폭 `--tone-prose-max`(680)·한 줄 흐름 폭 `--tone-flow-max`(480), 첫 화면 위 여백 `--tone-hero-top`(40), 구역 간격 `--tone-section-gap`(56), 간격 눈금 `--tone-space-1~6`(8·12·16·24·32·40), 초점 테두리 `--tone-focus-{width,offset}`(2·3), 링크 밑줄 간격 `--tone-underline-offset`(4), 누름 시간 `--tone-press-ms`(100), 비활성 파란 버튼 바탕 `--accent-disabled`(라이트만). 900px 이상에서는 같은 파일의 `@media (min-width: 900px)` 블록이 첫이름과 같은 기준으로 `--tone-gutter`(32)·`--tone-card-padding`(24)·`--tone-display-{size,line}`(44/56)·`--tone-hero-top`(56)을 바꾼다 — 사이트는 `var()` 만 쓰면 같이 바뀐다. 회사 홈의 PC 폭은 `src/styles/tokens.css` 가 `html:root { --page-max: var(--tone-page-max) }` 로 이 사이트 안에서만 1080px 로 덮는다(공용 원본의 `--page-max` 1440px 는 작업장 몫이라 그대로).

**공용 부품 — T-261024-026, T-261024-050 확장** — class 를 붙인 곳에만 적용된다: `.mb-shell`(본문 폭)·`.mb-prose`(긴 글 폭), `.mb-btn` + `.mb-btn--primary`(파란 버튼 — 올려도 색 그대로, 누르는 동안만 눌린 파랑·0.98 축소)·`.mb-btn--secondary`(회색 버튼)·`.mb-btn--block`(가로 꽉), `.mb-card`(회색 면 카드 — 안의 `> h3`·`> p` 도 첫이름 카드 값), `.mb-chip`(작은 알약 표시), `.mb-eyebrow`(구역 위 작은 라벨), `.mb-link`(글 링크: 파란 굵은 15px 밑줄, 44px; 회색 카드 위에서는 눌린 파랑으로 4.5:1), `.mb-field` + `.mb-label`·`.mb-input`·`.mb-textarea`·`.mb-select`·`.mb-help`·`.mb-error`(입력: 56px 회색 면·투명 2px 테두리·초점이면 파란 테두리), `.mb-option`(고르는 칸, `aria-pressed="true"` 면 연한 파랑 + 꺾쇠), `.mb-table`(15/22, 아래 가는 줄만), `.mb-faq`(접는 항목: 회색 둥근 면·56px 제목 줄·오른쪽 꺾쇠), `.mb-row`(이름·값 한 줄). 색 규칙은 class 를 두 번 써서(`.mb-btn.mb-btn--primary`) 사이트 공용 초기화(`.studio-page a { color: inherit }`)에 지지 않는다. 회사 홈(`src/pages/index.astro`·`InsightBanner`·404·organization·ipta FAQ·복붙 정리기 버튼)이 사용처다. 공용 헤더·푸터(`public/mb-components.js`)와 하위 페이지 공용 스타일(`public/studio-page.css`, 작업장도 읽는다)도 숫자 대신 같은 `--tone-*` 이름을 읽는다 — 헤더 64px·메뉴 15/22 굵게·둘러보기 판 24px 모서리, 푸터 13/18·링크 15/22 굵게 44px, 650px 이하 헤더는 첫이름처럼 두 줄(상호 줄·메뉴 줄).

**막는 검사** — `scripts/verify-palette-copies.mjs`(`tests/test_palette_copies.sh`): 회사 팔레트 색 값이나 `--tone-*` 정의가 원본 밖에 복사되면 실패(테마와 무관한 색은 그 줄에 `tokens:fixed`). `scripts/verify-tone-copies.mjs`(`npm run verify:palette-copies` 가 이어서 돌린다 — CI·배포 같은 진입점, T-261024-058): ① 원본 밖 다크 규칙 금지 ② 톤 정의 복사 금지 ③ 모양·글자·간격 속성(`border-radius`·`font-size`·`font`·`line-height`·`letter-spacing`·`min-height`·`max-width`·`padding*`·`gap`·`margin*`)의 직접 숫자와 글꼴 묶음 복사를 파일별로 세어 `scripts/tone-copies-baseline.json` 기준선보다 많으면 실패. 숫자를 `var(--tone-*)`·`.mb-*` 로 바꿨으면 `node scripts/verify-tone-copies.mjs --update` 로 기준선을 내린다(올릴 수는 없다). 정말 고정인 줄만 `tone:fixed` 와 이유. 같은 코드가 작업장(daejong-page)·대표소개(ssamssae.github.io) 저장소에도 있다. `scripts/verify-tone-pairs.mjs`: 원본에 토스 톤 값·공용 부품(입력칸·링크·표·접기 포함)·900px 블록이 있고, 홈·공용 헤더/푸터·`studio-page.css` 가 숫자를 다시 적지 않고 그 값·부품을 쓰는지, 모든 페이지가 라이트인지(CI·배포에서 실행). `scripts/verify-dark-cards.mjs`: 빌드 결과의 모든 HTML 이 공용 tokens.css 를 읽고 light 인지. `tests/theme-lang-layout.spec.mjs` 「home parts share the 첫이름 tone values」: 실제 렌더의 버튼·카드·링크·제목·칩·헤더 값이 원본과 같은지. 그림 생성기·테스트는 `scripts/brand-tokens.mjs`(빌드 첫 단계가 만드는 `tokens.json`)로 같은 원본을 읽는다.
