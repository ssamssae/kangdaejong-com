# 복붙 정리기 보관본 (종료 2026-11-18, T-261118-011)

대종님 「kangdaejong.com 복붙정리기는 오프보딩하자 나도안쓰는거」로 공개를 마쳤다.

- `public/` = 옛 `public/tools/text/`(독립 HTML·CSS·Pretendard 글꼴·OFL). 배포 폴더 밖이라 사이트에 올라가지 않는다.
- `tests/` = 옛 `tests/text-cleaner.spec.mjs`·`text-cleaner.unit.mjs`. `tests/` 밖이라 playwright 가 돌리지 않는다.
- 옛 주소 `/tools/text/` 는 `public/_redirects` 에서 작업장 종료 목록으로 301.
- 다시 열려면 두 폴더를 원래 자리로 옮기고 `_redirects`·`public/brand/sites.json`·홈 카드·번역 키를 이 커밋 이전으로 되돌린다.
