#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
export const commandNames=['vendors','profiles','policies','renewals-due','review-queue','requirements-check','compliance','attention','weekly-review','record','history','add-profile','add-rule','add-vendor','add-policy','review','assign-profile','log','retention-review','import','export','draft-renewal','help'];
const tables=['profiles','rules','vendors','policies','reviews','activity'];
export function day(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw Error('Expected a valid YYYY-MM-DD date');return s;}
function code(s){if(!/^[A-Z0-9_-]+$/i.test(s||''))throw Error('Code requires letters, digits, underscores or hyphens');return s.toUpperCase();}
function amount(s){if(!/^\d{1,14}(\.\d{1,2})?$/.test(String(s)))throw Error('Amount must be a nonnegative decimal with at most two decimal places');return String(s);}
export function moneyCents(s){const [whole,fraction='']=String(s).split('.');return BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));}
function currency(s){if(!/^[A-Z]{3}$/.test(s||''))throw Error('Currency requires three uppercase letters');return s;}
function bool(s){if(s===true||s==='true')return true;if(s===false||s==='false')return false; if(s===undefined||s===null||s==='')return null;throw Error('Boolean must be true or false; empty means unknown');}
const required=(v,n)=>{if(typeof v!=='string'||!v.trim())throw Error('Required: '+n);return v.trim();};
function argsOf(args){const flags={},pos=[];for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');const key=a.slice(2,i<0?undefined:i);if(key in flags)throw Error('Repeated flag: '+key);flags[key]=i<0?true:a.slice(i+1);}else pos.push(a);}return {flags,pos};}
async function resolve(db,table,term){required(term,'record');const rows=await db.query(`select * from certificates.${table} where lower(code)=lower($1) ${table==='policies'?'':'or lower(name)=lower($1)'}`,[term]);if(rows.length===1)return rows[0];const candidates=await db.query(`select * from certificates.${table} where id::text ilike $1 or code ilike $2 ${table==='policies'?'':'or name ilike $2'} order by code`,[term+'%', '%'+term+'%']);if(candidates.length!==1)throw Error((candidates.length?'Ambiguous':'Not found')+': '+term+'\n'+display(candidates.map(x=>({id:x.id,code:x.code,...(x.name?{name:x.name}:{})}))));return candidates[0];}
async function activity(db,vendor,action,actor,note,payload={}){await db.query('insert into certificates.activity(vendor_id,action,actor,note,payload) values($1,$2,$3,$4,$5)',[vendor,action,actor,note,JSON.stringify(payload)]);}
async function atomic(db,fn,dry=false){await db.exec('BEGIN');try{const result=await fn();await db.exec(dry?'ROLLBACK':'COMMIT');return dry?{dry_run:true,result}:result;}catch(e){await db.exec('ROLLBACK');throw e;}}
export async function checks(db,on){
 const vendors=await db.query('select v.*,pr.code as profile from certificates.vendors v left join certificates.profiles pr on pr.id=v.profile_id where v.active order by v.code');
 const rules=await db.query('select * from certificates.rules order by coverage');
 const policies=await db.query('select * from certificates.policy_evidence order by code');const out=[];
 for(const v of vendors){const rs=rules.filter(r=>r.profile_id===v.profile_id);if(!rs.length){out.push({vendor:v.code,coverage:'all',policy:'',state:'review',finding:'NO_REQUIREMENTS',owner:v.owner});continue;}
 for(const r of rs){const candidates=policies.filter(p=>p.vendor_id===v.id&&p.coverage===r.coverage);const assessed=candidates.map(p=>{const gaps=[];
 if(p.effective_on>on)gaps.push('NOT_YET_EFFECTIVE');if(p.expires_on<=on)gaps.push('EXPIRED');
 if(p.currency!==r.currency)gaps.push('CURRENCY_MISMATCH');else if(moneyCents(p.limit_amount)<moneyCents(r.minimum_amount))gaps.push('LOW_LIMIT');
 if(!p.evidence_ref)gaps.push('NO_DOCUMENT_REFERENCE');
 if(p.verdict!=='verified'||new Date(p.reviewed_at)<new Date(p.updated_at))gaps.push('REVIEW_REQUIRED');
 if(r.additional_insured&&p.additional_insured!==true)gaps.push('ADDITIONAL_INSURED_UNCONFIRMED');
 if(r.waiver&&p.waiver!==true)gaps.push('WAIVER_UNCONFIRMED');
 return {p,gaps};}).sort((a,b)=>a.gaps.length-b.gaps.length||a.p.code.localeCompare(b.p.code));
 const best=assessed[0];out.push({vendor:v.code,coverage:r.coverage,policy:best?.p.code||'',state:best&&!best.gaps.length?'record checks met':'review',finding:best?(best.gaps.join(', ')||'RECORDED_REQUIREMENTS_MET'):'MISSING_COVERAGE',owner:v.owner});
 }}return out;
}
async function importCsv(db,pos,f,actor){
 if(pos[1]!=='coisoftware')throw Error('Import supports coisoftware');const file=required(pos[2],'CSV file');
 const mapping=JSON.parse(fs.readFileSync(required(f.mapping,'--mapping'), 'utf8'));const kind=mapping.kind;if(!['vendors','policies'].includes(kind))throw Error('Mapping kind must be vendors or policies');
 const fields=kind==='vendors'?['code','name','owner','region']:['code','vendor','coverage','policy_number','insurer','currency','limit_amount','effective_on','expires_on','additional_insured','waiver','evidence_ref'];
 const needed=kind==='vendors'?['code','name']:['code','vendor','coverage','policy_number','insurer','currency','limit_amount','effective_on','expires_on'];
 for(const k of Object.keys(mapping.columns||{}))if(!fields.includes(k))throw Error('Unknown mapping field: '+k);
 for(const k of needed)required(mapping.columns?.[k],'mapping.columns.'+k);
 const rows=parseCsv(fs.readFileSync(file,'utf8'));if(!rows.length)throw Error('CSV contains no records');const codes=new Set();const prepared=rows.map((raw,i)=>{const r={};for(const [field,header] of Object.entries(mapping.columns)){if(!(header in raw))throw Error(`CSV row ${i+2}: missing mapped column ${header}`);r[field]=raw[header];}r.code=code(r.code);if(codes.has(r.code))throw Error('Duplicate source code: '+r.code);codes.add(r.code);for(const k of needed)required(r[k],k);if(kind==='policies'){r.limit_amount=amount(r.limit_amount);currency(r.currency);day(r.effective_on);day(r.expires_on);if(r.expires_on<=r.effective_on)throw Error('Expiry must follow effective date');r.additional_insured=bool(r.additional_insured);r.waiver=bool(r.waiver);}return {r,raw};});
 return atomic(db,async()=>{let added=0,unchanged=0;for(const {r,raw} of prepared){const old=(await db.query(`select * from certificates.${kind} where code=$1`,[r.code]))[0];const source={vendor:'coisoftware',mapping,raw};if(old){if(JSON.stringify(canonical(old.source_payload))!==JSON.stringify(canonical(source)))throw Error('Changed source or code collision: '+r.code+'. Review the change; never overwrite reviewed evidence.');unchanged++;continue;}
 let vid;if(kind==='vendors'){const v=(await db.query('insert into certificates.vendors(code,name,owner,region,source_payload) values($1,$2,$3,$4,$5) returning id',[r.code,r.name,r.owner||'',r.region||'',JSON.stringify(source)]))[0];vid=v.id;}else{const v=await resolve(db,'vendors',r.vendor);vid=v.id;await db.query('insert into certificates.policies(code,vendor_id,coverage,policy_number,insurer,currency,limit_amount,effective_on,expires_on,additional_insured,waiver,evidence_ref,source_payload) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',[r.code,vid,r.coverage,r.policy_number,r.insurer,r.currency,r.limit_amount,r.effective_on,r.expires_on,r.additional_insured,r.waiver,r.evidence_ref||'',JSON.stringify(source)]);}
 await activity(db,vid,'import',actor,'Imported '+r.code,{kind,code:r.code});added++;}return {kind,added,unchanged};},Boolean(f['dry-run']));
}
function canonical(v){if(Array.isArray(v))return v.map(canonical);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])]));return v;}
export async function execute(db,args){
 const {flags:f,pos}=argsOf(args);const cmd=pos[0]||'help';
 const allowed={vendors:[],profiles:[],policies:[], 'renewals-due':[],'review-queue':[], 'requirements-check':['on'],compliance:['on'],attention:['on'],'weekly-review':['on'],record:[],history:[],
 'add-profile':['code','name','contract','actor'],'add-rule':['profile','coverage','currency','minimum','additional-insured','waiver','actor'],
 'add-vendor':['code','name','profile','owner','region','retention','actor'],'add-policy':['code','vendor','coverage','number','insurer','currency','limit','effective','expires','additional-insured','waiver','evidence','actor'],
 review:['verdict','evidence','note','actor'],'assign-profile':['profile','actor'],log:['note','actor'],'retention-review':['due','note','actor'],import:['mapping','actor','dry-run'],export:[],'draft-renewal':[],help:[]};
 if(!(cmd in allowed))throw Error('Unknown command: '+cmd);for(const flag of Object.keys(f))if(flag!=='json'&&!allowed[cmd].includes(flag))throw Error('Unknown flag for '+cmd+': --'+flag);
 if(cmd==='help')return commandNames.map(command=>({command}));
 const today=(await db.query('select current_date as today'))[0].today;const on=f.on?day(f.on):today;
 if(cmd==='vendors')return db.query('select * from certificates.vendor_workload');
 if(cmd==='profiles')return db.query('select p.code,p.name,p.contract_ref,r.coverage,r.currency,r.minimum_amount,r.additional_insured,r.waiver from certificates.profiles p left join certificates.rules r on r.profile_id=p.id order by p.code,r.coverage');
 if(cmd==='policies')return db.query('select v.code as vendor,p.code,p.coverage,p.currency,p.limit_amount,p.effective_on,p.expires_on,p.verdict from certificates.policy_evidence p join certificates.vendors v on v.id=p.vendor_id order by v.code,p.code');
 if(cmd==='renewals-due')return db.query('select * from certificates.renewals');
 if(cmd==='review-queue')return db.query('select * from certificates.review_queue');
 if(cmd==='requirements-check')return checks(db,on);
 if(cmd==='compliance'||cmd==='attention'||cmd==='weekly-review'){
 const result=await checks(db,on);const issues=result.filter(r=>r.state==='review');
 const retention=await db.query('select code as vendor,retention_review from certificates.vendors where active and (retention_review is null or retention_review<=$1) order by code',[on]);
 const stale=await db.query("select v.code as vendor,v.owner,max(a.created_at) as last_follow_up from certificates.vendors v left join certificates.activity a on a.vendor_id=v.id and a.action='log' where v.active group by v.id having max(a.created_at) is null or max(a.created_at)<$1::date-interval '14 days' order by v.code",[on]);
 return cmd==='weekly-review'?{as_of:on,requirements:result,renewals:await db.query('select * from certificates.renewals'),retention,follow_up:stale}:cmd==='attention'?{as_of:on,gaps:issues,follow_up:stale}:{as_of:on,gaps:issues,retention};
 }
 if(cmd==='record'){const v=await resolve(db,'vendors',pos[1]);return {vendor:v,policies:await db.query('select * from certificates.policy_evidence where vendor_id=$1 order by code',[v.id]),history:await db.query('select * from certificates.activity where vendor_id=$1 order by created_at,id',[v.id])};}
 if(cmd==='history')return db.query('select a.created_at,v.code as vendor,a.action,a.actor,a.note,a.payload from certificates.activity a left join certificates.vendors v on v.id=a.vendor_id order by a.created_at,a.id');
 if(cmd==='export'){const file=path.resolve(required(pos[1],'export destination'));return atomic(db,async()=>{await db.exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');const data={};for(const table of tables)data[table]=await db.query(`select * from certificates.${table} order by id`);fs.writeFileSync(file,JSON.stringify({format:'insurance-certificates-v1',exported_at:new Date().toISOString(),data},null,2)+'\n',{flag:'wx',mode:0o600});return {file,records:Object.values(data).reduce((n,rs)=>n+rs.length,0)};});}
 if(cmd==='draft-renewal'){const v=await resolve(db,'vendors',pos[1]);const gaps=(await checks(db,today)).filter(r=>r.vendor===v.code&&r.state==='review');const renewals=await db.query('select * from certificates.renewals where vendor=$1',[v.code]);const dir=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true,mode:0o700});const file=path.join(dir,`renewal-${v.code.toLowerCase()}-${randomUUID()}.md`);fs.writeFileSync(file,`# Draft certificate follow-up: ${v.name}\n\nFor review by ${v.owner||'the responsible owner'}. Nothing has been sent.\n\nPlease supply current policy and endorsement evidence for the following recorded gaps and upcoming renewals. A reviewer must check the policy terms.\n\n${display(gaps)}\n\n${display(renewals)}\n`,{flag:'wx',mode:0o600});return {file};}
 const actor=required(f.actor,'--actor');
 if(cmd==='import')return importCsv(db,pos,f,actor);
 return atomic(db,async()=>{
 let result,vendor=null,note='',payload={};
 if(cmd==='add-profile'){result=(await db.query('insert into certificates.profiles(code,name,contract_ref) values($1,$2,$3) returning *',[code(f.code),required(f.name,'--name'),required(f.contract,'--contract')]))[0];note='Added requirement profile '+result.code;}
 if(cmd==='add-rule'){const p=await resolve(db,'profiles',f.profile);result=(await db.query('insert into certificates.rules(profile_id,coverage,currency,minimum_amount,additional_insured,waiver) values($1,$2,$3,$4,$5,$6) returning *',[p.id,required(f.coverage,'--coverage'),currency(f.currency),amount(f.minimum),bool(f['additional-insured'])??false,bool(f.waiver)??false]))[0];note='Added rule to '+p.code;payload={rule:result};}
 if(cmd==='add-vendor'){const p=f.profile?await resolve(db,'profiles',f.profile):null;result=(await db.query('insert into certificates.vendors(code,name,profile_id,owner,region,retention_review) values($1,$2,$3,$4,$5,$6) returning *',[code(f.code),required(f.name,'--name'),p?.id||null,f.owner||'',f.region||'',f.retention?day(f.retention):null]))[0];vendor=result.id;note='Added vendor '+result.code;}
 if(cmd==='add-policy'){const v=await resolve(db,'vendors',f.vendor);vendor=v.id;result=(await db.query('insert into certificates.policies(code,vendor_id,coverage,policy_number,insurer,currency,limit_amount,effective_on,expires_on,additional_insured,waiver,evidence_ref) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning *',[code(f.code),v.id,required(f.coverage,'--coverage'),required(f.number,'--number'),required(f.insurer,'--insurer'),currency(f.currency),amount(f.limit),day(f.effective),day(f.expires),bool(f['additional-insured']),bool(f.waiver),f.evidence||'']))[0];note='Recorded policy '+result.code;}
 if(cmd==='review'){const p=await resolve(db,'policies',pos[1]);vendor=p.vendor_id;const verdict=required(f.verdict,'--verdict');if(!['verified','rejected'].includes(verdict))throw Error('Verdict must be verified or rejected');if(verdict==='verified'&&!p.evidence_ref)throw Error('Verification requires the policy document reference');result=(await db.query('insert into certificates.reviews(policy_id,verdict,actor,evidence,note) values($1,$2,$3,$4,$5) returning *',[p.id,verdict,actor,required(f.evidence,'--evidence'),required(f.note,'--note')]))[0];note='Evidence review '+p.code+': '+verdict;payload={review:result.id};}
 if(cmd==='assign-profile'){const v=await resolve(db,'vendors',pos[1]),p=await resolve(db,'profiles',f.profile);vendor=v.id;result=(await db.query('update certificates.vendors set profile_id=$1 where id=$2 returning *',[p.id,v.id]))[0];note='Assigned requirement profile '+p.code;payload={before:v.profile_id,after:p.id};}
 if(cmd==='retention-review'){const v=await resolve(db,'vendors',pos[1]);vendor=v.id;const due=day(f.due);if(due<=today)throw Error('Next retention review must be in the future');result=(await db.query('update certificates.vendors set retention_review=$1 where id=$2 returning *',[due,v.id]))[0];note=required(f.note,'--note');payload={previous:v.retention_review,due};}
 if(cmd==='log'){const v=await resolve(db,'vendors',pos[1]);vendor=v.id;note=required(f.note,'--note');result={vendor:v.code,note};}
 await activity(db,vendor,cmd,actor,note,payload);return result;
 });
}
export function display(value){if(!Array.isArray(value)){if(value&&typeof value==='object'&&Object.values(value).some(Array.isArray))return Object.entries(value).map(([k,v])=>k+'\n'+display(v)).join('\n\n');return JSON.stringify(value,null,2);}if(!value.length)return '(none)';const cols=Object.keys(value[0]);const text=v=>v===null||v===undefined?'unknown':typeof v==='object'?JSON.stringify(v):String(v);const width=cols.map(c=>Math.min(65,Math.max(c.length,...value.map(r=>text(r[c]).length))));const line=r=>cols.map((c,i)=>text(r[c]).slice(0,width[i]).padEnd(width[i])).join('  ');return [line(Object.fromEntries(cols.map(c=>[c,c]))),width.map(w=>'-'.repeat(w)).join('  '),...value.map(line)].join('\n');}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const result=await execute(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):display(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
