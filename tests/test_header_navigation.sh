#!/usr/bin/env bash
# T-261013-003 회귀 검사 셸 진입점: 공용 헤더 둘러보기 패널 전체(링크 14개·「책·템플릿」 없음·뉴스레터 같은 창 등).
# 실제 검사는 tests/header-navigation.spec.mjs 전체다. sot 종결 래칫이 .mjs 를 읽지 못해 셸 진입점을 둔다(T-261011-070 선례).
# 추가 인자는 Playwright 로 넘긴다. 예: tests/test_header_navigation.sh -c <다른 설정 파일>
set -euo pipefail
cd "$(dirname "$0")/.."
exec npx playwright test tests/header-navigation.spec.mjs "$@"
