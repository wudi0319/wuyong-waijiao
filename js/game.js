// 无用外交 — 核心模拟 + 画面。状态全部在 G 里；玩家按 id 存在 G.players，方便以后加第二个玩家。
const REC_KEY='wywj-defense-v1';
function loadRec(){try{return normRec(JSON.parse(localStorage.getItem(REC_KEY))||{})}catch(e){return normRec({})}}
function saveRec(r){try{localStorage.setItem(REC_KEY,JSON.stringify(r))}catch(e){}}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let G=null,uid=1;
const hooks={toast:()=>{},end:()=>{},hud:()=>{},sfx:()=>{}};
const sfx=k=>hooks.sfx(k);

function newGame(o){useMap(o.map||'yard');rebuildDecor();
 const raw=[...(o.buffs||[]),...(o.talents||[])],buffs=raw.filter(k=>BUFFS[k]),debuffs=[...(o.debuffs||[]),...raw.filter(k=>DEBUFFS[k])];
 const mods=makeMods(buffs,debuffs,MAP.diff);
 G={phase:'day',night:0,gold:(MAP.gold||15)+(mods.start||0),t:0,nightT:0,spawnQ:[],buffs,debuffs,talents:buffs,mods,map:MAP.id,
  home:{hp:300*mods.stone,max:300*mods.stone,cd:0,hurtT:0,up:0,picks:[],bdmg:5,bcd:1.2,brange:3.8,regen:0,stipend:0,aura:1,beds:0,cozy:0,guard:0},
  players:{},me:o.dog,b:{},enemies:[],units:[],shots:[],fx:[],floats:[],coins:[],
  input:{},army:{mode:'camp',leader:null,x:0,y:0},dark:0,shake:0,stats:{kills:0,broke:0,stars:0,starGain:0}};
 G.home.bpicks=[];for(const s of SPOTS)G.b[s.id]={lv:0,hp:0,max:0,cd:0,dead:0,picks:[]};
 view.mm.big=false;view.guide=null;addPlayer(o.dog,o.dog,o.weapon);navDirty=1;rebuildNav();cam.x=HOME.x;cam.y=HOME.y;return G}
function addPlayer(id,dog,weapon){const max=100*G.mods.hp;let x=HOME.x,y=HOME.y+2.2;
 if(terrainBlock(x,y,.3)){for(let d=.2;d<5&&terrainBlock(x,y,.3);d+=.2)for(let a=0;a<16;a++){const nx=HOME.x+Math.cos(a*Math.PI/8)*d,ny=HOME.y+Math.sin(a*Math.PI/8)*d;if(nx>.5&&ny>.5&&nx<MAP_W-.5&&ny<MAP_H-.5&&!terrainBlock(nx,ny,.3)){x=nx;y=ny;break}}}
 G.players[id]={id,dog,weapon,x,y,dir:0,hp:max,max,cd:0,skillCd:0,dead:0,respawn:0,ph:0,moving:false,swing:0,face:{x:0,y:1}};G.input[id]={x:0,y:0}}
const spotOf=id=>SPOTS.find(s=>s.id===id);
const bStat=(s,k,lv)=>BUILD[s.t][k][lv-1];
function bMax(s,lv){let h=bStat(s,'hp',lv);const b=G.b[s.id];if(s.t==='wall'){h*=G.mods.stone;if(hasPick(b,'ironwall'))h*=1.3;if(hasPick(b,'reinforce'))h*=1.35;if(hasPick(b,'fort'))h*=1.4}else h*=(G.mods.bhp||1);return h}
function priceOf(c){return Math.max(1,Math.round(c*(G.mods&&G.mods.bcost||1)))}
function nextCost(s){const b=G.b[s.id];if(b.lv>=3)return null;let c=BUILD[s.t].cost[b.lv];if(s.t==='wall'&&G.mods.wcut)c=Math.max(2,c-G.mods.wcut);return priceOf(c)}
function nearSpot(p){let best=null,bd=1.7;for(const s of SPOTS){const d=s.t==='wall'?Math.max(0,bDist(s,p.x,p.y)+WALL_HT+.15):Math.hypot(p.x-s.x,p.y-s.y);if(d<bd){bd=d;best=s}}return best}
function autoBranch(s,lv){const kind=branchKind(s),opts=branchOpts(kind,lv);if(!opts.length)return null;
 const plan=G.branchPlan,want=plan&&(plan[s.id]||plan[s.t]||plan[kind]);
 const id=Array.isArray(want)?want[lv-1]:null;if(id&&opts.some(o=>o.id===id))return id;return opts[0].id}
function build(pid,sid,pickId){if(G.phase!=='day')return false;const p=G.players[pid],s=spotOf(sid)||nearSpot(p);if(!s)return false;
 const b=G.b[s.id],c=nextCost(s);if(c==null){hooks.toast(bName(s)+'已经满级啦');return false}
 if(G.gold<c){hooks.toast('金币不够，还差 '+(c-G.gold)+' 💰');sfx('poor');return false}
 const lv=(b.lv||0)+1,kind=branchKind(s),opts=branchOpts(kind,lv);
 const pick=pickId||autoBranch(s,lv);if(opts.length&&!opts.some(o=>o.id===pick)){hooks.toast('先选一个升级路线');return false}
 G.gold-=c;b.picks=b.picks||[];if(pick)b.picks.push(pick);b.lv++;b.max=bMax(s,b.lv);b.hp=b.max;b.dead=0;
 const br=pick&&branchById(kind,pick);G.fx.push({k:'puff',x:s.x,y:s.y,t:0,life:.6});sfx('build');
 hooks.toast((b.lv===1?'建好了 ':'升级到 '+b.lv+' 级 ')+bName(s)+'！'+(br?' '+br.ic+br.name:'')+(upgradeHint(s,b.lv)?'':' '));
 navDirty=1;for(const q of Object.values(G.players))if(!q.dead)pushOut(q,.3);for(const u of G.units)if(!u.dead)pushOut(u,.28);syncUnits();return true}
function paidFor(s){const b=G.b[s.id];if(!b||!b.lv)return 0;let n=0;for(let i=0;i<b.lv;i++){let c=BUILD[s.t].cost[i];if(s.t==='wall'&&G.mods.wcut)c=Math.max(2,c-G.mods.wcut);n+=c}return n}
function demolishValue(s){return Math.max(1,Math.floor(paidFor(s)*(G.mods.refund||0)))}
function demolish(pid,sid){if(G.phase!=='day')return false;const p=G.players[pid],s=spotOf(sid)||nearSpot(p);if(!p||!s||p.dead)return false;const b=G.b[s.id];if(!b||!b.lv)return false;if(!(G.mods.refund>0)){hooks.toast('还不会拆了回收呢');return false}
 const back=demolishValue(s);b.lv=0;b.hp=0;b.max=0;b.dead=0;b.picks=[];G.gold+=back;
 if(s.t==='cats'||s.t==='ducks')G.units=G.units.filter(u=>u.home!==s.id);navDirty=1;G.fx.push({k:'puff',x:s.x,y:s.y,t:0,life:.6});sfx('build');hooks.toast('拆除了 '+bName(s)+'，退回 '+back+' 💰');return true}
function nearHome(p){return Math.hypot(p.x-HOME.x,p.y-HOME.y)<HOME.r+1.9}
function homeUpCost(){return G.home.up>=3?null:priceOf(HOME_UP_COST[G.home.up])}
function homeUpChoices(){const taken=new Set(G.home.picks||[]),by={hero:[],unit:[],build:[],econ:[]};
 for(const k of Object.keys(HOME_UPS))if(!taken.has(k))(by[HOME_UPS[k].cat||'build']||by.build).push(k);
 const take=a=>{if(!a.length)return null;const i=Math.floor(Math.random()*a.length);return a.splice(i,1)[0]};
 const cats=['hero','unit','build','econ'],out=cats.map(c=>take(by[c])).filter(Boolean),rest=cats.flatMap(c=>by[c]);
 while(out.length<3&&rest.length)out.push(take(rest));return out}
function applyHomeUp(id){const U=HOME_UPS[id];if(!U||!G)return false;
 if(id==='thick'){G.home.max+=60;G.home.hp=G.home.max}
 else if(id==='bottle'){G.home.bdmg=(G.home.bdmg||6)+5;G.home.bcd=Math.max(.55,(G.home.bcd||1.1)-.25);G.home.brange=(G.home.brange||4)+1.2}
 else if(id==='stipend')G.home.stipend=(G.home.stipend||0)+4;
 else if(id==='regen')G.home.regen=(G.home.regen||0)+2;
 else if(id==='aura'){G.home.aura=(G.home.aura||1)*1.25;G.home.guard=Math.min(.35,(G.home.guard||0)+.15)}
 else if(id==='beds'){G.home.beds=(G.home.beds||0)+1;syncUnits()}
 else if(id==='cozy')G.home.cozy=Math.min(.4,(G.home.cozy||0)+.22);
 else if(id==='recall')G.home.rev=Math.min(.45,(G.home.rev||0)+.25);
 else if(id==='vigor'){for(const p of Object.values(G.players)){p.max+=40;p.hp=Math.min(p.max,p.hp+40)}}
 else if(id==='sharp')G.mods.pdmg=(G.mods.pdmg||1)*1.15;
 else if(id==='haste'){G.mods.pspd=(G.mods.pspd||1)*1.15;G.mods.scd=(G.mods.scd||1)*0.9}
 else if(id==='drill')G.mods.udmg=(G.mods.udmg||1)*1.2;
 else if(id==='scope'){G.mods.trange=(G.mods.trange||1)*1.15;G.mods.tdmg=(G.mods.tdmg||1)*1.1}
 else if(id==='banker'){G.mods.interest=(G.mods.interest||0)+.10;G.mods.interestCap=(G.mods.interestCap||0)+6}
 else if(id==='bargain')G.mods.bcost=(G.mods.bcost||1)*0.85
 else if(id==='stretch')G.mods.prange=(G.mods.prange||1)*1.2
 else if(id==='pelt'){G.mods.pet=(G.mods.pet||1)*1.3;syncUnits();for(const u of G.units)if(!u.dead)u.hp=Math.min(u.max,u.hp*1.3)}
 G.home.picks.push(id);G.home.up++;G.fx.push({k:'puff',x:HOME.x,y:HOME.y,t:0,life:.6});sfx('build');hooks.toast('🏰 '+U.ic+' '+U.name+'！');return true}
function applyHomeBottle(id){const o=branchById('home',id);if(!o||!G)return false;
 const bp=G.home.bpicks||[];if(bp.includes(id))return false;
 if(id==='quick')G.home.bcd=Math.max(.45,(G.home.bcd||1.2)*0.75);
 if(id==='longarm')G.home.brange=(G.home.brange||3.8)*1.3;
 if(id==='rich')G.home.bdmg=(G.home.bdmg||5)*1.4;
 G.home.bpicks=bp.concat([id]);return true}
function upgradeHome(pid,id,bottleId){if(G.phase!=='day')return false;const p=G.players[pid];if(!p||p.dead||!nearHome(p))return false;
 const c=homeUpCost();if(c==null){hooks.toast('城堡这局已经升满啦');return false}
 if(G.gold<c){hooks.toast('金币不够，还差 '+(c-G.gold)+' 💰');sfx('poor');return false}
 if(!HOME_UPS[id]||(G.home.picks||[]).includes(id))return false;
 const lv=(G.home.up||0)+1,opts=branchOpts('home',lv),pick=bottleId||autoHomeBottle(lv);
 if(opts.length&&!opts.some(o=>o.id===pick)){hooks.toast('先给连弩选一个路子');return false}
 G.gold-=c;if(pick)applyHomeBottle(pick);return applyHomeUp(id)}
function autoHomeBottle(lv){const opts=branchOpts('home',lv);if(!opts.length)return null;
 const want=G.branchPlan&&G.branchPlan.home;const id=Array.isArray(want)?want[lv-1]:null;
 if(id&&opts.some(o=>o.id===id))return id;return opts[0].id}
function startNight(){if(G.phase!=='day')return;G.phase='night';G.nightT=0;G.spawnQ=waveFor(G.night+1,G.mods.count);sfx('night');
 hooks.toast('🌙 第 '+(G.night+1)+' 夜，敌人从'+nightDirs(G.night+1).map(d=>DIRS[d].cn).join('、')+'边来了！')}
function morning(){G.night++;G.phase='day';G.coins=[];
 if(G.night>=NIGHTS){G.phase='win';endGame(true);return}
 let pay=4+(G.home.stipend||0);for(const s of SPOTS){const b=G.b[s.id];if(s.t==='farm'&&b.lv&&!b.dead)pay+=bStat(s,'gold',b.lv)+(G.mods.farmPlus||0)+(hasPick(b,'harvest')?2:0)+(hasPick(b,'soil')?3:0)+(hasPick(b,'silo')?4:0)
  else if(G.mods.payroll&&(s.t==='tower'||s.t==='cats'||s.t==='ducks')&&b.lv&&!b.dead)pay+=G.mods.payroll}
 pay=Math.round(pay*G.mods.gold);const interest=G.mods.interest?Math.min(G.mods.interestCap||7,Math.floor(G.gold*G.mods.interest)):0;G.gold+=pay+interest;
 for(const s of SPOTS){const b=G.b[s.id];if(b.lv){b.hp=b.max;b.dead=0}}navDirty=1;
 G.home.hp=G.home.max;for(const p of Object.values(G.players)){p.hp=p.max;p.dead=0;p.swing=0;p.skillT=0;p.cd=0}
 for(const u of G.units){u.dead=0;u.hp=u.max}
 G.shots=[];sfx('morning');hooks.toast('☀️ 天亮啦！菜园和城堡收入 +'+pay+' 💰'+(interest?'，存款利息 +'+interest+' 💰':''))}
function endGame(win){sfx(win?'win':'lose');const r=normRec(loadRec());const was={best:r.best,wins:r.wins,starSpent:r.starSpent,buffs:[...(r.buffs||[])],maps:{}};
 for(const k in r.maps)was.maps[k]={wins:r.maps[k].wins||0,best:r.maps[k].best||0,stars:r.maps[k].stars||0};
 r.best=Math.max(r.best,G.night);if(win)r.wins++;const mid=G.map||MAP.id;r.maps[mid]=r.maps[mid]||{wins:0,best:0,stars:0};r.maps[mid].best=Math.max(r.maps[mid].best||0,G.night);
 if(win){r.maps[mid].wins++;const got=rateStars(G),prev=r.maps[mid].stars||0;r.maps[mid].stars=Math.max(prev,got);G.stats.stars=got;G.stats.starGain=Math.max(0,r.maps[mid].stars-prev)}
 saveRec(r);hooks.end(win,was,r)}
// ---- 士兵士兵 ----
function campN(s,b){return bStat(s,'n',b.lv)+(hasPick(b,'horde')?1:0)+(hasPick(b,'recruit')?1:0)+(G.mods.beds||0)+(G.home.beds||0)}
function campHpMul(b){return (hasPick(b,'elite')?1.3:1)*(hasPick(b,'iron')?1.35:1)}
function campDmgMul(b){return (hasPick(b,'elite')?1.25:1)*(hasPick(b,'fierce')?1.25:1)}
function syncUnits(){for(const s of SPOTS){if(s.t!=='cats'&&s.t!=='ducks')continue;const b=G.b[s.id];if(!b.lv)continue;const n2=campN(s,b),U=UNITS[BUILD[s.t].unit],hm=campHpMul(b);
 const mine=G.units.filter(u=>u.home===s.id);
 for(let i=mine.length;i<n2;i++){const max=U.hp*G.mods.pet*(1+.25*(b.lv-1))*hm;G.units.push({id:uid++,home:s.id,k:BUILD[s.t].unit,slot:i,x:s.x,y:s.y+.8,hp:max,max,cd:0,dead:0,respawn:0,dir:0,ph:0,moving:false})}
 for(const u of G.units.filter(u=>u.home===s.id)){const nm=U.hp*G.mods.pet*(1+.25*(b.lv-1))*hm;if(nm>u.max)u.hp+=nm-u.max;u.max=nm}}}
// 小兵指令：follow 跟随玩家；deploy 原地部署（插旗守这里）；camp 默认守在各自兵营
function armyFollow(pid){if(!G.units.length){hooks.toast('先建刀斧营或弓箭营吧');return}G.army.mode='follow';G.army.leader=pid;sfx('click');hooks.toast('⚔️ 士兵们跟着'+DOGS[G.players[pid].dog].name+'走！')}
function armyDeploy(pid){if(!G.units.length){hooks.toast('先建刀斧营或弓箭营吧');return}const p=G.players[pid];G.army.mode='deploy';G.army.leader=null;G.army.x=p.x;G.army.y=p.y;sfx('click');hooks.toast('🚩 士兵们守在这里！')}
function toggleArmy(pid){G.army.mode==='follow'?armyDeploy(pid):armyFollow(pid)}
// ---- 战斗 ----
// 击退：一步步推，碰到悬崖/河/地图边就停，不会把敌人打到崖下或对岸
function knockE(e,dx,dy){const r=ENEMIES[e.k].r,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.1));for(let i=0;i<n;i++){const nx=e.x+dx/n,ny=e.y+dy/n;if(nx<.4||ny<.4||nx>MAP_W-.4||ny>MAP_H-.4||terrainBlock(nx,ny,r)||(!enemySolid(e.x,e.y,r)&&enemySolid(nx,ny,r)))break;e.x=nx;e.y=ny}}
function hurtEnemy(e,d,stun,byP){if(e.dead)return;e.hp-=d;e.flash=.12;if(stun)e.stun=Math.max(e.stun||0,stun);
 if(byP===1){sfx('hit');const me=G.players[G.me];if(me)me.combat=G.t;if(G.floats.length<70)G.floats.push({x:e.x+(Math.random()-.5)*.4,y:e.y-ENEMIES[e.k].r*2-.3,txt:''+Math.round(d),t:.25,col:'#fff',sm:1})}
 if(byP==='u'&&G.mods.slow)e.slowT=Math.max(e.slowT||0,1.2);
 if(e.hp<=0){e.dead=1;let g=Math.round(ENEMIES[e.k].gold*G.mods.drop)+(G.mods.luck||0);if(G.mods.bounty&&(e.k==='bear'||e.k==='boss'))g+=Math.round(ENEMIES[e.k].gold*(G.mods.drop||1)*G.mods.bounty);g+=farmBountyGold(e);G.gold+=g;G.stats.kills++;sfx('kill');G.floats.push({x:e.x,y:e.y-.8,txt:'+'+g+'💰',t:0,col:'#ffd23f'});G.coins.push({x:e.x,y:e.y-.4,t:0,n:g});G.fx.push({k:'poof',x:e.x,y:e.y,t:0,life:.4,r:ENEMIES[e.k].r})}}
function farmBountyGold(e){let n=0;for(const s of SPOTS){if(s.t!=='farm')continue;const b=G.b[s.id];if(!b||!b.lv||b.dead)continue;
  const add=(hasPick(b,'bounty')?1:0)+(hasPick(b,'scavenge')?1:0)+(hasPick(b,'fortune')?1:0);if(!add)continue;
  if(Math.hypot(e.x-s.x,e.y-s.y)<=(hasPick(b,'scavenge')?9:7))n+=add}return n}
function applySlow(e,t){if(e&&t)e.slowT=Math.max(e.slowT||0,t)}
// 灼烧：命中后 burnT 秒内每 0.5 秒掉一次血，总量 = 命中伤害 × burnP；重复命中只刷新时间、取较高的每秒伤害
function applyBurn(e,hit,p){if(!e||e.dead||!p)return;const dps=hit*p/TOWER3.burnT;if(!(e.burnT>0)){e.burnD=0;e.burnAcc=0}e.burnD=Math.max(e.burnD,dps);e.burnT=TOWER3.burnT}
function tickBurn(e,dt){if(!(e.burnT>0)||e.dead)return;const step=Math.min(dt,e.burnT);e.burnT-=dt;e.burnAcc=(e.burnAcc||0)+step;if(e.burnAcc>=.5||e.burnT<=0){const d=e.burnD*e.burnAcc;e.burnAcc=0;hurtEnemy(e,d,0,0)}}
function impactShot(s,primary){if(primary&&!primary.dead){hurtEnemy(primary,s.dmg,0,s.byP);applySlow(primary,s.slow);applyBurn(primary,s.dmg,s.burn)}
 if(s.splash){for(const e of enemiesNear(s.x,s.y,s.splash)){if(primary&&e.id===primary.id)continue;hurtEnemy(e,s.dmg*(s.splashMul||.6),0,s.byP);applySlow(e,s.slow);applyBurn(e,s.dmg*(s.splashMul||.6),s.burn)}G.fx.push({k:'quake',x:s.x,y:s.y,t:0,life:.28,r:s.splash})}
 if(s.pierce&&primary){const nxt=enemiesNear(primary.x,primary.y,2.4).find(e=>!primary||e.id!==primary.id);if(nxt){hurtEnemy(nxt,s.dmg*.7,0,s.byP);applySlow(nxt,s.slow);applyBurn(nxt,s.dmg*.7,s.burn)}}}
function nearestEnemies(x,y,r,n){return G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-x,e.y-y)<=r+ENEMIES[e.k].r).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)).slice(0,n||1)}
function enemiesNear(x,y,r){return G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-x,e.y-y)<=r+ENEMIES[e.k].r)}
function nearestEnemy(x,y,r){let best=null,bd=1e9;for(const e of G.enemies){if(e.dead)continue;const d=Math.hypot(e.x-x,e.y-y)-ENEMIES[e.k].r;if(d<=r&&d<bd){bd=d;best=e}}return best}
function shoot(from,tgt,dmg,kind,spd=10,byP){G.shots.push({x:from.x,y:from.y-.5,tgt,tx:tgt.x,ty:tgt.y,dmg,kind,spd,t:0,byP})}
function skill(pid){const p=G.players[pid];if(!p||p.dead||p.skillCd>0||G.phase!=='night')return false;const W=WEAPONS[p.weapon];p.skillCd=W.skill.cd*(G.mods.scd||1);p.skillT=.5;p.combat=G.t;
 if(p.weapon==='spatula'){for(const e of enemiesNear(p.x,p.y,2.7)){hurtEnemy(e,45*(G.mods.pdmg||1),0,1);const a=Math.atan2(e.y-p.y,e.x-p.x);knockE(e,Math.cos(a)*.9,Math.sin(a)*.9)}G.fx.push({k:'spin',x:p.x,y:p.y,t:0,life:.45,r:2.7})}
 else if(p.weapon==='frisbee'){for(let i=0;i<10;i++){const a=i/10*Math.PI*2;G.shots.push({x:p.x,y:p.y-.4,vx:Math.cos(a)*9,vy:Math.sin(a)*9,life:.8,dmg:26*(G.mods.pdmg||1),kind:'frisbee',hit:new Set(),t:0,byP:1})}}
 else{for(const e of enemiesNear(p.x,p.y,3.3))hurtEnemy(e,70*(G.mods.pdmg||1),1.6,1);G.shake=.25;G.fx.push({k:'quake',x:p.x,y:p.y,t:0,life:.6,r:3.3})}
 sfx('skill');hooks.toast(W.skill.name+'！');return true}
function faceAng(p){if(p.face&&(Math.abs(p.face.x)+Math.abs(p.face.y))>1e-6)return Math.atan2(p.face.y,p.face.x);return [Math.PI/2,-Math.PI/2,Math.PI,0][p.dir]||0}
function inFan(p,e,range){const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy),er=(ENEMIES[e.k]&&ENEMIES[e.k].r)||.35;if(d>range+er)return false;if(d<.12)return true;
 let da=Math.atan2(dy,dx)-faceAng(p);while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;return Math.abs(da)<=Math.PI/2+1e-4}
function playerAttack(p,dt){const W=WEAPONS[p.weapon];p.cd-=dt;p.skillCd=Math.max(0,p.skillCd-dt);if(p.cd>0)return;
 const range=W.range*(G.mods.prange||1),tg=nearestEnemy(p.x,p.y,range);if(!tg)return;p.cd=W.cd*(G.mods.pacd||1);p.swing=.3;p.combat=G.t;p.face={x:tg.x-p.x,y:tg.y-p.y};
 if(W.kind==='melee'){const ang=Math.atan2(tg.y-p.y,tg.x-p.x);enemiesNear(p.x,p.y,range).forEach(e=>{if(!inFan(p,e,range))return;hurtEnemy(e,W.dmg*(G.mods.pdmg||1),0,1);const a=Math.atan2(e.y-p.y,e.x-p.x);knockE(e,Math.cos(a)*.15,Math.sin(a)*.15)});G.fx.push({k:'fan',x:p.x,y:p.y,a:ang,t:0,life:.3,r:range,w:p.weapon})}
 else if(W.kind==='ranged')shoot(p,tg,W.dmg*(G.mods.pdmg||1),'frisbee',11,1);
 else{enemiesNear(p.x,p.y,range).forEach(e=>hurtEnemy(e,W.dmg*(G.mods.pdmg||1),.3,1));G.shake=Math.max(G.shake,.12);G.fx.push({k:'slam',x:p.x,y:p.y,t:0,life:.35,r:range});G.fx.push({k:'arc',x:p.x,y:p.y,a:Math.atan2(tg.y-p.y,tg.x-p.x),t:0,life:.26,r:Math.min(range,1.8),w:p.weapon})}}
// 墙段碰撞：敌人整段（含门）都过不去；自己人可以从门洞穿过
function segHit(g,x,y,r){const hl=g.len/2,ht=WALL_HT,dx=Math.abs(x-g.x),dy=Math.abs(y-g.y);return g.v?(dx<ht+r&&dy<hl+r):(dy<ht+r&&dx<hl+r)}
function segFriendHit(g,x,y,r){if(g.gate){const along=g.v?Math.abs(y-g.y):Math.abs(x-g.x);if(along<g.gate)return false}return segHit(g,x,y,r)}
function segClosest(g,x,y){return g.v?{x:g.x,y:clamp(y,g.y-g.len/2,g.y+g.len/2)}:{x:clamp(x,g.x-g.len/2,g.x+g.len/2),y:g.y}}
function bNear(s,x,y){if(s.t!=='wall')return{x:s.x,y:s.y};let best=null,bd=1e9;for(const g of segsOf(s)){const q=segClosest(g,x,y),d=Math.hypot(x-q.x,y-q.y);if(d<bd){bd=d;best=q}}return best}
function bDist(s,x,y){const q=bNear(s,x,y);return Math.hypot(x-q.x,y-q.y)-(s.t==='wall'?WALL_HT:.75)}
function wallHit(s,x,y,r,friend){for(const g of segsOf(s))if(friend?segFriendHit(g,x,y,r):segHit(g,x,y,r))return g;return null}
function enemySolid(x,y,r){for(const s of SPOTS){const b=G&&G.b[s.id];if(!b||!b.lv||b.dead)continue;if(s.t==='wall'){if(wallHit(s,x,y,r,0))return s}else if(Math.hypot(x-s.x,y-s.y)<.75+r)return s}return null}
function enemyBlock(x,y,r){return terrainBlock(x,y,r)||!!enemySolid(x,y,r)}
function solidAt(x,y,r,hero){if(terrainBlock(x,y,r))return true;for(const s of SPOTS){const b=G&&G.b[s.id];if(!b||!b.lv||b.dead)continue;if(hero&&s.t==='tower')continue;if(s.t==='wall'){if(wallHit(s,x,y,r,1))return true}else if(Math.hypot(x-s.x,y-s.y)<.6+r)return true}return false}
function blocker(e,nx,ny){return enemySolid(nx,ny,ENEMIES[e.k].r)}
// 被挤进墙/建筑里时挪到最近的空地；先只找"不隔着悬崖/河"的空地，避免把敌人甩到崖下或小平台上
function pushOut(o,r,en){const hit=en?(x,y)=>enemyBlock(x,y,r):(x,y)=>solidAt(x,y,r);if(!hit(o.x,o.y))return;
 const sameSide=!terrainBlock(o.x,o.y,0),cross=(x1,y1)=>{for(const s of SPOTS){if(s.t!=='wall')continue;const b=G&&G.b[s.id];if(!b||!b.lv||b.dead)continue;for(const g of segsOf(s)){
   if(g.v){if((o.x-g.x)*(x1-g.x)<0){const t=(g.x-o.x)/(x1-o.x),yy=o.y+(y1-o.y)*t;if(Math.abs(yy-g.y)<=g.len/2)return true}}else if((o.y-g.y)*(y1-g.y)<0){const t=(g.y-o.y)/(y1-o.y),xx=o.x+(x1-o.x)*t;if(Math.abs(xx-g.x)<=g.len/2)return true}}}return false};
 for(let pass=sameSide?0:1;pass<2;pass++)for(let d=.2;d<3;d+=.18)for(let a=0;a<14;a++){const nx=o.x+Math.cos(a*Math.PI/7)*d,ny=o.y+Math.sin(a*Math.PI/7)*d;
  if(nx>.4&&ny>.4&&nx<MAP_W-.4&&ny<MAP_H-.4&&!hit(nx,ny)&&(pass||terrainLine(o.x,o.y,nx,ny,0)&&!cross(nx,ny))){o.x=nx;o.y=ny;return}}}
// 寻路网格：有缺口就流向城堡，围死了就去打最近的墙
const CELL=.5;let navW=0,navH=0,navBlock,navFriend,flowX,flowY,flowOk,navDirty=1,tFlowX,tFlowY,tFlowOk;
function rebuildNav(){navDirty=0;navW=Math.ceil(MAP_W/CELL)+1;navH=Math.ceil(MAP_H/CELL)+1;const n=navW*navH;navBlock=new Uint8Array(n);navFriend=new Uint8Array(n);
 for(let iy=0;iy<navH;iy++)for(let ix=0;ix<navW;ix++){const x=ix*CELL,y=iy*CELL,o=y<0||x<0||x>MAP_W||y>MAP_H;navBlock[iy*navW+ix]=o||(G&&enemyBlock(x,y,.45))?1:0;navFriend[iy*navW+ix]=o||(G&&solidAt(x,y,.28))?1:0}
 flowX=new Int8Array(n);flowY=new Int8Array(n);flowOk=new Uint8Array(n);const qx=new Int16Array(n),qy=new Int16Array(n);let qh=0,qt=0;
 const hx=Math.round(HOME.x/CELL),hy=Math.round(HOME.y/CELL),R=Math.ceil((HOME.r+.8)/CELL);
 for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const ix=hx+dx,iy=hy+dy;if(ix<0||iy<0||ix>=navW||iy>=navH||dx*dx+dy*dy>R*R)continue;const i=iy*navW+ix;if(navBlock[i]||flowOk[i])continue;flowOk[i]=1;qx[qt]=ix;qy[qt]=iy;qt++}
 const D=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
 while(qh<qt){const cx=qx[qh],cy=qy[qh];qh++;
  for(const [dx,dy] of D){if(dx&&dy&&(navBlock[cy*navW+(cx+dx)]||navBlock[(cy+dy)*navW+cx]))continue;
   const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=navW||ny>=navH)continue;const i=ny*navW+nx;if(flowOk[i]||navBlock[i])continue;
   flowOk[i]=1;flowX[i]=-dx;flowY[i]=-dy;qx[qt]=nx;qy[qt]=ny;qt++}}
 // 只看地形的流场：家被围死时，敌人沿它走到真正挡路的墙/建筑再砸，不会隔着河/悬崖干等
 const tb=new Uint8Array(n);for(let iy=0;iy<navH;iy++)for(let ix=0;ix<navW;ix++){const x=ix*CELL,y=iy*CELL;tb[iy*navW+ix]=y<0||x<0||x>MAP_W||y>MAP_H||terrainBlock(x,y,.45)?1:0}
 tFlowX=new Int8Array(n);tFlowY=new Int8Array(n);tFlowOk=new Uint8Array(n);qh=0;qt=0;
 for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const ix=hx+dx,iy=hy+dy;if(ix<0||iy<0||ix>=navW||iy>=navH||dx*dx+dy*dy>R*R)continue;const i=iy*navW+ix;if(tb[i]||tFlowOk[i])continue;tFlowOk[i]=1;qx[qt]=ix;qy[qt]=iy;qt++}
 while(qh<qt){const cx=qx[qh],cy=qy[qh];qh++;
  for(const [dx,dy] of D){if(dx&&dy&&(tb[cy*navW+(cx+dx)]||tb[(cy+dy)*navW+cx]))continue;
   const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=navW||ny>=navH)continue;const i=ny*navW+nx;if(tFlowOk[i]||tb[i])continue;
   tFlowOk[i]=1;tFlowX[i]=-dx;tFlowY[i]=-dy;qx[qt]=nx;qy[qt]=ny;qt++}}}
function tFlowAt(x,y){if(navDirty||!tFlowOk)rebuildNav();return flowLook(tFlowOk,tFlowX,tFlowY,x,y)}
function terrainLine(x0,y0,x1,y1,r){const d=Math.hypot(x1-x0,y1-y0)||.001,n=Math.max(2,Math.ceil(d/.3));for(let i=1;i<=n;i++)if(terrainBlock(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n,r))return false;return true}
// 敌人半径比寻路格小，可能站在被标成"挡住"的格子里：这时先朝旁边最近的可走格走，而不是当成没路
function flowLook(ok,fx,fy,x,y){const ix=clamp(Math.round(x/CELL),0,navW-1),iy=clamp(Math.round(y/CELL),0,navH-1),i=iy*navW+ix;if(ok[i])return{ok:1,x:fx[i],y:fy[i]};
 let best=null,bd=1e9;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const jx=ix+dx,jy=iy+dy;if(jx<0||jy<0||jx>=navW||jy>=navH||!ok[jy*navW+jx])continue;const cx=jx*CELL,cy=jy*CELL,d=Math.hypot(cx-x,cy-y);if(d<bd){bd=d;best={ok:1,x:cx-x,y:cy-y}}}
 if(best&&!best.x&&!best.y)best.x=.001;return best||{ok:0}}
function flowAt(x,y){if(navDirty||!flowOk)rebuildNav();return flowLook(flowOk,flowX,flowY,x,y)}
function lineClear(x0,y0,x1,y1,r,en){const d=Math.hypot(x1-x0,y1-y0)||.001,n=Math.max(2,Math.ceil(d/.3));for(let i=1;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;if(en?enemySolid(x,y,r):solidAt(x,y,r))return false}return true}
function nearestWall(x,y){let best=null,bd=1e9;for(const s of SPOTS){if(s.t!=='wall')continue;const b=G.b[s.id];if(!b.lv||b.dead)continue;const d=bDist(s,x,y);if(d<bd){bd=d;best=s}}return best}
function astar(x0,y0,x1,y1,friend){if(navDirty||!navFriend)rebuildNav();const blk=friend?navFriend:navBlock;
 const ix0=clamp(Math.round(x0/CELL),0,navW-1),iy0=clamp(Math.round(y0/CELL),0,navH-1),ix1=clamp(Math.round(x1/CELL),0,navW-1),iy1=clamp(Math.round(y1/CELL),0,navH-1);
 const n=navW*navH,came=new Int32Array(n).fill(-1),cost=new Float32Array(n).fill(1e9);
 const idx=(x,y)=>y*navW+x,ok=(x,y)=>x>=0&&y>=0&&x<navW&&y<navH&&!blk[idx(x,y)];
 let sx=ix0,sy=iy0,gx=ix1,gy=iy1;
 if(!ok(sx,sy)){for(let d=1;d<=4&&!ok(sx,sy);d++)for(let a=0;a<8;a++){const x=ix0+Math.round(Math.cos(a*Math.PI/4)*d),y=iy0+Math.round(Math.sin(a*Math.PI/4)*d);if(ok(x,y)){sx=x;sy=y;break}}}
 if(!ok(gx,gy)){for(let d=1;d<=6&&!ok(gx,gy);d++)for(let a=0;a<8;a++){const x=ix1+Math.round(Math.cos(a*Math.PI/4)*d),y=iy1+Math.round(Math.sin(a*Math.PI/4)*d);if(ok(x,y)){gx=x;gy=y;break}}}
 if(!ok(sx,sy))return null;
 // 二叉堆 A*；目标到不了时走到离目标最近的可达格，不再原地顶墙
 const hf=[],hi=[],push=(f,i)=>{let k=hf.length;hf.push(f);hi.push(i);while(k>0){const pk=(k-1)>>1;if(hf[pk]<=f)break;hf[k]=hf[pk];hi[k]=hi[pk];k=pk}hf[k]=f;hi[k]=i},
  pop=()=>{const top=hi[0],lf=hf.pop(),li=hi.pop(),m=hf.length;if(m){let k=0;for(;;){let c=2*k+1;if(c>=m)break;if(c+1<m&&hf[c+1]<hf[c])c++;if(hf[c]>=lf)break;hf[k]=hf[c];hi[k]=hi[c];k=c}hf[k]=lf;hi[k]=li}return top};
 const s0=idx(sx,sy);cost[s0]=0;push(Math.hypot(sx-gx,sy-gy),s0);const D=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.41],[1,-1,1.41],[-1,1,1.41],[-1,-1,1.41]];
 const done=new Uint8Array(n);let found=-1,near=s0,nearH=Math.hypot(sx-gx,sy-gy);
 while(hf.length){const ci=pop();if(done[ci])continue;done[ci]=1;const cx=ci%navW,cy=(ci-cx)/navW;if(cx===gx&&cy===gy){found=ci;break}
  const h=Math.hypot(cx-gx,cy-gy);if(h<nearH){nearH=h;near=ci}
  for(const[dx,dy,c]of D){const nx=cx+dx,ny=cy+dy;if(!ok(nx,ny))continue;if(dx&&dy&&(blk[idx(cx+dx,cy)]||blk[idx(cx,cy+dy)]))continue;
   const i=idx(nx,ny),nc=cost[ci]+c;if(nc<cost[i]){cost[i]=nc;came[i]=ci;push(nc+Math.hypot(nx-gx,ny-gy),i)}}}
 if(found<0)found=near;const path=[];let i=found;while(i>=0&&path.length<n){path.push({x:(i%navW)*CELL,y:Math.floor(i/navW)*CELL});i=came[i]}path.reverse();return path}
function unitRespawn(sid){const s=spotOf(sid),b=s&&G.b[s.id],lv=(b&&b.lv)||1,base=((s&&BUILD[s.t]||{}).rev||[20,16,12])[lv-1]||20;
 return Math.max(6,base*(G.mods.rev||1)*(1-(G.home.rev||0))*(hasPick(b,'horde')?0.8:1)*(hasPick(b,'rally')?0.7:1))}
function flashHit(tg,x,y,slam){if(tg.kind==='home'){G.home.hurtT=1}else if(tg.kind==='b'){const b=G.b[tg.s.id];if(b)b.flash=.22}else if(tg.o)tg.o.flash=.18;
 G.fx.push({k:slam?'slam':'slash',x,y,t:0,life:slam?.38:.2,r:slam?1.25:.55,a:0})}
function dealTo(tg,d,src){if(!liveTg(tg))return;const x=(src&&src.x)||0,y=(src&&src.y)||0;
 if(tg.kind==='home'){G.home.hp-=d;G.home.hurtT=1;flashHit(tg,x,y,0);sfx('home')}
 else if(tg.kind==='b'){const b=G.b[tg.s.id];if(!b||b.dead)return;if(tg.s.t==='wall'){const lv=b.lv||1,ar=((BUILD.wall.armor||[])[lv-1]||0)+(hasPick(b,'fort')?0.08:0);d*=1-ar}b.hp-=d;b.flash=.2;flashHit(tg,x,y,0);if(tg.s.t==='wall'&&src&&src.byE)reflectWall(b,src.byE,d);
  if(b.hp<=0){b.hp=0;b.dead=1;navDirty=1;G.stats.broke=(G.stats.broke||0)+1;hooks.toast(bName(tg.s)+'被打坏了！明早会修好');G.fx.push({k:'puff',x:tg.s.x,y:tg.s.y,t:0,life:.6})}}
 else{const o=tg.o;o.hp-=d;o.flash=.18;if(tg.kind==='p'){sfx('hurt');o.combat=G.t}if(o.hp<=0){o.hp=0;o.dead=1;o.respawn=tg.kind==='p'?8:unitRespawn(o.home);if(tg.kind==='p')hooks.toast(DOGS[o.dog].name+'被打倒了… 8 秒后回城堡复活')}}}
function hitTarget(e,tg,d){d*=G.mods.edmg;if(tg.kind==='home'||tg.kind==='b')d*=(G.mods.esmash||1);if(tg.kind==='p')d*=(G.mods.phurt||1);if(tg.kind==='u'&&G.home.guard&&tg.o&&Math.hypot(tg.o.x-HOME.x,tg.o.y-HOME.y)<4.6)d*=1-G.home.guard;
 if(tg.kind==='b'&&tg.s&&tg.s.t==='wall'){const b=G.b[tg.s.id]||{},lv=b.lv||1,ar=((BUILD.wall.armor||[])[lv-1]||0)+(hasPick(b,'fort')?0.08:0);d*=1-ar}
 const hx=tg.kind==='b'?tg.s.x:tg.kind==='home'?HOME.x:(tg.o&&tg.o.x)||e.x,hy=tg.kind==='b'?tg.s.y:tg.kind==='home'?HOME.y:(tg.o&&tg.o.y)||e.y;
 flashHit(tg,(hx+e.x)/2,(hy+e.y)/2,ENEMIES[e.k]&&ENEMIES[e.k].smash);
 if(tg.kind==='home'){G.home.hp-=d;G.home.hurtT=1;G.shake=Math.max(G.shake,.15);sfx('home')}
 else if(tg.kind==='b'){const b=G.b[tg.s.id];b.hp-=d;if(tg.s.t==='wall')reflectWall(b,e,d);if(b.hp<=0){b.hp=0;b.dead=1;navDirty=1;G.stats.broke=(G.stats.broke||0)+1;hooks.toast(bName(tg.s)+'被打坏了！明早会修好');G.fx.push({k:'puff',x:tg.s.x,y:tg.s.y,t:0,life:.6})}}
 else{const o=tg.o;o.hp-=d;o.flash=.18;if(tg.kind==='p'){sfx('hurt');o.combat=G.t}if(o.hp<=0){o.hp=0;o.dead=1;o.respawn=tg.kind==='p'?8:unitRespawn(o.home);if(tg.kind==='p')hooks.toast(DOGS[o.dog].name+'被打倒了… 8 秒后回城堡复活')}}}
function reflectWall(b,e,d){if(!e||e.dead||!d)return;const r=(hasPick(b,'thorns')?0.2:0)+(hasPick(b,'spikes')?0.2:0)+(hasPick(b,'lash')?0.2:0);if(!r)return;hurtEnemy(e,d*r,hasPick(b,'lash')?0.35:0,0);if(hasPick(b,'lash'))applySlow(e,0.9)}
function aimOf(tg,e){if(!tg)return{x:e.x,y:e.y,r:0};if(tg.kind==='p'||tg.kind==='u')return{x:tg.o.x,y:tg.o.y,r:.3};if(tg.kind==='b'){const q=bNear(tg.s,e.x,e.y);return{x:q.x,y:q.y,r:tg.s.t==='wall'?0:.75}}return{x:HOME.x,y:HOME.y,r:HOME.r}}
function liveTg(tg){if(!tg)return false;if(tg.kind==='b')return G.b[tg.s.id]&&!G.b[tg.s.id].dead;if(tg.kind==='home')return G.home.hp>0;return tg.o&&!tg.o.dead}
function startAtk(e,tg){const E=ENEMIES[e.k];e.wind=E.smash?(e.k==='boss'?.42:.32):(E.throw?.22:.16);e.windMax=e.wind;e.atk=0;e.cd=E.cd;e.atkTg=tg;const a=aimOf(tg,e);e.atkA=Math.atan2(a.y-e.y,a.x-e.x);if(Math.abs(a.x-e.x)>.05)e.dir=a.x<e.x?2:3}
function landAtk(e){const E=ENEMIES[e.k],tg=e.atkTg;e.atk=E.smash?(e.k==='boss'?.36:.28):.22;e.atkMax=e.atk;if(!liveTg(tg))return;
 const a=aimOf(tg,e);e.atkA=Math.atan2(a.y-e.y,a.x-e.x);if(Math.abs(a.x-e.x)>.05)e.dir=a.x<e.x?2:3;
 if(E.throw){const ang=e.atkA,x0=e.x+Math.cos(ang)*E.r,y0=e.y+Math.sin(ang)*E.r,dx=a.x-x0,dy=a.y-y0,dur=Math.max(.22,Math.hypot(dx,dy)/7.5);
  G.shots.push({kind:'junk',arc:1,x:x0,y:y0,x0,y0,tgt:null,tx:a.x,ty:a.y,dmg:E.dmg*(G.mods.edmg||1)*(tg.kind==='home'||tg.kind==='b'?(G.mods.esmash||1):1),t:0,dur,h:.7,z:0,byP:0,tgB:tg,byE:e})}
 else{hitTarget(e,tg,E.dmg*(tg.kind==='b'&&E.smash?1.6:1));if(E.smash){G.shake=Math.max(G.shake,e.k==='boss'?.28:.16);G.fx.push({k:'quake',x:a.x,y:a.y,t:0,life:.4,r:e.k==='boss'?1.8:1.2})}}}
function stepEnemy(e,dt){const E=ENEMIES[e.k];e.cd-=dt;e.flash=Math.max(0,(e.flash||0)-dt);if(e.stun>0){e.stun-=dt;e.wind=0;return}
 if((e.wind||0)>0){e.wind-=dt;e.moving=false;if(e.wind<=0){e.wind=0;landAtk(e)}return}
 if((e.atk||0)>0){e.atk-=dt;e.moving=false;return}
 e.rt-=dt;if(e.rt<=0){e.rt=.35;e.tg=null;let bd=E.aggro;
  for(const p of Object.values(G.players))if(!p.dead){const d=dist(p,e);if(d<bd){bd=d;e.tg={kind:'p',o:p}}}
  for(const u of G.units)if(!u.dead){const d=dist(u,e);if(d<bd){bd=d;e.tg={kind:'u',o:u}}}
  if(!e.tg){let bb=.45+(E.smash?.9:0);for(const s of SPOTS){const b=G.b[s.id];if(!b.lv||b.dead)continue;const d=bDist(s,e.x,e.y);if(d<bb){const q=bNear(s,e.x,e.y);if(!terrainLine(e.x,e.y,q.x,q.y,E.r*.6))continue;bb=d;e.tg={kind:'b',s}}}}}
 if(e.tg&&(e.tg.kind==='b'?G.b[e.tg.s.id].dead:e.tg.o.dead))e.tg=null;
 let tx,ty,tr,tg=e.tg;
 if(tg&&(tg.kind==='p'||tg.kind==='u')&&(!lineClear(e.x,e.y,tg.o.x,tg.o.y,E.r*.55,1)||!terrainLine(e.x,e.y,tg.o.x,tg.o.y,0)))tg=null;
 if(tg&&(tg.kind==='p'||tg.kind==='u')){tx=tg.o.x;ty=tg.o.y;tr=.3}
 else if(tg&&tg.kind==='b'){const q=bNear(tg.s,e.x,e.y);tx=q.x;ty=q.y;tr=tg.s.t==='wall'?0:.75}
 else{const fl=flowAt(e.x,e.y);if(fl.ok){if(!fl.x&&!fl.y){tx=HOME.x;ty=HOME.y;tr=HOME.r;tg={kind:'home'}}else{tx=e.x+fl.x;ty=e.y+fl.y;tr=0;tg={kind:'home'}}}
  else{const w=nearestWall(e.x,e.y),q=w&&bNear(w,e.x,e.y),tf=(!w||!terrainLine(e.x,e.y,q.x,q.y,E.r*.6))&&tFlowAt(e.x,e.y);
   if(tf&&tf.ok&&(tf.x||tf.y)){tx=e.x+tf.x;ty=e.y+tf.y;tr=0;tg={kind:'home'}}
   else if(w){tg={kind:'b',s:w};e.tg=tg;tx=q.x;ty=q.y;tr=0}else{tx=HOME.x;ty=HOME.y;tr=HOME.r;tg={kind:'home'}}}}
 const dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy)||.001;e.moving=false;
 // 出手距离看真正的目标（城堡/人/建筑），不能看寻路格子，否则会在地图边上对空挥砸/扔石头
 const aa=aimOf(tg,e),dAtk=Math.hypot(aa.x-e.x,aa.y-e.y),reach=E.throw||(E.r+aa.r+.15);
 if(tg&&dAtk<=reach){if(e.cd<=0)startAtk(e,tg);return}
 let sp=E.spd*(G.mods.espd||1)*dt;if(e.slowT>0){e.slowT-=dt;sp*=.65}if(G.home.cozy&&Math.hypot(e.x-HOME.x,e.y-HOME.y)<4.2)sp*=1-G.home.cozy;
 const nx=e.x+dx/d*sp,ny=e.y+dy/d*sp,bl=blocker(e,nx,ny);
 if(bl){if(e.cd<=0)startAtk(e,{kind:'b',s:bl});return}
 if(terrainBlock(nx,ny,E.r)){const ax=e.x+dx/d*sp,ay=e.y,bx=e.x,by=e.y+dy/d*sp;
  if(Math.abs(dx/d*sp)>1e-3&&!terrainBlock(ax,ay,E.r)&&!enemySolid(ax,ay,E.r)){e.x=ax;e.moving=true;e.ph+=dt*9;return}
  if(Math.abs(dy/d*sp)>1e-3&&!terrainBlock(bx,by,E.r)&&!enemySolid(bx,by,E.r)){e.y=by;e.moving=true;e.ph+=dt*9;return}
  // 两个方向都被地形挡住（贴着河岸/崖边）：先挪回最近的寻路格中心再继续
  const gx=Math.round(e.x/CELL)*CELL-e.x,gy=Math.round(e.y/CELL)*CELL-e.y,gd=Math.hypot(gx,gy);
  if(gd>.02){const k=Math.min(sp,gd)/gd,cx=e.x+gx*k,cy=e.y+gy*k;if(!terrainBlock(cx,cy,E.r)&&!enemySolid(cx,cy,E.r)){e.x=cx;e.y=cy;e.moving=true;e.ph+=dt*9}}return}
 e.x=nx;e.y=ny;e.moving=true;e.ph+=dt*9;if(Math.abs(dx)>.05)e.dir=dx<0?2:3}
function unitAnchor(u){const A=G.army,L=A.leader&&G.players[A.leader];
 if(A.mode==='follow'&&L){if(!L.dead){A.x=L.x;A.y=L.y}}
 if(A.mode!=='camp'){const n=G.units.length,i=G.units.indexOf(u),a=i/n*Math.PI*2+(A.mode==='follow'?Math.PI/2:0),r=n>5?1.5:1.2;return{x:A.x+Math.cos(a)*r,y:A.y+Math.sin(a)*r*.8}}
 const a=u.slot*2.4+(u.k==='duck'?1.2:0),s=spotOf(u.home);return{x:s.x+Math.cos(a)*1.1,y:s.y+.6+Math.sin(a)*.7}}
// 小兵卡在塔/墙角之间（两个方向都走不动）：挪到旁边一个可走的寻路格中心，挑离目标最近的
function unstickUnit(u,sp,goal,force){if(navDirty||!navFriend)rebuildNav();const ix=Math.round(u.x/CELL),iy=Math.round(u.y/CELL);let best=null,bd=1e9;
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const jx=ix+dx,jy=iy+dy;if(jx<0||jy<0||jx>=navW||jy>=navH||navFriend[jy*navW+jx])continue;const cx=jx*CELL,cy=jy*CELL,dd=Math.hypot(cx-u.x,cy-u.y);if(dd<.05)continue;
  const n=Math.ceil(dd/.1);let clear=true;for(let k=1;k<=n;k++)if(solidAt(u.x+(cx-u.x)*k/n,u.y+(cy-u.y)*k/n,.26)){clear=false;break}if(!clear)continue;const sc=dd+Math.hypot(cx-goal.x,cy-goal.y)*.5;if(sc<bd){bd=sc;best={x:cx,y:cy,d:dd}}}
 // 被塔和墙角围死在小缝里：允许像主角一样从塔身上钻出去
 if(!best||force){const hx=Math.round(u.x/CELL),hy=Math.round(u.y/CELL);for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const jx=hx+dx,jy=hy+dy;if(jx<0||jy<0||jx>=navW||jy>=navH||navFriend[jy*navW+jx])continue;const cx=jx*CELL,cy=jy*CELL,dd=Math.hypot(cx-u.x,cy-u.y);if(dd<.05)continue;
  const n=Math.ceil(dd/.1);let clear=true;for(let k=1;k<=n;k++)if(solidAt(u.x+(cx-u.x)*k/n,u.y+(cy-u.y)*k/n,.26,1)){clear=false;break}if(!clear)continue;const sc=dd+Math.hypot(cx-goal.x,cy-goal.y)*.5;if(sc<bd){bd=sc;best={x:cx,y:cy,d:dd,thru:1}}}}
 if(best&&(best.thru||force)){u.escape={x:best.x,y:best.y};return}
 if(best){const k=Math.min(sp,best.d)/best.d;u.x+=(best.x-u.x)*k;u.y+=(best.y-u.y)*k;u.path=null;u.pathT=0}}
function stepUnit(u,dt){const U=UNITS[u.k],s=spotOf(u.home),b=G.b[s.id];u.flash=Math.max(0,(u.flash||0)-dt);
 if(u.dead){if(G.phase==='night'&&!b.dead){u.respawn-=dt;if(u.respawn<=0){u.dead=0;u.hp=u.max;u.x=s.x;u.y=s.y+.6;u.escape=null;u.path=null}}return}
 u.cd-=dt;const an=unitAnchor(u);if(solidAt(an.x,an.y,.26))pushOut(an,.26);let goal=an,tg=null;
 if(G.phase==='night'){tg=nearestEnemy(u.x,u.y,3.4*(G.mods.urange||1));if(tg&&dist(tg,an)>5.5*(G.mods.urange||1))tg=null}
 const dmg=U.dmg*G.mods.pet*(G.mods.udmg||1)*(1+.3*(b.lv-1))*campDmgMul(b)*(G.home.aura>1&&Math.hypot(u.x-HOME.x,u.y-HOME.y)<4.6?G.home.aura:1),rng=U.range*(G.mods.urange||1);
 if(tg){const d=dist(tg,u)-ENEMIES[tg.k].r;if(d<=rng){u.moving=false;if(u.cd<=0){u.cd=U.cd*(G.mods.ucd||1)*(hasPick(b,'fierce')?0.85:1);u.atk=.2;u.atkAt=G.t;if(u.k==='duck')shoot(u,tg,dmg,'bread',9,'u');else hurtEnemy(tg,dmg,0,'u')}u.dir=tg.x<u.x?2:3;return}goal=tg}
 if(u.escape){const ex=u.escape.x-u.x,ey=u.escape.y-u.y,ed=Math.hypot(ex,ey),es=Math.min(ed,U.spd*dt);if(ed<.05||!solidAt(u.x,u.y,.26)&&ed<.3){u.escape=null}else{const nx=u.x+ex/ed*es,ny=u.y+ey/ed*es;if(!solidAt(nx,ny,.26,1)){u.x=nx;u.y=ny}else u.escape=null;u.moving=true;u.ph+=dt*12;return}}
 const dx=goal.x-u.x,dy=goal.y-u.y,d=Math.hypot(dx,dy);if(d<.15){u.moving=false;u.path=null;return}
 const sp=Math.min(d,U.spd*(G.mods.uspd||1)*dt*(d>3?1.4:1));let vx=dx/d,vy=dy/d;
 // 近处整条线通了才直走；否则按路径走，避免在崖边/墙角来回横跳
 const direct=d<8?lineClear(u.x,u.y,goal.x,goal.y,.26,0):(!u.path&&lineClear(u.x,u.y,u.x+vx*.8,u.y+vy*.8,.26,0));if(direct)u.path=null;
 if(!direct){u.pathT=(u.pathT||0)-dt;if(!u.path||u.pathT<=0){u.path=astar(u.x,u.y,goal.x,goal.y,1);u.pathT=.45}
  if(u.path&&u.path.length){while(u.path.length>1&&Math.hypot(u.path[0].x-u.x,u.path[0].y-u.y)<.35)u.path.shift();const q=u.path[0],pd=Math.hypot(q.x-u.x,q.y-u.y);if(u.path.length===1&&pd<.2){u.moving=false;return}vx=(q.x-u.x)/(pd||.001);vy=(q.y-u.y)/(pd||.001)} }
 const nx=u.x+vx*sp,ny=u.y+vy*sp;if(!solidAt(nx,ny,.26)){u.x=nx;u.y=ny}else{const ux=u.x,uy=u.y,ox=u.x+vx*sp;if(!solidAt(ox,u.y,.26))u.x=ox;if(!solidAt(u.x,u.y+vy*sp,.26))u.y+=vy*sp;pushOut(u,.26);
  if(u.x===ux&&u.y===uy)unstickUnit(u,sp,goal)}
 // 每秒看一次：想走却一秒内几乎没挪动（来回横跳），也当卡住处理
 u.chkT=(u.chkT||0)+dt;if(u.chkT>=1){if(d>.6&&u.chkX!=null&&Math.hypot(u.x-u.chkX,u.y-u.chkY)<.2)unstickUnit(u,sp,goal,1);u.chkT=0;u.chkX=u.x;u.chkY=u.y}
 u.moving=true;u.ph+=dt*12;if(Math.abs(vx)>.05)u.dir=vx<0?2:3}
// 被圆形建筑（塔/营地/菜园）挡住时，顺着边绕过去，不会卡住
function slideAround(p,inp,sp){let best=null,bd=1.4;for(const s of SPOTS){const b=G.b[s.id];if(!b.lv||b.dead||s.t==='wall')continue;const d=Math.hypot(p.x-s.x,p.y-s.y);if(d<bd){bd=d;best=s}}
 if(!best)return;const rx=(p.x-best.x)/bd,ry=(p.y-best.y)/bd;let tx=-ry,ty=rx;if(tx*inp.x+ty*inp.y<0){tx=-tx;ty=-ty}
 const nx=clamp(p.x+tx*sp,.5,MAP_W-.5),ny=clamp(p.y+ty*sp,.5,MAP_H-.5);if(!solidAt(nx,ny,.3,1)){p.x=nx;p.y=ny}}
function stepPlayer(p,dt){const inp=G.input[p.id]||{x:0,y:0};p.flash=Math.max(0,(p.flash||0)-dt);p.swing=Math.max(0,p.swing-dt);p.skillT=Math.max(0,(p.skillT||0)-dt);
 if(p.dead){p.respawn-=dt;if(p.respawn<=0){p.dead=0;p.hp=p.max;p.x=HOME.x;p.y=HOME.y+2}return}
 p.healFx=Math.max(0,(p.healFx||0)-dt);
 if(G.phase==='night'&&p.hp<p.max&&(G.t-(p.combat||0))>=4){p.hp=Math.min(p.max,p.hp+4*(G.mods.pregen||1)*dt);p.healFx=.35;p.healAcc=(p.healAcc||0)+dt;if(p.healAcc>.4){p.healAcc=0;G.fx.push({k:'heal',x:p.x+(Math.random()-.5)*.3,y:p.y-.4,t:0,life:.55})}}
 const m=Math.hypot(inp.x,inp.y),ox=p.x,oy=p.y;p.moving=m>.1;
 if(p.moving){const sp=4.2*(G.mods.pspd||1)*dt*Math.min(1,m),inside=solidAt(p.x,p.y,.3,1);const nx=clamp(p.x+inp.x/Math.max(1,m)*sp,.5,MAP_W-.5);if(inside||!solidAt(nx,p.y,.3,1))p.x=nx;const ny=clamp(p.y+inp.y/Math.max(1,m)*sp,.5,MAP_H-.5);if(inside||!solidAt(p.x,ny,.3,1))p.y=ny;p.ph+=dt*11;
  if(!inside&&Math.hypot(p.x-ox,p.y-oy)<sp*.35)slideAround(p,inp,sp);
  p.dir=Math.abs(inp.x)>Math.abs(inp.y)?(inp.x<0?2:3):(inp.y<0?1:0);p.face={x:inp.x,y:inp.y};
  if(Math.hypot(p.x-HOME.x,p.y-HOME.y)<HOME.r){const a=Math.atan2(p.y-HOME.y,p.x-HOME.x);p.x=HOME.x+Math.cos(a)*HOME.r;p.y=HOME.y+Math.sin(a)*HOME.r}}
 if(G.phase==='night')playerAttack(p,dt);else{p.skillCd=0}}
function spawnAt(dir){const D=DIRS[dir],j=(Math.random()-.5)*3;let x=D.x+(dir==='N'||dir==='S'?j:0),y=D.y+(dir==='W'||dir==='E'?j:0);
 if(MAP.terrain&&MAP.terrain.walk){const a=Math.atan2(HOME.y-D.y,HOME.x-D.x);let fx=null,fy=null;
  for(let i=0;i<24;i++){const px=D.x+Math.cos(a)*i*.35,py=D.y+Math.sin(a)*i*.35;if(!terrainBlock(px,py,.25)){fx=px;fy=py;break}}
  if(fx!=null){const px=-Math.sin(a),py=Math.cos(a),j2=(Math.random()-.5)*1.2;if(!terrainBlock(fx+px*j2,fy+py*j2,.25)){x=fx+px*j2;y=fy+py*j2}else{x=fx;y=fy}}
  else{x=clamp(x,.6,MAP_W-.6);y=clamp(y,.6,MAP_H-.6)}}
 return{x,y}}
// 城堡连弩：上弦 → 发射 → 回弹，时间轴和原来一致
const THROW_WIND=.15,THROW_SWING=.10,THROW_FOLLOW=.20,THROW_MAX=THROW_WIND+THROW_SWING+THROW_FOLLOW,THROW_RELEASE=THROW_WIND+THROW_SWING*.92;
const BOTTLE_FLY=.493,BOTTLE_HOLD=.493;
// 连弩的瞄准方向（只影响画面）。发射点逻辑位置与原版一致，画面上从城门顶的连弩飞出
const BOW_Z=2.7;let bowAim=Math.PI/2;
function panbaoPose(){const throwing=(G.home.throwT||0)>0,mx=G.home.throwMax||THROW_MAX,tp=throwing?1-G.home.throwT/mx:-1;
 const face=Math.cos(G.home.throwA||0),side=face>=0?1:-1;return{tp,side,face}}
function panbaoPawWorld(){const p=panbaoPose();return{x:HOME.x+p.side*.068,y:HOME.y+1.8}}

function homeHas(id){return !!(G.home.bpicks&&G.home.bpicks.includes(id))}
function fireBottles(tg0){const paws=panbaoPawWorld(),x0=paws.x,y0=paws.y,n=homeHas('double')?2:1,dmg=(G.home.bdmg||5)*(homeHas('double')?0.75:1);
 const splash=homeHas('milkbomb')?1.7+(homeHas('sticky')?0.4:0):homeHas('sticky')?1.1:0,slow=(homeHas('milkbomb')||homeHas('sticky'))?(homeHas('sticky')?2.4:1.5):0;
 const tgs=[];if(tg0&&!tg0.dead)tgs.push(tg0);for(const e of nearestEnemies(HOME.x,HOME.y,(G.home.brange||3.8)+1,4))if(!tgs.some(q=>q.id===e.id))tgs.push(e);
 for(let i=0;i<n;i++){const tg=tgs[i]||tgs[0];if(!tg)continue;const dur=Math.max(.28,Math.hypot(tg.x-x0,tg.y-y0)/7.2);
  G.shots.push({kind:'bottle',arc:1,x:x0,y:y0,x0,y0,tgt:tg,tx:tg.x,ty:tg.y-.25,dmg,t:0,dur,h:1.2,z:0,byP:0,splash,splashMul:.65,slow})}}
function step(dt){if(!G||G.phase==='win'||G.phase==='lose')return;G.t+=dt;G.dark+=((G.phase==='night'?1:0)-G.dark)*Math.min(1,dt*1.5);
 for(const p of Object.values(G.players))stepPlayer(p,dt);
 if(G.phase==='night'){if(navDirty)rebuildNav();G.nightT+=dt;const n=G.night+1,mul=(1+.18*(n-1))*G.mods.ehp;
  while(G.spawnQ.length&&G.spawnQ[0].t<=G.nightT){const q=G.spawnQ.shift(),E=ENEMIES[q.k],p=spawnAt(q.dir);
   const hp=E.hp*mul*(q.k==='boss'?(G.mods.bossHp||1):1)*(q.k==='bear'?(G.mods.bearHp||1):1);G.enemies.push({id:uid++,k:q.k,x:p.x,y:p.y,hp,max:hp,cd:0,rt:0,dir:2,ph:Math.random()*6,moving:true})}
  for(const e of G.enemies)if(!e.dead)stepEnemy(e,dt);for(const e of G.enemies)if(!e.dead)tickBurn(e,dt);
  // 互相挤开
  const es=G.enemies,sx0=es.map(e=>e.x),sy0=es.map(e=>e.y);for(let i=0;i<es.length;i++)for(let k=i+1;k<es.length;k++){const a=es[i],b=es[k],rr=ENEMIES[a.k].r+ENEMIES[b.k].r,dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>0&&d<rr){const o=(rr-d)/2*.5;a.x-=dx/d*o;a.y-=dy/d*o;b.x+=dx/d*o;b.y+=dy/d*o}}
  // 互相挤的时候不能被挤进悬崖/河里
  for(let i=0;i<es.length;i++){const e=es[i];if(!e.dead&&terrainBlock(e.x,e.y,ENEMIES[e.k].r)&&!terrainBlock(sx0[i],sy0[i],ENEMIES[e.k].r)){e.x=sx0[i];e.y=sy0[i]}}for(const e of es)if(!e.dead)pushOut(e,ENEMIES[e.k].r,1);
  // 弹弓塔 + 城堡（连弩）
  for(const s of SPOTS){const b=G.b[s.id];if(s.t!=='tower'||!b.lv||b.dead)continue;b.cd-=dt;if(b.cd>0)continue;
   const snipe=hasPick(b,'snipe'),range=bStat(s,'range',b.lv)*(G.mods.trange||1)*(hasPick(b,'trange')?TOWER3.trange:1)*(snipe?TOWER3.snipeR:1),dmg=bStat(s,'dmg',b.lv)*(G.mods.tdmg||1)*(hasPick(b,'tdmg')?TOWER3.tdmg:1)*(snipe?TOWER3.snipeD:1);
   const volley=hasPick(b,'volley'),tgs=nearestEnemies(s.x,s.y,range,volley?3:1);if(!tgs.length)continue;
   b.cd=bStat(s,'cd',b.lv)*(G.mods.trate||1)*(snipe?TOWER3.snipeCd:1)*(hasPick(b,'quickfire')?TOWER3.quickCd:1);const burn=hasPick(b,'burn')?TOWER3.burnP:0;
   const topY=s.y-(1.05+b.lv*.25);if(snipe){const tg=tgs[0];G.fx.push({k:'tracer',x:s.x,y:topY,x2:tg.x,y2:tg.y-.3,t:0,life:.22})}if(hasPick(b,'quickfire'))G.fx.push({k:'muzzle',x:s.x,y:topY,t:0,life:.14});const n=volley?3:1,each=volley?dmg*TOWER3.volleyEach:dmg,splash=hasPick(b,'bomb')?(hasPick(b,'pierce')?TOWER3.bombR+.75:TOWER3.bombR):0,slow=hasPick(b,'slow')?1.6:0,pierce=hasPick(b,'pierce')&&!hasPick(b,'bomb')?1:0;
   for(let i=0;i<n;i++){const tg=tgs[i%tgs.length];G.shots.push({x:s.x,y:s.y-.55,tgt:tg,tx:tg.x,ty:tg.y-.3,dmg:each,kind:snipe?'snipe':'pebble',spd:snipe?26:12,t:0,byP:0,splash,splashMul:TOWER3.bombMul,pierce,slow,burn})}}
  G.home.cd-=dt;
  if((G.home.throwT||0)>0){const prev=G.home.throwT,mx=G.home.throwMax||THROW_MAX;G.home.throwT=Math.max(0,G.home.throwT-dt);
   const p0=1-prev/mx,p1=1-G.home.throwT/mx,rel=THROW_RELEASE/mx;
   if(p0<rel&&p1>=rel&&!G.home.threw){G.home.threw=1;fireBottles(G.home.throwTg)}}
  if(G.home.cd<=0&&(G.home.throwT||0)<=0){const tg=nearestEnemy(HOME.x,HOME.y,G.home.brange||4);if(tg){G.home.cd=G.home.bcd||1.1;G.home.throwT=THROW_MAX;G.home.throwMax=THROW_MAX;G.home.threw=0;G.home.throwTg=tg;G.home.throwA=Math.atan2((tg.y-(HOME.y+1.6)),tg.x-HOME.x)}}
  if(G.home.hp<=0){G.home.hp=0;G.phase='lose';endGame(false)}}
 G.home.hurtT=Math.max(0,G.home.hurtT-dt);if(G.home.regen&&G.home.hp>0)G.home.hp=Math.min(G.home.max,G.home.hp+G.home.regen*dt);
 if(G.phase==='night'&&G.mods.bregen)for(const s of SPOTS){const b=G.b[s.id];if(b.lv&&!b.dead&&b.hp<b.max)b.hp=Math.min(b.max,b.hp+G.mods.bregen*dt)}
 for(const s of SPOTS){const b=G.b[s.id];if(b&&b.flash)b.flash=Math.max(0,b.flash-dt)}
 for(const u of G.units)stepUnit(u,dt);
 // 子弹
 for(const s of G.shots){s.t+=dt;
  if(s.arc){if(s.tgB&&(s.tgB.kind==='p'||s.tgB.kind==='u')&&liveTg(s.tgB)){s.tx=s.tgB.o.x;s.ty=s.tgB.o.y-.2}else if(s.tgt&&!s.tgt.dead){s.tx=s.tgt.x;s.ty=s.tgt.y-.25}
   const p=Math.min(1,s.t/(s.dur||.4));s.x=s.x0+(s.tx-s.x0)*p;s.y=s.y0+(s.ty-s.y0)*p;s.z=Math.sin(p*Math.PI)*(s.h||1);
   if(p>=1){s.done=1;if(s.kind==='bottle'){G.fx.push({k:'splash',x:s.x,y:s.y,t:0,life:.32});impactShot(s,s.tgt&&!s.tgt.dead?s.tgt:null)}
    else if(s.tgB)dealTo(s.tgB,s.dmg,s);else if(s.tgt&&!s.tgt.dead)hurtEnemy(s.tgt,s.dmg,0,s.byP)}
   continue}
  if(s.vx!=null){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;for(const e of enemiesNear(s.x,s.y,.35))if(!s.hit.has(e.id)){s.hit.add(e.id);hurtEnemy(e,s.dmg,0,s.byP)}if(s.life<=0)s.done=1;continue}
  if(s.tgt&&!s.tgt.dead){s.tx=s.tgt.x;s.ty=s.tgt.y-.3}const dx=s.tx-s.x,dy=s.ty-s.y,d=Math.hypot(dx,dy),mv=s.spd*dt;
  if(d<=mv+.1){s.done=1;impactShot(s,s.tgt&&!s.tgt.dead?s.tgt:null)}else{s.x+=dx/d*mv;s.y+=dy/d*mv}}
 G.shots=G.shots.filter(s=>!s.done);G.enemies=G.enemies.filter(e=>!e.dead);
 for(const c of G.coins){c.t+=dt;if(c.t>=.7&&!c.done){c.done=1;sfx('coin');hooks.coin&&hooks.coin()}}G.coins=G.coins.filter(c=>!c.done);G.shake=Math.max(0,G.shake-dt);for(const f of G.fx)f.t+=dt;G.fx=G.fx.filter(f=>f.t<f.life);for(const f of G.floats)f.t+=dt;G.floats=G.floats.filter(f=>f.t<1.1);
 if(G.phase==='night'&&!G.spawnQ.length&&!G.enemies.length)morning()}
// ================= 画面 =================
const cv=document.getElementById('map'),ctx=cv.getContext('2d');let VW=0,VH=0,T=36,DPR=1;const cam={x:HOME.x,y:HOME.y};
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);VW=cv.clientWidth||innerWidth;VH=cv.clientHeight||innerHeight;cv.width=VW*DPR;cv.height=VH*DPR;T=Math.max(26,Math.min(48,Math.min(VW,VH)/(VW>VH?12.5:11)))}
addEventListener('resize',resize);resize();
let OX=0,OY=0;const view={top:0,gold:{x:40,y:24},guide:null,mm:{x:8,y:60,s:96,big:false}};
const sx=x=>(x-cam.x)*T+VW/2+OX,sy=y=>(y-cam.y)*T+VH/2+OY;
// 静态装饰（树/石头/花）预先画到小画布上，省 CPU
const sprCache={};function cachedSpr(k,x,y,size){const key=k+'|'+size+'|'+T+'|'+DPR;let c=sprCache[key];
 if(!c){c=document.createElement('canvas');const u=size*T*DPR;c.width=Math.ceil(u*1.2);c.height=Math.ceil(u*1.15);const g=c.getContext('2d');g.scale(u,u);g.translate(.1,.1);S[k](g);sprCache[key]=c}
 ctx.drawImage(c,sx(x)-size*T/2-.1*size*T,sy(y)-size*T*.95-.1*size*T,c.width/DPR,c.height/DPR)}
function spr(fn,x,y,size,...a){ctx.save();ctx.translate(sx(x)-size*T/2,sy(y)-size*T*.95);ctx.scale(size*T,size*T);fn(ctx,...a);ctx.restore()}
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const DECOR=[];
function rebuildDecor(){DECOR.length=0;seed=7;const t=MAP&&MAP.terrain,lim=(t&&t.walk)?120:95;
 for(let i=0;i<420&&DECOR.length<lim;i++){const x=1+rnd()*(MAP_W-2),y=1+rnd()*(MAP_H-2);
 if(Math.hypot(x-HOME.x,y-HOME.y)<((t&&t.walk)?3.4:7.5))continue;
 if(t&&t.paths&&inRects(x,y,.45,t.paths))continue;if(t&&t.water&&inRects(x,y,.5,t.water))continue;if(t&&t.bridges&&inRects(x,y,.5,t.bridges))continue;
 if(!(t&&t.walk)&&(Math.abs(x-HOME.x)<2||Math.abs(y-HOME.y)<2))continue;
 if(SPOTS.some(s=>s.t==='wall'?segsOf(s).some(g=>Math.hypot(x-segClosest(g,x,y).x,y-segClosest(g,x,y).y)<1.3):Math.hypot(s.x-x,s.y-y)<2.2))continue;
 if(DECOR.some(d=>Math.hypot(d.x-x,d.y-y)<1.3))continue;
 const cliff=t&&t.walk&&terrainBlock(x,y,0);DECOR.push({x,y,k:cliff?'rock':rnd()<.62?'tree':rnd()<.5?'rock':'flower'})}}
rebuildDecor();
// ---- 士兵画法（单位格 0..1，脚在 .95） ----
function critter(c,k,dir,ph,mv,flash,atk){if(k==='kitten'||k==='duck')return S.soldier(c,k,dir,ph,mv,flash,atk);const f=dir===2?-1:1,b=mv?Math.abs(Math.sin(ph))*.05:0,K='#3b2a20';c.save();c.translate(.5,0);c.scale(f,1);c.translate(-.5,0);
 let lean=0,squ=1,rise=0;if(atk){if(atk.ph==='wind'){lean=-.14*atk.p;rise=.05*atk.p;squ=(k==='boss'||k==='bear')?1-.14*atk.p:1-.04*atk.p}else{const q=Math.sin(Math.min(1,atk.p*1.5)*Math.PI);lean=.2*q;squ=1+.12*q;if(k==='boss')squ=1+.22*q;rise=-.06*q}}
 c.save();c.translate(.5,.72);c.rotate(lean);c.scale(1+Math.max(0,1-squ)*.15,squ);c.translate(-.5,-.72-rise);
 const C={raccoon:['#9aa0a8','#6b7078','#f4f1ea'],wolf:['#7d8796','#5a6372','#d9dde3'],bear:['#a8774e','#7d5434','#e8c9a0'],boss:['#8f5e38','#6b4226','#e8c9a0'],kitten:['#ffb86b','#f08a3a','#fff3e0'],duck:['#ffe066','#f2c230','#fff8d0']}[k];
 const [body,dark,light]=flash?['#fff','#fff','#fff']:C;
 const E=(x,y,rx,ry,col,w=.05,rot=0)=>{c.beginPath();c.ellipse(x,y,rx,ry,rot,0,7);c.fillStyle=col;c.fill();if(w){c.lineWidth=w;c.strokeStyle=K;c.stroke()}};
 c.beginPath();c.ellipse(.5,.93,.3,.06,0,0,7);c.fillStyle='rgba(60,40,20,.25)';c.fill();
 if(k==='duck'){E(.5,.7-b,.26,.22,body);E(.36,.68-b,.1,.07,dark,.04,.4);E(.62,.44-b,.17,.16,body);E(.8,.47-b,.08,.04,'#ff9a3a',.04);E(.66,.41-b,.022,.022,K,0);E(.43,.92,.05,.03,'#ff9a3a',.03);E(.57,.92,.05,.03,'#ff9a3a',.03);c.restore();c.restore();return}
 // 尾巴
 if(k==='raccoon'){for(let i=0;i<3;i++)E(.18-i*.06,.62-i*.05-b,.08,.06,i%2?K:body,.04,.5)}else if(k==='kitten'){c.beginPath();c.moveTo(.26,.7);c.quadraticCurveTo(.08,.6,.16,.42);c.lineWidth=.07;c.strokeStyle=K;c.lineCap='round';c.stroke();c.lineWidth=.04;c.strokeStyle=body;c.stroke()}else if(k==='wolf')E(.2,.6-b,.13,.06,dark,.04,-.5);
 // 腿 + 身体
 const lg=mv?Math.sin(ph)*.04:0;[.34,.62].forEach((x,i)=>E(x+(i?lg:-lg),.88,.06,.05,dark,.04));
 E(.48,.7-b,.27,.2,body);
 const hx=.62,hy=.42-b,hr=k==='bear'||k==='boss'?.2:.18;
 // 耳朵
 if(k==='wolf'||k==='kitten'){[[-.11,0],[.1,0]].forEach(([o])=>{c.beginPath();c.moveTo(hx+o-.06,hy-.1);c.lineTo(hx+o,hy-.27);c.lineTo(hx+o+.06,hy-.1);c.closePath();c.fillStyle=body;c.fill();c.lineWidth=.045;c.strokeStyle=K;c.stroke()})}
 else{E(hx-.13,hy-.13,.06,.06,dark,.04);E(hx+.12,hy-.14,.06,.06,dark,.04)}
 E(hx,hy,hr,hr*.92,body);
 if(k==='raccoon')E(hx+.03,hy-.01,.15,.055,K,0);
 E(hx+.08,hy+.07,.09,.06,light,.03);E(hx+.14,hy+.05,.025,.02,K,0);
 const ey=k==='raccoon'?'#fff':K;E(hx-.03,hy-.02,.022,.026,ey,0);E(hx+.09,hy-.02,.022,.026,ey,0);
 if(k==='wolf'||k==='boss'){c.beginPath();c.moveTo(hx-.07,hy-.08);c.lineTo(hx+.01,hy-.05);c.moveTo(hx+.14,hy-.08);c.lineTo(hx+.07,hy-.05);c.lineWidth=.03;c.strokeStyle=K;c.stroke()}
 if(k==='kitten'){c.beginPath();c.moveTo(hx+.18,hy+.05);c.lineTo(hx+.3,hy+.02);c.moveTo(hx+.18,hy+.08);c.lineTo(hx+.3,hy+.1);c.lineWidth=.018;c.strokeStyle=K;c.stroke();E(hx-.06,hy+.06,.03,.02,'#ff9eae',0)}
 if(k==='boss'){c.beginPath();c.moveTo(hx-.12,hy-.16);c.lineTo(hx-.1,hy-.32);c.lineTo(hx-.03,hy-.22);c.lineTo(hx+.02,hy-.34);c.lineTo(hx+.07,hy-.22);c.lineTo(hx+.13,hy-.32);c.lineTo(hx+.13,hy-.16);c.closePath();c.fillStyle='#ffd23f';c.fill();c.lineWidth=.03;c.strokeStyle=K;c.stroke()}
 // 攻击动作：举手/挥爪/石头，让出手看得清楚
 if(atk){const wind=atk.ph==='wind',q=atk.p,pawX=wind?.72:.86,pawY=wind?.32:.62;
  if(k==='raccoon'&&(wind||q<.35)){c.beginPath();c.ellipse(pawX,pawY,.07,.055,0,0,7);c.fillStyle='#7a5a3a';c.fill();c.lineWidth=.035;c.strokeStyle=K;c.stroke()}
  else if(k==='wolf'||k==='raccoon'){c.beginPath();c.moveTo(hx+.16,hy+.04);c.lineTo(hx+.34,hy+(wind?-.06:.12));c.lineTo(hx+.18,hy+.1);c.closePath();c.fillStyle=light;c.fill();c.lineWidth=.035;c.strokeStyle=K;c.stroke()}
  else{const bx=wind?.7:.88,by=wind?.28:.7;c.beginPath();c.ellipse(bx,by,.1,.08,wind?-.6:.4,0,7);c.fillStyle=dark;c.fill();c.lineWidth=.04;c.strokeStyle=K;c.stroke()}}
 c.restore();c.restore()}
// 国王手握武器（单位空间：国王在 0..1 的格子里，握点在原点，武器朝 -y 方向）
const HK='#2a1d16',PAWC={white:'#ffdcbc',yellow:'#ffdcbc'};
function hLine(c,w){c.lineWidth=w;c.strokeStyle=HK;c.lineJoin=c.lineCap='round';c.stroke()}
function heldW(c,w,sc){c.save();c.scale(sc,sc);
 if(w==='spatula'){// 长剑
  c.beginPath();c.moveTo(-.045,-.12);c.lineTo(-.045,-.56);c.lineTo(0,-.64);c.lineTo(.045,-.56);c.lineTo(.045,-.12);c.closePath();c.fillStyle='#e4ebf2';c.fill();hLine(c,.04);
  c.beginPath();c.moveTo(0,-.15);c.lineTo(0,-.55);c.strokeStyle='#aab6c4';c.lineWidth=.02;c.stroke();
  c.beginPath();c.roundRect(-.13,-.14,.26,.06,.03);c.fillStyle='#ffd23f';c.fill();hLine(c,.035);
  c.beginPath();c.roundRect(-.03,-.09,.06,.14,.02);c.fillStyle='#8a5a3a';c.fill();hLine(c,.03);
  c.beginPath();c.arc(0,.07,.035,0,7);c.fillStyle='#ffd23f';c.fill();hLine(c,.03)}
 else if(w==='bone'){// 战锤
  c.beginPath();c.roundRect(-.035,-.4,.07,.46,.025);c.fillStyle='#b98257';c.fill();hLine(c,.04);
  c.beginPath();c.roundRect(-.17,-.6,.34,.2,.05);c.fillStyle='#b9c4cf';c.fill();hLine(c,.045);
  c.beginPath();c.roundRect(-.2,-.58,.06,.16,.02);c.roundRect(.14,-.58,.06,.16,.02);c.fillStyle='#9aa6b4';c.fill();hLine(c,.035);
  c.beginPath();c.arc(0,-.5,.035,0,7);c.fillStyle='#ffd23f';c.fill()}
 else{// 飞斧
  c.save();c.rotate(.3);c.beginPath();c.roundRect(-.025,-.3,.05,.32,.02);c.fillStyle='#b98257';c.fill();hLine(c,.035);
  c.beginPath();c.moveTo(.02,-.3);c.quadraticCurveTo(.2,-.34,.19,-.2);c.quadraticCurveTo(.19,-.1,.02,-.15);c.closePath();c.fillStyle='#d6dee6';c.fill();hLine(c,.04);c.restore()}
 c.restore()}
function hPaw(c,kind,x,y){c.beginPath();c.ellipse(x,y,.06,.055,0,0,7);c.fillStyle=PAWC[kind]||'#ffdcbc';c.fill();hLine(c,.04)}
function visDir(p){if(p.dir>=2)p.side=p.dir;const sk=(p.skillT||0)>0?1-p.skillT/.5:-1;if(sk>=0&&p.weapon==='spatula')return Math.floor(sk*10)%2?2:3;if(sk>=0&&p.weapon==='bone')return p.side||3;if(p.swing>0&&p.face){const f=p.face;if(Math.abs(f.x)>.05)p.side=f.x<0?2:3;return p.side||3}return p.dir}
function drawPlayer(p){const size=1.3,dir=visDir(p),kind=p.dog,w=p.weapon,sc=1.12,
  sk=(p.skillT||0)>0?1-p.skillT/.5:-1,k=p.swing>0?1-p.swing/.3:-1,bob=p.moving?Math.sin(p.ph)*.015:0,
  frHide=w==='frisbee'&&p.cd>WEAPONS.frisbee.cd-.35&&G.phase==='night';
 ctx.save();if(p.flash)ctx.globalAlpha=.6;ctx.translate(sx(p.x)-size*T/2,sy(p.y)-size*T*.95);ctx.scale(size*T,size*T);const c=ctx;
 const pose=()=>{
  if(sk>=0&&w==='spatula'){// 旋风斩：左右快速转身，长剑平举
   const f=dir===2?-1:1;c.save();c.translate(.5,0);c.scale(f,1);c.translate(-.5,0);c.save();c.translate(.74,.66);c.rotate(1.57);heldW(c,w,sc);c.restore();hPaw(c,kind,.72,.66);hPaw(c,kind,.79,.7);c.restore();return}
  if(sk>=0&&w==='frisbee'){const u=Math.sin(sk*Math.PI)*.06;hPaw(c,kind,.24,.52-u);hPaw(c,kind,.76,.52-u);return}
  if(sk>=0&&w==='bone'){// 震地一击：先举高，再狠狠砸到前面地上
   const f=dir===2?-1:1,q=sk<.45?sk/.45:1,e=Math.sin(q*Math.PI),gx=.7+.06*q,gy=sk<.45?.66-.14*q:.76;c.save();c.translate(.5,0);c.scale(f,1);c.translate(-.5,0);c.save();c.translate(gx,gy);c.rotate(sk<.45?-.6*q:1.95);heldW(c,w,sc*1.15);c.restore();hPaw(c,kind,gx-.03,gy);hPaw(c,kind,gx+.04,gy+.04);c.restore();return}
  if(dir===1){return}
  if(dir===0){// 正面
   if(k>=0){const e=Math.sin(k*Math.PI),lift=.12*e;
    if(w==='frisbee'){hPaw(c,kind,.42,.7-lift);hPaw(c,kind,.58,.7-lift);if(k>.75){c.globalAlpha*=(k-.75)*4;heldW(c,w,sc);}return}
    c.save();c.translate(.52,.86-lift);c.rotate(w==='spatula'?(-1.55+k*3.1):(-.9+k*2.6));heldW(c,w,sc);c.restore();hPaw(c,kind,.45,.76-lift);hPaw(c,kind,.59,.75-lift);return}
   if(w==='frisbee'){if(!frHide){c.save();c.translate(.5,.92+bob);heldW(c,w,sc);c.restore()}}
   else{c.save();c.translate(.6,.97+bob);c.rotate(.5);heldW(c,w,sc*.98);c.restore();hPaw(c,kind,.64,.86+bob);hPaw(c,kind,.7,.77+bob);return}
   hPaw(c,kind,.41,.75+bob);hPaw(c,kind,.6,.74+bob);return}
  // 侧面（右向画，左向镜像）
  const f=dir===2?-1:1;c.save();c.translate(.5,0);c.scale(f,1);c.translate(-.5,0);
  if(k>=0){const e=Math.sin(k*Math.PI);
   if(w==='frisbee'){const push=Math.min(1,k*2.5)*(1-Math.max(0,k-.6)*1.5);hPaw(c,kind,.68+.12*push,.74-.02*e);hPaw(c,kind,.72+.13*push,.8-.02*e);
    if(k>.75){c.globalAlpha*=(k-.75)*4;c.save();c.translate(.74,.9);heldW(c,w,sc*.9);c.restore()}}
   else{const gx=.75+.05*e,gy=.7-.1*e,sp=w==='spatula';c.save();c.translate(gx,gy);c.rotate(sp?(-1.6+k*3.15):(-.35+k*2.2));heldW(c,w,sc);c.restore();hPaw(c,kind,gx-.03,gy);hPaw(c,kind,gx+.04,gy+.04)}}
  else{if(w==='frisbee'){if(!frHide){c.save();c.translate(.72,.9+bob);c.rotate(.15);heldW(c,w,sc*.9);c.restore()}hPaw(c,kind,.7,.68+bob)}
   else{c.save();c.translate(.74,.84+bob);c.rotate(.38);heldW(c,w,sc);c.restore();hPaw(c,kind,.71,.7+bob);hPaw(c,kind,.77,.76+bob)}}
  c.restore()};
 // 背面：武器在国王前方（远离镜头），先画
 if(dir===1&&sk<0){c.save();c.translate(.56+(k>=0?.05:0),.78);c.rotate(k>=0?-.6+k*1.4:.1);if(!(w==='frisbee'&&(frHide||k>=0)))heldW(c,w,sc);c.restore()}
 S.king(c,dir,p.ph,p.moving,kind);pose();ctx.restore()}
// 着火的敌人：头顶和身上的小火苗
function drawFlames(e){const r=ENEMIES[e.k].r,X=sx(e.x),Y=sy(e.y)-r*T*1.6,t=performance.now()/120;ctx.save();
 for(let i=0;i<3;i++){const ox=(i-1)*r*T*.55,h=T*(.26+.08*Math.sin(t+i*2))*(.7+r),w=h*.5,y=Y+(i===1?-T*.12:0);
  ctx.beginPath();ctx.moveTo(X+ox,y-h);ctx.quadraticCurveTo(X+ox+w,y-h*.3,X+ox,y);ctx.quadraticCurveTo(X+ox-w,y-h*.3,X+ox,y-h);ctx.fillStyle='rgba(255,120,30,.9)';ctx.fill();
  ctx.beginPath();ctx.moveTo(X+ox,y-h*.6);ctx.quadraticCurveTo(X+ox+w*.5,y-h*.2,X+ox,y);ctx.quadraticCurveTo(X+ox-w*.5,y-h*.2,X+ox,y-h*.6);ctx.fillStyle='#ffe066';ctx.fill()}ctx.restore()}
function bar(x,y,w,frac,col){const X=sx(x)-w*T/2,Y=sy(y);ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.roundRect(X-1,Y-1,w*T+2,6,3);ctx.fill();ctx.fillStyle=col||(frac<.3?'#ff5a5a':frac<.6?'#ffb347':'#6fd07a');ctx.fillRect(X,Y,w*T*clamp(frac,0,1),4)}
function drawGateAt(g,b){const X=sx(g.x),Y=sy(g.y),u=T,gw=g.gate*u;let ox=g.v?1:0,oy=g.v?0:1;if(ox*(HOME.x-g.x)+oy*(HOME.y-g.y)>0){ox=-ox;oy=-oy}
 ctx.save();ctx.translate(X,Y);const post=(x,y)=>{ctx.fillStyle='#c98b52';ctx.strokeStyle='#3b2a20';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x-u*.11,y-u*.58,u*.22,u*.72,u*.08);ctx.fill();ctx.stroke();ctx.fillStyle='#e8b47c';ctx.beginPath();ctx.arc(x,y-u*.58,u*.1,0,7);ctx.fill();ctx.stroke()};
 const ax=g.v?0:1,ay=g.v?1:0;post(-ax*gw,-ay*gw);post(ax*gw,ay*gw);
 if(!b.dead){const wrap=d=>{while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d};const leaf=side=>{ctx.save();ctx.translate(side*ax*gw,side*ay*gw);const closed=Math.atan2(-side*ay,-side*ax),open=Math.atan2(oy,ox);ctx.rotate(closed+wrap(open-closed)*.78);ctx.fillStyle='#f2c28a';ctx.strokeStyle='#3b2a20';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(0,-u*.1,gw*.72,u*.2,u*.06);ctx.fill();ctx.stroke();ctx.restore()};leaf(-1);leaf(1)}
 ctx.restore()}
function drawWallSpot(s,b){const u=T,col=b.lv===1?'#c98b52':b.lv===2?'#b9bfc8':'#9aa3ae';ctx.lineWidth=2;ctx.strokeStyle='#3b2a20';ctx.lineJoin='round';
 for(const g of segsOf(s)){const L=g.len,n=Math.max(5,Math.round(L/.5));
  for(let i=0;i<n;i++){const o=-L/2+L*(i+.5)/n;if(g.gate&&Math.abs(o)<g.gate)continue;const px=sx(g.x)+(g.v?0:o*u),py=sy(g.y)+(g.v?o*u:0);
   const w=g.v?u*.78:u*(L/n)*1.08,h=g.v?u*(L/n)*1.08:u*.78;ctx.fillStyle=col;ctx.beginPath();ctx.roundRect(px-w/2,py-h/2-u*.16,w,h,u*.1);ctx.fill();ctx.stroke()}
  if(g.gate)drawGateAt(g,b)}
 if(b.lv===3){ctx.fillStyle='#ff8c5a';const g=segsOf(s)[0],L=g.len,fx=sx(g.x),fy=sy(g.y);[-.35,.35].forEach(q=>{const x=g.v?fx:fx+q*L*u,y=g.v?fy+q*L*u:fy;if(g.gate&&Math.abs(q*L)<g.gate)return;ctx.fillRect(x-1,y-u*1.05,2,u*.55);ctx.beginPath();ctx.moveTo(x+1,y-u*1.05);ctx.lineTo(x+u*.32,y-u*.9);ctx.lineTo(x+1,y-u*.75);ctx.fill()})}}
function drawBolt(c,sc,fire){c.save();c.scale(sc,sc);c.lineCap='round';c.beginPath();c.moveTo(-.5,0);c.lineTo(.36,0);c.lineWidth=.16;c.strokeStyle='#3b2a20';c.stroke();c.lineWidth=.08;c.strokeStyle='#c98b52';c.stroke();
 c.beginPath();c.moveTo(.58,0);c.lineTo(.3,-.14);c.lineTo(.36,0);c.lineTo(.3,.14);c.closePath();c.fillStyle='#d6dee6';c.fill();c.lineWidth=.06;c.strokeStyle='#3b2a20';c.lineJoin='round';c.stroke();
 [[-.5,-.16],[-.5,.16]].forEach(([x,y])=>{c.beginPath();c.moveTo(-.28,0);c.lineTo(x,y);c.lineTo(-.42,0);c.closePath();c.fillStyle='#ff6b6b';c.fill();c.lineWidth=.05;c.stroke()});
 if(fire){c.beginPath();c.arc(.42,0,.14,0,7);c.fillStyle='rgba(255,140,40,.85)';c.fill();c.beginPath();c.arc(.42,0,.07,0,7);c.fillStyle='#ffe066';c.fill()}c.restore()}
// 城门顶上的连弩：上弦（弦往后拉）→ 发射（弹回）→ 复位；时间轴就是原来的 THROW_* 不变
function drawCastleBow(){const p=panbaoPose(),tg=G.home.throwTg,X=sx(HOME.x),Y=sy(HOME.y+.8-(3.4+(G.home.up||0)*.08)*.48),u=T*.95;
 if(p.tp>=0&&tg&&!tg.dead){const want=Math.atan2(tg.y-.25-(HOME.y-.9),tg.x-HOME.x);let d=want-bowAim;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;bowAim+=d*Math.min(1,.35)}
 const t=p.tp>=0?p.tp*THROW_MAX:-1,rel=THROW_RELEASE;let pull=0,kick=0,loaded=1;
 if(t>=0){if(t<rel){pull=Math.min(1,t/(THROW_WIND+THROW_SWING*.5))}else{const q=(t-rel)/(THROW_MAX-rel);pull=0;kick=Math.sin(Math.min(1,q*2)*Math.PI)*(1-q);loaded=q>.6?1:0}}
 ctx.save();ctx.translate(X,Y-u*.02);ctx.lineJoin=ctx.lineCap='round';
 ctx.fillStyle='rgba(60,40,20,.25)';ctx.beginPath();ctx.ellipse(0,u*.06,u*.32,u*.09,0,0,7);ctx.fill();
 ctx.rotate(bowAim);ctx.translate(-kick*u*.08,0);
 // stock
 ctx.beginPath();ctx.roundRect(-u*.32,-u*.06,u*.6,u*.12,u*.04);ctx.fillStyle='#b98257';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#3b2a20';ctx.stroke();
 // bow arms
 const bx=u*.16,arm=u*.36,bend=u*(.08+.06*pull);ctx.beginPath();ctx.moveTo(bx-bend,-arm);ctx.quadraticCurveTo(bx+u*.06,0,bx-bend,arm);ctx.lineWidth=5;ctx.strokeStyle='#3b2a20';ctx.stroke();ctx.lineWidth=2.6;ctx.strokeStyle='#8a5a3a';ctx.stroke();
 // string
 const sxp=bx-bend-u*.22*pull;ctx.beginPath();ctx.moveTo(bx-bend,-arm);ctx.lineTo(sxp,0);ctx.lineTo(bx-bend,arm);ctx.lineWidth=1.3;ctx.strokeStyle='#fff8e0';ctx.stroke();
 if(loaded){ctx.save();ctx.translate(sxp+u*.24,0);drawBolt(ctx,u*.36,homeHas('milkbomb'));ctx.restore()}
 ctx.beginPath();ctx.arc(0,0,u*.06,0,7);ctx.fillStyle='#ffd23f';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#3b2a20';ctx.stroke();
 ctx.restore()}
function drawBuilding(s,b){const X=sx(s.x),Y=sy(s.y),u=T;ctx.save();if(b.dead)ctx.globalAlpha=.45;if(b.flash>0)ctx.filter='brightness(1.8)';ctx.lineWidth=2;ctx.strokeStyle='#3b2a20';ctx.lineJoin='round';
 if(s.t==='wall'){drawWallSpot(s,b)}
 else if(s.t==='tower'){const h=u*(1.3+b.lv*.25);ctx.fillStyle='rgba(60,40,20,.25)';ctx.beginPath();ctx.ellipse(X,Y+u*.15,u*.55,u*.16,0,0,7);ctx.fill();
  ctx.fillStyle='#b98257';[-1,1].forEach(q=>{ctx.beginPath();ctx.moveTo(X+q*u*.4,Y+u*.15);ctx.lineTo(X+q*u*.25,Y-h+u*.3);ctx.lineTo(X+q*u*.12,Y-h+u*.3);ctx.lineTo(X+q*u*.25,Y+u*.15);ctx.closePath();ctx.fill();ctx.stroke()});
  ctx.fillStyle=b.lv>=2?'#d8dde3':'#e0a96d';ctx.beginPath();ctx.roundRect(X-u*.5,Y-h,u,u*.4,u*.08);ctx.fill();ctx.stroke();
  ctx.fillStyle=b.lv===3?'#7b8be8':'#f08a7a';ctx.beginPath();ctx.moveTo(X-u*.6,Y-h);ctx.lineTo(X,Y-h-u*.6);ctx.lineTo(X+u*.6,Y-h);ctx.closePath();ctx.fill();ctx.stroke()}
 else if(s.t==='cats'||s.t==='ducks'){const axe=s.t==='cats',roof=axe?'#e0574f':'#5f9e45',roofD=axe?'#b03a36':'#3f7a2e';ctx.fillStyle='rgba(60,40,20,.25)';ctx.beginPath();ctx.ellipse(X,Y+u*.2,u*.85,u*.2,0,0,7);ctx.fill();
  // 营房：石墙 + 条纹帐篷顶 + 门口的兵器架/箭靶
  ctx.fillStyle='#efe3c8';ctx.beginPath();ctx.roundRect(X-u*.7,Y-u*.6,u*1.4,u*.8,u*.08);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(X-u*.92,Y-u*.48);ctx.quadraticCurveTo(X-u*.4,Y-u*1.0,X,Y-u*1.4);ctx.quadraticCurveTo(X+u*.4,Y-u*1.0,X+u*.92,Y-u*.48);ctx.closePath();ctx.fillStyle=roof;ctx.fill();ctx.stroke();
  ctx.save();ctx.clip();ctx.fillStyle=roofD;for(let k=-2;k<=2;k+=2){ctx.beginPath();ctx.moveTo(X,Y-u*1.4);ctx.lineTo(X+(k-.5)*u*.36,Y-u*.4);ctx.lineTo(X+(k+.5)*u*.36,Y-u*.4);ctx.closePath();ctx.fill()}ctx.restore();
  ctx.beginPath();ctx.moveTo(X-u*.92,Y-u*.48);ctx.quadraticCurveTo(X-u*.4,Y-u*1.0,X,Y-u*1.4);ctx.quadraticCurveTo(X+u*.4,Y-u*1.0,X+u*.92,Y-u*.48);ctx.closePath();ctx.stroke();
  ctx.beginPath();ctx.moveTo(X,Y-u*1.4);ctx.lineTo(X,Y-u*1.75);ctx.stroke();ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.moveTo(X,Y-u*1.75);ctx.lineTo(X+u*.3,Y-u*1.66);ctx.lineTo(X,Y-u*1.56);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#8a5a3a';ctx.beginPath();ctx.roundRect(X-u*.18,Y-u*.35,u*.36,u*.55,[u*.18,u*.18,0,0]);ctx.fill();ctx.stroke();
  if(axe){// 门边交叉双斧
   [-1,1].forEach(q=>{ctx.save();ctx.translate(X+u*.46,Y-u*.2);ctx.rotate(q*.6);ctx.fillStyle='#b98257';ctx.beginPath();ctx.roundRect(-u*.03,-u*.3,u*.06,u*.5,u*.02);ctx.fill();ctx.stroke();ctx.fillStyle='#d6dee6';ctx.beginPath();ctx.moveTo(u*.02,-u*.3);ctx.quadraticCurveTo(u*.2*q,-u*.34,u*.18*q,-u*.18);ctx.quadraticCurveTo(u*.1*q,-u*.14,u*.02,-u*.16);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()})}
  else{// 门边箭靶
   const tx=X+u*.46,ty=Y-u*.22;[[.22,'#fff'],[.16,'#ff6b6b'],[.1,'#fff'],[.05,'#ff6b6b']].forEach(([r,c])=>{ctx.beginPath();ctx.arc(tx,ty,u*r,0,7);ctx.fillStyle=c;ctx.fill();ctx.stroke()});
   ctx.beginPath();ctx.moveTo(tx-u*.3,ty-u*.12);ctx.lineTo(tx,ty);ctx.lineWidth=2;ctx.stroke()}}
 else if(s.t==='farm'){ctx.fillStyle='#b5835a';ctx.beginPath();ctx.roundRect(X-u*.85,Y-u*.6,u*1.7,u*1.1,u*.18);ctx.fill();ctx.stroke();ctx.restore();
  const n=b.lv*2;for(let i=0;i<n;i++){const cx=s.x-.55+(i%3)*.55,cy=s.y-.35+Math.floor(i/3)*.45;spr((c)=>S.crop(c,'carrot',2),cx,cy+.25,.55)}ctx.save()}
 ctx.restore()}
function drawEmptySpot(s,near){const X=sx(s.x),Y=sy(s.y),c=nextCost(s),ok=G.phase==='day'&&c!=null&&G.gold>=c,pulse=.5+.5*Math.sin(performance.now()/300);ctx.save();ctx.setLineDash([6,4]);ctx.lineWidth=near?3.5:2.5;
 ctx.strokeStyle=near?'#ff8c42':ok?`rgba(255,210,63,${.6+.4*pulse})`:'rgba(255,248,231,.8)';ctx.fillStyle=near?'rgba(255,200,120,.4)':ok?'rgba(255,230,140,.3)':'rgba(255,248,231,.18)';
 if(s.t==='wall'){for(const g of segsOf(s)){const L=g.len*T,h=WALL_HT*2.4*T,Xg=sx(g.x),Yg=sy(g.y);
  const bar=(a0,a1)=>{if(a1-a0<.08*T)return;ctx.beginPath();g.v?ctx.roundRect(Xg-h/2,Yg+a0,h,a1-a0,8):ctx.roundRect(Xg+a0,Yg-h/2,a1-a0,h,8);ctx.fill();ctx.stroke()};
  if(g.gate){const gw=g.gate*T;bar(-L/2,-gw);bar(gw,L/2);ctx.save();ctx.setLineDash([]);const post=o=>{ctx.fillStyle='#c98b52';ctx.strokeStyle='#3b2a20';ctx.lineWidth=2;ctx.beginPath();g.v?ctx.roundRect(Xg-T*.1,Yg+o-T*.1,T*.2,T*.2,4):ctx.roundRect(Xg+o-T*.1,Yg-T*.1,T*.2,T*.2,4);ctx.fill();ctx.stroke()};post(-gw);post(gw);ctx.restore()}
  else bar(-L/2,L/2)}}else{ctx.beginPath();ctx.ellipse(X,Y,T*.8,T*.55,0,0,7);ctx.fill();ctx.stroke()}ctx.setLineDash([]);
 ctx.restore()}

function labelHit(a,b,g){return a.bx<b.bx+b.w+g&&a.bx+a.w+g>b.bx&&a.by<b.by+b.h+g&&a.by+a.h+g>b.by}
function shortName(s){return s.t==='wall'&&s.kind==='gate'?'门':({tower:'塔',cats:'斧营',ducks:'弓营',farm:'菜园',wall:'墙'}[s.t]||bName(s))}
function collectMapLabels(ns){const labs=[];
 for(const s of SPOTS){const b=G.b[s.id],X=sx(s.x),Y=sy(s.y);
  if(!b.lv){const c=nextCost(s);if(c==null)continue;const near=ns===s,ok=G.phase==='day'&&G.gold>=c;
   let ax=X,ay=Y,pri=near?100:(s.t==='wall'?28:48);
   if(s.t==='wall'){const g=segsOf(s)[0];if(g){ax=sx(g.x);ay=sy(g.y)+(g.v?0:T*.46);if(g.v)ax+=(HOME.x>=g.x?1:-1)*T*.55}}
   else ay=Y+T*.1;
   const txt=near?`${bName(s)}  ${c}💰`:`${shortName(s)} ${c}`;
   labs.push({kind:'spot',pri,ax,ay,text:txt,near,ok,fs:near?T*.26:T*.22})}
  else{const ic=pickIcons(b);if(s.t!=='wall'){const oy=s.t==='tower'?T*.62:s.t==='farm'?T*.82:T*.7;labs.push({kind:'stars',pri:36,ax:X,ay:Y+oy,text:ic||('★'.repeat(b.lv)),fs:T*(ic?0.34:0.3),force:1,icon:!!ic})}else if(ic){labs.push({kind:'stars',pri:24,ax:X,ay:Y+T*.42,text:ic,fs:T*.28,force:1,icon:1})}
   if((s.t==='cats'||s.t==='ducks')&&!b.dead){let soon=0;for(const u of G.units)if(u.home===s.id&&u.dead&&u.respawn>0){if(!soon||u.respawn<soon)soon=u.respawn}
    if(soon>0)labs.push({kind:'revive',pri:90,ax:X,ay:Y-T*1.75,text:'复活 '+Math.ceil(soon),fs:T*.24,force:1})}}}
 if(G.home&&(G.home.up||(G.home.bpicks||[]).length)){const ic=(G.home.bpicks||[]).map(id=>(branchById('home',id)||{}).ic||'').join('')||('★'.repeat(G.home.up||0));labs.push({kind:'stars',pri:32,ax:sx(HOME.x),ay:sy(HOME.y-2.72),text:ic,fs:T*.32,force:1,icon:![...ic].every(ch=>ch==='★')})}
 if(G.players)for(const p of Object.values(G.players))if(!p.dead){
  const t=DOGS[p.dog].name;ctx.font=`900 ${T*.3}px sans-serif`;const nw=ctx.measureText(t).width+8;
  labs.push({kind:'block',pri:999,ax:sx(p.x),ay:sy(p.y-1.45),w:nw,h:T*.34,bx:sx(p.x)-nw/2,by:sy(p.y-1.45)-T*.2,fixed:1,show:0});
  labs.push({kind:'block',pri:999,ax:sx(p.x),ay:sy(p.y),w:T*1.15,h:T*1.15,bx:sx(p.x)-T*.57,by:sy(p.y)-T*1.05,fixed:1,show:0})}
 return labs}
function layoutMapLabels(labs){const gap=6,padX=6,padY=3,m=6,top=(view.top||0)+4,pad=T*.8;
 for(const L of labs){if(L.fixed)continue;ctx.font=`900 ${L.fs}px sans-serif`;L.w=ctx.measureText(L.text).width+padX*2;L.h=L.fs+padY*2;L.bx=L.ax-L.w/2;L.by=L.ay-L.h/2}
 const order=labs.filter(L=>!L.fixed).sort((a,b)=>b.pri-a.pri),placed=labs.filter(L=>L.fixed);
 const vis=L=>L.ax>-pad&&L.ax<VW+pad&&L.ay>-pad&&L.ay<VH+pad;
 const clamp=L=>{if(L.ax>=0&&L.ax<=VW&&L.ay>=top&&L.ay<=VH){L.bx=Math.max(m,Math.min(VW-L.w-m,L.bx));L.by=Math.max(top,Math.min(VH-L.h-m,L.by))}};
 const nys=L=>L.kind==='stars'?[0,.8,-.8,1.6,-1.6]:[0,-1,1,-1.8,1.8,-2.6,2.6];
 const nxs=L=>L.kind==='stars'?[0,.8,-.8,1.4,-1.4]:[0,.55,-.55,1,-1,.3,-.3];
 for(const L of order){if(!vis(L)){L.show=0;continue}let ok=0;
  outer:for(const ny of nys(L))for(const nx of nxs(L)){L.bx=L.ax-L.w/2+nx*(L.w*.7);L.by=L.ay-L.h/2+ny*(L.h+gap);clamp(L);if(!placed.some(p=>labelHit(L,p,gap))){ok=1;break outer}}
  if(ok||L.force||L.pri>=90){if(!ok){L.bx=L.ax-L.w/2;L.by=L.ay-L.h/2;clamp(L)}L.show=1;placed.push(L)}else L.show=0}
 return labs}
function drawMapLabels(ns){if(!G)return;ctx.setTransform(DPR,0,0,DPR,0,0);const labs=layoutMapLabels(collectMapLabels(ns));
 for(const L of labs){if(!L.show)continue;ctx.save();
  if(L.kind==='stars'){const x=L.bx+L.w/2,y=L.by+L.h/2;ctx.textAlign='center';ctx.textBaseline='middle';if(L.icon){ctx.font=`${L.fs}px sans-serif`;ctx.fillText(L.text,x,y)}else{ctx.font=`900 ${L.fs}px sans-serif`;ctx.lineWidth=2.6;ctx.strokeStyle='#6b4a32';ctx.fillStyle='#ffd23f';ctx.strokeText(L.text,x,y);ctx.fillText(L.text,x,y)}}
  else{ctx.beginPath();ctx.roundRect(L.bx,L.by,L.w,L.h,L.h/2);
   if(L.kind==='revive'){ctx.fillStyle='rgba(40,28,18,.86)';ctx.strokeStyle='#fff';ctx.lineWidth=1.6;ctx.fill();ctx.stroke();ctx.fillStyle='#fff6c8'}
   else{ctx.fillStyle=L.near?'rgba(255,210,150,.95)':'rgba(255,248,231,.92)';ctx.strokeStyle=L.near?'#ff8c42':'rgba(122,75,29,.4)';ctx.lineWidth=L.near?2:1.2;ctx.fill();ctx.stroke();ctx.fillStyle=L.ok?'#c56a1c':'#7a4b1d'}
   ctx.font=`900 ${L.fs}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(L.text,L.bx+L.w/2,L.by+L.h/2+.2)}
  ctx.restore()}}
function drawWarn(d){const D=DIRS[d],x=clamp(D.x,1,MAP_W-1),y=clamp(D.y,1,MAP_H-1),X=sx(x),Y=sy(y),p=1+Math.sin(performance.now()/200)*.08;
 ctx.save();ctx.translate(X,Y);ctx.scale(p,p);ctx.fillStyle='#f06464';ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,T*.5,0,7);ctx.fill();ctx.stroke();
 ctx.fillStyle='#fff';ctx.font=`900 ${T*.6}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('!',0,2);ctx.restore()}
function drawFlag(x,y){const X=sx(x),Y=sy(y),t=performance.now()/1000;ctx.save();
 ctx.strokeStyle='rgba(255,90,90,.7)';ctx.lineWidth=2.5;ctx.setLineDash([5,4]);ctx.beginPath();ctx.ellipse(X,Y,T*(1.3+.08*Math.sin(t*4)),T*.9,0,0,7);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#6b4a32';ctx.fillRect(X-1.5,Y-T*1.3,3,T*1.3);ctx.fillStyle='#ff5a5a';ctx.strokeStyle='#3b2a20';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X+1.5,Y-T*1.3);
 ctx.quadraticCurveTo(X+T*.35,Y-T*(1.25+.05*Math.sin(t*6)),X+T*.7,Y-T*1.12);ctx.lineTo(X+1.5,Y-T*.85);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
// 屏幕外的敌人：屏幕边缘画红箭头（按方向合并，显示数量）
function drawOffscreen(W,H){const top=Math.max(view.top,view.hintB||0)+10,bot=H-8,lft=8,rgt=W-8,cx=W/2,cy=(top+bot)/2,B={};
 for(const e of G.enemies){const X=sx(e.x),Y=sy(e.y);if(X>0&&X<W&&Y>top-10&&Y<H)continue;const a=Math.atan2(Y-cy,X-cx),k=Math.round(a/(Math.PI/10));const d=Math.hypot(X-cx,Y-cy);
  if(!B[k])B[k]={a,n:0,d};B[k].n++;if(d<B[k].d){B[k].d=d;B[k].a=a}}
 const pulse=.75+.25*Math.sin(performance.now()/160);
 for(const k in B){const{a,n}=B[k],ca=Math.cos(a),sa=Math.sin(a);let t=1e9;if(ca>0)t=Math.min(t,(rgt-cx)/ca);if(ca<0)t=Math.min(t,(lft-cx)/ca);if(sa>0)t=Math.min(t,(bot-cy)/sa);if(sa<0)t=Math.min(t,(top-cy)/sa);
  const X=cx+ca*(t-16),Y=cy+sa*(t-16);ctx.save();ctx.translate(X,Y);ctx.rotate(a);ctx.globalAlpha=pulse;ctx.fillStyle='#f04848';ctx.strokeStyle='#fff';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-11);ctx.lineTo(-3,0);ctx.lineTo(-8,11);ctx.closePath();ctx.fill();ctx.stroke();ctx.rotate(-a);
  if(n>1){ctx.font='900 11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#7a1d1d';ctx.strokeText(n,-ca*16,-sa*16);ctx.fillStyle='#fff';ctx.fillText(n,-ca*16,-sa*16)}ctx.restore()}}
// 小地图：左上角，点一下放大
function drawTerrain(){const t=(MAP&&MAP.terrain)||{};
 if(t.water){ctx.fillStyle='#4aa8c9';for(const q of t.water)ctx.fillRect(sx(q.x),sy(q.y),q.w*T,q.h*T);
  ctx.strokeStyle='rgba(255,255,255,.38)';ctx.lineWidth=1.6;const t0=performance.now()/400;ctx.beginPath();
  for(const q of t.water)for(let i=.55;i<q.h;i+=.9){ctx.moveTo(sx(q.x),sy(q.y+i));for(let x=0;x<=q.w;x+=.5)ctx.lineTo(sx(q.x+x),sy(q.y+i+Math.sin(x*2.2+t0)*.12))}ctx.stroke()}
 ctx.fillStyle='#ecd29a';const paths=t.paths||[R(HOME.x-1,0,2,MAP_H),R(0,HOME.y-1,MAP_W,2)];
 for(const q of paths)ctx.fillRect(sx(q.x),sy(q.y),q.w*T,q.h*T);
 ctx.beginPath();ctx.arc(sx(HOME.x),sy(HOME.y),(t.clear||3.2)*T,0,7);ctx.fill();
 if(t.bridges)for(const q of t.bridges){const v=q.h>q.w;ctx.fillStyle='#c98b52';ctx.fillRect(sx(q.x),sy(q.y),q.w*T,q.h*T);
  ctx.strokeStyle='#6b4a32';ctx.lineWidth=2;if(v){for(let i=.2;i<q.h;i+=.4){ctx.beginPath();ctx.moveTo(sx(q.x),sy(q.y+i));ctx.lineTo(sx(q.x+q.w),sy(q.y+i));ctx.stroke()}}
  else{for(let i=.2;i<q.w;i+=.4){ctx.beginPath();ctx.moveTo(sx(q.x+i),sy(q.y));ctx.lineTo(sx(q.x+i),sy(q.y+q.h));ctx.stroke()}}
  ctx.fillStyle='#8a5a32';if(v){ctx.fillRect(sx(q.x),sy(q.y),3,q.h*T);ctx.fillRect(sx(q.x+q.w)-3,sy(q.y),3,q.h*T)}else{ctx.fillRect(sx(q.x),sy(q.y),q.w*T,3);ctx.fillRect(sx(q.x),sy(q.y+q.h)-3,q.w*T,3)}}
}
function drawMinimap(W,H){const m=view.mm,base=Math.max(84,Math.min(118,Math.min(W,H)*.26));m.s=m.big?Math.max(base,Math.min(base*2.2,Math.min(W,H-view.top)-20,(view.joyTop||H)-view.top-18)):base;m.x=8;m.y=view.top+8;
 const S2=m.s,X0=m.x,Y0=m.y,t=performance.now()/1000,long=Math.max(MAP_W,MAP_H),k=S2/long,P=(x,y)=>[X0+x*k,Y0+y*k],terr=MAP&&MAP.terrain;ctx.save();
 ctx.globalAlpha=.92;ctx.fillStyle=(terr&&terr.walk)?'#c4a06a':'#7cc96b';ctx.strokeStyle='#6b4a32';ctx.lineWidth=2.5;ctx.beginPath();ctx.roundRect(X0-3,Y0-3,S2+6,S2+6,8);ctx.fill();ctx.stroke();ctx.globalAlpha=1;
 if(terr&&terr.water){ctx.fillStyle='#4aa8c9';for(const q of terr.water)ctx.fillRect(X0+q.x*k,Y0+q.y*k,q.w*k,q.h*k)}
 if(terr&&terr.walk){ctx.fillStyle='#7cc96b';for(const q of terr.walk)ctx.fillRect(X0+q.x*k,Y0+q.y*k,q.w*k,q.h*k)}
 ctx.fillStyle='#ecd29a';for(const q of (terr&&terr.paths)||[R(HOME.x-1,0,2,MAP_H),R(0,HOME.y-1,MAP_W,2)])ctx.fillRect(X0+q.x*k,Y0+q.y*k,q.w*k,q.h*k);
 {const[hx,hy]=P(HOME.x,HOME.y);ctx.beginPath();ctx.arc(hx,hy,(terr&&terr.clear||3.2)*k,0,7);ctx.fill()}
 if(terr&&terr.bridges){ctx.fillStyle='#c98b52';for(const q of terr.bridges)ctx.fillRect(X0+q.x*k,Y0+q.y*k,q.w*k,q.h*k)}
 for(const s of SPOTS){const b=G.b[s.id];if(s.t==='wall'){for(const g of segsOf(s)){const[x,y]=P(g.x,g.y),L=g.len*k,h=Math.max(2,WALL_HT*2.2*k);ctx.fillStyle=!b.lv?'rgba(255,248,231,.4)':b.dead?'#8a8f99':'#c98b52';if(g.v)ctx.fillRect(x-h/2,y-L/2,h,L);else ctx.fillRect(x-L/2,y-h/2,L,h);if(b.lv&&!b.dead&&g.gate){ctx.fillStyle='#ecd29a';const gw=g.gate*2*k;g.v?ctx.fillRect(x-h/2-1,y-gw/2,h+2,gw):ctx.fillRect(x-gw/2,y-h/2-1,gw,h+2)}}}else{if(!b.lv)continue;const[x,y]=P(s.x,s.y);ctx.fillStyle=b.dead?'#8a8f99':s.t==='tower'?'#f08a7a':s.t==='farm'?'#b5835a':'#ffd23f';ctx.fillRect(x-2.5,y-2.5,5,5)}}
 {const[x,y]=P(HOME.x,HOME.y);ctx.fillStyle=G.home.hurtT>0&&Math.sin(t*20)>0?'#ff5a5a':'#fff6e0';ctx.strokeStyle='#6b4a32';ctx.lineWidth=1.5;ctx.beginPath();ctx.rect(x-5,y-5,10,10);ctx.fill();ctx.stroke();ctx.fillStyle='#e8a36a';ctx.beginPath();ctx.moveTo(x-6,y-4);ctx.lineTo(x,y-9);ctx.lineTo(x+6,y-4);ctx.fill()}
 if(G.army.mode==='deploy'){const[x,y]=P(G.army.x,G.army.y);ctx.fillStyle='#ff5a5a';ctx.fillRect(x,y-7,5,4);ctx.fillStyle='#6b4a32';ctx.fillRect(x-.5,y-7,1.5,8)}
 for(const u of G.units)if(!u.dead){const[x,y]=P(u.x,u.y);ctx.fillStyle=u.k==='duck'?'#ffe066':'#ffb86b';ctx.fillRect(x-1.5,y-1.5,3,3)}
 for(const e of G.enemies){const[x,y]=P(e.x,e.y),r=ENEMIES[e.k].smash?3:2;ctx.fillStyle='#f02e2e';ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}
 for(const p of Object.values(G.players))if(!p.dead){const[x,y]=P(p.x,p.y);ctx.fillStyle=p.dog==='white'?'#fff':'#ecca92';ctx.strokeStyle='#3b2a20';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill();ctx.stroke()}
 // 镜头范围
 const vw=W/T,vh=(H-view.top)/T,[cx0,cy0]=P(cam.x-vw/2,cam.y-vh/2);ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=1.2;ctx.strokeRect(clamp(cx0,X0,X0+S2),clamp(cy0,Y0,Y0+S2),Math.min(vw*k,S2),Math.min(vh*k,S2));
 // 敌人来的方向：白天=今晚方向（闪烁红箭头），晚上=还有敌人要来的方向
 const dirs=G.phase==='day'?nightDirs(G.night+1):G.phase==='night'?[...new Set(G.spawnQ.map(q=>q.dir))]:[];const fl=.55+.45*Math.sin(t*6);
 for(const d of dirs){const D=DIRS[d],ix=clamp(D.x,0,MAP_W),iy=clamp(D.y,0,MAP_H),[x,y]=P(ix,iy),ang=Math.atan2(HOME.y-iy,HOME.x-ix);ctx.save();ctx.translate(x+Math.cos(ang)*7,y+Math.sin(ang)*7);ctx.rotate(ang);ctx.globalAlpha=fl;
  ctx.fillStyle='#f02e2e';ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-5,-7);ctx.lineTo(-5,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  ctx.save();ctx.globalAlpha=fl*.5;ctx.fillStyle='#f02e2e';if(d==='N'||d==='S')ctx.fillRect(x-4*k,y-2,8*k,4);else ctx.fillRect(x-2,y-4*k,4,8*k);ctx.restore()}
 if(m.big){ctx.font='800 11px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='right';ctx.fillText('点一下缩小',X0+S2-4,Y0+S2-5)}
 ctx.restore()}
function render(){const W=VW,H=VH;ctx.setTransform(DPR,0,0,DPR,0,0);const me=G&&G.players[G.me];
 OX=0;OY=view.top/2;if(G&&G.shake>0){OX=(Math.random()-.5)*G.shake*30;OY+=(Math.random()-.5)*G.shake*30}
 if(me){const hw=W/2/T,hh=(H-view.top)/2/T,k=W>H?.4:.25; // 镜头往城堡那边偏一点，横屏也能看到城堡
  let tx=me.x+(HOME.x-me.x)*k,ty=me.y+(HOME.y-me.y)*k;tx=clamp(tx,me.x-hw+1.5,me.x+hw-1.5);ty=clamp(ty,me.y-hh+1.8,me.y+hh-1.2);
  cam.x=MAP_W<hw*2?MAP_W/2:clamp(tx,hw,MAP_W-hw);cam.y=MAP_H<hh*2?MAP_H/2:clamp(ty,hh-1,MAP_H-hh+1.5)}
 ctx.fillStyle='#5fae58';ctx.fillRect(0,0,W,H);
 const x0=Math.max(0,Math.floor(cam.x-W/2/T)),x1=Math.min(MAP_W,Math.ceil(cam.x+W/2/T)),y0=Math.max(0,Math.floor(cam.y-H/2/T-1)),y1=Math.min(MAP_H,Math.ceil(cam.y+H/2/T+1));
 const walk=MAP&&MAP.terrain&&MAP.terrain.walk;
 if(walk){ctx.fillStyle='#b58a4c';ctx.fillRect(sx(0),sy(0),MAP_W*T,MAP_H*T)}
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const on=!walk||!terrainBlock(x+.5,y+.5,0);ctx.fillStyle=on?((x+y)%2?'#8fd27a':'#86cb71'):((x+y)%2?'#c49a5e':'#b88d52');ctx.fillRect(sx(x),sy(y),T+1,T+1)}
 drawTerrain();
 ctx.strokeStyle='#6b4a32';ctx.lineWidth=3;ctx.strokeRect(sx(0),sy(0),MAP_W*T,MAP_H*T);
 if(!G)return;
 const ns=G.phase==='day'&&me&&!me.dead?nearSpot(me):null;
 for(const s of SPOTS)if(!G.b[s.id].lv)drawEmptySpot(s,ns===s);
 const L=[];
 const vx0=cam.x-W/2/T-2,vx1=cam.x+W/2/T+2,vy0=cam.y-H/2/T-2,vy1=cam.y+H/2/T+3;
 for(const d of DECOR)if(d.x>vx0&&d.x<vx1&&d.y>vy0&&d.y<vy1)L.push({y:d.y,f:()=>cachedSpr(d.k,d.x,d.y+.4,d.k==='tree'?1.5:.8)});
 for(const s of SPOTS){const b=G.b[s.id];if(b.lv){const yy=s.t==='wall'?Math.max(...segsOf(s).map(g=>g.y+(g.v?g.len/2:0))):s.y;L.push({y:yy,f:()=>{drawBuilding(s,b);if(ns===s){ctx.save();ctx.strokeStyle='#ff8c42';ctx.lineWidth=3;ctx.setLineDash([5,4]);ctx.beginPath();ctx.ellipse(sx(s.x),sy(s.y)+T*.2,T*.95,T*.4,0,0,7);ctx.stroke();ctx.restore()}}})}}
 L.push({y:HOME.y+.6,f:()=>{spr(S.castle,HOME.x,HOME.y+.8,3.4+(G.home.up||0)*.08,G.home.up||0);drawCastleBow()}});
 for(const p of Object.values(G.players))if(!p.dead)L.push({y:p.y,f:()=>{if(p.healFx>0){ctx.save();ctx.globalAlpha=.45*p.healFx/.35;ctx.fillStyle='#9eeb7a';ctx.beginPath();ctx.ellipse(sx(p.x),sy(p.y)-T*.2,T*.7,T*.35,0,0,7);ctx.fill();ctx.restore()}drawPlayer(p)}});
 for(const u of G.units)if(!u.dead)L.push({y:u.y,f:()=>{const ap=u.atkAt!=null?(G.t-u.atkAt)/.32:2;spr(critter,u.x,u.y,.75,u.k,u.dir,u.ph,u.moving&&!(ap<1),u.flash>0,ap<1?{p:ap}:null)}});
 for(const e of G.enemies)L.push({y:e.y,f:()=>{const atk=e.wind>0?{ph:'wind',p:1-e.wind/(e.windMax||.2)}:e.atk>0?{ph:'hit',p:1-e.atk/(e.atkMax||.22)}:null;
  const lu=(e.atk>0?Math.sin((1-e.atk/(e.atkMax||.22))*Math.PI)*.28:0),ax=Math.cos(e.atkA||0)*lu,ay=Math.sin(e.atkA||0)*lu;
  spr(critter,e.x+ax,e.y+ay,ENEMIES[e.k].r*2.3,e.k,e.dir,e.ph,e.moving&&!atk,e.flash>0,atk);if(e.burnT>0)drawFlames(e)}});
 if(G.army.mode==='deploy')L.push({y:G.army.y,f:()=>drawFlag(G.army.x,G.army.y)});
 L.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
 for(const s of G.shots){const X=sx(s.x),Y=sy(s.y)-(s.z||0)*T;ctx.save();ctx.translate(X,Y);ctx.lineWidth=2;ctx.strokeStyle='#3b2a20';
  if(s.kind==='frisbee'){ctx.rotate(s.t*20);heldW(ctx,'frisbee',T*.75)}
  else if(s.kind==='bread'){ctx.rotate(Math.atan2(s.ty-s.y,s.tx-s.x));ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-T*.2,0);ctx.lineTo(T*.14,0);ctx.lineWidth=3;ctx.stroke();ctx.lineWidth=1.4;ctx.strokeStyle='#e0a96d';ctx.stroke();ctx.beginPath();ctx.moveTo(T*.22,0);ctx.lineTo(T*.12,-T*.06);ctx.lineTo(T*.12,T*.06);ctx.closePath();ctx.fillStyle='#d6dee6';ctx.fill();ctx.lineWidth=1.2;ctx.strokeStyle='#3b2a20';ctx.stroke();ctx.fillStyle='#ff6b6b';ctx.fillRect(-T*.22,-T*.05,T*.08,T*.1)}
  else if(s.kind==='bottle'){const pa=Math.min(1,s.t/(s.dur||.4)),pb=Math.min(1,pa+.04),bz=q=>Math.sin(q*Math.PI)*(s.h||1)+(1-q)*BOW_Z,X2=(s.x0+(s.tx-s.x0)*pb-s.x)*T,Y2=(s.y0+(s.ty-s.y0)*pb-s.y)*T-(bz(pb)-bz(pa))*T+(s.z||0)*T-(s.z||0)*T;ctx.translate(0,-(1-pa)*BOW_Z*T);ctx.rotate(Math.atan2(Y2,X2));drawBolt(ctx,T*.5,homeHas('milkbomb'))}
  else if(s.kind==='snipe'){ctx.rotate(Math.atan2(s.ty-s.y,s.tx-s.x));const g=ctx.createLinearGradient(-T*.9,0,0,0);g.addColorStop(0,'rgba(255,240,160,0)');g.addColorStop(1,'rgba(255,240,160,.95)');ctx.fillStyle=g;ctx.fillRect(-T*.9,-T*.05,T*.9,T*.1);ctx.beginPath();ctx.ellipse(0,0,T*.13,T*.07,0,0,7);ctx.fillStyle='#fff3b0';ctx.fill();ctx.stroke()}
  else if(s.kind==='junk'){ctx.rotate(s.t*16);ctx.beginPath();ctx.ellipse(0,0,T*.1,T*.08,0.4,0,7);ctx.fillStyle='#8a5a32';ctx.fill();ctx.stroke();ctx.fillStyle='#c98b52';ctx.beginPath();ctx.arc(-T*.03,-T*.02,T*.035,0,7);ctx.fill()}
  else{ctx.beginPath();ctx.arc(0,0,T*.09,0,7);ctx.fillStyle='#8a8f99';ctx.fill();ctx.stroke()}ctx.restore()}
 for(const f of G.fx){const k=f.t/f.life,X=sx(f.x),Y=sy(f.y)-T*.4;ctx.save();ctx.globalAlpha=1-k;ctx.lineWidth=4;ctx.strokeStyle='#fff';
  if(f.k==='arc'){const r=f.r*T*.8,a0=f.a-1.1+k*.5,a1=f.a+.9+k*.5,col={spatula:'rgba(143,201,255,.75)',bone:'rgba(255,216,107,.8)'}[f.w]||'rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(X,Y,r,a0,a1);ctx.arc(X,Y,r*.68,a1,a0,true);ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.lineWidth=3;ctx.stroke();ctx.lineWidth=1.5;ctx.strokeStyle='rgba(59,42,32,.5)';ctx.stroke()}
  else if(f.k==='fan'){const r=f.r*T,a=f.a,a0=a-Math.PI/2,a1=a+Math.PI/2;ctx.globalAlpha=.32*(1-k);ctx.beginPath();ctx.moveTo(X,Y);ctx.arc(X,Y,r,a0,a1);ctx.closePath();ctx.fillStyle='rgba(190,225,255,.7)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(X,Y,r,a0,a1);ctx.stroke();const sw=a0+k*Math.PI,hw=.55;ctx.globalAlpha=.9*(1-k*.35);ctx.beginPath();ctx.arc(X,Y,r*.98,sw-hw,sw+.15);ctx.arc(X,Y,r*.52,sw+.15,sw-hw,true);ctx.closePath();ctx.fillStyle='rgba(235,248,255,.9)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(X,Y,r*.98,sw-hw,sw+.12);ctx.stroke()}
  else if(f.k==='spin'){ctx.beginPath();ctx.arc(X,Y,f.r*T*(.4+k*.6),0,7);ctx.stroke();ctx.strokeStyle='#ffd23f';ctx.beginPath();ctx.arc(X,Y,f.r*T*(.3+k*.5),k*9,k*9+4);ctx.stroke()}
  else if(f.k==='slam'||f.k==='quake'){ctx.strokeStyle=f.k==='quake'?'#ffb347':'#fff';ctx.lineWidth=f.k==='quake'?7:4;ctx.beginPath();ctx.ellipse(X,Y+T*.4,f.r*T*(.3+k*.7),f.r*T*(.3+k*.7)*.6,0,0,7);ctx.stroke()}
  else if(f.k==='slash'){ctx.strokeStyle='#fff';ctx.lineWidth=3.5;ctx.beginPath();const a=f.a||0,r=(f.r||.55)*T*(.6+k*.6);ctx.arc(X,Y,r,a-1.1,a+1.1);ctx.stroke();ctx.strokeStyle='rgba(255,200,180,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(X,Y,r*.7,a-.8,a+.8);ctx.stroke()}
  else if(f.k==='splash'){for(let i=0;i<7;i++){const a=i*0.9-0.3,rr=T*(.1275+k*.3825),sz=T*.085*(1-k);ctx.beginPath();ctx.arc(X+Math.cos(a)*rr,Y+Math.sin(a)*rr*.7-T*.1*k,sz,0,7);ctx.fillStyle=i%2?'#ffd23f':'#ff8c42';ctx.fill();ctx.strokeStyle='rgba(120,60,20,.5)';ctx.lineWidth=1;ctx.stroke()}}
  else if(f.k==='tracer'){ctx.globalAlpha=.85*(1-k);ctx.strokeStyle='rgba(255,236,140,.95)';ctx.lineWidth=3*(1-k)+1;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(sx(f.x),sy(f.y));ctx.lineTo(sx(f.x2),sy(f.y2));ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke()}
  else if(f.k==='muzzle'){ctx.globalAlpha=1-k;ctx.fillStyle='#ffe066';ctx.beginPath();ctx.arc(sx(f.x),sy(f.y)-T*.1,T*(.12+.18*k),0,7);ctx.fill();ctx.strokeStyle='#ff9a3a';ctx.lineWidth=2;ctx.stroke()}
  else if(f.k==='heal'){ctx.fillStyle='#7dcc55';ctx.font=`900 ${T*.32}px sans-serif`;ctx.textAlign='center';ctx.fillText('+',X,Y-T*.3*k);ctx.globalAlpha=.5*(1-k);ctx.beginPath();ctx.arc(X,Y+T*.1,T*.2,0,7);ctx.fill()}
  else{ctx.fillStyle='#fff';for(let i=0;i<6;i++){const a=i*1.05;ctx.beginPath();ctx.arc(X+Math.cos(a)*T*(.3+k*.6),Y+Math.sin(a)*T*(.2+k*.4),T*.18*(1-k),0,7);ctx.fill()}}ctx.restore()}
 if(G.dark>.01){ctx.fillStyle=`rgba(25,30,85,${.42*G.dark})`;ctx.fillRect(0,0,W,H)}
 ctx.setTransform(DPR,0,0,DPR,0,0);
 drawMapLabels(ns);
 // 血条 / 飘字 / 警告（在夜色上面）
 for(const s of SPOTS){const b=G.b[s.id];if(b.lv&&!b.dead&&b.hp<b.max)bar(s.x,s.y-(s.t==='tower'?2.4:s.t==='wall'?1.2:1.7),1.2,b.hp/b.max)}
 if(G.home.hp<G.home.max)bar(HOME.x,HOME.y-3.05,2,G.home.hp/G.home.max);
 for(const e of G.enemies)if(e.hp<e.max)bar(e.x,e.y-ENEMIES[e.k].r*2.4-.15,ENEMIES[e.k].r*1.6,e.hp/e.max,'#ff5a5a');
 for(const u of G.units)if(!u.dead&&u.hp<u.max)bar(u.x,u.y-.85,.6,u.hp/u.max);
 for(const p of Object.values(G.players))if(!p.dead){ctx.font=`900 ${T*.3}px sans-serif`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#fff';ctx.fillStyle='#7a4b1d';ctx.strokeText(DOGS[p.dog].name,sx(p.x),sy(p.y-1.45));ctx.fillText(DOGS[p.dog].name,sx(p.x),sy(p.y-1.45));if(p.hp<p.max)bar(p.x,p.y-1.35,.9,p.hp/p.max)}
 if(G.phase==='day')for(const d of nightDirs(G.night+1))drawWarn(d);
 if(view.guide&&G.phase==='day'){const s=spotOf(view.guide);if(s){const X=sx(s.x),Y=sy(s.y)-T*(1.3+.2*Math.sin(performance.now()/180));ctx.save();ctx.fillStyle='#ff8c42';ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(X,Y+T*.45);ctx.lineTo(X-T*.35,Y);ctx.lineTo(X-T*.14,Y);ctx.lineTo(X-T*.14,Y-T*.4);ctx.lineTo(X+T*.14,Y-T*.4);ctx.lineTo(X+T*.14,Y);ctx.lineTo(X+T*.35,Y);ctx.closePath();ctx.stroke();ctx.fill();ctx.restore()}}
 for(const c of G.coins){const k=Math.min(1,c.t/.7),e=k*k,X0=sx(c.x),Y0=sy(c.y),X=X0+(view.gold.x-X0)*e,Y=Y0+(view.gold.y-Y0)*e-Math.sin(k*Math.PI)*T*1.2;ctx.save();ctx.fillStyle='#ffd23f';ctx.strokeStyle='#b8860b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(X,Y,T*.16,0,7);ctx.fill();ctx.stroke();ctx.restore()}
 for(const f of G.floats){ctx.save();ctx.globalAlpha=1-f.t/1.1;ctx.font=`900 ${T*(f.sm?.3:.4)}px sans-serif`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#6b4a32';ctx.fillStyle=f.col;ctx.strokeText(f.txt,sx(f.x),sy(f.y-f.t*.8));ctx.fillText(f.txt,sx(f.x),sy(f.y-f.t*.8));ctx.restore()}
 if(G.phase==='night')drawOffscreen(W,H);drawMinimap(W,H)}
window.Game={screenOf:o=>({x:sx(o.x),y:sy(o.y),T}),newGame,step,render,build,startNight,skill,toggleArmy,armyFollow,armyDeploy,nearSpot,nextCost,hooks,loadRec,saveRec,get G(){return G},resize,critter,addPlayer,view,spotOf,useMap,flowAt,lineClear,pushOut,rebuildNav,bName,bDist,solidAt,enemySolid,enemyBlock,terrainBlock,spawnAt,astar,nearHome,homeUpCost,homeUpChoices,upgradeHome,applyHomeUp,rateStars,makeMods,buyBuff,upgradeHint,unitRespawn,panbaoPawWorld,panbaoPose,THROW_MAX,THROW_RELEASE,BOTTLE_FLY,inFan,faceAng,demolish,demolishValue,branchKind,branchOpts,branchById,hasPick,pickIcons,autoBranch};
