"use strict";
/* ================= PLAYER ================= */
function newPlayerState(slot){
 return {slot,x:W/2,y:H-70,lives:4,spells:2,power:300,graze:0,flashMax:30,flash:0,inv:0,dead:0,
  focus:false,opts:[],optAng:0,shootT:0,deathT:0,rebirthX:0,rebirthY:0,alive:true,slowT:0};
}
const PL=newPlayerState(0);
const P2=newPlayerState(1);
const players=[PL];
function targetPlayer(){
 let best=PL,bestD=Infinity;
 const bx=BOSS?BOSS.x:W/2,by=BOSS?BOSS.y:H*.3;
 for(const p of players){
  if(p.dead)continue;
  const d=(p.x-bx)*(p.x-bx)+(p.y-by)*(p.y-by);
  if(d<bestD){bestD=d;best=p;}
 }
 return best;
}
function allPlayersDown(){return players.every(p=>p.dead===2);}
function activatePlayer2(){
 if(!players.includes(P2))players.push(P2);
 if(typeof resetPlayer==='function')resetPlayer(true,P2);
 P2.x=clamp(PL.x+56,20,W-20);P2.y=clamp(PL.y,20,H-20);
 P2.graze=0;P2.power=300;P2.opts.length=0;P2.inv=120;
 for(const k in P2)if(k.length>1&&k[0]==='o'&&k[1]>='0'&&k[1]<='9')delete P2[k];
}
function deactivatePlayer2(){
 if(players.length>1)players.length=1;
}
function resetPlayer(full,p=PL){p.x=p===P2?clamp(PL.x+56,20,W-20):W/2;p.y=H-70;if(full){p.lives=4;p.spells=2;}p.power=Math.max(p.power,300);p.inv=120;p.dead=0;p.alive=true;p.flash=0;}
function killPlayer(p=PL){
 if(p.inv>0||p.dead)return;
 G.deaths++;sfx('death');fxBurst(p.x,p.y,'#f8f',26,7);fxRing(p.x,p.y,'#fff',8,120,5,30);shake(20,8);screenFlash(.5,'#fff');
 for(let i=0;i<6;i++)fx.push({t:'puff',x:p.x+rnd(-14,14),y:p.y+rnd(-10,10),vx:rnd(-.4,.4),vy:rnd(-.7,-.2),sc:rnd(.6,1.1),life:irnd(24,40),max:40});
 p.dead=1;p.deathT=0;p.deathWindow=16;
 G.streak=0;G.streakMult=1;
 if(G.monoRay&&G.monoRay.owner===p)G.monoRay=null;
 clearBullets(false);
}
function tryDeathbomb(p=PL){
 if(p.spells<=0)return false;
 p.spells--;G.spellUsedOwn++;
 p.dead=0;p.deathT=0;p.deathWindow=0;p.inv=160;
 p.x=clamp(p.rebirthX||W/2,14,W-14);p.y=clamp(p.rebirthY||H-70,14,H-14);
 sfx('bomb');shake(12,4);screenFlash(.6,'#fff');
 clearBullets(false);
 fxRing(p.x,p.y,'#fff',10,220,6,28);
 damageBossRaw(120);
 for(const m of mobs.slice())damageMob(m,120);
 return true;
}
function clearBullets(toItems){
 for(let i=eshots.length-1;i>=0;i--){const b=eshots[i];
  if(toItems&&rnd()<.12&&items.length<200)spawnItem(rnd()<.7?'B':'P',b.x,b.y);
  if(fx.length<300)fxSpark(b.x,b.y,'#aaf',8);
  killE(i);
 }
 elasers.length=0;
}
function bombsAvailable(){
 return (BOSS&&!BOSS.dying&&BOSS.state==='fight'&&BOSS.atk&&BOSS.cutin<=0)||mobs.length>0;
}
function useFlashBomb(p=PL){
 if(p.flash<p.flashMax||p.dead||!bombsAvailable())return;
 if(BOSS&&BOSS.spellActive&&BOSS.atk)G.spellBombUsed=true;
 p.flash=0;p.inv=Math.max(p.inv,60);sfx('flash');shake(14,6);screenFlash(.85,'#fff');
 const x=p.x,y=p.y;
 fx.push({t:'cross',x,y,life:36,max:36});
 clearBullets(false);
 for(let i=0;i<3;i++)fxRing(x,y,'#fff',10+i*20,420,6,30+i*4);
 damageBossRaw(60);
 for(const m of mobs.slice())damageMob(m,60);
}
function useSpell(p=PL){
 if(p.spells<=0||p.dead||!bombsAvailable())return false;
 if(BOSS&&BOSS.spellActive&&BOSS.atk)G.spellBombUsed=true;
 p.spells--;G.spellUsedOwn++;p.inv=Math.max(p.inv,230);sfx('bomb');shake(16,5);screenFlash(.7,'#fff');
 const sx=p.x,sy=p.y;
 fx.push({t:'monochrome',x:sx,y:sy,life:210,max:210});
 G.monoRay={x:p.x,t:0,owner:p};
 return true;
}
function playerUpdate(p=PL){
 if(p.dead){updatePlayerDeath(p);return;}
 updatePlayerMovement(p);
 handleBombInput(p);
 const shooting=Gdemo||autoFire||downP(p,KEY.Z);
 p.shooting=shooting;
 if(shooting)firePlayerWeapon(p);
 else updateOptions(p,Math.floor(p.power/100)>=2?5:3,false);
 tickMonochromeRay(p);
}
function updatePlayerDeath(p=PL){
 if(p.dead===2)return;
 if(p.deathWindow>0){
  p.deathWindow--;
  if((hitP(p,KEY.X)||hitP(p,KEY.C))&&tryDeathbomb(p))return;
 }
 p.deathT++;
 if(p.deathT<=50)return;
 if(p.lives>0){
  p.lives--;p.spells=2;p.alive=true;p.dead=0;p.inv=100;
  p.x=clamp(p.rebirthX||W/2,20,W-20);p.y=clamp(p.rebirthY||H-70,20,H-20);
  p.rebirthX=0;p.rebirthY=0;
  fxRing(p.x,p.y,'#8ff',10,80,4,26);
 }else{
  p.dead=2;
  if(allPlayersDown())onGameOver();
 }
}
function updatePlayerMovement(p=PL){
 if(Gdemo){updateDemoMovement();return;}
 const net=(typeof Net!=='undefined'&&Net&&Net.capturing);
 p.focus=p===PL?(down(KEY.SHIFT)||(net?!!Net.focus:TouchUI.focus)):(downP(p,KEY.SHIFT)||(net?!!Net.p2focus:false));
 const sp=p.focus?3.2:5.5;
 let dx=(downP(p,KEY.RIGHT)?1:0)-(downP(p,KEY.LEFT)?1:0),dy=(downP(p,KEY.DOWN)?1:0)-(downP(p,KEY.UP)?1:0);
 if(net){
  if(p===PL){if(Net.analog){dx=Net.ax;dy=Net.ay;}}
  else{if(Net.p2analog){dx=Net.p2ax;dy=Net.p2ay;}}
 }else if(p===PL&&typeof Replay!=='undefined'&&Replay.playback&&Replay.analog){dx=Replay.ax;dy=Replay.ay;}
 else if(p===P2&&typeof Replay!=='undefined'&&Replay.playback&&Replay.p2analog){dx=Replay.p2ax;dy=Replay.p2ay;}
 else if(p===PL&&IS_TOUCH&&TouchUI.stick.active){dx=TouchUI.stick.ax;dy=TouchUI.stick.ay;}
 const mag=Math.hypot(dx,dy);
 if(mag>1){dx/=mag;dy/=mag;}
 p.x=clamp(p.x+dx*sp,12,W-12);p.y=clamp(p.y+dy*sp,12,H-12);
 if(dx>0)p.tilt=Math.min(1,(p.tilt||0)+.14);else if(dx<0)p.tilt=Math.max(-1,(p.tilt||0)-.14);
 else p.tilt=(p.tilt||0)*.82;
 if(dx>0)p.face=1;else if(dx<0)p.face=-1;
 if(p.inv>0)p.inv--;
 if(p.focus&&p.slowT++%6===0)fx.push({t:'focusring',x:p.x,y:p.y,life:40,max:40});
}
function handleBombInput(p=PL){
 if(p.dead)return;
 if(hitP(p,KEY.C)){useSpell(p);return;}
 if(hitP(p,KEY.X)&&p.flash>=p.flashMax&&!downP(p,KEY.SHIFT))useFlashBomb(p);
}
function firePlayerWeapon(p=PL){
 p.shootT++;
 const pint=Math.floor(p.power/100);
 if(pint>=3)fireMainBeam(p,pint);
 else fireRapidShots(p,pint);
 fireOptionPellets(p,pint);
}
function fireMainBeam(p,pint){
 if(p.shootT%2!==0)return;
 const bs=_ne();
 const connected=!!bs&&Math.abs(bs.x-p.x)<BOSS_HIT_R&&bs.y<p.y-10;
 if(connected){damageBossRaw(1.55*(p.power/300));fxSpark(bs.x+rnd(-14,14),bs.y+18,'#bff6ff',7);}
 for(const m of mobs){
  if(Math.abs(m.x-p.x)<m.r+6&&m.y<p.y-10){
   damageMob(m,1.55*(p.power/300));fxSpark(m.x+rnd(-10,10),m.y+10,'#bff6ff',6);break;
  }
 }
 fx.push({t:'beam',x:p.x,y:p.y-14,life:6,max:6,w:(pint>=5?9:7)*(connected?1:.55),hit:connected});
}
function fireRapidShots(p,pint){
 if(p.shootT%4!==0)return;
 spawnP({x:p.x-6,y:p.y-10,v:14,ang:-90,dmg:2.2});
 spawnP({x:p.x+6,y:p.y-10,v:14,ang:pint>1?-84:-96,dmg:2.2});
 sfx('pshot');
}
function fireOptionPellets(p,pint){
 const nOpt=pint>=2?5:3;
 updateOptions(p,nOpt);
 if(p.shootT%4!==0)return;
 const tgt=_ne()||nearestMobTo(p.x,p.y);
 const mid=Math.floor(nOpt/2);
 for(let i=0;i<nOpt;i++){
  const o=p.opts[i]||p.x;
  let a=-90;
  if(pint>=4)a+=(i-2)*4;
  const useHome=p.focus&&!!tgt&&(i===mid-1||i===mid+1);
  spawnP({x:o.x,y:o.y,v:DV(11),ang:a,dmg:(pint>=4?1.15:1.6)*(useHome?0.5:1),type:useHome?'homing':'shot',tgt,hom:useHome?.14:0});
 }
 sfx('pshot');
}
function tickMonochromeRay(p=PL){
 if(!G.monoRay)return;
 if(G.monoRay.owner&&G.monoRay.owner!==p)return;
 G.monoRay.t++;
 if(G.monoRay.t%6===0){damageBossRaw(9);for(const m of mobs.slice())damageMob(m,9);clearBullets(false);}
 if(G.monoRay.t>200)G.monoRay=null;
}
let _neC=null,_neF=-1;
function _ne(){if(_neF!==G.simFrame){_neC=(BOSS&&!BOSS.dying&&BOSS.state==='fight'&&BOSS.atk&&BOSS.cutin<=0)?BOSS:null;_neF=G.simFrame;}return _neC;}
const BOSS_HIT_R=26;
function updateOptions(p,n,spread=true){
 p.opts.length=n;
 const f=p.focus;
 for(let i=0;i<n;i++){
  const c=(n-1)/2;
  let tx,ty;
  if(f){const a=p.optAng+TAU*i/n;tx=p.x+Math.cos(a)*26;ty=p.y+Math.sin(a)*26;}
  else{tx=p.x+(i-c)*17;ty=p.y+16+(i%2)*6;}
  if(!p['o'+i])p['o'+i]={x:tx,y:ty};
  const o=p['o'+i];o.x=lerp(o.x,tx,f?.4:.18);o.y=lerp(o.y,ty,f?.4:.18);
  p.opts[i]=o;
 }
 if(f)p.optAng+=0.04;
}
function activateTrance(p=PL){
 if(G.trance>0||G.od<G.odMax)return false;
 G.od=0;G.trance=330;
 for(const it of items)it.fall=true;
 sfx('declare');screenFlash(.32,'#aef');shake(8,3);
 addText(p.x,p.y-46,'OVERDRIVE!','#7fdfff',26,70);
 fxRing(p.x,p.y,'#8cf',12,150,5,30);
 return true;
}
function playerGrazeCheck(p=PL){
 grazeTick++;
 if(p.dead)return;
 const bit=1<<(p.slot|0);
 if(p.inv<=0&&!p.dead&&BOSS&&!BOSS.dying&&BOSS.state==='fight'&&BOSS.cutin<=0&&Math.abs(p.x-BOSS.x)<34&&Math.abs(p.y-BOSS.y)<34){
  killPlayer(p);return;
 }
 if(p.inv<=0&&!p.dead){
  for(const m of mobs){
   const mdx=m.x-p.x,mdy=m.y-p.y;
   if(mdx*mdx+mdy*mdy<(m.r+PLAYER_HIT_R)*(m.r+PLAYER_HIT_R)){killPlayer(p);return;}
  }
 }
 for(const b of eshots){
  const dx=b.x-p.x,dy=b.y-p.y,d2=dx*dx+dy*dy;
  if(!b.grazed&&!(b.grazeMask&bit)&&d2<(GRAZE_R+b.r*.5)*(GRAZE_R+b.r*.5)){
   b.grazeMask=(b.grazeMask|0)|bit;p.graze++;G.score+=500;
   G.od=Math.min(G.odMax,G.od+(G.trance>0?0:(G.trance<=0&&p.flash>=p.flashMax?2:1)));
   activateTrance(p);
   const MS=[100,250,500,1000,2000];
   for(const m of MS)if(p.graze===m){addText(W/2,180,'GRAZE '+m+'!','#9cf',22,60);sfx('extend');}
   if(p.flash<p.flashMax){p.flash++;if(p.flash===p.flashMax)sfx('spellget');}
   sfx('graze');fxSpark((b.x+p.x)/2,(b.y+p.y)/2,'#fff',8);
   fxShard((b.x+p.x)/2,(b.y+p.y)/2);fxShard((b.x+p.x)/2,(b.y+p.y)/2);
  }
  if(p.inv<=0&&!p.dead&&b.hit!==false&&d2<(PLAYER_HIT_R+b.r*.55)*(PLAYER_HIT_R+b.r*.55)){
   killPlayer(p);break;
  }
 }
 if(p.inv<=0&&!p.dead){
  p.rebirthX=p.x;p.rebirthY=p.y;
 }
 for(const L of elasers){
  if(L.state!==2||!L.lethal)continue;
  const dx=L.x2-L.x1,dy=L.y2-L.y1;const len2=dx*dx+dy*dy;
  let t=((p.x-L.x1)*dx+(p.y-L.y1)*dy)/len2;t=clamp(t,0,1);
  const px=L.x1+dx*t,py=L.y1+dy*t;
    if(dist(px,py,p.x,p.y)<L.wid/2+PLAYER_HIT_R&&p.inv<=0&&!p.dead){killPlayer(p);}
  }
 }

