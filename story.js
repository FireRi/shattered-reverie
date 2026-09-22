"use strict";
/* ================= STORY MODE — trash mobs =================
   Mob waves spawn before each boss when G.story is true.
   Mobs shoot aimed patterns at the player; on death they drop
   points (B), power (P) or overload (O) items via RNG with a
   pity timer that guarantees +1.0 (100) power per wave. */

const MOB_DEFS={
 drone:{hp:26,r:12,score:5000,col:'#40e0d0',dark:'#1a5a5a'},
 weaver:{hp:44,r:13,score:8000,col:'#c060ff',dark:'#4a2a6a'},
 tank:{hp:120,r:18,score:15000,col:'#ff9030',dark:'#6a3a1a'}
};
const STORY_WAVE_SIZE=14;
const STORY_POWER_QUOTA=100; /* 1.0 power */
const STORY_P_VALUE=8; /* matches addPower(8) per P item */

function clearMobs(){mobs.length=0;}

function nearestMobTo(x,y){
 let best=null,bd=Infinity;
 for(const m of mobs){
  if(m.dead)continue;
  const dx=m.x-x,dy=m.y-y,d2=dx*dx+dy*dy;
  if(d2<bd){bd=d2;best=m;}
 }
 return best;
}

function spawnMob(kind,x,y){
 const def=MOB_DEFS[kind]||MOB_DEFS.drone;
 if(mobs.length>40)return null;
 const m={kind,x,y,vx:0,vy:0,hp:Math.round(def.hp*DSCAL[DIFF].hp),maxHp:Math.round(def.hp*DSCAL[DIFF].hp),
  r:def.r,score:def.score,col:def.col,dark:def.dark,t:0,fireT:irnd(90,140),hurtT:0,dead:false,
  seed:rnd(TAU),baseX:x,tilt:0,volley:0,
  tx:clamp(x+rnd(-60,60),50,W-50),txDir:Math.random()<.5?-1:1,
  ty:kind==='tank'?rnd(80,100):rnd(110,190)};
 mobs.push(m);
 return m;
}

function damageMob(m,d){
 if(!m||m.dead)return;
 if(G.trance>0)d*=1.5;
 m.hp-=d;m.hurtT=3;G.score+=Math.floor(d*5);
 hitTick++;if(hitTick%6===0)sfx('bossHit');
 if(m.hp<=0)killMob(m);
}

function killMob(m){
 const i=mobs.indexOf(m);
 if(i<0||m.dead)return;
 m.dead=true;mobs.splice(i,1);
 fxBurst(m.x,m.y,m.col,14,4);
 fxRing(m.x,m.y,'#fff',6,50,3,18);
 fxSpark(m.x,m.y,'#fff',10);
 sfx('bossHit');
 G.score+=m.score;
 addText(m.x,m.y-14,'+'+m.score,'#9cf',12,30);
 if(G.wave)G.wave.kills=(G.wave.kills||0)+1;
 storyDrop(m.x,m.y,m.kind);
}

function mobAim(m){
 return Math.atan2(PL.y-m.y,PL.x-m.x)*180/Math.PI;
}

function mobUpdate(){
 const calm=eshots.length<900;
 for(let i=mobs.length-1;i>=0;i--){
  const m=mobs[i];m.t++;
  if(m.hurtT>0)m.hurtT--;
  const px=m.x;
  const onStage=m.t>90&&m.y>10&&m.y<H*.72&&!PL.dead;
  if(m.kind==='drone'){
   /* ease toward a drifting anchor point, bob gently once settled */
   m.x+=(m.tx-m.x)*.045;
   m.y+=(m.ty-m.y)*.05;
   if(m.t>50){
    m.tx+=m.txDir*.55;
    if(m.tx<50||m.tx>W-50)m.txDir*=-1;
    m.y+=Math.sin(m.t/38+m.seed)*.35;
   }
   m.x=clamp(m.x,20,W-20);
   if(onStage&&calm){
    m.fireT--;
    if(m.fireT===25)fxRing(m.x,m.y,m.col,4,22,2,14);
    if(m.fireT<=0){
     m.fireT=120;
     const a=mobAim(m);
     for(let s=-1;s<=1;s++)
      spawnE({x:m.x,y:m.y+8,v:DV(2.7),ang:a+s*16,g:'ball:blue',r:5});
    }
   }
  }else if(m.kind==='weaver'){
   /* wide lazy weave around its anchor, never parks above the player */
   if(m.t>50)m.tx=m.baseX+Math.sin(m.t/34+m.seed)*Math.min(160,60+m.t*.35);
   m.x+=(m.tx-m.x)*.04;
   m.y+=(m.ty-m.y)*.045;
   if(m.t>50)m.y+=Math.cos(m.t/44+m.seed)*.3;
   m.x=clamp(m.x,20,W-20);
   if(onStage&&calm){
    m.fireT--;
    if(m.fireT===25)fxRing(m.x,m.y,m.col,4,22,2,14);
    if(m.fireT<=0){
     m.fireT=105;
     const a=mobAim(m),n=DN(3);
     for(let k=0;k<n;k++)
      spawnE({x:m.x,y:m.y+8,v:DV(2.5),ang:a+(k-(n-1)/2)*(40/Math.max(n-1,1)),g:'rice:purple',r:3});
    }
   }
  }else{ /* tank */
   /* slow regal sweep across the top of the screen */
   if(m.t>60)m.tx=W/2+Math.sin(m.t/90+m.seed)*(W/2-120);
   m.x+=(m.tx-m.x)*.03;
   m.y+=(m.ty-m.y)*.035;
   if(m.t>60)m.y+=Math.sin(m.t/45+m.seed)*.25;
   m.x=clamp(m.x,30,W-30);
   if(onStage&&calm){
    m.fireT--;
    if(m.fireT===25)fxRing(m.x,m.y,m.col,6,30,2,16);
    if(m.fireT<=0){
     m.fireT=100;m.volley++;
     /* ring with a gap facing the player so there is always a way through */
     const n=DN(6),step=360/n,a0=mobAim(m)+step/2;
     for(let k=0;k<n;k++)
      spawnE({x:m.x,y:m.y,v:DV(2.0),ang:a0+k*step,g:'ball:orange',r:5});
     if(m.volley%2===0){
      const a=mobAim(m);
      spawnE({x:m.x,y:m.y+10,v:DV(3.2),ang:a,g:'kunai:red',r:4});
     }
    }
   }
  }
  m.tilt=lerp(m.tilt||0,clamp((m.x-px)*.6,-1,1),.15);
  if(m.y>H+40||m.t>1800){mobs.splice(i,1);}
 }
}

/* ---------- drops: RNG (P/B/O) with power pity ---------- */
function storyRngDrop(){
 const r=Math.random();
 return r<.38?'P':r<.72?'B':'O';
}
function storyQuota(w){
 return Math.max(0,Math.min(STORY_POWER_QUOTA,500-w.startPower));
}
function storyPickDrop(){
 const w=G.wave;
 if(!w)return storyRngDrop();
 const gained=PL.power-w.startPower;
 const need=Math.max(0,storyQuota(w)-gained-w.powerSpawned);
 if(need<=0)return storyRngDrop();
 const remaining=(w.queue.length-w.idx)+mobs.length;
 if(remaining<=Math.ceil(need/STORY_P_VALUE))return 'P';
 return storyRngDrop();
}
function storyDrop(x,y,kind){
 const w=G.wave;
 const nDrops=kind==='tank'?3:1;
 for(let i=0;i<nDrops;i++){
  const t=storyPickDrop();
  if(t==='P'&&w)w.powerSpawned=(w.powerSpawned||0)+STORY_P_VALUE;
  spawnItem(t,x+rnd(-12,12),y+rnd(-6,6));
 }
}

/* ---------- wave control ---------- */
function buildStoryQueue(){
 const q=[];
 for(let i=0;i<6;i++)q.push('drone');
 for(let i=0;i<5;i++)q.push('weaver');
 /* shuffle the light mobs, tanks always last */
 for(let i=q.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const tmp=q[i];q[i]=q[j];q[j]=tmp;}
 q.push('tank','tank','tank');
 return q;
}
function startStoryWave(){
 if(G.wave||BOSS)return;
 G.wave={queue:buildStoryQueue(),idx:0,spawnT:10,startPower:PL.power,powerSpawned:0,kills:0};
 addText(W/2,180,'STORY WAVE','#8fdfff',20,70);
}
function updateStoryWave(){
 const w=G.wave;
 if(!w)return;
 if(BOSS){G.wave=null;return;}
 if(w.idx<w.queue.length){
  w.spawnT--;
  if(w.spawnT<=0&&mobs.length<6){
   const kind=w.queue[w.idx++];
   spawnMob(kind,rnd(60,W-60),-20);
   w.spawnT=38;
   if(w.idx===1){addText(W/2,220,'INCOMING!','#ffd700',22,60);sfx('warn');}
  }
 }else if(mobs.length===0){
  const gained=PL.power-w.startPower,quota=storyQuota(w);
  G.wave=null;G.needWave=false;
  G.score+=25000;
  if(gained<quota){
   addPower(quota-gained);
   addText(PL.x,PL.y-40,'POWER +1.0!','#ff8080',18,70);
   sfx('spellget');
  }else{
   addText(W/2,200,'WAVE CLEAR!','#8f8',20,60);
  }
  beginBossFight();
 }
}

function drawMobs(){
 for(const m of mobs){
  if(m.x<-30||m.x>W+30||m.y<-30||m.y>H+30)continue;
  cx.save();cx.translate(m.x,m.y);cx.rotate((m.tilt||0)*.3);
  if(m.t<20)cx.globalAlpha=m.t/20;
  const flash=m.hurtT>0;
  cx.fillStyle=flash?'#fff':m.dark;
  cx.strokeStyle=m.col;cx.lineWidth=2;
  if(m.kind==='drone'){
   cx.beginPath();cx.moveTo(0,-13);cx.lineTo(11,0);cx.lineTo(0,13);cx.lineTo(-11,0);cx.closePath();cx.fill();cx.stroke();
  }else if(m.kind==='weaver'){
   cx.beginPath();cx.moveTo(0,-14);cx.lineTo(12,10);cx.lineTo(-12,10);cx.closePath();cx.fill();cx.stroke();
  }else{
   cx.beginPath();
   for(let k=0;k<=6;k++){const a=k/6*TAU-Math.PI/6;cx[k?'lineTo':'moveTo'](Math.cos(a)*17,Math.sin(a)*17);}
   cx.closePath();cx.fill();cx.stroke();
  }
  cx.fillStyle='#fff';
  cx.beginPath();cx.arc(0,0,flash?5:3.5,0,TAU);cx.fill();
  if(m.maxHp>0&&m.hp<m.maxHp){
   const r=clamp(m.hp/m.maxHp,0,1);
   cx.fillStyle='rgba(0,0,0,.5)';cx.fillRect(-14,-22,28,4);
   cx.fillStyle=m.col;cx.fillRect(-14,-22,28*r,4);
  }
  cx.restore();
 }
}
