"use strict";
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

