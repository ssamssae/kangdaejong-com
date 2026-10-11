#!/usr/bin/env bash
# T-261011-070 회귀 검사 셸 진입점: 홈 「생활에 가까운 앱」의 살아있음·우리 사이 행과 /our-sai/ 안내 문구.
# 실제 검사는 tests/life-apps.spec.mjs 다. sot 종결 래칫이 .mjs 를 읽지 못해 셸 진입점을 둔다(T-261011-022 선례).
# 추가 인자는 Playwright 로 넘긴다. 예: tests/test_life_apps.sh -c <다른 설정 파일>
set -euo pipefail
cd "$(dirname "$0")/.."
exec npx playwright test tests/life-apps.spec.mjs "$@"
