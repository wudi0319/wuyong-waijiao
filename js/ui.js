// 无用外交 — 界面：开始选择、HUD、按钮、摇杆和键盘
const $=id=>document.getElementById(id);
const sel={dog:'yellow',weapon:'spatula',buffs:[],debuffs:[],map:'yard',cat:'hero'};
const unlocked=(u,r)=>!u||(u==='win'?r.wins>0:u==='n3'?r.best>=3:true);
const unlockText=u=>u==='win'?'通关后解锁':'守过第 3 夜解锁';
function drawDogIcons(){document.querySelectorAll('#pickDog canvas').forEach(c=>{const x=c.getContext('2d');x.clearRect(0,0,96,96);x.save();x.scale(96,96);S.king(x,0,0,false,c.parentNode.dataset.dog);x.restore()})}
function renderStart(){const r=Game.loadRec();
 $('pickWeapon').innerHTML=Object.entries(WEAPONS).map(([k,w])=>{const ok=unlocked(w.unlock,r);if(!ok&&sel.weapon===k)sel.weapon='spatula';
  return`<button data-w="${k}" class="${sel.weapon===k?'on':''} ${ok?'':'lock'}">${w.ic} ${w.name}<small>${ok?w.desc:'🔒 '+unlockText(w.unlock)}</small></button>`}).join('');
 if(!mapUnlocked(r,sel.map,false))sel.map='yard';
 $('pickMap').innerHTML=MAP_ORDER.map(id=>{const m=MAPS[id],ok=mapUnlocked(r,id,false),cleared=mapCleared(r,id),n=MAP_ORDER.indexOf(id)+1,st=(r.maps[id]&&r.maps[id].stars)||0;
  const mark=!ok?'🔒 先通关上一关':st?starBar(st):('第 '+n+' 关');
  return`<button data-map="${m.id}" class="${sel.map===m.id?'on':''} ${ok?'':'lock'} ${cleared?'cleared':''}">${m.ic} ${m.name}<small class="stars">${mark}</small></button>`}).join('');
 const sm=MAPS[sel.map];$('mapDesc').textContent=sm?(sm.ic+' '+sm.desc):'';
 document.querySelectorAll('#pickDog button').forEach(b=>b.classList.toggle('on',b.dataset.dog===sel.dog));
 $('dogPassive').innerHTML=passiveHtml(sel.dog);
 const nClear=MAP_ORDER.filter(id=>mapCleared(r,id)).length,tot=starTotal(r),bag=starSpendable(r);
 $('rec').textContent=(r.best||r.wins||tot)?`⭐ 累计 ${tot} 星 · 还可花 ${bag} · 通关 ${r.wins} 次 · 已过 ${nClear}/${MAP_ORDER.length} 关`:'';drawDogIcons()}
function passiveHtml(dog){const D=DOGS[dog],P=D&&D.passive;return P?`<b>${P.ic} ${D.name}天生被动「${P.name}」</b><span>${P.desc}</span>`:''}
function renderPrep(){const r=Game.loadRec(),sm=MAPS[sel.map];$('prepPassive').innerHTML=passiveHtml(sel.dog);
 $('prepTitle').textContent='准备出发';
 $('prepStars').textContent='⭐ 累计 '+starTotal(r)+' 星 · 还可花 '+starSpendable(r);
 sel.cat=sel.cat||'hero';
 $('prepTabs').innerHTML=Object.entries(CATS).map(([k,c])=>{
  const nb=sel.buffs.filter(id=>(BUFFS[id]&&BUFFS[id].cat)===k).length,nd=sel.debuffs.filter(id=>(DEBUFFS[id]&&DEBUFFS[id].cat)===k).length,mark=(nb||nd)?' · '+(nb?nb+'加':'')+(nb&&nd?'/':'')+(nd?nd+'挑':''):'';
  return`<button data-cat="${k}" class="${sel.cat===k?'on':''}">${c.ic} ${c.name}${mark}</button>`}).join('');
 sel.buffs=sel.buffs.filter(k=>buffOwned(r,k,false));
 sel.debuffs=sel.debuffs.filter(k=>debuffUnlocked(r,k,false));
 const buffs=Object.entries(BUFFS).filter(([,b])=>(b.cat||'build')===sel.cat);
 const debs=Object.entries(DEBUFFS).filter(([,d])=>(d.cat||'enemy')===sel.cat);
 $('pickBuff').innerHTML=buffs.length?buffs.map(([k,b])=>{
  const un=buffUnlocked(r,k,false),own=buffOwned(r,k,false),on=sel.buffs.includes(k),c=b.cost||0;
  if(!un)return`<button data-b="${k}" class="lock">${b.ic} ${b.name}<small>🔒 ${condText(b.unlock)}</small></button>`;
  if(!own)return`<button data-b="${k}" class="buy">${b.ic} ${b.name}<small>兑换 ${c} 星 · ${b.desc}</small></button>`;
  return`<button data-b="${k}" class="${on?'on':''}">${b.ic} ${b.name}<small>${b.desc}</small></button>`}).join(''):'<p class="cat-empty">这一类没有出发前加成，看看旁边的挑战吧</p>';
 $('pickDebuff').innerHTML=debs.length?debs.map(([k,d])=>{
  const un=debuffUnlocked(r,k,false),on=sel.debuffs.includes(k);
  if(!un)return`<button data-d="${k}" class="lock">${d.ic} ${d.name}<small>🔒 ${condText(d.unlock)}</small></button>`;
  return`<button data-d="${k}" class="${on?'on':''}">${d.ic} ${d.name}<small>+${d.star} 星 · ${d.desc}</small></button>`}).join(''):'<p class="cat-empty">这一类没有挑战</p>';
 const rg=starRange(sel.debuffs);
 const cat=CATS[sel.cat]?CATS[sel.cat].name:'';
 const mix=Object.keys(CATS).filter(k=>Object.values(BUFFS).some(b=>(b.cat||'build')===k)).map(k=>CATS[k].name).join(' / ');
 document.querySelector('.prep-k-buff').innerHTML='✨ 可以跨类混搭：'+mix+' 里一共选 '+BUFF_MAX+' 个 <em>已选 '+sel.buffs.length+'/'+BUFF_MAX+'</em>'+(buffs.length?'':'<small>'+cat+'这一类没有加成</small>');
 document.querySelector('.prep-k-deb').textContent=cat+'挑战（增加难度，通关星星更多）';
 $('prepForecast').textContent='本关通关可得 '+rg.min+'–'+rg.max+' 星'+(sel.debuffs.length?'（挑战 +'+debuffStars(sel.debuffs)+'）':'')+' · 已选加成 '+sel.buffs.length+'/'+BUFF_MAX;
 markScroll($('pickBuff'));markScroll($('pickDebuff'))}
function openPrep(){renderPrep();$('start').classList.add('hidden');$('prep').classList.remove('hidden')}
function closePrep(){$('prep').classList.add('hidden');$('start').classList.remove('hidden');renderStart()}
function startRun(){Game.newGame({dog:sel.dog,weapon:sel.weapon,map:sel.map,buffs:sel.buffs,debuffs:sel.debuffs});paused=false;$('pause').classList.add('hidden');$('start').classList.add('hidden');$('prep').classList.add('hidden');$('end').classList.add('hidden');$('homeUp').classList.add('hidden');if($('branch'))$('branch').classList.add('hidden');$('hMe').textContent=DOGS[sel.dog].ic;tut.start();SFX.play('click');measure()}
$('pickDog').onclick=e=>{const b=e.target.closest('button');if(!b)return;sel.dog=b.dataset.dog;renderStart()};
$('pickWeapon').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.classList.contains('lock'))return toast('还没解锁哦');sel.weapon=b.dataset.w;renderStart()};
$('pickMap').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.classList.contains('lock'))return toast('还没解锁哦');sel.map=b.dataset.map;renderStart()};
$('goBtn').onclick=()=>{SFX.play('click');openPrep()};
$('prepBack').onclick=()=>{SFX.play('click');closePrep()};
$('prepGo').onclick=()=>startRun();
$('prepTabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;sel.cat=b.dataset.cat;SFX.play('click');renderPrep()};
$('pickBuff').onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.b,r=Game.loadRec();
 if(b.classList.contains('lock'))return toast(condText(BUFFS[k].unlock)||'还没解锁哦');
 if(b.classList.contains('buy')){if(starSpendable(r)<(BUFFS[k].cost||0))return toast('星星不够，再去通关攒一点吧');Game.saveRec(buyBuff(r,k));toast('兑换了 '+BUFFS[k].ic+' '+BUFFS[k].name+'！');if(sel.buffs.length<BUFF_MAX&&!sel.buffs.includes(k))sel.buffs.push(k);renderPrep();return}
 const i=sel.buffs.indexOf(k);if(i>=0)sel.buffs.splice(i,1);else{if(sel.buffs.length>=BUFF_MAX){toast('最多带 '+BUFF_MAX+' 个加成');return}sel.buffs.push(k)}renderPrep()};
$('pickDebuff').onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.d;
 if(b.classList.contains('lock'))return toast(condText(DEBUFFS[k].unlock)||'还没解锁哦');
 const i=sel.debuffs.indexOf(k);if(i>=0)sel.debuffs.splice(i,1);else{if(sel.debuffs.length>=DEBUFF_MAX){toast('最多选 '+DEBUFF_MAX+' 个挑战');return}sel.debuffs.push(k)}renderPrep()};
$('againBtn').onclick=()=>{SFX.play('click');$('end').classList.add('hidden');$('homeUp').classList.add('hidden');$('prep').classList.add('hidden');if($('branch'))$('branch').classList.add('hidden');renderStart();$('start').classList.remove('hidden')};
function syncChrome(){const menu=!$('start').classList.contains('hidden')||!$('prep').classList.contains('hidden');
 const modal=menu||!$('pause').classList.contains('hidden')||!$('homeUp').classList.contains('hidden')||!$('end').classList.contains('hidden')||!$('branch').classList.contains('hidden');
 document.body.classList.toggle('on-menu',menu);document.body.classList.toggle('on-modal',modal)}
function markScroll(el){if(!el)return;const upd=()=>el.classList.toggle('more',el.scrollHeight>el.clientHeight+10&&el.scrollTop+el.clientHeight<el.scrollHeight-8);el.onscroll=upd;requestAnimationFrame(upd)}
let toastT;function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2400)}
Game.hooks.toast=toast;Game.hooks.sfx=k=>SFX.play(k);Game.hooks.coin=()=>{const g=$('hGold');g.classList.remove('bump');void g.offsetWidth;g.classList.add('bump')};
function freshUnlocks(was,r){const nu=[];if(r.wins>0&&!(was.wins>0))nu.push('🔨 战锤');
 const mid=(Game.G&&Game.G.map)||'yard',ix=MAP_ORDER.indexOf(mid);if(mapCleared(r,mid)&&!(was.maps&&was.maps[mid]&&was.maps[mid].wins>0)&&ix>=0&&ix<MAP_ORDER.length-1){const nxt=MAPS[MAP_ORDER[ix+1]];nu.push(nxt.ic+' '+nxt.name)}
 for(const [k,b] of Object.entries(BUFFS))if(b.unlock&&!condOk(b.unlock,was,false)&&condOk(b.unlock,r,false))nu.push(b.ic+' '+b.name);
 for(const [k,d] of Object.entries(DEBUFFS))if(d.unlock&&!condOk(d.unlock,was,false)&&condOk(d.unlock,r,false))nu.push(d.ic+' '+d.name);
 return nu}
Game.hooks.end=(win,was,r)=>{const G=Game.G;$('endIcon').textContent=win?'🏆':'😭';$('endTitle').textContent=win?'城堡守住啦！':'城堡被攻破了…';
 if(win){const got=G.stats.stars||0,gain=G.stats.starGain||0,frac=Math.round(100*G.home.hp/G.home.max);
  $('endStars').textContent=starBar(got);$('endStars').classList.remove('hidden');
  $('endText').textContent=`守住了全部 ${NIGHTS} 个晚上，打倒 ${G.stats.kills} 个敌人！城堡还剩 ${frac}% 血`+(G.stats.broke?'，有建筑被打坏过。':'，建筑都保住了。')+` 获得 ${got} 星`+(gain?`（新攒 ${gain} 颗，还可花 ${starSpendable(r)}）`:'（这关最高星没涨）');}
 else{$('endStars').textContent='';$('endStars').classList.add('hidden');$('endText').textContent=`在第 ${G.night+1} 夜没守住，打倒 ${G.stats.kills} 个敌人。再试一次吧！`}
 const nu=freshUnlocks(was,r);$('endUnlock').textContent=nu.length?'新解锁：'+nu.join('、'):'';setTimeout(()=>$('end').classList.remove('hidden'),600)};
let homePick=null;
let bottlePick=null;
function openHomeUp(){const G=Game.G,c=Game.homeUpCost();if(c==null)return;
 homePick=Game.homeUpChoices();bottlePick=null;
 $('homeUpTitle').textContent='🏰 升级城堡（第 '+(G.home.up+1)+' 次）';
 $('homeUpSub').textContent='花 '+c+' 金币。每局最多 3 次，这是第 '+(G.home.up+1)+' 次';
 const opts=Game.branchOpts('home',(G.home.up||0)+1);
 $('homeBottleLab').textContent='先给城堡的连弩选一条路';
 $('homeBottle').innerHTML=opts.map(o=>`<button data-b="${o.id}"><span class="ic">${o.ic}</span>${o.name}<small>${o.desc}</small></button>`).join('');
 $('homeUpChoices').innerHTML=homePick.map(id=>{const u=HOME_UPS[id],c=CATS[u.cat]||CATS.build;return`<button data-h="${id}"><em class="cat-tag">${c.ic} ${c.name}</em>${u.ic} ${u.name}<small>${u.desc}</small></button>`}).join('');
 $('homeUp').classList.remove('hidden');SFX.play('click')}
function closeHomeUp(){$('homeUp').classList.add('hidden');homePick=null;bottlePick=null}
$('homeBottle').onclick=e=>{const b=e.target.closest('button');if(!b)return;bottlePick=b.dataset.b;document.querySelectorAll('#homeBottle button').forEach(x=>x.classList.toggle('on',x===b));SFX.play('click')};
$('homeUpChoices').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(!bottlePick){toast('先给连弩选一个路子');return}const p=me();if(p&&Game.upgradeHome(p.id,b.dataset.h,bottlePick))closeHomeUp()};
$('homeUpCancel').onclick=()=>{SFX.play('click');closeHomeUp()};
// ---- 按钮 ----
const me=()=>Game.G&&Game.G.players[Game.G.me];
const tap=(id,fn)=>$(id).addEventListener('click',e=>{e.preventDefault();fn()});
let branchSid=null;
function closeBranch(){$('branch').classList.add('hidden');branchSid=null}
function openBranch(s){const G=Game.G,c=Game.nextCost(s);if(c==null){toast(Game.bName(s)+'已经满级啦');return}
 if(G.gold<c){toast('金币不够，还差 '+(c-G.gold)+' 💰');return}
 const lv=(G.b[s.id].lv||0)+1,opts=Game.branchOpts(Game.branchKind(s),lv);
 if(!opts.length){if(Game.build(G.me,s.id))tut.on('build');return}
 branchSid=s.id;$('branchTitle').textContent=(lv===1?'建造 ':'升级 ')+Game.bName(s)+'（'+lv+' 级）';
 $('branchSub').textContent='花 '+c+' 金币，选一个路线';
 $('branchChoices').classList.toggle('three',opts.length===3);$('branchChoices').innerHTML=opts.map(o=>`<button data-b="${o.id}"><span class="ic">${o.ic}</span>${o.name}<small>${o.desc}</small></button>`).join('');
 $('branch').classList.remove('hidden');SFX.play('click')}
$('branchChoices').onclick=e=>{const b=e.target.closest('button');if(!b||!branchSid)return;const p=me();if(p&&Game.build(p.id,branchSid,b.dataset.b)){closeBranch();tut.on('build')}};
$('branchCancel').onclick=()=>{SFX.play('click');closeBranch()};
tap('buildBtn',()=>{const p=me();if(!p)return;const s=Game.nearSpot(p);if(s)openBranch(s)});
tap('razedBtn',()=>{const p=me();if(p)Game.demolish(p.id)});
tap('homeBtn',()=>{const p=me();if(p)openHomeUp()});
tap('nightBtn',()=>{if(Game.G&&Game.G.units.length)localStorage.setItem('wuyong-armytip','1');Game.startNight();tut.on('night')});
tap('skillBtn',()=>{const p=me();if(p&&p.skillCd<=0&&Game.skill(p.id))tut.on('skill')});
tap('armyKit',()=>{const p=me();if(p)Game.toggleArmy(p.id,'kitten')});tap('armyDuck',()=>{const p=me();if(p)Game.toggleArmy(p.id,'duck')});
// ---- 暂停 / 音效 ----
let paused=false;
function setPause(v){const G=Game.G;if(!G||!$('start').classList.contains('hidden')||G.phase==='win'||G.phase==='lose')v=false;paused=v;$('pause').classList.toggle('hidden',!v);jv={x:0,y:0};knob.style.transform='';keys.clear()}
function muteLabel(){$('muteBtn').textContent=SFX.muted?'🔇 音效：关':'🔊 音效：开';$('pauseBtn').dataset.m=SFX.muted?'1':''}
tap('pauseBtn',()=>{SFX.play('click');setPause(!paused)});tap('resumeBtn',()=>{SFX.play('click');setPause(false)});
tap('muteBtn',()=>{SFX.setMuted(!SFX.muted);muteLabel();SFX.play('click')});
tap('quitBtn',()=>{setPause(false);Game.G.phase='lose';$('end').classList.add('hidden');$('homeUp').classList.add('hidden');$('prep').classList.add('hidden');if($('branch'))$('branch').classList.add('hidden');renderStart();$('start').classList.remove('hidden')});
muteLabel();
document.addEventListener('visibilitychange',()=>{if(document.hidden)setPause(true)});
// ---- 摇杆：左半屏任意位置按下都能出摇杆（浮动摇杆），键盘 WASD ----
const joy=$('joy'),knob=$('knob'),stage=$('stage');let jv={x:0,y:0},jid=null;const keys=new Set();
function joyMove(e){const r=joy.getBoundingClientRect(),dx0=e.clientX-(r.left+r.width/2),dy0=e.clientY-(r.top+r.height/2),m=Math.hypot(dx0,dy0),R=r.width/2-10;
 const k=m>R?R/m:1;knob.style.transform=`translate(${dx0*k}px,${dy0*k}px)`;const n=m<4?0:Math.min(1,m/R*1.15);jv=n===0?{x:0,y:0}:{x:dx0/m*n,y:dy0/m*n};tut.on('move')}
function joyStart(e,float){if(jid!==null||paused)return;jid=e.pointerId;if(float){joy.classList.add('float');joy.style.left=(e.clientX-joy.offsetWidth/2)+'px';joy.style.top=(e.clientY-joy.offsetHeight/2)+'px';joy.style.bottom='auto'}
 try{(float?$('map'):joy).setPointerCapture(jid)}catch(_){}joyMove(e)}
const joyEnd=e=>{if(e.pointerId!==jid)return;jid=null;jv={x:0,y:0};knob.style.transform='';joy.classList.remove('float');joy.style.left=joy.style.top=joy.style.bottom=''};
joy.addEventListener('pointerdown',e=>{e.preventDefault();joyStart(e,false)});
$('map').addEventListener('pointerdown',e=>{const m=Game.view.mm;if(Game.G&&e.clientX>=m.x-4&&e.clientX<=m.x+m.s+4&&e.clientY>=m.y-4&&e.clientY<=m.y+m.s+4){m.big=!m.big;SFX.play('click');return}
 if(e.clientX<innerWidth*.5&&e.clientY>gview().top+10)joyStart(e,true)});
for(const el of[joy,$('map')]){el.addEventListener('pointermove',e=>{if(e.pointerId===jid)joyMove(e)});el.addEventListener('pointerup',joyEnd);el.addEventListener('pointercancel',joyEnd)}
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k==='escape'&&$('branch')&&!$('branch').classList.contains('hidden')){if(!e.repeat)closeBranch();return}if(k==='escape'&&$('homeUp')&&!$('homeUp').classList.contains('hidden')){if(!e.repeat)closeHomeUp();return}if(k==='p'||k==='escape'){if(!e.repeat)setPause(!paused);return}if(paused)return;keys.add(k);if(e.repeat)return;
 if(['w','a','s','d','arrowleft','arrowright','arrowup','arrowdown'].includes(k))tut.on('move');
 if(k==='e'||k==='enter'){if(!$('buildBtn').classList.contains('hidden'))$('buildBtn').click();else if(!$('homeBtn').classList.contains('hidden'))$('homeBtn').click()}
 if(k===' '){e.preventDefault();$('skillBtn').classList.contains('hidden')||$('skillBtn').click()}
 if(k==='n')$('nightBtn').classList.contains('hidden')||$('nightBtn').click();if(k==='f'){const p=me();if(p&&Game.G.units.length)Game.toggleArmy(p.id)}if(k==='1'||k==='2'){const p=me(),uk=k==='1'?'kitten':'duck';if(p&&Game.G.units.some(u=>u.k===uk))Game.toggleArmy(p.id,uk)}});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
function readInput(){let x=jv.x,y=jv.y;if(keys.has('a')||keys.has('arrowleft'))x-=1;if(keys.has('d')||keys.has('arrowright'))x+=1;if(keys.has('w')||keys.has('arrowup'))y-=1;if(keys.has('s')||keys.has('arrowdown'))y+=1;
 const m=Math.hypot(x,y);return m>1?{x:x/m,y:y/m}:{x,y}}
// ---- 新手引导（只在第一次玩时出现，存在手机里） ----
const TUT_KEY='wywj-tut-v1';
const tut={step:-1,start(){this.step=localStorage.getItem(TUT_KEY)?-1:0},
 on(ev){const need=['move','build','night','skill'][this.step];if(ev!==need)return;this.step++;if(this.step>=4){this.step=-1;localStorage.setItem(TUT_KEY,'1');toast('👍 学会啦！守住 7 个晚上就赢')}},
 text(G){if(this.step<0)return'';if(this.step===2&&G.phase==='night')this.step=3;if(this.step===3&&G.phase==='day'){this.step=-1;localStorage.setItem(TUT_KEY,'1');return''}
  return['👈 按住屏幕左边拖动，就能走路（左上角是小地图）','走到闪光的虚线框旁边，点右下角「建造」','建好了！准备好就点「🌙 开始入夜」','敌人来了！靠近会自动打，点「'+WEAPONS[me().weapon].skill.name+'」放大招'][this.step]}};
function guideSpot(G,p){let best=null,bd=1e9;for(const s of SPOTS){const b=G.b[s.id],c=Game.nextCost(s);if(b.lv||c==null||c>G.gold)continue;const d=Math.hypot(s.x-p.x,s.y-p.y);if(d<bd){bd=d;best=s}}return best}
// ---- HUD（只在内容变化时改 DOM） ----
let hudMM=0;
const setT=(id,v)=>{const el=$(id);if(el._v!==v){el._v=v;el.textContent=v}};
const setH=(id,h)=>{const el=$(id);if(el._h!==h){el._h=h;el.classList.toggle('hidden',h)}};
const setW=(id,w)=>{const el=$(id);w=Math.round(w)+'%';if(el._w!==w){el._w=w;el.style.width=w;el.style.background=parseFloat(w)<30?'#ff5a5a':parseFloat(w)<60?'#ffb347':'#6fd07a'}};
function gview(){return Game.view}
function placeToast(){const h=$('hint'),hb=h.textContent?h.getBoundingClientRect().bottom:$('hud').getBoundingClientRect().bottom;stage.style.setProperty('--toastt',Math.round(hb+6)+'px');Game.view.hintB=hb}
function measure(){const h=$('hud').getBoundingClientRect(),g=$('hGold').getBoundingClientRect();Game.view.top=h.bottom;$('stage').style.setProperty('--hudb',Math.round(h.bottom)+'px');Game.view.joyTop=$('joy').getBoundingClientRect().top;placeToast();Game.view.gold={x:g.left+g.width/2,y:g.top+g.height/2}}
addEventListener('resize',()=>setTimeout(measure,50));
function hud(){const G=Game.G,p=me();if(!G||!p)return;const day=G.phase==='day',play=day||G.phase==='night';
 setT('hGold','💰 '+G.gold);setT('hNight',day?`☀️ 第 ${G.night+1} 天 · 共 ${NIGHTS} 夜`:G.phase==='night'?`🌙 第 ${G.night+1} 夜 / ${NIGHTS}`:G.phase==='win'?'🏆 通关啦':'💔 失败');
 setW('hHome',100*G.home.hp/G.home.max);setW('hHp',p.dead?0:100*p.hp/p.max);
 const s=play&&day&&!p.dead?Game.nearSpot(p):null;
 if(s){const b=G.b[s.id],c=Game.nextCost(s),hint=c==null?'':upgradeHint(s,b.lv+1);setH('buildBtn',false);
  const txt=c==null?`${BUILD[s.t].ic} ${bName(s)} 已满级`:`${BUILD[s.t].ic} ${b.lv?'升级':'建造'}${bName(s)}${b.lv?' → '+(b.lv+1)+'级':''}`;
  const html=c==null?txt:`${txt}<small>${hint} 💰${c}</small>`;
  const el=$('buildBtn');if(el._v!==html){el._v=html;el.innerHTML=html}el.classList.toggle('poor',c==null||G.gold<c);
  if(b.lv&&(G.mods.refund||0)>0){const back=Game.demolishValue(s);setH('razedBtn',false);setT('razedBtn',`♻️ 拆除退 ${back}💰`)}else setH('razedBtn',true)}else{setH('buildBtn',true);setH('razedBtn',true)}
 const hc=play&&day&&!p.dead&&Game.nearHome(p)?Game.homeUpCost():null;
 if(hc!=null){setH('homeBtn',false);setT('homeBtn',`🏰 升级城堡（${G.home.up+1}/3）💰${hc}`);$('homeBtn').classList.toggle('poor',G.gold<hc)}else setH('homeBtn',true);
 setH('nightBtn',!day||!play);
 const W=WEAPONS[p.weapon];setH('skillBtn',G.phase!=='night');setT('skillName',W.skill.name);setT('skillCd',p.skillCd>0?''+Math.ceil(p.skillCd):'');
 setH('armyRow',!play||!G.units.length);for(const[id,k]of[['armyKit','kitten'],['armyDuck','duck']]){const has=play&&G.units.some(u=>u.k===k);setH(id,!has);if(!has)continue;const md=G.army[k].mode,el=$(id),html=`${UNIT_IC[k]} ${md==='follow'?'⚔️跟随':md==='deploy'?'🚩驻守':'🏠守营'}<small>${md==='follow'?'点一下：守在这里':'点一下：跟我走'}</small>`;if(el._v!==html){el._v=html;el.innerHTML=html}el.classList.toggle('on',md==='follow');el.classList.toggle('hold',md==='deploy')}
 const mm=Math.round(Game.view.mm.s)+(Game.view.mm.big?1:0);if(mm!==hudMM){hudMM=mm;const M=Game.view.mm,st=$('stage').style,wide=innerWidth-M.s>300;
  // 小地图放大时：横屏把提示放到地图右边；竖屏放到地图下面，不挡地图
  st.setProperty('--mm',(!M.big||wide?Math.round(M.s):0)+'px');st.setProperty('--hudb',Math.round(M.big&&!wide?M.y+M.s+4:$('hud').getBoundingClientRect().bottom)+'px');placeToast()}
 const tt=tut.text(G);let h=tt;
 if(!h&&day&&G.units.length&&!localStorage.getItem('wuyong-armytip'))h='🪓🏹 右下角两个按钮各管一种兵：「跟随」跟你走，「驻守」守在你站的位置，可以分头守两路';
 if(!h){if(day){const tip=MAP.id==='mountain'?'沿盘山公路一层一层守，守不住就往上撤':MAP.id==='bridge'?'守住桥上的门，别让它们过河':MAP.id==='fields'?'四个菜园各自围起来':'把门建好，只有自己人能过';h=s?'点右下角按钮建造 / 升级':'今晚敌人从'+nightDirs(G.night+1).map(d=>DIRS[d].cn).join('、')+'边来 · '+tip}
  else if(G.phase==='night')h=p.dead?`${DOGS[p.dog].name}复活中… ${Math.ceil(p.respawn)}`:`敌人还剩 ${G.enemies.length+G.spawnQ.length} 个 · 靠近会自动打`;else h=''}
 if($('hint')._v!==h||$('hint').classList.contains('tut')!==!!tt){setT('hint',h);$('hint').classList.toggle('tut',!!tt);placeToast()}
 Game.view.guide=day&&(tut.step===1||tut.step===0)&&!G.night?(guideSpot(G,p)||{}).id||null:null}
// ---- 主循环 ----
let last=performance.now(),fpsN=0,fpsT=0;const showFps=/fps/.test(location.search);
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;const G=Game.G;
 const blocked=paused||!$('homeUp').classList.contains('hidden')||!$('prep').classList.contains('hidden')||!$('start').classList.contains('hidden')||!$('branch').classList.contains('hidden');
 if(G&&!blocked&&G.phase!=='win'&&G.phase!=='lose'){G.input[G.me]=readInput();Game.step(dt)}else if(G)G.input[G.me]={x:0,y:0}
 syncChrome();Game.render();hud();if(showFps){fpsN++;fpsT+=dt;if(fpsT>1){$('hint').textContent+=' · '+fpsN+'fps';fpsN=0;fpsT=0}}requestAnimationFrame(frame)}
renderStart();syncChrome();measure();requestAnimationFrame(frame);
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(()=>{});
