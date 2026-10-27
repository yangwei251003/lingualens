// Never display provider error.message: it may reflect credentials or transcript text.
const codes=Object.freeze({'AllocationQuota.FreeTierOnly':'此模型或区域免费额度耗尽：检查控制台额度与免费限制；不自动启用付费。',output_truncated:'输出达到Token上限：缩短批次；未接受截断结果。',model_refusal:'模型拒绝输出：未接受此结果，请检查内容或改用批准服务。',empty_content:'模型返回空内容：未接受此结果，请检查模型兼容性。',json_validate_failed:'输出JSON校验失败：缩短字幕批次或换支持结构化输出的模型。',context_length_exceeded:'上下文超限：缩短字幕批次。',token_limit_exceeded:'Token限制：缩短批次或等待额度恢复。',model_not_found:'模型不可用：核对服务端模型ID和账户权限。',invalid_api_key:'认证失败：在设置页检查或更换Key。',rate_limit_exceeded:'服务限流：等待冷却或使用已批准的备用服务。',insufficient_quota:'服务额度不足：检查免费额度；不要自动启用付费。',invalid_request_error:'请求参数不受支持：核对模型、端点与输出模式。'});
const params=new Set(['model','response_format','response_format.json_schema','response_format.json_schema.schema','max_tokens','max_completion_tokens','reasoning_effort','temperature','messages']);
const googleStatuses=new Set(['INVALID_ARGUMENT','UNAUTHENTICATED','PERMISSION_DENIED','RESOURCE_EXHAUSTED','NOT_FOUND','INTERNAL','UNAVAILABLE','DEADLINE_EXCEEDED','FAILED_PRECONDITION']);
const types=new Set(['invalid_request_error','authentication_error','rate_limit_error','server_error']);
export async function safeAPIError(response){
 let code='',type='',param='',googleStatus='',googleCode=null,reason='';const reader=response.body?.getReader();
 try{if(reader){const parts=[];let size=0;while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>16384){await reader.cancel();return {code:'',type:'',param:'',diagnostic:'错误体过大，已忽略；请核对供应商控制台。'};}parts.push(part.value);}const bytes=new Uint8Array(size);let at=0;for(const p of parts){bytes.set(p,at);at+=p.length;}const e=JSON.parse(new TextDecoder().decode(bytes)).error;googleStatus=googleStatuses.has(e?.status)?e.status:'';googleCode=[400,401,403,404,408,409,412,429,500,502,503,504].includes(e?.code)?e.code:null;reason=Array.isArray(e?.details)&&e.details.some(d=>d?.reason==='API_KEY_INVALID')?'API_KEY_INVALID':'';code=typeof e?.code==='string'&&Object.hasOwn(codes,e.code)?e.code:'';param=typeof e?.param==='string'&&params.has(e.param)?e.param:'';type=typeof e?.type==='string'&&types.has(e.type)?e.type:'';}}
 catch{}finally{reader?.releaseLock();}
 return {code,type,param,googleStatus,googleCode,reason,diagnostic:codes[code]||(response.status===400?'请求被拒绝：核对模型ID、输出模式及Token限制；未确定具体原因。':response.status===401||response.status===403?'认证或权限失败：检查Key及模型访问资格。':'请检查供应商额度和服务状态。')};
}

export class SafeResponseError extends Error{constructor(code){super(codes[code]||'模型响应无效');this.name='SafeResponseError';this.code=Object.hasOwn(codes,code)?code:'';}}

export function formatDiagnostic(value){
 const phases={'http-network':'HTTP连接','http-service':'服务拒绝','response-json':'HTTP响应JSON','learning-validation':'模型JSON/语言/对齐','prepare':'本地准备','success':'本次校验通过'};
 const failures={network_failed:'连接失败（网络/代理/CORS/重定向，未取得HTTP状态）',request_timeout:'超时',invalid_response_json:'HTTP响应JSON无效',invalid_model_json:'模型内容JSON无效',english_primary_missing:'英文主体缺失',bilingual_summary_missing:'双语摘要缺失',learning_alignment_failed:'句子ID/时间轴对齐失败',request_setup_failed:'本地参数准备失败'};
 if(value?.staleTest)return '上次测试来自其他设置/构建版本；不能代表当前配置。未发新请求。';const d=value?.diagnostic;if(!d&&value?.testStatus==='pending')return '本次测试仍进行中；不要重复点击。';if(!d&&value?.testStatus==='failed')return '本次测试失败，但没有新的HTTP诊断（可能在配额/许可门控前停止）；未复用旧成功结果。';if(!d)return '暂无已保存的分层诊断。不要重复测试；先核对页面/后台/路由版本。历史旧版泛化错误无法追溯。';
 const status=Number.isInteger(d.httpStatus)&&d.httpStatus>=100&&d.httpStatus<=599?'HTTP '+d.httpStatus:'HTTP状态未取得';
 const parts=[phases[d.phase]||'未知阶段',status];if(Object.hasOwn(failures,d.code))parts.push(failures[d.code]);else if(Object.hasOwn(codes,d.code))parts.push(d.code,codes[d.code]);
 if(googleStatuses.has(d.googleStatus))parts.push(d.googleStatus);if([400,401,403,404,408,409,412,429,500,502,503,504].includes(d.googleCode))parts.push('Google code='+d.googleCode);if(d.reason==='API_KEY_INVALID')parts.push('API_KEY_INVALID');if(types.has(d.type))parts.push(d.type);if(params.has(d.param))parts.push('param='+d.param);
 if(Number.isInteger(value.remaining)&&value.remaining>=0)parts.push('本机剩余预算 '+value.remaining);
 if(Number.isFinite(d.at)&&d.at>0)parts.push(new Date(d.at).toISOString());return parts.join('；');
}
