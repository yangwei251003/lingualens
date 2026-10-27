const $=id=>document.getElementById(id);const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
async function send(type,extra={}){const r=await chrome.runtime.sendMessage({type,tabId:tab.id,...extra});if(!r?.ok)throw Error(r?.error||'操作失败');return r.value;}
function act(id,fn){$(id).onclick=async()=>{try{await fn();}catch(e){$('status').textContent=e.message;}};}
act('toggle',()=>send('toggle'));act('record',async()=>{if(!$('consent').checked)throw Error('请先同意本次音频上传');$('record').disabled=true;try{await send('record');$('status').textContent='正在录制。30秒后自动停止并转写，可提前结束或丢弃。不要跳转或换视频。';}finally{$('record').disabled=false;}});act('stop',()=>send('stopRecord'));act('cancel',()=>send('stopRecord',{discard:true}));act('settings',()=>chrome.runtime.openOptionsPage());
