# 사이트 변경 누락 방지 — T-261013-046

## 작업장 주소 이전 — T-261017-004

작업장은 `https://kangdaejong.com/work/`를 사용한다. `workshop-router/`가 GitHub Pages의 `/work/` 산출물을 읽는다. 회사 Pages 사이트맵과 작업장 사이트맵을 합쳐 `/sitemap.xml` 하나로 제공한다. 원본 하나라도 실패하면 부분 사이트맵 대신 502를 반환한다. 기존 호스트는 새 경로로 301 이동한다. query를 유지한다. `/workshop`처럼 인접한 회사 경로는 회사 원본으로 전달한다.

배포 순서는 작업장 PR의 기존 GitHub Pages 자동 배포 → 뉴스레터 수집기의 회사 Origin 허용(운영 바인딩 보존) → 이 저장소 PR 머지 → `npm run deploy:work-route` → 새 공개 경로 검증 → 기존 `npm run deploy:site` → 옛 작업장 DNS 프록시 활성화다. CNAME 대상은 바꾸지 않는다. 두 저장소의 main 자동 배포 효과는 서로 다르다. 작업장 main은 GitHub Pages에 자동 반영한다. 회사 main은 기존 수동 배포 경로를 사용한다.

`global_fetch_private_origin`은 같은 zone의 작업장 원본 요청이 다시 Worker로 들어가는 것을 막는다. 이 설정 없이 옛 호스트 리디렉션을 활성화하지 않는다. 배포 전 DNS·Worker 라우트를 백업한다. 되돌릴 때는 옛 DNS 프록시와 이 Worker 라우트를 원복한 뒤 회사 메뉴를 되돌린다. 다른 Worker 라우트는 보존한다.

`test:work-route`는 301·query·HTTP·404·HEAD·조건부 요청·인접 경로·원본 실패를 검사한다. 회사 Cookie와 Authorization은 GitHub 원본으로 보내지 않는다. candidate 검사는 배포 전 `/work/` 산출물과 전환 후 통합 사이트맵을 모두 지원한다. 통합 사이트맵의 각 URL은 가장 구체적인 사이트 경로에 귀속한다. 최종 공개 검사는 실제 canonical URL을 사용한다.

사이트 변경은 `public/brand/sites.json`의 소비 대상 전체에 대해 검증한다. 회사홈, 작업장, 대표소개, 제품 설명서, 단백질, 종료 안내, 초소 방문객 화면을 포함한다. 자체 제품 브랜드, 내부 서비스, 메일 DNS, 별도 데모는 사유가 있는 명시적 예외다. 예외를 검증 성공 수에 합치지 않는다.

## 대상 발견과 검사 경로

- `docs/site-discovery.json`은 Cloudflare Pages, Worker 도메인·라우트, DNS, GitHub Pages API에서 독립적으로 수집한 기록이다. `sites.json`에서 사이트를 지우거나 새 배포가 등록되지 않으면 실패한다. 단순히 목록을 순회하는 검사와 다르다.
- PR의 필수 `site-release-contract`는 회귀 검사, 전체 빌드, 공통 소스 검사, 현재 공개 GitHub Pages 목록, 공용 메뉴 링크, 사이트맵 페이지, 대표 화면을 검사한다. Cloudflare 인증은 PR에 복사하지 않는다. DNS·Worker 전체 목록은 **인증된 배포 직전에 다시 조회**한다. 계정 API가 실패하면 배포를 진행하지 않는다.
- 공개 페이지는 사이트맵에서 수집한다. 도구·정적 개인정보·종료 안내처럼 사이트맵 밖에 있을 수 있는 경로는 `pages`에 명시한다. 독립된 정적 헤더는 `headerExceptions`에 구체적 이유를 기록한다.
- `screens`에 있는 각 대표 경로는 390/1440px × light/dark에서 렌더링한다. 가로 넘침, 다크 모드의 흰 카드, 아이콘 로드, 제품 검색, JavaScript 오류를 검사하고 PNG를 저장한다.
- 단일 출처 공용 CSS·헤더·로고·OG·제품 아이콘의 전체 SHA-256 집합이 `brand/release.json`의 revision이다. 생성물은 git에 별도 복사하지 않는다. 배포 후 실제 바이트와 source commit을 확인한다.

## 제품 아이콘

활성 정본은 `public/brand/products/catalog.json`이다. ID, 승인 원본 출처, 파일 hash, 1x/2x 이미지 또는 예외 사유를 넣는다. `prepare.mjs`가 원본에서 `/brand/products/<id>.webp` 고정 주소를 생성한다. `/brand/*`는 기존 `max-age=0, must-revalidate`를 적용한다. 회사홈과 작업장은 이 목록을 읽는다. 옛 `product-icon-sources.json`과 `/product-icons/`는 과거 출처/링크 호환 자료이며 렌더링의 정본이 아니다.

새 제품은 먼저 정본에 등록해야 한다. 아이콘 없는 새 카드는 빌드가 실패한다. 현재 예외는 승인 이미지가 없는 Local Telegram Bridge 한 개다. 임의 그림을 생성하거나 다른 제품 그림을 대입하지 않는다.

## 변경·배포

```sh
# 원본/목록 수정 후 후보 검사
npm run test:site-release
npm run build
npm run build:protein
npm run verify:dark-cards
node scripts/site-release/live.mjs --candidate --output site-release-report/candidate

# PR 검증·머지 후, 배포 승인이 있는 작업에서 기존 Cloudflare 업로드 실행
npm run deploy:site
```

`deploy:site`는 현재 계정 목록 조회 → 빌드/검사 → 회사홈·단백질의 기존 `wrangler pages deploy` → 공개 검증을 순서대로 실행한다. 업로드 성공만으로 끝내지 않는다. 이 명령은 운영 서비스 재시작이나 예약기 설치를 하지 않는다. 과거 `kangdaejong-deploy-watcher`는 이 노드에 로드되어 있지 않음을 확인했다. 새로 활성화하지 않는다. 이전 문서의 직접 Wrangler 예시는 수동 원시 명령 설명이며, 공통 사이트 변경의 완료 판정은 이 검증 경로를 사용한다.

`deploy:site`는 공통 빌드 산출물을 쓰는 기존 `kangdaejong-com`과 `protein-kangdaejong` 두 프로젝트를 같은 커밋에서 배포한다. 그 외 공통 고정 주소 CSS·이미지를 소비하는 사이트는 재배포 없이 새 파일을 읽는다. 종료 서비스 Worker의 내용 변경은 해당 기존 배포 경로를 사용하며 종료 상태를 유지한다.

작업장은 기존 GitHub Pages `deploy.yml`의 빌드에서 제품 검사를 실행한다. 배포 다음 `verify-production` 작업은 회사홈 정본 검사기를 실행하고 `EXPECTED_WORK_COMMIT`으로 방금 배포한 작업장 커밋까지 확인한다. 실패 보고와 화면은 Actions artifact에 남는다.

## 완료 판정

`report.json` / `report.md`에 대상 수, 확인 수, 예외 수, 실패·미확인 URL, 버전, 실행 시각, 화면을 남긴다. 하나라도 실패하거나 확인하지 못하면 `complete=false`, 종료 코드 1이다. 외부 일시 오류는 제한적으로 재시도하되 성공으로 바꾸지 않는다.

배포와 Telegram 미리보기는 별도 상태다. `telegramPreview=not_verified`는 메신저 캐시를 확인하지 않았다는 뜻이다. 이 검사기는 메시지를 보내거나 미리보기를 갱신하지 않는다. 전체 웹 검사가 통과해도 Telegram 갱신 완료라고 보고하지 않는다.

재발 회귀: `bash tests/test_site_release.sh`는 실제 독립 발견 기록에서 work 항목을 삭제한 경우, 구버전 아이콘/누락 아이콘/미등록 카드, 오래된 공유 카드, 미확인을 완료로 합산하는 경우를 검증한다. 작업장 `bash tests/test_product_icon_contract.sh`는 실제 postbuild 검사 함수에 같은 결함을 넣어 실패를 확인한다.
