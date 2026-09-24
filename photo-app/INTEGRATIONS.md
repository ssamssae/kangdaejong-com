# 외부 API 검토 — 2026-09-25 KST

T-260925-004. 공식 문서를 확인해 구현한 출시 전 연결부다. 키 발급·실제 전송·결제·메일 발송이나 서비스 계약 확인을 대신하지 않는다.

## fal.ai / FLUX.1 Kontext Pro (후보)

- [모델 API](https://fal.ai/models/fal-ai/flux-pro/kontext/api), [비동기 큐](https://fal.ai/docs/documentation/model-apis/inference/queue): 메타데이터를 제거한 PNG를 data URI로 전달하고 접수 ID·상태/결과 URL을 저장한다. 접수 응답이 불명확하면 새 요청을 자동 제출하지 않는다.
- [가격표](https://fal.ai/pricing): Flux Kontext Pro는 1MP로 정규화한 장당 $0.04. 페이지는 고해상도 비례 비용을 안내하므로 이 값을 모든 해상도의 고정 단가로 보지 않는다. 실제 결과 해상도·과금 로그로 확인해야 한다.
- [API 서비스 약관](https://fal.ai/legal/api-services), [DPA](https://fal.ai/legal/data-processing-addendum), [개인정보 정책](https://fal.ai/legal/privacy-policy): 고객 앱 통합 조건과 모델 파트너 조건, 하위 처리자 및 데이터 보관 조건을 함께 확인해야 한다. 이 앱의 7일 삭제가 fal/파트너 보관기간을 의미하지 않는다. 특정 모델의 보관기간·삭제 요청 경로·처리지역·상업적 사용/표시 조건과 예외 적용은 미확정이다. 사용자 사진을 무조건 학습에 쓰지 않는다고 약속하지 않는다.
- 모델 출력은 피부/정체성·상품 글자·공간을 바꿀 수 있다. 고정 보존 프롬프트와 해상도/비율 검사는 의미적 동일성 검증을 대신하지 않는다. 실사진 품질 평가 전 공급자와 가격을 최종 확정하지 않는다.

## 토스페이먼츠 — 테스트 전용

[API](https://docs.tosspayments.com/reference), [SDK v2](https://docs.tosspayments.com/sdk/v2/js/payment), [자동결제](https://docs.tosspayments.com/guides/v2/billing/integration), [API 키](https://docs.tosspayments.com/reference/using-api/api-keys), [웹훅](https://docs.tosspayments.com/reference/using-api/webhook-events).

서버 confirm·주문 조회·cancel과 빌링키 발급/청구를 구현했다. SDK 성공 이동만으로 크레딧을 지급하지 않는다. `PAYMENT_STATUS_CHANGED`와 transmission ID를 받아도 body의 금액/상태는 신뢰하지 않고 인증된 조회 API의 현재 결과를 사용한다. 타 서비스용 키·가맹점·도메인 승인을 재사용할 수 있다고 가정하지 않는다. 자동결제는 계약/심사 조건 확인이 필요하다. 공개 웹훅 수신이나 PG 실제 테스트는 이번 검증에 포함되지 않았다.

## Resend

[메일 API](https://resend.com/docs/api-reference/emails/send-email), [중복 방지 키](https://resend.com/changelog/idempotency-keys). 인증/재설정 토큰은 DB에 해시만 저장하고 발송 링크는 URL fragment를 사용한다. 로그에 링크를 남기지 않는다. API 성공이 실제 메일함 도착 증거는 아니다. 발신 도메인 확인과 본인 메일 수신 E2E가 필요하다.

## 기본 보정 품질 표본

[scikit-image astronaut](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.astronaut)는 NASA 공개 인물 사진, [coffee](https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.coffee)는 Rachel Michetti의 CC0 사진이다. 입력은 scikit-image v0.25.2 저장소에서 가져와 로컬 근거 디렉터리에서만 비교했다. 코드 저장소에 사용자 사진이나 외부 사진을 포함하지 않는다.

기본 보정만 실사진에 적용했다. 세 카테고리의 피부·상품·숙소 전반을 검증한 자료가 아니며, 실제 유료 AI를 통과시킨 결과도 아니다. 더 다양한 권리 확인 사진과 사람의 품질 판정이 필요하다.

## 기존 Recraft 계정 재사용 대조

사용자가 새 가입/결제 부담을 질문하여 기존 인프라 기록과 [Recraft endpoints](https://www.recraft.ai/docs/api-reference/endpoints)를 대조했다. 로고 서비스에 사용한 계정/키 보관 경로와 과거 충전 기록은 있다. 현재 잔액과 사진 SaaS 용도 승인은 확인하지 않았고 키를 이 앱에 복제하거나 호출하지 않았다.

Recraft에도 image-to-image, inpainting, background replacement/removal API가 있어 기존 계정 재사용 후보가 된다. 단, 기존 로고 벡터 생성 모델의 품질·단가·사용 승인을 사진 편집까지 확장할 수는 없다. 상품 배경 기능부터 지원 모델·단가·데이터 처리·경쟁 서비스/캐시/표시 조항과 실제 품질을 비교해야 한다. fal 가입을 선결 조건으로 두지 않으며 어느 공급자도 자동 활성화하지 않는다.
