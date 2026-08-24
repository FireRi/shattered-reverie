"use strict";
const W=640,H=480,TAU=Math.PI*2;
const cv=document.getElementById('cv'),cx=cv.getContext('2d');
const rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const irnd=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const dist=(x,y,X,Y)=>Math.hypot(X-x,Y-y);
const angTo=(x,y)=>Math.atan2(PL.y-y,PL.x-x);


const KEY={LEFT:37,RIGHT:39,UP:38,DOWN:40,SHIFT:16,Z:90,X:88,C:67,ESC:27,M:77,ENTER:13,R:82};
const PLAYER_HIT_R=2.6;
const GRAZE_R=14;
const OPTION_TURN_RATE=7;
const keys={},edge={};
addEventListener('keydown',e=>{if(!keys[e.keyCode])edge[e.keyCode]=true;keys[e.keyCode]=true;if([37,38,39,40,16,27,90,88,67].includes(e.keyCode))e.preventDefault();AudioSys.unlock();});
addEventListener('keyup',e=>{keys[e.keyCode]=false;});
const down=k=>!!keys[k],hitK=k=>{if(edge[k]){edge[k]=false;return true}return false};
function clearEdges(){for(const k in edge)edge[k]=false;}

const DIFFS=['Easy','Original','Absurdly All-Star'];
let DIFF=1;
const DSCAL=[{c:.65,s:.85,hp:.75},{c:1,s:1,hp:1},{c:2.2,s:1.28,hp:1.15}];
const DN=n=>Math.max(2,Math.round(n*DSCAL[DIFF].c));
const DV=v=>v*DSCAL[DIFF].s;

const COL={
 red:['#ff5060','#ffb0b8'],pink:['#ff70c0','#ffc8e8'],orange:['#ff9030','#ffd8a0'],
 yellow:['#ffe060','#fff8c0'],green:['#60ff80','#c0ffc8'],teal:['#40e0d0','#b0fff4'],
 blue:['#6090ff','#bcd0ff'],dblue:['#4050e0','#a0b0ff'],purple:['#c060ff','#e6c0ff'],
 white:['#f8f8ff','#ffffff'],gray:['#a0a0b0','#d8d8e0'],black:['#30303c','#90909c'],
 lime:['#b0ff30','#e8ffc0'],brown:['#c08050','#f0d0b0']
};
let eshots=[],pshots=[],items=[],fx=[],ftext=[],elasers=[];
let shakeT=0,shakeM=0,flashA=0,flashC='#fff';
function shake(f,m){shakeT=Math.max(shakeT,f);shakeM=m;}
function screenFlash(a,c='#fff'){flashA=Math.max(flashA,a);flashC=c;}
function addText(x,y,s,c='#fff',sz=14,life=45,vy=-0.7){if(ftext.length<40)ftext.push({x,y,s,c,sz,life,max:life,vy});}
function fxRing(x,y,c,r0=6,r1=60,w=3,life=24){if(fx.length<300)fx.push({t:'ring',x,y,c,r0,r1,w,life,max:life});}
function fxBurst(x,y,c,n=10,sp=4){for(let i=0;i<n;i++){if(fx.length>=300)break;const a=rnd(TAU);fx.push({t:'p',x,y,vx:Math.cos(a)*rnd(sp*.3,sp),vy:Math.sin(a)*rnd(sp*.3,sp),c,life:irnd(14,26),max:26});}}
function fxSpark(x,y,c,life=12){if(fx.length<300)fx.push({t:'spark',x,y,c,life,max:life});}
const ASSETS={};
const SFX_FILES={pshot:'gun13_a',bossHit:'hit_s03_a',bomb:'bom20_a',death:'bom26_c',bossDie:'bom28_b',
 item:'power01_b',extend:'power04',spellget:'power02',capture:'power03',
 cur:'cursor00_a',ok:'cursor01',no:'cursor03',warn:'alarm00'};
const SFX_VOL={pshot:.35,bossHit:.15,bomb:.55,death:.6,bossDie:.6,item:.4,extend:.5,
 spellget:.45,capture:.5,cursor:.35,ok:.4,no:.4,warn:.4};
function preloadSfx(){
 if(typeof AudioSys.ctx==='undefined'||!AudioSys.ctx||typeof AudioSys.ctx.decodeAudioData!=='function'||typeof fetch!=='function')return;
 for(const key in SFX_FILES){
  if(AudioSys.buffers[key])continue;
  const file=SFX_FILES[key];
  fetch('assets/sfx/'+file+'.wav').then(r=>{if(!r.ok)throw 0;return r.arrayBuffer();})
   .then(ab=>AudioSys.ctx.decodeAudioData(ab))
   .then(buf=>{AudioSys.buffers[key]=buf;})
   .catch(()=>{});
 }
}
function makeGenTextures(){
 if(typeof document==='undefined'){ASSETS.gen_glow={};ASSETS.gen_ring={};ASSETS.gen_disc={};return;}
 const mk=fn=>{const cv=document.createElement('canvas');cv.width=cv.height=64;const cc=cv.getContext('2d');fn(cc);return cv;};
 ASSETS.gen_glow=mk(cc=>{const g=cc.createRadialGradient(32,32,2,32,32,31);
  g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.45,'rgba(255,255,255,.4)');g.addColorStop(1,'rgba(255,255,255,0)');
  cc.fillStyle=g;cc.fillRect(0,0,64,64);});
 ASSETS.gen_ring=mk(cc=>{cc.strokeStyle='rgba(255,255,255,.9)';cc.lineWidth=5;
  cc.beginPath();cc.arc(32,32,25,0,TAU);cc.stroke();});
 ASSETS.gen_disc=mk(cc=>{cc.fillStyle='#fff';cc.beginPath();cc.arc(32,32,23,0,TAU);cc.fill();});
 ASSETS.gen_seigaiha=mk(cc=>{
  cc.strokeStyle='rgba(255,255,255,.85)';cc.lineWidth=1.5;
  const step=16,half=step/2;
  for(let row=0;row<6;row++){
   const y=row*half+half;
   const off=(row%2)?half:0;
   for(let col=-1;col<5;col++){
    const cxp=col*step+off;
    for(let k=0;k<4;k++){
     cc.beginPath();cc.arc(cxp,y,(half-2)-k*3.5,Math.PI,TAU);cc.stroke();
    }
   }
  }
 });
}
function loadAssets(){
 makeGenTextures();
 if(typeof Image==='undefined'){
  return;
 }
 const th=['ballred','ballblue','ballpurple','ballorange','ballyellow','ballgreen','ballcyan','ballgray',
  'ricered','riceblue','ricepurple','riceorange','riceyellow','ricegreen','ricecyan',
  'arrowheadred','arrowheadblue','arrowheadpurple','arrowheadorange','arrowheadyellow','arrowheadgreen','arrowheadcyan',
  'orbblue','orbcyan','orborange','orbpurple','orbyellow',
  'bubblesmall','bubblemedium','bubblebig',
  'jellybeanblue','jellybeanorange','jellybeanpurple','jellybeangreen','jellybeancyan',
  'shadowbullet','staryellow','sunflower','purpleflower','feather'];
 for(const f of th){
  const im=new Image();im.onload=()=>{ASSETS['th_'+f]=im;};im.src='gfx/ttdm/bullets/hostile/'+f+'.png';
 }
 const rest=[['seal_red','bullets/player/sealred'],['seal_blue','bullets/player/sealblue'],['seal_green','bullets/player/sealgreen'],
  ['item_P','entities/items/power'],['item_B','entities/items/point'],['item_L','entities/items/life'],['item_S','entities/items/bomb'],
  ['gem_life','ui/gems/lifegem'],['gem_bomb','ui/gems/bombgem'],
  ['fx_warning','effects/warning'],['fx_destruction','effects/destruction'],['fx_cannonfire','effects/cannonfire'],['fx_bosscharge','effects/bosscharge'],['fx_bosshurt','effects/bosshurt'],
  ['yingyang','entities/other/yingyang'],
  ['bg_menubg','ui/menubg'],['bg_mainbg','ui/mainbg'],['ui_title','ui/maintitle'],['ui_arrow','ui/arrow'],
  ['route_s1','backgrounds/stage1_forest'],['route_s2','backgrounds/stage2_lake'],
  ['route_s3','backgrounds/stage3_bg'],['route_ex','backgrounds/stage3_gate_bg'],
  ['spellbg_s1','backgrounds/stage1_spellcard'],['spellbg_s2','backgrounds/stage2_lake_spellcard'],['spellbg_s4','backgrounds/stage2_cirno_spellcard'],
  ['spellbg_s6','backgrounds/stage3_meiling_spellcard']];
 for(const [k,f] of rest){
  const im=new Image();im.onload=()=>{ASSETS[k]=im;};im.src='gfx/ttdm/'+f+'.png';
 }
}
const TH_COLOR={red:'red',blue:'blue',dblue:'purple',purple:'purple',teal:'cyan',cyan:'cyan',green:'green',yellow:'yellow',orange:'orange'};
function thImg(pre,c){const s=TH_COLOR[c];return s?ASSETS['th_'+pre+s]:null;}
function fxSpr(img,x,y,sc,al=0.85,vy=-0.4,rot){
 if(fx.length>=300||!ASSETS[img])return;
 fx.push({t:'spr',img,x,y,vx:rnd(-.3,.3),vy:vy+rnd(-.2,.2),sc,al,rot:rot!==undefined?rot:rnd(TAU),life:irnd(26,44),max:44});
}
function fxSlash(x,y,angDeg,scale=1){
 if(fx.length>=300)return;
 fx.push({t:'crescent',x,y,ang:angDeg*Math.PI/180,scale,life:16,max:16,col:'#fff'});
}
const tintCache=new Map();
function tinted(imgName,color,size=64){
 const key=imgName+color;
 let cv=tintCache.get(key);
 if(cv)return cv;
 const src=ASSETS[imgName];
 if(!src)return null;
 cv=document.createElement('canvas');cv.width=size;cv.height=size;
 const cc=cv.getContext('2d');
 cc.drawImage(src,0,0,size,size);
 cc.globalCompositeOperation='source-in';
 cc.fillStyle=color;cc.fillRect(0,0,size,size);
 tintCache.set(key,cv);
 return cv;
}
function fxShard(x,y){if(fx.length>=300)return;const a=rnd(TAU);
 fx.push({t:'shard',x,y,vx:Math.cos(a)*rnd(1,3.5),vy:Math.sin(a)*rnd(1,3.5),ang:a,life:irnd(10,16),max:16});}

let grazeTick=0,hitTick=0;
const epool=[];let eSpawned=0,eReused=0;
function killE(i){const b=eshots[i];if(!b)return;b.fn=null;epool.push(b);eshots.splice(i,1);}
function spawnE(o){
 if(eshots.length>1600)return;
 const b=epool.pop();
 if(b!==undefined)eReused++;
 const s=b||{};
 s.fn=null;s.keep=false;
 Object.assign(s,{g:'ball',c:'white',x:0,y:0,v:2,ang:90,r:5,acc:0,max:-1,t:0,grazed:false,hit:true,
  av:0,end:null,dur:0,spin:rnd(TAU),alpha:1},o);
 if(!o.fast)s.v=Math.min(s.v||2,8.5);
 if(!isFinite(s.x))s.x=W/2; if(!isFinite(s.y))s.y=-20;
 const an=(isFinite(s.ang)?s.ang:90)*Math.PI/180;
 s.vx=Math.cos(an)*s.v;s.vy=Math.sin(an)*s.v;
 eshots.push(s);eSpawned++;
}
function eUpdate(){
 const tranceActive=G.trance>0;
 const tranceR2=10000; /* 100^2 */
 for(let i=eshots.length-1;i>=0;i--){const b=eshots[i];b.t++;
  if(b.av){const r=b.av*.017453293,ca=Math.cos(r),sa=Math.sin(r);const nvx=b.vx*ca-b.vy*sa;b.vy=b.vx*sa+b.vy*ca;b.vx=nvx;if(--b.dur<=0)b.av=0;}
  if(b.acc){
   const sp2=b.vx*b.vx+b.vy*b.vy;
   let sp=Math.sqrt(sp2)+b.acc;
   if(b.max>0&&sp>b.max)sp=b.max;
   const inv=sp/Math.sqrt(sp2)||0;
   b.vx*=inv;b.vy*=inv;
  }
  if(b.fn&&b.fn(b)===false){killE(i);continue;}
  let mx=b.vx,my=b.vy;
  if(tranceActive){
   const dxp=b.x-PL.x,dyp=b.y-PL.y;
   const d2=dxp*dxp+dyp*dyp;
   if(d2<tranceR2){const k=.55+.45*(Math.sqrt(d2)/100);mx*=k;my*=k;}
  }
  b.x+=mx;b.y+=my;
  if(b.x<-48||b.x>W+48||b.y<-48||b.y>H+48){if(!b.keep||b.t>240){killE(i);continue;}}
 }
}
function spawnP(o){
 if(pshots.length>400)return;
 const b={x:0,y:0,v:10,ang:-90,dmg:2,type:'shot',r:4,t:0,dead:false};
 Object.assign(b,o);b.vx=Math.cos(b.ang*Math.PI/180)*b.v;b.vy=Math.sin(b.ang*Math.PI/180)*b.v;
 pshots.push(b);
}
function pUpdate(){
 const bs=_ne();
 for(let i=pshots.length-1;i>=0;i--){const b=pshots[i];b.t++;
  if(b.hom&&b.tgt&&!b.tgt.dying){
   const want=Math.atan2(b.tgt.y-b.y,b.tgt.x-b.x)*180/Math.PI;
   let cur=Math.atan2(b.vy,b.vx)*180/Math.PI;
   let diff=((want-cur+540)%360)-180;
   cur+=clamp(diff,-OPTION_TURN_RATE,OPTION_TURN_RATE);
   const sp=Math.hypot(b.vx,b.vy);
   b.vx=Math.cos(cur*Math.PI/180)*sp;b.vy=Math.sin(cur*Math.PI/180)*sp;
  }
  if(bs){
   const dx=b.x-bs.x,dy=b.y-bs.y;
   if(dx*dx+dy*dy<(BOSS_HIT_R+3)*(BOSS_HIT_R+3)){
    damageBossRaw(b.dmg||2);
    fxSpark(bs.x+rnd(-10,10),bs.y+rnd(6,20),'#fff',7);
    pshots.splice(i,1);continue;
   }
  }
  b.x+=b.vx;b.y+=b.vy;
  if(b.x<-20||b.x>W+20||b.y<-40||b.y>H+20)pshots.splice(i,1);}
}

const IT={P:'#ff4040',B:'#4090ff',L:'#ff40ff',S:'#ffff40',K:'#ffd700'};
function spawnItem(t,x,y,vx=0){
 if(items.length>220)return;
 items.push({t,x,y,vx,vy:rnd(-3,-1),fall:false,t2:0});
}
function itemSpray(x,y,n=8,kind='B'){for(let i=0;i<n;i++)spawnItem(kind,x,y,Math.cos(TAU*i/n)*2.2);}
function itemUpdate(){
 let groundCount=0;
 for(const q of items)if(q.ground)groundCount++;
 for(let i=items.length-1;i>=0;i--){const it=items[i];it.t2++;
  if(PL.y<150&&!it.fall)it.fall=true;
  if(!it.fall&&dist(it.x,it.y,PL.x,PL.y)<75)it.fall=true;
  if(it.fall){it.x=lerp(it.x,PL.x,.09);it.y=lerp(it.y,PL.y,.14);
   if(it.t2%4===0&&fx.length<300)fx.push({t:'trail',x:it.x+rnd(-3,3),y:it.y+rnd(-2,4),c:IT[it.t],life:10,max:10});}
  else{it.vy=Math.min(it.vy+.12,2.6);it.vx*=.98;it.x+=it.vx;it.y+=it.vy;
   if(it.y>=H-14){it.y=H-14;it.vy=0;it.ground=true;}}
  if(it.ground){
   it.life=(it.life===undefined?560:it.life)-1;
   if(groundCount>26){groundCount--;}
   if(it.life<=0){collect(it);fxSpark(it.x,it.y,'#cfc',8);items.splice(i,1);continue;}
  }
   if(dist(it.x,it.y,PL.x,PL.y)<16||(PL.y<150)){
    collect(it);items.splice(i,1);}
  }
}
function collect(it){
 const px=PL.x+rnd(-8,8),py=PL.y-24;
 if(it.t==='P'){addPower(8);sfx('item');addText(px,py,'PWR','#ff8080',11,30);}
 else if(it.t==='B'){const v=Math.floor(8000*(1+PL.graze/400));G.score+=v;sfx('item');addText(px,py,'+'+v,'#6090ff',12,36);}
 else if(it.t==='L'){PL.lives=Math.min(8,PL.lives+1);G.livesPulse=36;addText(PL.x,PL.y-30,'Extend!','#ff60ff');sfx('extend');
  fxRing(PL.x,PL.y,'#ffd700',8,60,4,24);}
 else if(it.t==='S'){PL.spells=Math.min(4,PL.spells+1);addText(PL.x,PL.y-30,'Spell +1','#ffff60');sfx('spellget');}
 else if(it.t==='K'){G.sparksGot++;G.score+=10000;sfx('spellget');
  addText(PL.x,PL.y-30,'+10k','#ffd700',14,40);fxBurst(PL.x,PL.y,'#ffd700',8,3);}
}

function addPower(v){PL.power=clamp(PL.power+v,100,500);}

/* ================= AUDIO ================= */
const AudioSys={ctx:null,master:null,muted:false,bgmTimer:null,nextT:0,step:0,seed:1,vol:.17,
 buffers:{},
 unlock(){if(this.ctx)return;try{this.ctx=new(window.AudioContext||window.webkitAudioContext)();
  this.master=this.ctx.createGain();this.master.gain.value=this.vol;this.master.connect(this.ctx.destination);
  preloadSfx();}catch(e){}},
 playSample(name){
  const key=SFX_FILES[name];if(!key)return false;
  const buf=this.buffers[key];if(!buf)return false;
  if(this.muted||!this.ctx)return true;
  const s=this.ctx.createBufferSource();s.buffer=buf;
  const g=this.ctx.createGain();g.gain.value=SFX_VOL[name]??.4;
  g.connect(this.master);s.connect(g);s.start(this.ctx.currentTime);return true;
 },
 tone(f,dur,type='square',vol=.5,slide=0,delay=0){if(!this.ctx||this.muted)return;const t=this.ctx.currentTime+delay;
  const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+.02);},
 noise(dur,vol=.4,delay=0,hp=0){if(!this.ctx||this.muted)return;const t=this.ctx.currentTime+delay;
  const n=this.ctx.sampleRate*dur,buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=this.ctx.createBufferSource();s.buffer=buf;const g=this.ctx.createGain();g.gain.value=vol;
  let node=s;if(hp){const f=this.ctx.createBiquadFilter();f.type='highpass';f.frequency.value=hp;s.connect(f);node=f;}
  node.connect(g);g.connect(this.master);s.start(t);}};
function sfx(name,o={}){
 if(AudioSys.playSample(name))return;
 switch(name){
  case 'graze':if(grazeTick%3===0)AudioSys.tone(1800+rnd(600),.03,'sine',.12,-400);break;
  case 'pshot':break;
  case 'eshot':if(hitTick%4===0)AudioSys.noise(.03,.06,0,3000);break;
  case 'bossHit':if(hitTick%6===0)AudioSys.tone(220,.03,'square',.05,-40);break;
  case 'item':AudioSys.tone(1200,.06,'sine',.18,300);break;
  case 'extend':[660,880,1100,1320].forEach((f,i)=>AudioSys.tone(f,.1,'triangle',.25,0,i*.07));break;
  case 'spellget':AudioSys.tone(900,.12,'triangle',.22,500);break;
  case 'flash':AudioSys.noise(.5,.5);AudioSys.tone(120,.5,'sawtooth',.4,-90);break;
  case 'bomb':AudioSys.tone(80,.6,'sawtooth',.5,-40);AudioSys.noise(.6,.35);break;
  case 'declare':AudioSys.tone(200,.5,'sawtooth',.3,900);AudioSys.noise(.3,.2,0,1500);break;
  case 'capture':[523,659,784,1047,1319].forEach((f,i)=>AudioSys.tone(f,.16,'triangle',.3,0,i*.09));break;
  case 'timeout':AudioSys.tone(160,.5,'square',.3,-60);break;
  case 'bosswalk':AudioSys.tone(90,.3,'triangle',.3,60);break;
  case 'death':AudioSys.noise(.8,.5);AudioSys.tone(200,.8,'sawtooth',.4,-160);break;
  case 'bossDie':AudioSys.noise(1,.55);[300,200,130,80].forEach((f,i)=>AudioSys.tone(f,.3,'sawtooth',.3,-60,i*.1));break;
  case 'cur':AudioSys.tone(700,.04,'square',.15);break;
  case 'ok':AudioSys.tone(900,.07,'square',.2);AudioSys.tone(1350,.07,'square',.15,0,.05);break;
  case 'no':AudioSys.tone(200,.15,'square',.2,-80);break;
  case 'laser':AudioSys.tone(1400,.2,'sawtooth',.12,-900);break;
  case 'warn':AudioSys.tone(500,.1,'square',.2,0);AudioSys.tone(500,.1,'square',.2,0,.15);break;
 }}
/* ================= MUSIC v2 — seeded theory-driven synth score ================= */
function mulberry(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const nf=m=>440*Math.pow(2,(m-69)/12);
const Music={on:false,timer:null,step:0,nextT:0,cfg:null,gain:null,noiseBuf:null,lastM:0,
 echo:null,echoWet:null,echoFb:null,
 stats:{notes:0},badNotes:0,
 PROGS:[[0,8,3,10],[0,5,10,7],[0,3,8,10],[0,10,5,7],[0,8,7,10],[0,5,8,7],[0,10,3,8]],
 KICKS:[[0,4,8,12],[0,4,7,10,12],[0,6,8,14],[0,4,8,11,12]],
 build(seed){
  const R=mulberry((seed|0)*7919+13);
  const root=45+[0,2,3,5,7,8,10][Math.floor(R()*7)];
  const prog=this.PROGS[Math.floor(R()*this.PROGS.length)];
  const kick=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  this.KICKS[Math.floor(R()*this.KICKS.length)].forEach(i=>kick[i]=1);
  const MOTIFS=[
   [1,0,0,1, 0,1,0,0, 1,0,1,0, 0,1,0,0],
   [1,0,1,0, 0,1,0,1, 1,0,0,1, 0,0,1,0],
   [1,1,0,0, 1,0,0,1, 0,1,0,0, 1,0,1,0],
   [1,0,0,1, 0,0,1,0, 1,0,1,0, 0,1,0,0]
  ];
  const motif=MOTIFS[Math.floor(R()*MOTIFS.length)].slice();
  for(let k=0;k<2;k++){const i=Math.floor(R()*16);motif[i]=motif[i]?0:1;}
  if(motif.filter(Boolean).length<5)motif[0]=1;
  const arpMask=[],melMask=[];
  this.cfg={root,prog,bpm:[148,156,162,168,174][Math.floor(R()*5)],
   leadWave:'sawtooth',motif,
   swing:R()*.07,kick,arpMask,melMask,hatDiv:1,arpUp:R()<.55};
  this.lastM=root+12;
 },
 setEcho(){
  if(this.echo&&this.cfg)this.echo.delayTime.value=Math.min(.9,(60/this.cfg.bpm/4)*3);
 },
 ensureBus(){
  if(!AudioSys.ctx)return null;
  if(!this.gain){
   const c=AudioSys.ctx;
   this.gain=c.createGain();this.gain.gain.value=.9*VOL_STEPS[musicVolIdx];
   const comp=c.createDynamicsCompressor();
   comp.threshold.value=-20;comp.ratio.value=4;
   this.gain.connect(comp);comp.connect(AudioSys.master);
   this.echo=c.createDelay(1);this.echoFb=c.createGain();this.echoFb.gain.value=.28;
   this.echoWet=c.createGain();this.echoWet.gain.value=.15;
   const echoHp=c.createBiquadFilter();echoHp.type='highpass';echoHp.frequency.value=850;
   this.echo.connect(this.echoFb);this.echoFb.connect(this.echo);
   this.echo.connect(echoHp);echoHp.connect(this.echoWet);this.echoWet.connect(this.gain);
   const n=c.sampleRate|0;
   const buf=c.createBuffer(1,n,n);const d=buf.getChannelData(0);
   for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
   this.noiseBuf=buf;
   this.setEcho();
   if(c.createPeriodicWave){
    const N=32,re=new Float32Array(N),im=new Float32Array(N);
    for(let k=1;k<N;k++){const a=(2/(k*Math.PI))*Math.sin(k*Math.PI*.25);im[k]=a;}
    this.pw25=c.createPeriodicWave(re,im,{disableNormalization:false});
   }
   this.usesChip=true;
  }
  return this.gain;
 },
 arrangementFor(bar8,inten){
  return {
   drums:true,
   arp:bar8>=2&&bar8<7||inten>1,
   lead:inten>1||(bar8>=4&&bar8<7),
   breakdown:bar8===7&&inten<=1,
   full:inten>1
  };
 },
 intensity(){return (typeof BOSS!=='undefined'&&BOSS&&BOSS.spellActive)?2:1;},
 chordTones(bar){
  const deg=this.cfg.prog[bar%4];
  const r=this.cfg.root+deg;
  const minor=(deg===0||deg===5);
  const iv=minor?[0,3,7]:[0,4,7];
  return {root:r,tones:[r,r+iv[1],r+iv[2]]};
 },
 vChip(t,m,dur,v,wave){const c=AudioSys.ctx;
  const g=c.createGain();
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.012);
  g.gain.setValueAtTime(v*.85,t+dur*.7);g.gain.linearRampToValueAtTime(.0001,t+dur);
  const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=5200;
  g.connect(f);f.connect(this.gain);
  const send=c.createGain();send.gain.value=.4;f.connect(send);send.connect(this.echo);
  const lfo=c.createOscillator(),lg=c.createGain();
  lfo.frequency.value=6;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(9,t+.1);
  lfo.connect(lg);lfo.start(t);lfo.stop(t+dur+.05);
  const o=c.createOscillator();
  if(wave==='pulse25'&&this.pw25)o.setPeriodicWave(this.pw25);
  else o.type=wave||'square';
  o.frequency.setValueAtTime(nf(m)*.94,t);
  o.frequency.exponentialRampToValueAtTime(nf(m),t+.05);
  lg.connect(o.detune);
  o.connect(g);o.start(t);o.stop(t+dur+.04);this.stats.notes++;
 },
 osc(t,f,dur,type,vol,dest){const c=AudioSys.ctx,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.008);
  g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g);g.connect(dest||this.gain);o.start(t);o.stop(t+dur+.03);this.stats.notes++;},
 noiseHit(t,dur,vol,type,freq,q){const c=AudioSys.ctx,s=c.createBufferSource();s.buffer=this.noiseBuf;
  s.loop=true;s.playbackRate.value=1;
  const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;if(q)f.Q.value=q;
  const g=c.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  s.connect(f);f.connect(g);g.connect(this.gain);s.start(t);s.stop(t+dur+.02);this.stats.notes++;},
 vKick(t,v){const c=AudioSys.ctx,o=c.createOscillator(),g=c.createGain();
  o.frequency.setValueAtTime(155,t);o.frequency.exponentialRampToValueAtTime(44,t+.1);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.24);
  o.connect(g);g.connect(this.gain);o.start(t);o.stop(t+.26);this.stats.notes++;},
 vBass(t,m,dur,v=.28){const c=AudioSys.ctx,o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
  o.type='sawtooth';o.frequency.value=nf(m);
  f.type='lowpass';f.frequency.value=320;f.Q.value=2;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.014);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(f);f.connect(g);g.connect(this.gain);o.start(t);o.stop(t+dur+.05);this.stats.notes++;},
 vPluck(t,m,dur,v,wave){const c=AudioSys.ctx,o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
  o.type=wave;o.frequency.value=nf(m);
  f.type='lowpass';f.frequency.setValueAtTime(1900,t);f.frequency.exponentialRampToValueAtTime(520,t+dur);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
   o.connect(f);f.connect(g);g.connect(this.gain);o.start(t);o.stop(t+dur+.03);this.stats.notes++;},
 leadNote(ct,R){
  let best=null,bd=99;
  for(const tn of ct.tones){
   for(const oct of [-12,0,12]){
    const cand=tn+oct;
    const d=Math.abs(cand-this.lastM)+R()*3;
    if(cand>this.cfg.root&&d<bd){bd=d;best=cand;}
   }
  }
  if(R()<.22)best+=(best-this.lastM>4?-12:(this.lastM-best>4?12:0));
  this.lastM=best;
  return best;
 },
 inKey(m){
  const rel=((m-this.cfg.root)%12+12)%12;
  return [0,2,3,5,7,8,10,11].includes(rel);
 },
 scheduleStep(s,tRaw,spb){
  if(AudioSys.muted)return;
  const cfg=this.cfg,st=s%16,bar=Math.floor(s/16)%8,ch=bar%4;
  const R=mulberry(s*48271+1);
  const hum=(R()-.5)*.008;
  const vel=(base)=>base*(0.85+R()*.3);
  const t=tRaw+(st%2===1?cfg.swing*spb:0)+hum;
  const inten=this.intensity();
  const A=this.arrangementFor(bar,inten);
  const ct=this.chordTones(ch);
  if(A.breakdown&&st!==0){
   if(st>=12)this.noiseHit(t,.09,.09+(st-12)*.05,'bandpass',2600,.8);
   if(cfg.kick[st])this.vKick(t,.45);
   return;
  }
  if(cfg.kick[st])this.vKick(t,vel(.75));
  if(st===4||st===12)this.noiseHit(t,.12,vel(.3),'bandpass',2100,1);
  if(s%256===0)this.noiseHit(t,.7,.15,'highpass',5400);
  if(st%2===1)this.noiseHit(t,st===7||st===15?.06:.03,st===7||st===15?.16:.08,'highpass',8200);
  if(st%2===0||(inten>1&&st===15))
   this.vBass(t,ct.root-12+((st%8===6)?12:0),spb*.92,vel(.26));
  if(A.arp&&R()>.14){
   const seq=[...ct.tones].sort((a,b)=>cfg.arpUp?a-b:b-a);
   const m=seq[(s>>1)%3]+12;
   this.vPluck(t,m,spb*.9,.05,'square');
  }
  if(A.lead&&cfg.motif[st]){
   const m=this.leadNote(ct,R)+12;
   if(!this.inKey(m))this.badNotes++;
   const nextOn=st<15?cfg.motif[st+1]:0;
   this.vChip(t,m,spb*(nextOn?1.3:2.5),vel(.14),'pulse25');
   if(st%8===0&&R()<.35)
    this.vPluck(t,m+12,spb*.28,.05,'square');
  }else if(A.lead&&st%4===2){
   const hm=ct.tones[(st>>2)%3]-12;
   this.vChip(t,hm+12,spb*.9,.04,'square');
  }
  if(st===0&&(bar%2===0||inten>1)){
   for(const tn of [ct.tones[0],ct.tones[2]]){
    const c=AudioSys.ctx,o=c.createOscillator(),g=c.createGain();
    o.type='square';o.frequency.value=nf(tn-12)/2;
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.02,t+.06);
    g.gain.linearRampToValueAtTime(.0001,t+spb*14);
    o.connect(g);g.connect(this.gain);o.start(t);o.stop(t+spb*14+.05);this.stats.notes++;
   }
  }
 },
 tick(){
  if(!this.on)return;
  if(!AudioSys.ctx||!this.cfg){return;}
  if(!this.ensureBus())return;
  const c=AudioSys.ctx,spb=60/this.cfg.bpm/4;
  if(this.nextT<c.currentTime)this.nextT=c.currentTime+.06;
  let guard=0;
  while(this.nextT<c.currentTime+.24&&guard++<64){
   this.scheduleStep(this.step,this.nextT,spb);
   this.step++;this.nextT+=spb;
  }
 }
};
function startBgm(seed,tempoHint){
 if(!Music.on||Music._seed!==seed){Music.build(seed);Music._seed=seed;Music.setEcho();}
 if(tempoHint){Music.cfg.bpm=tempoHint;Music.setEcho();}
 Music.on=true;
 if(!Music.timer)Music.timer=setInterval(()=>Music.tick(),40);
}
function stopBgm(){Music.on=false;}
const VOL_STEPS=[.2,.35,.5,.7,1];
let musicVolIdx=2;
function setMusicVol(idx){
 musicVolIdx=clamp(idx,0,VOL_STEPS.length-1);
 if(Music.gain)Music.gain.gain.value=.9*VOL_STEPS[musicVolIdx];
 try{localStorage.setItem('lasr_mvol',String(musicVolIdx));}catch(e){}
 addText(W-70,H-60,'MUSIC '+Math.round(VOL_STEPS[musicVolIdx]*100)+'%','#9cf',13,50);
}
try{const v=parseInt(localStorage.getItem('lasr_mvol')||'2');if(v>=0&&v<VOL_STEPS.length)musicVolIdx=v;}catch(e){}

/* ================= PLAYER ================= */
const PL={x:W/2,y:H-70,lives:4,spells:2,power:300,graze:0,flashMax:30,flash:0,inv:0,dead:0,
 focus:false,opts:[],optAng:0,shootT:0,deathT:0,rebirthX:0,rebirthY:0,alive:true,slowT:0};
function resetPlayer(full){PL.x=W/2;PL.y=H-70;if(full){PL.lives=4;PL.spells=2;}PL.power=Math.max(PL.power,300);PL.inv=120;PL.dead=0;PL.alive=true;PL.flash=0;}
function killPlayer(){
 if(PL.inv>0||PL.dead)return;
 G.deaths++;sfx('death');fxBurst(PL.x,PL.y,'#f8f',26,7);fxRing(PL.x,PL.y,'#fff',8,120,5,30);shake(20,8);screenFlash(.5,'#fff');
 for(let i=0;i<6;i++)fx.push({t:'puff',x:PL.x+rnd(-14,14),y:PL.y+rnd(-10,10),vx:rnd(-.4,.4),vy:rnd(-.7,-.2),sc:rnd(.6,1.1),life:irnd(24,40),max:40});
 PL.dead=1;PL.deathT=0;PL.deathWindow=16;
 G.streak=0;G.streakMult=1;
 clearBullets(false);
}
function tryDeathbomb(){
 if(PL.spells<=0)return false;
 PL.spells--;G.spellUsedOwn++;
 PL.dead=0;PL.deathT=0;PL.deathWindow=0;PL.inv=160;
 PL.x=clamp(PL.rebirthX||W/2,14,W-14);PL.y=clamp(PL.rebirthY||H-70,14,H-14);
 sfx('bomb');shake(12,4);screenFlash(.6,'#fff');
 clearBullets(false);
 fxRing(PL.x,PL.y,'#fff',10,220,6,28);
 damageBossRaw(120);
 return true;
}
function clearBullets(toItems){
 for(let i=eshots.length-1;i>=0;i--){const b=eshots[i];
  if(toItems&&Math.random()<.12&&items.length<200)spawnItem(Math.random()<.7?'B':'P',b.x,b.y);
  if(fx.length<300)fxSpark(b.x,b.y,'#aaf',8);
  killE(i);
 }
 elasers.length=0;
}
function useFlashBomb(){
 if(PL.flash<PL.flashMax||PL.dead)return;
 if(BOSS&&BOSS.spellActive&&BOSS.atk)G.spellBombUsed=true;
 PL.flash=0;PL.inv=Math.max(PL.inv,60);sfx('flash');shake(14,6);screenFlash(.85,'#fff');
 const x=PL.x,y=PL.y;
 fx.push({t:'cross',x,y,life:36,max:36});
 clearBullets(false);
 for(let i=0;i<3;i++)fxRing(x,y,'#fff',10+i*20,420,6,30+i*4);
 damageBossRaw(60);
}
function useSpell(){
 if(PL.spells<=0||PL.dead||!BOSS)return false;
 if(BOSS.spellActive&&BOSS.atk)G.spellBombUsed=true;
 PL.spells--;G.spellUsedOwn++;PL.inv=Math.max(PL.inv,230);sfx('bomb');shake(16,5);screenFlash(.7,'#fff');
 const sx=PL.x,sy=PL.y;
 fx.push({t:'monochrome',x:sx,y:sy,life:210,max:210});
 G.monoRay={x:PL.x,t:0};
 return true;
}
function playerUpdate(){
 if(PL.dead){updatePlayerDeath();return;}
 updatePlayerMovement();
 handleBombInput();
 const shooting=Gdemo||autoFire||down(KEY.Z);
 PL.shooting=shooting;
 if(shooting)firePlayerWeapon();
 else updateOptions(Math.floor(PL.power/100)>=2?5:3,false);
 tickMonochromeRay();
}
function updatePlayerDeath(){
 if(PL.deathWindow>0){
  PL.deathWindow--;
  if((hitK(KEY.X)||hitK(KEY.C))&&tryDeathbomb())return;
 }
 PL.deathT++;
 if(PL.deathT<=50)return;
 if(PL.lives>0){
  PL.lives--;PL.spells=2;PL.alive=true;PL.dead=0;PL.inv=100;
  PL.x=clamp(PL.rebirthX||W/2,20,W-20);PL.y=clamp(PL.rebirthY||H-70,20,H-20);
  PL.rebirthX=0;PL.rebirthY=0;
  fxRing(PL.x,PL.y,'#8ff',10,80,4,26);
 }else{PL.dead=2;onGameOver();}
}
function updatePlayerMovement(){
 if(Gdemo){updateDemoMovement();return;}
 PL.focus=down(KEY.SHIFT);
 const sp=PL.focus?3.2:5.5;
 let dx=(down(KEY.RIGHT)?1:0)-(down(KEY.LEFT)?1:0),dy=(down(KEY.DOWN)?1:0)-(down(KEY.UP)?1:0);
 if(dx&&dy){dx*=.7071;dy*=.7071;}
 PL.x=clamp(PL.x+dx*sp,12,W-12);PL.y=clamp(PL.y+dy*sp,12,H-12);
 if(dx>0)PL.tilt=Math.min(1,(PL.tilt||0)+.14);else if(dx<0)PL.tilt=Math.max(-1,(PL.tilt||0)-.14);
 else PL.tilt=(PL.tilt||0)*.82;
 if(dx>0)PL.face=1;else if(dx<0)PL.face=-1;
 if(PL.inv>0)PL.inv--;
 if(PL.focus&&PL.slowT++%6===0)fx.push({t:'focusring',x:PL.x,y:PL.y,life:40,max:40});
}
function handleBombInput(){
 const xHit=hitK(KEY.X),cHit=hitK(KEY.C);
 if(!(xHit||cHit)||PL.dead)return;
 if(!cHit&&PL.flash>=PL.flashMax&&!down(KEY.SHIFT))useFlashBomb();
 else useSpell();
}
function firePlayerWeapon(){
 PL.shootT++;
 const pint=Math.floor(PL.power/100);
 if(pint>=3)fireMainBeam(pint);
 else fireRapidShots(pint);
 fireOptionPellets(pint);
}
function fireMainBeam(pint){
 if(PL.shootT%2!==0)return;
 const bs=_ne();
 const connected=!!bs&&Math.abs(bs.x-PL.x)<BOSS_HIT_R&&bs.y<PL.y-10;
 if(connected){damageBossRaw(1.55*(PL.power/300));fxSpark(bs.x+rnd(-14,14),bs.y+18,'#bff6ff',7);}
 fx.push({t:'beam',x:PL.x,y:PL.y-14,life:6,max:6,w:(pint>=5?9:7)*(connected?1:.55),hit:connected});
}
function fireRapidShots(pint){
 if(PL.shootT%4!==0)return;
 spawnP({x:PL.x-6,y:PL.y-10,v:14,ang:-90,dmg:2.2});
 spawnP({x:PL.x+6,y:PL.y-10,v:14,ang:pint>1?-84:-96,dmg:2.2});
 sfx('pshot');
}
function fireOptionPellets(pint){
 const nOpt=pint>=2?5:3;
 updateOptions(nOpt);
 if(PL.shootT%4!==0)return;
 const tgt=_ne();
 const mid=Math.floor(nOpt/2);
 for(let i=0;i<nOpt;i++){
  const o=PL.opts[i]||PL.x;
  let a=-90;
  if(pint>=4)a+=(i-2)*4;
  const useHome=PL.focus&&!!tgt&&(i===mid-1||i===mid+1);
  spawnP({x:o.x,y:o.y,v:DV(11),ang:a,dmg:(pint>=4?1.15:1.6)*(useHome?0.5:1),type:useHome?'homing':'shot',tgt,hom:useHome?.14:0});
 }
 sfx('pshot');
}
function tickMonochromeRay(){
 if(!G.monoRay)return;
 G.monoRay.t++;
 if(G.monoRay.t%6===0){damageBossRaw(9);clearBullets(false);}
 if(G.monoRay.t>200)G.monoRay=null;
}
let _neC=null,_neF=-1;
function _ne(){if(_neF!==G.frame){_neC=(BOSS&&!BOSS.dying&&BOSS.state==='fight'&&BOSS.atk)?BOSS:null;_neF=G.frame;}return _neC;}
function nearestEnemy(){_ne();return _neC;}
const BOSS_HIT_R=26;
function updateOptions(n,spread=true){
 PL.opts.length=n;
 const f=PL.focus;
 for(let i=0;i<n;i++){
  const c=(n-1)/2;
  let tx,ty;
  if(f){const a=PL.optAng+TAU*i/n;tx=PL.x+Math.cos(a)*26;ty=PL.y+Math.sin(a)*26;}
  else{tx=PL.x+(i-c)*17;ty=PL.y+16+(i%2)*6;}
  if(!PL['o'+i])PL['o'+i]={x:tx,y:ty};
  const o=PL['o'+i];o.x=lerp(o.x,tx,f?.4:.18);o.y=lerp(o.y,ty,f?.4:.18);
  PL.opts[i]=o;
 }
 if(f)PL.optAng+=0.04;
}
function activateTrance(){
 if(G.trance>0||G.od<G.odMax)return false;
 G.od=0;G.trance=330;
 for(const it of items)it.fall=true;
 sfx('declare');screenFlash(.32,'#aef');shake(8,3);
 addText(PL.x,PL.y-46,'OVERDRIVE!','#7fdfff',26,70);
 fxRing(PL.x,PL.y,'#8cf',12,150,5,30);
 return true;
}
function playerGrazeCheck(){
 grazeTick++;
 if(PL.inv<=0&&!PL.dead&&BOSS&&!BOSS.dying&&BOSS.state!=='enter'&&dist(PL.x,PL.y,BOSS.x,BOSS.y)<BOSS_HIT_R+4){
  killPlayer();return;
 }
 for(const b of eshots){
  const dx=b.x-PL.x,dy=b.y-PL.y,d2=dx*dx+dy*dy;
  if(!b.grazed&&d2<(GRAZE_R+b.r*.5)*(GRAZE_R+b.r*.5)){
   b.grazed=true;PL.graze++;G.score+=500;
   G.od=Math.min(G.odMax,G.od+(G.trance>0?0:(G.trance<=0&&PL.flash>=PL.flashMax?2:1)));
   activateTrance();
   const MS=[100,250,500,1000,2000];
   for(const m of MS)if(PL.graze===m){addText(W/2,180,'GRAZE '+m+'!','#9cf',22,60);sfx('extend');}
   if(PL.flash<PL.flashMax){PL.flash++;if(PL.flash===PL.flashMax)sfx('spellget');}
   sfx('graze');fxSpark((b.x+PL.x)/2,(b.y+PL.y)/2,'#fff',8);
   fxShard((b.x+PL.x)/2,(b.y+PL.y)/2);fxShard((b.x+PL.x)/2,(b.y+PL.y)/2);
  }
  if(PL.inv<=0&&!PL.dead&&b.hit!==false&&d2<(PLAYER_HIT_R+b.r*.55)*(PLAYER_HIT_R+b.r*.55)){
   killPlayer();break;
  }
 }
 if(PL.inv<=0&&!PL.dead){
  PL.rebirthX=PL.x;PL.rebirthY=PL.y;
 }
 for(const L of elasers){
  if(L.state!==2||!L.lethal)continue;
  const dx=L.x2-L.x1,dy=L.y2-L.y1;const len2=dx*dx+dy*dy;
  let t=((PL.x-L.x1)*dx+(PL.y-L.y1)*dy)/len2;t=clamp(t,0,1);
  const px=L.x1+dx*t,py=L.y1+dy*t;
    if(dist(px,py,PL.x,PL.y)<L.wid/2+PLAYER_HIT_R&&PL.inv<=0&&!PL.dead){killPlayer();}
  }
 }

/* ================= BOSS ================= */
let BOSS=null;
const PLAYER_NAME='Suzuran';
let autoFire=false,showFps=false,fpsFrames=0,fpsTime=0,fpsVal=0,demoIdle=0,Gdemo=false,demoKeyLock=0;
function updateDemoMovement(){
 PL.focus=false;
 let bestX=PL.x,bestY=PL.y,bestScore=-1e9;
 for(let i=0;i<10;i++){
  const a=i/10*TAU,r=i%3===0?0:55;
  let cxp=clamp(PL.x+Math.cos(a)*r,20,W-20),cyp=clamp(PL.y+Math.sin(a)*r,40,H-30);
  let sc=-Math.abs(cxp-W/2)*.3-(cyp<H*.55?300:0);
  for(const e of eshots){
   const dx=e.x-cxp,dy=e.y-cyp;
   const sp2=e.vx*e.vx+e.vy*e.vy;
   const proj=(sp2>0)?(dx*e.vx+dy*e.vy)/Math.sqrt(sp2):0;
   if(proj>0&&proj<90){sc-=800/(proj+10);}
   const d2=dx*dx+dy*dy;if(d2<2500)sc-=1000;
  }
  if(sc>bestScore){bestScore=sc;bestX=cxp;bestY=cyp;}
 }
 PL.x+=(bestX-PL.x)*.18;PL.y+=(bestY-PL.y)*.14;
 PL.tilt=((bestX>PL.x)-(bestX<PL.x))*.2;
}
const BOSS_BANTERS=['So, the intruder finally arrives.','You reek of confidence, little spark.','This sky answers to us, not you.','Heh. Keep up if you can.','Another challenger? How fleeting.'];
const PL_BANTERS=['I was about to say the same.','Talk less. Dodge more.','Then watch closely.','Save the speech for your defeat.'];
function defaultDialog(def){
 return [['b',pick(BOSS_BANTERS)],['p',pick(PL_BANTERS)],['b',`By the rights of this reverie, ${def.name} will not fall.`]];
}
function startBoss(def,onDone){
 BOSS={def,name:def.name,col:def.col,x:W/2,y:-60,tx:W/2,ty:110,idx:-1,state:'enter',t:0,warnT:96,
  timer:0,hp:0,maxHp:0,hpDisp:1,atk:null,gen:null,rate:.07,dying:0,onDone,moveT:0,idleA:rnd(TAU),
  cutin:0,cutinName:'',cutinCol:def.col,spellActive:false,leftInRoute:def.leftInRoute||1,
  dlg:(typeof DIALOGS!=='undefined'&&DIALOGS[def.id])?DIALOGS[def.id]:defaultDialog(def),
  dgi:0,dShown:0,dT:0};
 sfx('bosswalk');
}
function bossNextAttack(){
 BOSS.idx++;
 const list=BOSS.def.atk;
 if(BOSS.idx>=list.length){startBossDeath();return;}
 const A=list[BOSS.idx];
 BOSS.atk=A;BOSS.hp=BOSS.maxHp=Math.round(A.l*DSCAL[DIFF].hp);BOSS.timer=A.t*60;
 BOSS.rate=A.rate!==undefined?A.rate:(A.n?0.03:0.09);
 BOSS.spellActive=!!A.n;
 if(A.n){
  G.spellsPlayed++;BOSS.cutin=110;BOSS.cutinName=A.n;BOSS.cutinCol=A.col||BOSS.col;
  sfx('declare');screenFlash(.35,'#fff');
  startBgm(BOSS.def.bgmSeed+A.idx*97);
 }
 clearBullets(true);
 G.spellBombUsed=false;
 BOSS.gen=A.p(bossCtx(BOSS));
 BOSS.x=W/2;BOSS.y=110;BOSS.moveT=0;
 addText(W/2,200,A.n?('Spell Card — '+A.n):(BOSS.def.name),'#fff',A.n?22:16,70);
}
function startBossDeath(){
 BOSS.dying=1;BOSS.t=0;sfx('bossDie');shake(40,10);
 if(typeof G!=='undefined'&&G)G.freeze=Math.max(G.freeze||0,24);
 for(let i=0;i<40;i++){const a=rnd(TAU),s=rnd(1,6);fx.push({t:'p',x:BOSS.x,y:BOSS.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,c:'#fff',life:irnd(20,50),max:50});}
 for(let i=0;i<10;i++)fx.push({t:'puff',x:BOSS.x+rnd(-30,30),y:BOSS.y+rnd(-24,24),vx:rnd(-.5,.5),vy:rnd(-.8,-.3),sc:rnd(.8,1.4),life:irnd(26,44),max:44});
 for(let i=0;i<4;i++)fxSpr('fx_cannonfire',BOSS.x+rnd(-20,20),BOSS.y+rnd(-16,16),rnd(.35,.7),.9,rnd(-1.2,-.2));
 if(ASSETS.fx_destruction)fx.push({t:'spr',img:'fx_destruction',x:BOSS.x,y:BOSS.y,vx:0,vy:0,sc:2,al:.9,rot:rnd(TAU),life:34,max:34});
 for(let i=0;i<5;i++)fxRing(BOSS.x+rnd(-40,40),BOSS.y+rnd(-40,40),BOSS.col[0],10,160,6,34);
 clearBullets(true);
 itemSpray(BOSS.x,BOSS.y,16,'B');itemSpray(BOSS.x,BOSS.y,8,'P');
 spawnItem('L',BOSS.x,BOSS.y);
 G.score+=100000;
 addText(BOSS.x,BOSS.y-40,'Boss Down!','#ffd700',22,80);
}
function damageBossRaw(d){
 if(!BOSS||BOSS.dying||!BOSS.atk)return;
 if(G.trance>0)d*=1.5;
 const dmg=d*BOSS.rate;
 BOSS.hp-=dmg;G.score+=Math.floor(dmg*10);
 BOSS.hurtT=3;
 hitTick++;if(hitTick%6===0)sfx('bossHit');
 if(BOSS.hp<=0)bossAttackEnd(true);
}
function bossAttackEnd(captured){
 const A=BOSS.atk;
 if(A&&A.n){
  if(captured){
   G.spellsCaptured++;G.streak++;G.bestStreak=Math.max(G.bestStreak,G.streak);
   G.streakMult=Math.min(4,1+(G.streak-1)*.25);
   const bonus=Math.round((500000+PL.lives*10000+PL.graze*100)*G.streakMult);
   G.score+=bonus;
   addText(W/2,240,'Spell Card Capture!'+(G.streak>1?'  ×'+G.streakMult.toFixed(2):''),(A.col||'#fff'),26,90);
   sfx('capture');
   fx.push({t:'bloom',col:(typeof A.col==='string')?A.col:'#fff',life:44,max:44});
   G.spellHist.push(true);
   if(G.spellHist.length>12)G.spellHist.shift();
   spawnItem('S',BOSS.x,BOSS.y);
  }
  else{sfx('timeout');screenFlash(.14,'#666');
   addText(W/2,240,G.spellBombUsed?'Bonus Lost — Bomb Used':'Bonus Failed…',G.spellBombUsed?'#f80':'#888',20,70);
   if(G.spellBombUsed)G.lastBonusLost=true;
   G.streak=0;G.streakMult=1;
   G.spellHist.push(false);
  }
 }
 clearBullets(true);
 BOSS.atk=null;BOSS.gen=null;
 BOSS.state='rest';BOSS.t=0;
 itemSpray(BOSS.x,BOSS.y,6,Math.random()<.5?'P':'B');
}
function parseG(g){
 if(typeof g==='string'){const i=g.indexOf(':');return i<0?{g}:{g:g.slice(0,i),c:g.slice(i+1)};}
 return g;
}
function registerBoss(id,name,col,bgmSeed,bgmTempo,atk){
 BOSS_DEFS[id]={id,name,col,bgmSeed,bgmTempo,atk};
}
function bossCtx(b){
 const aim=(fx,fy)=>Math.atan2(PL.y-(fy!==undefined?fy:b.y),PL.x-(fx!==undefined?fx:b.x))*180/Math.PI;
 return {
  b,x:()=>b.x,y:()=>b.y,px:()=>PL.x,py:()=>PL.y,aim,
  S(o){const pg=parseG(o.g)||{};const rest=Object.assign({},o);delete rest.g;
   if(o.c===undefined)rest.c=pg.c;spawnE(Object.assign(rest,{g:pg.g}));},
  ring(x,y,n,v,a0,g,o={}){n=DN(n);v=DV(v);a0=a0||0;const pg=parseG(g);
   for(let i=0;i<n;i++)spawnE(Object.assign({x,y,v,ang:a0+i*360/n},pg,o));},
  fan(x,y,n,v,c,aimA,g,o={}){n=DN(n);v=DV(v);const base=(aimA===null||aimA===undefined)?aim(x,y):aimA;const pg=parseG(g);
   for(let i=0;i<n;i++){const a=base+(i-(n-1)/2)*(c/Math.max(n-1,1));spawnE(Object.assign({x,y,v,ang:a},pg,o));}},
  arc(x,y,n,v,a0,a1,g,o={}){n=DN(n);v=DV(v);const pg=parseG(g);
   for(let i=0;i<n;i++){const a=a0+(a1-a0)*(n===1?.5:i/(n-1));spawnE(Object.assign({x,y,v,ang:a},pg,o));}},
  *mv(tx,ty,f){f=f||60;const sx=b.x,sy=b.y;
   for(let i=1;i<=f;i++){const t=i/f,w=t*t*(3-2*t);b.x=lerp(sx,tx,w);b.y=lerp(sy,ty,w);yield;}},
 };
}
function bossUpdate(){
 if(!BOSS)return;
 BOSS.t++;
 if(BOSS.warnT>0)BOSS.warnT--;
 if(BOSS.maxHp>0&&BOSS.atk){
  BOSS.hpDisp=BOSS.hpDisp===undefined?1:BOSS.hpDisp+(clamp(BOSS.hp/BOSS.maxHp,0,1)-BOSS.hpDisp)*.08;
 }
 if(BOSS.dying){
  BOSS.t2=(BOSS.t2||0)+1;
  if(BOSS.t2>90){const cb=BOSS.onDone;BOSS=null;cb&&cb();}
  return;
 }
 BOSS.idleA+=.05;
 const bob=Math.sin(BOSS.idleA)*4;
 if(BOSS.state==='enter'){
  BOSS.y=lerp(BOSS.y,110,.05);BOSS.x=lerp(BOSS.x,W/2,.05);
  if(BOSS.t>80){
   if(BOSS.dlg&&BOSS.dlg.length){BOSS.state='dialog';BOSS.dT=0;BOSS.dShown=0;}
   else{BOSS.state='fight';bossNextAttack();}
  }
 }else if(BOSS.state==='dialog'){
  const line=BOSS.dlg[BOSS.dgi];
  BOSS.dT++;
  if(BOSS.dT%2===0)BOSS.dShown=Math.min(line[1].length,BOSS.dShown+1);
  const full=BOSS.dShown>=line[1].length;
  let advance=false;
  if(hitK(KEY.Z)){if(full)advance=true;else BOSS.dShown=line[1].length;}
  else if(BOSS.dT>190)advance=true;
  if(advance){
   BOSS.dgi++;BOSS.dShown=0;BOSS.dT=0;
   if(BOSS.dgi>=BOSS.dlg.length){BOSS.state='fight';bossNextAttack();}
  }
 }else if(BOSS.state==='rest'){
  if(BOSS.t>50){BOSS.state='fight';bossNextAttack();}
 }else if(BOSS.state==='fight'){
  if(BOSS.timer>0){BOSS.timer--;if(BOSS.timer===0)bossAttackEnd(false);}
  if(BOSS.spellActive&&BOSS.t%170===60&&items.length<200)
   spawnItem('K',rnd(50,W-50),-14,rnd(-.6,.6));
  if(BOSS.hurtT>0)BOSS.hurtT--;
  if(BOSS.timer>0&&BOSS.timer<=300&&BOSS.timer%60===0)sfx('warn');
  if(BOSS.gen){
   const g=BOSS.gen;
   try{
    const r=g.next();
    if(r.done)BOSS.gen=BOSS.atk?BOSS.atk.p(bossCtx(BOSS)):null;
   }catch(e){console.error(e);BOSS.gen=null;}
  }
  if(BOSS.hp<=0&&BOSS.atk)bossAttackEnd(true);
 }
}
function drawBoss(){
 if(!BOSS)return;
 const b=BOSS,bob=Math.sin(b.idleA)*4;
 cx.save();
 if(b.dying){cx.globalAlpha=Math.max(0,1-b.t2/60);}
 const x=b.x,y=b.y+bob;
 const pul=1+Math.sin(performance.now()/200)*.06;
 cx.translate(x,y);
 cx.globalAlpha*= .9;
 cx.strokeStyle=b.col[0];cx.lineWidth=2;
 for(let k=0;k<3;k++){cx.save();cx.rotate(performance.now()/(1400+k*700)*(k%2?-1:1));
  cx.beginPath();for(let i=0;i<=6;i++){const a=i/6*TAU;const r=(34+k*9)*pul;cx[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);}cx.stroke();cx.restore();}
 const grd=cx.createRadialGradient(0,0,4,0,0,30);
 grd.addColorStop(0,'#fff');grd.addColorStop(.4,b.col[0]);grd.addColorStop(1,'rgba(0,0,0,0)');
 cx.fillStyle=grd;cx.beginPath();cx.arc(0,0,30,0,TAU);cx.fill();
 if(b.hurtT>0){
  cx.save();cx.globalCompositeOperation='lighter';
  const hg=tinted('gen_glow',b.col[0]);
  const hp2=b.hurtT/3;
  if(hg){cx.globalAlpha=.22*hp2;cx.drawImage(hg,-40,-40,80,80);}
  cx.globalCompositeOperation='source-over';
  cx.strokeStyle=`rgba(255,255,255,${.5*hp2})`;cx.lineWidth=1.5;
  cx.beginPath();cx.arc(0,0,28+2*(3-b.hurtT),0,TAU);cx.stroke();
  cx.restore();
 }
 if(G.frame%5===0&&fx.length<300&&b.state==='fight'){
  const aa=rnd(TAU);
  fx.push({t:'trail',x:x+Math.cos(aa)*34,y:y+Math.sin(aa)*34,c:b.col[0],life:14,max:14});
 }
 cx.fillStyle='rgba(255,255,255,.92)';cx.font='bold 22px monospace';cx.textAlign='center';cx.textBaseline='middle';
 cx.fillText(b.name[0],0,1);
 cx.restore();
 if(b.spellActive&&b.state==='fight'){
  drawMagicCircleFloor(x,y);
 }
}

/* ================= LASERS (enemy) ================= */
function laserUpdate(){
 for(let i=elasers.length-1;i>=0;i--){const L=elasers[i];L.t++;
  if(L.state===0){if(L.t>L.warm){L.state=1;L.t=0;sfx('laser');}}
  else if(L.state===1){
   if(L.t>8){
    L.state=2;L.t=0;
    L.x2=L.x1+Math.cos(L.ang*Math.PI/180)*L.len;
    L.y2=L.y1+Math.sin(L.ang*Math.PI/180)*L.len;
    if(isFinite(L.x2)&&isFinite(L.y2)){
     const g=cx.createLinearGradient(L.x1,L.y1,L.x2,L.y2);
     g.addColorStop(0,'#fff');g.addColorStop(1,L.col||'#f66');
     L.grad=g;
    }else{L.grad=null;}
   }
  }
  else if(L.state===2){if(L.t>L.dur){elasers.splice(i,1);}}
 }
}
function spawnLaser(o){
 const L=Object.assign({state:0,t:0,warm:40,dur:50,lethal:true,wid:16,col:'#f66'},o);
 L.x1=isFinite(L.x)?L.x:W/2;L.y1=isFinite(L.y)?L.y:-10;
 elasers.push(L);
}

/* ================= DRAW ================= */
function drawBullet(b){
 const c=COL[b.c]||COL.white;
 const grow=Math.min(1,.35+b.t*.16);
 const angD=Math.atan2(b.vy,b.vx)*180/Math.PI;
 const fam=b.g==='ball'?(b.c==='black'&&ASSETS.th_shadowbullet?'shadow':(thImg('ball',b.c)?'ball':null)):b.g==='rice'?(thImg('rice',b.c)?'rice':null):b.g==='kunai'?(thImg('ah',b.c)?'ah':null):b.g==='orb'?((ASSETS['orb_'+TH_COLOR[b.c]])?'orb':null):null;
 if(fam){
  const img=fam==='shadow'?ASSETS.th_shadowbullet:(fam==='orb'?ASSETS['orb_'+TH_COLOR[b.c]]:thImg(fam,b.c));
  const r=(b.r||5)*grow*1.25;
   const halo=tinted('gen_glow',fam==='shadow'?'#606070':c[0]);
   cx.save();cx.translate(b.x,b.y);
  if(halo){cx.globalAlpha=(b.alpha??1)*(fam==='shadow'?.3:.5);cx.drawImage(halo,-r*2,-r*2,r*4,r*4);}
  cx.globalAlpha=(b.alpha??1);
  if(fam==='ball'||fam==='orb'){
   cx.drawImage(img,-r*1.3,-r*1.3,r*2.6,r*2.6);
   if(fam==='ball'){cx.globalCompositeOperation='lighter';cx.fillStyle='#fff';
    cx.beginPath();cx.arc(-r*.15,-r*.15,r*.42,0,TAU);cx.fill();}
  }else{
   cx.rotate((Math.atan2(b.vy,b.vx)+Math.PI/2));
   cx.drawImage(img,-r*1.15,-r*1.7,r*2.3,r*3.4);
  }
  cx.restore();
  return;
 }
 if(b.g==='bubble'){
  const size=b.r*grow*1.15;
  const halo=tinted('gen_glow',c[0]);
  cx.save();cx.translate(b.x,b.y);
  if(halo){cx.globalCompositeOperation='lighter';
   cx.globalAlpha=(b.alpha??1)*.3;cx.drawImage(halo,-size*1.6,-size*1.6,size*3.2,size*3.2);
   cx.globalCompositeOperation='source-over';}
  cx.globalAlpha=(b.alpha??1)*.26;
  cx.fillStyle=c[0];cx.beginPath();cx.arc(0,0,size,0,TAU);cx.fill();
  cx.globalAlpha=b.alpha??1;
  cx.strokeStyle=c[1];cx.lineWidth=2;
  cx.beginPath();cx.arc(0,0,size,0,TAU);cx.stroke();
  cx.strokeStyle='rgba(255,255,255,.5)';cx.lineWidth=1;
  cx.beginPath();cx.arc(0,0,size*.7,0,TAU);cx.stroke();
  cx.fillStyle='rgba(255,255,255,.85)';
  cx.beginPath();cx.arc(-size*.32,-size*.34,size*.17,0,TAU);cx.fill();
  cx.restore();
  return;
 }
 if(b.g==='crystal'&&ASSETS['th_jellybean'+(TH_COLOR[b.c]||'')]){
  const img=ASSETS['th_jellybean'+TH_COLOR[b.c]];
  const r=(b.r||5)*grow;
  cx.save();cx.translate(b.x,b.y);cx.rotate((Math.atan2(b.vy,b.vx)+Math.PI/2));
  cx.drawImage(img,-r*1.2,-r*1.5,r*2.4,r*3);
  cx.restore();
  return;
 }
 if(b.g==='flower'){
  const r=(b.r||6)*grow*1.3;
  const fl=tinted('th_sunflower',c[0])||tinted('th_purpleflower',c[0]);
  cx.save();cx.translate(b.x,b.y);cx.rotate(Math.atan2(b.vy,b.vx)+performance.now()/900);
  if(fl){cx.globalAlpha=(b.alpha??1)*.95;cx.drawImage(fl,-r*1.2,-r*1.2,r*2.4,r*2.4);}
  cx.globalCompositeOperation='lighter';cx.fillStyle='#fff';cx.beginPath();cx.arc(0,0,r*.28,0,TAU);cx.fill();
  cx.restore();
  return;
 }
 if(b.g==='feather'&&ASSETS.th_feather){
  const r=(b.r||4)*grow;
  cx.save();cx.translate(b.x,b.y);cx.rotate(Math.atan2(b.vy,b.vx)+Math.PI/4);
  cx.globalAlpha=(b.alpha??1)*.9;
  cx.drawImage(ASSETS.th_feather,-r*1.1,-r*2.2,r*2.2,r*4.4);
  cx.restore();
  return;
 }
 if((b.g==='ball'||b.g==='orb'||b.g==='star'||b.g==='crystal')&&ASSETS.gen_glow&&ASSETS.gen_disc){
  const r=(b.r||5)*grow*1.15;
  const halo=tinted('gen_glow',c[0]);
  const disc=tinted('gen_disc',c[0]);
  if(halo&&disc){
   cx.save();cx.translate(b.x,b.y);
   cx.globalAlpha=(b.alpha??1)*.55;
   cx.drawImage(halo,-r*2.6,-r*2.6,r*5.2,r*5.2);
   cx.globalAlpha=(b.alpha??1);
   cx.drawImage(disc,-r*1.35,-r*1.35,r*2.7,r*2.7);
   cx.globalCompositeOperation='lighter';
   cx.fillStyle='#fff';
   cx.beginPath();cx.arc(-r*.18,-r*.18,r*(b.g==='orb'?.62:.42),0,TAU);cx.fill();
   if(b.g==='star'){
    const stImg=tinted('th_staryellow',c[0])||disc;
    const rot=(Math.atan2(b.vy,b.vx)+performance.now()/600);
    cx.rotate(rot);cx.globalAlpha=(b.alpha??1)*.9;
    cx.drawImage(stImg,-r*.95,-r*.95,r*1.9,r*1.9);
   }else if(b.g==='crystal'){
    const tw=tinted('twirl_01',c[1]||'#fff');
    cx.rotate(performance.now()/600);cx.globalAlpha=(b.alpha??1)*.85;
    if(tw)cx.drawImage(tw,-r*1.05,-r*1.05,r*2.1,r*2.1);
   }
   cx.restore();
   return;
  }
 }
 if((b.g==='rice'||b.g==='kunai')&&ASSETS.trace_02){
  const r=(b.r||4)*grow;
  const img=b.g==='kunai'?tinted('trace_06',c[0]):tinted('trace_02',c[0]);
  const glow=tinted('gen_glow',c[0]);
  if(img){
   const aD=Math.atan2(b.vy,b.vx)*180/Math.PI+90;
   cx.save();cx.translate(b.x,b.y);cx.rotate(aD*Math.PI/180);
   if(glow){cx.globalAlpha=(b.alpha??1)*.45;cx.drawImage(glow,-r*2.2,-r*2.2,r*4.4,r*4.4);}
   cx.globalAlpha=(b.alpha??1);
   cx.drawImage(img,-r*1.1,-r*2.6,r*2.2,r*5.2);
   cx.restore();
   return;
  }
 }
 if(b.g==='amulet'&&(ASSETS.seal_red||ASSETS.seal_blue||ASSETS.seal_green)){
  const r=(b.r||5)*grow;
  const sym=c==='red'||c==='pink'||c==='orange'?ASSETS.seal_red:(c==='blue'||c==='dblue'||c==='teal'||c==='cyan'?ASSETS.seal_blue:ASSETS.seal_green);
  const glow=tinted('gen_glow',c[0]);
  if(sym){
   cx.save();cx.translate(b.x,b.y);cx.rotate(angD*Math.PI/180+Math.PI/2);
   if(glow){cx.globalAlpha=(b.alpha??1)*.4;cx.drawImage(glow,-r*2,-r*2,r*4,r*4);}
   cx.globalAlpha=(b.alpha??1);
   cx.drawImage(sym,-r*1.3,-r*1.3,r*2.6,r*2.6);
   cx.restore();
   return;
  }
 }
 cx.save();cx.translate(b.x,b.y);
 if(b.alpha<1)cx.globalAlpha=b.alpha;
 switch(b.g){
  case 'rice':cx.rotate(angD*Math.PI/180);
   glowEllipse(0,0,8,3,c);break;
  case 'kunai':cx.rotate(angD*Math.PI/180);
   cx.fillStyle=c[0];cx.beginPath();cx.moveTo(9,0);cx.lineTo(-3,3.4);cx.lineTo(-7,0);cx.lineTo(-3,-3.4);cx.closePath();cx.fill();
   cx.strokeStyle=c[1];cx.lineWidth=1;cx.stroke();break;
  case 'bubble':{const r=b.r||14;
   cx.fillStyle=c[0]+'44';cx.beginPath();cx.arc(0,0,r,0,TAU);cx.fill();
   cx.strokeStyle=c[1];cx.lineWidth=2.5;cx.beginPath();cx.arc(0,0,r,0,TAU);cx.stroke();
   cx.fillStyle='#ffffffaa';cx.beginPath();cx.arc(-r*.3,-r*.3,r*.22,0,TAU);cx.fill();break;}
  case 'star':cx.rotate(b.spin+=.06);drawStar(0,0,b.r||7,5,c);break;
  case 'crystal':cx.rotate(angD*Math.PI/180);cx.fillStyle=c[0];
   cx.beginPath();cx.moveTo(b.r||6,0);cx.lineTo(0,(b.r||6)*.6);cx.lineTo(-(b.r||6),0);cx.lineTo(0,-(b.r||6)*.6);cx.closePath();cx.fill();
   cx.strokeStyle=c[1];cx.lineWidth=1;cx.stroke();break;
  case 'orb':{const r=b.r||12;const g=cx.createRadialGradient(0,0,1,0,0,r);
   g.addColorStop(0,'#fff');g.addColorStop(.35,c[0]);g.addColorStop(1,'rgba(0,0,0,0)');
   cx.fillStyle=g;cx.beginPath();cx.arc(0,0,r,0,TAU);cx.fill();
   cx.strokeStyle=c[1];cx.lineWidth=2;cx.beginPath();cx.arc(0,0,r*.62,0,TAU);cx.stroke();break;}
  case 'amulet':{const r=b.r||5;cx.rotate(angD*Math.PI/180);
   cx.fillStyle=c[0];cx.fillRect(-r,-r*1.6,r*2,r*3.2);
   cx.strokeStyle=c[1];cx.lineWidth=1.4;cx.strokeRect(-r,-r*1.6,r*2,r*3.2);break;}
  default:{const r=(b.r||5)*grow;const ga=cx.globalAlpha;
   cx.globalAlpha=ga*.28;cx.fillStyle=c[0];
   cx.beginPath();cx.arc(0,0,r*1.6,0,TAU);cx.fill();
   cx.globalAlpha=ga;cx.fillStyle=c[0];
   cx.beginPath();cx.arc(0,0,r,0,TAU);cx.fill();
   cx.strokeStyle=c[1];cx.lineWidth=1.5;
   cx.beginPath();cx.arc(0,0,r,0,TAU);cx.stroke();}
 }
   cx.restore();
}
function glowEllipse(x,y,rx,ry,c){cx.fillStyle=c[0];cx.beginPath();cx.ellipse(x,y,rx,ry,0,0,TAU);cx.fill();cx.strokeStyle=c[1];cx.lineWidth=1;cx.stroke();}
function drawStar(x,y,r,n,c){cx.fillStyle=c[0];cx.beginPath();for(let i=0;i<n*2;i++){const rr=i%2?r*.45:r;const a=i/(n*2)*TAU-Math.PI/2;cx[i?'lineTo':'moveTo'](x+Math.cos(a)*rr,y+Math.sin(a)*rr);}cx.closePath();cx.fill();cx.strokeStyle=c[1];cx.lineWidth=1;cx.stroke();}
function drawMagicCircleFloor(x,y){
 const t=performance.now();
 const spellBg=ASSETS[BOSS&&BOSS.def?BOSS.def.spellBg:'spellbg_s1'];
 if(spellBg){
  cx.save();
  cx.globalAlpha=.34+.06*(G.beat||0);
  cx.drawImage(spellBg,0,0,W,H);
  cx.fillStyle='rgba(5,5,14,.42)';
  cx.fillRect(0,0,W,H);
  cx.restore();
 }
 const wave=tinted('gen_seigaiha',BOSS?BOSS.col[0]:'#8cf');
 if(wave){
  const tw=128,tOff=(t/40)%tw;
  cx.save();cx.globalCompositeOperation='lighter';
  cx.globalAlpha=.05+.04*(G.beat||0);
  for(let ty=-1;ty<4;ty++)for(let tx=-1;tx<6;tx++)
   cx.drawImage(wave,tx*tw+tOff*2-64,ty*tw+((t/60)%tw)-64,tw,tw);
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
 }
 const ring=tinted('gen_ring',BOSS?BOSS.col[0]:'#8cf');
 if(ring){
  cx.globalCompositeOperation='lighter';
  cx.globalAlpha=.22+.1*(G.beat||0);
  const rr=150+18*Math.sin(t/700);
  cx.drawImage(ring,-rr,-rr,rr*2,rr*2);
  cx.globalAlpha=.16;
  cx.drawImage(tinted('gen_disc','#ffffff'),-96,-96,192,192);
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
 }
 cx.globalCompositeOperation='lighter';
 cx.strokeStyle='rgba(255,255,255,.14)';
 for(let ring=0;ring<3;ring++){
  const r=70+ring*38,dir=ring%2?-1:1;
  cx.save();cx.rotate(t/2600*dir+ring);
  cx.lineWidth=2;cx.beginPath();cx.arc(0,0,r,0,TAU);cx.stroke();
  cx.setLineDash([10,14]);cx.lineWidth=1;
  cx.beginPath();cx.arc(0,0,r-8,t/900,r/700+t);cx.stroke();
  cx.setLineDash([]);
  const n=6;
  cx.beginPath();
  for(let i=0;i<=n;i++){const a=i/n*TAU;cx[i?'lineTo':'moveTo'](Math.cos(a)*(r-22),Math.sin(a)*(r-22));}
  cx.stroke();
  cx.restore();
 }
 for(let p=0;p<6;p++){
  const a=t/1800+p*TAU/6;
  cx.fillStyle='rgba(255,255,255,.05)';
  cx.beginPath();cx.arc(Math.cos(a)*104,Math.sin(a)*104,7,0,TAU);cx.fill();
 }
 cx.restore();
}
function drawPlayer(){
 if(PL.dead)return;
 const blink=PL.inv>0&&Math.floor(PL.inv/3)%2===0;
 if(PL.shooting&&G.frame%2===0){
  for(const o of PL.opts)if(o&&fx.length<300)
   fx.push({t:'trail',x:o.x+rnd(-2,2),y:o.y+rnd(-1,3),c:'#9cf',life:9,max:9});
 }
 if(G.frame%5===0&&fx.length<280)fxSpr('gen_glow',PL.x+rnd(-3,3),PL.y+14,.22,.35,-.15);
 cx.save();cx.translate(PL.x,PL.y);
 cx.rotate((PL.tilt||0)*.28);
 if(G.trance>0){
  cx.save();cx.globalCompositeOperation='lighter';
  const ta=.35+.2*Math.sin(G.frame/3);
  cx.strokeStyle=`rgba(120,200,255,${ta})`;cx.lineWidth=2;
  cx.beginPath();cx.arc(0,0,20+3*Math.sin(G.frame/4),0,TAU);cx.stroke();
  cx.beginPath();cx.arc(0,0,27+5*Math.sin(G.frame/5+2),0,TAU);cx.stroke();
  cx.restore();
 }
 if(blink)cx.globalAlpha=.4;
 for(const o of PL.opts){
  if(!o)continue;
  cx.save();cx.translate(o.x-PL.x,o.y-PL.y);
  const t=performance.now();
  cx.globalCompositeOperation='lighter';
  const halo=tinted('gen_glow','#7fdfff');
  if(halo){cx.globalAlpha=.85;cx.drawImage(halo,-14,-14,28,28);}
  cx.globalAlpha=1;
  cx.fillStyle='#eef6ff';
  cx.beginPath();cx.arc(0,0,4.6+0.6*Math.sin(t/180),0,TAU);cx.fill();
  cx.strokeStyle='rgba(140,210,255,.85)';cx.lineWidth=1.6;
  cx.beginPath();cx.arc(0,0,8.5,t/300,t/300+4.6);cx.stroke();
  cx.globalCompositeOperation='source-over';
  cx.restore();
 }
 cx.rotate((PL.face||1)>0?0:0);
 cx.fillStyle='#22242e';
 cx.beginPath();cx.moveTo(0,-16);cx.lineTo(11,10);cx.lineTo(0,5);cx.lineTo(-11,10);cx.closePath();cx.fill();
 cx.strokeStyle='#aabbee';cx.lineWidth=1.6;cx.stroke();
 cx.fillStyle='#eef4ff';cx.beginPath();cx.moveTo(0,-13);cx.lineTo(6,7);cx.lineTo(0,3);cx.lineTo(-6,7);cx.closePath();cx.fill();
 cx.fillStyle='#5af';cx.beginPath();cx.arc(0,-4,2.4,0,TAU);cx.fill();
 cx.restore();
 if(PL.focus){
  cx.save();cx.translate(PL.x,PL.y);cx.rotate(performance.now()/500);
  cx.strokeStyle='rgba(255,255,255,.9)';cx.lineWidth=1.4;
  cx.beginPath();for(let i=0;i<=4;i++){const a=i/4*TAU;cx[i?'lineTo':'moveTo'](Math.cos(a)*5,Math.sin(a)*5);}cx.stroke();
  cx.strokeStyle='rgba(120,200,255,.7)';
  cx.beginPath();cx.arc(0,0,9,0,TAU);cx.stroke();cx.restore();
 }
}
function drawEntities(){
 for(const L of elasers){
  if(L.state===0){const p=L.t/L.warm;
   cx.save();cx.globalAlpha=.25+p*.35;cx.strokeStyle=L.col||'#f66';cx.lineWidth=2;
   cx.beginPath();cx.moveTo(L.x,L.y);cx.lineTo(L.x+Math.cos(L.ang*Math.PI/180)*L.len,L.y+Math.sin(L.ang*Math.PI/180)*L.len);cx.stroke();cx.restore();}
  else if(L.state===1){cx.save();cx.globalAlpha=.7;cx.strokeStyle='#fff';cx.lineWidth=L.wid*L.t/8;
   cx.beginPath();cx.moveTo(L.x,L.y);cx.lineTo(L.x+Math.cos(L.ang*Math.PI/180)*L.len,L.y+Math.sin(L.ang*Math.PI/180)*L.len);cx.stroke();cx.restore();}
  else{const fade=L.t>L.dur-10?(L.dur-L.t)/10:1;
   cx.save();cx.globalAlpha=fade;const w=L.wid*(L.t<6?L.t/6:1);
   if(L.grad){cx.strokeStyle=L.grad;}
   else{cx.strokeStyle=L.col||'#f66';}
   cx.lineWidth=w;cx.lineCap='round';
   cx.beginPath();cx.moveTo(L.x1,L.y1);cx.lineTo(L.x2!==undefined?L.x2:L.x1,L.y2!==undefined?L.y2:L.y1);cx.stroke();
   if(isFinite(L.x2)){
    cx.strokeStyle='#fff';cx.lineWidth=Math.max(2,w*.3);cx.stroke();
   }
   cx.restore();cx.lineCap='butt';}
 }
 for(const b of eshots){
  if(b.x<-30||b.x>W+30||b.y<-30||b.y>H+30)continue;
  drawBullet(b);
 }
 for(const b of pshots){
  cx.save();cx.translate(b.x,b.y);
  const aD=Math.atan2(b.vy,b.vx);
  cx.rotate(aD+Math.PI/2);
  if(b.type==='homing'){
   cx.globalCompositeOperation='lighter';
   cx.fillStyle='rgba(140,220,255,.4)';
   cx.fillRect(-3,-2,6,12);
   cx.fillStyle='#dff6ff';
   cx.beginPath();cx.moveTo(0,-7);cx.lineTo(3.2,2);cx.lineTo(0,5);cx.lineTo(-3.2,2);cx.closePath();cx.fill();
   cx.globalCompositeOperation='source-over';
   cx.strokeStyle='rgba(120,200,255,.8)';cx.lineWidth=1;
   cx.beginPath();cx.moveTo(0,-7);cx.lineTo(0,5);cx.stroke();
  }else{
   cx.globalCompositeOperation='lighter';
   cx.strokeStyle='rgba(130,200,255,.45)';cx.lineWidth=4.5;cx.lineCap='round';
   cx.beginPath();cx.moveTo(0,-9);cx.lineTo(0,7);cx.stroke();
   cx.strokeStyle='#eef6ff';cx.lineWidth=2;cx.lineCap='round';
   cx.beginPath();cx.moveTo(0,-9);cx.lineTo(0,7);cx.stroke();
   cx.lineCap='butt';cx.globalCompositeOperation='source-over';
  }
  cx.restore();
 }
 cx.fillStyle='#fff';cx.font='bold 8px monospace';cx.textAlign='center';cx.textBaseline='middle';
 for(const it of items){
  if(it.x<-14||it.x>W+14||it.y<-16||it.y>H+16)continue;
  cx.save();cx.translate(it.x,it.y);
  if(it.ground&&it.life<120&&Math.floor(G.frame/5)%2===0)cx.globalAlpha=.35;
  const spr={P:'item_P',B:'item_B',L:'item_L',S:'item_S'}[it.t];
  if(ASSETS[spr]){
   const s=15+2*Math.sin(G.frame/9);
   cx.drawImage(ASSETS[spr],-s/2,-s/2,s,s);
  }else{
   const c=IT[it.t];cx.fillStyle=c;
   if(it.t==='P'||it.t==='L'){cx.beginPath();cx.moveTo(0,-7);cx.lineTo(6,0);cx.lineTo(0,7);cx.lineTo(-6,0);cx.closePath();cx.fill();}
   else cx.fillRect(-5,-5,10,10);
  }
  cx.fillStyle='#fff';cx.strokeStyle='rgba(0,0,0,.75)';cx.lineWidth=2;
  cx.font='bold 8px monospace';cx.textAlign='center';cx.textBaseline='middle';
  cx.strokeText(it.t,0,.5);cx.fillText(it.t,0,.5);
  cx.restore();
 }
 drawPlayer();
 for(const f of fx)drawFx(f);
 for(const t of ftext){
  cx.save();cx.globalAlpha=clamp(t.life/t.max*1.6,0,1);cx.fillStyle=t.c;
  cx.font=`bold ${t.sz}px monospace`;cx.textAlign='center';
  cx.fillText(t.s,t.x,t.y);cx.restore();
 }
}
function drawFx(f){
 const p=f.life/f.max;
 cx.save();
 if(f.t==='ring'){cx.globalAlpha=p;cx.strokeStyle=f.c;cx.lineWidth=f.w*p+1;
  cx.beginPath();cx.arc(f.x,f.y,lerp(f.r1,f.r0,p),0,TAU);cx.stroke();}
 else if(f.t==='p'){cx.globalAlpha=p;cx.fillStyle=f.c;cx.fillRect(f.x-2,f.y-2,4,4);f.x+=f.vx;f.y+=f.vy;f.vx*=.94;f.vy*=.94;}
 else if(f.t==='spark'){cx.globalAlpha=p;cx.fillStyle=f.c;cx.beginPath();cx.arc(f.x,f.y,3+6*(1-p),0,TAU);cx.fill();}
 else if(f.t==='shard'){f.x+=f.vx;f.y+=f.vy;cx.globalAlpha=p;cx.strokeStyle='#9cf';cx.lineWidth=1.6;
  cx.beginPath();cx.moveTo(f.x,f.y);cx.lineTo(f.x+Math.cos(f.ang)*7,f.y+Math.sin(f.ang)*7);cx.stroke();}
 else if(f.t==='trail'){cx.globalAlpha=p*.5;cx.fillStyle=f.c||'#8af';cx.beginPath();cx.arc(f.x,f.y,2.4*(p)+0.6,0,TAU);cx.fill();}
 else if(f.t==='puff'){
  f.x+=f.vx;f.y+=f.vy;
  cx.globalAlpha=p*.4;cx.fillStyle='#c8ccd8';
  cx.beginPath();cx.arc(f.x,f.y,(1-p)*26*f.sc+6,0,TAU);cx.fill();
  cx.globalAlpha=p*.25;cx.fillStyle='#fff';
  cx.beginPath();cx.arc(f.x-f.sc*3,f.y-f.sc*2,(1-p)*14*f.sc+3,0,TAU);cx.fill();}
 else if(f.t==='crescent'){
  cx.save();cx.translate(f.x,f.y);cx.rotate(f.ang);
  cx.globalCompositeOperation='lighter';
  cx.globalAlpha=p;
  const R=70*f.scale;
  cx.strokeStyle='#fff';cx.lineWidth=10*f.scale*p+2;
  cx.beginPath();cx.arc(0,0,R,-.55,.55);cx.stroke();
  cx.strokeStyle='#9cf';cx.lineWidth=4*f.scale*p+1;
  cx.beginPath();cx.arc(0,0,R*.86,-.5,.5);cx.stroke();
  cx.globalCompositeOperation='source-over';
  cx.restore();}
 else if(f.t==='spr'){
  const img=ASSETS[f.img];
  if(img){
   f.x+=f.vx;f.y+=f.vy;
   cx.globalCompositeOperation='lighter';
   cx.save();cx.translate(f.x,f.y);cx.rotate(f.rot||0);
   const sc=f.sc*(1.7-p*.7);
   cx.globalAlpha=p*(f.al||0.85);
   cx.drawImage(img,-32*sc,-32*sc,64*sc,64*sc);
   cx.restore();
   cx.globalCompositeOperation='source-over';
  }
 }
 else if(f.t==='cross'){
  const gr=1-p;cx.globalCompositeOperation='lighter';
  cx.globalAlpha=p;cx.fillStyle='#fff';
  cx.fillRect(f.x-14*gr*8,f.y-3,W,6*gr+2);
  cx.save();cx.translate(f.x,f.y);cx.rotate(Math.PI/2);cx.fillRect(-14*gr*8,-3,W,6*gr+2);cx.restore();
  cx.globalCompositeOperation='source-over';}
 else if(f.t==='monochrome'){
  const mx=PL.dead?PL.rebirthX||f.x:PL.x,my=PL.dead?PL.rebirthY||f.y:PL.y;
  cx.globalCompositeOperation='lighter';cx.globalAlpha=.5*p+.2;
  cx.strokeStyle='#fff';cx.lineWidth=3;
  cx.beginPath();cx.moveTo(mx,my);cx.lineTo(mx,-H);cx.stroke();
  cx.globalAlpha=p*.4;cx.fillStyle='#fff';
  cx.beginPath();cx.arc(mx,my,(1-p)*300+40,0,TAU);cx.fill();
  cx.globalCompositeOperation='source-over';}
 else if(f.t==='beam'){
  cx.globalCompositeOperation='lighter';cx.globalAlpha=p*(f.hit?.9:.4);
  cx.fillStyle=f.hit?'#bff6ff':'#9ac';
  cx.fillRect(f.x-f.w/2,0,f.w,f.y);
  cx.fillStyle='#fff';cx.fillRect(f.x-f.w/6,0,f.w/3,f.y);
  cx.globalCompositeOperation='source-over';}
 else if(f.t==='focusring'){cx.globalAlpha=p*.5;cx.strokeStyle='#9df';cx.lineWidth=2;
  cx.beginPath();cx.arc(f.x,f.y,(1-p)*46+8,0,TAU);cx.stroke();}
 else if(f.t==='bloom'){
  cx.globalCompositeOperation='lighter';cx.globalAlpha=p*.5;
  const g=cx.createRadialGradient(W/2,H/2,0,W/2,H/2,H*.7);
  g.addColorStop(0,f.col);g.addColorStop(1,'rgba(0,0,0,0)');
  cx.fillStyle=g;cx.fillRect(0,0,W,H);
  cx.globalCompositeOperation='source-over';}
 cx.restore();
}
