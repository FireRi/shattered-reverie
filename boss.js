"use strict";
/* ================= BOSS ================= */
let BOSS=null;
const PLAYER_NAME='Suzuran';
let autoFire=false,showFps=false,fpsFrames=0,fpsTime=0,fpsVal=0,demoIdle=0,Gdemo=false,demoKeyLock=0;
let demoTX=PL.x,demoTY=PL.y,demoCommit=0,demoFocus=false;
function updateDemoMovement(){
 PL.focus=false;
 function scorePos(cx,cy){
  let sc=0;
  for(const e of eshots){
   const dx=e.x-cx,dy=e.y-cy;
   const sp=Math.sqrt(e.vx*e.vx+e.vy*e.vy)||1;
   const proj=(dx*e.vx+dy*e.vy)/sp;
   if(proj>0&&proj<80)sc-=700/(proj+8);
   if(dx*dx+dy*dy<2209)sc-=900;
  }
  if(BOSS&&!BOSS.dying&&BOSS.atk){
   sc-=Math.abs(cx-BOSS.x)*3;
   if(Math.abs(cx-BOSS.x)<BOSS_HIT_R)sc+=120;
  }
  if(cy<H*.5)sc-=150;
  return sc;
 }
 demoCommit--;
 const ddx=demoTX-PL.x,ddy=demoTY-PL.y;
 if(demoCommit<=0||Math.sqrt(ddx*ddx+ddy*ddy)<6){
  let bx=demoTX,by=demoTY,bs=scorePos(PL.x,PL.y);
  for(let i=0;i<12;i++){
   const a=i/12*TAU,r=(i%3===0)?0:(i%2===0?40:75);
   const cx=clamp(PL.x+Math.cos(a)*r,25,W-25);
   const cy=clamp(PL.y+Math.sin(a)*r,40,H-30);
   const s=scorePos(cx,cy);
   if(s>bs){bs=s;bx=cx;by=cy;}
  }
  for(const it of items){
   const d2=(it.x-PL.x)*(it.x-PL.x)+(it.y-PL.y)*(it.y-PL.y);
   if(d2<40000){
    let bonus=(it.ground?350:150)+(it.t==='P'?100:it.t==='L'?250:it.t==='S'?200:50);
    const s=scorePos(it.x,it.y)+bonus;
    if(s>bs){bs=s;bx=it.x;by=it.y;}
   }
  }
  demoTX=bx;demoTY=by;demoCommit=14+irnd(0,10);
  let danger=0;
  for(const e of eshots){
   const dx=e.x-PL.x,dy=e.y-PL.y;
   if(dx*dx+dy*dy<3600)danger++;
  }
  demoFocus=danger>=4;
 }
 PL.focus=demoFocus;
 const spd=demoFocus?3.2:5.5;
 const mvx=demoTX-PL.x,mvy=demoTY-PL.y;
 const mdist=Math.sqrt(mvx*mvx+mvy*mvy);
 if(mdist>3){PL.x+=mvx/mdist*Math.min(mdist,spd);PL.y+=mvy/mdist*Math.min(mdist,spd);}
 PL.tilt=((mvx>1)-(mvx<-1))*.2;
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

