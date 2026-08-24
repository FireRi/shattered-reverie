"use strict";
const G={score:0,hi:0,dispScore:0,spellsPlayed:0,spellsCaptured:0,deaths:0,hits:0,
 routeQueue:[],routeIdx:0,bossIdx:0,screen:'title',frame:0,freeze:0,spellBombUsed:false,lastBonusLost:false,
 selFlags:new Array(ROUTES.length).fill(false),selCursor:0,diffCursor:1,pauseCursor:0,
 bannerT:0,bannerText:'',monoRay:null,resultT:0,livesPulse:0,
 od:0,odMax:80,trance:0,streak:0,bestStreak:0,streakMult:1,sparksGot:0,
 spellHist:[],beat:0,dim:0};
try{G.hi=parseInt(localStorage.getItem('lasr_hi')||'0')||0;
 const d=parseInt(localStorage.getItem('lasr_diff')||'1');if(d>=0&&d<=2)DIFF=d;}catch(e){}

const stars=[];
for(let i=0;i<110;i++)stars.push({x:rnd(W),y:rnd(H),s:rnd(.4,2.2),v:rnd(.3,1.6),l:i%3});
let bgTint=[30,30,40],bgMode='',bgScroll=1;
const nebula=document.createElement('canvas');nebula.width=320;nebula.height=320;
{
 const nc=nebula.getContext('2d');
 for(let i=0;i<7;i++){
  const x=rnd(40,280),y=rnd(40,280),r=rnd(50,120);
  const g=nc.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,'rgba(255,255,255,.16)');g.addColorStop(1,'rgba(255,255,255,0)');
  nc.fillStyle=g;nc.beginPath();nc.arc(x,y,r,0,TAU);nc.fill();
 }
}
const vig=document.createElement('canvas');vig.width=W;vig.height=H;
{
 const vc=vig.getContext('2d');
 const g=vc.createRadialGradient(W/2,H/2,H*.42,W/2,H/2,H*.85);
 g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.5)');
 vc.fillStyle=g;vc.fillRect(0,0,W,H);
}
const petals=[];
for(let i=0;i<26;i++)petals.push({x:rnd(W),y:rnd(H),vx:-.3-rnd(.6),vy:.35+rnd(.7),
 ph:rnd(TAU),sz:rnd(2.5,5),hue:pick(['#ffb7c9','#ffd9e4','#ff9fb8','#ffc4f0'])});
function updatePetals(){
 for(const p of petals){
  p.x+=p.vx+Math.sin(p.ph+=.02)*.4;p.y+=p.vy;
  if(p.y>H+8){p.y=-8;p.x=rnd(W);}
  if(p.x<-8)p.x=W+8;
 }
}
function drawPetals(alpha=.8){
 for(const p of petals){
  cx.save();cx.translate(p.x,p.y);cx.rotate(p.ph*2);
  cx.globalAlpha=alpha;cx.fillStyle=p.hue;
  cx.beginPath();cx.ellipse(0,0,p.sz,p.sz*.45,0,0,TAU);cx.fill();
  cx.restore();
 }
 cx.globalAlpha=1;
}

function saveHi(){if(G.score>G.hi){G.hi=G.score;try{localStorage.setItem('lasr_hi',String(G.hi));}catch(e){}}}

function startRun(){
 G.routeQueue=[];
 ROUTES.forEach((r,i)=>{if(G.selFlags[i])G.routeQueue.push(i);});
 if(!G.routeQueue.length)return;
 G.routeIdx=-1;G.bossIdx=0;G.score=0;G.dispScore=0;G.spellsPlayed=0;G.spellsCaptured=0;G.deaths=0;
 G.od=0;G.trance=0;G.streak=0;G.bestStreak=0;G.streakMult=1;G.sparksGot=0;G.spellHist=[];
 resetPlayer(true);PL.power=300;
 nextRoute();
}
function nextRoute(){
 G.routeIdx++;G.bossIdx=0;
 const R=ROUTES[G.routeQueue[G.routeIdx]];
 bgTint=R.tint;bgMode=R.mode||'';
 PL.lives=Math.min(8,PL.lives+ (G.routeIdx>0?1:0));
 PL.spells=2;PL.power=Math.max(PL.power,300);
 G.bannerText=R.title.toUpperCase();G.bannerT=130;
 G.screen='play';
 startBgm(R.seed*77+13,R.seed%40+130);
}
function routeClear(){
 if(G.demo){G.demo=false;endDemo();return;}
 if(G.routeIdx>=G.routeQueue.length-1){showResults();}
 else nextRoute();
}
const SPELLBG=['spellbg_s1','spellbg_s2','spellbg_s1','spellbg_s4','spellbg_s1','spellbg_s6','spellbg_s4','spellbg_s2'];
function beginBossFight(){
 const R=ROUTES[G.routeQueue[G.routeIdx]];
 const id=R.bosses[G.bossIdx];
 const def=BOSS_DEFS[id];
 def.leftInRoute=R.bosses.length-G.bossIdx;
 def.spellBg=SPELLBG[G.routeQueue[G.routeIdx]]||'spellbg_s1';
 fetchDynamicLine(def);
 startBoss(def,()=>{
  G.bossIdx++;
  if(G.bossIdx>=R.bosses.length)routeClear();
  else beginBossFight();
 });
}
function onGameOver(){
 G.screen='gameover';G.resultT=0;stopBgm();
}
function showResults(){
 G.screen='result';G.resultT=0;stopBgm();saveHi();
}
function ratePct(){return G.spellsPlayed?Math.floor(G.spellsCaptured/G.spellsPlayed*100):0;}
function rankInfo(){
 const p=ratePct();
 let r='E',c='#404040',t='Drifting Spirit';
 if(p>=20){r='D';c='#ff5050';t='Wandering Shade';}
 if(p>=40){r='C';c='#d0884a';t='Haniwa Whisperer';}
 if(p>=60){r='B';c='#c8c8c8';t='Youkai Exterminator';}
 if(p>=80){r='A';c='#ffd700';t='Mugenri Deity';}
 if(p>=100){r='S';c='#eee4c4';t='Pruns of Legend';}
 return {r,c,t,p};
}

/* ---------- update ---------- */
function updatePlay(){
 if(Gdemo&&(hitK(KEY.Z)||hitK(KEY.ESC)||hitK(KEY.X)||hitK(KEY.SHIFT))){endDemo();return;}
 if(Gdemo&&PL.dead===2){endDemo();return;}
 G.frame++;
 if(G.dispScore<G.score)G.dispScore=Math.min(G.score,G.dispScore+Math.max(1,Math.ceil((G.score-G.dispScore)*.18)));
 else G.dispScore=G.score;
 if(G.livesPulse>0)G.livesPulse--;
 if(G.trance>0){G.trance--;if(G.trance===0){G.od=0;}}
 playerUpdate();
 playerGrazeCheck();
 bossUpdate();
 eUpdate();pUpdate();itemUpdate();laserUpdate();
 for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.life--;if(f.life<=0)fx.splice(i,1);}
 for(let i=ftext.length-1;i>=0;i--){const t=ftext[i];t.y+=t.vy;t.life--;if(t.life<=0)ftext.splice(i,1);}
 if(shakeT>0)shakeT--;
 if(flashA>0)flashA-=.06;
 if(G.bannerT>0)G.bannerT--;
 else if(!BOSS&&G.bossIdx===0&&PL.dead!==2)beginBossFight();
 if(BOSS&&BOSS.cutin>0&&G.screen==='play')BOSS.cutin--;
 if(PL.dead===2){}
}
function menuNav(len,cur){
 if(hitK(KEY.UP)){sfx('cur');return (cur+len-1)%len;}
 if(hitK(KEY.DOWN)){sfx('cur');return (cur+1)%len;}
 return cur;
}
function updateMenus(){
 switch(G.screen){
  case 'title':
   G.idleT=(G.idleT||0)+1;
   if(G.idleT>900&&!Gdemo){startDemo();break;}
   if(hitK(KEY.Z)||hitK(KEY.ENTER)){sfx('ok');G.screen='diff';}
   break;
  case 'diff':
   G.diffCursor=menuNav(3,G.diffCursor);
   if(hitK(KEY.Z)){DIFF=G.diffCursor;sfx('ok');G.screen='sel';}
   break;
  case 'sel':{
   const n=ROUTES.length+2;
   G.selCursor=menuNav(n,G.selCursor);
   if(hitK(KEY.Z)){
    if(G.selCursor<ROUTES.length){
     G.selFlags[G.selCursor]=!G.selFlags[G.selCursor];sfx('ok');
    }else if(G.selCursor===ROUTES.length){
     sfx('ok');
     G.selFlags.fill(true);
    }else{
     if(G.selFlags.some(f=>f)){sfx('ok');startRun();}
     else sfx('no');
    }
   }
   break;}
  case 'pause':
    G.pauseCursor=menuNav(3,G.pauseCursor);
    if(hitK(KEY.Z)){
     sfx('ok');
     if(G.pauseCursor===0)G.screen='play';
     else if(G.pauseCursor===1){restartRoute();}
     else{G.screen='title';BOSS=null;eshots.length=0;items.length=0;elasers.length=0;pshots.length=0;fx.length=0;stopBgm();}
    }
    break;
  case 'gameover':
   G.resultT++;
   if(hitK(KEY.Z)||hitK(KEY.R)){sfx('ok');restartRoute();}
   if(hitK(KEY.X)){sfx('no');G.screen='title';}
   break;
  case 'result':
   G.resultT++;
   if(G.resultT>90&&(hitK(KEY.Z)||hitK(KEY.ENTER))){
    sfx('ok');G.screen='title';G.selFlags=new Array(ROUTES.length).fill(false);
    startBgm(999,120);
   }
   break;
 }
}
function restartRoute(){
 BOSS=null;eshots.length=0;pshots.length=0;items.length=0;fx.length=0;ftext.length=0;elasers.length=0;
 G.monoRay=null;resetPlayer(true);G.bossIdx=0;
 G.bannerText=ROUTES[G.routeQueue[G.routeIdx]].title.toUpperCase();G.bannerT=110;
 G.screen='play';
 startBgm(ROUTES[G.routeQueue[G.routeIdx]].seed*77+13,140);
}
addEventListener('keydown',e=>{
 G.idleT=0;
 if(e.keyCode===KEY.M&&AudioSys.master){
  AudioSys.muted=!AudioSys.muted;
  try{localStorage.setItem('lasr_mute',AudioSys.muted?'1':'0');}catch(err){}
 }
});
try{if(localStorage.getItem('lasr_mute')==='1')AudioSys.muted=true;}catch(e){}

/* ---------- background & render ---------- */
let bgGrad=null,bgKey='';
function startDemo(){
 Gdemo=true;G.screen='play';G.routeQueue=[0];G.routeIdx=0;G.bossIdx=0;
 G.score=0;G.dispScore=0;G.spellsPlayed=0;G.spellsCaptured=0;G.deaths=0;
 G.od=0;G.trance=0;G.streak=0;G.bestStreak=0;G.streakMult=1;G.sparksGot=0;G.spellHist=[];
 resetPlayer(true);PL.power=300;bgTint=ROUTES[0].tint;bgMode='';
 G.bannerText=ROUTES[0].title.toUpperCase();G.bannerT=80;
 if(typeof fetch==='function')fetchDynamicLine(BOSS_DEFS[ROUTES[0].bosses[0]]);
 startBgm(ROUTES[0].seed*77+13,140);
}
function endDemo(){
 Gdemo=false;G.screen='title';G.idleT=0;
 BOSS=null;eshots.length=0;pshots.length=0;items.length=0;
 fx.length=0;ftext.length=0;elasers.length=0;G.monoRay=null;
 stopBgm();
}
function routeBgKey(){
 const id=ROUTES[G.routeQueue[G.routeIdx]]?.id;
 return {S1:'route_s1',S2:'route_s2',S3:'route_s3',S4:'route_s3',S5:'route_s1',S6:'route_s2',EX:'route_ex',EXA:'route_ex'}[id]||null;
}
let _dynLine=null,_dynFetched=false;
function fetchDynamicLine(def){
 if(typeof fetch!=='function')return;
 _dynLine=null;_dynFetched=false;
 const stats={bossName:def.name,
  bossTheme:(def.atk.find(a=>a.n)||{}).n||'combat',
  deaths:G.deaths,grazes:PL.graze,captures:G.spellsCaptured,misses:G.spellsPlayed-G.spellsCaptured};
 fetch('/api/generate-dialog',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(stats)})
  .then(r=>r.json())
  .then(d=>{
   if(!d.line)return;
   _dynLine=d.line;_dynFetched=true;
   if(BOSS&&BOSS.dlg&&BOSS.state==='dialog'){
    for(let i=0;i<BOSS.dlg.length;i++){
     if(BOSS.dlg[i][0]==='b'){BOSS.dlg[i][1]=d.line;break;}
    }
   }
  }).catch(()=>{_dynFetched=true;});
}
const DIALOGS={
 kurohebi:[['b','Shadows remember every footstep, little spark.'],
  ['p','Then these should keep you busy.'],
  ['b','Let us see how long you dance before the curtain eats the light.']],
 amayui:[['b','It always rains where I grieve. Always.'],
  ['p','Then I will bring the umbrella of reason.']],
 hayakaze:[['b','Try to outrun the wind on two feet!'],
  ['p','Wind loses to a wall every time.']],
 hyakurei:[['b','A hundred legs. A hundred grudges. Count them if you can.'],
  ['p','I stopped counting at ten.']],
 kohaku:[['b','Let there be brilliance — and let it blind you.'],
  ['p','I brought shades. Bring it on.']],
 yomotsu:[['b','The candles are lit. The graves are listening.'],
  ['p','Good. Let them watch me win.']],
 setsu:[['b','The galaxy is a river of stars, and you cannot swim.'],
  ['p','Stars burn out. Rivers freeze. Next.']],
 souka:[['b','One perfect cut parts clouds, mountains… and challengers.'],
  ['p','Swords rust. Confidence does not.']],
 menou:[['b','Which face shall I wear for your funeral?'],
  ['p','Whichever one blushes when you lose.']],
 shiraha:[['b','I sealed the old sky and wrote this one in ink. You would unwrite creation?'],
  ['p','Your ink is already drying, guardian.'],
  ['b','Then come, heir of nothing. Let the reverie judge us both.'],
  ['p','With pleasure.']],
 kuuhaku:[['b','This world lost its color the day we stopped dreaming.'],
  ['p','Then take mine — I carry enough for both of us.'],
  ['b','Foolish. Radiant. Come.']]
};function drawBG(){
 const t=G.frame;
 const [r,g_,b_]=bgTint;
 G.beat=(Music.on&&Music.cfg)?(Music.step%4===0?1:.7*(1-(Music.step%4)/4)):0;
 const rk=(G.screen==='play'&&G.routeQueue.length)?routeBgKey():null;
 if(rk&&ASSETS[rk]){
  cx.globalAlpha=.20+.04*(G.beat||0);
  cx.drawImage(ASSETS[rk],0,0,W,H);
  cx.globalAlpha=1;
 }
 const key=r+'|'+g_+'|'+b_;
 const grd=cx.createLinearGradient(0,0,0,H);
 grd.addColorStop(0,`rgb(${r|0},${g_|0},${b_|0})`);
 grd.addColorStop(1,'#08080e');
 cx.fillStyle=grd;cx.globalAlpha=.72;cx.fillRect(0,0,W,H);cx.globalAlpha=1;
 for(let i=0;i<3;i++){
  cx.save();
  cx.globalCompositeOperation='lighter';
  cx.globalAlpha=.05+.045*G.beat;
  cx.fillStyle=['#3a8a70','#4a7ab8','#8a6ac8'][i];
  const yy=H*(.2+.2*i)+Math.sin(t/140+i*2.1)*22;
  cx.beginPath();cx.moveTo(0,yy);
  for(let x=0;x<=W;x+=40)cx.lineTo(x,yy+Math.sin(x/95+t/85+i*1.4)*15);
  cx.lineTo(W,yy+64);cx.lineTo(0,yy+58);cx.closePath();cx.fill();
  cx.restore();
 }
 if(G.trance>0){
  cx.save();cx.globalCompositeOperation='lighter';
  cx.strokeStyle=`rgba(120,200,255,${.25+.25*Math.sin(t/4)})`;cx.lineWidth=14+6*Math.sin(t/3);
  cx.strokeRect(4,4,W-8,H-8);
  cx.restore();
 }
 const dir=bgMode==='back'?-1:1;
 for(const s of stars){
  s.y+=dir*s.v*(bgMode==='neg'?2:1)*(.5+s.l*.45);
  if(s.y>H)s.y-=H;if(s.y<0)s.y+=H;
  cx.globalAlpha=.18+s.s*.2+s.l*.08;
  cx.fillStyle=s.l===2?'#fff':'#cfe0ff';
  cx.fillRect(s.x,s.y,s.s,s.s*2);
 }
 cx.globalAlpha=1;
 cx.globalCompositeOperation='lighter';
 cx.globalAlpha=.45+.35*G.beat;
 const nx=(t/90)%640,ny=(t/140)%480;
 cx.drawImage(nebula,-nx,-ny);cx.drawImage(nebula,640-nx,-ny);
 cx.drawImage(nebula,-nx-320,-160);cx.drawImage(nebula,-nx+200,300);
 cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
 if(PL.y<150&&G.frame%14<7){
  cx.strokeStyle='rgba(255,215,0,.35)';cx.lineWidth=1;
  cx.setLineDash([8,10]);
  cx.beginPath();cx.moveTo(0,150);cx.lineTo(W,150);cx.stroke();
  cx.setLineDash([]);
 }
 if(bgMode==='fog'){
  cx.fillStyle=`rgba(120,160,255,${.10+.05*Math.sin(t/60)})`;
  cx.fillRect(0,0,W,H);
 }
 if(bgMode==='neg'){
  cx.fillStyle=`rgba(255,255,255,${.04+.03*Math.sin(t/23)})`;
  cx.fillRect(0,0,W,H);
 }
 cx.strokeStyle='rgba(255,255,255,.07)';cx.lineWidth=2;
 cx.strokeRect(1,1,W-2,H-2);
 cx.drawImage(vig,0,0);
}
let _fmtCache=-1,_fmtStr='';
function fmtScore(n){if(n===_fmtCache)return _fmtStr;_fmtCache=n;_fmtStr=String(n).padStart(11,'0');return _fmtStr;}
const nameWCache=new Map();
function drawDialogBox(){
 if(!BOSS||!BOSS.dlg)return;
 const line=BOSS.dlg[BOSS.dgi];if(!line)return;
 const [who,text]=line;
 const bx=20,by=H-96,bw=W-40,bh=78;
 cx.save();
 cx.fillStyle='rgba(4,6,18,.88)';cx.fillRect(bx,by,bw,bh);
 cx.strokeStyle=who==='b'?(typeof BOSS.cutinCol==='string'?BOSS.cutinCol:BOSS.col[0]):'#7fdfff';
 cx.lineWidth=1.5;cx.strokeRect(bx,by,bw,bh);
 cx.font='16px "Pixel8",monospace';cx.textAlign='left';cx.textBaseline='top';
 cx.fillStyle=who==='b'?BOSS.col[1]:'#7fdfff';
 cx.fillText(who==='b'?BOSS.name.toUpperCase():'SUZURAN',bx+14,by+8);
 cx.font='20px "VT323R",monospace';cx.fillStyle='#fff';
 const shown=text.slice(0,BOSS.dShown);
 const maxChars=52;
 let y=by+30;
 for(let i=0;i<shown.length;i+=maxChars){cx.fillText(shown.slice(i,i+maxChars),bx+16,y);y+=24;}
 if(Math.floor(G.frame/12)%2===0){
  cx.fillStyle='#ffd0d0';cx.textAlign='right';
  cx.fillText('▼ Z',bx+bw-14,by+bh-22);
 }
 cx.restore();
}
function drawHUD(){
 cx.font='12px "Pixel8",monospace';cx.textAlign='right';cx.textBaseline='top';
 cx.fillStyle='#fff';
 cx.fillText(fmtScore(Math.floor(G.dispScore)),W-14,10);
 const uw=90+40*G.beat;
 cx.fillStyle=`rgba(140,190,255,${.35+.45*G.beat})`;
 cx.fillRect(W-14-uw,26,uw,2);
 if(AudioSys.muted){cx.fillStyle='#f80';cx.font='bold 10px monospace';cx.fillText('♪ MUTED',W-14,44);}
 cx.fillStyle='#9ab';
 cx.fillText('HI '+fmtScore(Math.max(G.hi,G.score)),W-14,28);
 if(autoFire){cx.fillStyle='#8f8';cx.font='bold 10px monospace';cx.fillText('AUTO',W-14,44);}
 if(showFps&&fpsVal>0){cx.fillStyle='#89f';cx.font='11px monospace';cx.fillText(fpsVal+' fps',W-14,58);}
 if(BOSS&&!BOSS.dying){
  if(BOSS.warnT>0&&BOSS.state==='enter'){
   const wp=1-BOSS.warnT/96;
   cx.save();
   const warn=ASSETS.fx_warning;
   if(warn){
    for(const yy of [H*.30,H*.62]){
     cx.globalAlpha=.55+.25*Math.sin(G.frame/7);
     cx.drawImage(warn,0,yy,W,26);
    }
    cx.globalAlpha=wp;
    cx.fillStyle='#fff';cx.font='bold 46px monospace';cx.textAlign='center';
    if(Math.floor(G.frame/10)%2===0)cx.fillText('W A R N I N G',W/2,H*.44);
    cx.font='bold 15px monospace';
    cx.fillText('A GREAT PRESENCE APPROACHES',W/2,H*.44+34);
   }else{
    for(const yy of [H*.28,H*.66]){
     cx.globalAlpha=.5*Math.abs(Math.sin(G.frame/9));
     cx.fillStyle='#f80';
     for(let x=-40;x<W+40;x+=32)cx.fillRect(x+(G.frame*3)%32,yy,16,4);
     cx.fillStyle='#fd0';
     for(let x=-40;x<W+40;x+=32)cx.fillRect(x+16-(G.frame*3)%32,yy+8,16,4);
    }
    cx.globalAlpha=wp;
    cx.fillStyle='#fff';cx.font='bold 46px monospace';cx.textAlign='center';
    if(Math.floor(G.frame/10)%2===0)cx.fillText('W A R N I N G',W/2,H*.44);
   }
   cx.restore();
  }
  const bw=W-220;
  const ratio=clamp(BOSS.hp/BOSS.maxHp,0,1);
  const disp=BOSS.hpDisp===undefined?ratio:clamp(BOSS.hpDisp,0,1);
  cx.fillStyle='rgba(0,0,0,.45)';cx.fillRect(12,12,bw+8,26);
  const lowFlash=ratio<.25&&Math.floor(G.frame/8)%2===0;
  cx.fillStyle='#fff';cx.fillRect(16,16,bw*disp,18);
  cx.fillStyle=lowFlash?'#ffe0e0':BOSS.col[0];
  cx.fillRect(16,16,bw*ratio,18);
  cx.strokeStyle='rgba(255,255,255,.35)';
  for(let i=1;i<10;i++){cx.beginPath();cx.moveTo(16+bw*i/10,16);cx.lineTo(16+bw*i/10,34);cx.lineWidth=1;cx.stroke();}
  cx.strokeStyle='#fff';cx.lineWidth=1;cx.strokeRect(16,16,bw,18);
  cx.fillStyle='#fff';cx.font='bold 13px monospace';cx.textAlign='left';cx.textBaseline='alphabetic';
  const left=BOSS.leftInRoute>1?`  (${BOSS.leftInRoute} bosses left)`:'';
  cx.fillText(BOSS.name+left,18,31);
  const tm=Math.ceil(BOSS.timer/60);
  cx.textAlign='center';cx.font='16px "Pixel8",monospace';
  if(tm<=10){cx.globalAlpha=.55+.45*Math.abs(Math.sin(G.frame/5));cx.fillStyle='#ff5050';}
  else cx.fillStyle='#fff';
  cx.fillText(String(tm).padStart(2,'0'),W-46,76);
  cx.globalAlpha=1;cx.textBaseline='top';
  if(BOSS.atk&&BOSS.atk.n){
   cx.font='11px "Pixel8",monospace';cx.textAlign='center';
   const nm=BOSS.cutinName||'';
   if(!nameWCache.has(nm))nameWCache.set(nm,cx.measureText(nm).width);
   const tw=nameWCache.get(nm);
   cx.fillStyle='rgba(0,0,10,.62)';
   cx.fillRect(W/2-tw/2-12,40,tw+24,24);
   cx.fillStyle=typeof BOSS.cutinCol==='string'?BOSS.cutinCol:'#fff';
   cx.strokeStyle='rgba(255,255,255,.25)';cx.lineWidth=1;
   cx.strokeRect(W/2-tw/2-12,40,tw+24,24);
   cx.textBaseline='middle';cx.fillText(nm,W/2,52);cx.textBaseline='top';
  }
 }
 cx.textAlign='left';cx.font='18px "VT323R",monospace';
 let ly=H-96;
 const lifeGem=ASSETS.gem_life,bombGem=ASSETS.gem_bomb;
 if(lifeGem){
  for(let i=0;i<clamp(PL.lives,0,8);i++){
   const pulse=(G.livesPulse>0&&i===PL.lives-1)?1.35:1;
   cx.drawImage(lifeGem,14+i*18,ly-4,16*pulse,16*pulse);
  }
 }else{
  for(let i=0;i<clamp(PL.lives,0,8);i++){
   cx.fillStyle='#ffd700';cx.beginPath();
   cx.moveTo(20+i*18,ly);cx.lineTo(26+i*18,ly+11);cx.lineTo(14+i*18,ly+11);
   cx.closePath();cx.fill();
  }
 }
 ly+=22;
 if(bombGem){
  for(let i=0;i<clamp(PL.spells,0,4);i++)
   cx.drawImage(bombGem,12+i*18,ly-4,15,15);
 }else{
  for(let i=0;i<clamp(PL.spells,0,4);i++){
   const sx=18+i*18;
   cx.fillStyle='#7fdfff';cx.fillRect(sx-5,ly,10,10);
   cx.fillRect(sx-2,ly-3,4,16);
  }
 }
 const pw=(PL.power/500)*90;
 cx.fillStyle='#333';cx.fillRect(14,ly+2,92,10);
 cx.fillStyle='#ff5060';cx.fillRect(14,ly+2,pw,10);
 cx.strokeStyle='#888';cx.strokeRect(14,ly+2,92,10);
 cx.fillStyle='#aaa';cx.font='bold 10px monospace';
 cx.fillText('POWER '+Math.floor(PL.power/100),112,ly+3);
 ly+=24;
 const fw=(PL.flash/PL.flashMax)*140;
 const ready=PL.flash>=PL.flashMax;
 if(ready){cx.save();cx.shadowColor='#8cf';cx.shadowBlur=10+6*Math.sin(G.frame/5);}
 cx.fillStyle='#222';cx.fillRect(14,ly,144,12);
 cx.fillStyle=ready?'#ffffff':'#58a6ff';
 cx.fillRect(14,ly,fw,12);
 if(ready&&Math.floor(G.frame/12)%2===0){cx.fillStyle='#fff';cx.fillRect(14,ly,fw,12);}
 cx.strokeStyle=ready?'#dff':'#666';cx.strokeRect(14,ly,144,12);
 if(ready)cx.restore();
 cx.fillStyle=ready?'#fff':'#9cf';cx.font='bold 10px monospace';
 cx.fillText(ready?'FLASH READY — X!':'FLASH '+PL.graze+' graze',162,ly+2);
 ly+=20;
 const ow=(G.od/G.odMax)*140;
 cx.fillStyle='#222';cx.fillRect(14,ly,144,9);
 cx.fillStyle=G.trance>0?(Math.floor(G.frame/4)%2?'#aef':'#fff'):'#7f6cff';
 cx.fillRect(14,ly,G.trance>0?(G.trance/330)*144:ow,9);
 cx.strokeStyle='#666';cx.strokeRect(14,ly,144,9);
 cx.fillStyle=G.trance>0?'#dff':'#a8f';cx.font='bold 10px monospace';
 cx.fillText(G.trance>0?'OVERDRIVE ×1.5 DMG':'OD '+G.od+'/'+G.odMax+' (graze)',162,ly);
 if(G.streak>1){
  cx.textAlign='right';cx.fillStyle='#ffd700';cx.font='bold 15px monospace';
  cx.fillText('STREAK ×'+G.streakMult.toFixed(2)+'  ('+G.streak+')',W-14,66);
 }
 if(G.spellHist.length){
  let hx=16;
  for(const cap of G.spellHist){
   cx.fillStyle=cap?'#6f6':'#f55';
   cx.beginPath();cx.arc(hx,H-12,3.2,0,TAU);cx.fill();
   hx+=10;
  }
 }
 if(G.screen==='play'&&G.routeQueue.length&&G.routeQueue[G.routeIdx]!==undefined){
  cx.textAlign='right';cx.fillStyle='#889';
  const R=ROUTES[G.routeQueue[G.routeIdx]];
  cx.fillText(R.title+'  '+(G.routeIdx+1)+'/'+G.routeQueue.length,W-14,H-20);
 }
}

function drawCutin(){
 if(!BOSS||BOSS.cutin<=0)return;
 const p=BOSS.cutin;
 if(ASSETS.fx_bosscharge&&p>60){
  cx.save();cx.globalCompositeOperation='lighter';cx.globalAlpha=.4+.2*Math.sin(G.frame/5);
  cx.drawImage(ASSETS.fx_bosscharge,W/2-90,H*.35,180,180);
  cx.restore();
 }
 let slide=0,alpha=1;
 if(p>110)alpha=(140-p)/30;
 if(p<30){slide=(30-p)*(30-p)*1.1;alpha=p/30;}
 const col=typeof BOSS.cutinCol==='string'?BOSS.cutinCol:BOSS.col[0];
 cx.save();
 cx.globalAlpha=alpha;
 for(let i=0;i<10;i++){
  const ly=(i*53+G.frame*7)%520-20;
  cx.globalAlpha=alpha*.14;cx.fillStyle='#fff';
  cx.fillRect(-40+((i*97)%60),ly,W+80,2+(i%3));
 }
 cx.globalAlpha=.85*Math.min(alpha*2,1);
 const grd=cx.createLinearGradient(0,H*.4,0,H*.75);
 grd.addColorStop(0,col);grd.addColorStop(1,'#000');
 cx.fillStyle=grd;
 cx.beginPath();cx.moveTo(-40,H);cx.lineTo(W+40,150);cx.lineTo(W+40,240);cx.lineTo(-40,H+90);cx.closePath();cx.fill();
 cx.globalAlpha=alpha;
 cx.fillStyle='#000';
 cx.beginPath();cx.moveTo(-40,H+6);cx.lineTo(W+40,156);cx.lineTo(W+40,166);cx.lineTo(-40,H+96);cx.closePath();cx.fill();
 const nm=BOSS.cutinName||'';
 const reveal=Math.floor(nm.length*clamp((140-p)/50,0,1));
 const shown=nm.slice(0,Math.max(1,reveal));
 cx.translate(0,slide*-.6);
 cx.rotate(-Math.PI/22);
 cx.textAlign='center';
 cx.save();
 cx.shadowColor=col;cx.shadowBlur=18;
 cx.font='bold 34px monospace';
 cx.fillText(shown+'_',W/2,H/2+6);
 cx.restore();
 const px=W-118;
 cx.save();
 cx.translate(px,190);
 cx.strokeStyle=col;cx.lineWidth=2;cx.globalAlpha=alpha*.8;
 cx.strokeRect(-52,-64,104,128);
 cx.beginPath();cx.arc(0,-8,34,0,TAU);cx.stroke();
 cx.beginPath();cx.arc(0,-8,26,0,TAU);cx.stroke();
 cx.fillStyle='#fff';cx.font='bold 44px monospace';cx.textAlign='center';cx.textBaseline='middle';
 cx.fillText(BOSS.name?BOSS.name[0]:'?',0,-6);
 cx.font='bold 12px monospace';
 cx.fillText(BOSS.name.toUpperCase().slice(0,13),0,42);
 cx.restore();
 cx.restore();
}

function drawScreen(){
 cx.setTransform(1,0,0,1,0,0);
 if(G.screen==='play'||G.screen==='pause'){
  cx.save();
  if(shakeT>0)cx.translate(rnd(-shakeM,shakeM),rnd(-shakeM,shakeM));
  drawBG();
  if(G.screen==='play'){
   drawEntities();
   drawBoss();
  }
  cx.restore();
  drawHUD();
  drawCutin();
  if(BOSS&&BOSS.state==='dialog')drawDialogBox();
  if(G.bannerT>0){
   const p=1-Math.abs(G.bannerT-65)/65;
   cx.save();cx.globalAlpha=clamp(p,0,1);
   cx.fillStyle='#fff';cx.font='bold 44px monospace';cx.textAlign='center';
   cx.fillText(G.bannerText,W/2,H/2-40);
   cx.fillStyle='#89f';cx.font='bold 16px monospace';
   cx.fillText(DIFFS[DIFF].toUpperCase()+'  ·  '+ROUTES[G.routeQueue[G.routeIdx]].bosses.length+' BOSSES',W/2,H/2+8);
   cx.restore();
  }
  if(flashA>0){cx.globalAlpha=clamp(flashA,0,1);cx.fillStyle=flashC;cx.fillRect(0,0,W,H);cx.globalAlpha=1;}
  if(G.screen==='pause')drawPause();
  if(Gdemo){
   cx.save();cx.textAlign='center';
   cx.globalAlpha=.25+.1*Math.sin(G.frame/20);
   cx.fillStyle='#fff';cx.font='bold 42px monospace';
   cx.fillText('D E M O',W/2,H/2-10);
   cx.font='14px "VT323R",monospace';
   cx.fillText('PRESS ANY KEY TO PLAY',W/2,H/2+22);
   cx.restore();
  }
 }else{
  cx.fillStyle='#05050a';cx.fillRect(0,0,W,H);
  if(ASSETS.bg_menubg){cx.globalAlpha=.30;cx.drawImage(ASSETS.bg_menubg,0,0,W,H);cx.globalAlpha=1;}
  for(const s of stars){cx.globalAlpha=.3*s.s*.3;cx.fillStyle='#89f';cx.fillRect(s.x,(s.y+G.frame*s.v)%H,1.4,1.4);}
  cx.globalAlpha=1;
  drawPetals(.75);
  if(G.screen==='title')drawTitle();
  else if(G.screen==='diff')drawDiff();
  else if(G.screen==='sel')drawSel();
  else if(G.screen==='gameover')drawGameover();
  else if(G.screen==='result')drawResult();
 }
}

/* ---------- screens ---------- */
function bigTitle(y){
 cx.textAlign='center';
 if(ASSETS.ui_title){
  cx.save();cx.globalAlpha=.30;
  const w=340,h=w*(ASSETS.ui_title.height/ASSETS.ui_title.width);
  cx.drawImage(ASSETS.ui_title,W/2-w/2,y-h-6,w,h);
  cx.restore();
 }
 cx.save();cx.translate(W/2,y);
 const shim=(Math.sin(G.frame/40)+1)/2;
 cx.fillStyle='#fff';cx.font='26px "Pixel8",monospace';
 cx.shadowColor='#5af';cx.shadowBlur=24+14*shim;
 cx.fillText('SHATTERED REVERIE',0,0);
 cx.globalCompositeOperation='lighter';
 cx.globalAlpha=.25+.35*shim;
 cx.fillStyle='#9cf';
 cx.fillRect(-260+(G.frame%400),-30,22,40);
 cx.globalAlpha=1;cx.globalCompositeOperation='source-over';cx.shadowBlur=0;
 cx.fillStyle='#89f';cx.font='bold 19px monospace';
 cx.fillText('~ Ballad of the Borderless Sky ~',0,32);
 cx.restore();
}
function drawTitle(){
 bigTitle(170);
 blinkText('PRESS  Z',H/2+90,26);
 cx.fillStyle='#567';cx.font='bold 13px monospace';cx.textAlign='center';
 cx.fillText('A ground-up tribute build · procedural everything · no assets',W/2,H-46);
 cx.fillStyle='#445';
 cx.fillText('HI-SCORE '+fmtScore(G.hi),W/2,H-24);
}
function blinkText(s,y,sz){
 if(Math.floor(G.frame/26)%2===0)return void(cx.fillStyle='#dff');
 cx.fillStyle='#fff';cx.font=`bold ${sz}px monospace`;cx.textAlign='center';
 cx.fillText(s,W/2,y);
}
function menuFrame(title){
 cx.textAlign='center';cx.fillStyle='#fff';cx.font='bold 30px monospace';
 cx.fillText(title,W/2,90);
 cx.strokeStyle='#345';cx.strokeRect(70,120,W-140,270);
}
function drawDiff(){
 menuFrame('SELECT DIFFICULTY');
 DIFFS.forEach((d,i)=>{
  const sel=i===G.diffCursor,wip=i!==1?'':'';
  cx.font='26px "VT323R",monospace';
  cx.fillStyle=sel?'#ffd0d0':'#888';
  cx.fillText((sel?'▶ ':'　 ')+d+(wip),W/2-40,170+i*56);
 });
 cx.fillStyle='#567';cx.font='bold 12px monospace';
 cx.fillText('Z confirm',W/2,H-60);
}
function drawSel(){
 menuFrame('SELECT STAGE');
 ROUTES.forEach((r,i)=>{
  const sel=i===G.selCursor,on=G.selFlags[i];
  cx.font='24px "VT323R",monospace';
  if(sel)cx.fillStyle=on?'#c88':'#ffd0d0';
  else cx.fillStyle=on?'#789':'#ccc';
  cx.textAlign='left';
  cx.fillText((sel?'▶ ':'　 ')+(on?'■ ':'□ ')+r.title,150,150+i*27);
 });
 cx.textAlign='left';cx.font='24px "VT323R",monospace';
 const sel=ROUTES.length===G.selCursor,all=ROUTES.length+1===G.selCursor;
 if(all){cx.fillStyle='#ffd0d0';cx.fillText('▶ SELECT ALL',150,150+ROUTES.length*27);}
 else{cx.fillStyle=sel?'#ffd0d0':'#888';cx.fillText((sel?'▶ ':'　 ')+'SELECT ALL',150,150+ROUTES.length*27);}
 {
  const i=ROUTES.length+1,sel2=i===G.selCursor;
  cx.fillStyle=sel2?'#ffd0d0':'#888';
  cx.fillText((sel2?'▶ ':'　 ')+'START',150,150+i*27);
 }
 cx.textAlign='center';cx.fillStyle='#567';cx.font='bold 12px monospace';
 cx.fillText('Z toggle / start · select at least one stage',W/2,H-60);
}
function drawPause(){
 cx.fillStyle='rgba(0,0,10,.72)';cx.fillRect(0,0,W,H);
 cx.fillStyle='#fff';cx.font='bold 34px monospace';cx.textAlign='center';
 cx.fillText('PAUSE',W/2,140);
 ['Resume','Restart Stage','Return to Title'].forEach((s,i)=>{
  const sel=i===G.pauseCursor;
  cx.font='26px "VT323R",monospace';
  cx.fillStyle=sel?'#ffd0d0':'#999';
  cx.fillText((sel?'▶ ':'　 ')+s,W/2,190+i*44);
 });
 cx.textAlign='left';cx.font='18px "VT323R",monospace';cx.fillStyle='#aab';
 const st=[['Score',fmtScore(G.score)],['Graze',PL.graze],['Deaths',G.deaths],
  ['Spells Captured',G.spellsCaptured+' / '+G.spellsPlayed],['Difficulty',DIFFS[DIFF]]];
 st.forEach(([k,v],i)=>{cx.fillText(k+': ',60,150+i*22);cx.fillStyle='#fff';cx.fillText(String(v),200,150+i*22);cx.fillStyle='#aab';});
}
function drawGameover(){
 cx.fillStyle='rgba(20,0,10,.55)';cx.fillRect(0,0,W,H);
 cx.fillStyle='#f66';cx.font='bold 46px monospace';cx.textAlign='center';
 cx.fillText('GAME OVER',W/2,190);
 blinkText('Z retry stage     X title',260,22);
 cx.fillStyle='#99a';cx.font='bold 15px monospace';
 cx.fillText('SCORE '+fmtScore(G.score),W/2,310);
}
function drawResult(){
 cx.fillStyle='#fff';cx.font='bold 36px monospace';cx.textAlign='center';
 cx.fillText('RESULTS',W/2,90);
 const rows=[
  ['Spell Cards Played',G.spellsPlayed],
  ['Spell Cards Captured',G.spellsCaptured],
  ['Best Capture Streak','×'+(1+Math.max(0,G.bestStreak-1)*.25).toFixed(2)+' ('+G.bestStreak+')'],
  ['Sparks Collected',G.sparksGot],
  ['Deaths',G.deaths],
  ['Final Score',fmtScore(G.score)]
 ];
 rows.forEach(([k,v],i)=>{
  if(G.resultT<i*24+20)return;
  cx.textAlign='left';cx.fillStyle='#ccd';cx.font='25px "VT323R",monospace';
  cx.fillText(k,140,170+i*44);
  cx.textAlign='right';cx.fillStyle='#fff';
  cx.fillText(String(v),430,170+i*44);
 });
 if(G.resultT>120){
  const ri=rankInfo();
  cx.textAlign='left';cx.fillStyle='#ccd';cx.font='25px "VT323R",monospace';
  cx.fillText('Spell Clear Rate',140,170+4*44);
  cx.textAlign='right';
  if(G.resultT<160){
   cx.fillStyle='#fff';cx.font='25px "VT323R",monospace';
   cx.fillText(irnd(0,99)+'%',430,170+4*44);
  }else{
   cx.fillStyle=ri.c;cx.font='bold 26px monospace';
   cx.fillText(ratePct()+'%',430,170+4*44);
   cx.textAlign='center';
   cx.save();cx.translate(548,240);
   cx.shadowColor=ri.c;cx.shadowBlur=26;
   cx.fillStyle=ri.c;cx.font='bold 84px monospace';
   cx.fillText(ri.r,0,0);cx.restore();
   cx.fillStyle='#fff';cx.font='bold 15px monospace';
   const words=ri.t.split(' ');let line='',yy=286;
   for(const w of words){
    if((line+' '+w).trim().length>12){cx.fillText(line.trim(),548,yy);yy+=18;line=w;}
    else line+=' '+w;
   }
   if(line.trim())cx.fillText(line.trim(),548,yy);
  }
 }
 if(G.resultT>200)blinkText('Z — back to title',H-70,18);
}

/* ---------- boot/loop ---------- */
let acc=0,last=performance.now();
function frame(now){
 requestAnimationFrame(frame);
 acc+=Math.min(now-last,100);last=now;
 fpsFrames++;
 if(now-fpsTime>=1000){fpsVal=Math.round(fpsFrames*1000/(now-fpsTime));fpsFrames=0;fpsTime=now;}
 while(acc>=1000/60){
  acc-=1000/60;
  G.frame++;
  updatePetals();
   if(hitK(KEY.ESC)){
    if(G.screen==='play'){G.screen='pause';G.pauseCursor=0;sfx('cur');}
    else if(G.screen==='pause'){G.screen='play';}
   }
   if(hitK(188))setMusicVol(musicVolIdx-1);
   if(hitK(65)){autoFire=!autoFire;sfx("cur");}
   if(hitK(70)){showFps=!showFps;}
   if(hitK(190))setMusicVol(musicVolIdx+1);
  if(G.freeze>0){G.freeze--;clearEdges();continue;}
  if(G.screen==='play')updatePlay();
  else updateMenus();
  clearEdges();
 }
 drawScreen();
}
requestAnimationFrame(frame);
loadAssets();
startBgm(999,118);
