export function parseModelJSON(text){if(typeof text!=='string')throw new SyntaxError('invalid_model_json');let value=text.trim();const fence=value.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);if(fence)value=fence[1].trim();return JSON.parse(value);}
export function validateConnectionLearning(raw,rows,validate){
 const value=validate(raw,rows);const english=s=>typeof s==='string'&&s.trim().length>0&&/[A-Za-z]{2,}/.test(s)&&([...s.matchAll(/[A-Za-z]/g)].length>[...s.matchAll(/[\u3400-\u9fff]/g)].length*2);
 if(!value.sentences.every(s=>english(s.en)))throw Error('CONNECTION_ENGLISH_REQUIRED');
 if(!english(value.summary.en)||!value.summary.zh.trim()||!/[\u3400-\u9fff]/.test(value.summary.zh))throw Error('CONNECTION_SUMMARY_REQUIRED');
 if(rows.length!==2||value.sentences.length!==2||!value.sentences.every((s,i)=>english(s.en)&&s.start===rows[i].start&&s.end===rows[i].end&&s.text===rows[i].text)||!english(value.summary.en)||!value.summary.zh.trim())throw Error('连接响应格式或语言对齐不完整：需要两句英文主体、保留原时间轴及非空双语摘要；质量需另行检查。');
 return value;
}
