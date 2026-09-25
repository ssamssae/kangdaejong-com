# 사진꾸러미 무료 기본 보정 공개

T-260925-008. 사용자 선택: **기본 보정부터 무료 공개**, AI·유료 결제는 실제 연동 확인 후 별도로 개시한다.

- 공개 주소: https://kangdaejong.com/photo/
- 기존 Cloudflare Pages 프로젝트 `kangdaejong-com`의 `/photo/`와 홈페이지 링크. 새 계정·외부 이미지 API·충전 없이 실행한다.
- `src/pages/photo/index.astro`, `src/lib/photo/{studio,engine,worker}.js`가 공개판이다. 기존 `photo-app/server.mjs` 및 데이터·세션·결제 원장은 공개하지 않는다.
- Web Worker 안에서 이미지 헤더/크기 확인 → 브라우저 방향 정규화 → 긴 변 2,400px → 밝기/채도 → PNG 인코딩을 수행한다. PNG 메타데이터를 제거하고 결과는 Blob URL로 다운로드한다.
- 브라우저 밝기 곡선은 기존 기본 보정과 같은 계수지만 채도는 RGB 명도 혼합을 사용한다. sharp와 픽셀 단위로 동일한 엔진이라고 주장하지 않는다. 형태·글자·피부를 생성하지 않는 전체 밝기/색감 조정이다.
- JPG/PNG/WebP 정지 사진, 10MB·24MP 이하. 한 번에 10장, 결과 20장·비교용+결과 합계 100MB, ZIP 60MB 제한. 처리 45초 초과 시 해당 Worker를 중단하며 다음 사진을 처리한다.
- 계정/크레딧/메일/결제/외부 AI 없음. 사진은 메모리에만 두고 지우기·새로고침으로 제거한다. 다운로드한 파일은 사용자 기기에 남는다. 사용자가 저장한 스타일 설정만 localStorage에 보관하며 개별 삭제할 수 있다.
- 사진 전송을 막기 위해 `/photo/*` 응답에 `connect-src 'none'`, self worker/script, frame-ancestors none 정책을 적용한다. 사이트 접속 기록은 호스팅 사업자에서 처리될 수 있어 개인정보 안내에서 구분한다. 외부 폰트/광고/분석 스크립트를 추가하지 않았다.
- 공개판에는 워터마크·가입·카드 등록·결제 버튼이 없다. 공급자 조건이 미확정인 AI 기능은 제공하지 않는다.

## 검증·배포

```sh
npm ci
npm --prefix photo-app ci
node --test tests/photo-engine.test.mjs
npm run build
npx playwright test --config playwright.photo-public.config.mjs
node scripts/verify-shared-header-source.mjs
node scripts/verify-shared-footer-source.mjs
# PR 검토·머지 뒤
npx wrangler pages deploy dist --project-name kangdaejong-com --branch main
# 공개 주소에서 동일 실제 브라우저 검사 (사진은 서버에 전송되지 않음)
PHOTO_PUBLIC_URL=https://kangdaejong.com npx playwright test --config playwright.photo-public.config.mjs
```

데스크톱 Chrome·모바일 Chrome·iPhone 설정 WebKit을 검사한다. WebKit 자동화는 실제 iPhone 하드웨어 검증을 대신하지 않는다. 합성 입력으로 픽셀 변화/투명도·PNG/ZIP·JPEG 회전·WebP·손상 입력·스타일 삭제·새로고침 초기화·비GET 전송 없음·화면 폭을 확인한다. 공개 응답의 CSP·canonical·공유 이미지·홈페이지 링크는 배포 후 따로 확인한다. 로컬 Node 기존 계정/결제 검사는 별도 회귀이며 공개 기능으로 설명하지 않는다.

참조: [createImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap), [Canvas PNG](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob), [Cloudflare Astro 배포](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/).

## 별도 잔여

원래 상용 SaaS의 공급자 선정/데이터 처리 조건, 대표사진 AI 품질·실제 원가, Toss 가맹/실결제·환불·웹훅, Resend 수신, 유료 호스팅/큐/계정 운영은 이번 무료 공개와 분리한다. 기본 공개가 그 연동 검증이나 유료 판매 완료를 의미하지 않는다. 기존 Recraft 재사용을 우선 검토하되 새 가입·추가 충전은 자동 진행하지 않는다.
