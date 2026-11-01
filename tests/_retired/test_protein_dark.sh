#!/usr/bin/env bash
# T-261012-024 회귀 검사 셸 진입점: 단백질 도감 다크 모드 — 회사홈과 같은 다크 팔레트(바탕 #121519),
# 다크용 분자 그림(/protein/dark/*.webp)·lighten 합성·확대 창 다크판.
# 실제 검사는 tests/protein.spec.mjs 의 「dark scheme uses the company dark palette and dark molecule images」다.
# sot 종결 래칫이 .mjs 를 읽지 못해 셸 진입점을 둔다(T-261011-070 tests/test_life_apps.sh 선례).
# 전제: npm run build:protein 으로 dist-protein/ 이 있어야 한다(설정의 webServer 가 astro preview 로 띄운다).
# 추가 인자는 Playwright 로 넘긴다.
set -euo pipefail
cd "$(dirname "$0")/.."
exec npx playwright test --config playwright.protein.config.mjs -g 'dark scheme uses the company dark palette' "$@"
