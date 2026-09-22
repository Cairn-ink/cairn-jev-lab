import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseCases } from '../src/cases.mjs';
import { questions, decide } from '../src/gate.mjs';
import { summarize } from '../src/report.mjs';
const root=new URL('../',import.meta.url);
const bytes=path=>readFile(new URL(path,root));
const json=async path=>JSON.parse(await bytes(path));
const hash=value=>createHash('sha256').update(value).digest('hex');
test('100-case dataset is distinct, frozen and complete; dashboard agrees with every response and category',async()=>{
 const report=await json('evidence/coverage-en-v1/report.json');
 const study=await json('web/study.json');
 const manifest=await json('fixtures/coverage-en-v1/manifest.json');
 assert.equal(report.manifestSha256,hash(await bytes('fixtures/coverage-en-v1/manifest.json')));
 assert.equal(report.protocolSha256,hash(await bytes('evidence/coverage-en-v1/PROTOCOL.md')));
 assert.equal(report.questionsSha256,hash(JSON.stringify(questions)));
 const cases=[];
 for(const group of manifest){
  const raw=await bytes(group.file),items=parseCases(raw.toString('utf8'));
  assert.equal(hash(raw),report.fixtures.find(f=>f.key===group.key).sha256);
  assert.equal(items.length,20);
  assert.deepEqual(['save','skip','defer'].map(label=>items.filter(r=>r.expected===label).length),[10,8,2]);
  cases.push(...items.map(r=>({...r,group:group.key})));
 }
 assert.equal(new Set(cases.map(r=>r.id)).size,100);
 assert.equal(new Set(cases.map(r=>r.source)).size,100);
 const old=[...await json('fixtures/english.json'),...await json('fixtures/holdout-en-v1.json'),...await json('fixtures/cases.json')];
 for(const r of cases)assert.equal(old.some(o=>o.source===r.source),false);
 const ordered=cases.slice().sort((a,b)=>hash('coverage-en-v1:'+a.id).localeCompare(hash('coverage-en-v1:'+b.id)));
 assert.equal(report.completed,true);assert.equal(report.attemptedCalls,100);assert.equal(report.results.length,100);
 assert.deepEqual(report.results.map(r=>r.id),ordered.map(r=>r.id));
 for(const r of report.results){
  const c=cases.find(c=>c.id===r.id);
  for(const key of ['source','candidate','expected','why','group'])assert.equal(r[key],c[key]);
  for(const p of report.policies)assert.deepEqual(r.decisions[p.version],decide(r.answers,p));
 }
 assert.equal(study.kind,'coverage-100');assert.equal(study.uniqueCases,100);assert.equal(study.completed,100);
 assert.equal(study.errors,0);assert.deepEqual(study.groups,manifest.map(({key,name})=>({key,name})));
 for(const p of study.policies){
  const all=report.results.map(r=>({...r,...decide(r.answers,p)}));
  assert.deepEqual(p.summary,summarize(all));assert.deepEqual(report.summaries[p.version],p.summary);
  for(let i=0;i<manifest.length;i++)assert.deepEqual(p.groups[i],summarize(all.filter(r=>r.group===manifest[i].key)));
  for(const expected of ['save','skip','defer'])for(const actual of ['save','skip','defer'])
   assert.equal(p.confusion[expected][actual],all.filter(r=>r.expected===expected&&r.decision===actual).length);
 }
 const timing=report.results.map(r=>r.latencyMs).sort((a,b)=>a-b);
 assert.deepEqual(study.latency.values,report.results.map(r=>r.latencyMs));
 assert.equal(study.latency.mean,Math.round(timing.reduce((a,b)=>a+b)/100));
 assert.equal(study.latency.median,(timing[49]+timing[50])/2);assert.equal(study.latency.p95,timing[94]);
 assert.equal(study.latency.min,timing[0]);assert.equal(study.latency.max,timing[99]);
});
