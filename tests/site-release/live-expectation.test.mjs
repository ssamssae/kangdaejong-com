import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// T-261024-038: 10/24 12:29 빌드가 이 PC에 남긴 옛 기대값. 빌드 없이 배포 뒤 검사만 다시 돌리면 이 값으로 실제 사이트를 쟀다.
const RELEASE='public/brand/release.json';
const STALE={schema:1,revision:'f0e1f30827e87592a73d2d06c459ae5f7d5fda04c6631d5ec25af827c3199d39',commit:'6f1b43f4af3345fd23e7a7830f8d11f641d34522',inventoryObservedAt:'2026-10-13T14:59:26.022905+00:00',files:{'brand/current/social.png':'dd2ebedbd4f1cbea9f88178998733dc0b773a83ef1a9a7dc49c4d68888327ff6'}};
test('live check rebuilds a leftover stale release.json from the current checkout', () => {
  const before=existsSync(RELEASE)?readFileSync(RELEASE):null, out=mkdtempSync(path.join(tmpdir(),'live-expectation-'));
  try{
    writeFileSync(RELEASE,JSON.stringify(STALE));
    spawnSync(process.execPath,['--import','./tests/site-release/offline-fetch.mjs','scripts/site-release/live.mjs','--no-screens','--output',out],{encoding:'utf8'});
    const report=JSON.parse(readFileSync(path.join(out,'report.json'),'utf8'));
    assert.equal(report.sourceCommit,execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
    assert.notEqual(report.revision,STALE.revision);
  }finally{
    if(before)writeFileSync(RELEASE,before);else rmSync(RELEASE,{force:true});
    rmSync(out,{recursive:true,force:true});
  }
});
