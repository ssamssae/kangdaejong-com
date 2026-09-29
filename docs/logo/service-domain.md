# 로고꾸러미 주소와 배포

## 서비스 종료 — T-260924-066 (2026-09-29)
공급자 실질 답변 미수신 시 폐쇄하라는 사용자 승인에 따라 서비스를 종료했다. 아래 내용은 기존 구현·복원용 기록이며 판매 재개 승인이 아니다.
`SERVICE_CLOSED=true`에서 전용 도메인·Worker 기본주소·기존 `/logo`와 `/logo/*`는 HTTP 410을 반환한다. API는 저장소·공급자 호출 전에 차단한다. 회사 홈페이지의 서비스 링크도 제거했다. 소스 이력, Durable Object, 기존 secret, 브라우저 저장값은 보존한다. 기존 보관기간에 따른 alarm은 변경하지 않는다. 사진꾸러미와 다른 서비스는 변경하지 않는다.
검증: `node --test tests/logo/*.test.mjs`, `npm run test:logo-ui`, `npx playwright test tests/logo-domain.spec.mjs` 및 공개 주소 HTTP 410/종료문구/API 차단 확인.


T-260924-077: 회사 홈페이지는 `kangdaejong.com`, 서비스는 `서비스명.kangdaejong.com`을 사용한다. 로고꾸러미 대표 주소는 `https://logo.kangdaejong.com/`이다.

- 기존 `logo-kureomi` Worker의 custom domain으로 연결한다. 기존 ORDERS Durable Object와 판매 설정을 그대로 사용한다. `SALES_ENABLED=false`와 T-260924-066의 판매 보류를 유지한다.
- Worker의 `/`, `/terms/`, `/privacy/`는 빌드 결과 `/logo/` 하위 정적 페이지로 내부 매핑한다. 폰트와 API의 `/logo/` 경로는 호환성을 위해 유지한다.
- 회사 사이트의 `/logo/`는 신규 방문자를 새 주소로 보낸다. 기존 localStorage의 `logo-draft`, `logo-order`, `logo-payment` 또는 결제 복귀 쿼리가 있으면 원래 주소에 남아 작업을 보존한다. 저장값을 URL이나 다른 origin으로 자동 전달하지 않는다. 주문은 기존 복구 파일 기능으로 옮길 수 있다.
- 배포는 동일 커밋의 `npm run build` 결과로 Worker와 회사 Pages(`kangdaejong-com`)를 모두 갱신한다. 새 도메인의 루트·약관·API·무료 다운로드를 확인한 다음 회사 Pages의 링크/이전 주소 안내를 배포한다.
- 검증: `npm run test:logo-ui`, `npm run test:logo-api`, `node --test tests/logo/domain.test.mjs`, `npx playwright test tests/logo-domain.spec.mjs --workers=2`.
- 문제가 생기면 이전 Worker 버전과 Pages 배포로 각각 복원한다. 주문 객체·브라우저 저장값·서비스 비밀값을 삭제하지 않는다.
