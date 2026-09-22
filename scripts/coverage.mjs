import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { evaluate } from '../src/jev.mjs';
import { policy, previewPolicy, questions, decide } from '../src/gate.mjs';
import { parseCases } from '../src/cases.mjs';
import { summarize } from '../src/report.mjs';
const root = new URL('../', import.meta.url);
const hash = value => createHash('sha256').update(value).digest('hex');
const manifestBytes = await readFile(new URL('fixtures/coverage-en-v1/manifest.json', root));
const manifest = JSON.parse(manifestBytes);
const cases = [], fixtures = [];
for (const group of manifest) {
  const bytes = await readFile(new URL(group.file, root));
  const items = parseCases(bytes.toString('utf8'));
  if (items.length !== 20 || ['save','skip','defer'].some((label,i)=>items.filter(r=>r.expected===label).length!==[10,8,2][i])) throw new Error('invalid_group');
  fixtures.push({ ...group, sha256: hash(bytes) });
  cases.push(...items.map(item => ({ ...item, group: group.key })));
}
if (cases.length !== 100 || new Set(cases.map(r=>r.id)).size !== 100 || new Set(cases.map(r=>r.source)).size !== 100) throw new Error('invalid_suite');
cases.sort((a,b)=>hash('coverage-en-v1:'+a.id).localeCompare(hash('coverage-en-v1:'+b.id)));
if (process.argv.length === 2) { console.log('Validated 100 unique cases in five groups; 50 save / 40 skip / 10 defer. No API calls. Add --live to evaluate once each.'); process.exit(0); }
if (process.argv.length !== 3 || process.argv[2] !== '--live') throw new Error('invalid_arguments');
if (!process.env.TYPESAFE_API_KEY) throw new Error('missing_api_key');
const protocol = await readFile(new URL('evidence/coverage-en-v1/PROTOCOL.md', root));
const report = { kind:'fresh-synthetic-100-case-coverage', startedAt:new Date().toISOString(),
  sourceCommit:execFileSync('git',['-c',`safe.directory=${fileURLToPath(root).replace(/\\/g,'/').replace(/\/$/,'')}`,'rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  manifestSha256:hash(manifestBytes), fixtures, protocolSha256:hash(protocol), questionsSha256:hash(JSON.stringify(questions)),
  requestedModel:'jev-1.13.0', policies:[policy,previewPolicy], questions, plannedCalls:100, attemptedCalls:0, completed:false, results:[] };
const dir = new URL(`runs/coverage-${Date.now()}/`,root); await mkdir(dir,{recursive:true});
const save = async()=>{
  report.summaries=Object.fromEntries(report.policies.map(p=>[p.version,summarize(report.results.map(r=>r.error?r:{...r,...r.decisions[p.version]}))]));
  await writeFile(new URL('report.json',dir),JSON.stringify(report,null,2)+'\n');
};
await save();
for(const item of cases){
  report.attemptedCalls++;
  try {
    const result=await evaluate(item,{apiKey:process.env.TYPESAFE_API_KEY,model:report.requestedModel});
    const decisions=Object.fromEntries(report.policies.map(p=>[p.version,decide(result.answers,p)]));
    report.results.push({...item,...result,decisions});
    console.log(`${report.attemptedCalls}/100 ${item.id}: ${decisions[policy.version].decision} -> ${decisions[previewPolicy.version].decision} (expected ${item.expected})`);
  }catch(error){
    const code=/^(invalid_answers|network_or_timeout|invalid_provider_response|provider_http_\d{3})$/.test(error.message)?error.message:'evaluation_failed';
    report.results.push({...item,error:code});process.exitCode=1;
  }
  await save(); if(process.exitCode) break;
}
report.completed=report.results.length===100&&report.results.every(r=>!r.error);await save();
console.log(JSON.stringify(report.summaries));console.log(fileURLToPath(dir));
