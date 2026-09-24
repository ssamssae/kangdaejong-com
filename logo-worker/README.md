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

1. Recraft 가입·$5 사용자 충전·암호화 키 보관·Cloudflare secret 등록 완료(T-260924-062, infra PR16). 자동 충전 OFF, 실제 SVG 1개 생성 검증. 본 작업은 추가 Recraft 호출을 하지 않았다.
2. 주문 복구 파일, 서버 결제 재조회, 생성 전 전액 환불, 결제 후 29일 결과물 자동 삭제 및 결제 기록 5년 파기를 구현했다. 모의 공급자 서버 검사 13개와 브라우저 검사 7개 통과. 오래된 `processing` 요청은 중복 과금 방지를 위해 수동 확인 대상으로 남긴다.
3. 인프라의 Toss test_ck/test_sk를 로컬 .dev.vars(0600, Git 제외)에만 사용했다. 실제 토스 샌드박스 결제창과 ‘실제 결제가 안되는 테스트’ 표시 확인, 사용자 카드 인증 후 9,900원 테스트 승인·실제 Recraft 4시안·다른 브라우저 복구·10파일 ZIP을 확인했다. 운영자 API로 테스트 결제를 취소했고 취소 후 생성 요청 402를 확인했다. 미사용 셀프환불은 모의 공급자 검사만 통과했으며 실제 청구는 없었다. 라이브 키는 배포하지 않았다.
4. Recraft 개발자 약관 §3.2(x)의 경쟁 서비스 제한, §3.6의 캐시 용도 제한과 고객 다운로드 권리, §6.4의 표식 유지 조건은 공급자 확인이 필요하다. 문의 초안: `docs/logo/recraft-inquiry.md`. 사용자 승인으로 회사 메일에서 help@recraft.ai로 발송했고 보낸편지함 확인 완료(thread 1a0d33307984c521). 답변 대기. SVG에는 원본 C2PA manifest를 그대로 유지하도록 보완했다. 변형 결과의 서명 유효성 및 PNG 변환의 출처 정보 처리 조건은 확인되지 않았으므로 이를 해소하기 전 유료 생성은 열지 않는다.
5. 개인정보 안내는 출시 준비 문서다. Recraft/Cloudflare 국외 처리 상세 조건과 관련 고지·동의를 확정하고, Toss 가맹점의 새 상품·도메인 사용 범위를 확인해야 한다. 첫이름 라이브 키를 확인 없이 재사용하지 않는다.
6. 카드 인증 후 결제→실제 Recraft→파일 전달→미사용 주문 환불을 구분해 검증한다. 실결제는 사용자 지출 승인 필요. 출시 시 정책 확정·마케팅 문구 전환·메인 배치는 같은 잔여 범위이며 `SALES_ENABLED`만 켜지 않는다.

## 복구와 데이터 수명

복구 파일에는 주문 ID와 강한 랜덤 접근 토큰이 들어 있으므로 비밀번호처럼 보관한다. 서버는 토큰 해시만 보관한다. URL에 접근 토큰을 넣지 않는다. 브라우저 저장소가 없어져도 파일 업로드로 복구할 수 있다. 결제 콜백 유실 시 `/reconcile`이 인증된 주문의 Toss 주문번호 조회 후 확인을 재시도한다. 파일 분실 시 영수증과 주문번호를 통한 수동 본인 확인이 필요하며 주문번호만으로 접근 권한을 발급하지 않는다.

만료 시 DO alarm이 SVG 청크·프롬프트·작업 목록을 제거한다. GET과 생성 경로에서도 만료를 검사한다. 생성 중 만료 충돌을 줄이기 위해 기한 직전 2분은 생성을 받지 않는다. 결제 기록은 결제 후 5년 자동 파기, 미결제 pending 주문은 7일, 요청 집계는 마지막 접근 후 1시간에 파기한다. 확인 중인 결제는 돈이 승인됐을 수 있으므로 운영 확인 대상이다.

## 공식 자료

- https://www.recraft.ai/docs/api-reference/models/recraft-v4-1
- https://www.recraft.ai/docs/api-reference/endpoints
- https://www.recraft.ai/legal/developer-terms
- https://docs.tosspayments.com/reference

무료 견본 4종은 프로젝트에서 직접 작성한 도형이며 독점성을 보장하지 않는다. 실제 Recraft 호출·실결제는 이 첫 버전의 자동 테스트에서 수행하지 않는다. 테스트는 모의 공급자 응답과 실제 브라우저 파일 다운로드를 구분한다.

## 실제 SVG 회귀

T-260924-064 실결제창 테스트에서 생성된 크림 배경 path까지 단색화하여 로고가 사각형처럼 보이는 결함을 발견했다. 전체 viewBox를 덮는 밝은 사각형만 제거하고 밝은 내부 도형은 보존한다. SVG 다운로드에서 C2PA manifest base64를 보존하는 브라우저 회귀 검사를 추가했다. 실제 생성 SVG를 다시 렌더링해 심볼 확인 완료.
