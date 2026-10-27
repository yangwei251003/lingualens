import {mkdir,cp,readFile,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const target=process.env.LL_BUILD_DIR||'dist/lingualens';
for(const f of await readdir('extension'))if(f.endsWith('.js'))execFileSync(process.execPath,['--check','extension/'+f]);
await mkdir('dist',{recursive:true});await cp('extension',target,{recursive:true});
const manifest=JSON.parse(await readFile(target+'/manifest.json','utf8'));for(const f of [manifest.background.service_worker,manifest.options_page,manifest.action.default_popup,...manifest.content_scripts.flatMap(x=>x.js)])await readFile(target+'/'+f);
console.log('Build validated: '+target);
