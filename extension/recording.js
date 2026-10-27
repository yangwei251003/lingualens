export class RecordingJob {
 constructor({tabId,identity,time,notify=async()=>{}}){Object.assign(this,{tabId,identity,time,notify,token:crypto.randomUUID(),controller:new AbortController(),state:'capturing'});}
 abort(reason='录音/转写已取消'){this.cancelReason=reason;this.controller.abort();this.state='cancelled';}
 async finish({blob,seconds,current,transcribe,checkCurrent,deliver}){
   if(this.controller.signal.aborted)return false;this.state='transcribing';
   try{
     if(!Number.isFinite(seconds)||seconds<=0||seconds>32||blob.size>24*1024*1024)throw Error('录制片段长度或大小无效。');
     if(current.identity!==this.identity||current.rate!==1||Math.abs(current.time-this.time-seconds)>1.5)throw Error('录制期间视频跳转、变速或换视频，片段已丢弃。');
     const result=await transcribe(blob,this.controller.signal);
     if(this.controller.signal.aborted)throw new DOMException('cancelled','AbortError');
     const segments=result.data?.segments;
     if(!Array.isArray(segments)||!segments.length)throw Error('转写服务未返回带时间戳的 segments。');
     const rows=segments.filter(s=>Number.isFinite(s.start)&&Number.isFinite(s.end)&&s.start>=0&&s.start<seconds&&s.end>s.start&&typeof s.text==='string'&&s.text.trim()).map(s=>({start:this.time+s.start,end:this.time+Math.min(seconds,s.end),text:s.text}));
     if(!rows.length)throw Error('转写服务没有有效的片段内字幕时间戳。');
     if((await checkCurrent()).identity!==this.identity)throw Error('视频已切换，旧转写已丢弃。');
     if(this.controller.signal.aborted)throw new DOMException('cancelled','AbortError');
     await deliver(rows,result.provider);this.state='done';return true;
   }catch(e){this.state=this.controller.signal.aborted?'cancelled':'failed';await this.notify(this.controller.signal.aborted?(this.cancelReason||'录音/转写已取消'):e.message);return false;}
 }
}
