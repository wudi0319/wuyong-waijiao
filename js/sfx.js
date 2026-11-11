// 简单音效（WebAudio 现场合成，无音频文件）。第一次点屏幕后才能出声（手机浏览器的规定）。
const SFX=(()=>{let ac=null,master=null,muted=localStorage.getItem('wywj-mute')==='1';const last={};
 function ensure(){if(ac)return ac;try{ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=.35;master.connect(ac.destination)}catch(e){ac=null}return ac}
 function unlock(){const a=ensure();if(a&&a.state==='suspended')a.resume()}
 ['pointerdown','keydown','touchstart'].forEach(ev=>addEventListener(ev,unlock,{passive:true}));
 function tone(f0,f1,dur,type='sine',vol=.5,delay=0){const t=ac.currentTime+delay,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.02)}
 function noise(dur,vol=.3,hp=800){const t=ac.currentTime,n=Math.floor(ac.sampleRate*dur),buf=ac.createBuffer(1,n,ac.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=buf;f.type='highpass';f.frequency.value=hp;g.gain.value=vol;s.connect(f);f.connect(g);g.connect(master);s.start(t)}
 const LIB={hit:()=>{noise(.06,.18,1500);tone(300,140,.07,'square',.08)},kill:()=>{tone(520,260,.12,'triangle',.25)},
  coin:()=>{tone(988,988,.06,'square',.08);tone(1319,1319,.12,'square',.08,.06)},build:()=>{tone(392,392,.08,'triangle',.3);tone(523,523,.08,'triangle',.3,.08);tone(659,659,.16,'triangle',.3,.16)},
  poor:()=>{tone(220,180,.15,'sawtooth',.12)},night:()=>{tone(330,220,.5,'sine',.3);tone(247,165,.6,'sine',.25,.25)},morning:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,f,.18,'triangle',.22,i*.1))},
  skill:()=>{tone(200,900,.25,'sawtooth',.15);noise(.25,.12,600)},hurt:()=>{tone(260,120,.15,'square',.15)},home:()=>{tone(180,90,.2,'sawtooth',.2);noise(.1,.15,300)},
  win:()=>{[523,659,784,659,784,1047].forEach((f,i)=>tone(f,f,.22,'triangle',.25,i*.14))},lose:()=>{[392,330,262,196].forEach((f,i)=>tone(f,f*.97,.3,'triangle',.25,i*.22))},click:()=>tone(660,660,.04,'square',.06)};
 const GAP={hit:.05,kill:.04,coin:.05,home:.25,hurt:.2};
 function play(k){if(muted||!ensure()||ac.state!=='running'||!LIB[k])return;const now=ac.currentTime;if(GAP[k]&&last[k]&&now-last[k]<GAP[k])return;last[k]=now;try{LIB[k]()}catch(e){}}
 return{play,get muted(){return muted},setMuted(m){muted=!!m;localStorage.setItem('wywj-mute',muted?'1':'')}}})();
window.SFX=SFX;
