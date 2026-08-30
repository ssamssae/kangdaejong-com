import { readFileSync } from "node:fs";

// T-260830-053 — 공개 조직도 스테프가 routes.yaml 과 어긋나면 이 검사가 빨강.
//   실사고 축: 라이덴 기기를 「리눅스」로 두거나, 반영 자격을 헤르메스 한 자리에만 적기.
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
const raiden = workerBlock("라이덴");
const hermes = workerBlock("헤르메스");
const vulcan = workerBlock("볼칸");
const themis = workerBlock("테미스");

if (/device:\s*"리눅스"/.test(source)) {
  failures.push("no worker may list device 리눅스 (라이덴은 윈도우)");
}
if (!/device:\s*"윈도우"/.test(raiden)) {
  failures.push("라이덴 device must be 윈도우");
}
if (!/안드로이드/.test(raiden)) {
  failures.push("라이덴 desc must mention 안드로이드");
}
if (/반영/.test(raiden)) {
  failures.push("라이덴 must not claim 반영 자격");
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
if (!/반영/.test(themis)) {
  failures.push("테미스 must keep 반영 자격");
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
