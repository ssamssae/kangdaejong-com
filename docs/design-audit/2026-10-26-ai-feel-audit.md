# kangdaejong.com 「AI 티」 디자인 점검 — 2026-10-26 (T-261026-018)

부모 티켓: T-261026-014 (인사이트 오토파일럿 ④). 기준 시점: `origin/main` 0f122dd.

## 기준

| 기호 | 기준 | 출처 |
| --- | --- | --- |
| IMP | Impeccable 공개 금지 패턴: 흔한 글꼴, 색 면 위 회색 글자, 순수 검정·회색, 카드 남용·카드 속 카드, 튀는 감속, 「모든 제목 위 둥근 네모 아이콘 타일」, 보라→파랑 그라데이션 | `pbakaus/impeccable` README(읽기만, 설치 안 함), 2026-10-25 github-trending 인사이트 |
| AA | WCAG AA 글자 대비: 본문 4.5:1, 큰 글자(24px 이상 또는 18.66px 이상 굵게) 3:1 | WCAG 2.2 1.4.3 |
| RM | `prefers-reduced-motion` 미대응 움직임 | WCAG 2.2 2.3.3, 2026-10-25 vibe-coding-ui-terms 인사이트(효과 용어의 접근성 조건) |
| AIC | 의미 없는 그라데이션·이모지/장식 기호 남발·과한 그림자·똑같은 카드 반복·과장 문구·한국어 화면 속 영어 장식 문구 | 작업 지시(brief) |

## 측정 방법

- 화면: `npm run build` → `astro preview` → Chromium으로 375·768·1440 폭 전체 화면 촬영. 움직임 줄이기 설정을 켜고 접힌 상자를 열었다.
- 대비: 화면에 보이는 모든 글자에 대해 계산된 글자색과 가장 가까운 불투명 배경색으로 비율을 쟀다(`contrast-before.txt`, `contrast-after.txt`). 홈·기록실의 기분 코너는 4가지 기분을 모두 쟀다.
- 움직임: `src/` 안의 `animation`·`transition`·`@keyframes`를 모두 찾고, 각각 움직임 줄이기 규칙이 있는지 확인했다.

## 점검표

심각도: 높음 = 접근성 기준 미달, 중간 = 눈에 띄는 AI 티, 낮음 = 거의 안 보이거나 의미가 있는 요소.

| # | 페이지 | 요소 | 문제 | 근거 규칙 | 심각도 | 수정 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `/organization/` | 「지금」 회색 카드 안 `프로젝트 보기`·`앱 보기` 링크 | 기본 파랑(`--accent`)이 회색 면(`--bg-elev`) 위에서 4.23:1. 15px 본문 글자라 4.5:1 미달 | AA | 높음 | **수정** ① 눌린 파랑(`--accent-hover`, 5.88:1). 공용 `.mb-card .mb-link` 규칙과 같은 색 |
| 2 | `/ipta/` | 설치 카드(Mac·Windows) 안 글 링크 `같은 릴리스의 시작 안내`·`공식 실행 안내` | 같은 파랑이 회색 카드 위에서 4.23:1(17px) | AA | 높음 | **수정** ② 카드 안 링크만 `--accent-hover`(5.88:1) |
| 3 | `/`·`/archive/` 기분 코너 | 그림 위 서명 「a moment, just for you.」 | 기울인 Georgia 영어 장식 문구. 한국어 화면에 뜻 없이 붙은 감성 문구. 밝은 글자(`#fffdf6`)가 그림 아래 띠와 겹쳐 「설렘」에서 4.37:1, 좁은 화면에서는 밝은 언덕과 겹쳐 더 낮아짐 | AIC, AA | 중간 | **수정** ③ 서명과 그 CSS 삭제 |
| 4 | `/`·`/archive/` 기분 코너 | 제목 위 라벨 「✳ A LITTLE PAUSE」 | 장식 기호 + 영어 대문자 라벨. 바로 위 접는 상자 제목 「잠깐 쉬어가기」, 아래 제목 「잠깐, 오늘의 기분.」과 같은 말을 세 번 반복 | AIC(장식 기호·영어 장식 문구) | 중간 | **수정** ④ 라벨과 그 CSS 삭제. 제목 문구는 그대로 |
| 5 | `/` 만드는 도구 카드 | 표식 글자 `↔`(브릿지 자리 그림 대체)·`⌁`(자비스)·`첫` | 아이콘이 없는 카드에 뜻이 약한 기호를 둥근 네모 타일로 얹음 | IMP(제목 위 아이콘 타일), AIC | 중간 | 미수정 — `src/pages/index.astro` 안 데이터라 금지 영역(열린 PR #57·#58) |
| 6 | `/` 기분 코너 | 안내 문구 「이 작은 풍경은 당신의 속도로 바뀌어요.」 | 「당신」 번역투 감성 문구 | AIC(과장·감성 문구) | 낮음 | 미수정 — 영어 전환 사전 `src/data/i18n-en.json`이 같은 문장을 키로 쓴다. 이 파일은 허용 범위 밖이라 문구만 바꾸면 영어 화면이 깨진다 |
| 7 | `/system/` | 「01·02·03」 번호가 붙은 같은 모양 카드 3장 | 같은 카드 반복 | AIC(똑같은 카드 반복) | 낮음 | 유지 — 제목이 「세 단계」라 번호가 실제 순서를 뜻한다 |
| 8 | `src/styles/site.css` | `.hero-visual::before { content: "01 / STUDIO" }`, `.subpage-mark` 큰 장식 글자, `.record-band` 등 옛 홈 규칙 | 가짜 번호 라벨·장식 글자 | AIC | 낮음 | 미수정 — 지금 어느 페이지도 이 클래스를 쓰지 않아 화면에 안 보인다(죽은 CSS 정리는 이번 범위 밖) |
| 9 | 전체 | 그라데이션·그림자 | 공개 화면에 장식용 그라데이션·짙은 그림자 없음. 카드는 그림자 없는 회색 면 | IMP, AIC | — | 문제 없음 |
| 10 | 전체 | 움직임 | 기분 코너(해·물결 반복 움직임)는 움직임 줄이기에서 멈추고 버튼도 꺼짐. 버튼·SNS 링크 전환은 `site.css`의 공용 줄이기 규칙이 덮음. 스크롤 등장 효과(공용 `mb-components.js`)는 줄이기 설정이면 시작하지 않음 | RM | — | 문제 없음 |
| 11 | `/`·`/archive/` 기분 코너 「잠깐 쉬기」 | 장면 이름 글자 | 첫 측정에서 1.19:1로 잡혔으나, 색 전환(700ms)이 끝나기 전에 잰 값이었다. 전환 뒤 다시 재면 8.68:1 | AA | — | 문제 없음(측정 착시, `contrast-before.txt`의 해당 줄) |

## 수정 요약 (4건, 최대 5건 중)

| 수정 | 파일 | 바뀐 것 |
| --- | --- | --- |
| ① | `src/pages/organization.astro` | `.now .mb-link.mb-link{color:var(--accent-hover)}` 추가 |
| ② | `src/pages/ipta.astro` | `.ipta-page .install-grid a:not(.r-button){color:var(--accent-hover)}` 추가 |
| ③ | `src/components/MoodCorner.astro` | `.mood-signature` 요소와 CSS 삭제 |
| ④ | `src/components/MoodCorner.astro` | `.mood-kicker` 요소와 CSS 삭제 |

공용 톤 파일 `public/brand/current/tokens.css`는 건드리지 않았다. 새 숫자를 적지 않고 기존 색 이름만 썼다.

## 대비 측정 결과

| 측정 | 수정 전 미달 | 수정 후 미달 |
| --- | --- | --- |
| `/` (기분 4가지) | 3 (서명) + 1 (측정 착시) | 0 |
| `/organization/` | 2 | 0 |
| `/ipta/` | 2 | 0 |
| `/system/`·`/404.html` | 0 | 0 |
| `/archive/` (기분 4가지) | 3 (서명) + 1 (측정 착시) | 0 |

원본 출력: [contrast-before.txt](2026-10-26/contrast-before.txt) · [contrast-after.txt](2026-10-26/contrast-after.txt). 서명은 그림 위에 놓여 자동 측정이 하늘색을 배경으로 잡았다. 실제로 겹치는 아래 띠 색 기준 값은 점검표 3번에 적었다.

## 스크린샷

`docs/design-audit/2026-10-26/` 아래, `before-|after-` + 페이지 + 폭.

| 페이지 | 375 | 768 | 1440 |
| --- | --- | --- | --- |
| 홈 전체 | [전](2026-10-26/before-home-375.jpg) · [후](2026-10-26/after-home-375.jpg) | [전](2026-10-26/before-home-768.jpg) · [후](2026-10-26/after-home-768.jpg) | [전](2026-10-26/before-home-1440.jpg) · [후](2026-10-26/after-home-1440.jpg) |
| 홈 기분 코너 확대 | [전](2026-10-26/before-mood-375.jpg) · [후](2026-10-26/after-mood-375.jpg) | [전](2026-10-26/before-mood-768.jpg) · [후](2026-10-26/after-mood-768.jpg) | [전](2026-10-26/before-mood-1440.jpg) · [후](2026-10-26/after-mood-1440.jpg) |
| 회사 소개 | [전](2026-10-26/before-organization-375.jpg) · [후](2026-10-26/after-organization-375.jpg) | [전](2026-10-26/before-organization-768.jpg) · [후](2026-10-26/after-organization-768.jpg) | [전](2026-10-26/before-organization-1440.jpg) · [후](2026-10-26/after-organization-1440.jpg) |
| 입타 | [전](2026-10-26/before-ipta-375.jpg) · [후](2026-10-26/after-ipta-375.jpg) | [전](2026-10-26/before-ipta-768.jpg) · [후](2026-10-26/after-ipta-768.jpg) | [전](2026-10-26/before-ipta-1440.jpg) · [후](2026-10-26/after-ipta-1440.jpg) |
| 만드는 방식(점검만) | [전](2026-10-26/before-system-375.jpg) · [후](2026-10-26/after-system-375.jpg) | [전](2026-10-26/before-system-768.jpg) · [후](2026-10-26/after-system-768.jpg) | [전](2026-10-26/before-system-1440.jpg) · [후](2026-10-26/after-system-1440.jpg) |

링크 색 변화(①·②)는 파랑 두 단계 차이라 축소 화면에서는 잘 안 보인다. 수치는 대비 측정 결과를 본다.

## 추가 제안 (이번 PR 범위 밖)

- 홈 카드 표식 `↔`·`⌁`를 실제 그림이나 글자 없는 배치로 바꾸기 — `index.astro` 열린 PR(#57·#58)이 정리된 뒤.
- 기분 코너 안내 문구의 「당신」 표현 다듬기 — `src/data/i18n-en.json` 영어 사전과 함께 바꿔야 한다.
- `site.css`의 쓰지 않는 옛 홈 규칙(`.home-hero`·`.hero-visual`·`.record-band`·`.subpage-*` 등) 정리.
