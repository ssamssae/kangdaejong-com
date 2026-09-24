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

manifest 버전은 모든 출력 파일의 SHA256에서 자동 생성한다. 소비자는 버전값을 하드코딩하지 않는다. `/brand/*`는 재검증 캐시와 CORS를 제공한다. HTML이 직접 이미지 주소를 사용하므로 JavaScript를 실행하지 않는 공유 크롤러도 읽을 수 있다. 최초 소비자 전환 이후 로고 변경은 이 저장소/회사 Pages 프로젝트만 배포한다.

## 변경 절차

1. 정본 렌더 스크립트의 그림·색·배치를 수정한다.
2. `npm run brand:render` 후 `python3 tests/test_brand_assets.py`, `npm run build`, `npm run verify:favicon-brand`, `python3 tests/test_studio_brand.py`를 실행한다. 생성 PNG도 시각 검수한다.
3. 원본과 생성 결과를 함께 PR 검토·머지하고 `kangdaejong-com` Pages의 dist를 배포한다.
4. 공개 manifest와 자산 hash, 실제 소비 사이트 로고를 확인한다. 추가 소비 사이트의 재빌드·배포는 필요 없다.

초기 연결 대상: 회사 홈페이지, 작업장(work), 단백질(protein), 로고꾸러미(logo). 첫이름·초소·콜타 등 서비스 자체 아이콘은 이 계약으로 교체하지 않는다. 소비 사이트에 남은 이전 이름의 파일은 기존 외부 링크 호환용이며 디자인 정본이 아니다. 정본 렌더가 루트의 기존 회사 파일도 갱신한다.

열어 둔 브라우저 탭은 새로고침 전까지 바뀌지 않을 수 있다. Telegram 등 외부 플랫폼 자체 미리보기 캐시는 사이트의 Cache-Control과 별개여서 즉시 갱신을 보장할 수 없다. 중앙 도메인 장애 시 회사 이미지에도 영향이 있으며, 로컬 복사본을 자동 폴백하면 옛 이미지가 남을 수 있으므로 사용하지 않는다.
