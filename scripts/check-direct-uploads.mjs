import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import ts from 'typescript';
import {sha256} from '@noble/hashes/sha2.js';
const source=ts.transpileModule(await fs.readFile('src/admin/api/direct-upload.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const CHUNK=16*1024*1024;
function storage(){const items=new Map();return{getItem:k=>items.get(k)??null,setItem:(k,v)=>items.set(k,v),removeItem:k=>items.delete(k),items};}
async function client(api,fetch,localStorage){
 const context=vm.createContext({Blob,Uint8Array,AbortSignal,crypto,localStorage,fetch,setTimeout:callback=>{callback();return 0;}});
 const module=new vm.SourceTextModule(source,{context});
 await module.link(specifier=>new vm.SyntheticModule(specifier.includes('noble')?['sha256']:['api','ApiError'],function(){if(specifier.includes('noble'))this.setExport('sha256',sha256);else{this.setExport('api',api);this.setExport('ApiError',class extends Error{});}},{context}));
 await module.evaluate();return module.namespace.directUpload;
}
test('R2 reload resumes persisted parts and never persists provider URLs',async()=>{
 const local=storage(),file=new File([new Uint8Array(CHUNK+1024)],'audio.mp3',{type:'audio/mpeg'});let first=true,creates=0;const parts=[],requests=[];
 const api=async(path,method,body)=>{if(path==='/admin/session')return{principal:{id:'staff-A'}};if(path==='/admin/media/direct-uploads'){creates++;return{id:'saved',versionId:'version',provider:'r2',state:'pending_upload',partSize:CHUNK,parts:[]};}if(path.endsWith('/resume'))return{id:'saved',versionId:'version',provider:'r2',state:'pending_upload',partSize:CHUNK,parts:[...parts]};if(path.endsWith('/parts'))return{url:'https://private.test/part/'+body.partNumber};if(path.endsWith('/complete'))return{};if(path==='/admin/media/saved')return{versions:[{id:'version',state:'ready'}]};throw Error(path);};
 const fetch=async(url,{body})=>{const number=Number(url.split('/').at(-1));requests.push(number);if(number===2&&first)throw Error('Offline');if(!parts.some(p=>p.partNumber===number))parts.push({partNumber:number,size:body.size,etag:'etag'});return{ok:true};};
 await assert.rejects((await client(api,fetch,local))(file,()=>{}),/Select the same file/);
 assert.equal(parts.length,1);assert.ok([...local.items.values()].every(value=>!value.includes('https:')));
 first=false;assert.equal(await(await client(api,fetch,local))(file,()=>{}),'version');assert.equal(creates,1);assert.equal(requests.filter(n=>n===1).length,1);assert.equal(local.items.size,0);
});
test('Mux lost acknowledgement resumes from provider offset without resending committed bytes',async()=>{
 const local=storage(),file=new File([new Uint8Array(CHUNK+1024)],'video.mp4',{type:'video/mp4'});let offset=0,lost=false;const sent=[];
 const api=async(path)=>{if(path==='/admin/session')return{principal:{id:'staff-B'}};if(path==='/admin/media/direct-uploads')return{id:'mux',provider:'mux',state:'pending_upload',uploadUrl:'https://private.test/mux',parts:[]};if(path.endsWith('/complete'))return{};if(path==='/admin/media/mux')return{versions:[{id:'video-version',state:'ready'}]};throw Error(path);};
 const fetch=async(url,{headers,body})=>{if(headers['Content-Range'].startsWith('bytes */'))return{ok:offset===file.size,status:offset===file.size?200:308,headers:new Headers(offset?{Range:'bytes=0-'+(offset-1)}:{})};const start=Number(headers['Content-Range'].match(/bytes (\d+)-/)[1]);assert.equal(start,offset);sent.push(start);offset+=body.size;if(!lost){lost=true;throw Error('Acknowledgement lost');}return{ok:true,status:200};};
 assert.equal(await(await client(api,fetch,local))(file,()=>{}),'video-version');assert.deepEqual(sent,[0,CHUNK]);assert.equal(offset,file.size);assert.equal(local.items.size,0);
});
