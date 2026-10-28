// 첫이름 처리방침: cheotireum-ait app/src/copy.ts 와 이 사이트 빌드 HTML 을 공백 정규화로 비교한다.
// 원문 저장소는 비공개라 CI 에 넣지 않는다. 로컬 copy.ts 경로를 인자로 받는다.
// 사용: node scripts/check-cheotireum-privacy-sync.mjs <copy.ts> [dist/privacy-cheotireum-app/index.html]
// ${PRIVACY_EFFECTIVE_DATE} 는 copy.ts 상수로, ${BUSINESS.owner}·${BUSINESS.email} 은 같은 폴더 business.ts 값으로 푼다.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const H1 = '첫이름 개인정보 처리방침';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function skipWs(source, index) {
  while (index < source.length && /\s/.test(source[index])) index += 1;
  return index;
}

function readQuoted(source, index) {
  const quote = source[index];
  if (quote !== '"' && quote !== "'" && quote !== '`') fail(`문자열 시작이 아님: ${source.slice(index, index + 40)}`);
  let value = '';
  for (let i = index + 1; i < source.length; i += 1) {
    const char = source[i];
    if (char === '\\') {
      const next = source[i + 1];
      value += next === 'n' ? '\n' : next === 't' ? '\t' : next;
      i += 1;
      continue;
    }
    if (char === quote) return { value, index: i + 1 };
    value += char;
  }
  fail('문자열이 닫히지 않음');
}

function substitute(value, ctx) {
  return value.replace(/\$\{([^}]+)\}/g, (_, expr) => {
    if (expr === 'PRIVACY_EFFECTIVE_DATE') return ctx.date;
    if (expr === 'BUSINESS.owner') return ctx.owner;
    if (expr === 'BUSINESS.email') return ctx.email;
    fail(`알 수 없는 템플릿: \${${expr}}`);
  });
}

function readBody(source, index, ctx) {
  index = skipWs(source, index);
  if (source[index] !== '[') {
    const text = readQuoted(source, index);
    return { value: substitute(text.value, ctx), index: text.index };
  }
  index += 1;
  const parts = [];
  while (true) {
    index = skipWs(source, index);
    if (source[index] === ']') {
      index += 1;
      break;
    }
    const text = readQuoted(source, index);
    parts.push(substitute(text.value, ctx));
    index = skipWs(source, text.index);
    if (source[index] === ',') {
      index += 1;
      continue;
    }
    if (source[index] === ']') {
      index += 1;
      break;
    }
    fail(`배열 구문 오류: ${source.slice(index, index + 40)}`);
  }
  index = skipWs(source, index);
  const join = source.slice(index).match(/^\.join\(\s*(["'`])\\n\1\s*\)/);
  if (!join) fail(`join("\\n") 가 아님: ${source.slice(index, index + 40)}`);
  return { value: parts.join('\n'), index: index + join[0].length };
}

export function loadCheotireumPrivacy(copyPath) {
  const source = readFileSync(copyPath, 'utf8');
  const date = source.match(/export const PRIVACY_EFFECTIVE_DATE\s*=\s*"([^"]*)"/)?.[1];
  if (!date) fail('PRIVACY_EFFECTIVE_DATE 없음');
  const businessPath = path.join(path.dirname(copyPath), 'business.ts');
  if (!existsSync(businessPath)) fail(`business.ts 가 copy.ts 옆에 없음: ${businessPath}`);
  const business = readFileSync(businessPath, 'utf8');
  const owner = business.match(/"owner"\s*:\s*"([^"]*)"/)?.[1];
  const email = business.match(/"email"\s*:\s*"([^"]*)"/)?.[1];
  if (!owner || !email) fail('business.ts 의 owner·email 없음');
  const ctx = { date, owner, email };
  const marker = source.indexOf('export const PRIVACY_POLICY');
  if (marker < 0) fail('PRIVACY_POLICY 없음');
  let index = source.indexOf('[', source.indexOf('=', marker));
  if (index < 0) fail('PRIVACY_POLICY 배열 없음');
  index += 1;
  const items = [];
  while (true) {
    index = skipWs(source, index);
    if (source[index] === ']') break;
    if (source[index] !== '{') fail(`항목 시작이 아님: ${source.slice(index, index + 40)}`);
    index += 1;
    index = skipWs(source, index);
    const titleKey = source.slice(index).match(/^title\s*:\s*/);
    if (!titleKey) fail('title 없음');
    index += titleKey[0].length;
    const title = readQuoted(source, index);
    index = skipWs(source, title.index);
    if (source[index] !== ',') fail('title 뒤 쉼표 없음');
    index += 1;
    index = skipWs(source, index);
    const bodyKey = source.slice(index).match(/^body\s*:\s*/);
    if (!bodyKey) fail('body 없음');
    index += bodyKey[0].length;
    const body = readBody(source, index, ctx);
    index = skipWs(source, body.index);
    if (source[index] === ',') index += 1;
    index = skipWs(source, index);
    if (source[index] !== '}') fail('항목이 닫히지 않음');
    index += 1;
    items.push({ title: substitute(title.value, ctx), body: body.value });
    index = skipWs(source, index);
    if (source[index] === ',') {
      index += 1;
      continue;
    }
    if (source[index] === ']') break;
    fail(`항목 구분 오류: ${source.slice(index, index + 40)}`);
  }
  if (items.length !== 12) fail(`항목 수 ${items.length} (12 필요)`);
  return { date, owner, email, items };
}

function norm(value) {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function visibleText(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h1|h2|h3|li|div|section)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
  return norm(text);
}

function mainHtml(html) {
  const match = html.match(/<main\b[^>]*\bid="main-content"[^>]*>([\s\S]*?)<\/main>/i);
  if (!match) fail('main#main-content 없음');
  return match[1];
}

function defaultHtml() {
  for (const file of ['dist/privacy-cheotireum-app/index.html', 'dist/privacy-cheotireum-app.html']) {
    if (existsSync(file)) return file;
  }
  fail('빌드 HTML 없음. npm run build 후 dist/privacy-cheotireum-app/index.html 을 확인하세요.');
}

function compare(policy, html) {
  const actual = visibleText(mainHtml(html));
  let from = 0;
  let matched = 0;
  const misses = [];
  for (const item of policy.items) {
    const chunk = norm(`${item.title} ${item.body}`);
    const at = actual.indexOf(chunk, from);
    if (at < 0) misses.push(item.title);
    else {
      matched += 1;
      from = at + chunk.length;
    }
  }
  const expected = norm([
    H1,
    `시행일: ${policy.date}`,
    ...policy.items.flatMap((item) => [item.title, item.body]),
  ].join('\n'));
  if (matched === 12 && actual === expected) {
    console.log('일치 12/12');
    return;
  }
  console.log(`일치 ${matched}/12`);
  if (misses.length) console.log(misses.map((title) => `다름: ${title}`).join('\n'));
  if (matched === 12 && actual !== expected) console.log('제목·본문 12개는 있고, 본문에 원문 밖 문장이 있습니다.');
  process.exit(1);
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const copyPath = process.argv[2];
  if (!copyPath) fail('사용법: node scripts/check-cheotireum-privacy-sync.mjs <copy.ts> [html]');
  const htmlPath = process.argv[3] || defaultHtml();
  compare(loadCheotireumPrivacy(copyPath), readFileSync(htmlPath, 'utf8'));
}
