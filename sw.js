/* guarda o jogo no celular: abre rápido nas próximas vezes. Troque o número da versão a cada atualização. */
const V='arena-v50';
const FILES=['./','index.html','manifest.json','icon-192.png','icon-512.png','js11.js','js12.js','js13.js','js14.js','js18.js','js20.js','js24.js','js25.js','js26.js','js27.js','js31.js','js32.js','js33.js','js34.js','dust2.glb','dust2.bin'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(V).then(c=>Promise.allSettled(FILES.map(f=>c.add(f)))))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET')return;
 const nav=r.mode==='navigate';
 e.respondWith(caches.open(V).then(async c=>{
  const hit=await c.match(r,{ignoreSearch:true});
  const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}).catch(()=>null);
  if(nav){const res=await net;return res||hit||Response.error()}
  return hit||(await net)||Response.error()}))});
