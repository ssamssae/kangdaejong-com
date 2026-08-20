import { readFileSync } from "node:fs";

// T-260821-006 — 경로를 cwd 기준 상대경로에서 ★스크립트 기준으로 바꾼다.
//   종전에는 repo 루트에서 실행할 때만 동작했고, 다른 디렉토리에서 절대경로로 호출하면
//   ENOENT 로 죽었다. 그 실패는 "검증 실패" 와 구분이 안 돼 ★거짓 빨강을 만든다
//   (실사고: 스윕을 repo 밖에서 돌리다 이 스크립트를 "상시 실패" 로 오판).
//   같은 디렉토리의 verify-shared-header-source.mjs / verify-shared-footer-source.mjs 는
//   이미 이 패턴을 쓴다 — favicon 만 달랐다. 형식을 그쪽에 맞춰 통일한다.
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const indexSource = read("src/pages/index.astro");
const faviconSource = read("public/favicon.svg").trim();
const badgeSource = read("public/minusbeta-badge.svg").trim();

const requiredHeadLinks = [
  '<link rel="icon" href="/favicon.ico" sizes="any" />',
  '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
];

const failures = [];

for (const link of requiredHeadLinks) {
  if (!indexSource.includes(link)) {
    failures.push(`missing head favicon link: ${link}`);
  }
}

if (faviconSource !== badgeSource) {
  failures.push("public/favicon.svg must match public/minusbeta-badge.svg");
}

if (failures.length > 0) {
  console.error("favicon brand verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("favicon brand verification passed");
