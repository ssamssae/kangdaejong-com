import { readFileSync } from "node:fs";

// T-260831-012 — 공개 조직도 현재 로스터는 아테나 + 워커 2(헤르메스·볼칸).
// 라이덴·테미스는 퇴사. 복직 표현으로 되살아나면 이 검사가 빨강.
const source = readFileSync(
  new URL("../src/pages/organization.astro", import.meta.url),
  "utf8",
);

function workerBlock(name) {
  const match = source.match(
    new RegExp(`codename:\\s*"${name}"[\\s\\S]*?desc:\\s*"[^"]*"`),
  );
  if (!match) {
    throw new Error(`missing worker block: ${name}`);
  }
  return match[0];
}

const failures = [];
const hermes = workerBlock("헤르메스");
const vulcan = workerBlock("볼칸");

if (/codename:\s*"라이덴"/.test(source)) {
  failures.push("라이덴 must not appear as a current worker (퇴사)");
}
if (/codename:\s*"테미스"/.test(source)) {
  failures.push("테미스 must not appear as a current worker (퇴사)");
}
if (/워커 4/.test(source) || /four workers/.test(source)) {
  failures.push("stale 워커 4 copy is still present");
}
if (!/워커 2/.test(source)) {
  failures.push("roster comment must say 워커 2");
}
if (/device:\s*"리눅스"/.test(source)) {
  failures.push("no worker may list device 리눅스");
}
if (/개발 · 변경 승인/.test(source)) {
  failures.push("변경 승인을 헤르메스 단독 직함으로 두지 말 것");
}
if (!/반영/.test(hermes)) {
  failures.push("헤르메스 must keep 반영 자격");
}
if (!/반영/.test(vulcan)) {
  failures.push("볼칸 must keep 반영 자격");
}
if (!/맥 미니/.test(vulcan)) {
  failures.push("볼칸 device must stay 맥 미니");
}
if (!/맥북 프로/.test(hermes)) {
  failures.push("헤르메스 device must stay 맥북 프로");
}
if (/배정은 운영 대표를 거칩니다/.test(source)) {
  failures.push("stale exclusive-dispatch copy is still present");
}
if (!/사람 지시/.test(source)) {
  failures.push("page must say 사람 지시가 있으면 그 자리에서 착수");
}

if (failures.length > 0) {
  console.error("organization roster verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("organization roster verification passed");
