// 无用外交 离线缓存：安装时先存好核心文件；平时网络优先，断网时用缓存
// 和同域名下的其他游戏共用 wudi0319.github.io，只清理自己前缀的旧缓存
const P='wuyong-',C=P+'v1',V='?v=1';
const CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-180.png','style.css'+V,
 ...['sfx','sprites','data','game','ui'].map(f=>'js/'+f+'.js'+V)];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith(P)&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!=='GET'||!q.url.startsWith(self.registration.scope))return;
 e.respondWith(fetch(q).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(q,cp))}return r})
  .catch(()=>caches.match(q,{cacheName:C}).then(m=>m||(q.mode==='navigate'?caches.match('./',{cacheName:C}):caches.match(q,{cacheName:C,ignoreSearch:true})))))});
