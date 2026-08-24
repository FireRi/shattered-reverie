"use strict";
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

