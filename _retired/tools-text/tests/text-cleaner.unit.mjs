import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Exercise the cleaner actually shipped in the standalone public page.
const html = readFileSync(new URL('../public/tools/text/index.html', import.meta.url), 'utf8');
const cleaner = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(cleaner, 'The standalone cleaner script must exist');
const context = {};
runInNewContext(cleaner, context);
const { cleanText } = context.PasteCleaner;

test('기본 정리는 공백과 빈 줄을 줄이고 의미 있는 줄바꿈을 보존한다', () => {
  assert.equal(cleanText('  안녕하세요.   반가워요.  \r\n  다음 줄입니다.\r\n\r\n\r\n  새 문단.  \n'), '안녕하세요. 반가워요.\n다음 줄입니다.\n\n새 문단.');
});
test('문단 연결은 빈 줄과 목록 경계를 보존한다', () => {
  assert.equal(cleanText('복사한 글이\n중간에 끊겼어요.\n\n새 문단은\n남겨 주세요.\n- 첫 항목\n- 둘째 항목\n마지막 줄', { mode: 'paragraphs' }), '복사한 글이 중간에 끊겼어요.\n\n새 문단은 남겨 주세요.\n- 첫 항목\n- 둘째 항목\n마지막 줄');
});
test('한 줄 모드는 모든 줄바꿈을 공백 하나로 바꾼다', () => {
  assert.equal(cleanText('하나\n둘\n\n셋', { mode: 'single' }), '하나 둘 셋');
});
test('공백 정리를 끄면 탭, 들여쓰기, 연속 공백을 보존한다', () => {
  assert.equal(cleanText('  첫 줄\t\t끝  \n  둘째  줄  ', { spaces: false }), '  첫 줄\t\t끝  \n  둘째  줄  ');
});
test('빈 줄 정리를 끄면 문단 사이 빈 줄 수를 보존한다', () => {
  assert.equal(cleanText('하나\n\n\n\n둘', { blankLines: false }), '하나\n\n\n\n둘');
});
test('보이지 않는 복사 잔여 문자는 지우되 이모지와 언어 결합 문자는 보존한다', () => {
  const family = '👨‍👩‍👧‍👦';
  assert.equal(cleanText('\uFEFF안\u200B녕\u00A0  ' + family + ' می\u200Cروم'), '안녕 ' + family + ' می\u200Cروم');
  assert.equal(cleanText('안\u200B녕', { invisible: false }), '안\u200B녕');
});
test('HTML 같은 글도 그대로 남긴다', () => {
  assert.equal(cleanText(' <img src=x onerror=alert(1)> '), '<img src=x onerror=alert(1)>');
});
test('빈 입력과 공백뿐인 입력은 빈 결과다', () => {
  for (const input of ['', ' \t\n\n ', '\u200B\uFEFF']) assert.equal(cleanText(input), '');
});
test('문단 연결은 제목과 번호 목록을 합치지 않는다', () => {
  assert.equal(cleanText('# 제목\n본문 한 줄\n이어지는 말\n1. 하나\n2. 둘', { mode: 'paragraphs' }), '# 제목\n본문 한 줄 이어지는 말\n1. 하나\n2. 둘');
});
test('정리를 두 번 해도 결과는 같고 단어와 문장부호를 바꾸지 않는다', () => {
  for (const mode of ['keep', 'paragraphs', 'single']) {
    const first = cleanText('  café  中文\n한글,  123!\n\n 👩🏽‍💻  ', { mode });
    assert.equal(cleanText(first, { mode }), first);
    assert.match(first, /café 中文/);
    assert.match(first, /한글, 123!/);
    assert.match(first, /👩🏽‍💻/);
  }
});
