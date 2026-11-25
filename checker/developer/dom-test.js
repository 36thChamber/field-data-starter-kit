// DOM emulation only: does not replace real-browser/file-system QA.
const {JSDOM}=require('jsdom');
const fs=require('fs'),assert=require('node:assert/strict');const html=fs.readFileSync('field-data-check.html','utf8');let n=0, downloads=[];
const dom=new JSDOM(html,{runScripts:'dangerously',beforeParse(w){w.TextDecoder=TextDecoder;w.URL.createObjectURL=b=>{downloads.push(b);return 'blob:test'};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};}});
const w=dom.window,d=w.document,$=id=>d.getElementById(id);const click=id=>$(id).click();const change=id=>$(id).dispatchEvent(new w.Event('change'));
function test(name,f){f();n++;console.log('PASS '+name)}
const tick=()=>new Promise(r=>setImmediate(r));
async function upload(text,name='test.csv',size=Buffer.byteLength(text)){Object.defineProperty($('file'),'files',{configurable:true,value:[{name,size,arrayBuffer:async()=>new TextEncoder().encode(text).buffer}]});change('file');await tick();}
(async()=>{
test('initial results hidden',()=>assert($('resultsArea').classList.contains('hidden')));
click('sample');test('sample preview populated',()=>{assert.equal($('preview').querySelectorAll('tbody tr').length,4);assert(!$('configure').classList.contains('hidden'))});
click('run');test('sample results 4 total 3 review 1 pass',()=>{assert.equal($('total').textContent,'4');assert.equal($('review').textContent,'3');assert.equal($('pass').textContent,'1')});
click('run');test('repeated run stable',()=>assert.equal($('review').textContent,'3'));
$('onlyIssues').checked=false;change('onlyIssues');test('all records view',()=>assert.equal($('results').querySelectorAll('tbody tr').length,4));
click('export');test('export triggered',()=>assert.equal(downloads.length,1));
$('dateCol').value='';change('dateCol');test('configuration invalidates results',()=>assert($('resultsArea').classList.contains('hidden')));click('run');test('date off still coherent',()=>assert.equal($('review').textContent,'3'));
click('reset');test('reset clears preview state',()=>{assert.equal($('status').textContent,'No file loaded.');assert.equal($('preview').children.length,0);assert($('configure').classList.contains('hidden'))});
await upload(fs.readFileSync('sample_field_data.csv','utf8'));click('run');test('synthetic upload all pass',()=>{assert.equal($('total').textContent,'3');assert.equal($('review').textContent,'0')});
await upload('key;lat;lon\na;20;30\nb;21;31');test('semicolon upload detected',()=>assert($('status').textContent.includes('delimiter: ;')));$('idCol').value='key';$('latCol').value='lat';$('lonCol').value='lon';['idCol','latCol','lonCol'].forEach(change);click('run');test('custom columns no date pass',()=>assert.equal($('pass').textContent,'2'));
await upload('record_id,latitude,longitude\n"<img src=x onerror=alert(1)>",2,3');click('run');test('HTML text escaped in preview/results',()=>{assert.equal(d.querySelectorAll('img').length,0);assert($('preview').textContent.includes('<img'))});
await upload('a,a\n1,2');test('malformed upload no stale result',()=>{assert(!$('error').classList.contains('hidden'));assert($('resultsArea').classList.contains('hidden'));assert($('configure').classList.contains('hidden'))});
await upload('x','large.csv',6*1024*1024);test('oversize rejects with status',()=>{assert($('error').textContent.includes('Maximum'));assert.equal($('status').textContent,'No usable file loaded.')});
click('sample');$('lonCol').value='latitude';change('lonCol');click('run');test('duplicate role UI error',()=>assert($('error').textContent.includes('different column')));
click('reset');click('sample');click('run');test('reset reload returns stable sample',()=>assert.equal($('review').textContent,'3'));
// Simulate a read that completes only after Reset.
let resolve;Object.defineProperty($('file'),'files',{configurable:true,value:[{name:'late.csv',size:5,arrayBuffer:()=>new Promise(r=>resolve=r)}]});change('file');click('reset');resolve(new TextEncoder().encode('a,b\n1,2').buffer);await tick();test('stale async read ignored after reset',()=>assert.equal($('status').textContent,'No file loaded.'));
console.log(n+' DOM-emulation tests passed');w.close();
})().catch(e=>{console.error(e);process.exitCode=1;w.close()});
