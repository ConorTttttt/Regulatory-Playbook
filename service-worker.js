/* Regulatory Playbook v3: cache static pages, data, and shared assets for offline use. */
const CACHE_NAME='reg-playbook-multipage-v3';
const APP_FILES=[
 './','./index.html','./classification-lists.html','./ghs-editions.html',
 './compare.html','./regulations.html','./regulation.html',
 './site.css','./site.js','./data.json','./ghs_data.json','./regulatory-schemes.json',
 './manifest.webmanifest','./assets/icon-192.png','./assets/icon-512.png'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const req=e.request, u=new URL(req.url);
 if(u.origin!==self.location.origin||req.method!=='GET')return;
 if(req.mode==='navigate'){
   e.respondWith(fetch(req).then(res=>{
     if(res.ok){const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put(req,copy))}
     return res;
   }).catch(async()=>{
     const cached=await caches.match(req,{ignoreSearch:true});
     if(cached)return cached;
     const name=u.pathname.split('/').pop()||'index.html';
     return await caches.match('./'+name)||await caches.match('./index.html')||Response.error();
   }));
 }else{
   e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{
     if(res.ok){const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put(req,copy))}
     return res;
   })));
 }
});
