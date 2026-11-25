/* Field Data Check 0.1.0. No dependencies or network access. */
(function(root){
'use strict';
const MAX_ROWS=20000, MAX_COLS=100;
function idKey(v){return v.trim().replace(/ +/g,' ').toLowerCase();}
function parseCSV(input,delimiter=','){
 if(![',',';','\t'].includes(delimiter))throw Error('Unsupported delimiter.');
 const s=String(input).replace(/^\uFEFF/,''); let rows=[],row=[],field='',quoted=false,after=false;
 function cell(){row.push(field);field='';after=false;if(row.length>MAX_COLS)throw Error('Maximum 100 columns exceeded.');}
 function line(){cell();rows.push(row);row=[];if(rows.length>MAX_ROWS+1)throw Error('Maximum 20,000 source records (including blanks) exceeded.');}
 for(let i=0;i<s.length;i++){
  const c=s[i];
  if(quoted){if(c==='"'){if(s[i+1]==='"'){field+='"';i++;}else{quoted=false;after=true;}}else field+=c;continue;}
  if(after&&c!==delimiter&&c!=='\r'&&c!=='\n')throw Error('Unexpected text after a closing quote.');
  if(c==='"'){if(field.length)throw Error('Quote inside an unquoted field.');quoted=true;}
  else if(c===delimiter)cell();
  else if(c==='\r'||c==='\n'){if(c==='\r'&&s[i+1]==='\n')i++;line();}
  else field+=c;
 }
 if(quoted)throw Error('Unclosed quoted field.');
 if(field.length||row.length||after)line();
 if(!rows.length)throw Error('The file is empty.');
 const headers=rows.shift().map(h=>h.trim());
 if(headers.some(h=>!h)||new Set(headers).size!==headers.length)throw Error('Column names must be non-empty and unique after trimming.');
 const nonempty=rows.filter(r=>r.some(v=>v.trim()));
 return {headers,rows:nonempty,skippedBlank:rows.length-nonempty.length};
}
function detectDelimiter(text){
 let candidates=[',',';','\t'].map(d=>{try{const p=parseCSV(text,d);let widths=p.rows.slice(0,30).map(r=>r.length);let consistent=widths.filter(n=>n===p.headers.length).length;return {delimiter:d,width:p.headers.length,score:p.headers.length>1?consistent+100:0};}catch(e){return {delimiter:d,width:0,score:-1};}}).sort((a,b)=>b.score-a.score);
 if(candidates[0].score<=0)throw Error('Delimiter could not be detected. Select comma, semicolon or tab explicitly.');
 if(candidates[0].score===candidates[1].score)throw Error('Ambiguous delimiter. Select it explicitly and inspect the preview.');
 return candidates[0].delimiter;
}
function number(s){return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(s)&&Number.isFinite(Number(s));}
function isoDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;let[y,m,d]=s.split('-').map(Number);if(y<1||m<1||m>12||d<1)return false;let days=[31,y%4===0&&(y%100!==0||y%400===0)?29:28,31,30,31,30,31,31,30,31,30,31];return d<=days[m-1];}
function validate(parsed,map,required=[]){
 const {headers,rows}=parsed; let selected=[map.id,map.lat,map.lon].concat(map.date?[map.date]:[]);
 if(selected.some(x=>!headers.includes(x)))throw Error('Map ID, latitude and longitude to existing columns. Date is optional.');
 if(new Set(selected).size!==selected.length)throw Error('Each mapped role must use a different column.');
 if(required.some(x=>!headers.includes(x)))throw Error('A required column is missing.');
 const idx=Object.fromEntries(headers.map((h,i)=>[h,i])); const counts=new Map();
 rows.forEach(r=>{let id=(r[idx[map.id]]||'').trim();if(id)counts.set(idKey(id),(counts.get(idKey(id))||0)+1);});
 return rows.map((r,i)=>{
  const get=k=>(r[idx[k]]||'').trim(),issues=[];
  if(r.length!==headers.length)issues.push('Column count differs from header ('+r.length+' vs '+headers.length+')');
  const req=[...new Set(selected.concat(required))]; req.forEach(h=>{if(!get(h))issues.push('Missing '+h);});
  if(get(map.id)&&counts.get(idKey(get(map.id)))>1)issues.push('Duplicate ID (case-insensitive, repeated spaces normalized)');
  [[map.lat,-90,90],[map.lon,-180,180]].forEach(([h,min,max])=>{let v=get(h);if(v&&!number(v))issues.push(h+': not a dot-decimal number');else if(v&&(Number(v)<min||Number(v)>max))issues.push(h+': outside '+min+' to '+max);});
  if(required.includes('value')&&get('value')&&!number(get('value')))issues.push('value: not a dot-decimal number');
  if(map.date&&get(map.date)&&!isoDate(get(map.date)))issues.push(map.date+': invalid YYYY-MM-DD calendar date');
  return {record:i+1,id:r[idx[map.id]]||'',status:issues.length?'REVIEW':'PASS',issues};
 });
}
function safeCell(value){let s=String(value);if(/^[\s\uFEFF]*[=+\-@]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function reportCSV(results){return '\uFEFF'+[['data_record','record_id','status','issues'],...results.map(r=>[r.record,r.id,r.status,r.issues.join('; ')])].map(r=>r.map(safeCell).join(',')).join('\r\n');}
root.FieldCheck={parseCSV,detectDelimiter,validate,number,isoDate,safeCell,reportCSV,MAX_ROWS};
if(typeof module!=='undefined')module.exports=root.FieldCheck;
})(typeof globalThis!=='undefined'?globalThis:this);
