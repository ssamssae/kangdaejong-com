import {test,expect} from '@playwright/test';
import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

// T-261026-008: npm test 는 *.spec.mjs 만 돌린다 — node:test 파일을 집으면 작업자가 안 끝난다.
//   실제 Chrome 채널은 충돌 보고 도우미가 표준 오류를 물고 남아 작업자가 5분 뒤 강제 종료됐다.
const testsDir=fileURLToPath(new URL('.',import.meta.url));
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(join(dir,entry.name)):[join(dir,entry.name)]);

test('runner collects only spec files and keeps the default headless shell',async({},info)=>{
 expect(info.project.testMatch).toBe('**/*.spec.mjs');
 expect(info.project.use.channel).toBeUndefined();
 const nodeTests=walk(testsDir).filter(file=>file.endsWith('.mjs')&&/from ['"]node:test['"]/.test(readFileSync(file,'utf8')));
 expect(nodeTests.length).toBeGreaterThan(0);
 expect(nodeTests.filter(file=>file.endsWith('.spec.mjs'))).toEqual([]);
});
