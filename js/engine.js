"use strict";
const W=640,H=480,TAU=Math.PI*2;
const cv=document.getElementById('cv'),cx=cv.getContext('2d');
const SimRng={
 mode:'live',log:[],idx:0,state:1,starved:0,
 beginRecord(){this.mode='record';this.log=[];this.idx=0;this.starved=0;},
 beginPlayback(log){this.mode='playback';this.log=log||[];this.idx=0;this.starved=0;},
 beginSeed(seed){this.mode='seeded';this.state=(seed|0)||1;this.idx=0;this.starved=0;},
 end(){this.mode='live';this.log=[];this.idx=0;},
 nextSeed(){
  let t=this.state+=0x6D2B79F5;
  t=Math.imul(t^t>>>15,t|1);
  t^=t+Math.imul(t^t>>>7,t|61);
  return ((t^t>>>14)>>>0)/4294967296;
 },
 value(){
  if(this.mode==='playback'){
   if(this.idx<this.log.length)return this.log[this.idx++];
   this.starved++;return .5;
  }
  const v=this.mode==='seeded'?this.nextSeed():Math.random();
  if(this.mode==='record')this.log.push(v);
  return v;
 }
};
const rnd=(a=1,b)=>b===undefined?SimRng.value()*a:a+SimRng.value()*(b-a);
const irnd=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(SimRng.value()*a.length)];
/* Visual-only randomness: never use vrnd/virnd/vpick in simulation code. */
const vrnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const virnd=(a,b)=>Math.floor(vrnd(a,b+1));
const vpick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const dist=(x,y,X,Y)=>Math.hypot(X-x,Y-y);
const angTo=(x,y)=>{const p=targetPlayer();return Math.atan2(p.y-y,p.x-x);};


const KEY={LEFT:37,RIGHT:39,UP:38,DOWN:40,SHIFT:16,Z:90,X:88,C:67,ESC:27,M:77,ENTER:13,R:82,
 S:83,H:72,V:86,A:65,F:70,O:79,TWO:50,MINUS:189,PLUS:187,COMMA:188,PERIOD:190,
 NUMPAD_MINUS:109,NUMPAD_PLUS:107,FF_MINUS:173,EQUALS:61};
const PLAYER_HIT_R=2.6;
const GRAZE_R=14;
const OPTION_TURN_RATE=7;
const IS_TOUCH=(typeof navigator!=='undefined'&&navigator.maxTouchPoints>0)||(typeof window!=='undefined'&&'ontouchstart' in window);
const TouchUI={
 zones:[],focus:false,
 stick:{active:false,ax:0,ay:0,kx:0,ky:0,dir:null,next:0},
 reset(){this.zones.length=0;},
 add(x,y,w,h,fn,label){this.zones.push({x,y,w,h,fn,label:label||''});},
 hit(x,y){
  for(let i=this.zones.length-1;i>=0;i--){
   const z=this.zones[i];
   if(x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h){z.fn();return true;}
  }
  return false;
 },
 resetStick(){
  const s=this.stick;
  s.active=false;s.ax=0;s.ay=0;s.kx=0;s.ky=0;s.dir=null;s.next=0;
 },
 setStickDelta(dx,dy,r){
  const s=this.stick,len=Math.hypot(dx,dy);
  if(!len||!r){s.ax=0;s.ay=0;s.kx=0;s.ky=0;return;}
  const mag=Math.min(1,len/r),adj=mag<=.22?0:Math.min(1,(mag-.22)/.78);
  const nx=dx/len,ny=dy/len,kd=Math.min(len,r)*.55;
  s.ax=nx*adj;s.ay=ny*adj;s.kx=nx*kd;s.ky=ny*kd;
 },
 fireDown(){keys[KEY.Z]=true;edge[KEY.Z]=true;},
 fireUp(){keys[KEY.Z]=false;},
 release(){this.resetStick();this.fireUp();},
 updateStick(now){
  const s=this.stick;
  if(!s.active){s.dir=null;return;}
  if(Math.hypot(s.ax,s.ay)<.42){s.dir=null;return;}
  const dir=Math.abs(s.ax)>Math.abs(s.ay)?(s.ax>0?KEY.RIGHT:KEY.LEFT):(s.ay>0?KEY.DOWN:KEY.UP);
  if(s.dir!==dir){s.dir=dir;s.next=now+340;edge[dir]=true;}
  else if(now>=s.next){edge[dir]=true;s.next=now+140;}
 }
};
const keys={},edge={},padKeys={},padEdge={};
const p2keys={},p2edge={},pad2Keys={},pad2Edge={};
const P2BIND={87:KEY.UP,83:KEY.DOWN,65:KEY.LEFT,68:KEY.RIGHT,74:KEY.Z,75:KEY.X,76:KEY.C,73:KEY.SHIFT};
addEventListener('keydown',e=>{
 if(typeof document!=='undefined'&&document.activeElement&&document.activeElement.id==='roomCode')return;
 const p2k=P2BIND[e.keyCode];
 const p2Active=p2k!==undefined&&typeof players!=='undefined'&&players.length>1;
 if(p2Active){
  if(!p2keys[p2k])p2edge[p2k]=true;p2keys[p2k]=true;
  e.preventDefault();
  if(typeof G!=='undefined'&&G)G.idleT=0;
  try{AudioSys.unlock();}catch(err){}
  return;
 }
 if(!keys[e.keyCode])edge[e.keyCode]=true;
 keys[e.keyCode]=true;
 if([37,38,39,40,16,90,88,67].includes(e.keyCode))e.preventDefault();
 if(typeof G!=='undefined'&&G)G.idleT=0;
 if(e.keyCode===KEY.M&&typeof toggleMute==='function')toggleMute();
 try{AudioSys.unlock();}catch(err){}
});
addEventListener('keyup',e=>{
 keys[e.keyCode]=false;
 const p2k=P2BIND[e.keyCode];
 if(p2k!==undefined)p2keys[p2k]=false;
});
const NET_KEYS=[KEY.LEFT,KEY.RIGHT,KEY.UP,KEY.DOWN,KEY.SHIFT,KEY.Z,KEY.X,KEY.C];
const NET_BITS=(()=>{const m={};for(let i=0;i<NET_KEYS.length;i++)m[NET_KEYS[i]]=1<<i;return m;})();
const netCapturing=()=>typeof Net!=='undefined'&&Net&&Net.capturing;
const down=k=>{if(netCapturing())return !!(Net.mask&(NET_BITS[k]||0));return !!keys[k]||!!padKeys[k];};
const hitK=k=>{
 if(netCapturing()){const b=NET_BITS[k];if(b&&(Net.edge&b)){Net.edge&=~b;return true;}return false;}
 if(edge[k]||padEdge[k]){edge[k]=false;padEdge[k]=false;return true}return false};
const downP=(p,k)=>{
 if(netCapturing()){const m=p===P2?Net.mask2:Net.mask;return !!(m&(NET_BITS[k]||0));}
 return p===P2?(!!p2keys[k]||!!pad2Keys[k]):down(k);};
const hitP=(p,k)=>{
 if(netCapturing()){const b=NET_BITS[k];if(!b)return false;if(p===P2){if(Net.edge2&b){Net.edge2&=~b;return true;}return false;}if(Net.edge&b){Net.edge&=~b;return true;}return false;}
 if(p!==P2)return hitK(k);if(p2edge[k]||pad2Edge[k]){p2edge[k]=false;pad2Edge[k]=false;return true}return false};
function clearEdges(){for(const k in edge)edge[k]=false;for(const k in padEdge)padEdge[k]=false;for(const k in p2edge)p2edge[k]=false;for(const k in pad2Edge)pad2Edge[k]=false;}
function clearP2Input(){for(const k in p2keys)p2keys[k]=false;for(const k in p2edge)p2edge[k]=false;for(const k in pad2Keys)pad2Keys[k]=false;for(const k in pad2Edge)pad2Edge[k]=false;}

const DIFFS=['Easy','Original','Absurdly All-Star','1CC','Story','Story 1CC'];
let DIFF=1;
/* Easy, Original, Absurdly All-Star, 1CC, Story, Story 1CC.
   The last three intentionally reuse Original scaling. */
const DSCAL=[{c:.65,s:.85,hp:.75},{c:1,s:1,hp:1},{c:2.2,s:1.28,hp:1.15},{c:1,s:1,hp:1},{c:1,s:1,hp:1},{c:1,s:1,hp:1}];
const DN=n=>Math.max(2,Math.round(n*DSCAL[DIFF].c));
const DV=v=>v*DSCAL[DIFF].s;

const COL={
 red:['#ff5060','#ffb0b8'],pink:['#ff70c0','#ffc8e8'],orange:['#ff9030','#ffd8a0'],
 yellow:['#ffe060','#fff8c0'],green:['#60ff80','#c0ffc8'],teal:['#40e0d0','#b0fff4'],cyan:['#40d0ff','#b0ecff'],
 blue:['#6090ff','#bcd0ff'],dblue:['#4050e0','#a0b0ff'],purple:['#c060ff','#e6c0ff'],
 white:['#f8f8ff','#ffffff'],gray:['#a0a0b0','#d8d8e0'],black:['#30303c','#90909c'],
 lime:['#b0ff30','#e8ffc0'],brown:['#c08050','#f0d0b0']
};
let eshots=[],pshots=[],items=[],fx=[],ftext=[],elasers=[],mobs=[];
function resetFieldSafe(){eshots.length=0;pshots.length=0;items.length=0;elasers.length=0;mobs.length=0;}
let shakeT=0,shakeM=0,flashA=0,flashC='#fff';
function shake(f,m){if(typeof G!=='undefined'&&G&&G.shakeEnabled===false)return;shakeT=Math.max(shakeT,f);shakeM=m;}
function screenFlash(a,c='#fff'){if(typeof G!=='undefined'&&G&&G.flashEnabled===false)return;flashA=Math.max(flashA,a);flashC=c;}
function addText(x,y,s,c='#fff',sz=14,life=45,vy=-0.7){if(ftext.length<40)ftext.push({x,y,s,c,sz,life,max:life,vy});}
function fxRing(x,y,c,r0=6,r1=60,w=3,life=24){if(fx.length<300)fx.push({t:'ring',x,y,c,r0,r1,w,life,max:life});}
function fxBurst(x,y,c,n=10,sp=4){for(let i=0;i<n;i++){if(fx.length>=300)break;const a=vrnd(TAU);fx.push({t:'p',x,y,vx:Math.cos(a)*vrnd(sp*.3,sp),vy:Math.sin(a)*vrnd(sp*.3,sp),c,life:virnd(14,26),max:26});}}
function fxSpark(x,y,c,life=12){if(fx.length<300)fx.push({t:'spark',x,y,c,life,max:life});}
const ASSETS={};
const SFX_FILES={pshot:'gun13_a',bossHit:'hit_s',bomb:'bom20_a',death:'bom26_c',bossDie:'bom28_b',
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
     const r=(half-2)-k*1.5;if(r<=0)break;
     cc.beginPath();cc.arc(cxp,y,r,Math.PI,TAU);cc.stroke();
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
  ['bg_mainbg','ui/mainbg'],['ui_arrow','ui/arrow'],
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
 fx.push({t:'spr',img,x,y,vx:vrnd(-.3,.3),vy:vy+vrnd(-.2,.2),sc,al,rot:rot!==undefined?rot:vrnd(TAU),life:virnd(26,44),max:44});
}
function fxSlash(x,y,angDeg,scale=1){
 if(fx.length>=300)return;
 fx.push({t:'crescent',x,y,ang:angDeg*Math.PI/180,scale,life:16,max:16,col:'#fff'});
}
const tintCache=new Map();
function tinted(imgName,color,size=64){
 const key=imgName+'|'+color+'|'+size;
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
function fxShard(x,y){if(fx.length>=300)return;const a=vrnd(TAU);
 fx.push({t:'shard',x,y,vx:Math.cos(a)*vrnd(1,3.5),vy:Math.sin(a)*vrnd(1,3.5),ang:a,life:virnd(10,16),max:16});}

let grazeTick=0,hitTick=0;
const epool=[];let eSpawned=0,eReused=0;
function killE(i){const b=eshots[i];if(!b)return;b.fn=null;epool.push(b);const l=eshots.pop();if(i<eshots.length)eshots[i]=l;}
function killP(i){const l=pshots.pop();if(i<pshots.length)pshots[i]=l;}
function killItem(i){const l=items.pop();if(i<items.length)items[i]=l;}
function killLaser(i){const l=elasers.pop();if(i<elasers.length)elasers[i]=l;}
function killFx(i,arr){const l=arr.pop();if(i<arr.length)arr[i]=l;}
function spawnE(o){
 if(eshots.length>1600)return;
 const b=epool.pop();
 if(b!==undefined)eReused++;
 const s=b||{};
 s.fn=null;s.keep=false;
 Object.assign(s,{g:'ball',c:'white',x:0,y:0,v:2,ang:90,r:5,acc:0,max:-1,t:0,grazed:false,hit:true,
  av:0,end:null,dur:0,spin:vrnd(TAU),alpha:1},o);
 if(!o.fast)s.v=Math.min(s.v||2,8.5);
 if(!isFinite(s.v))s.v=2;
 if(!isFinite(s.x))s.x=W/2; if(!isFinite(s.y))s.y=-20;
 if(!isFinite(s.ang))s.ang=90;
 const an=s.ang*Math.PI/180;
 s.vx=Math.cos(an)*s.v;s.vy=Math.sin(an)*s.v;
 eshots.push(s);eSpawned++;
}
function eUpdate(){
 const tranceActive=G.trance>0;
 const tranceR2=10000; /* 100^2 */
 for(let i=eshots.length-1;i>=0;i--){const b=eshots[i];b.t++;
  if(b.g==='star')b.spin=(b.spin||0)+.06;
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
   for(const p of players){
    if(p.dead)continue;
    const dxp=b.x-p.x,dyp=b.y-p.y;
    const d2=dxp*dxp+dyp*dyp;
    if(d2<tranceR2){const k=.55+.45*(Math.sqrt(d2)/100);mx*=k;my*=k;break;}
   }
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
  if(b.hom&&b.tgt){
   const alive=b.tgt===bs||mobs.includes(b.tgt);
   if(!alive){b.hom=false;b.tgt=null;}
   else{
    const want=Math.atan2(b.tgt.y-b.y,b.tgt.x-b.x)*180/Math.PI;
    let cur=Math.atan2(b.vy,b.vx)*180/Math.PI;
    let diff=((want-cur+540)%360)-180;
    cur+=clamp(diff,-OPTION_TURN_RATE,OPTION_TURN_RATE);
    const sp=Math.hypot(b.vx,b.vy);
    b.vx=Math.cos(cur*Math.PI/180)*sp;b.vy=Math.sin(cur*Math.PI/180)*sp;
   }
  }
  if(bs){
   const dx=b.x-bs.x,dy=b.y-bs.y;
   if(dx*dx+dy*dy<(BOSS_HIT_R+3)*(BOSS_HIT_R+3)){
    damageBossRaw(b.dmg||2);
    fxSpark(bs.x+vrnd(-10,10),bs.y+vrnd(6,20),'#fff',7);
    killP(i);continue;
   }
  }
  let hitMob=false;
  for(let j=mobs.length-1;j>=0;j--){const m=mobs[j];
   const mdx=b.x-m.x,mdy=b.y-m.y;
   if(mdx*mdx+mdy*mdy<(m.r+4)*(m.r+4)){
    damageMob(m,b.dmg||2);
    fxSpark(b.x,b.y,'#fff',6);
    hitMob=true;break;
   }
  }
  if(hitMob){killP(i);continue;}
  b.x+=b.vx;b.y+=b.vy;
  if(b.x<-20||b.x>W+20||b.y<-40||b.y>H+20)killP(i);}
}

const IT={P:'#ff4040',B:'#4090ff',L:'#ff40ff',S:'#ffff40',K:'#ffd700',O:'#40e0d0'};
function spawnItem(t,x,y,vx=0){
 if(items.length>220)return;
 items.push({t,x,y,vx,vy:rnd(-3,-1),fall:false,t2:0});
}
function itemSpray(x,y,n=8,kind='B'){for(let i=0;i<n;i++)spawnItem(kind,x,y,Math.cos(TAU*i/n)*2.2);}
function nearestItemPlayer(it){
 let best=PL,bestD=Infinity;
 for(const p of players){
  if(p.dead)continue;
  const d=dist(it.x,it.y,p.x,p.y);
  if(d<bestD){bestD=d;best=p;}
 }
 return best;
}
function itemUpdate(){
 const above=players.some(p=>!p.dead&&p.y<150);
 for(let i=items.length-1;i>=0;i--){const it=items[i];it.t2++;
  const target=nearestItemPlayer(it);
  if(above&&!it.fall)it.fall=true;
  if(!it.fall&&dist(it.x,it.y,target.x,target.y)<75)it.fall=true;
  if(it.fall){it.x=lerp(it.x,target.x,.09);it.y=lerp(it.y,target.y,.14);
   if(it.t2%4===0&&fx.length<300)fx.push({t:'trail',x:it.x+vrnd(-3,3),y:it.y+vrnd(-2,4),c:IT[it.t],life:10,max:10});}
  else{it.vy=Math.min(it.vy+.12,2.6);it.vx*=.98;it.x+=it.vx;it.y+=it.vy;
   if(it.y>=H-14){it.y=H-14;it.vy=0;it.ground=true;}}
  if(it.ground){
   it.life=(it.life===undefined?560:it.life)-1;
   if(it.life<=0){collect(it,target);fxSpark(it.x,it.y,'#cfc',8);killItem(i);continue;}
  }
   if(dist(it.x,it.y,target.x,target.y)<16||above){
    collect(it,target);killItem(i);}
  }
}
function collect(it,p=PL){
 const px=p.x+vrnd(-8,8),py=p.y-24;
 if(it.t==='P'){addPower(8,p);sfx('item');addText(px,py,'PWR','#ff8080',11,30);}
 else if(it.t==='B'){const v=Math.floor(8000*(1+p.graze/400));G.score+=v;sfx('item');addText(px,py,'+'+v,'#6090ff',12,36);}
 else if(it.t==='L'){p.lives=Math.min(8,p.lives+1);G.livesPulse=36;addText(p.x,p.y-30,'Extend!','#ff60ff');sfx('extend');
  fxRing(p.x,p.y,'#ffd700',8,60,4,24);}
 else if(it.t==='S'){p.spells=Math.min(4,p.spells+1);addText(p.x,p.y-30,'Spell +1','#ffff60');sfx('spellget');}
 else if(it.t==='K'){G.sparksGot++;G.score+=10000;sfx('spellget');
  addText(p.x,p.y-30,'+10k','#ffd700',14,40);fxBurst(p.x,p.y,'#ffd700',8,3);}
 else if(it.t==='O'){G.od=Math.min(G.odMax,G.od+12);p.flash=Math.min(p.flashMax,p.flash+2);
  G.score+=1500;sfx('item');addText(px,py,'OD+','#40e0d0',12,30);}
}

function addPower(v,p=PL){p.power=clamp(p.power+v,100,500);}

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
  else if(L.state===2){if(L.t>L.dur){killLaser(i);}}
 }
}
function spawnLaser(o){
 const L=Object.assign({state:0,t:0,warm:40,dur:50,lethal:true,wid:16,col:'#f66'},o);
 L.x1=isFinite(L.x)?L.x:W/2;L.y1=isFinite(L.y)?L.y:-10;
 elasers.push(L);
}

