// Cartoon sprites: drawn with vector shapes in a unit tile (0..1), outlined.
const OL='#3b2a20';
function rr(c,x,y,w,h,r,fill,ol=true){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(ol){c.lineWidth=.065;c.lineJoin='round';c.strokeStyle=OL;c.stroke()}}
function circ(c,x,y,r,fill,ol=true){c.beginPath();c.arc(x,y,r,0,7);c.fillStyle=fill;c.fill();if(ol){c.lineWidth=.065;c.lineJoin='round';c.strokeStyle=OL;c.stroke()}}
function shadow(c,x,y,rx,ry){c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fillStyle='rgba(90,60,30,.22)';c.fill()}
const S={};
S.tree=c=>{shadow(c,.5,.92,.32,.09);rr(c,.42,.55,.16,.38,.06,'#c08a5a');circ(c,.5,.4,.33,'#8fc96b');circ(c,.36,.36,.14,'#b5dd8a',false);circ(c,.66,.5,.06,'#f08a7a');circ(c,.4,.55,.05,'#f08a7a')};
S.flower=c=>{c.strokeStyle='#3f9a3a';c.lineWidth=.06;c.beginPath();c.moveTo(.5,.85);c.lineTo(.5,.5);c.stroke();
 [[0,-1],[1,0],[0,1],[-1,0],[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7]].slice(0,5).forEach(([dx,dy],i)=>circ(c,.5+dx*.12,.42+dy*.12,.1,'#f7b2c0'));circ(c,.5,.42,.08,'#ffd84a')};
S.house=c=>{shadow(c,.5,.95,.45,.08);rr(c,.12,.42,.76,.52,.06,'#fbecd2');c.beginPath();c.moveTo(.02,.48);c.quadraticCurveTo(.5,-.08,.98,.48);c.closePath();c.fillStyle='#e8a36a';c.fill();c.lineWidth=.065;c.lineJoin='round';c.strokeStyle=OL;c.stroke();
 rr(c,.42,.64,.18,.3,.08,'#b98257');rr(c,.18,.56,.17,.15,.04,'#ffe6a8');rr(c,.67,.56,.15,.15,.04,'#ffe6a8');};
S.rock=c=>{shadow(c,.5,.85,.3,.07);c.beginPath();c.ellipse(.5,.66,.3,.22,0,0,7);c.fillStyle='#b9bfc8';c.fill();c.lineWidth=.065;c.lineJoin='round';c.strokeStyle=OL;c.stroke();circ(c,.42,.6,.06,'#d8dde3',false)};
// fence autotile: n,e,s,w booleans
S.fence=(c,n,e,s,w)=>{const rail=(x1,y1,x2,y2)=>{c.lineCap='round';c.strokeStyle=OL;c.lineWidth=.16;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle='#e0a96d';c.lineWidth=.08;c.stroke()};
 const cx=.5,cy=.55;if(w)rail(0,cy,cx,cy);if(e)rail(cx,cy,1,cy);if(n)rail(cx,-.05,cx,cy);if(s)rail(cx,cy,cx,1.05);
 shadow(c,cx,cy+.2,.12,.04);rr(c,cx-.08,cy-.25,.16,.42,.06,'#c98b52');circ(c,cx,cy-.25,.08,'#e8b47c')};
const CROP_COL={carrot:'#ff8a2a',tomato:'#ff4a3d',strawberry:'#ff4d7d'};
S.crop=(c,type,stage)=>{const g='#8cc66a';
 const leaf=(x,y,r,a)=>{c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.ellipse(0,0,r*.5,r,0,0,7);c.fillStyle=g;c.fill();c.lineWidth=.035;c.strokeStyle=OL;c.stroke();c.restore()};
 if(stage===0){leaf(.43,.6,.1,-.6);leaf(.57,.6,.1,.6);return}
 if(stage===1){leaf(.38,.5,.15,-.7);leaf(.62,.5,.15,.7);leaf(.5,.42,.16,0);return}
 const col=CROP_COL[type];
 if(type==='carrot'){leaf(.42,.3,.13,-.4);leaf(.58,.3,.13,.4);c.beginPath();c.moveTo(.32,.45);c.quadraticCurveTo(.5,1.05,.68,.45);c.closePath();c.fillStyle=col;c.fill();c.lineWidth=.065;c.lineJoin='round';c.strokeStyle=OL;c.stroke()}
 else if(type==='tomato'){circ(c,.5,.58,.24,col);leaf(.42,.36,.08,-1.2);leaf(.58,.36,.08,1.2);circ(c,.42,.5,.05,'#ffb3a8',false)}
 else{leaf(.4,.32,.1,-.8);leaf(.6,.32,.1,.8);c.beginPath();c.moveTo(.3,.42);c.quadraticCurveTo(.5,.32,.7,.42);c.quadraticCurveTo(.6,.88,.5,.86);c.quadraticCurveTo(.4,.88,.3,.42);c.fillStyle=col;c.fill();c.lineWidth=.065;c.lineJoin='round';c.strokeStyle=OL;c.stroke();[[.42,.52],[.56,.56],[.48,.68]].forEach(([x,y])=>circ(c,x,y,.02,'#ffe08a',false))}};
// tool icons (unit square)
S.hoe=c=>{rr(c,.45,.15,.1,.75,.05,'#b98257');rr(c,.2,.12,.4,.16,.05,'#b9c4cf')};
S.can=c=>{rr(c,.2,.38,.5,.42,.1,'#5ab8f0');c.lineWidth=.08;c.strokeStyle=OL;c.beginPath();c.moveTo(.68,.48);c.lineTo(.88,.3);c.stroke();circ(c,.88,.3,.05,'#5ab8f0')};
S.seed=c=>{rr(c,.25,.18,.5,.66,.08,'#f2cf98');rr(c,.25,.18,.5,.16,.06,'#e0a96d');circ(c,.5,.58,.08,'#8b5a2b')};
S.basket=c=>{rr(c,.15,.45,.7,.4,.12,'#d99a5b');circ(c,.38,.42,.11,'#ff5a4a');circ(c,.6,.4,.1,'#ff9a2a')};
S.axe=c=>{rr(c,.45,.15,.1,.75,.05,'#b98257');c.beginPath();c.moveTo(.5,.15);c.quadraticCurveTo(.15,.2,.2,.45);c.lineTo(.5,.4);c.closePath();c.fillStyle='#b9c4cf';c.fill();c.lineWidth=.065;c.lineJoin='round';c.strokeStyle=OL;c.stroke()};
S.erase=c=>{circ(c,.5,.5,.32,'#ff8f8f');c.strokeStyle='#fff';c.lineWidth=.1;c.lineCap='round';c.beginPath();c.moveTo(.36,.36);c.lineTo(.64,.64);c.moveTo(.64,.36);c.lineTo(.36,.64);c.stroke()};
S.fenceIcon=c=>S.fence(c,0,1,0,1);
// gate: two posts + swinging plank door; vert = runs north-south; open 0..1
S.gate=(c,vert,open)=>{const cx=.5,cy=.55,post=(x,y)=>{shadow(c,x,y+.2,.1,.035);rr(c,x-.07,y-.3,.14,.46,.05,'#c98b52');circ(c,x,y-.3,.075,'#e8b47c')};
 const door=(x0,y0,len,horiz)=>{const k=Math.cos(open*Math.PI/2*.92);c.save();c.translate(x0,y0);if(horiz)c.scale(k,1);else c.scale(1,k);
  if(horiz){rr(c,0,-.2,len,.12,.04,'#f2c28a');rr(c,0,.02,len,.12,.04,'#f2c28a');c.lineWidth=.06;c.strokeStyle=OL;c.beginPath();c.moveTo(.04,.1);c.lineTo(len-.04,-.16);c.stroke()}
  else{rr(c,-.17,0,.12,len,.04,'#f2c28a');rr(c,.05,0,.12,len,.04,'#f2c28a')}c.restore()};
 if(!vert){door(.08,cy,.42,1);c.save();c.translate(1,0);c.scale(-1,1);door(.08,cy,.42,1);c.restore();post(.06,cy);post(.94,cy)}
 else{post(cx,.08);door(cx,.0,.48,0);c.save();c.translate(0,1.1);c.scale(1,-1);door(cx,.0,.48,0);c.restore();post(cx,.98)}};
S.gateIcon=c=>S.gate(c,0,0);
// farm animals (unit tile, drawn ~1.2 tiles wide by caller); dir 2=left 3=right
S.pig=(c,dir,ph,mv)=>{const f=dir===2?-1:1,b=mv?Math.abs(Math.sin(ph))*.04:0;c.save();c.translate(.5,0);c.scale(f,1);c.translate(-.5,0);
 shadow(c,.5,.92,.32,.07);[.3,.42,.58,.7].forEach((x,i)=>rr(c,x-.05,.72+(mv&&i%2?-.03:0),.1,.17,.04,'#f59ab0'));
 c.beginPath();c.ellipse(.48,.6-b,.32,.22,0,0,7);c.fillStyle='#ffc2cf';c.fill();c.lineWidth=.065;c.strokeStyle=OL;c.stroke();
 c.beginPath();c.moveTo(.16,.55);c.quadraticCurveTo(.06,.5,.12,.44);c.lineWidth=.04;c.stroke();
 circ(c,.74,.48-b,.18,'#ffc2cf');c.beginPath();c.moveTo(.64,.36-b);c.lineTo(.66,.24-b);c.lineTo(.74,.33-b);c.closePath();c.fillStyle='#f59ab0';c.fill();c.lineWidth=.05;c.stroke();
 rr(c,.82,.46-b,.13,.11,.05,'#f59ab0');circ(c,.86,.515-b,.015,OL,false);circ(c,.91,.515-b,.015,OL,false);circ(c,.75,.43-b,.025,OL,false);circ(c,.7,.53-b,.03,'#ff8fa8',false);c.restore()};
S.cow=(c,dir,ph,mv)=>{const f=dir===2?-1:1,b=mv?Math.abs(Math.sin(ph))*.03:0;c.save();c.translate(.5,0);c.scale(f,1);c.translate(-.5,0);
 shadow(c,.5,.93,.36,.07);[.24,.36,.6,.72].forEach((x,i)=>rr(c,x-.05,.68+(mv&&i%2?-.03:0),.1,.22,.04,'#fffaf0'));
 rr(c,.12,.36-b,.66,.38,.17,'#fffaf0');circ(c,.33,.48-b,.08,'#4a3a32',false);circ(c,.55,.6-b,.06,'#4a3a32',false);
 c.lineWidth=.04;c.strokeStyle=OL;c.beginPath();c.moveTo(.13,.45);c.quadraticCurveTo(.04,.55,.08,.66);c.stroke();
 c.beginPath();c.moveTo(.76,.26-b);c.lineTo(.74,.14-b);c.moveTo(.92,.26-b);c.lineTo(.95,.14-b);c.lineWidth=.06;c.strokeStyle='#e8c98f';c.stroke();
 circ(c,.84,.38-b,.16,'#fffaf0');rr(c,.74,.44-b,.2,.12,.06,'#ffc2cf');circ(c,.79,.335-b,.022,OL,false);circ(c,.9,.335-b,.022,OL,false);
 c.beginPath();c.ellipse(.68,.3-b,.06,.035,-.4,0,7);c.fillStyle='#fffaf0';c.fill();c.lineWidth=.04;c.strokeStyle=OL;c.stroke();c.restore()};
// player: dir 0 down 1 up 2 left 3 right, step animation phase
S.player=(c,dir,phase,moving)=>{const b=moving?Math.sin(phase)*.04:0,l=moving?Math.sin(phase)*.08:0;
 shadow(c,.5,.95,.24,.06);rr(c,.36+l*0.3,.78,.12,.16,.05,'#5a6fb8');rr(c,.52-l*0.3,.78,.12,.16,.05,'#5a6fb8');
 rr(c,.3,.48+b,.4,.36,.14,dir===1?'#ff9a6a':'#ff8c5a');
 circ(c,.5,.32+b,.24,'#ffe0c2');
 c.beginPath();c.arc(.5,.28+b,.25,Math.PI,0);c.fillStyle='#6b4226';c.fill();c.lineWidth=.065;c.lineJoin='round';c.strokeStyle=OL;c.stroke();
 if(dir!==1){const ox=dir===2?-.08:dir===3?.08:0;circ(c,.42+ox,.36+b,.03,'#3a2a1a',false);circ(c,.58+ox,.36+b,.03,'#3a2a1a',false);circ(c,.36+ox,.42+b,.035,'#ffaaaa',false);circ(c,.64+ox,.42+b,.035,'#ffaaaa',false)}};
window.S=S;window.rr=rr;window.circ=circ;
// ===== 无用外交：国王 / 城堡 / 士兵（单位格 0..1，脚在 .95，粗描边手绘风） =====
const KING={yellow:{robe:'#e0574f',robeD:'#b03a36',beard:'#c9733a',gem:'#4f7fe0'},white:{robe:'#4f7fe0',robeD:'#3157b0',beard:'#f6f1e6',gem:'#e0574f'}};
const SKIN='#ffdcbc';
S.king=(c,dir,phase,moving,kind='yellow')=>{const P=KING[kind]||KING.yellow,K='#2a1d16',s=moving?Math.sin(phase):0,sq=Math.abs(s);
 c.save();c.translate(.5,.94);c.scale(1+sq*.07,1-sq*.09);c.translate(0,-sq*.06);c.translate(-.5,-.94);
 const line=(w=.05)=>{c.lineWidth=w;c.strokeStyle=K;c.lineJoin=c.lineCap='round';c.stroke()};
 const ell=(x,y,rx,ry,fill,w=.05,rot=0)=>{c.beginPath();c.ellipse(x,y,rx,ry,rot,0,7);c.fillStyle=fill;c.fill();if(w)line(w)};
 c.beginPath();c.ellipse(.5,.95,.26,.05,0,0,7);c.fillStyle='rgba(90,60,30,.22)';c.fill();
 const side=dir>=2,f=dir===2?-1:1,lg=moving?s*.035:0;
 // boots
 if(side){ell(.5-.08*f+lg,.9,.065,.045,'#5a3a26');ell(.5+.08*f-lg,.9,.065,.045,'#5a3a26')}else{ell(.41,.9+lg,.065,.045,'#5a3a26');ell(.59,.9-lg,.065,.045,'#5a3a26')}
 // robe: little bell shape with gold hem
 const robe=()=>{c.beginPath();c.moveTo(.36,.6);c.quadraticCurveTo(.27,.78,.26,.88);c.quadraticCurveTo(.5,.94,.74,.88);c.quadraticCurveTo(.73,.78,.64,.6);c.closePath()};
 robe();c.fillStyle=P.robe;c.fill();line(.055);
 c.save();robe();c.clip();c.fillStyle='#ffd23f';c.fillRect(.2,.84,.6,.1);if(!side&&dir!==1){c.fillStyle=P.robeD;c.fillRect(.475,.62,.05,.24)}c.restore();
 robe();line(.055);
 if(dir===1){// 背面：披风上的白毛边 + 皇冠
  ell(.5,.6,.17,.06,'#fff',.04);[.4,.5,.6].forEach(x=>ell(x,.6,.012,.016,K,0));
  ell(.5,.4,.22,.2,'#8a5a3a');}
 // head
 const hx=side?.5+.04*f:.5,hy=.4;
 if(dir!==1){ell(hx,hy,.22,.2,SKIN);
  // ermine collar in front of the neck
  c.beginPath();c.ellipse(.5,.6,.17,.055,0,0,7);c.fillStyle='#fff';c.fill();line(.04);[.4,.5,.6].forEach(x=>ell(x+(side?.03*f:0),.6,.012,.016,K,0));
  // beard (round, cute) — under the mouth
  const bx=side?hx+.06*f:hx;c.beginPath();c.moveTo(bx-.15,hy+.06);c.quadraticCurveTo(bx-.14,hy+.25,bx,hy+.27);c.quadraticCurveTo(bx+.14,hy+.25,bx+.15,hy+.06);c.quadraticCurveTo(bx,hy+.15,bx-.15,hy+.06);c.closePath();c.fillStyle=P.beard;c.fill();line(.04);
  const fx=side?hx+.09*f:hx,ex=side?0:.085;
  ell(fx-ex-.04,hy+.04,.035,.022,'#ff9eae',0);if(!side)ell(fx+ex+.04,hy+.04,.035,.022,'#ff9eae',0);
  ell(side?fx+.02*f:fx-ex,hy-.02,.02,.024,K,0);if(!side)ell(fx+ex,hy-.02,.02,.024,K,0);
  // tiny moustache + smile
  c.beginPath();c.moveTo(fx-.055,hy+.075);c.quadraticCurveTo(fx-.02,hy+.05,fx,hy+.07);c.quadraticCurveTo(fx+.02,hy+.05,fx+.055,hy+.075);c.lineWidth=.035;c.strokeStyle=P.beard==='#f6f1e6'?'#d9d2c2':'#9a5228';c.lineCap='round';c.stroke();
  ell(side?fx+.12*f:fx,hy+.01,.028,.022,'#ffc49a',.025)}
 // crown
 const cx=hx,cy=hy-.17;c.beginPath();c.moveTo(cx-.15,cy+.05);c.lineTo(cx-.16,cy-.1);c.lineTo(cx-.08,cy-.03);c.lineTo(cx,cy-.13);c.lineTo(cx+.08,cy-.03);c.lineTo(cx+.16,cy-.1);c.lineTo(cx+.15,cy+.05);c.closePath();c.fillStyle='#ffd23f';c.fill();line(.04);
 ell(cx,cy+.01,.03,.03,P.gem,.025);[-.16,0,.16].forEach((o,i)=>ell(cx+o,cy-(i===1?.14:.105),.022,.022,'#fff3b0',.02));
 c.restore()};
// 城堡：和原来的房子同样的占地（单位格），中间主塔 + 两侧圆塔 + 正面城墙和拱门
S.castle=(c,lv=0)=>{const K=OL,st='#efe3c8',stD='#d8c7a3',roof=lv>=3?'#7b8be8':'#e0574f',line=w=>{c.lineWidth=w||.03;c.strokeStyle=K;c.lineJoin='round';c.stroke()};
 const box=(x,y,w,h,fill)=>{c.beginPath();c.rect(x,y,w,h);c.fillStyle=fill;c.fill();line()};
 const merl=(x,y,w,n,fill)=>{const mw=w/(n*2-1);for(let i=0;i<n;i++){c.beginPath();c.roundRect(x+i*mw*2,y,mw,.05,.01);c.fillStyle=fill;c.fill();line(.025)}};
 const cone=(x,y,w,h,fill)=>{c.beginPath();c.moveTo(x-w/2,y);c.quadraticCurveTo(x,y-h*.15,x+w/2,y);c.lineTo(x,y-h);c.closePath();c.fillStyle=fill;c.fill();line()};
 const flag=(x,y,col)=>{c.beginPath();c.moveTo(x,y);c.lineTo(x,y-.11);line(.02);c.beginPath();c.moveTo(x,y-.11);c.quadraticCurveTo(x+.05,y-.12,x+.09,y-.085);c.quadraticCurveTo(x+.05,y-.07,x,y-.06);c.closePath();c.fillStyle=col;c.fill();line(.018)};
 const win=(x,y,w,h)=>{c.beginPath();c.moveTo(x,y+h);c.lineTo(x,y+w/2);c.arc(x+w/2,y+w/2,w/2,Math.PI,0);c.lineTo(x+w,y+h);c.closePath();c.fillStyle='#5a4a6a';c.fill();line(.02)};
 c.beginPath();c.ellipse(.5,.95,.46,.07,0,0,7);c.fillStyle='rgba(90,60,30,.22)';c.fill();
 // keep (back)
 box(.33,.2,.34,.32,stD);merl(.33,.15,.34,4,stD);flag(.5,.13,'#ffd23f');win(.46,.28,.08,.1);

 // side towers
 for(const x of[.15,.85]){box(x-.11,.3,.22,.62,st);c.beginPath();c.moveTo(x-.11,.33);c.lineTo(x+.11,.33);line(.02);
  cone(x,.32,.3,.24,roof);flag(x,.08,x<.5?'#e0574f':'#4f7fe0');win(x-.035,.48,.07,.09);
  for(let k=0;k<3;k++){c.beginPath();c.moveTo(x-.11,.62+k*.1);c.lineTo(x+.11,.62+k*.1);c.lineWidth=.012;c.strokeStyle='rgba(120,95,60,.35)';c.stroke()}}
 // front wall + battlements
 box(.26,.5,.48,.43,st);merl(.26,.45,.48,5,st);
 for(let k=0;k<3;k++){c.beginPath();c.moveTo(.26,.62+k*.1);c.lineTo(.74,.62+k*.1);c.lineWidth=.012;c.strokeStyle='rgba(120,95,60,.35)';c.stroke()}
 // banners on the wall
 for(const x of[.31,.62]){c.beginPath();c.moveTo(x,.55);c.lineTo(x+.07,.55);c.lineTo(x+.07,.7);c.lineTo(x+.035,.67);c.lineTo(x,.7);c.closePath();c.fillStyle=x<.5?'#e0574f':'#4f7fe0';c.fill();line(.02);c.beginPath();c.arc(x+.035,.6,.014,0,7);c.fillStyle='#ffd23f';c.fill()}
 // arched gate with portcullis
 c.beginPath();c.moveTo(.41,.93);c.lineTo(.41,.72);c.arc(.5,.72,.09,Math.PI,0);c.lineTo(.59,.93);c.closePath();c.fillStyle='#8a5a3a';c.fill();line();
 c.save();c.clip();c.strokeStyle='rgba(59,42,32,.7)';c.lineWidth=.014;for(let x=.43;x<.59;x+=.04){c.beginPath();c.moveTo(x,.6);c.lineTo(x,.93);c.stroke()}for(let y=.7;y<.93;y+=.05){c.beginPath();c.moveTo(.4,y);c.lineTo(.6,y);c.stroke()}c.restore();
 c.beginPath();c.moveTo(.41,.93);c.lineTo(.41,.72);c.arc(.5,.72,.09,Math.PI,0);c.lineTo(.59,.93);line();
 // crossbow platform on top of the gate
 c.beginPath();c.roundRect(.43,.46,.14,.06,.015);c.fillStyle='#b98257';c.fill();line(.025)};
S.castleIcon=c=>{c.save();c.translate(.02,.06);c.scale(.96,.96);S.castle(c);c.restore()};
// 士兵：刀斧兵（kitten 槽位）和弓箭手（duck 槽位），朝右画，左向镜像；atk={p:0..1}
S.soldier=(c,k,dir,ph,mv,flash,atk)=>{const f=dir===2?-1:1,b=mv?Math.abs(Math.sin(ph))*.05:0,K='#3b2a20';c.save();c.translate(.5,0);c.scale(f,1);c.translate(-.5,0);
 const axe=k==='kitten',p=atk?atk.p:-1,wind=p>=0&&p<.35,hit=p>=.35;
 let lean=0;if(wind)lean=-.12*(p/.35);else if(hit)lean=.16*Math.sin(Math.min(1,(p-.35)/.65)*Math.PI);
 c.save();c.translate(.5,.9);c.rotate(lean*.6);c.translate(-.5,-.9);
 const W=flash?'#fff':null,col=(a)=>W||a;
 const E=(x,y,rx,ry,fill,w=.05,rot=0)=>{c.beginPath();c.ellipse(x,y,rx,ry,rot,0,7);c.fillStyle=fill;c.fill();if(w){c.lineWidth=w;c.strokeStyle=K;c.stroke()}};
 c.beginPath();c.ellipse(.5,.93,.28,.06,0,0,7);c.fillStyle='rgba(60,40,20,.25)';c.fill();
 const lg=mv?Math.sin(ph)*.05:0;E(.4-lg,.88,.07,.05,col('#5a3a26'),.04);E(.6+lg,.88,.07,.05,col('#5a3a26'),.04);
 if(!axe){// quiver on the back
  c.save();c.translate(.3,.62-b);c.rotate(-.35);c.beginPath();c.roundRect(-.05,-.16,.1,.26,.03);c.fillStyle=col('#a0683a');c.fill();c.lineWidth=.04;c.strokeStyle=K;c.stroke();
  ['#ff6b6b','#fff','#ff6b6b'].forEach((q,i)=>{c.beginPath();c.moveTo(-.03+i*.03,-.16);c.lineTo(-.03+i*.03,-.24);c.lineWidth=.035;c.strokeStyle=col(q);c.stroke()});c.restore()}
 // body tunic
 c.beginPath();c.moveTo(.33,.62-b);c.quadraticCurveTo(.28,.8,.3,.86);c.quadraticCurveTo(.5,.9,.7,.86);c.quadraticCurveTo(.72,.8,.67,.62-b);c.closePath();c.fillStyle=col(axe?'#c9543f':'#5f9e45');c.fill();c.lineWidth=.05;c.strokeStyle=K;c.stroke();
 c.fillStyle=col('#7a4b1d');c.fillRect(.31,.74-b,.38,.04);
 if(axe){E(.5,.68-b,.13,.06,col('#c3ccd6'),.035)}
 // head
 const hx=.53,hy=.42-b;E(hx,hy,.19,.18,col(SKIN));
 if(axe){// round steel helmet + plume
  c.beginPath();c.arc(hx,hy-.05,.2,Math.PI*1.02,-.02*Math.PI);c.closePath();c.fillStyle=col('#b9c4cf');c.fill();c.lineWidth=.045;c.strokeStyle=K;c.stroke();
  c.beginPath();c.roundRect(hx-.21,hy-.07,.42,.055,.02);c.fillStyle=col('#9aa6b4');c.fill();c.stroke();
  c.beginPath();c.moveTo(hx-.02,hy-.2);c.quadraticCurveTo(hx-.12,hy-.36,hx-.22,hy-.28);c.quadraticCurveTo(hx-.12,hy-.26,hx-.04,hy-.18);c.closePath();c.fillStyle=col('#ff6b6b');c.fill();c.lineWidth=.035;c.stroke()}
 else{// green hood with a point
  c.beginPath();c.moveTo(hx-.2,hy+.04);c.quadraticCurveTo(hx-.22,hy-.2,hx-.02,hy-.22);c.quadraticCurveTo(hx-.2,hy-.36,hx-.3,hy-.3);c.quadraticCurveTo(hx-.18,hy-.26,hx-.2,hy-.16);c.moveTo(hx-.02,hy-.22);c.quadraticCurveTo(hx+.2,hy-.2,hx+.2,hy-.02);c.quadraticCurveTo(hx+.05,hy-.1,hx-.2,hy+.04);c.closePath();c.fillStyle=col('#4f8a3a');c.fill();c.lineWidth=.04;c.strokeStyle=K;c.stroke()}
 E(hx+.1,hy+.035,.022,.026,K,0);E(hx-.0,hy+.035,.022,.026,K,0);E(hx-.06,hy+.09,.03,.018,'#ff9eae',0);
 c.beginPath();c.moveTo(hx+.02,hy+.1);c.quadraticCurveTo(hx+.06,hy+.13,hx+.1,hy+.1);c.lineWidth=.025;c.strokeStyle=K;c.stroke();
 // weapon
 if(axe){const a=wind?-1.25-.9*(p/.35):hit?-2.15+2.9*Math.min(1,(p-.35)/.4):-1.25;c.save();c.translate(.68,.7-b);c.rotate(a+Math.PI/2);
  c.beginPath();c.roundRect(-.025,-.42,.05,.46,.02);c.fillStyle=col('#b98257');c.fill();c.lineWidth=.035;c.strokeStyle=K;c.stroke();
  c.beginPath();c.moveTo(.02,-.4);c.quadraticCurveTo(.2,-.44,.2,-.3);c.quadraticCurveTo(.2,-.2,.02,-.24);c.closePath();c.fillStyle=col('#d6dee6');c.fill();c.stroke();c.restore();
  E(.68,.7-b,.05,.045,col(SKIN),.035)}
 else{const pull=wind?p/.35:hit?Math.max(0,1-(p-.35)*6):0;c.save();c.translate(.74,.64-b);
  c.beginPath();c.arc(-.1,0,.22,-1.05,1.05);c.lineWidth=.07;c.strokeStyle=K;c.stroke();c.lineWidth=.04;c.strokeStyle=col('#a0683a');c.stroke();
  const ex=Math.cos(1.05)*.22-.1,ey=Math.sin(1.05)*.22,sx0=ex-.12*pull;c.beginPath();c.moveTo(ex,-ey);c.lineTo(sx0,0);c.lineTo(ex,ey);c.lineWidth=.018;c.strokeStyle=col('#fff8e0');c.stroke();
  if(pull>.05||p<0){c.beginPath();c.moveTo(sx0,0);c.lineTo(sx0+.26,0);c.lineWidth=.025;c.strokeStyle=K;c.stroke();c.beginPath();c.moveTo(sx0+.3,0);c.lineTo(sx0+.24,-.035);c.lineTo(sx0+.24,.035);c.closePath();c.fillStyle='#9aa6b4';c.fill()}
  c.restore();E(.62,.66-b,.045,.04,col(SKIN),.03);E(.66-.1*pull,.64-b,.045,.04,col(SKIN),.03)}
 c.restore();c.restore()};

// canteen: cream walls, striped awning, big bowl sign on the roof
S.canteen=c=>{const sh=(x,y,rx,ry)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fillStyle='rgba(90,60,30,.22)';c.fill()};sh(.5,.95,.47,.08);
 rr(c,.08,.36,.84,.58,.06,'#fff6e0');
 c.beginPath();c.moveTo(.02,.4);c.lineTo(.12,.14);c.lineTo(.88,.14);c.lineTo(.98,.4);c.closePath();c.fillStyle='#e8b07a';c.fill();c.lineWidth=.035;c.strokeStyle=OL;c.stroke();
 // awning stripes + scallops
 for(let k=0;k<7;k++){const x=.08+k*.12;c.beginPath();c.arc(x+.06,.52,.06,0,Math.PI);c.fillStyle=k%2?'#fff':'#f08a7a';c.fill();c.lineWidth=.025;c.strokeStyle=OL;c.stroke();rr(c,x,.42,.12,.1,0,k%2?'#fff':'#f08a7a',false)}
 c.beginPath();c.moveTo(.08,.42);c.lineTo(.92,.42);c.lineWidth=.03;c.strokeStyle=OL;c.stroke();
 // window with counter + door
 rr(c,.14,.62,.2,.18,.04,'#ffe6a8');rr(c,.68,.62,.2,.18,.04,'#ffe6a8');c.beginPath();c.moveTo(.14,.71);c.lineTo(.34,.71);c.moveTo(.68,.71);c.lineTo(.88,.71);c.lineWidth=.02;c.strokeStyle=OL;c.stroke();
 rr(c,.42,.6,.18,.34,.08,'#b98257');circ(c,.56,.78,.02,'#ffd84a',false);
 // bowl sign on roof edge
 c.beginPath();c.arc(.5,.08,.11,0,Math.PI);c.closePath();c.fillStyle='#fff';c.fill();c.lineWidth=.03;c.strokeStyle=OL;c.stroke();
 c.beginPath();c.moveTo(.42,.0);c.lineTo(.56,-.08);c.moveTo(.47,.0);c.lineTo(.6,-.06);c.lineWidth=.025;c.stroke();
 circ(c,.5,.13,.025,'#f7b2c0',false)};
S.canteenIcon=c=>{c.save();c.translate(.02,.12);c.scale(.96,.86);S.canteen(c);c.restore()};

S.dockIcon=c=>{c.fillStyle='#9fd6e0';c.fillRect(.05,.55,.9,.4);c.fillStyle='#6b4a32';c.fillRect(.22,.5,.08,.42);c.fillRect(.7,.5,.08,.42);for(let k=0;k<3;k++){c.fillStyle=k%2?'#b97f48':'#d59d62';c.fillRect(.12,.2+k*.12,.76,.11)}c.lineWidth=.05;c.strokeStyle=OL;c.strokeRect(.12,.2,.76,.36)};
// v40 码头小屋: chunky pixel hut (12x17 px grid in a 1x1 unit box)
S.dockhut=c=>{const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x/12,y/17,w/12+.002,h/17+.002)};
 c.fillStyle='rgba(60,40,20,.25)';c.beginPath();c.ellipse(.5,.97,.46,.05,0,0,7);c.fill();
 P(5,0,1,3,'#6b4a32');P(6,0,3,2,'#ff6b6b');P(6,1,2,1,'#ffd23f'); // flag
 P(2,3,8,1,'#3b2a20');P(1,4,10,1,'#3b2a20');P(0,5,12,1,'#3b2a20'); // roof outline
 P(2,4,8,1,'#5ab8f0');P(1,5,10,1,'#3fa0e0');P(0,6,12,2,'#5ab8f0');P(0,7,12,1,'#3b88c8');for(let k=0;k<6;k++)P(k*2,6,1,1,'#fff');
 P(1,8,10,8,'#3b2a20');P(2,8,8,7,'#e8b27a');for(let y=9;y<15;y+=2)P(2,y,8,1,'#d59d62');
 P(3,9,3,3,'#3b2a20');P(4,10,1,1,'#bfe9f5');P(3.5,9.5,2,2,'#9fd6e0');P(4.3,9.8,.7,.7,'#fff'); // round-ish window
 P(7,10,3,5,'#3b2a20');P(7.5,10.5,2,4.5,'#a5683c');P(9,12.5,.5,.5,'#ffd23f'); // door
 P(2.4,12.6,1.6,1.6,'#ff9ab0');P(4.6,13,1.2,1.2,'#ff9ab0'); // little fish-shaped buoys
 P(0,15,12,1.6,'#6b4a32');P(1,15.3,10,.6,'#8a5f3c')};
S.dockhutIcon=c=>{c.save();c.translate(.18,.02);c.scale(.64,.96);S.dockhut(c);c.restore()};
