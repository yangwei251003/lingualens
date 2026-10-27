/* Original implementation. Shared by isolated content script and tests. */
globalThis.LLCore = (() => {
 const text = s => String(s ?? '').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"').trim();
 function normalize(rows) {
   const seen = new Set();
   return rows.filter(r=>Number.isFinite(+r.start)&&+r.start>=0&&text(r.text)).map(r=>({start:+r.start,end:Math.max(+r.start+.1,Number.isFinite(+r.end)?+r.end:+r.start+3),text:text(r.text).slice(0,6000)})).sort((a,b)=>a.start-b.start).filter(r=>{const k=r.start+'|'+r.text;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,5000);
 }
 function parse(s) {
   const time = x => x.trim().replace(',','.').split(':').reduce((n,v)=>n*60+Number(v),0);
   return normalize(String(s).replace(/^\uFEFF/,'').replace(/\r/g,'').split(/\n\s*\n/).flatMap(block=>{const ls=block.split('\n');const i=ls.findIndex(l=>l.includes('-->'));if(i<0)return [];const [a,b]=ls[i].split('-->');return [{start:time(a),end:time(b.trim().split(/\s/)[0]),text:ls.slice(i+1).join(' ')}];}));
 }
 function json3(j){return normalize((j.events||[]).filter(e=>e.segs).map(e=>({start:e.tStartMs/1000,end:(e.tStartMs+(e.dDurationMs||3000))/1000,text:e.segs.map(s=>s.utf8||'').join('')})));}
 const identity = url=>{const u=new URL(url);return u.hostname==='www.youtube.com' ? 'yt:'+ (u.searchParams.get('v')||u.pathname.split('/shorts/')[1]||'') : 'bili:'+ (u.pathname.match(/\/video\/([^/]+)/)?.[1]||'')+':'+(u.searchParams.get('p')||1);};
 function validateLearning(raw,rows){
   if(!raw||!Array.isArray(raw.sentences)||raw.sentences.length!==rows.length)throw Error('模型句子数量不匹配，请换模型。');
   const sentences=raw.sentences.map((s,i)=>{if(s.id!==i||typeof s.en!=='string'||typeof s.zh!=='string'||!s.en.trim()||!s.zh.trim())throw Error('模型句子对齐错误。');const chinese=/[\u3400-\u9fff]/.test(rows[i].text);if(chinese&&(!/[A-Za-z]{2,}/.test(s.en)||[...s.en.matchAll(/[A-Za-z]/g)].length<=[...s.en.matchAll(/[\u3400-\u9fff]/g)].length*2))throw Error('中文源句未生成英文主体，请更换模型或检查提示。');return {...rows[i],en:chinese?text(s.en):rows[i].text,zh:chinese?rows[i].text:text(s.zh)};});
   const chapters=(raw.chapters||[]).filter(c=>Number.isInteger(c.id)&&c.id>=0&&c.id<rows.length&&typeof c.en==='string'&&typeof c.zh==='string').slice(0,30).map(c=>({start:rows[c.id].start,en:text(c.en),zh:text(c.zh)}));
   return {sentences,chapters,summary:{en:text(raw.summary?.en),zh:text(raw.summary?.zh)},terms:(raw.terms||[]).filter(t=>Number.isInteger(t.id)&&t.id>=0&&t.id<rows.length&&sentences[t.id].en.toLowerCase().includes(String(t.phrase).toLowerCase())).slice(0,30).map(t=>({id:t.id,phrase:text(t.phrase),meaning:text(t.meaning),example:text(t.example)}))};
 }
 const stamp=n=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;
 const tokens=s=>Math.ceil([...String(s)].reduce((n,c)=>n+(/[\u3400-\u9fff]/.test(c)?1.5:1/3),0));
 function batches(rows){const result=[];let part=[],size=0;for(const r of rows){const n=tokens(r.text);if(n>2200)throw Error('单句字幕过长，请先拆分此字幕句。');if(part.length&&(part.length>=12||size+n>600)){result.push(part);part=[];size=0;}part.push(r);size+=n;}if(part.length)result.push(part);return result;}
 const modelBudget=rows=>{const input=rows.reduce((n,r)=>n+tokens(r.text)+20,350);const maxTokens=Math.min(4096,Math.max(900,Math.ceil((input-350)*2.8+500)));return {maxTokens,estimatedTokens:input+maxTokens};};
 function validCachedLearning(value,rows){if(!value)return null;if(!Array.isArray(value.sentences)||value.sentences.length>rows.length||!value.summary||typeof value.summary.en!=='string'||typeof value.summary.zh!=='string')return null;for(let i=0;i<value.sentences.length;i++){const s=value.sentences[i];if(s.start!==rows[i].start||s.end!==rows[i].end||s.text!==rows[i].text||typeof s.en!=='string'||typeof s.zh!=='string')return null;}if(!Array.isArray(value.chapters)||!Array.isArray(value.terms))return null;const times=new Set(value.sentences.map(s=>s.start));if(value.chapters.some(c=>!times.has(c.start)||typeof c.en!=='string'||typeof c.zh!=='string'))return null;if(value.terms.some(t=>!Number.isInteger(t.id)||!value.sentences[t.id]||!value.sentences[t.id].en.toLowerCase().includes(String(t.phrase).toLowerCase())))return null;return value;}
 return {text,normalize,parse,json3,identity,validateLearning,stamp,tokens,batches,modelBudget,validCachedLearning};
})();
