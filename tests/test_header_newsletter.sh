#!/usr/bin/env bash
# T-261012-035 회귀 검사 셸 진입점: 공용 헤더 둘러보기 「뉴스레터」가 작업장 뉴스레터 페이지(같은 창)로 가는지.
# 실제 검사는 tests/header-navigation.spec.mjs 의 newsletter 검사다. sot 종결 래칫이 .mjs 를 읽지 못해 셸 진입점을 둔다(T-261011-070 선례).
# 같은 파일의 다른 검사(패널 링크 개수)는 묵은 기대값이라 -g 로 뉴스레터 검사만 돌린다.
# 추가 인자는 Playwright 로 넘긴다. 예: tests/test_header_newsletter.sh -c <다른 설정 파일>
set -euo pipefail
cd "$(dirname "$0")/.."
exec npx playwright test tests/header-navigation.spec.mjs -g newsletter "$@"
