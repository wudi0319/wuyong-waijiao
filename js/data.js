// 无用外交 — 游戏数据（武器 / 天赋 / 建筑 / 敌人 / 地图 / 每晚的敌人）
const DOGS={yellow:{name:'红王',ic:'🤴'},white:{name:'蓝王',ic:'👑'}};
const WEAPONS={
 spatula:{name:'长剑',ic:'🗡️',desc:'近战，前方 180° 扇面挥剑，扇内每个敌人都受伤',kind:'melee',range:1.5,dmg:16,cd:.45,
  skill:{name:'旋风斩',cd:9,desc:'转圈劈飞身边所有敌人'}},
 frisbee:{name:'飞斧',ic:'🪓',desc:'远程扔飞斧',kind:'ranged',range:4,dmg:15,cd:.6,
  skill:{name:'飞斧风暴',cd:10,desc:'向四周扔出 10 把飞斧'}},
 bone:{name:'战锤',ic:'🔨',desc:'出手慢，砸一片',kind:'area',range:2.1,dmg:42,cd:1.2,
  skill:{name:'震地一击',cd:12,desc:'大范围重击并晕住敌人'},unlock:'win'}};
const TALENTS={}; // 旧天赋已并入加成 / 挑战
const BUFF_MAX=3,DEBUFF_MAX=3,HOME_UP_COST=[8,14,20];
const CATS={hero:{name:'国王',ic:'👑'},unit:{name:'士兵',ic:'⚔️'},build:{name:'建筑',ic:'🏰'},econ:{name:'经济',ic:'💰'},enemy:{name:'敌人',ic:'🐺'}};
const BUFFS={
 tough:{name:'结实身体',ic:'❤️',cat:'hero',desc:'自己的血量 +50%',cost:0},
 might:{name:'热乎乎的手',ic:'🔥',cat:'hero',desc:'自己攻击 +18%',cost:6,unlock:{stars:10}},
 swift:{name:'身手敏捷',ic:'⚡',cat:'hero',desc:'出手加快 13.5%，技能冷却也缩短 13.5%',cost:5,unlock:{map:'garden'}},
 stride:{name:'飞毛腿',ic:'👟',cat:'hero',desc:'自己走得更快（+18%）',cost:5,unlock:{stars:7}},
 recover:{name:'缓过劲来',ic:'🩹',cat:'hero',desc:'脱战后回血加快 45%',cost:4,unlock:{best:4}},
 claws:{name:'长臂',ic:'🤚',cat:'hero',desc:'自己的攻击距离 +22.5%',cost:5,unlock:{stars:8}},
 pets:{name:'士气高涨',ic:'💪',cat:'unit',desc:'士兵血量和攻击 +31.5%',cost:0},
 hatch:{name:'快速征兵',ic:'📯',cat:'unit',desc:'士兵倒下后更快复活（缩短 27%）',cost:4,unlock:{stars:7}},
 pals:{name:'多一名士兵',ic:'🪖',cat:'unit',desc:'每个营地多 1 名士兵',cost:7,unlock:{map:'fields'}},
 pack:{name:'冲锋陷阵',ic:'🏃',cat:'unit',desc:'士兵跑得更快（+22.5%），出手也更快（+13.5%）',cost:4,unlock:{map:'barbican'}},
 bite:{name:'破甲',ic:'🗡️',cat:'unit',desc:'士兵攻击再 +15%，并会短暂减速敌人',cost:6,unlock:{stars:10}},
 sentry:{name:'小哨兵',ic:'👀',cat:'unit',desc:'士兵攻击距离 +27%',cost:5,unlock:{map:'garden'}},
 stone:{name:'坚固的城堡',ic:'🏰',cat:'build',desc:'城堡和城墙血量 +40%',cost:4,unlock:{best:4}},
 tower:{name:'弹弓熟练',ic:'🏹',cat:'build',desc:'弹弓塔伤害 +22.5%',cost:4,unlock:{map:'barbican'}},
 longshot:{name:'弹弓拉远',ic:'🎯',cat:'build',desc:'弹弓塔射程 +18%',cost:5,unlock:{map:'garden'}},
 rapid:{name:'连珠弹弓',ic:'💫',cat:'build',desc:'弹弓塔射速 +18%',cost:6,unlock:{map:'bridge'}},
 fortify:{name:'安得广厦',ic:'🛠️',cat:'build',desc:'弹弓塔、营地和菜园的血量 +36%',cost:4,unlock:{stars:7}},
 mortar:{name:'修修补补',ic:'🧰',cat:'build',desc:'夜里建筑会慢慢回血',cost:5,unlock:{stars:10}},
 piggy:{name:'存钱罐',ic:'🐷',cat:'econ',desc:'开局 +9 金币，早上收入 +27%',cost:0},
 harvest:{name:'丰收年',ic:'🌾',cat:'econ',desc:'每座菜园早上多收 2 金',cost:5,unlock:{stars:7}},
 luck:{name:'幸运星',ic:'🌟',cat:'econ',desc:'打倒敌人多掉 1 金',cost:6,unlock:{map:'bridge'}},
 thrift:{name:'能省则省',ic:'🏷️',cat:'econ',desc:'建造、升级和城堡升级都便宜 15%',cost:5,unlock:{map:'garden'}},
 interest:{name:'小金库',ic:'🏦',cat:'econ',desc:'早上按手里剩的钱收 13.5% 利息（最多 7）',cost:5,unlock:{map:'barbican'}},
 salvage:{name:'拆了还能用',ic:'♻️',cat:'econ',desc:'白天可拆除建筑，退回 60% 造价',cost:6,unlock:{stars:10}},
 bounty:{name:'赏金令',ic:'📜',cat:'econ',desc:'打倒大笨熊和熊大王时掉落多 80%',cost:6,unlock:{stars:8}},
 payday:{name:'发饷日',ic:'🪙',cat:'econ',desc:'每天早上，每座还在的弹弓塔和营地额外 +2 金',cost:5,unlock:{map:'barbican'}}
};
const DEBUFFS={
 frail:{name:'玻璃心',ic:'💔',cat:'hero',desc:'自己受到的伤害 +30%',star:1,unlock:{best:4}},
 sluggish:{name:'灌铅腿',ic:'🐢',cat:'hero',desc:'自己走得更慢，技能冷却更长',star:1,unlock:{map:'yard'}},
 storm:{name:'连绵阴雨',ic:'🌧️',cat:'hero',desc:'自己的攻击变低',star:1,unlock:{map:'fields'}},
 shortarms:{name:'胳膊短',ic:'✋',cat:'hero',desc:'自己的攻击距离缩短 20%',star:1,unlock:{stars:6}},
 thinpets:{name:'没吃饭',ic:'🥬',cat:'unit',desc:'士兵血量和攻击 -25%',star:1,unlock:{stars:6}},
 latepups:{name:'没精神',ic:'😴',cat:'unit',desc:'士兵复活慢 40%，跑得也更慢',star:1,unlock:{map:'barbican'}},
 shortbow:{name:'弹弓眼花',ic:'👓',cat:'build',desc:'弹弓塔射程缩短 20%',star:1,unlock:{map:'fields'}},
 misfire:{name:'弹弓哑火',ic:'💨',cat:'build',desc:'弹弓塔射速变慢 25%',star:1,unlock:{stars:6}},
 smash:{name:'拆家党',ic:'🪓',cat:'build',desc:'敌人拆建筑更凶',star:1,unlock:{stars:10}},
 leaky:{name:'墙缝',ic:'🧱',cat:'build',desc:'城堡和城墙血量 -25%',star:1,unlock:{stars:10}},
 poor:{name:'歉收年',ic:'🪙',cat:'econ',desc:'早上收入和掉落都少 30%',star:2,unlock:{stars:6}},
 pricey:{name:'物价上涨',ic:'📈',cat:'econ',desc:'建造和升级都贵 25%',star:2,unlock:{map:'yard'}},
 wolfy:{name:'狼来了',ic:'🐺',cat:'enemy',desc:'敌人更多、更厚、更疼',star:2,unlock:{best:4}},
 zoom:{name:'疾风脚',ic:'💨',cat:'enemy',desc:'敌人走得更快',star:1,unlock:{map:'yard'}},
 late:{name:'长夜漫漫',ic:'🌙',cat:'enemy',desc:'每夜敌人再多一些，第一夜就有狼',star:1,unlock:{map:'barbican'}},
 tanky:{name:'皮糙肉厚',ic:'🪨',cat:'enemy',desc:'敌人血量 +30%',star:2,unlock:{stars:6}},
 fierce:{name:'下手更狠',ic:'💢',cat:'enemy',desc:'敌人攻击 +30%',star:1,unlock:{stars:6}},
 rush:{name:'一窝蜂',ic:'🌪️',cat:'enemy',desc:'敌人出得更密、来得更快',star:1,unlock:{map:'garden'}},
 bossy:{name:'大王发怒',ic:'👑',cat:'enemy',desc:'大笨熊更厚，熊大王更结实、来得更早',star:1,unlock:{map:'bridge'}},
 nightmare:{name:'噩梦夜',ic:'👿',cat:'enemy',desc:'敌人又多又快又厚',star:2,unlock:{map:'mountain'}}
};
const HOME_UPS={
 vigor:{name:'多吃一口',ic:'🍖',cat:'hero',desc:'自己的最大生命 +40，并立刻补这么多血'},
 sharp:{name:'磨利刃',ic:'⚔️',cat:'hero',desc:'自己攻击 +15%'},
 haste:{name:'拔腿就跑',ic:'💨',cat:'hero',desc:'自己走得更快，技能冷却稍短'},
 stretch:{name:'再探探',ic:'🤚',cat:'hero',desc:'自己的攻击距离 +20%'},
 aura:{name:'守城助威',ic:'📣',cat:'unit',desc:'城堡附近的士兵攻击更高，也更耐打'},
 beds:{name:'多一张床铺',ic:'🛏️',cat:'unit',desc:'每个营地多 1 名士兵'},
 recall:{name:'招招手',ic:'👋',cat:'unit',desc:'士兵复活加快 25%'},
 drill:{name:'小教练',ic:'🏅',cat:'unit',desc:'所有士兵攻击 +20%'},
 pelt:{name:'厚铠甲',ic:'🛡️',cat:'unit',desc:'所有士兵血量 +30%'},
 thick:{name:'厚墙城堡',ic:'🧱',cat:'build',desc:'城堡的最大生命 +60，并立刻回满'},
 bottle:{name:'强弩',ic:'🏹',cat:'build',desc:'城堡连弩射得更快、更远、更疼'},
 regen:{name:'暖暖城堡',ic:'🩹',cat:'build',desc:'城堡会慢慢回血'},
 cozy:{name:'热乎乎的炉子',ic:'🔥',cat:'build',desc:'靠近城堡的敌人走得更慢'},
 scope:{name:'瞄准镜',ic:'🔭',cat:'build',desc:'弹弓塔射程 +15%，伤害 +10%'},
 stipend:{name:'早点名',ic:'💰',cat:'econ',desc:'每天早上额外 +4 金币'},
 banker:{name:'零钱罐',ic:'🏦',cat:'econ',desc:'早上按手里剩钱再收 10% 利息（最多 6）'},
 bargain:{name:'讨价还价',ic:'🗣️',cat:'econ',desc:'这局建造和升级再便宜 15%'}
};
// 建筑每级数值（下标 0 = 1级）
const BUILD={
 wall:{name:'城墙',ic:'🧱',cost:[3,6,12],hp:[150,300,480],armor:[0,.12,.25]},
 tower:{name:'弹弓塔',ic:'🏹',cost:[8,14,22],hp:[80,140,220],dmg:[7,12,18],range:[5,5.6,6.2],cd:[.9,.75,.6]},
 cats:{name:'刀斧营',ic:'🐱',cost:[8,14,22],hp:[120,200,300],n:[2,3,4],unit:'kitten',rev:[20,16,12]},
 ducks:{name:'弓箭营',ic:'🐤',cost:[8,14,22],hp:[120,200,300],n:[2,3,4],unit:'duck',rev:[20,16,12]},
 farm:{name:'菜园',ic:'🥕',cost:[5,10,16],hp:[60,90,130],gold:[3,5,8]}};
const UNITS={
 kitten:{name:'刀斧兵',hp:45,dmg:7,range:.8,cd:.7,spd:3.2,r:.3},
 duck:{name:'弓箭手',hp:30,dmg:6,range:3.5,cd:1,spd:3,r:.28}};
const ENEMIES={
 raccoon:{name:'小偷浣熊',hp:22,spd:1.65,dmg:5,cd:.8,gold:1,r:.35,aggro:3.5,throw:3.5},
 wolf:{name:'大灰狼',hp:48,spd:1.32,dmg:8,cd:1,gold:2,r:.45,aggro:2.6},
 bear:{name:'大笨熊',hp:180,spd:.8,dmg:21,cd:1.4,gold:6,r:.65,aggro:1.6,smash:1},
 boss:{name:'熊大王',hp:1100,spd:.7,dmg:36,cd:1.5,gold:30,r:.95,aggro:2,smash:1}};
// 墙段几何：segs = [{x,y,len,v,gate}]，gate 为门洞半宽（0 表示没门）
const WALL_HT=.4,GATE_W=1.15;
function segsOf(s){return s.segs||[{x:s.x,y:s.y,len:s.len||5.4,v:!!s.v,gate:s.gate||0}]}
function mkGate(id,x,y,v){return{id,t:'wall',kind:'gate',x,y,v,segs:[{x,y,len:4.4,v,gate:GATE_W}]}}
function mkCorner(id,cx,cy,sx,sy){const arm=4.05,m=arm/2;return{id,t:'wall',kind:'corner',x:cx+sx*1.15,y:cy+sy*1.15,segs:[{x:cx+sx*m,y:cy,len:arm,v:0,gate:0},{x:cx,y:cy+sy*m,len:arm,v:1,gate:0}]}}
function mkWall(id,x,y,len,v,gate){return{id,t:'wall',kind:gate?'gate':'wall',x,y,v,segs:[{x,y,len,v,gate:gate||0}]}}
function mkCornerArms(id,cx,cy,lenH,lenV,sx,sy){return{id,t:'wall',kind:'corner',x:cx+sx*Math.min(1.15,lenH*.45),y:cy+sy*Math.min(1.15,lenV*.45),segs:[{x:cx+sx*(lenH/2),y:cy,len:lenH,v:0,gate:0},{x:cx,y:cy+sy*(lenV/2),len:lenV,v:1,gate:0}]}}
function bName(s){return s.t==='wall'&&s.kind==='gate'?'城门':BUILD[s.t].name}
function R(x,y,w,h){return{x,y,w,h}}
function inRect(x,y,r,q){return x+r>q.x&&x-r<q.x+q.w&&y+r>q.y&&y-r<q.y+q.h}
function inRects(x,y,r,list){if(!list)return false;for(const q of list)if(inRect(x,y,r,q))return true;return false}
function terrainBlock(x,y,r){const t=MAP&&MAP.terrain;if(!t)return false;
 if(t.water&&inRects(x,y,r*.7,t.water)&&!inRects(x,y,r*.7,t.bridges))return true;
 if(t.cliffs&&inRects(x,y,r*.7,t.cliffs))return true;
 if(t.walk){const pad=t.clear||(HOME.r+1.8);if(Math.hypot(x-HOME.x,y-HOME.y)<pad)return false;if(inRects(x,y,0,t.walk)||inRects(x,y,0,t.bridges))return false;return true}
 return false}
// 十字路
function plusTerr(hx,hy,w,h,c){return{paths:[R(hx-1,0,2,h),R(0,hy-1,w,2)],clear:c||3.2}}
// 核心一圈：11..23 的方环（第一关/瓮城内圈）
function coreRing(){return[
 mkGate('wN',17,11,0),mkGate('wS',17,23,0),mkGate('wW',11,17,1),mkGate('wE',23,17,1),
 mkCorner('wNW',11,11,1,1),mkCorner('wNE',23,11,-1,1),mkCorner('wSW',11,23,1,-1),mkCorner('wSE',23,23,-1,-1)
]}
function coreBuildings(){return[
 {id:'t1',t:'tower',x:12.45,y:12.45},{id:'t2',t:'tower',x:21.55,y:21.55},{id:'t3',t:'tower',x:12.45,y:21.55},{id:'t4',t:'tower',x:21.55,y:12.45},
 {id:'bC',t:'cats',x:19.6,y:13.6},{id:'bD',t:'ducks',x:14.4,y:20.4},
 {id:'f1',t:'farm',x:13.6,y:15},{id:'f2',t:'farm',x:20.4,y:19},{id:'f3',t:'farm',x:8,y:26},{id:'f4',t:'farm',x:26,y:8}
]}
// 任意方环，off 可把四边城门错开（双层花园外圈用）
function coreRingAt(x1,y1,x2,y2,p,off){off=off||{};p=p||'';
 const mx=(x1+x2)/2,my=(y1+y2)/2,sx=x2-x1,sy=y2-y1,mid=Math.min(4.4,sx*.42,sy*.42),h=mid/2,ov=.28;
 const nX=mx+(off.n||0),sX=mx+(off.s||0),wY=my+(off.w||0),eY=my+(off.e||0);
 return[
  mkWall(p+'wN',nX,y1,mid,0,GATE_W),mkWall(p+'wS',sX,y2,mid,0,GATE_W),mkWall(p+'wW',x1,wY,mid,1,GATE_W),mkWall(p+'wE',x2,eY,mid,1,GATE_W),
  mkCornerArms(p+'wNW',x1,y1,nX-h-x1+ov,wY-h-y1+ov,1,1),mkCornerArms(p+'wNE',x2,y1,x2-(nX+h)+ov,eY-h-y1+ov,-1,1),
  mkCornerArms(p+'wSW',x1,y2,sX-h-x1+ov,y2-(wY+h)+ov,1,-1),mkCornerArms(p+'wSE',x2,y2,x2-(sX+h)+ov,y2-(eY+h)+ov,-1,-1)
 ]}
// 菜园小围栏：四边墙，朝城堡的那一边是门
function farmPen(pre,fx,fy,hx,hy,s){s=s==null?2.55:s;const x1=fx-s,y1=fy-s,x2=fx+s,y2=fy+s,mx=(x1+x2)/2,my=(y1+y2)/2;
 const side=Math.abs(hx-fx)>Math.abs(hy-fy)?(hx>fx?'E':'W'):(hy>fy?'S':'N');
 return[
  mkWall(pre+'N',mx,y1,x2-x1,0,side==='N'?GATE_W:0),mkWall(pre+'S',mx,y2,x2-x1,0,side==='S'?GATE_W:0),
  mkWall(pre+'W',x1,my,y2-y1,1,side==='W'?GATE_W:0),mkWall(pre+'E',x2,my,y2-y1,1,side==='E'?GATE_W:0),
  {id:pre+'f',t:'farm',x:fx,y:fy}
 ]}
const ND_STD=[['S'],['S','E'],['S','E','W'],['N','S','E','W'],['N','S','E','W'],['N','S','E','W'],['N','S','E','W']];
const ND_BRIDGE=[['S'],['S'],['S','E'],['S','E','W'],['N','S','E','W'],['N','S','E','W'],['N','S','E','W']];
const ND_FIELDS=[['S','E'],['S','E','W'],['N','S','E','W'],['N','S','E','W'],['N','S','E','W'],['N','S','E','W'],['N','S','E','W']];
const ND_SOUTH=[['S'],['S'],['S'],['S'],['S'],['S'],['S']];
const MAPS={
 yard:{id:'yard',name:'国王的院子',ic:'🏰',desc:'围墙能连成一圈，四边路上各有一座城门',
  w:34,h:34,gold:15,nights:7,home:{x:17,y:17,r:1.4},diff:{count:1.02,ehp:1.02,edmg:1.02},nightsDir:ND_STD,
  terrain:plusTerr(17,17,34,34),spots:[...coreRing(),...coreBuildings()]},
 barbican:{id:'barbican',name:'瓮城',ic:'🏯',desc:'南门外加一圈瓮城，大门错开；西南菜园单独围起来',
  w:34,h:34,gold:22,nights:7,home:{x:17,y:17,r:1.4},diff:{count:1.08,ehp:1.06,edmg:1.06},nightsDir:ND_STD,
  terrain:plusTerr(17,17,34,34),spots:[
   ...coreRing(),...coreBuildings().filter(s=>s.id!=='f3'),
   mkWall('wBW',11,25.85,5.7,1,0),mkWall('wBE',23,25.85,5.7,1,0),
   mkWall('wBSW',14.8,28.5,7.6,0,0),mkWall('wBSE',20.7,28.5,4.6,0,GATE_W),
   // 西南菜园整圈西移，东门和瓮城西墙之间留出走道，不然门会被堵住
   mkWall('pN',6.15,23.5,5.3,0,0),mkWall('pW',3.5,26.05,5.1,1,0),mkWall('pS',6.15,28.6,5.3,0,0),mkWall('pE',8.8,26.05,5.1,1,GATE_W),
   {id:'f3',t:'farm',x:6.0,y:26}
  ]},
 garden:{id:'garden',name:'里外花园',ic:'🌸',desc:'里外两圈围墙，外门和内门错开，中间可以建塔',
  w:34,h:34,gold:26,nights:7,home:{x:17,y:17,r:1.4},diff:{count:1.12,ehp:1.08,edmg:1.08},nightsDir:ND_STD,
  terrain:plusTerr(17,17,34,34),spots:[
   ...coreRingAt(12.2,12.2,21.8,21.8,'i'),
   ...coreRingAt(6.4,6.4,27.6,27.6,'o',{n:-3,s:3,w:-3,e:3}),
   {id:'t1',t:'tower',x:10.85,y:10.85},{id:'t2',t:'tower',x:23.15,y:10.85},{id:'t3',t:'tower',x:10.85,y:23.15},{id:'t4',t:'tower',x:23.15,y:23.15},
   {id:'bC',t:'cats',x:15.2,y:15.2},{id:'bD',t:'ducks',x:18.8,y:18.8},
   {id:'f1',t:'farm',x:9.3,y:9.3},{id:'f2',t:'farm',x:24.7,y:24.7},{id:'f3',t:'farm',x:24.7,y:9.3},{id:'f4',t:'farm',x:9.3,y:24.7}
  ]},
 bridge:{id:'bridge',name:'小石桥',ic:'🌉',desc:'一条小河隔在南边，三座石桥是必经之路，桥上可以建门',
  w:34,h:34,gold:23,nights:7,home:{x:17,y:11.5,r:1.4},diff:{count:1.16,ehp:1.12,edmg:1.12},nightsDir:ND_BRIDGE,
  terrain:{clear:3.0,water:[R(0,19.2,34,3.6)],
   bridges:[R(7,18.7,2.6,4.6),R(15.7,18.7,2.6,4.6),R(24.4,18.7,2.6,4.6)],
   paths:[R(16,0,2,19.2),R(16,22.8,2,11.2),R(0,10.5,34,2),R(0,25.8,34,2),R(7,18.7,2.6,4.6),R(15.7,18.7,2.6,4.6),R(24.4,18.7,2.6,4.6)]},
  spots:[
   ...coreRingAt(11,5.6,23,17, ''),
   mkWall('gW',8.3,21,3.2,0,GATE_W),mkWall('gM',17,21,3.2,0,GATE_W),mkWall('gE',25.7,21,3.2,0,GATE_W),
   {id:'t1',t:'tower',x:7.15,y:17.85},{id:'t2',t:'tower',x:17,y:19.0},{id:'t3',t:'tower',x:26.85,y:17.85},{id:'t4',t:'tower',x:21.55,y:15.55},
   {id:'bC',t:'cats',x:13.6,y:13.4},{id:'bD',t:'ducks',x:20.6,y:8.6},
   {id:'f1',t:'farm',x:13.8,y:8.4},{id:'f2',t:'farm',x:17,y:26.6},{id:'f3',t:'farm',x:8.3,y:26.6}
  ]},
 fields:{id:'fields',name:'四面花田',ic:'🌼',desc:'四个角落的菜园各自围起来，敌人会从四面早点过来',
  w:34,h:34,gold:22,nights:7,home:{x:17,y:17,r:1.4},diff:{count:1.22,ehp:1.16,edmg:1.14},nightsDir:ND_FIELDS,
  terrain:plusTerr(17,17,34,34),spots:[
   ...coreRing(),
   ...farmPen('pA',7.2,7.2,17,17),...farmPen('pB',26.8,7.2,17,17),...farmPen('pC',7.2,26.8,17,17),...farmPen('pD',26.8,26.8,17,17),
   {id:'t1',t:'tower',x:12.45,y:12.45},{id:'t2',t:'tower',x:21.55,y:21.55},{id:'t3',t:'tower',x:12.45,y:21.55},{id:'t4',t:'tower',x:21.55,y:12.45},
   {id:'bC',t:'cats',x:19.6,y:13.6},{id:'bD',t:'ducks',x:14.4,y:20.4}
  ]},
 mountain:{id:'mountain',name:'盘山公路',ic:'⛰️',desc:'悬崖盘道，城堡建在山顶。沿路有好几道关卡，要一层一层守',
  w:34,h:36,gold:24,nights:7,home:{x:17,y:5.0,r:1.4},diff:{count:1.36,ehp:1.40,edmg:1.22,spd:1.42},nightsDir:ND_SOUTH,
  terrain:{clear:2.6,
   walk:[
    R(11,2.2,12,7.3),            // 山顶平台
    R(15.7,9.0,2.6,4.2),         // 出山顶门向南
    R(15.7,11.6,7.6,2.8),        // 转向东
    R(20.7,12.8,2.6,5.6),        // 东侧下行
    R(10.8,16.2,12.5,2.8),       // 向西横走
    R(10.8,17.4,2.6,6.0),        // 西侧下行
    R(10.8,21.2,12.5,2.8),       // 向东横走
    R(20.7,22.4,2.6,6.0),        // 东侧再下行
    R(15.7,26.2,7.6,2.8),        // 回到中间
    R(15.7,27.4,2.6,9.6),        // 山脚下南路
    // 关卡旁的小台地（建塔）
    R(12.6,29.6,3.2,2.8),R(18.2,29.6,3.4,2.8),
    R(13.6,19.8,3.0,2.2),R(17.8,19.8,3.0,2.2),
    R(13.6,14.8,3.0,2.2),R(17.8,14.8,3.0,2.2),
    R(14.6,9.6,5.0,2.0)
   ],
   paths:[
    R(15.85,9.0,2.3,4.2),R(15.85,11.8,7.2,2.4),R(20.85,12.8,2.3,5.6),
    R(11.0,16.4,12.1,2.4),R(10.95,17.4,2.3,6.0),R(11.0,21.4,12.1,2.4),
    R(20.85,22.4,2.3,6.0),R(15.85,26.4,7.2,2.4),R(15.85,27.4,2.3,9.6)
   ]},
  spots:[
   mkWall('cp1',17,31.0,9.0,0,GATE_W),
   mkWall('cp2',17,21.9,5.0,1,GATE_W),
   mkWall('cp3',17,16.9,5.0,1,GATE_W),
   mkWall('cp4',17,9.2,5.2,0,GATE_W),
   {id:'t1',t:'tower',x:13.6,y:29.85},{id:'t1b',t:'tower',x:20.4,y:29.85},
   {id:'t2',t:'tower',x:15.15,y:20.7},{id:'t2b',t:'tower',x:18.85,y:20.7},
   {id:'t3',t:'tower',x:15.15,y:15.7},{id:'t3b',t:'tower',x:18.85,y:15.7},
   {id:'t4',t:'tower',x:14.35,y:7.8},{id:'t4b',t:'tower',x:19.65,y:7.8},
   {id:'bC',t:'cats',x:13.4,y:4.4},{id:'bD',t:'ducks',x:20.6,y:4.4},
   {id:'f1',t:'farm',x:12.2,y:6.8},{id:'f2',t:'farm',x:21.8,y:6.8}
  ]}
};
const MAP_ORDER=['yard','barbican','garden','bridge','fields','mountain'];
let MAP=null,MAP_W=34,MAP_H=34,HOME={x:17,y:17,r:1.4},SPOTS=[],NIGHTS=7,DIRS={};
function refreshDirs(){DIRS={N:{x:HOME.x,y:-.5,cn:'北'},S:{x:HOME.x,y:MAP_H+.5,cn:'南'},W:{x:-.5,y:HOME.y,cn:'西'},E:{x:MAP_W+.5,y:HOME.y,cn:'东'}}}
function useMap(id){MAP=MAPS[id]||MAPS.yard;MAP_W=MAP.w;MAP_H=MAP.h;HOME=MAP.home;SPOTS=MAP.spots;NIGHTS=MAP.nights||7;refreshDirs();return MAP}
useMap('yard');
function nightDirs(n){const a=(MAP&&MAP.nightsDir)||ND_STD;return a[Math.min(n,a.length)-1]||a[a.length-1]}
function waveFor(n,cm=1){const dirs=nightDirs(n),out=[],dur=22+n*5,m=(typeof G!=='undefined'&&G&&G.mods)||{},sp=m.espawn||1;
 const add=(k,c0,t0=0,t1=dur)=>{const cnt=k==='boss'?c0:Math.round(c0*cm*1.18);for(let i=0;i<cnt;i++)out.push({t:(t0+(t1-t0)*(cnt>1?i/(cnt-1):.5))/sp+Math.random()*1.5,dir:dirs[(i+out.length)%dirs.length],k})};
 add('raccoon',5+n*2);if(n>=2||m.earlyWolf)add('wolf',n>=2?n*2-1:2,4);if(n>=3)add('bear',n-2,8);
 if(n===NIGHTS){const bt=dur*(m.bossEarly||.6);add('boss',1,bt,bt)}
 return out.sort((a,b)=>a.t-b.t)}
// 下一级（或刚建造的 1 级）加成说明，给建造按钮用
function upgradeHint(s,lv){const opts=branchOpts(branchKind(s),lv);if(opts.length)return opts.map(o=>o.ic+o.name).join(' 或 ');const B=BUILD[s.t];if(!B||lv<1||lv>3)return '';
 if(s.t==='tower'){return lv===1?`伤害 ${B.dmg[0]} · 射程 ${B.range[0]}`:`伤害 ${B.dmg[lv-2]}→${B.dmg[lv-1]} · 射更远更快`}
 if(s.t==='cats'||s.t==='ducks'){const r=B.rev||[20,16,12];return lv===1?`${B.n[0]} 名 · 复活 ${r[0]} 秒`:`${B.n[lv-2]}→${B.n[lv-1]} 名 · 攻击更高 · 复活 ${r[lv-1]} 秒`}
 if(s.t==='farm'){return lv===1?`早上 +${B.gold[0]} 金`:`早上 ${B.gold[lv-2]}→${B.gold[lv-1]} 金`}
 if(s.t==='wall'){const ar=B.armor||[];return lv===1?`生命 ${B.hp[0]}`:`生命 ${B.hp[lv-2]}→${B.hp[lv-1]}${ar[lv-1]?' · 更耐打':''}`}
 return ''}
function starTotal(r){return MAP_ORDER.reduce((s,id)=>s+((r&&r.maps&&r.maps[id]&&r.maps[id].stars)||0),0)}
function starSpendable(r){return Math.max(0,starTotal(r)-(r&&r.starSpent||0))}
function starBar(n,max=5){n=Math.max(0,Math.min(max,n|0));return '★'.repeat(n)+'☆'.repeat(max-n)}
function condOk(c,r,all){if(all||!c)return true;if(c.win)return (r.wins||0)>=c.win;if(c.best)return (r.best||0)>=c.best;if(c.map)return mapCleared(r,c.map);if(c.stars)return starTotal(r)>=c.stars;return true}
function condText(c){if(!c)return '';if(c.win)return '先通关任意一关';if(c.best)return '先守过第 '+c.best+' 夜';if(c.map)return '先通关「'+((MAPS[c.map]||{}).name||c.map)+'」';if(c.stars)return '累计 '+c.stars+' 星解锁';return ''}
function buffOwned(r,id,all){const b=BUFFS[id];if(!b)return false;if(all)return true;if(!b.cost&&!b.unlock)return true;return !!(r.buffs&&r.buffs.includes(id))}
function buffUnlocked(r,id,all){return condOk((BUFFS[id]||{}).unlock,r,all)}
function debuffUnlocked(r,id,all){return condOk((DEBUFFS[id]||{}).unlock,r,all)}
const ENEMY_STR=1.283; // 1.10×1.06×1.10：用户 2026-11-12 又要求整体再难 10%
// 弹弓塔三选一的新路线数值（狙击 / 急速 / 灼烧）
const TOWER3={bombR:1.9,bombMul:.8,volleyEach:.55,tdmg:1.4,trange:1.12,snipeD:2,snipeR:1.15,snipeCd:1.9,quickCd:.72,burnP:.75,burnT:2.5};
const BRANCH={
  tower:{
    1:[{id:'volley',ic:'💫',name:'连珠',desc:`连射 3 发，分打不同敌人，每发 ${Math.round(TOWER3.volleyEach*100)}% 伤害`},
       {id:'bomb',ic:'💣',name:'炸弹',desc:'弹丸落地爆炸，伤到周围的敌人'},
       {id:'snipe',ic:'🎯',name:'狙击',desc:`只打一个，伤害 ×${TOWER3.snipeD}，射程 +${Math.round(TOWER3.snipeR*100-100)}%，出手慢一些`}],
    2:[{id:'tdmg',ic:'💥',name:'加伤',desc:`弹弓塔伤害 +${Math.round(TOWER3.tdmg*100-100)}%`},
       {id:'trange',ic:'🔭',name:'射程',desc:`弹弓塔射程 +${Math.round(TOWER3.trange*100-100)}%`},
       {id:'quickfire',ic:'⏩',name:'急速',desc:`出手快 ${Math.round(100/TOWER3.quickCd-100)}%`}],
    3:[{id:'slow',ic:'🐢',name:'减速',desc:'打中的敌人走得更慢'},
       {id:'pierce',ic:'🗡️',name:'穿透',desc:'再穿过一个敌人；炸弹则炸得更开'},
       {id:'burn',ic:'🔥',name:'灼烧',desc:`打中后着火，${TOWER3.burnT} 秒内再烧掉 ${Math.round(TOWER3.burnP*100)}% 伤害`}]
  },
  camp:{
    1:[{id:'horde',ic:'🪖',name:'人海',desc:'多 1 名士兵，倒下后更快复活'},
       {id:'elite',ic:'💪',name:'精兵',desc:'血量 +30%，攻击 +25%'}],
    2:[{id:'recruit',ic:'📣',name:'再招募',desc:'再多 1 名士兵'},
       {id:'fierce',ic:'⚔️',name:'狠打',desc:'攻击再 +25%，出手更快'}],
    3:[{id:'rally',ic:'⏳',name:'急速复活',desc:'倒下后复活再快一截'},
       {id:'iron',ic:'🛡️',name:'铁军',desc:'血量再 +35%'}]
  },
  farm:{
    1:[{id:'harvest',ic:'🌾',name:'丰收',desc:'每天早上这片菜园再 +2 金'},
       {id:'bounty',ic:'🪙',name:'聚宝',desc:'附近打倒敌人时再掉 1 金'}],
    2:[{id:'soil',ic:'🥕',name:'沃土',desc:'早上再 +3 金'},
       {id:'scavenge',ic:'✨',name:'拾荒',desc:'附近击杀掉落再 +1 金，范围更远'}],
    3:[{id:'silo',ic:'🏚️',name:'粮仓',desc:'早上再 +4 金'},
       {id:'fortune',ic:'🌟',name:'财神',desc:'附近击杀掉落再 +1 金'}]
  },
  wall:{
    1:[{id:'ironwall',ic:'🧱',name:'铁壁',desc:'城墙生命 +30%'},
       {id:'thorns',ic:'🌿',name:'荆棘',desc:'敌人打墙会反弹 20% 伤害'}],
    2:[{id:'reinforce',ic:'🪨',name:'加固',desc:'生命再 +35%'},
       {id:'spikes',ic:'🌵',name:'尖刺',desc:'反弹再 +20%'}],
    3:[{id:'fort',ic:'🏰',name:'堡垒',desc:'生命再 +40%，更耐打'},
       {id:'lash',ic:'⚡',name:'反噬',desc:'反弹再 +20%，还能让敌人一顿'}]
  },
  home:{
    1:[{id:'double',ic:'🏹',name:'连弩',desc:'连续射出 2 支弩箭，每支伤害 75%'},
       {id:'milkbomb',ic:'🔥',name:'火油弹',desc:'弩箭带火油，炸开范围更大，还能减速'}],
    2:[{id:'quick',ic:'⚡',name:'快弦',desc:'连弩上弦更快'},
       {id:'longarm',ic:'🎯',name:'远射',desc:'射得更远'}],
    3:[{id:'rich',ic:'💪',name:'重弩',desc:'弩箭伤害 +40%'},
       {id:'sticky',ic:'🛢️',name:'沥青减速',desc:'击中或炸开都会减速，时间更长'}]
  }
};
function branchKind(s){return !s?null:(s.t==='cats'||s.t==='ducks'?'camp':s.t==='wall'?'wall':s.t)}
function branchOpts(kind,lv){return (BRANCH[kind]&&BRANCH[kind][lv])||[]}
function branchById(kind,id){const t=BRANCH[kind];if(!t||!id)return null;for(const lv of [1,2,3]){const o=(t[lv]||[]).find(x=>x.id===id);if(o)return o}return null}
function hasPick(b,id){return !!(b&&b.picks&&b.picks.includes(id))}
function pickIcons(b){return ((b&&b.picks)||[]).map(id=>{for(const k in BRANCH){const o=branchById(k,id);if(o)return o.ic}return ''}).join('')}

function makeMods(buffs,debuffs,diff){const B=new Set(buffs||[]),D=new Set(debuffs||[]),d=diff||{};
 return{gold:(B.has('piggy')?1.27:1)*(D.has('poor')?0.7:1),start:B.has('piggy')?9:0,
  pet:(B.has('pets')?1.315:1)*(D.has('thinpets')?0.75:1),hp:B.has('tough')?1.5:1,
  stone:(B.has('stone')?1.4:1)*(D.has('leaky')?0.75:1),
  bhp:B.has('fortify')?1.36:1,bregen:B.has('mortar')?4:0,
  ehp:(d.ehp||1)*(D.has('wolfy')?1.4:1)*(D.has('nightmare')?1.2:1)*(D.has('tanky')?1.3:1)*ENEMY_STR,
  edmg:(d.edmg||1)*(D.has('wolfy')?1.2:1)*(D.has('fierce')?1.3:1)*ENEMY_STR,esmash:D.has('smash')?1.5:1,
  count:(d.count||1)*(D.has('wolfy')?1.25:1)*(D.has('late')?1.3:1)*(D.has('nightmare')?1.15:1),
  drop:D.has('poor')?0.7:1,
  espd:(d.spd||1)*(D.has('zoom')?1.25:1)*(D.has('nightmare')?1.15:1),
  espawn:D.has('rush')?1.25:1,
  tdmg:B.has('tower')?1.225:1,pdmg:(B.has('might')?1.18:1)*(D.has('storm')?0.8:1),
  scd:(B.has('swift')?0.865:1)*(D.has('sluggish')?1.25:1),pacd:B.has('swift')?1/1.135:1,
  wcut:0,farmPlus:B.has('harvest')?2:0,luck:B.has('luck')?1:0,
  bounty:B.has('bounty')?0.8:0,payroll:B.has('payday')?2:0,
  bcost:(B.has('thrift')?0.85:1)*(D.has('pricey')?1.25:1),interest:B.has('interest')?0.135:0,interestCap:B.has('interest')?7:0,refund:B.has('salvage')?0.6:0,
  beds:B.has('pals')?1:0,rev:(B.has('hatch')?0.73:1)*(D.has('latepups')?1.4:1),
  earlyWolf:D.has('late')?1:0,bossHp:D.has('bossy')?1.5:1,bossEarly:D.has('bossy')?.4:.6,bearHp:D.has('bossy')?1.25:1,
  pspd:(B.has('stride')?1.18:1)*(D.has('sluggish')?0.8:1),
  pregen:B.has('recover')?1.45:1,phurt:D.has('frail')?1.3:1,
  uspd:(B.has('pack')?1.225:1)*(D.has('latepups')?0.8:1),udmg:B.has('bite')?1.15:1,
  ucd:B.has('pack')?1/1.135:1,urange:B.has('sentry')?1.27:1,slow:B.has('bite')?1:0,
  trange:(B.has('longshot')?1.18:1)*(D.has('shortbow')?0.8:1),
  trate:(B.has('rapid')?1/1.18:1)*(D.has('misfire')?1.25:1),
  prange:(B.has('claws')?1.225:1)*(D.has('shortarms')?0.8:1)}}
function qualityStars(G){if(!G)return 0;const frac=G.home.max?G.home.hp/G.home.max:0;let q=1;if(frac>=.5)q=2;if(frac>=.8&&!(G.stats&&G.stats.broke))q=3;return q}
function debuffStars(list){return (list||[]).reduce((s,id)=>s+((DEBUFFS[id]&&DEBUFFS[id].star)||0),0)}
function rateStars(G){return Math.min(5,qualityStars(G)+debuffStars(G&&G.debuffs))}
function starRange(debuffs){const extra=debuffStars(debuffs);return{min:Math.min(5,1+extra),max:Math.min(5,3+extra)}}
function normRec(r){r=r||{};r.best=r.best||0;r.wins=r.wins||0;r.maps=r.maps||{};r.starSpent=r.starSpent||0;r.buffs=r.buffs||[];
 if(r.wins>0&&!(r.maps.yard&&r.maps.yard.wins)){r.maps.yard={wins:r.wins,best:r.best||0}}
 for(const id of Object.keys(r.maps)){const m=r.maps[id];m.stars=m.stars||0;if(m.wins>0&&m.stars<1)m.stars=1}
 return r}
function mapCleared(r,id){return !!(r&&r.maps&&r.maps[id]&&r.maps[id].wins>0)}
function mapUnlocked(r,id,all){if(all)return true;const i=MAP_ORDER.indexOf(id);return i<=0||mapCleared(r,MAP_ORDER[i-1])}
function buyBuff(r,id){const b=BUFFS[id];if(!b||buffOwned(r,id,false)||!buffUnlocked(r,id,false))return r;const c=b.cost||0;if(starSpendable(r)<c)return r;r.buffs=r.buffs||[];r.buffs.push(id);r.starSpent=(r.starSpent||0)+c;return r}
