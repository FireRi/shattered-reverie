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
 resetBanterRun();
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
 if(R.bosses.length)prefetchBossBanter(BOSS_DEFS[R.bosses[0]]);
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
 prefetchNearbyBanter(def);
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
 resetBanterRun();
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
 resetBanterRun();
 BOSS=null;eshots.length=0;pshots.length=0;items.length=0;fx.length=0;ftext.length=0;elasers.length=0;
 mobs.length=0;G.wave=null;G.needWave=!!G.story;G.pauseConfirm=null;G.freeze=0;flashA=0;
 G.monoRay=null;resetPlayer(true);G.bossIdx=0;
 const R=ROUTES[G.routeQueue[G.routeIdx]];
 G.bannerText=R.title.toUpperCase();G.bannerT=110;
 G.screen='play';
 startStageBgm(R);
 if(R.bosses.length)prefetchBossBanter(BOSS_DEFS[R.bosses[0]]);
}
addEventListener('keydown',e=>{
 G.idleT=0;
 if(e.keyCode===KEY.M)toggleMute();
});
function autoPause(){
 for(const k in keys)keys[k]=false;
 for(const k in edge)edge[k]=false;
 if(typeof TouchPad!=='undefined'&&TouchPad.release)TouchPad.release();
 else TouchUI.release();
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
 startStageBgm(R);
}
function endDemo(){goTitle(false);}
function routeBgKey(){
 const id=ROUTES[G.routeQueue[G.routeIdx]]?.id;
 return {S1:'route_s1',S2:'route_s2',S3:'route_s3',S4:'route_s3',S5:'route_s1',S6:'route_s2',EX:'route_ex',EXA:'route_ex'}[id]||null;
}
let _banterAborts={},_banterTried={},_banterNoKey=false;
function clipBanter(v,max){
 return String(v||'').replace(/[<>&"\x00-\x1f\x7f]/g,'').replace(/\s+/g,' ').trim().substring(0,max);
}
function resetBanterRun(){
 if(typeof clearAiBanter==='function')clearAiBanter();
 for(const id in _banterAborts){try{_banterAborts[id].abort();}catch(e){}}
 _banterAborts={};_banterTried={};
}
function banterPayload(def){
 const R=ROUTES[G.routeQueue[G.routeIdx]];
 const spells=(def.atk||[]).filter(a=>a.n).map(a=>a.n).slice(0,3).join(' / ');
 return {
  bossName:clipBanter(def.name,40),
  bossVoice:clipBanter(typeof bossBanterVoice==='function'?bossBanterVoice(def):'proud boundary guardian',100),
  bossTheme:clipBanter(spells||'an unspoken signature spell',120),
  stage:clipBanter(R&&R.title,40),
  stageMode:clipBanter((R&&R.mode)||'standard',24),
  difficulty:clipBanter(DIFFS[DIFF],20),
  mode:G.story?'story':G.oneCC?'1cc':'route',
  playerName:clipBanter(typeof PLAYER_NAME!=='undefined'?PLAYER_NAME:'Suzuran',24),
  deaths:clamp(G.deaths|0,0,999),
  grazes:clamp(PL.graze|0,0,99999),
  captures:clamp(G.spellsCaptured|0,0,999),
  misses:clamp((G.spellsPlayed-G.spellsCaptured)|0,0,999),
  streak:clamp(G.streak|0,0,99)
 };
}
function prefetchBossBanter(def){
 if(!def||Gdemo||!G.aiDialogue||_banterNoKey||typeof fetch!=='function')return;
 if(typeof hasAiBanter==='function'&&hasAiBanter(def.id))return;
 if(_banterTried[def.id])return;
 _banterTried[def.id]=true;
 const bid=def.id;
 const ctrl=typeof AbortController==='function'?new AbortController():null;
 if(ctrl)_banterAborts[bid]=ctrl;
 const timer=setTimeout(()=>{if(ctrl)ctrl.abort();},8000);
 fetch('/api/generate-dialog',{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(banterPayload(def)),signal:ctrl?ctrl.signal:undefined
 }).then(r=>r.json()).then(d=>{
  if(!G.aiDialogue||!d)return;
  if(d.error==='no_key'){_banterNoKey=true;return;}
  if(typeof setAiBanter==='function'&&setAiBanter(bid,d.lines)&&BOSS&&BOSS.def&&BOSS.def.id===bid&&BOSS.state==='enter'){
   BOSS.dlg=getBossBanter(BOSS.def);BOSS.dgi=0;BOSS.dShown=0;BOSS.dT=0;
  }
 }).catch(()=>{}).finally(()=>{
  clearTimeout(timer);
  if(_banterAborts[bid]===ctrl)delete _banterAborts[bid];
 });
}
function prefetchNearbyBanter(def){
 prefetchBossBanter(def);
 const R=ROUTES[G.routeQueue[G.routeIdx]];
 const nextId=R&&R.bosses[G.bossIdx+1];
 if(nextId&&BOSS_DEFS[nextId])prefetchBossBanter(BOSS_DEFS[nextId]);
}
function drawBG(){
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
 const dcol=who==='b'?(typeof BOSS.cutinCol==='string'?BOSS.cutinCol:BOSS.col[0]):UI.cyan;
 cx.save();
 uiPanel(bx,by,bw,bh,{cut:8,ticks:false,col:dcol,fill:'rgba(3,6,16,.9)'});
 cx.fillStyle=dcol;cx.globalAlpha=.18;cx.fillRect(bx+8,by+1,4,bh-2);cx.globalAlpha=1;
 cx.fillStyle=dcol;cx.fillRect(bx+8,by+1,90,2);
 cx.font='10px "Pixel8",monospace';cx.textAlign='left';cx.textBaseline='top';
 cx.fillStyle=who==='b'?BOSS.col[1]:UI.cyan;
 cx.fillText(who==='b'?BOSS.name.toUpperCase():PLAYER_NAME.toUpperCase(),bx+20,by+8);
 cx.fillStyle='rgba(150,210,230,.45)';cx.font='7px "Pixel8",monospace';cx.textAlign='right';
 cx.fillText(who==='b'?'BOSS CHANNEL':'PLAYER CHANNEL',bx+bw-14,by+10);
 cx.font='20px "VT323R",monospace';cx.textAlign='left';cx.fillStyle='#eaf8ff';
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
  cx.font='8px "Pixel8",monospace';cx.fillStyle=UI.cyan;cx.textAlign='right';
  cx.fillText(IS_TOUCH?'▼ TAP TO ADVANCE':'▼ Z TO ADVANCE',bx+bw-14,by+bh-16);
 }
  cx.restore();
 if(IS_TOUCH&&G.screen==='play')TouchUI.add(0,0,W,H,()=>{edge[KEY.Z]=true;},'dialog:advance');
}
function touchBtn(x,y,w,h,label,cb,opt={}){
 const on=opt.on!==false,col=on?(opt.col||UI.cyan):'#3d5566',cut=6;
 cx.save();
 cx.beginPath();
 cx.moveTo(x+cut,y);cx.lineTo(x+w-cut,y);cx.lineTo(x+w,y+cut);cx.lineTo(x+w,y+h-cut);
 cx.lineTo(x+w-cut,y+h);cx.lineTo(x+cut,y+h);cx.lineTo(x,y+h-cut);cx.lineTo(x,y+cut);cx.closePath();
 cx.fillStyle=on?(opt.fill||'rgba(8,22,38,.85)'):'rgba(8,14,24,.42)';cx.fill();
 cx.strokeStyle=col;cx.globalAlpha=on?1:.5;cx.lineWidth=opt.active?2.5:1.5;cx.stroke();
 cx.globalAlpha=1;
 if(on){
  cx.fillStyle=col;cx.globalAlpha=.75;cx.fillRect(x+cut,y+1,3,h-2);cx.globalAlpha=1;
  cx.fillStyle='rgba(140,250,255,.13)';cx.fillRect(x+cut,y+1,w-cut*2,1);
  cx.fillStyle=col;cx.fillRect(x+w-8,y+4,2,2);cx.fillRect(x+w-8,y+h-6,2,2);
 }
 cx.textAlign='center';cx.textBaseline='middle';
 cx.fillStyle=on?'#eaffff':'#687f92';
 cx.font=opt.font||'11px "Pixel8",monospace';
 cx.fillText(label,x+w/2,y+h/2+(opt.sub?-5:1));
 if(opt.sub){
  cx.font='8px "Pixel8",monospace';
  cx.fillStyle=on?(opt.subCol||UI.cyan):'#5f7588';
  cx.fillText(opt.sub,x+w/2,y+h/2+12);
 }
 cx.restore();
 if(cb)TouchUI.add(x,y,w,h,cb,opt.id);
}
function drawHUD(){
 uiPanel(W-184,8,172,52,{cut:5,ticks:false,col:'rgba(110,230,255,.24)',fill:'rgba(2,8,16,.52)'});
 cx.font='8px "Pixel8",monospace';cx.textAlign='right';cx.textBaseline='top';
 cx.fillStyle=UI.dim;cx.fillText('SCORE',W-20,13);
 cx.fillStyle='#f2ffff';cx.font='12px "Pixel8",monospace';
 cx.fillText(fmtScore(Math.floor(G.dispScore)),W-20,22);
 cx.fillStyle=UI.cyan;cx.font='7px "Pixel8",monospace';
 cx.fillText('HI '+fmtScore(Math.max(G.hi,G.score)),W-20,36);
 const uw=70+40*G.beat;
 uiSegBar(W-20-uw,56,uw,2,.7+.3*G.beat,UI.cyan,{segs:12,frame:false});
 const flags=[];
 if(AudioSys.muted)flags.push('MUTED');
 if(autoFire)flags.push('AUTO');
 if(flags.length){cx.fillStyle=AudioSys.muted?UI.amber:UI.green;cx.font='7px "Pixel8",monospace';cx.fillText(flags.join(' · '),W-20,45);}
 if(showFps&&fpsVal>0){cx.fillStyle='#89f';cx.font='8px "Pixel8",monospace';cx.fillText(fpsVal+' FPS',W-20,64);}
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
  uiPanel(10,10,bw+14,34,{cut:5,ticks:false,col:'rgba(110,230,255,.24)',fill:'rgba(2,8,16,.55)'});
  const lowFlash=ratio<.25&&Math.floor(G.frame/8)%2===0;
  uiSegBar(16,16,bw,18,disp,'rgba(240,255,255,.55)',{segs:42,frame:false});
  uiSegBar(16,16,bw,18,ratio,lowFlash?'#ffe0e0':BOSS.col[0],{segs:42,frame:false});
  cx.strokeStyle='rgba(160,240,255,.5)';cx.lineWidth=1;cx.strokeRect(15.5,15.5,bw+1,19);
  cx.fillStyle='rgba(0,0,0,.6)';cx.font='9px "Pixel8",monospace';cx.textAlign='left';cx.textBaseline='middle';
  cx.fillText(BOSS.name,19,31);
  cx.fillStyle='#f2ffff';cx.fillText(BOSS.name,18,30);
  if(BOSS.leftInRoute>1)uiTag(BOSS.leftInRoute+' LEFT',18+bw-8,26,UI.dim,'right');
  const tm=Math.ceil(BOSS.timer/60);
  uiPanel(W-88,62,74,30,{cut:4,ticks:false,col:tm<=10?UI.red:'rgba(110,230,255,.24)',fill:'rgba(2,8,16,.58)'});
  cx.textAlign='left';cx.textBaseline='top';cx.font='7px "Pixel8",monospace';cx.fillStyle=UI.dim;
  cx.fillText('TIME',W-82,68);
  cx.textAlign='right';cx.font='16px "Pixel8",monospace';
  if(tm<=10){cx.globalAlpha=.55+.45*Math.abs(Math.sin(G.frame/5));cx.fillStyle=UI.red;}
  else cx.fillStyle='#f2ffff';
  cx.fillText(String(tm).padStart(2,'0'),W-22,71);
  cx.globalAlpha=1;cx.textBaseline='top';
  if(BOSS.atk&&BOSS.atk.n){
   cx.font='10px "Pixel8",monospace';cx.textAlign='center';
   const nm=BOSS.cutinName||'';
   if(!nameWCache.has(nm))nameWCache.set(nm,cx.measureText(nm).width);
   const tw=nameWCache.get(nm);
   const ncol=typeof BOSS.cutinCol==='string'?BOSS.cutinCol:UI.magenta;
   uiPanel(W/2-tw/2-16,36,tw+32,24,{cut:4,ticks:false,col:ncol,fill:'rgba(3,6,16,.8)'});
   cx.fillStyle=ncol;cx.textBaseline='middle';cx.fillText(nm,W/2,48);cx.textBaseline='top';
  }
 }
 const stW=306,stH=38,stX=8,stY=64;
 const nearHUD=!PL.dead&&PL.x<stX+stW+10&&PL.y>stY-12&&PL.y<stY+stH+18;
 cx.save();
 if(nearHUD)cx.globalAlpha=.38;
 uiPanel(stX,stY,stW,stH,{cut:5,ticks:false,col:'rgba(110,230,255,.14)',fill:'rgba(2,8,16,.34)'});
 cx.textAlign='left';cx.textBaseline='top';
 const lifeGem=ASSETS.gem_life,bombGem=ASSETS.gem_bomb;
 const rowLife=stY+4,rowLabel=stY+20,rowBar=stY+30;
 if(lifeGem){
  for(let i=0;i<clamp(PL.lives,0,8);i++){
   const pulse=(G.livesPulse>0&&i===PL.lives-1)?1.25:1;
   cx.drawImage(lifeGem,14+i*13,rowLife,11*pulse,11*pulse);
  }
 }else{
  for(let i=0;i<clamp(PL.lives,0,8);i++){
   const lx=14+i*13;
   cx.fillStyle=UI.amber;cx.beginPath();
   cx.moveTo(lx+5,rowLife+1);cx.lineTo(lx+10,rowLife+10);cx.lineTo(lx,rowLife+10);
   cx.closePath();cx.fill();
  }
 }
 if(bombGem){
  for(let i=0;i<clamp(PL.spells,0,4);i++)
   cx.drawImage(bombGem,130+i*13,rowLife+1,10,10);
 }else{
  for(let i=0;i<clamp(PL.spells,0,4);i++){
   const sx=134+i*13;
   cx.fillStyle=UI.cyan;cx.fillRect(sx-4,rowLife+5,8,8);
   cx.fillRect(sx-1,rowLife+2,3,14);
  }
 }
 if(!Gdemo){
  cx.fillStyle=UI.amber;cx.font='8px "Pixel8",monospace';
  cx.fillText('CR x'+G_coins,196,rowLife+1);
  if(G.creditsUsed>0){cx.fillStyle=UI.red;cx.fillText('USED '+G.creditsUsed,235,rowLife+1);}
 }
 if(G.spellHist.length){
  const hist=G.spellHist.slice(-6);
  let hx=270;
  for(const cap of hist){
   cx.fillStyle=cap?'#6f6':'#f55';
   cx.beginPath();cx.arc(hx,rowLife+6,2.4,0,TAU);cx.fill();
   hx+=6;
  }
 }
 const ready=PL.flash>=PL.flashMax;
 cx.font='8px "Pixel8",monospace';
 cx.fillStyle='#8fb3c6';cx.fillText('PWR',14,rowLabel);
 cx.textAlign='right';cx.fillStyle='#dff';cx.fillText(String(Math.floor(PL.power/100)),100,rowLabel);
 uiSegBar(14,rowBar,86,4,PL.power/500,'#ff5060',{segs:18,frame:false});
 cx.textAlign='left';cx.fillStyle='#8fb3c6';cx.fillText('FLASH',112,rowLabel);
 cx.textAlign='right';cx.fillStyle=ready?UI.cyan:'#bcdff0';cx.fillText(ready?'READY':PL.flash+'/'+PL.flashMax,198,rowLabel);
 uiSegBar(112,rowBar,86,4,PL.flash/PL.flashMax,ready?'#d8ffff':'#58a6ff',{segs:18,frame:false});
 cx.textAlign='left';cx.fillStyle='#8fb3c6';cx.fillText('OD',210,rowLabel);
 cx.textAlign='right';cx.fillStyle=G.trance>0?'#dff':'#a8b8ff';
 cx.fillText(G.trance>0?'x1.5':G.od+'/'+G.odMax,296,rowLabel);
 uiSegBar(210,rowBar,86,4,G.trance>0?G.trance/330:G.od/G.odMax,
  G.trance>0?(Math.floor(G.frame/4)%2?UI.cyan:UI.magenta):'#7f6cff',{segs:18,frame:false});
 cx.restore();
 if(G.streak>1){
  const sy=(BOSS&&!BOSS.dying)?96:68;
  cx.textAlign='right';cx.fillStyle=UI.amber;cx.font='9px "Pixel8",monospace';
  cx.fillText('STREAK x'+G.streakMult.toFixed(2)+' ('+G.streak+')',W-20,sy);
 }
 if(G.screen==='play'&&G.routeQueue.length&&G.routeQueue[G.routeIdx]!==undefined){
  const R=ROUTES[G.routeQueue[G.routeIdx]];
  if(IS_TOUCH){
   uiPanel(8,H-30,258,20,{cut:4,ticks:false,col:'rgba(110,230,255,.22)',fill:'rgba(2,8,16,.5)'});
   cx.textAlign='left';cx.textBaseline='top';cx.font='8px "Pixel8",monospace';cx.fillStyle=UI.dim;
   cx.fillText('R.0'+(G.routeIdx+1),14,H-24);
   cx.fillStyle='#cfe4ef';cx.fillText(R.title,56,H-24);
   cx.textAlign='right';cx.fillStyle=UI.cyan;
   cx.fillText((G.routeIdx+1)+'/'+G.routeQueue.length,260,H-24);
  }else{
   uiPanel(W-216,H-30,200,20,{cut:4,ticks:false,col:'rgba(110,230,255,.22)',fill:'rgba(2,8,16,.5)'});
   cx.textAlign='left';cx.textBaseline='top';cx.font='8px "Pixel8",monospace';cx.fillStyle=UI.dim;
   cx.fillText('R.0'+(G.routeIdx+1),W-210,H-24);
   cx.fillStyle='#cfe4ef';cx.fillText(R.title,W-168,H-24);
   cx.textAlign='right';cx.fillStyle=UI.cyan;
   cx.fillText((G.routeIdx+1)+'/'+G.routeQueue.length,W-22,H-24);
  }
 }
 if(G.wave){
  if(IS_TOUCH){
   uiPanel(14,H-150,182,20,{cut:4,ticks:false,col:'rgba(105,255,168,.3)',fill:'rgba(2,14,10,.55)'});
   cx.textAlign='left';cx.textBaseline='top';cx.font='8px "Pixel8",monospace';cx.fillStyle=UI.green;
   cx.fillText('WAVE '+(G.wave.kills||0)+'/'+G.wave.queue.length,20,H-144);
  }else{
   uiPanel(W-200,H-56,184,20,{cut:4,ticks:false,col:'rgba(105,255,168,.3)',fill:'rgba(2,14,10,.55)'});
   cx.textAlign='left';cx.textBaseline='top';cx.font='8px "Pixel8",monospace';cx.fillStyle=UI.green;
   cx.fillText('WAVE '+(G.wave.kills||0)+'/'+G.wave.queue.length,W-194,H-50);
  }
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
 pixelTitle(shown+'_',W/2,H/2+6,20,col);
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
  if(G.bannerT>0){
   const p=1-Math.abs(G.bannerT-65)/65;
   cx.save();cx.globalAlpha=clamp(p,0,1);
   pixelTitle(G.bannerText,W/2,H/2-40,24,'#eaffff');
   cx.fillStyle=UI.cyan;cx.fillRect(W/2-190,H/2-8,380,1);
   cx.fillStyle=UI.dim;cx.font='9px "Pixel8",monospace';cx.textAlign='center';cx.textBaseline='top';
   cx.fillText((G.story?'STORY // ':'')+(G.oneCC?'1CC // ':'')+DIFFS[DIFF].toUpperCase()+' // '+ROUTES[G.routeQueue[G.routeIdx]].bosses.length+' BOSSES',W/2,H/2+12);
   cx.restore();
  }
  if(flashA>0){cx.globalAlpha=clamp(flashA,0,1);cx.fillStyle=flashC;cx.fillRect(0,0,W,H);cx.globalAlpha=1;}
  if(G.screen==='pause')drawPause();
  if(Gdemo){
   cx.save();
   cx.globalAlpha=.35+.15*Math.sin(G.frame/20);
   pixelTitle('DEMO',W/2,H/2-14,30,UI.cyan);
   cx.globalAlpha=.7;cx.textAlign='center';cx.textBaseline='top';
   cx.fillStyle=UI.dim;cx.font='8px "Pixel8",monospace';
   cx.fillText(IS_TOUCH?'TAP TO EXIT DEMO':'PRESS ANY KEY TO PLAY',W/2,H/2+20);
   cx.restore();
  }
 }else{
  cx.fillStyle='#05050a';cx.fillRect(0,0,W,H);
  if(ASSETS.bg_menubg){cx.globalAlpha=.30;cx.drawImage(ASSETS.bg_menubg,0,0,W,H);cx.globalAlpha=1;}
  for(const s of stars){cx.globalAlpha=.3*s.s*.3;cx.fillStyle='#89f';cx.fillRect(s.x,(s.y+G.frame*s.v)%H,1.4,1.4);}
  cx.globalAlpha=1;
  drawMenuGrid();
  drawPetals(.75);
  if(G.screen==='title')drawTitle();
  else if(G.screen==='diff')drawDiff();
  else if(G.screen==='sel')drawSel();
  else if(G.screen==='gameover')drawGameover();
  else if(G.screen==='result')drawResult();
  else if(G.screen==='settings')drawSettings();
  else if(G.screen==='help')drawHelp();
 }
 drawCRT();
 if(typeof TouchPad!=='undefined'&&TouchPad.sync)TouchPad.sync();
}

/* ---------- screens ---------- */
const UI={cyan:'#6ff6ff',blue:'#57b8ff',magenta:'#ff6ad5',amber:'#ffd45e',red:'#ff5a6e',
 green:'#69ffa8',ink:'#030914',text:'#d8f6ff',dim:'#6f8ca8',line:'rgba(110,230,255,.45)'};
const uiScan=document.createElement('canvas');uiScan.width=W;uiScan.height=H;
{
 const sc=uiScan.getContext('2d');
 sc.fillStyle='rgba(0,0,0,.16)';
 for(let y=1;y<H;y+=3)sc.fillRect(0,y,W,1);
 sc.fillStyle='rgba(120,220,255,.018)';
 for(let x=0;x<W;x+=4)sc.fillRect(x,0,1,H);
}
function drawCRT(){
 const sy=(G.frame*1.3)%(H+120)-120;
 cx.save();
 cx.drawImage(uiScan,0,0);
 const g=cx.createLinearGradient(0,sy,0,sy+90);
 g.addColorStop(0,'rgba(100,225,255,0)');g.addColorStop(.5,'rgba(100,225,255,.045)');g.addColorStop(1,'rgba(100,225,255,0)');
 cx.fillStyle=g;cx.fillRect(0,sy,W,90);
 cx.globalAlpha=.28;cx.drawImage(vig,0,0);cx.globalAlpha=1;
 cx.fillStyle='rgba(120,240,255,.14)';cx.fillRect(0,0,W,1);cx.fillRect(0,H-1,W,1);
 cx.restore();
}
function uiTicks(x,y,w,h,col){
 const c=Math.min(12,Math.floor(Math.min(w,h)*.09));
 cx.save();cx.strokeStyle=col;cx.globalAlpha=.9;cx.lineWidth=2;
 const pts=[[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]];
 for(const [px,py,sx,sy] of pts){
  cx.beginPath();
  cx.moveTo(px+sx*2,py+sy*(c+2));cx.lineTo(px+sx*2,py+sy*2);cx.lineTo(px+sx*(c+2),py+sy*2);
  cx.stroke();
 }
 cx.restore();
}
function uiPanel(x,y,w,h,opt={}){
 const col=opt.col||UI.cyan,cut=opt.cut==null?8:opt.cut;
 cx.save();
 cx.beginPath();
 cx.moveTo(x+cut,y);cx.lineTo(x+w-cut,y);cx.lineTo(x+w,y+cut);cx.lineTo(x+w,y+h-cut);
 cx.lineTo(x+w-cut,y+h);cx.lineTo(x+cut,y+h);cx.lineTo(x,y+h-cut);cx.lineTo(x,y+cut);cx.closePath();
 cx.fillStyle=opt.fill||'rgba(3,9,18,.9)';cx.fill();
 cx.strokeStyle=col;cx.globalAlpha=.82;cx.lineWidth=opt.lw||1;cx.stroke();
 cx.globalAlpha=1;
 cx.fillStyle='rgba(150,245,255,.05)';cx.fillRect(x+cut,y+2,w-cut*2,1);
 if(opt.title){
  cx.fillStyle=col;cx.globalAlpha=.12;cx.fillRect(x+cut,y+1,w-cut*2,25);
  cx.globalAlpha=1;cx.fillStyle=col;cx.fillRect(x+cut,y+26,w-cut*2,1);
  cx.font='9px "Pixel8",monospace';cx.textAlign='left';cx.textBaseline='top';
  cx.fillStyle=col;cx.fillText(String(opt.title).toUpperCase(),x+14,y+8);
  if(opt.code){
   cx.textAlign='right';cx.font='8px "Pixel8",monospace';
   cx.fillStyle='rgba(150,220,240,.55)';cx.fillText(opt.code,x+w-14,y+9);
  }
 }
 if(opt.ticks!==false)uiTicks(x,y,w,h,col);
 cx.restore();
}
function uiTile(x,y,w,h,opt={}){
 const col=opt.col||UI.cyan,sel=!!opt.sel;
 cx.save();
 cx.fillStyle=sel?'rgba(18,52,72,.86)':(opt.fill||'rgba(5,13,25,.78)');
 cx.fillRect(x,y,w,h);
 cx.strokeStyle=sel?col:(opt.border||'rgba(90,160,190,.32)');
 cx.lineWidth=sel?2:1;cx.strokeRect(x+.5,y+.5,w-1,h-1);
 if(sel){
  cx.fillStyle=col;cx.fillRect(x+1,y+1,3,h-2);
  cx.fillStyle='rgba(140,250,255,.12)';cx.fillRect(x+4,y+1,w-5,1);
  cx.fillStyle=col;cx.fillRect(x+w-7,y+4,3,3);cx.fillRect(x+w-7,y+h-7,3,3);
 }else if(opt.on){
  cx.fillStyle=col;cx.globalAlpha=.6;cx.fillRect(x+1,y+1,2,h-2);cx.globalAlpha=1;
 }
 cx.restore();
}
function uiSegBar(x,y,w,h,ratio,col,opt={}){
 const n=opt.segs||Math.max(6,Math.floor(w/8)),gap=1;
 const sw=(w-(n-1)*gap)/n;
 cx.save();
 for(let i=0;i<n;i++){
  const on=(i+1)/n<=ratio;
  cx.fillStyle=on?col:(opt.empty||'rgba(80,120,150,.16)');
  cx.globalAlpha=on?(opt.alpha==null?1:opt.alpha):1;
  cx.fillRect(Math.round(x+i*(sw+gap)),y,Math.ceil(sw),h);
 }
 cx.globalAlpha=1;
 if(opt.frame!==false){
  cx.strokeStyle=opt.frameCol||'rgba(140,220,240,.35)';
  cx.lineWidth=1;cx.strokeRect(x-.5,y-.5,w+1,h+1);
 }
 cx.restore();
}
function uiCursor(x,y,col){
 cx.fillStyle=col||UI.cyan;
 cx.fillRect(x,y-5,2,10);cx.fillRect(x+2,y-3,2,6);cx.fillRect(x+4,y-1,2,2);
}
function uiTag(text,x,y,col,align){
 cx.save();cx.font='8px "Pixel8",monospace';cx.textBaseline='top';cx.textAlign=align||'left';
 cx.fillStyle=col||UI.dim;cx.fillText(String(text).toUpperCase(),x,y);cx.restore();
}
function uiKeyCap(text,x,y,opt={}){
 cx.save();cx.font='9px "Pixel8",monospace';
 const pad=4,w=Math.ceil(cx.measureText(text).width)+pad*2,h=14;
 const bx=opt.align==='right'?x-w:x,by=y-h/2;
 cx.fillStyle='rgba(10,22,38,.92)';cx.fillRect(bx,by,w,h);
 cx.strokeStyle=opt.col||'rgba(120,220,255,.45)';cx.lineWidth=1;cx.strokeRect(bx+.5,by+.5,w-1,h-1);
 cx.fillStyle=opt.col||UI.cyan;cx.textAlign='left';cx.textBaseline='middle';
 cx.fillText(text,bx+pad,by+h/2+.5);
 cx.restore();
 return w;
}
function pixelTitle(s,x,y,size,col){
 cx.save();cx.textAlign='center';cx.textBaseline='middle';cx.font=size+'px "Pixel8",monospace';
 cx.fillStyle='rgba(0,0,0,.55)';cx.fillText(s,x+4,y+4);
 cx.fillStyle='rgba(255,90,200,.42)';cx.fillText(s,x-3,y+1);
 cx.fillStyle='rgba(80,230,255,.42)';cx.fillText(s,x+3,y-1);
 cx.fillStyle=col||'#eaffff';cx.fillText(s,x,y);
 cx.restore();
}
function drawTitleGrid(){
 const t=G.frame,horizon=330;
 cx.save();
 const g=cx.createLinearGradient(0,horizon-60,0,horizon+150);
 g.addColorStop(0,'rgba(20,80,120,0)');g.addColorStop(.55,'rgba(20,110,150,.10)');g.addColorStop(1,'rgba(5,10,20,0)');
 cx.fillStyle=g;cx.fillRect(0,horizon-60,W,220);
 cx.strokeStyle='rgba(90,220,255,.10)';cx.lineWidth=1;
 for(let i=0;i<=12;i++){
  const x=W/2+(i-6)*82;
  cx.beginPath();cx.moveTo(W/2,horizon);cx.lineTo(x,H+50);cx.stroke();
 }
 for(let i=1;i<9;i++){
  const y=horizon+Math.pow(i/9,1.7)*(H+50-horizon);
  cx.beginPath();cx.moveTo(0,y);cx.lineTo(W,y);cx.stroke();
 }
 cx.strokeStyle='rgba(110,240,255,.24)';
 cx.beginPath();cx.moveTo(0,horizon);cx.lineTo(W,horizon);cx.stroke();
 cx.fillStyle='rgba(110,240,255,'+(.05+.03*Math.sin(t/30))+')';
 cx.fillRect(0,horizon-1,W,2);
 cx.restore();
}
function drawMenuGrid(){
 const t=G.frame;
 cx.save();
 cx.strokeStyle='rgba(90,190,230,.045)';cx.lineWidth=1;
 for(let x=0;x<=W;x+=32){
  cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,H);cx.stroke();
 }
 for(let y=0;y<=H;y+=32){
  const yy=(y+t*.22)%H;
  cx.beginPath();cx.moveTo(0,yy);cx.lineTo(W,yy);cx.stroke();
 }
 const g=cx.createLinearGradient(0,H*.55,0,H);
 g.addColorStop(0,'rgba(40,130,180,0)');g.addColorStop(1,'rgba(40,130,180,.08)');
 cx.fillStyle=g;cx.fillRect(0,H*.55,W,H*.45);
 cx.restore();
}
function bigTitle(y){
 cx.save();
 if(ASSETS.ui_title){
  const w=340,h=w*(ASSETS.ui_title.height/ASSETS.ui_title.width);
  cx.globalAlpha=.16;cx.drawImage(ASSETS.ui_title,W/2-w/2,y-h-6,w,h);
  cx.globalAlpha=1;
 }
 const half=248;
 cx.strokeStyle='rgba(110,230,255,.34)';cx.lineWidth=1;
 cx.beginPath();
 cx.moveTo(W/2-half,y+26);cx.lineTo(W/2-24,y+26);
 cx.moveTo(W/2+24,y+26);cx.lineTo(W/2+half,y+26);
 cx.stroke();
 cx.fillStyle=UI.cyan;
 cx.fillRect(W/2-half,y+23,2,7);cx.fillRect(W/2+half-2,y+23,2,7);
 cx.fillRect(W/2-28,y+24,4,4);cx.fillRect(W/2+24,y+24,4,4);
 pixelTitle('SHATTERED REVERIE',W/2,y,26,'#eaffff');
 cx.textAlign='center';cx.textBaseline='middle';
 cx.font='10px "Pixel8",monospace';cx.fillStyle='#8de8ff';
 cx.fillText('~ BALLAD OF THE BORDERLESS SKY ~',W/2,y+46);
 cx.fillStyle=UI.magenta;cx.fillRect(W/2-3,y+59,6,2);
 cx.restore();
}
function drawTitle(){
 drawTitleGrid();
 cx.save();
 cx.font='8px "Pixel8",monospace';cx.textBaseline='top';cx.textAlign='left';
 cx.fillStyle='rgba(125,180,210,.7)';cx.fillText('BORDERLESS SKY // ONLINE',18,16);
 cx.textAlign='right';cx.fillStyle='rgba(125,180,210,.45)';
 cx.fillText('BUILD 20XX.10 // 640×480',W-18,16);
 cx.strokeStyle='rgba(110,230,255,.18)';cx.beginPath();
 cx.moveTo(18,30);cx.lineTo(236,30);cx.moveTo(W-236,30);cx.lineTo(W-18,30);cx.stroke();
 cx.restore();
 bigTitle(166);
 if(IS_TOUCH){
  touchBtn(W/2-118,286,236,50,'START',()=>{sfx('ok');G.screen='diff';G.idleT=0;},
   {id:'title:start',font:'bold 18px "Pixel8",monospace',col:UI.magenta});
  touchBtn(W/2-164,352,154,40,'SETTINGS',()=>{sfx('ok');G.settingsCursor=0;G.settingsFrom='title';G.screen='settings';},
   {id:'title:settings',col:UI.cyan});
  touchBtn(W/2+10,352,154,40,'HOW TO PLAY',()=>{sfx('ok');G.helpFrom='title';G.screen='help';},
   {id:'title:help',col:UI.cyan});
 }else{
  uiPanel(130,308,380,46,{cut:8,col:'rgba(110,230,255,.42)',ticks:true,fill:'rgba(3,9,18,.52)'});
  blinkText('PRESS  Z  TO  DEPLOY',H/2+92,18);
  cx.fillStyle=UI.dim;cx.font='9px "Pixel8",monospace';cx.textAlign='center';cx.textBaseline='top';
  cx.fillText('S  SETTINGS      H  HOW TO PLAY',W/2,H/2+142);
 }
 uiPanel(120,H-82,400,56,{cut:6,col:'rgba(90,220,255,.32)',ticks:false,fill:'rgba(3,9,18,.72)'});
 cx.textAlign='center';cx.textBaseline='top';
 cx.fillStyle=UI.dim;cx.font='8px "Pixel8",monospace';
 cx.fillText('GROUND-UP TRIBUTE // PROCEDURAL AUDIO & FX',W/2,H-70);
 cx.fillStyle=UI.cyan;cx.font='9px "Pixel8",monospace';
 cx.fillText('HI-SCORE  '+fmtScore(G.hi),W/2,H-52);
}
function blinkText(s,y,sz){
 const on=Math.floor(G.frame/26)%2===0;
 cx.save();cx.font=`${sz}px "Pixel8",monospace`;cx.textAlign='center';cx.textBaseline='middle';
 cx.globalAlpha=on?.55:.18;cx.fillStyle=UI.cyan;cx.fillText(s,W/2,y+1);
 cx.globalAlpha=on?1:.35;cx.fillStyle='#eaffff';cx.fillText(s,W/2,y);
 cx.restore();
}
function menuFrame(title){
 const code={diff:'SYS/DIFF',sel:'SYS/ROUTE',settings:'SYS/CFG',help:'SYS/HELP'}[G.screen]||'SYS/UI';
 uiPanel(48,104,W-96,312,{title:title,code:code,col:UI.cyan});
}
function drawDiff(){
 menuFrame('SELECT DIFFICULTY');
 if(IS_TOUCH)touchBtn(16,14,104,40,'BACK',()=>{sfx('cur');G.screen='title';G.idleT=0;},{id:'diff:back',col:'#9ab'});
 DIFFS.forEach((d,i)=>{
  const sel=i===G.diffCursor,y=142+i*48;
  const col=i===3?UI.amber:i===4?UI.green:UI.cyan;
  uiTile(86,y,W-172,42,{sel:sel,col:col,on:i===3||i===4});
  uiTag('0'+(i+1),100,y+9,sel?col:UI.dim);
  cx.font='22px "VT323R",monospace';cx.textAlign='left';cx.textBaseline='middle';
  cx.fillStyle=sel?'#f2ffff':(i===3?'#d8b85a':i===4?'#7ccf9d':'#9fb8c8');
  cx.fillText(d,132,y+21);
  if(i===3)uiTag('1CC',546,y+9,sel?UI.amber:UI.dim,'right');
  else if(i===4)uiTag('STORY',546,y+9,sel?UI.green:UI.dim,'right');
  else uiTag('MODE 0'+i,546,y+9,sel?UI.dim:'rgba(110,140,160,.55)','right');
  if(IS_TOUCH)TouchUI.add(90,y,W-180,42,()=>{
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
 const dc=G.diffCursor===3?UI.amber:G.diffCursor===4?UI.green:UI.cyan;
 uiPanel(86,386,W-172,26,{cut:4,ticks:false,col:dc,fill:'rgba(4,12,22,.82)'});
 cx.fillStyle=dc;cx.font='13px "VT323R",monospace';cx.textAlign='center';cx.textBaseline='middle';
 cx.fillText(desc,W/2,399);
 cx.fillStyle=UI.dim;cx.font='8px "Pixel8",monospace';cx.textBaseline='top';
 cx.fillText(IS_TOUCH?'TAP A MODE TO CHOOSE':'Z CONFIRM // ESC BACK',W/2,H-48);
}
function drawSel(){
 menuFrame('SELECT STAGE');
 if(IS_TOUCH){
  touchBtn(16,14,104,40,'BACK',()=>{sfx('cur');G.screen='diff';},{id:'sel:back',col:'#9ab'});
  const x0=76,x1=326,cw=238,y0=136,rh=52,ch=42;
  ROUTES.forEach((r,i)=>{
   const col=i%2,row=(i/2)|0;
   const x=x0+col*(x1-x0),y=y0+row*rh,on=G.selFlags[i];
   const cc=on?UI.green:UI.cyan;
   uiTile(x,y,cw,ch,{on:on,col:cc,fill:on?'rgba(24,62,48,.66)':'rgba(5,13,25,.72)'});
   uiTag('STG.'+(i+1<10?'0':'')+(i+1),x+10,y+7,on?UI.green:UI.dim);
   cx.font='18px "VT323R",monospace';cx.textAlign='left';cx.textBaseline='middle';
   cx.fillStyle=on?'#eaffff':'#a9c0ce';
   cx.fillText((on?'■ ':'□ ')+r.title,x+10,y+ch/2+3);
   cx.textAlign='right';cx.font='10px "VT323R",monospace';cx.fillStyle=on?'#7ccf9d':'#64808f';
   cx.fillText(r.bosses.length+' BOSSES',x+cw-9,y+ch-8);
   TouchUI.add(x,y,cw,ch,()=>{G.selFlags[i]=!G.selFlags[i];sfx('ok');},'sel:stage:'+i);
  });
  touchBtn(x0,346,cw,40,'SELECT ALL',()=>{G.selFlags.fill(true);sfx('ok');},{id:'sel:all',col:UI.cyan});
  touchBtn(x1,346,cw,40,'START',()=>{
   if(!G.selFlags.some(f=>f)){sfx('no');return;}
   sfx('ok');startRun();
  },{id:'sel:start',font:'bold 12px "Pixel8",monospace',col:UI.magenta,on:G.selFlags.some(f=>f)});
  cx.textAlign='center';cx.textBaseline='top';cx.font='8px "Pixel8",monospace';
  cx.fillStyle=G.selFlags.some(f=>f)?UI.dim:UI.red;
  cx.fillText(G.selFlags.some(f=>f)?'TAP STAGES TO TOGGLE THEM':'SELECT AT LEAST ONE STAGE',W/2,398);
  return;
 }
 const y0=150,gap=24;
 ROUTES.forEach((r,i)=>{
  const sel=i===G.selCursor,on=G.selFlags[i];
  const rowY=y0+i*gap,col=on?UI.green:UI.cyan;
  uiTile(108,rowY-16,444,22,{sel:sel,on:on,col:col,fill:'rgba(5,13,25,.55)'});
  cx.textAlign='left';cx.textBaseline='middle';cx.font='20px "VT323R",monospace';
  cx.fillStyle=sel?'#f2ffff':(on?'#9fd7b5':'#a9bcc8');
  cx.fillText((on?'■ ':'□ ')+r.title,124,rowY-5);
  cx.textAlign='right';cx.font='10px "VT323R",monospace';cx.fillStyle=on?'#7ccf9d':'#64808f';
  cx.fillText(r.bosses.length+' BOSSES',540,rowY-5);
 });
 const allIdx=ROUTES.length,startIdx=ROUTES.length+1;
 const rows=[
  [allIdx,'SELECT ALL','rgba(5,13,25,.55)',UI.cyan],
  [startIdx,'START','rgba(24,10,28,.62)',UI.magenta]
 ];
 rows.forEach(([idx,label,fill,col])=>{
  const sel=idx===G.selCursor,rowY=y0+idx*gap;
  uiTile(108,rowY-16,444,22,{sel:sel,col:col,fill:fill});
  const off=idx===startIdx&&!G.selFlags.some(f=>f);
  cx.textAlign='left';cx.textBaseline='middle';cx.font='20px "VT323R",monospace';
  cx.fillStyle=off?'#5f5968':(sel?'#f2ffff':'#9fb0bc');
  cx.fillText(label,124,rowY-5);
 });
 cx.textAlign='center';cx.fillStyle=UI.dim;cx.font='8px "Pixel8",monospace';cx.textBaseline='top';
 cx.fillText('Z TOGGLE / START // ESC BACK // SELECT AT LEAST ONE STAGE',W/2,H-48);
}
function drawPause(){
 cx.fillStyle='rgba(0,0,10,.76)';cx.fillRect(0,0,W,H);
 pixelTitle('PAUSED',W/2,88,24,UI.cyan);
 uiTag('SIMULATION HALTED',W/2,108,UI.dim,'center');
 uiPanel(64,132,292,232,{title:'COMMAND',code:'SYS/PAUSE',col:UI.cyan});
 ['Resume','Restart Stage','How to Play','Settings','Return to Title'].forEach((s,i)=>{
  const sel=i===G.pauseCursor;
  if(sel)uiCursor(84,180+i*40-6,UI.magenta);
  cx.font='22px "VT323R",monospace';cx.textAlign='left';cx.textBaseline='middle';
  cx.fillStyle=sel?'#f2ffff':'#8fa6b6';
  cx.fillText(s,100,180+i*40);
  if(i===1){
   cx.textAlign='right';cx.fillStyle=sel?(G_coins>0?UI.amber:'#865c36'):'#5e7180';
   cx.font='8px "Pixel8",monospace';cx.fillText('1 CREDIT',340,180+i*40);
  }
  if(IS_TOUCH&&!G.pauseConfirm)TouchUI.add(80,180+i*40-26,280,38,()=>{
   G.pauseCursor=i;edge[KEY.Z]=true;
  },'pause:'+i);
 });
 uiPanel(368,132,210,232,{title:'TELEMETRY',code:'LIVE',col:UI.blue});
 cx.textAlign='left';cx.textBaseline='top';cx.font='16px "VT323R",monospace';
 const st=[['Score',fmtScore(G.score)],['Graze',PL.graze],['Deaths',G.deaths],
  ['Spells',G.spellsCaptured+' / '+G.spellsPlayed],['Credits',G_coins],
  ['Difficulty',G.oneCC?'1CC':G.story?'Story':DIFFS[DIFF]]];
 st.forEach(([k,v],i)=>{
  if(i%2===0){cx.fillStyle='rgba(90,170,200,.06)';cx.fillRect(380,176+i*26,186,20);}
  cx.fillStyle='#6f8ca8';cx.fillText(k,382,168+i*26);
  cx.textAlign='right';cx.fillStyle='#dff4ff';cx.fillText(String(v),558,168+i*26);
  cx.textAlign='left';
 });
 cx.textAlign='center';cx.fillStyle=UI.dim;cx.font='8px "Pixel8",monospace';cx.textBaseline='top';
 cx.fillText(IS_TOUCH?'TAP AN OPTION':'ESC RESUME // Z CONFIRM // X CANCEL',W/2,H-28);
 if(G.pauseConfirm){
  const ccol=G.pauseConfirm==='restart'?UI.amber:UI.red;
  cx.fillStyle='rgba(0,0,0,.8)';cx.fillRect(0,0,W,H);
  uiPanel(110,150,420,230,{title:'CONFIRM',code:'LOCKED',col:ccol});
  cx.textAlign='center';cx.textBaseline='top';
  cx.fillStyle=ccol;cx.font='18px "Pixel8",monospace';
  cx.fillText(G.pauseConfirm==='restart'?'RESTART STAGE?':'RETURN TO TITLE?',W/2,194);
  cx.font='15px "VT323R",monospace';
  if(G.pauseConfirm==='restart'){
   cx.fillStyle=UI.amber;
   cx.fillText('Costs 1 credit'+(G.oneCC?' · ends 1CC eligibility':''),W/2,228);
   cx.fillStyle=UI.red;cx.fillText('CREDITS LEFT '+G_coins,W/2,252);
  }else{
   cx.fillStyle='#bcd4e4';cx.fillText('Current run progress will be lost.',W/2,228);
  }
  if(IS_TOUCH){
   touchBtn(W/2-160,286,140,42,'CONFIRM',()=>{edge[KEY.Z]=true;},
    {id:'pause:confirm',col:UI.green,font:'bold 12px "Pixel8",monospace'});
   touchBtn(W/2+20,286,140,42,'CANCEL',()=>{edge[KEY.X]=true;},
    {id:'pause:cancel',col:UI.red,font:'bold 12px "Pixel8",monospace'});
  }else{
   cx.fillStyle='#dff';cx.font='10px "Pixel8",monospace';
   cx.fillText('Z  CONFIRM      X  CANCEL',W/2,306);
  }
 }
}
function drawGameover(){
 cx.fillStyle='rgba(18,0,10,.66)';cx.fillRect(0,0,W,H);
 cx.save();
 cx.globalAlpha=.18;cx.fillStyle=UI.red;
 for(let i=0;i<4;i++){
  const y=(G.frame*1.7+i*137)%H;
  cx.fillRect(0,y,W,2+(i%2)*3);
 }
 cx.restore();
 uiPanel(70,82,500,360,{title:'SYSTEM FAILURE',code:'ERR/DEATH',col:UI.red});
 cx.save();
 cx.font='8px "Pixel8",monospace';cx.textAlign='left';cx.textBaseline='top';
 cx.fillStyle='rgba(255,120,140,.55)';cx.fillText('SIGNAL LOST // REVIVE WINDOW OPEN',110,112);
 cx.restore();
 pixelTitle('GAME OVER',W/2,140,32,UI.red);
 const R=G.routeQueue.length?ROUTES[G.routeQueue[G.routeIdx]]:null;
 const bd=R?BOSS_DEFS[R.bosses[clamp(G_contBoss,0,R.bosses.length-1)]]:null;
 cx.fillStyle='#8fa4b4';cx.font='15px "VT323R",monospace';cx.textAlign='center';cx.textBaseline='top';
 cx.fillText((R?R.title:'')+(bd?' · '+bd.name:''),W/2,174);
 cx.fillStyle='#8fa4b4';cx.font='10px "Pixel8",monospace';
 cx.fillText('SCORE',W/2,204);
 cx.fillStyle='#f2ffff';cx.font='16px "Pixel8",monospace';
 cx.fillText(fmtScore(G.score),W/2,220);
 cx.fillStyle=UI.amber;cx.font='10px "Pixel8",monospace';
 cx.fillText('CREDITS ×'+G_coins,W/2,250);
 if(IS_TOUCH){
  touchBtn(W/2-190,274,380,44,'CONTINUE AT BOSS',()=>{
   if(G_coins>0)edge[KEY.C]=true;else sfx('no');
  },{id:'gameover:continue',on:G_coins>0,sub:'1 CREDIT',col:UI.green});
  touchBtn(W/2-190,330,380,44,'RETRY STAGE',()=>{
   if(G_coins>0)edge[KEY.Z]=true;else sfx('no');
  },{id:'gameover:retry',on:G_coins>0,sub:'1 CREDIT',col:UI.amber});
  touchBtn(W/2-190,386,380,40,'RETURN TO TITLE',()=>{edge[KEY.X]=true;},{id:'gameover:title',col:UI.red});
  return;
 }
 let y=288;
 if(G_coins>0){
  cx.fillStyle='#dff';cx.font='17px "VT323R",monospace';
  cx.fillText('C — Continue at this boss (1 credit)',W/2,y);y+=30;
  cx.fillText('Z / R — Retry this stage (1 credit)',W/2,y);y+=30;
 }else{
  cx.fillStyle='#7d5c68';cx.font='9px "Pixel8",monospace';
  cx.fillText('NO CREDITS REMAINING',W/2,y);y+=30;
 }
 cx.fillStyle='#7f93a2';cx.font='15px "VT323R",monospace';
 cx.fillText('X — Return to title',W/2,y);
 if(!IS_TOUCH){
  cx.fillStyle='rgba(255,90,110,.22)';cx.fillRect(110,398,420,1);
  cx.textAlign='left';cx.textBaseline='top';cx.fillStyle='#8b6570';cx.font='7px "Pixel8",monospace';
  cx.fillText('RUN TERMINATED // CREDIT LINK AVAILABLE',110,406);
  cx.textAlign='right';cx.fillText('NO SIGNAL',530,406);
 }
}
function drawResult(){
 uiPanel(48,28,544,430,{title:'RESULTS',code:'RUN/COMPLETE',col:UI.cyan});
 cx.save();
 cx.font='8px "Pixel8",monospace';cx.textAlign='left';cx.textBaseline='top';
 cx.fillStyle='rgba(125,190,220,.62)';cx.fillText('OPERATION REPORT // FINAL TELEMETRY',66,62);
 cx.textAlign='right';cx.fillStyle=G.oneCC?(G.oneCCFailed?UI.red:UI.amber):UI.dim;
 cx.fillText(G.oneCC?(G.oneCCFailed?'1CC FAILED':'1CC RUN'):'STANDARD RUN',574,62);
 cx.restore();
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
  const y=104+i*30;
  cx.fillStyle=i%2===0?'rgba(80,160,190,.055)':'rgba(0,0,0,0)';
  cx.fillRect(66,y-19,382,25);
  cx.textAlign='left';cx.textBaseline='middle';cx.fillStyle='#7d9aad';cx.font='17px "VT323R",monospace';
  cx.fillText(k,76,y-5);
  cx.textAlign='right';cx.fillStyle=i===6?UI.amber:'#dff4ff';cx.font=(i===6?'12px':'18px')+' "Pixel8",monospace';
  cx.fillText(String(v),436,y-4);
 });
 if(G.resultT>100){
  const ri=rankInfo();
  cx.textAlign='left';cx.textBaseline='middle';cx.fillStyle='#7d9aad';cx.font='17px "VT323R",monospace';
  cx.fillText('Spell Clear Rate',76,332);
  cx.textAlign='right';
  if(G.resultT<140){
   cx.fillStyle='#dff4ff';cx.font='18px "Pixel8",monospace';
   cx.fillText(irnd(0,99)+'%',436,332);
  }else{
   cx.fillStyle=ri.c;cx.font='14px "Pixel8",monospace';
   cx.fillText(ratePct()+'%',436,332);
  }
  cx.strokeStyle='rgba(110,220,255,.18)';cx.lineWidth=1;
  cx.beginPath();cx.moveTo(460,88);cx.lineTo(460,340);cx.stroke();
  cx.fillStyle=UI.cyan;cx.fillRect(458,88,2,4);cx.fillRect(458,336,2,4);
  if(G.resultT>=140){
   cx.save();cx.translate(530,178);cx.rotate(Math.PI/4);
   cx.strokeStyle=ri.c;cx.globalAlpha=.35;cx.lineWidth=1;cx.strokeRect(-46,-46,92,92);
   cx.globalAlpha=.16;cx.strokeRect(-36,-36,72,72);cx.restore();
   cx.textAlign='center';cx.textBaseline='middle';
   cx.save();cx.shadowColor=ri.c;cx.shadowBlur=22;
   cx.fillStyle=ri.c;cx.font='76px "Pixel8",monospace';
   cx.fillText(ri.r,530,178);cx.restore();
   cx.fillStyle='#dff4ff';cx.font='8px "Pixel8",monospace';
   const words=ri.t.split(' ');let line='',yy=234;
   for(const w of words){
    if((line+' '+w).trim().length>13){cx.fillText(line.trim(),530,yy);yy+=14;line=w;}
    else line+=' '+w;
   }
   if(line.trim())cx.fillText(line.trim(),530,yy);
  }
  if(G.newHi&&G.resultT>150){
   cx.textAlign='center';cx.fillStyle=UI.amber;cx.font='9px "Pixel8",monospace';
   cx.fillText('NEW RECORD',530,300);
  }
 }
 if(G.oneCC&&G.resultT>140){
  const cleared=!G.oneCCFailed&&(G.creditsUsed||0)===0;
  const c=cleared?UI.amber:UI.dim;
  uiPanel(76,354,380,26,{cut:4,ticks:false,col:c,fill:'rgba(4,12,22,.82)'});
  cx.textAlign='center';cx.textBaseline='middle';
  cx.fillStyle=c;cx.font='10px "Pixel8",monospace';
  cx.fillText(cleared?'★ 1CC CLEAR ★':'1CC FAILED'+(G.creditsUsed?' · '+G.creditsUsed+' CREDIT(S) USED':''),266,367);
 }
 if(IS_TOUCH){
  if(G.resultT>90)touchBtn(W/2-110,H-74,220,42,'CONTINUE',()=>{edge[KEY.Z]=true;},
   {id:'result:continue',col:UI.cyan,font:'bold 12px "Pixel8",monospace'});
 }else if(G.resultT>170)blinkText('Z  BACK TO TITLE',H-38,15);
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
  const active=it.k==='mute'?AudioSys.muted:vol?true:(it.k!=='back'&&!!settings[it.k]);
  const sel=G.settingsCursor===i,back=it.k==='back';
  const cc=back?UI.red:(sel?UI.cyan:(active?UI.green:'rgba(90,160,190,.32)'));
  uiTile(x,y,cw,ch,{sel:sel,col:cc,on:active,fill:back?'rgba(24,8,18,.62)':'rgba(5,13,25,.72)'});
  uiTag('0'+(i+1),x+9,y+7,sel?cc:UI.dim);
  cx.textAlign='left';cx.textBaseline='top';
  cx.fillStyle=back?'#f3a8b8':'#dff4ff';cx.font='16px "VT323R",monospace';
  cx.fillText(it.label,x+9,y+17);
  if(!back){
   cx.textAlign='right';cx.font='10px "Pixel8",monospace';
   cx.fillStyle=active?UI.green:'#6d8494';
   cx.fillText(val,x+cw-9,y+17);
   if(vol){
    const ratio=it.k==='musicVol'?VOL_STEPS[settings.musicVol]:SFX_STEPS[settings.sfxVol];
    uiSegBar(x+24,y+31,cw-48,6,ratio,UI.cyan,{segs:12});
    cx.fillStyle=sel?UI.cyan:UI.dim;cx.font='10px "VT323R",monospace';cx.textBaseline='middle';
    cx.textAlign='left';cx.fillText('◀',x+9,y+34);
    cx.textAlign='right';cx.fillText('▶',x+cw-9,y+34);
   }else{
    cx.fillStyle=active?UI.green:'#5f7588';
    cx.fillRect(x+cw-14,y+31,5,5);
   }
  }
  if(back){
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
 cx.textAlign='center';cx.fillStyle=UI.dim;cx.font='8px "Pixel8",monospace';cx.textBaseline='top';
 cx.fillText('TAP OR STICK + FIRE // ◀ ▶ ADJUST // BACK RETURNS',W/2,H-30);
}
function drawSettings(){
 if(IS_TOUCH){drawTouchSettings();return;}
 menuFrame('SETTINGS');
 SETTINGS_ITEMS.forEach((it,i)=>{
  const sel=i===G.settingsCursor,y=150+i*24,rowY=y-17;
  const vol=it.k==='musicVol'||it.k==='sfxVol',back=it.k==='back';
  const cc=back?UI.red:(sel?UI.cyan:UI.blue);
  uiTile(98,rowY,444,22,{sel:sel,col:cc,fill:back?'rgba(24,8,18,.5)':'rgba(5,13,25,.55)'});
  if(sel)uiCursor(106,y-5,cc);
  cx.textBaseline='middle';cx.textAlign='left';
  cx.font='18px "VT323R",monospace';
  cx.fillStyle=back?'#f3a8b8':(sel?'#f2ffff':'#a6bac8');
  cx.fillText(it.label,118,y-4);
  if(back)return;
  let val;
  if(it.k==='musicVol')val=Math.round(VOL_STEPS[settings.musicVol]*100)+'%';
  else if(it.k==='sfxVol')val=Math.round(SFX_STEPS[settings.sfxVol]*100)+'%';
  else if(it.k==='mute')val=AudioSys.muted?'ON':'OFF';
  else val=settings[it.k]?'ON':'OFF';
  const on=it.k==='mute'?AudioSys.muted:(vol?true:!!settings[it.k]);
  cx.textAlign='right';cx.font='11px "Pixel8",monospace';
  cx.fillStyle=on?UI.green:'#6d8494';
  cx.fillText((vol?'◀ '+val+' ▶':val),530,y-4);
 });
 cx.textAlign='center';cx.fillStyle=UI.dim;cx.font='8px "Pixel8",monospace';cx.textBaseline='top';
 cx.fillText('UP/DOWN SELECT // LEFT/RIGHT ADJUST // Z TOGGLE // ESC BACK',W/2,H-48);
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
  ['GRAZE','Charges flash + OD'],['FLASH','30 graze: clear + damage'],['OVERDRIVE','80 graze: ×1.5 dmg'],
  ['1CC','Full route · 1 credit'],['CONTINUE','1 credit · ends 1CC'],['RETRY','Pause restart · 1 credit'],
  ['STORY','Waves, then the boss'],['RANK','Capture spells to rank up']
 ];
 cx.textAlign='left';cx.textBaseline='top';
 cx.font='8px "Pixel8",monospace';cx.fillStyle=UI.cyan;
 cx.fillText('INPUT MATRIX',86,140);
 cx.fillText('SYSTEM RULES',332,140);
 cx.strokeStyle='rgba(110,220,255,.18)';cx.lineWidth=1;
 cx.beginPath();cx.moveTo(86,152);cx.lineTo(296,152);cx.moveTo(332,152);cx.lineTo(560,152);cx.stroke();
 cx.beginPath();cx.moveTo(316,140);cx.lineTo(316,362);cx.stroke();
 cx.fillStyle=UI.cyan;cx.fillRect(314,140,2,4);cx.fillRect(314,358,2,4);
 left.forEach(([k,v],i)=>{
  const y=162+i*21;
  if(i%2===0){cx.fillStyle='rgba(80,160,190,.05)';cx.fillRect(84,y-3,224,20);}
  cx.font='8px "Pixel8",monospace';cx.fillStyle=[UI.cyan,UI.magenta,UI.amber][i%3];cx.fillText(k,86,y);
  cx.font='15px "VT323R",monospace';cx.fillStyle='#cfdfe8';cx.fillText(v,168,y-2);
 });
 right.forEach(([k,v],i)=>{
  const y=162+i*21;
  if(i%2===0){cx.fillStyle='rgba(80,160,190,.05)';cx.fillRect(330,y-3,230,20);}
  cx.font='8px "Pixel8",monospace';cx.fillStyle=UI.amber;cx.fillText(k,332,y);
  cx.font='15px "VT323R",monospace';cx.fillStyle='#cfdfe8';cx.fillText(v,412,y-2);
 });
 cx.textAlign='center';cx.fillStyle=UI.dim;cx.font='8px "Pixel8",monospace';cx.textBaseline='top';
 cx.fillText(IS_TOUCH?'TAP BACK TO RETURN':'ESC / Z  BACK',W/2,H-48);
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
/* The DOM pad and canvas tap zones are wired in boot.js. */

startTitleBgm();
