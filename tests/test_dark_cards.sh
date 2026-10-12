#!/usr/bin/env bash
# T-261012-040 회귀 검사 셸 진입점: 회사홈 빌드 결과의 모든 HTML 이 공용 다크 카드(og:image·twitter:image)와
# 다크 모드를 갖는지 전수 검사한다(scripts/verify-dark-cards.mjs). 종료 안내 화면·이동 껍데기 포함.
# sot 종결 래칫이 .mjs 를 읽지 못해 셸 진입점을 둔다(T-261011-070 tests/test_life_apps.sh 선례).
# 전제: npm run build (단백질까지 보려면 npm run build:protein) 로 dist/ 가 있어야 한다.
set -euo pipefail
cd "$(dirname "$0")/.."
exec node scripts/verify-dark-cards.mjs "$@"
