let active=null;
async function release(job){clearTimeout(job.timer);job.stream?.getTracks().forEach(t=>t.stop());if(active===job)active=null;if(job.context&&job.context.state!=='closed')await job.context.close().catch(()=>{});}
function checkPreparing(job){if(job.discard||active!==job)throw new DOMException('录音准备已取消','AbortError');}
chrome.runtime.onMessage.addListener((m,s,reply)=>{if(m.target!=='offscreen'||s.id!==chrome.runtime.id)return;
 (async()=>{
   if(m.type==='start'){
     if(active)throw Error('已有录音正在运行');
     const job={token:m.token,chunks:[],discard:false};active=job;
     try{
       job.stream=await navigator.mediaDevices.getUserMedia({audio:{mandatory:{chromeMediaSource:'tab',chromeMediaSourceId:m.streamId}},video:false});checkPreparing(job);
       job.context=new AudioContext();job.context.createMediaStreamSource(job.stream).connect(job.context.destination);await job.context.resume();checkPreparing(job);
       job.recorder=new MediaRecorder(job.stream,{mimeType:'audio/webm;codecs=opus'});
       job.recorder.ondataavailable=e=>{if(e.data.size)job.chunks.push(e.data);};
       job.recorder.onstop=async()=>{
         const seconds=(performance.now()-job.start)/1000;await release(job);if(job.discard)return;
         try{const blob=new Blob(job.chunks,{type:'audio/webm'});const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});const result=await chrome.runtime.sendMessage({type:'audioReady',token:job.token,data,seconds});if(!result?.ok)await chrome.runtime.sendMessage({type:'recordError',token:job.token,error:result?.error||'音频处理失败'});}catch(e){await chrome.runtime.sendMessage({type:'recordError',token:job.token,error:e.message});}
       };
       job.recorder.onerror=()=>{job.discard=true;chrome.runtime.sendMessage({type:'recordError',token:job.token,error:'MediaRecorder录音失败'});};
       checkPreparing(job);job.start=performance.now();job.startedAt=Date.now();job.recorder.start();job.timer=setTimeout(()=>{if(job.recorder.state==='recording')job.recorder.stop();},30000);return {ok:true,startedAt:job.startedAt};
     }catch(e){await release(job);throw e;}
   }
   if(m.type==='stop'&&active&&(!m.token||m.token===active.token)){const job=active;job.discard=!!m.discard;if(job.recorder?.state==='recording')job.recorder.stop();else{job.discard=true;await release(job);}}
   return {ok:true};
 })().then(reply).catch(e=>reply({ok:false,error:e.message}));return true;
});
