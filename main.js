"use strict";
 const G={score:0,hi:0,dispScore:0,spellsPlayed:0,spellsCaptured:0,deaths:0,hits:0,
 routeQueue:[],routeIdx:0,bossIdx:0,screen:'title',frame:0,freeze:0,spellBombUsed:false,lastBonusLost:false,
 selFlags:new Array(ROUTES.length).fill(false),selCursor:0,diffCursor:1,pauseCursor:0,pauseConfirm:null,
 settingsCursor:0,settingsFrom:'title',helpFrom:'title',
 bannerT:0,bannerText:'',monoRay:null,resultT:0,livesPulse:0,newHi:false,oneCCFailed:false,
 shakeEnabled:true,bloomEnabled:true,flashEnabled:true,aiDialogue:true,
 od:0,odMax:80,trance:0,streak:0,bestStreak:0,streakMult:1,sparksGot:0,spellUsedOwn:0,
 spellHist:[],beat:0,dim:0,oneCC:false,creditsUsed:0,story:false,needWave:false,wave:null};
try{G.hi=parseInt(localStorage.getItem('lasr_hi')||'0')||0;
 const d=parseInt(localStorage.getItem('lasr_diff')||'1');if(d>=0&&d<=2)DIFF=d;}catch(e){}
G.diffCursor=clamp(DIFF,0,2);

const SETTINGS_ITEMS=[
 {k:'musicVol',label:'Music Volume'},
 {k:'sfxVol',label:'SFX Volume'},
 {k:'mute',label:'Mute All'},
 {k:'shake',label:'Screen Shake'},
 {k:'bloom',label:'Bloom'},
 {k:'flash',label:'Screen Flash'},
 {k:'autoFire',label:'Auto-Fire'},
 {k:'showFps',label:'Show FPS'},
 {k:'aiDialogue',label:'AI Boss Dialogue'},
 {k:'back',label:'Back'}
];
const settings={musicVol:musicVolIdx,sfxVol:sfxVolIdx,mute:false,shake:true,bloom:true,flash:true,
 autoFire:!!autoFire,showFps:!!showFps,aiDialogue:true};
function saveSettings(){try{localStorage.setItem('lasr_settings',JSON.stringify(settings));}catch(e){}}
function applySettings(){
 G.shakeEnabled=settings.shake!==false;
 G.bloomEnabled=settings.bloom!==false;
 G.flashEnabled=settings.flash!==false;
 G.aiDialogue=settings.aiDialogue!==false;
 autoFire=!!settings.autoFire;showFps=!!settings.showFps;
 setMusicVol(settings.musicVol,true);setSfxVol(settings.sfxVol,true);
}
function loadSettings(){
 try{
  if(localStorage.getItem('lasr_mute')==='1')AudioSys.muted=true;
  const raw=JSON.parse(localStorage.getItem('lasr_settings')||'null');
  if(raw&&typeof raw==='object'){
   if(Number.isFinite(raw.musicVol))settings.musicVol=clamp(raw.musicVol|0,0,VOL_STEPS.length-1);
   if(Number.isFinite(raw.sfxVol))settings.sfxVol=clamp(raw.sfxVol|0,0,SFX_STEPS.length-1);
   for(const k of ['mute','shake','bloom','flash','autoFire','showFps','aiDialogue'])
    if(typeof raw[k]==='boolean')settings[k]=raw[k];
  }
 }catch(e){}
 settings.mute=!!AudioSys.muted;
 applySettings();
}
function toggleMute(){
 AudioSys.muted=!AudioSys.muted;
 settings.mute=AudioSys.muted;
 try{localStorage.setItem('lasr_mute',AudioSys.muted?'1':'0');}catch(e){}
 saveSettings();
}
loadSettings();

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

function saveHi(){if(G.score>G.hi){G.hi=G.score;G.newHi=true;try{localStorage.setItem('lasr_hi',String(G.hi));}catch(e){}}}
function spendCredit(){if(G_coins<=0)return false;G_coins--;G.creditsUsed=(G.creditsUsed||0)+1;return true;}
function goTitle(saveScore=true){
 if(saveScore)saveHi();
 TouchUI.focus=false;TouchUI.resetStick();
 Gdemo=false;G.screen='title';G.idleT=0;G.pauseConfirm=null;G.bannerT=0;
 BOSS=null;resetFieldSafe();fx.length=0;ftext.length=0;G.monoRay=null;
 G.wave=null;G.needWave=false;
 startTitleBgm();
}

function startRun(){
 G.routeQueue=[];
 if(G.oneCC)ROUTES.forEach((r,i)=>{G.routeQueue.push(i);});
 else ROUTES.forEach((r,i)=>{if(G.selFlags[i])G.routeQueue.push(i);});
 if(!G.routeQueue.length)return;
 G.routeIdx=-1;G.bossIdx=0;G.score=0;G.dispScore=0;G.spellsPlayed=0;G.spellsCaptured=0;G.deaths=0;
 G.od=0;G.trance=0;G.streak=0;G.bestStreak=0;G.streakMult=1;G.sparksGot=0;G.spellHist=[];
 G.creditsUsed=0;G.oneCCFailed=false;G.newHi=false;G.pauseConfirm=null;G.resultT=0;G.spellUsedOwn=0;
 G_coins=G.oneCC?1:3;
 TouchUI.focus=false;TouchUI.resetStick();
 BOSS=null;resetFieldSafe();fx.length=0;ftext.length=0;G.monoRay=null;
 G.wave=null;G.needWave=!!G.story;mobs.length=0;
 resetPlayer(true);PL.graze=0;PL.power=300;
 nextRoute();
}
function nextRoute(){
 G.routeIdx++;G.bossIdx=0;
 const R=ROUTES[G.routeQueue[G.routeIdx]];
 bgTint=R.tint;bgMode=R.mode||'';
 mobs.length=0;G.wave=null;G.needWave=!!G.story;
 PL.lives=Math.min(8,PL.lives+ (G.routeIdx>0?1:0));
 PL.spells=2;PL.power=Math.max(PL.power,300);
 G.bannerText=R.title.toUpperCase();G.bannerT=130;
 G.screen='play';
 startStageBgm(R);
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
  else if(G.story&&!G.demo){G.needWave=true;}
  else beginBossFight();
 });
}
var G_coins=3,G_contRoute=0,G_contBoss=0;
function continueFromBoss(){
 if(!spendCredit())return;
 BOSS=null;resetFieldSafe();fx.length=0;ftext.length=0;G.monoRay=null;
 G.wave=null;G.needWave=false;mobs.length=0;G.pauseConfirm=null;
 resetPlayer(true);PL.inv=180;PL.power=Math.max(PL.power,300);
 G.routeIdx=clamp(G_contRoute,0,G.routeQueue.length-1);
 const R=ROUTES[G.routeQueue[G.routeIdx]];
 G.bossIdx=clamp(G_contBoss,0,R.bosses.length-1);
 bgTint=R.tint;bgMode=R.mode||'';
 G.bannerText='CONTINUE';G.bannerT=80;G.screen='play';
 startStageBgm(R);
 beginBossFight();
}
function onGameOver(){
 G_contRoute=G.routeIdx;G_contBoss=G.bossIdx;
 TouchUI.resetStick();
 saveHi();
 BOSS=null;resetFieldSafe();fx.length=0;ftext.length=0;G.monoRay=null;
 mobs.length=0;G.wave=null;G.needWave=false;
 stopBgm();
 if(G.oneCC){G.oneCCFailed=true;showResults();}
 else{G.screen='gameover';G.resultT=0;}
}
function showResults(){
 TouchUI.resetStick();
 BOSS=null;resetFieldSafe();fx.length=0;ftext.length=0;G.monoRay=null;
 mobs.length=0;G.wave=null;G.needWave=false;
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
 if(!Gdemo&&hitK(KEY.R)){G.screen='pause';G.pauseCursor=1;sfx('cur');return;}
 if(G.dispScore<G.score)G.dispScore=Math.min(G.score,G.dispScore+Math.max(1,Math.ceil((G.score-G.dispScore)*.18)));
 else G.dispScore=G.score;
 if(G.livesPulse>0)G.livesPulse--;
 if(G.trance>0){G.trance--;if(G.trance===0){G.od=0;}}
 playerUpdate();
 playerGrazeCheck();
 bossUpdate();
 mobUpdate();updateStoryWave();
 eUpdate();pUpdate();itemUpdate();laserUpdate();
 for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.life--;if(f.life<=0)fx.splice(i,1);}
 for(let i=ftext.length-1;i>=0;i--){const t=ftext[i];t.y+=t.vy;t.life--;if(t.life<=0)ftext.splice(i,1);}
 if(shakeT>0)shakeT--;
 if(flashA>0)flashA-=.06;
 if(G.bannerT>0)G.bannerT--;
 else if(G.story&&!Gdemo){
  if(!BOSS&&G.needWave&&!G.wave&&PL.dead!==2)startStoryWave();
  else if(!BOSS&&!G.needWave&&!G.wave&&G.bossIdx===0&&PL.dead!==2)beginBossFight();
 }
 else if(!BOSS&&G.bossIdx===0&&PL.dead!==2)beginBossFight();
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
   if(hitK(KEY.Z)||hitK(KEY.ENTER)){sfx('ok');G.screen='diff';G.idleT=0;}
   else if(hitK(83)){sfx('ok');G.settingsCursor=0;G.settingsFrom='title';G.screen='settings';}
   else if(hitK(72)){sfx('ok');G.helpFrom='title';G.screen='help';}
   break;
  case 'diff':
   G.diffCursor=menuNav(5,G.diffCursor);
   if(hitK(KEY.Z)||hitK(KEY.ENTER)){
    sfx('ok');
    if(G.diffCursor===3){DIFF=1;G.oneCC=true;G.story=false;startRun();}
    else if(G.diffCursor===4){DIFF=1;G.oneCC=false;G.story=true;G.screen='sel';}
    else{
     DIFF=G.diffCursor;G.oneCC=false;G.story=false;
     try{localStorage.setItem('lasr_diff',String(DIFF));}catch(e){}
     G.screen='sel';
    }
   }
   break;
  case 'sel':{
   const n=ROUTES.length+2;
   G.selCursor=menuNav(n,G.selCursor);
   if(hitK(KEY.Z)||hitK(KEY.ENTER)){
    if(G.selCursor<ROUTES.length){
     G.selFlags[G.selCursor]=!G.selFlags[G.selCursor];sfx('ok');
    }else if(G.selCursor===ROUTES.length){
     sfx('ok');G.selFlags.fill(true);
    }else if(G.selFlags.some(f=>f)){sfx('ok');startRun();}
    else sfx('no');
   }
   break;}
  case 'pause':
   if(G.pauseConfirm){
    if(hitK(KEY.Z)||hitK(KEY.ENTER)){
     if(G.pauseConfirm==='restart'){
      if(spendCredit()){if(G.oneCC)G.oneCCFailed=true;G.pauseConfirm=null;restartRoute();}
      else{sfx('no');G.pauseConfirm=null;}
     }else{G.pauseConfirm=null;goTitle();}
    }else if(hitK(KEY.X)){G.pauseConfirm=null;sfx('no');}
    break;
   }
   G.pauseCursor=menuNav(5,G.pauseCursor);
   if(hitK(KEY.Z)||hitK(KEY.ENTER)){
    sfx('ok');
    if(G.pauseCursor===0)G.screen='play';
    else if(G.pauseCursor===1){if(G_coins>0)G.pauseConfirm='restart';else sfx('no');}
    else if(G.pauseCursor===2){G.helpFrom='pause';G.screen='help';}
    else if(G.pauseCursor===3){G.settingsCursor=0;G.settingsFrom='pause';G.screen='settings';}
    else G.pauseConfirm='quit';
   }
   break;
  case 'gameover':
   G.resultT++;
   if(hitK(KEY.C)&&G_coins>0){sfx('ok');continueFromBoss();}
   else if((hitK(KEY.Z)||hitK(KEY.R))&&G_coins>0){sfx('ok');spendCredit();restartRoute();}
   else if(hitK(KEY.X)){sfx('no');goTitle();}
   break;
  case 'result':
   G.resultT++;
   if(G.resultT>90&&(hitK(KEY.Z)||hitK(KEY.ENTER))){
    sfx('ok');
   G.selFlags=new Array(ROUTES.length).fill(IS_TOUCH);
    goTitle();
   }
   break;
  case 'settings':{
   G.settingsCursor=menuNav(SETTINGS_ITEMS.length,G.settingsCursor);
   const it=SETTINGS_ITEMS[G.settingsCursor];
   const left=hitK(KEY.LEFT),right=hitK(KEY.RIGHT);
   let changed=false;
   if(it.k==='musicVol'&&(left||right)){
    settings.musicVol=clamp(settings.musicVol+(right?1:-1),0,VOL_STEPS.length-1);
    setMusicVol(settings.musicVol);changed=true;
   }else if(it.k==='sfxVol'&&(left||right)){
    settings.sfxVol=clamp(settings.sfxVol+(right?1:-1),0,SFX_STEPS.length-1);
    setSfxVol(settings.sfxVol);changed=true;
   }else if(hitK(KEY.Z)||hitK(KEY.ENTER)){
    sfx('ok');
    if(it.k==='back'){G.screen=G.settingsFrom;break;}
    if(it.k==='musicVol')settings.musicVol=(settings.musicVol+1)%VOL_STEPS.length;
    else if(it.k==='sfxVol')settings.sfxVol=(settings.sfxVol+1)%SFX_STEPS.length;
    else if(it.k==='mute')toggleMute();
    else settings[it.k]=!settings[it.k];
    applySettings();changed=true;
   }
   if(changed)saveSettings();
   break;}
  case 'help':
   if(hitK(KEY.Z)||hitK(KEY.ENTER)||hitK(KEY.X)){sfx('cur');G.screen=G.helpFrom;}
   break;
  }
}
function restartRoute(){
 BOSS=null;eshots.length=0;pshots.length=0;items.length=0;fx.length=0;ftext.length=0;elasers.length=0;
 mobs.length=0;G.wave=null;G.needWave=!!G.story;G.pauseConfirm=null;G.freeze=0;flashA=0;
 G.monoRay=null;resetPlayer(true);G.bossIdx=0;
 G.bannerText=ROUTES[G.routeQueue[G.routeIdx]].title.toUpperCase();G.bannerT=110;
 G.screen='play';
 startStageBgm(ROUTES[G.routeQueue[G.routeIdx]]);
}
addEventListener('keydown',e=>{
 G.idleT=0;
 if(e.keyCode===KEY.M)toggleMute();
});
function autoPause(){
 for(const k in keys)keys[k]=false;
 for(const k in edge)edge[k]=false;
 TouchUI.cancelTouches();
 if(G.screen==='play'&&!Gdemo){G.screen='pause';G.pauseCursor=0;G.pauseConfirm=null;}
}
addEventListener('blur',autoPause);
document.addEventListener('visibilitychange',()=>{if(document.hidden)autoPause();});

/* ---------- background & render ---------- */
let bgGrad=null,bgKey='';
function startDemo(){
 const ri=irnd(0,ROUTES.length-1);
 Gdemo=true;G.screen='play';G.routeQueue=[ri];G.routeIdx=0;G.bossIdx=0;
  TouchUI.focus=false;TouchUI.resetStick();
  G.oneCC=false;G.story=false;G.creditsUsed=0;G.oneCCFailed=false;
 G.score=0;G.dispScore=0;G.spellsPlayed=0;G.spellsCaptured=0;G.deaths=0;
 G.od=0;G.trance=0;G.streak=0;G.bestStreak=0;G.streakMult=1;G.sparksGot=0;G.spellHist=[];
 mobs.length=0;G.wave=null;G.needWave=false;
 resetPlayer(true);PL.power=300;
 const R=ROUTES[ri];bgTint=R.tint;bgMode=R.mode||'';
 G.bannerText=R.title.toUpperCase();G.bannerT=80;
 if(typeof fetch==='function')fetchDynamicLine(BOSS_DEFS[R.bosses[0]]);
 startStageBgm(R);
}
function endDemo(){goTitle(false);}
function routeBgKey(){
 const id=ROUTES[G.routeQueue[G.routeIdx]]?.id;
 return {S1:'route_s1',S2:'route_s2',S3:'route_s3',S4:'route_s3',S5:'route_s1',S6:'route_s2',EX:'route_ex',EXA:'route_ex'}[id]||null;
}
let _dynLine=null,_dynFetched=false;
function fetchDynamicLine(def){
 if(typeof fetch!=='function'||!G.aiDialogue)return;
 const bid=def&&def.id;
 _dynLine=null;_dynFetched=false;
 const stats={bossName:String(def.name||'').replace(/[^a-zA-Z0-9 \-']/g,'').substring(0,40),
  bossTheme:String((def.atk.find(a=>a.n)||{}).n||'combat').replace(/[<>&"';]/g,'').substring(0,60),
  deaths:Math.max(0,Math.min(999,G.deaths|0)),grazes:Math.max(0,Math.min(99999,PL.graze|0)),
  captures:Math.max(0,Math.min(999,G.spellsCaptured|0)),misses:Math.max(0,Math.min(999,(G.spellsPlayed-G.spellsCaptured)|0))};
 fetch('/api/generate-dialog',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(stats)})
  .then(r=>r.json())
   .then(d=>{
    if(!G.aiDialogue)return;
    if(!d.line||typeof d.line!=='string')return;
    const safe=d.line.replace(/[<>&"'\x00-\x1f\x7f]/g,'').substring(0,200);
    if(!safe)return;
    _dynLine=safe;_dynFetched=true;
    if(BOSS&&BOSS.def&&BOSS.def.id===bid&&BOSS.dlg&&BOSS.state==='dialog'){
     for(let i=0;i<BOSS.dlg.length;i++){
      if(BOSS.dlg[i][0]==='b'){BOSS.dlg[i][1]=safe;break;}
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
 if(key!==bgKey||!bgGrad){
  bgKey=key;bgGrad=cx.createLinearGradient(0,0,0,H);
  bgGrad.addColorStop(0,`rgb(${r|0},${g_|0},${b_|0})`);
  bgGrad.addColorStop(1,'#08080e');
 }
 cx.fillStyle=bgGrad;cx.globalAlpha=.72;cx.fillRect(0,0,W,H);cx.globalAlpha=1;
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
 const bx=20,by=H-116,bw=W-40,bh=100;
 cx.save();
 cx.fillStyle='rgba(4,6,18,.88)';cx.fillRect(bx,by,bw,bh);
 cx.strokeStyle=who==='b'?(typeof BOSS.cutinCol==='string'?BOSS.cutinCol:BOSS.col[0]):'#7fdfff';
 cx.lineWidth=1.5;cx.strokeRect(bx,by,bw,bh);
 cx.font='16px "Pixel8",monospace';cx.textAlign='left';cx.textBaseline='top';
 cx.fillStyle=who==='b'?BOSS.col[1]:'#7fdfff';
 cx.fillText(who==='b'?BOSS.name.toUpperCase():'SUZURAN',bx+14,by+8);
 cx.font='20px "VT323R",monospace';cx.fillStyle='#fff';
 const shown=text.slice(0,BOSS.dShown);
 const maxW=bw-32;
 const lines=[];
 let cur='';
 for(const word of shown.split(' ')){
  const test=cur?cur+' '+word:word;
  if(cur&&cx.measureText(test).width>maxW){
   lines.push(cur);cur=word;
   if(lines.length===3){cur='';break;}
  }else cur=test;
 }
 if(cur&&lines.length<3)lines.push(cur);
 lines.forEach((s,i)=>cx.fillText(s,bx+16,by+34+i*20));
 if(BOSS.dShown>=text.length&&Math.floor(G.frame/12)%2===0){
  cx.fillStyle='#ffd0d0';cx.textAlign='right';
   cx.fillText(IS_TOUCH?'▼ TAP':'▼ Z',bx+bw-14,by+10);
  }
  cx.restore();
 if(IS_TOUCH&&G.screen==='play')TouchUI.add(0,0,W,H,()=>{edge[KEY.Z]=true;},'dialog:advance');
}
function touchBtn(x,y,w,h,label,cb,opt={}){
 const on=opt.on!==false;
 cx.save();
 cx.fillStyle=on?(opt.fill||'rgba(10,18,34,.78)'):'rgba(10,18,34,.36)';
 cx.fillRect(x,y,w,h);
 cx.strokeStyle=on?(opt.col||'#7fdfff'):'#456';
 cx.lineWidth=opt.active?2.5:1.5;
 cx.strokeRect(x+.5,y+.5,w-1,h-1);
 cx.textAlign='center';cx.textBaseline='middle';
 cx.fillStyle=on?'#fff':'#777';
 cx.font=opt.font||'bold 13px monospace';
 cx.fillText(label,x+w/2,y+h/2+(opt.sub?-6:1));
 if(opt.sub){
  cx.font='bold 10px monospace';
  cx.fillStyle=on?(opt.subCol||'#9cf'):'#666';
  cx.fillText(opt.sub,x+w/2,y+h/2+11);
 }
 cx.restore();
 if(cb)TouchUI.add(x,y,w,h,cb,opt.id);
}
function touchCircle(x,y,r,label,sub,cb,opt={}){
 const on=opt.on!==false;
 cx.save();
 cx.beginPath();cx.arc(x,y,r,0,TAU);
 cx.fillStyle=on?'rgba(10,18,34,.74)':'rgba(10,18,34,.34)';cx.fill();
 cx.strokeStyle=on?(opt.col||'#7fdfff'):'#456';cx.lineWidth=2;cx.stroke();
 if(opt.progress!==undefined){
  cx.beginPath();cx.arc(x,y,r-5,-Math.PI/2,-Math.PI/2+TAU*clamp(opt.progress,0,1));
  cx.strokeStyle=on?'#fff':'#58a6ff';cx.lineWidth=4;cx.stroke();
 }
 cx.textAlign='center';cx.textBaseline='middle';
 cx.fillStyle=on?'#fff':'#777';cx.font='bold 11px monospace';
 cx.fillText(label,x,y-3);
 cx.font='bold 10px monospace';
 cx.fillStyle=on?(opt.subCol||'#9cf'):'#666';
 cx.fillText(sub,x,y+11);
 cx.restore();
 TouchUI.add(x-r,y-r,r*2,r*2,cb,opt.id);
}
function drawTouchPlayUI(){
 if(!IS_TOUCH||Gdemo||G.screen!=='play')return;
 const canBomb=!PL.dead&&bombsAvailable();
 const canSave=PL.dead&&PL.deathWindow>0;
 touchBtn(10,44,52,38,'II',()=>{
  TouchUI.resetStick();G.screen='pause';G.pauseCursor=0;G.pauseConfirm=null;sfx('cur');
 },{id:'play:pause',font:'bold 15px monospace',col:'#9ab'});
 if(BOSS&&BOSS.state==='dialog')return;
 touchBtn(W-252,H-180,80,32,'FOCUS',()=>{
  TouchUI.focus=!TouchUI.focus;sfx('cur');
 },{id:'play:focus',sub:TouchUI.focus?'ON':'OFF',active:TouchUI.focus,col:'#ffd700',font:'bold 11px monospace'});
 touchCircle(W-72,H-172,25,'SPELL',PL.dead?(canSave?'SAVE':'—'):'×'+PL.spells,()=>{
  AudioSys.unlock();
  if(PL.dead){if(PL.deathWindow>0)tryDeathbomb();return;}
  if(!canBomb){sfx('no');return;}
  if(!useSpell())sfx('no');
 },{id:'play:spell',on:PL.spells>0&&(canBomb||canSave),subCol:'#8cf'});
}
function ctrlCircle(o,label,sub,on,progress,col,subCol){
 cx.save();
 cx.beginPath();cx.arc(o.x,o.y,o.r,0,TAU);
 cx.fillStyle=on?'rgba(10,18,34,.72)':'rgba(10,18,34,.34)';cx.fill();
 cx.strokeStyle=on?(col||'#7fdfff'):'#456';cx.lineWidth=2;cx.stroke();
 if(progress!==undefined){
  cx.beginPath();cx.arc(o.x,o.y,o.r-5,-Math.PI/2,-Math.PI/2+TAU*clamp(progress,0,1));
  cx.strokeStyle=on?'#fff':'#58a6ff';cx.lineWidth=4;cx.stroke();
 }
 cx.textAlign='center';cx.textBaseline='middle';
 cx.fillStyle=on?'#fff':'#777';cx.font='bold 11px monospace';
 cx.fillText(label,o.x,o.y-3);
 cx.font='bold 10px monospace';
 cx.fillStyle=on?(subCol||'#9cf'):'#666';
 cx.fillText(sub,o.x,o.y+11);
 cx.restore();
}
function drawTouchController(){
 if(!TouchUI.visible())return;
 const S=TOUCH_CTRL.stick,F=TOUCH_CTRL.fire,B=TOUCH_CTRL.bomb,st=TouchUI.stick;
 cx.save();
 cx.globalAlpha=st.active?1:.82;
 cx.beginPath();cx.arc(S.x,S.y,S.r,0,TAU);
 cx.fillStyle='rgba(8,16,30,.58)';cx.fill();
 cx.strokeStyle=st.active?'#dff':'rgba(127,223,255,.68)';cx.lineWidth=2;cx.stroke();
 cx.globalAlpha=st.active?1:.72;
 cx.beginPath();cx.arc(S.x+st.kx,S.y+st.ky,S.knob,0,TAU);
 cx.fillStyle=st.active?'rgba(150,215,255,.88)':'rgba(90,140,190,.62)';cx.fill();
 cx.strokeStyle='#dff';cx.lineWidth=1.5;cx.stroke();
 cx.globalAlpha=1;
 ctrlCircle(F,'FIRE','',true,undefined,'#ff9fb0','#fcc');
 const inPlay=G.screen==='play';
 const canSave=inPlay&&PL.dead&&PL.deathWindow>0;
 const ready=inPlay&&PL.flash>=PL.flashMax;
 ctrlCircle(B,inPlay?'BOMB':'BACK',
  inPlay?(PL.dead?(canSave?'SAVE':'—'):(ready?'READY':PL.flash+'/'+PL.flashMax)):'',
  inPlay?(PL.dead?canSave:ready):true,
  inPlay?PL.flash/PL.flashMax:undefined,
  ready?'#fff':'#8fd8ff','#8cf');
 cx.restore();
}
function drawHUD(){
 cx.font='12px "Pixel8",monospace';cx.textAlign='right';cx.textBaseline='top';
 cx.fillStyle='#fff';
 cx.fillText(fmtScore(Math.floor(G.dispScore)),W-14,10);
 const uw=90+40*G.beat;
 cx.fillStyle=`rgba(140,190,255,${.35+.45*G.beat})`;
 cx.fillRect(W-14-uw,26,uw,2);
 cx.fillStyle='#9ab';cx.font='12px "Pixel8",monospace';
 cx.fillText('HI '+fmtScore(Math.max(G.hi,G.score)),W-14,28);
 const flags=[];
 if(AudioSys.muted)flags.push('MUTED');
 if(autoFire)flags.push('AUTO');
 if(flags.length){cx.fillStyle=AudioSys.muted?'#f80':'#8f8';cx.font='bold 10px monospace';cx.fillText(flags.join(' · '),W-14,44);}
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
 const lifeGem=ASSETS.gem_life,bombGem=ASSETS.gem_bomb;
 const rowLife=H-104,rowBomb=H-82,rowFlash=H-60,rowOD=H-38;
 if(lifeGem){
  for(let i=0;i<clamp(PL.lives,0,8);i++){
   const pulse=(G.livesPulse>0&&i===PL.lives-1)?1.35:1;
   cx.drawImage(lifeGem,14+i*18,rowLife,16*pulse,16*pulse);
  }
 }else{
  for(let i=0;i<clamp(PL.lives,0,8);i++){
   cx.fillStyle='#ffd700';cx.beginPath();
   cx.moveTo(20+i*18,rowLife+4);cx.lineTo(26+i*18,rowLife+15);cx.lineTo(14+i*18,rowLife+15);
   cx.closePath();cx.fill();
  }
 }
 if(!Gdemo){
  cx.fillStyle='#ffd700';cx.font='bold 11px monospace';
  cx.fillText('CREDIT ×'+G_coins,164,rowLife+2);
  if(G.creditsUsed>0){cx.fillStyle='#f88';cx.fillText('USED '+G.creditsUsed,246,rowLife+2);}
 }
 if(bombGem){
  for(let i=0;i<clamp(PL.spells,0,4);i++)
   cx.drawImage(bombGem,12+i*18,rowBomb,15,15);
 }else{
  for(let i=0;i<clamp(PL.spells,0,4);i++){
   const sx=18+i*18;
   cx.fillStyle='#7fdfff';cx.fillRect(sx-5,rowBomb+4,10,10);
   cx.fillRect(sx-2,rowBomb+1,4,16);
  }
 }
 const pw=(PL.power/500)*90;
 cx.fillStyle='#333';cx.fillRect(100,rowBomb+2,92,10);
 cx.fillStyle='#ff5060';cx.fillRect(100,rowBomb+2,pw,10);
 cx.strokeStyle='#888';cx.strokeRect(100,rowBomb+2,92,10);
 cx.fillStyle='#aaa';cx.font='bold 10px monospace';
 cx.fillText('POWER '+Math.floor(PL.power/100),198,rowBomb+3);
 const fw=(PL.flash/PL.flashMax)*140;
 const ready=PL.flash>=PL.flashMax;
 if(ready){cx.save();cx.shadowColor='#8cf';cx.shadowBlur=10+6*Math.sin(G.frame/5);}
 cx.fillStyle='#222';cx.fillRect(14,rowFlash,144,12);
 cx.fillStyle=ready?'#ffffff':'#58a6ff';
 cx.fillRect(14,rowFlash,fw,12);
 if(ready&&Math.floor(G.frame/12)%2===0){cx.fillStyle='#fff';cx.fillRect(14,rowFlash,fw,12);}
 cx.strokeStyle=ready?'#dff':'#666';cx.strokeRect(14,rowFlash,144,12);
 if(ready)cx.restore();
 cx.fillStyle=ready?'#fff':'#9cf';cx.font='bold 10px monospace';
 cx.fillText(ready?(IS_TOUCH?'FLASH READY':'FLASH READY — X!'):'FLASH '+PL.flash+'/'+PL.flashMax,162,rowFlash+2);
 const ow=(G.od/G.odMax)*140;
 cx.fillStyle='#222';cx.fillRect(14,rowOD,144,9);
 cx.fillStyle=G.trance>0?(Math.floor(G.frame/4)%2?'#aef':'#fff'):'#7f6cff';
 cx.fillRect(14,rowOD,G.trance>0?(G.trance/330)*144:ow,9);
 cx.strokeStyle='#666';cx.strokeRect(14,rowOD,144,9);
 cx.fillStyle=G.trance>0?'#dff':'#a8f';cx.font='bold 10px monospace';
 cx.fillText(G.trance>0?'OVERDRIVE ×1.5 DMG':'OD '+G.od+'/'+G.odMax+' (graze)',162,rowOD);
 if(G.streak>1){
  cx.textAlign='right';cx.fillStyle='#ffd700';cx.font='bold 15px monospace';
  cx.fillText('STREAK ×'+G.streakMult.toFixed(2)+'  ('+G.streak+')',W-14,66);
 }
 if(G.spellHist.length){
  let hx=IS_TOUCH?150:16;
  for(const cap of G.spellHist){
   cx.fillStyle=cap?'#6f6':'#f55';
   cx.beginPath();cx.arc(hx,H-12,3.2,0,TAU);cx.fill();
   hx+=10;
  }
 }
 if(G.screen==='play'&&G.routeQueue.length&&G.routeQueue[G.routeIdx]!==undefined){
  const R=ROUTES[G.routeQueue[G.routeIdx]];
  cx.fillStyle='#889';
  if(IS_TOUCH){cx.textAlign='left';cx.font='11px "Pixel8",monospace';cx.fillText(R.title+'  '+(G.routeIdx+1)+'/'+G.routeQueue.length,70,54);}
  else{cx.textAlign='right';cx.fillText(R.title+'  '+(G.routeIdx+1)+'/'+G.routeQueue.length,W-14,H-20);}
 }
 if(G.wave){
  cx.fillStyle='#8f8';cx.font='bold 13px monospace';
  if(IS_TOUCH){cx.textAlign='left';cx.fillText('WAVE '+(G.wave.kills||0)+'/'+G.wave.queue.length,14,H-146);}
  else{cx.textAlign='right';cx.fillText('WAVE '+(G.wave.kills||0)+'/'+G.wave.queue.length,W-14,H-38);}
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

const bloomCv=document.createElement('canvas');bloomCv.width=160;bloomCv.height=120;
const bctx=bloomCv.getContext('2d');
function applyBloom(){
 bctx.clearRect(0,0,160,120);
 bctx.drawImage(cv,0,0,160,120);
 cx.save();
 cx.setTransform(1,0,0,1,0,0);
 cx.globalCompositeOperation='lighter';
 cx.globalAlpha=.15;
 cx.imageSmoothingEnabled=true;
 cx.drawImage(bloomCv,0,0,W,H);
 cx.restore();
}
function drawScreen(){
 cx.setTransform(1,0,0,1,0,0);
 if(IS_TOUCH)TouchUI.reset();
 if(G.screen==='play'||G.screen==='pause'){
  cx.save();
  if(shakeT>0)cx.translate(rnd(-shakeM,shakeM),rnd(-shakeM,shakeM));
  drawBG();
  drawSpellBG();
  drawEntities();
  drawBoss();
  cx.restore();
  if(G.bloomEnabled!==false)applyBloom();
  if(!(BOSS&&BOSS.state==='dialog'))drawHUD();
  drawCutin();
  if(BOSS&&BOSS.state==='dialog')drawDialogBox();
  if(IS_TOUCH&&G.screen==='play')drawTouchPlayUI();
  if(G.bannerT>0){
   const p=1-Math.abs(G.bannerT-65)/65;
   cx.save();cx.globalAlpha=clamp(p,0,1);
   cx.fillStyle='#fff';cx.font='bold 44px monospace';cx.textAlign='center';
   cx.fillText(G.bannerText,W/2,H/2-40);
   cx.fillStyle='#89f';cx.font='bold 16px monospace';
    cx.fillText((G.story?'STORY · ':'')+(G.oneCC?'1CC · ':'')+DIFFS[DIFF].toUpperCase()+'  ·  '+ROUTES[G.routeQueue[G.routeIdx]].bosses.length+' BOSSES',W/2,H/2+8);
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
    cx.fillText(IS_TOUCH?'TAP TO EXIT DEMO':'PRESS ANY KEY TO PLAY',W/2,H/2+22);
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
  else if(G.screen==='settings')drawSettings();
  else if(G.screen==='help')drawHelp();
 }
 if(IS_TOUCH)drawTouchController();
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
 if(IS_TOUCH){
  touchBtn(W/2-110,286,220,50,'START',()=>{sfx('ok');G.screen='diff';G.idleT=0;},
   {id:'title:start',font:'bold 18px monospace',col:'#ffd0d0'});
  touchBtn(W/2-160,352,150,40,'SETTINGS',()=>{sfx('ok');G.settingsCursor=0;G.settingsFrom='title';G.screen='settings';},
   {id:'title:settings'});
  touchBtn(W/2+10,352,150,40,'HOW TO PLAY',()=>{sfx('ok');G.helpFrom='title';G.screen='help';},
   {id:'title:help'});
 }else{
  blinkText('PRESS  Z',H/2+90,26);
  cx.fillStyle='#567';cx.font='bold 13px monospace';cx.textAlign='center';
  cx.fillText('S — SETTINGS     H — HOW TO PLAY',W/2,H/2+132);
 }
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
 if(IS_TOUCH)touchBtn(16,14,104,40,'BACK',()=>{sfx('cur');G.screen='title';G.idleT=0;},{id:'diff:back',col:'#9ab'});
 DIFFS.forEach((d,i)=>{
  const sel=i===G.diffCursor;
  cx.font='26px "VT323R",monospace';cx.textAlign='center';
  cx.fillStyle=sel?'#ffd0d0':i===3?'#ffd700':i===4?'#8f8':'#888';
  cx.fillText((sel?'▶ ':'　 ')+d,W/2-40,166+i*48);
  if(IS_TOUCH)TouchUI.add(90,142+i*48,W-180,42,()=>{
   G.diffCursor=i;sfx('cur');edge[KEY.Z]=true;
  },'diff:'+i);
 });
 const desc=[
  'Relaxed patterns, weaker bosses. A gentle tour.',
  'The intended experience. Balanced and brisk.',
  'Dense, fast, merciless. For veterans.',
  'Full route · 1 credit · no continues. One clean run.',
  'Mob waves before every boss. Power up between fights.'
 ][G.diffCursor];
 cx.fillStyle=G.diffCursor===3?'#ffd700':G.diffCursor===4?'#8f8':'#9ab';
 cx.font='bold 13px monospace';cx.textAlign='center';
 cx.fillText(desc,W/2,404);
 cx.fillStyle='#567';cx.font='bold 12px monospace';
 cx.fillText(IS_TOUCH?'TAP A MODE TO CHOOSE':'Z confirm · Esc back',W/2,H-48);
}
function drawSel(){
 menuFrame('SELECT STAGE');
 if(IS_TOUCH){
  touchBtn(16,14,104,40,'BACK',()=>{sfx('cur');G.screen='diff';},{id:'sel:back',col:'#9ab'});
  const x0=76,x1=326,cw=238,y0=136,rh=52,ch=42;
  ROUTES.forEach((r,i)=>{
   const col=i%2,row=(i/2)|0;
   const x=x0+col*(x1-x0),y=y0+row*rh,on=G.selFlags[i];
   cx.fillStyle=on?'rgba(80,120,96,.42)':'rgba(10,18,34,.62)';
   cx.fillRect(x,y,cw,ch);
   cx.strokeStyle=on?'#8fc':'#456';cx.lineWidth=on?2:1;
   cx.strokeRect(x+.5,y+.5,cw-1,ch-1);
   cx.font='18px "VT323R",monospace';cx.textAlign='left';cx.textBaseline='middle';
   cx.fillStyle=on?'#dff':'#bbb';
   cx.fillText((on?'■ ':'□ ')+r.title,x+10,y+ch/2-4);
   cx.textAlign='right';cx.font='12px "VT323R",monospace';cx.fillStyle='#789';
   cx.fillText(r.bosses.length+' bosses',x+cw-10,y+ch/2+10);
   TouchUI.add(x,y,cw,ch,()=>{G.selFlags[i]=!G.selFlags[i];sfx('ok');},'sel:stage:'+i);
  });
  touchBtn(x0,346,cw,40,'SELECT ALL',()=>{G.selFlags.fill(true);sfx('ok');},{id:'sel:all'});
  touchBtn(x1,346,cw,40,'START',()=>{
   if(!G.selFlags.some(f=>f)){sfx('no');return;}
   sfx('ok');startRun();
  },{id:'sel:start',font:'bold 15px monospace',col:'#ffd0d0',on:G.selFlags.some(f=>f)});
  cx.textAlign='center';cx.textBaseline='top';cx.font='bold 12px monospace';
  cx.fillStyle=G.selFlags.some(f=>f)?'#567':'#f88';
  cx.fillText(G.selFlags.some(f=>f)?'TAP STAGES TO TOGGLE THEM':'SELECT AT LEAST ONE STAGE',W/2,396);
  return;
 }
 const y0=142,gap=23;
 ROUTES.forEach((r,i)=>{
  const sel=i===G.selCursor,on=G.selFlags[i];
  cx.font='22px "VT323R",monospace';
  if(sel)cx.fillStyle=on?'#c88':'#ffd0d0';
  else cx.fillStyle=on?'#789':'#ccc';
  cx.textAlign='left';
  cx.fillText((sel?'▶ ':'　 ')+(on?'■ ':'□ ')+r.title,130,y0+i*gap);
  cx.textAlign='right';cx.fillStyle='#567';cx.font='15px "VT323R",monospace';
  cx.fillText(r.bosses.length+' bosses',W-110,y0+i*gap);
 });
 const allY=y0+ROUTES.length*gap;
 cx.textAlign='left';cx.font='22px "VT323R",monospace';
 const sel=ROUTES.length===G.selCursor,all=ROUTES.length+1===G.selCursor;
 if(all){cx.fillStyle='#ffd0d0';cx.fillText('▶ SELECT ALL',130,allY);}
 else{cx.fillStyle=sel?'#ffd0d0':'#888';cx.fillText((sel?'▶ ':'　 ')+'SELECT ALL',130,allY);}
 {
  const i=ROUTES.length+1,sel2=i===G.selCursor;
  cx.fillStyle=sel2?'#ffd0d0':'#888';
  cx.fillText((sel2?'▶ ':'　 ')+'START',130,y0+i*gap);
 }
 cx.textAlign='center';cx.fillStyle='#567';cx.font='bold 12px monospace';
 cx.fillText('Z toggle / start · Esc back · select at least one stage',W/2,H-48);
}
function drawPause(){
 cx.fillStyle='rgba(0,0,10,.72)';cx.fillRect(0,0,W,H);
 cx.fillStyle='#fff';cx.font='bold 34px monospace';cx.textAlign='center';
 cx.fillText('PAUSE',W/2,96);
 ['Resume','Restart Stage','How to Play','Settings','Return to Title'].forEach((s,i)=>{
  const sel=i===G.pauseCursor;
  cx.font='24px "VT323R",monospace';cx.textAlign='left';
  cx.fillStyle=sel?'#ffd0d0':'#999';
  cx.fillText((sel?'▶ ':'　 ')+s,100,180+i*40);
  if(i===1){
   cx.textAlign='right';cx.fillStyle=sel?(G_coins>0?'#ffd700':'#864'):'#776';
   cx.font='bold 11px monospace';cx.fillText('1 CREDIT',330,180+i*40);
  }
  if(IS_TOUCH&&!G.pauseConfirm)TouchUI.add(80,180+i*40-26,280,38,()=>{
   G.pauseCursor=i;edge[KEY.Z]=true;
  },'pause:'+i);
 });
 cx.strokeStyle='rgba(255,255,255,.12)';cx.beginPath();cx.moveTo(348,148);cx.lineTo(348,330);cx.stroke();
 cx.textAlign='left';cx.font='17px "VT323R",monospace';
 const st=[['Score',fmtScore(G.score)],['Graze',PL.graze],['Deaths',G.deaths],
  ['Spells',G.spellsCaptured+' / '+G.spellsPlayed],['Credits',G_coins],
  ['Difficulty',G.oneCC?'1CC':G.story?'Story':DIFFS[DIFF]]];
 st.forEach(([k,v],i)=>{cx.fillStyle='#889';cx.fillText(k,372,164+i*26);cx.fillStyle='#eee';cx.fillText(String(v),540,164+i*26);});
 cx.textAlign='center';cx.fillStyle='#667';cx.font='bold 12px monospace';
 cx.fillText(IS_TOUCH?'TAP AN OPTION':'Esc resume · Z confirm · X cancel',W/2,H-28);
 if(G.pauseConfirm){
  cx.fillStyle='rgba(0,0,0,.78)';cx.fillRect(0,0,W,H);
  cx.textAlign='center';cx.fillStyle='#fff';cx.font='bold 26px monospace';
  cx.fillText(G.pauseConfirm==='restart'?'RESTART STAGE?':'RETURN TO TITLE?',W/2,196);
  cx.textAlign='center';cx.font='bold 15px monospace';
  if(G.pauseConfirm==='restart'){
   cx.fillStyle='#ffd700';
   cx.fillText('Costs 1 credit'+(G.oneCC?' · ends 1CC eligibility':''),W/2,232);
   cx.fillStyle='#f88';cx.fillText('CREDITS LEFT '+G_coins,W/2,256);
  }else{
   cx.fillStyle='#ccd';cx.fillText('Current run progress will be lost.',W/2,232);
  }
  if(IS_TOUCH){
   touchBtn(W/2-160,286,140,42,'CONFIRM',()=>{edge[KEY.Z]=true;},
    {id:'pause:confirm',col:'#8fc',font:'bold 14px monospace'});
   touchBtn(W/2+20,286,140,42,'CANCEL',()=>{edge[KEY.X]=true;},
    {id:'pause:cancel',col:'#f88',font:'bold 14px monospace'});
  }else{
   cx.fillStyle='#dfd';cx.font='bold 14px monospace';
   cx.fillText('Z — confirm      X — cancel',W/2,312);
  }
 }
}
function drawGameover(){
 cx.fillStyle='rgba(20,0,10,.62)';cx.fillRect(0,0,W,H);
 cx.fillStyle='#f66';cx.font='bold 46px monospace';cx.textAlign='center';
 cx.fillText('GAME OVER',W/2,128);
 const R=G.routeQueue.length?ROUTES[G.routeQueue[G.routeIdx]]:null;
 const bd=R?BOSS_DEFS[R.bosses[clamp(G_contBoss,0,R.bosses.length-1)]]:null;
 cx.fillStyle='#99a';cx.font='bold 15px monospace';
 cx.fillText((R?R.title:'')+(bd?' · '+bd.name:''),W/2,174);
 cx.fillStyle='#99a';cx.font='bold 18px monospace';
 cx.fillText('SCORE '+fmtScore(G.score),W/2,214);
 cx.fillStyle='#ffd700';cx.font='bold 16px monospace';
 cx.fillText('CREDITS ×'+G_coins,W/2,246);
 if(IS_TOUCH){
  touchBtn(W/2-190,274,380,44,'CONTINUE AT BOSS',()=>{
   if(G_coins>0)edge[KEY.C]=true;else sfx('no');
  },{id:'gameover:continue',on:G_coins>0,sub:'1 credit',col:'#8fc'});
  touchBtn(W/2-190,330,380,44,'RETRY STAGE',()=>{
   if(G_coins>0)edge[KEY.Z]=true;else sfx('no');
  },{id:'gameover:retry',on:G_coins>0,sub:'1 credit',col:'#ffd700'});
  touchBtn(W/2-190,386,380,40,'RETURN TO TITLE',()=>{edge[KEY.X]=true;},{id:'gameover:title',col:'#f88'});
  return;
 }
 let y=292;
 if(G_coins>0){
  cx.fillStyle='#fff';cx.font='19px "VT323R",monospace';
  cx.fillText('C — Continue at this boss (1 credit)',W/2,y);y+=30;
  cx.fillText('Z / R — Retry this stage (1 credit)',W/2,y);y+=30;
 }else{
  cx.fillStyle='#666';cx.font='bold 16px monospace';
  cx.fillText('NO CREDITS REMAINING',W/2,y);y+=30;
 }
 cx.fillStyle='#889';cx.font='17px "VT323R",monospace';
 cx.fillText('X — Return to title',W/2,y);
}
function drawResult(){
 cx.fillStyle='#fff';cx.font='bold 36px monospace';cx.textAlign='center';
 cx.fillText('RESULTS',W/2,56);
 const rows=[
  ['Spell Cards Played',G.spellsPlayed],
  ['Spell Cards Captured',G.spellsCaptured],
  ['Best Capture Streak','×'+(1+Math.max(0,G.bestStreak-1)*.25).toFixed(2)+' ('+G.bestStreak+')'],
  ['Sparks Collected',G.sparksGot],
  ['Deaths',G.deaths],
  ['Credits Used',G.creditsUsed||0],
  ['Final Score',fmtScore(G.score)]
 ];
 rows.forEach(([k,v],i)=>{
  if(G.resultT<i*20+10)return;
  cx.textAlign='left';cx.fillStyle='#ccd';cx.font='23px "VT323R",monospace';
  cx.fillText(k,84,104+i*30);
  cx.textAlign='right';cx.fillStyle='#fff';
  cx.fillText(String(v),430,104+i*30);
 });
 if(G.resultT>100){
  const ri=rankInfo();
  cx.textAlign='left';cx.fillStyle='#ccd';cx.font='23px "VT323R",monospace';
  cx.fillText('Spell Clear Rate',84,332);
  cx.textAlign='right';
  if(G.resultT<140){
   cx.fillStyle='#fff';cx.font='23px "VT323R",monospace';
   cx.fillText(irnd(0,99)+'%',430,332);
  }else{
   cx.fillStyle=ri.c;cx.font='bold 24px monospace';
   cx.fillText(ratePct()+'%',430,332);
  }
  cx.strokeStyle='rgba(255,255,255,.12)';cx.beginPath();cx.moveTo(466,86);cx.lineTo(466,320);cx.stroke();
  if(G.resultT>=140){
   cx.textAlign='center';
   cx.save();cx.translate(542,178);
   cx.shadowColor=ri.c;cx.shadowBlur=26;
   cx.fillStyle=ri.c;cx.font='bold 84px monospace';
   cx.fillText(ri.r,0,0);cx.restore();
   cx.fillStyle='#fff';cx.font='bold 14px monospace';
   const words=ri.t.split(' ');let line='',yy=228;
   for(const w of words){
    if((line+' '+w).trim().length>13){cx.fillText(line.trim(),542,yy);yy+=18;line=w;}
    else line+=' '+w;
   }
   if(line.trim())cx.fillText(line.trim(),542,yy);
  }
  if(G.newHi&&G.resultT>150){
   cx.textAlign='center';cx.fillStyle='#ffd700';cx.font='bold 13px monospace';
   cx.fillText('NEW RECORD',542,300);
  }
 }
 if(G.oneCC&&G.resultT>140){
  const cleared=!G.oneCCFailed&&(G.creditsUsed||0)===0;
  cx.textAlign='center';
  cx.fillStyle=cleared?'#ffd700':'#888';cx.font='bold 16px monospace';
  cx.fillText(cleared?'★ 1CC CLEAR ★':'1CC FAILED'+(G.creditsUsed?' · '+G.creditsUsed+' CREDIT(S) USED':''),W/2,372);
 }
 if(IS_TOUCH){
  if(G.resultT>90)touchBtn(W/2-110,H-70,220,42,'CONTINUE',()=>{edge[KEY.Z]=true;},
   {id:'result:continue',col:'#dff',font:'bold 14px monospace'});
 }else if(G.resultT>170)blinkText('Z — back to title',H-22,17);
}
function drawTouchSettings(){
 menuFrame('SETTINGS');
 const x0=78,x1=324,cw=234,ch=40,y0=140,rh=48;
 SETTINGS_ITEMS.forEach((it,i)=>{
  const col=i%2,row=(i/2)|0;
  const x=x0+col*(x1-x0),y=y0+row*rh;
  const vol=it.k==='musicVol'||it.k==='sfxVol';
  let val='';
  if(it.k==='musicVol')val=Math.round(VOL_STEPS[settings.musicVol]*100)+'%';
  else if(it.k==='sfxVol')val=Math.round(SFX_STEPS[settings.sfxVol]*100)+'%';
  else if(it.k==='mute')val=AudioSys.muted?'ON':'OFF';
  else if(it.k!=='back')val=settings[it.k]?'ON':'OFF';
  let active=it.k==='mute'?AudioSys.muted:vol?true:(it.k!=='back'&&!!settings[it.k]);
  const sel=G.settingsCursor===i;
  cx.fillStyle='rgba(10,18,34,.64)';cx.fillRect(x,y,cw,ch);
  cx.strokeStyle=it.k==='back'?'#f88':(sel?'#ffd0d0':(active?'#8fc':'#456'));
  cx.lineWidth=sel?2:1;cx.strokeRect(x+.5,y+.5,cw-1,ch-1);
  cx.textAlign='left';cx.textBaseline='alphabetic';
  cx.fillStyle=it.k==='back'?'#fbb':'#ddd';cx.font='16px "VT323R",monospace';
  cx.fillText(it.label,x+10,y+17);
  if(it.k!=='back'){
   cx.font='bold 12px monospace';cx.fillStyle=active?'#fff':'#9ab';
   if(vol){
    cx.textAlign='center';cx.fillText(val,x+cw/2,y+32);
    cx.textAlign='left';cx.fillText('◀',x+10,y+32);
    cx.textAlign='right';cx.fillText('▶',x+cw-10,y+32);
   }else{
    cx.textAlign='right';cx.fillText(val,x+cw-10,y+32);
   }
  }
  if(it.k==='back'){
   TouchUI.add(x,y,cw,ch,()=>{sfx('cur');G.screen=G.settingsFrom;},'settings:back');
  }else if(vol){
   TouchUI.add(x,y,cw/2,ch,()=>{G.settingsCursor=i;edge[KEY.LEFT]=true;},'settings:'+it.k+':-');
   TouchUI.add(x+cw/2,y,cw/2,ch,()=>{G.settingsCursor=i;edge[KEY.RIGHT]=true;},'settings:'+it.k+':+');
  }else{
   TouchUI.add(x,y,cw,ch,()=>{
    G.settingsCursor=i;edge[KEY.Z]=true;
   },'settings:'+it.k);
  }
 });
 cx.textAlign='center';cx.fillStyle='#567';cx.font='bold 11px monospace';
 cx.fillText('TAP OR STICK + FIRE · ◀ ▶ ADJUST · BACK RETURNS',W/2,H-30);
}
function drawSettings(){
 if(IS_TOUCH){drawTouchSettings();return;}
 menuFrame('SETTINGS');
 SETTINGS_ITEMS.forEach((it,i)=>{
  const sel=i===G.settingsCursor,y=150+i*24;
  cx.font='22px "VT323R",monospace';cx.textAlign='left';
  cx.fillStyle=sel?'#ffd0d0':'#999';
  cx.fillText((sel?'▶ ':'　 ')+it.label,110,y);
  if(it.k==='back')return;
  let val;
  if(it.k==='musicVol')val=Math.round(VOL_STEPS[settings.musicVol]*100)+'%';
  else if(it.k==='sfxVol')val=Math.round(SFX_STEPS[settings.sfxVol]*100)+'%';
  else if(it.k==='mute')val=AudioSys.muted?'ON':'OFF';
  else val=settings[it.k]?'ON':'OFF';
  cx.textAlign='right';cx.fillStyle=sel?'#fff':'#bbb';
  cx.fillText((it.k==='musicVol'||it.k==='sfxVol')?'◀ '+val+' ▶':val,530,y);
 });
 cx.textAlign='center';cx.fillStyle='#567';cx.font='bold 12px monospace';
 cx.fillText('Up/Down select · Left/Right adjust · Z toggle · Esc back',W/2,H-48);
}
function drawHelp(){
 menuFrame('HOW TO PLAY');
 if(IS_TOUCH)touchBtn(16,14,104,40,'BACK',()=>{sfx('cur');G.screen=G.helpFrom;},{id:'help:back',col:'#9ab'});
 const left=IS_TOUCH?[
  ['MOVE','Joystick'],['FOCUS','Toggle button'],['SHOOT','FIRE (hold)'],['BOMB','BOMB button'],
  ['SPELL','SPELL button'],['DEATHBOMB','BOMB / SPELL'],['PAUSE','II button'],
  ['MENUS','Stick + FIRE'],['SETTINGS','Title / pause'],['AUDIO','Mute in settings']
 ]:[
  ['MOVE','Arrows'],['FOCUS','Shift'],['SHOOT','Z (hold)'],['SPELL','C — 1 spell'],
  ['FLASH','X — when full'],['DEATHBOMB','X / C after hit'],['PAUSE','Esc · R restart'],
  ['CONFIRM','Z / Enter'],['AUTOFIRE','A toggle'],['AUDIO','M mute · -/+ music']
 ];
 const right=[
  ['GRAZE','Charges flash + OD'],['FLASH','30 graze: clear+damage'],['OVERDRIVE','80 graze: ×1.5 dmg'],
  ['1CC','Full route · 1 credit'],['CONTINUE','1 credit · ends 1CC'],['RETRY','Pause restart · 1 credit'],
  ['STORY','Waves, then the boss'],['RANK','Capture spells to rank up']
 ];
 cx.font='15px "VT323R",monospace';cx.textAlign='left';
 left.forEach(([k,v],i)=>{
  const y=154+i*22;
  cx.fillStyle='#ffd700';cx.fillText(k,86,y);
  cx.fillStyle='#ddd';cx.fillText(v,168,y);
 });
 right.forEach(([k,v],i)=>{
  const y=154+i*22;
  cx.fillStyle='#ffd700';cx.fillText(k,332,y);
  cx.fillStyle='#ddd';cx.fillText(v,412,y);
 });
 cx.textAlign='center';cx.fillStyle='#567';cx.font='bold 12px monospace';
 cx.fillText(IS_TOUCH?'TAP BACK TO RETURN':'Esc / Z — back',W/2,H-48);
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
  if(IS_TOUCH)TouchUI.updateStick(now);
   if(hitK(KEY.ESC)){
    const s=G.screen;
     if(s==='play'){
      if(Gdemo)endDemo();
      else{TouchUI.resetStick();G.screen='pause';G.pauseCursor=0;G.pauseConfirm=null;sfx('cur');}
     }else if(s==='pause'){
     if(G.pauseConfirm){G.pauseConfirm=null;sfx('no');}
     else G.screen='play';
    }else if(s==='diff'){G.screen='title';sfx('cur');}
    else if(s==='sel'){G.screen='diff';sfx('cur');}
    else if(s==='settings'){G.screen=G.settingsFrom;sfx('cur');}
    else if(s==='help'){G.screen=G.helpFrom;sfx('cur');}
    else if(s==='gameover'){sfx('no');goTitle();}
   }
   if(hitK(189)||hitK(188)||hitK(109)){settings.musicVol=clamp(settings.musicVol-1,0,VOL_STEPS.length-1);setMusicVol(settings.musicVol);saveSettings();}
   if(hitK(65)){settings.autoFire=!settings.autoFire;autoFire=settings.autoFire;saveSettings();sfx("cur");}
   if(hitK(70)){settings.showFps=!settings.showFps;showFps=settings.showFps;saveSettings();}
   if(hitK(187)||hitK(190)||hitK(107)){settings.musicVol=clamp(settings.musicVol+1,0,VOL_STEPS.length-1);setMusicVol(settings.musicVol);saveSettings();}
  if(G.freeze>0){G.freeze--;clearEdges();continue;}
  if(G.screen==='play')updatePlay();
  else updateMenus();
  clearEdges();
 }
 drawScreen();
}
requestAnimationFrame(frame);
loadAssets();

/* ---- Mobile / Touch Support ---- */
/* Touch input (joystick + action buttons) lives in boot.js. */

startTitleBgm();
