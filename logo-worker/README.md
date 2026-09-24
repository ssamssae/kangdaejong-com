# 로고꾸러미 서비스

T-260924-061. 화면 `/logo/`, API `/logo/api/*`. 회사 홈페이지의 기존 주문 DB와 분리된 Cloudflare Durable Object를 사용한다.

## 검증과 배포

```sh
npm ci
npm run build
node --test tests/logo/api.test.mjs
npx playwright test tests/logo-studio.spec.mjs --workers=2
npx wrangler deploy --config logo-worker/wrangler.jsonc --dry-run
```

프런트는 기존 `kangdaejong-com` Pages 빌드로 배포한다. Worker는 `/logo/api/*` 경로만 연결한다. `SALES_ENABLED=false`가 기본이며, 외부 API 키가 없어도 견본 편집·다운로드는 동작한다. 현재 라이브 판매는 비활성이다.

## 결제·생성 계약

- 가격 9,900원, 성공한 시안 8개. 브라우저에서 4개씩 요청한다.
- 서버가 주문·랜덤 접근 토큰을 생성한다. 토큰 해시만 주문 서버에 보관하며 토큰 원본은 고객 브라우저에 남는다. 토큰을 URL에 넣지 않는다.
- Toss 서버 confirm 결과의 주문번호·금액·잔액·통화·DONE 상태를 대조한다. 같은 주문의 confirm 재호출은 수량을 재지급하지 않는다.
- 생성 직전 Toss 단건 조회로 취소·부분취소를 차단한다.
- Durable Object transaction으로 잔여 수량을 예약하고 동시에 한 요청만 생성한다. 요청 ID 재사용은 다시 과금하지 않는다. 생성 실패 시 수량은 돌려주되 시도 수는 유지한다. 주문당 최대 시도 12회.
- 연결 단절 등으로 `processing`에 머문 주문은 운영자가 Recraft 처리 상태와 주문을 대조한다. 모호한 요청을 자동 재실행하지 않는다.
- Recraft는 `recraftv4_1_vector`, `n=1`, `b64_json` 출력. 모델 변경 없이 8개 정상 생성비 $0.64, 실패 포함 12회 최대 요청 기준 $0.96(동일 단가 가정).
- 응답 SVG는 JSON으로만 전달하고 브라우저에서 DOMPurify로 외부 참조·스크립트 등 제거 후 미리보기·내보내기한다.
- 한글 텍스트는 OFL Noto Sans KR / Noto Serif KR을 opentype.js로 path 변환한다. ZIP 안 SVG에는 외부 폰트 의존성이 없다.

## 판매 활성화 전 필요한 사항

1. Recraft 계정 `minusbetastudio@gmail.com` Google 가입은 완료. API 잔액 0, 충전 전 키 생성 버튼 비활성(2026-09-24 KST 실측). 키 발급·암호화 보관은 T-260924-062.
2. API 전용 선불 $5 충전은 사용자 승인 대기이며, 자동 충전은 켜지 않는다.
3. Recraft 개발자 약관 §3.1의 앱 연동 허용과 §3.2(x)의 경쟁 서비스 제한을 함께 검토하여 이 서비스 허용 여부를 확인한다. §3.6의 30일 캐시 제한에 맞춰 자산 만료 정책을 구현한 뒤 판매한다. 현재 코드는 판매 차단 상태이며 장기 보관을 약속하지 않는다.
4. 최종 판매 조건, 환불 처리·고객 식별/주문 복구·개인정보 안내와 Recraft 요구 최종사용자 약관을 마련하고 실제 테스트 결제→Recraft 생성→파일 전달을 검증한다.
5. 토스 가맹점의 새 상품·도메인 사용 범위를 확인한다. 첫이름의 실결제 키를 확인 없이 재사용하지 않는다. 테스트 키는 기존 인프라 보관소에서 읽으며 소스에 넣지 않는다.
6. 검증 후 서버 시크릿 `RECRAFT_API_TOKEN`, `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`를 배포하고 판매 문구와 동의 UI를 함께 전환한다. `SALES_ENABLED`만 켜서 출시하지 않는다.

## 공식 자료

- https://www.recraft.ai/docs/api-reference/models/recraft-v4-1
- https://www.recraft.ai/docs/api-reference/endpoints
- https://www.recraft.ai/legal/developer-terms
- https://docs.tosspayments.com/reference

무료 견본 4종은 프로젝트에서 직접 작성한 도형이며 독점성을 보장하지 않는다. 실제 Recraft 호출·실결제는 이 첫 버전의 자동 테스트에서 수행하지 않는다. 테스트는 모의 공급자 응답과 실제 브라우저 파일 다운로드를 구분한다.
