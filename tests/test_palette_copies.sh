#!/usr/bin/env bash
# T-261013-004 회귀 검사 셸 진입점: 회사 팔레트 색 값이 공용 원본(public/brand/current/tokens.css) 밖에 복사돼 있으면 실패.
# sot 종결 래칫이 .mjs 를 읽지 못해 셸 진입점을 둔다(T-261011-070 tests/test_life_apps.sh 선례).
set -euo pipefail
cd "$(dirname "$0")/.."
exec node scripts/verify-palette-copies.mjs "$@"
