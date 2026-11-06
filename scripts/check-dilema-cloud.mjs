import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import {BlobPreconditionFailedError} from '@vercel/blob';
const require = createRequire(import.meta.url);
const url = code => 'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const compile = source => ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText;
const modelUrl = url(compile(readFileSync(new URL('../src/dilema/model.ts',import.meta.url),'utf8')));
const {newChronicle} = await import(modelUrl);
const serverSource = readFileSync(new URL('../server/dilema-store.ts',import.meta.url),'utf8')
 .replace("'../src/dilema/model'",JSON.stringify(modelUrl))
 .replace("'@vercel/blob'",JSON.stringify(pathToFileURL(require.resolve('@vercel/blob')).href));
const {campaignHandler} = await import(url(compile(serverSource)));
const objects = new Map(); let writes=0;
const handler = campaignHandler({configured:()=>true,
 async get(path){const item=objects.get(path);return item?{statusCode:200,stream:new Blob([item.content]).stream(),blob:{etag:item.etag}}:null;},
 async put(path,content,options){const old=objects.get(path);if((old&&!options.allowOverwrite)||(options.ifMatch&&old?.etag!==options.ifMatch))throw new BlobPreconditionFailedError();const etag=`"${++writes}"`;objects.set(path,{content,etag});return {etag};}
});
const key='a'.repeat(64), other='b'.repeat(64);
const request=(method='GET',body,extra={},token=key)=>new Request('https://site.example/api/dilema',{method,headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});
assert.equal((await handler(request('GET',undefined,{},'invalid'))).status,401);
assert.equal((await handler(request('DELETE'))).status,405);
assert.equal((await handler(request('GET',undefined,{Origin:'https://evil.example'}))).status,403);
assert.equal((await handler(request())).status,404);
const data=newChronicle();data.campaign='Campanha preservada';
assert.equal((await handler(request('PUT',data))).status,428);
assert.equal((await handler(request('PUT',{invalid:true},{'If-None-Match':'*'}))).status,400);
let result=await handler(request('PUT',data,{'If-None-Match':'*'}));assert.equal(result.status,200);const etag=result.headers.get('ETag');
result=await handler(request());assert.equal(result.status,200);assert.deepEqual((await result.json()).data,data);
assert.match(result.headers.get('Cache-Control'),/no-store/);
assert.equal((await handler(request('GET',undefined,{},other))).status,404,'Campanhas isoladas pelo link de acesso');
assert.equal((await handler(request('PUT',data,{'If-None-Match':'*'}))).status,409,'Criação não sobrescreve dados');
const updated={...data,campaign:'Depois da atualização'};
assert.equal((await handler(request('PUT',updated,{'If-Match':etag}))).status,200);
assert.equal((await handler(request('PUT',data,{'If-Match':etag}))).status,409,'Revisão antiga não sobrescreve dados');
assert.equal((await (await handler(request())).json()).data.campaign,updated.campaign);
assert.equal((await campaignHandler({configured:()=>false})(request())).status,503);
console.log('API: arquivo privado, recuperação, validação, isolamento, cache e conflitos verificados.');

const local=new Map();
globalThis.localStorage={getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,v)};
globalThis.window={addEventListener(){},removeEventListener(){},scrollTo(){}};
globalThis.location={origin:'https://site.example',hash:'#dilema-do-rei'};
globalThis.confirm=()=>true;
const componentSource=readFileSync(new URL('../src/dilema/dilema.ts',import.meta.url),'utf8')
 .replace(/import .* from '@angular\/core';/,'const Component = () => target => target;')
 .replace(/import .* from '@angular\/forms';/,'const FormsModule = {};')
 .replace("'./model'",JSON.stringify(modelUrl));
const {DilemaComponent}=await import(url(compile(componentSource)));
globalThis.fetch=async (_url,options={})=>handler(new Request('https://site.example/api/dilema',options));
const first=new DilemaComponent();first.data=data;await first.connectCloud();
assert.match(first.cloudStatus,/Salvo permanentemente/);
const cloudMeta=JSON.parse(local.get('aulufa-dilema-cloud-v1'));assert.ok(cloudMeta.etag);
first.data.draft.king='Reinado do teste';first.changed();await first.saveCloud();
const reopened=new DilemaComponent();await reopened.connectCloud();assert.equal(reopened.data.draft.king,'Reinado do teste');
const cloudKey=JSON.parse(local.get('aulufa-dilema-cloud-v1')).key;
local.clear();location.hash='#dilema-do-rei/'+cloudKey;
const otherDevice=new DilemaComponent();await otherDevice.connectCloud();assert.equal(otherDevice.data.draft.king,'Reinado do teste','Outro dispositivo recupera a campanha pelo link');
globalThis.fetch=async()=>{throw new Error('offline');};
otherDevice.data.draft.king='Alteração offline';otherDevice.changed();await otherDevice.saveCloud();assert.match(otherDevice.cloudStatus,/local/);
globalThis.fetch=async (_url,options={})=>handler(new Request('https://site.example/api/dilema',options));
const offlineReopened=new DilemaComponent();await offlineReopened.connectCloud();assert.equal(offlineReopened.data.draft.king,'Alteração offline');assert.match(offlineReopened.cloudStatus,/Salvo permanentemente/);
otherDevice.data.draft.king='Sessão antiga';otherDevice.changed();await otherDevice.saveCloud();assert.equal(otherDevice.cloudConflict,true);
for(const component of [first,reopened,otherDevice,offlineReopened]) clearTimeout(component.cloudTimer);
console.log('Cliente → API → arquivo → outro dispositivo: migração local, reabertura, edição offline e conflito verificados.');
