 "use strict";
 function loadSelFlags(){
  const f=new Array(ROUTES.length).fill(IS_TOUCH);
  try{
   const raw=JSON.parse(localStorage.getItem('lasr_sel')||'null');
   if(Array.isArray(raw))for(let i=0;i<ROUTES.length;i++)f[i]=raw[i]===true;
  }catch(e){}
  return f;
 }
 function hiKey(d){return d>=0&&d<=2?'lasr_hi_'+d:'lasr_hi';}
 function readHi(d){
  try{
   const raw=localStorage.getItem(hiKey(d));
   if(raw!==null){const n=parseInt(raw,10);if(Number.isFinite(n)&&n>=0)return n;}
  }catch(e){}
  return -1;
 }
 function saveSelFlags(){try{localStorage.setItem('lasr_sel',JSON.stringify(G.selFlags));}catch(e){}}
 function syncHiFor(d){const v=readHi(d);G.hi=v>=0?v:0;G.newHi=false;}
 const G={score:0,hi:0,dispScore:0,spellsPlayed:0,spellsCaptured:0,deaths:0,
 routeQueue:[],routeIdx:0,bossIdx:0,screen:'title',frame:0,simFrame:0,simBeat:0,freeze:0,spellBombUsed:false,lastBonusLost:false,
 selFlags:loadSelFlags(),selCursor:0,diffCursor:1,pauseCursor:0,pauseConfirm:null,
 settingsCursor:0,settingsFrom:'title',helpFrom:'title',gpadCursor:0,gpadMsg:'',replayCursor:0,replayFrom:'settings',
 bannerT:0,bannerText:'',monoRay:null,resultT:0,livesPulse:0,newHi:false,oneCCFailed:false,
 shakeEnabled:true,bloomEnabled:true,flashEnabled:true,aiDialogue:true,
 od:0,odMax:80,trance:0,streak:0,bestStreak:0,streakMult:1,sparksGot:0,spellUsedOwn:0,
 spellHist:[],beat:0,dim:0,oneCC:false,creditsUsed:0,coins:3,contRoute:0,contBoss:0,story:false,needWave:false,wave:null,
 replay:false,replayEnded:false,replaySaved:false,replayResult:'',replayMsg:'',online:false,
 onlineMode:'menu',onlineCursor:0,onlineCode:'',onlineMsg:'',onlineFrom:'title',
 charaCursor:0,charaSlot:0,charaFrom:'diff',charaAfter:'sel',charaPicks:[loadChara(0),loadChara(1)]};
 try{
  const d=parseInt(localStorage.getItem('lasr_diff')||'1');if(d>=0&&d<=2)DIFF=d;
  const v=readHi(DIFF);
  if(v>=0)G.hi=v;
  else G.hi=parseInt(localStorage.getItem('lasr_hi')||'0')||0;
 }catch(e){}
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
 {k:'replay',label:'Replay'},
 {k:'controller',label:'Controller'},
 {k:'back',label:'Back'}
];
const CONTROLLER_ROWS=[
 {k:'enabled',label:'Controller Input'},
 {k:'shot',label:'Shot / Confirm'},
 {k:'flash',label:'Flash'},
 {k:'spell',label:'Spell'},
 {k:'focus',label:'Focus'},
 {k:'pause',label:'Pause / Start'},
 {k:'cancel',label:'Back / Cancel'},
 {k:'reset',label:'Reset Bindings'},
 {k:'back',label:'Back'}
];
const settings={musicVol:musicVolIdx,sfxVol:sfxVolIdx,mute:false,shake:true,bloom:true,flash:true,
 autoFire:!!autoFire,showFps:!!showFps,aiDialogue:true,coop:false};
function saveSettings(){try{localStorage.setItem('lasr_settings',JSON.stringify(settings));}catch(e){}}
function applySettings(){
 G.shakeEnabled=settings.shake!==false;
 G.bloomEnabled=settings.bloom!==false;
 G.flashEnabled=settings.flash!==false;
 G.aiDialogue=(typeof G!=='undefined'&&G.online)?false:settings.aiDialogue!==false;
 autoFire=(typeof G!=='undefined'&&G.online)?false:!!settings.autoFire;
 showFps=!!settings.showFps;
 setMusicVol(settings.musicVol,true);setSfxVol(settings.sfxVol,true);
}
function loadSettings(){
 let raw=null;
 try{
  if(localStorage.getItem('lasr_mute')==='1')AudioSys.muted=true;
  raw=JSON.parse(localStorage.getItem('lasr_settings')||'null');
  if(raw&&typeof raw==='object'){
   if(Number.isFinite(raw.musicVol))settings.musicVol=clamp(raw.musicVol|0,0,VOL_STEPS.length-1);
   if(Number.isFinite(raw.sfxVol))settings.sfxVol=clamp(raw.sfxVol|0,0,SFX_STEPS.length-1);
   for(const k of ['mute','shake','bloom','flash','autoFire','showFps','aiDialogue','coop'])
    if(typeof raw[k]==='boolean')settings[k]=raw[k];
  }
 }catch(e){}
 try{
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)
   for(const k of ['shake','bloom','flash'])
    if(!(raw&&typeof raw[k]==='boolean'))settings[k]=false;
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
for(let i=0;i<110;i++){const l=i%3;stars.push({x:rnd(W),y:rnd(H),s:rnd(.4,2.2),v:rnd(.3,1.6),l,col:l===2?'#fff':'#cfe0ff'});}
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
  if(p.y>H+8){p.y=-8;p.x=vrnd(W);}
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

function saveHi(){if(G.replay||G.online)return;if(G.score>G.hi){G.hi=G.score;G.newHi=true;try{localStorage.setItem(hiKey(DIFF),String(G.hi));if(DIFF>=0&&DIFF<=2)localStorage.setItem('lasr_hi',String(G.hi));}catch(e){}}}
function spendCredit(){if(G.coins<=0)return false;G.coins--;G.creditsUsed=(G.creditsUsed||0)+1;return true;}
function goTitle(saveScore=true){
 if(saveScore)saveHi();
 if(typeof Net!=='undefined'&&Net)Net.onTitle();
 if(Replay.rec)Replay.abort();
 if(G.replay)Replay.stop();
 deactivatePlayer2();clearP2Input();
 TouchUI.focus=false;TouchUI.resetStick();
 Gdemo=false;G.screen='title';G.idleT=0;G.pauseConfirm=null;G.bannerT=0;
 G.replayEnded=false;G.replaySaved=false;G.replayResult='';G.replayMsg='';
 BOSS=null;resetFieldSafe();fx.length=0;ftext.length=0;G.monoRay=null;
 G.wave=null;G.needWave=false;
 startTitleBgm();
}

function beginRunRecording(){
 if(G.replay)return;
 G.replayEnded=false;G.replaySaved=false;G.replayResult='';G.replayMsg='';
 const cfg={diff:DIFF,story:!!G.story,oneCC:!!G.oneCC,flags:G.selFlags.slice(),
  autoFire:!!autoFire,chara:G.charaPicks[0]|0,p2chara:G.charaPicks[1]|0,
  routeTitles:G.routeQueue.map(i=>ROUTES[i].title)};
 if(typeof Net!=='undefined'&&Net.active)Replay.startOnlineRecording(Object.assign({seed:Net.seed},cfg));
 else Replay.startRecording(cfg);
}
function startRun(){
 G.routeQueue=[];
 if(G.oneCC)ROUTES.forEach((r,i)=>{G.routeQueue.push(i);});
 else ROUTES.forEach((r,i)=>{if(G.selFlags[i])G.routeQueue.push(i);});
 if(!G.routeQueue.length)return;
 syncHiFor(DIFF);
 beginRunRecording();
 G.routeIdx=-1;G.bossIdx=0;G.score=0;G.dispScore=0;G.spellsPlayed=0;G.spellsCaptured=0;G.deaths=0;
 G.simFrame=0;G.simBeat=0;G.freeze=0;
 G.od=0;G.trance=0;G.streak=0;G.bestStreak=0;G.streakMult=1;G.sparksGot=0;G.spellHist=[];
 G.creditsUsed=0;G.oneCCFailed=false;G.newHi=false;G.pauseConfirm=null;G.resultT=0;G.spellUsedOwn=0;
 G.coins=G.oneCC?1:3;
 resetBanterRun();
 TouchUI.focus=false;TouchUI.resetStick();
 BOSS=null;resetFieldSafe();fx.length=0;ftext.length=0;G.monoRay=null;
 G.wave=null;G.needWave=!!G.story;mobs.length=0;
 PL.chara=clamp(G.charaPicks[0]|0,0,CHARA_COUNT-1);
 P2.chara=clamp(G.charaPicks[1]|0,0,CHARA_COUNT-1);
 resetPlayer(true);PL.graze=0;PL.power=300;
 if(((typeof Net!=='undefined'&&Net.active)||settings.coop||(typeof Replay!=='undefined'&&Replay.wantP2))&&!G.story&&!Gdemo)activatePlayer2();
 else{deactivatePlayer2();clearP2Input();}
 nextRoute();
}
function nextRoute(){
 G.routeIdx++;G.bossIdx=0;
 const R=ROUTES[G.routeQueue[G.routeIdx]];
 bgTint=R.tint;bgMode=R.mode||'';
 mobs.length=0;G.wave=null;G.needWave=!!G.story;
 for(const p of players){
  p.lives=Math.min(8,p.lives+(G.routeIdx>0?1:0));
  p.spells=2;p.power=Math.max(p.power,300);
  if(p.dead===2&&p.lives>0){
   p.dead=0;p.alive=true;p.deathT=0;p.deathWindow=0;p.rebirthX=0;p.rebirthY=0;p.inv=120;
   p.x=p===P2?clamp(PL.x+56,20,W-20):W/2;p.y=H-70;
  }
 }
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
function continueFromBoss(){
 if(!spendCredit())return;
 G.replaySaved=false;G.replayEnded=false;
 resetBanterRun();
 beginRunRecording();
 BOSS=null;resetFieldSafe();fx.length=0;ftext.length=0;G.monoRay=null;
 G.wave=null;G.needWave=false;mobs.length=0;G.pauseConfirm=null;
 if(((typeof Net!=='undefined'&&Net.active)||settings.coop||(typeof Replay!=='undefined'&&Replay.wantP2))&&!G.story&&!Gdemo)activatePlayer2();
 for(const p of players){resetPlayer(true,p);p.inv=180;p.power=Math.max(p.power,300);}
 G.routeIdx=clamp(G.contRoute,0,G.routeQueue.length-1);
 const R=ROUTES[G.routeQueue[G.routeIdx]];
 G.bossIdx=clamp(G.contBoss,0,R.bosses.length-1);
 bgTint=R.tint;bgMode=R.mode||'';
 G.bannerText='CONTINUE';G.bannerT=80;G.screen='play';
 startStageBgm(R);
 beginBossFight();
}
function onGameOver(){
 G.contRoute=G.routeIdx;G.contBoss=G.bossIdx;
  TouchUI.resetStick();
 if(G.replay){showResults();return;}
 if(G.online){G.oneCCFailed=true;showResults();return;}
 if(Replay.rec)G.replaySaved=Replay.finish('FAILED');
 G.replayEnded=false;
 saveHi();
 BOSS=null;resetFieldSafe();fx.length=0;ftext.length=0;G.monoRay=null;
 mobs.length=0;G.wave=null;G.needWave=false;
 stopBgm();
 if(G.oneCC){G.oneCCFailed=true;showResults();}
 else{G.screen='gameover';G.resultT=0;}
}
function showResults(){
 if(typeof Net!=='undefined'&&Net.active){Net.active=false;Net.capturing=false;if(typeof DMath!=='undefined')DMath.disable();}
 if(Replay.rec)G.replaySaved=Replay.finish(G.oneCCFailed?'FAILED':'CLEAR');
 G.replayEnded=!!G.replay;
 TouchUI.resetStick();
 BOSS=null;resetFieldSafe();fx.length=0;ftext.length=0;G.monoRay=null;
 mobs.length=0;G.wave=null;G.needWave=false;
 G.screen='result';G.resultT=0;stopBgm();saveHi();
}
function ratePct(){return G.spellsPlayed?Math.floor(G.spellsCaptured/G.spellsPlayed*100):0;}
function runModeName(){
 if(G.online)return G.oneCC?'ONLINE 1CC':'ONLINE';
 if(G.story&&G.oneCC)return 'STORY 1CC';
 if(G.oneCC)return '1CC';
 if(G.story)return 'STORY';
 return 'STANDARD';
}
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
 if(!Gdemo&&hitK(KEY.R)){
  if(G.replay){Replay.stop();goTitle(false);sfx('cur');return;}
  G.screen='pause';G.pauseCursor=1;sfx('cur');return;
 }
 G.simFrame++;
 const _sb=(G.simFrame>>2)%4;G.simBeat=_sb===0?1:.7*(1-_sb/4);
 if(G.dispScore<G.score)G.dispScore=Math.min(G.score,G.dispScore+Math.max(1,Math.ceil((G.score-G.dispScore)*.18)));
 else G.dispScore=G.score;
 if(G.livesPulse>0)G.livesPulse--;
 if(G.trance>0){G.trance--;if(G.trance===0){G.od=0;}}
 for(const p of players){playerUpdate(p);playerGrazeCheck(p);}
 bossUpdate();
 mobUpdate();updateStoryWave();
 eUpdate();pUpdate();itemUpdate();laserUpdate();
 for(let i=fx.length-1;i>=0;i--){
  const f=fx[i];
  if(f.t==='p'){f.x+=f.vx;f.y+=f.vy;f.vx*=.94;f.vy*=.94;}
  else if(f.t==='puff'||f.t==='shard'||f.t==='spr'){f.x+=f.vx;f.y+=f.vy;}
  f.life--;if(f.life<=0)killFx(i,fx);
 }
 for(let i=ftext.length-1;i>=0;i--){const t=ftext[i];t.y+=t.vy;t.life--;if(t.life<=0)killFx(i,ftext);}
 if(shakeT>0)shakeT--;
 if(flashA>0)flashA-=.06;
 if(G.bannerT>0)G.bannerT--;
 else if(G.story&&!Gdemo){
  if(!BOSS&&G.needWave&&!G.wave&&!allPlayersDown())startStoryWave();
  else if(!BOSS&&!G.needWave&&!G.wave&&G.bossIdx===0&&!allPlayersDown())beginBossFight();
 }
 else if(!BOSS&&G.bossIdx===0&&!allPlayersDown())beginBossFight();
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
    else if(hitK(KEY.S)){sfx('ok');G.settingsCursor=0;G.settingsFrom='title';G.screen='settings';}
    else if(hitK(KEY.H)){sfx('ok');G.helpFrom='title';G.screen='help';}
     else if(hitK(KEY.V)){sfx('ok');G.replayCursor=Replay.has()?0:2;G.replayFrom='title';G.screen='replay';}
     else if(hitK(KEY.O)){sfx('ok');openOnline();}
     else if(hitK(KEY.TWO)){settings.coop=!settings.coop;saveSettings();sfx('ok');}
     break;
  case 'diff':
   G.diffCursor=menuNav(DIFFS.length,G.diffCursor);
   if(hitK(KEY.Z)||hitK(KEY.ENTER)){
    if(G.onlineSetup&&(G.diffCursor===4||G.diffCursor===5)){sfx('no');break;}
    sfx('ok');
    if(G.diffCursor===3){DIFF=1;syncHiFor(1);G.oneCC=true;G.story=false;enterChara(G.onlineSetup?'commit':'start',0);}
    else if(G.diffCursor===4){DIFF=1;syncHiFor(1);G.oneCC=false;G.story=true;enterChara('sel',0);}
    else if(G.diffCursor===5){DIFF=1;syncHiFor(1);G.oneCC=true;G.story=true;enterChara('start',0);}
    else{
     DIFF=G.diffCursor;syncHiFor(DIFF);G.oneCC=false;G.story=false;
     try{localStorage.setItem('lasr_diff',String(DIFF));}catch(e){}
     enterChara('sel',0);
    }
   }
   break;
  case 'sel':{
   const n=ROUTES.length+2;
   G.selCursor=menuNav(n,G.selCursor);
   if(hitK(KEY.Z)||hitK(KEY.ENTER)){
    if(G.selCursor<ROUTES.length){
     G.selFlags[G.selCursor]=!G.selFlags[G.selCursor];saveSelFlags();sfx('ok');
     }else if(G.selCursor===ROUTES.length){
     sfx('ok');G.selFlags.fill(true);saveSelFlags();
    }else if(G.selFlags.some(f=>f)){sfx('ok');if(G.onlineSetup)onlineCommitConfig(false);else startRun();}
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
     if(G.pauseCursor===1&&(G.replay||G.online)){sfx('no');break;}
     sfx('ok');
     if(G.pauseCursor===0){if(typeof Net!=='undefined'&&Net.active)Net.requestResume();else G.screen='play';}
     else if(G.pauseCursor===1){if(G.coins>0)G.pauseConfirm='restart';else sfx('no');}
     else if(G.pauseCursor===2){G.helpFrom='pause';G.screen='help';}
     else if(G.pauseCursor===3){G.settingsCursor=0;G.settingsFrom='pause';G.screen='settings';}
     else G.pauseConfirm='quit';
    }
   break;
  case 'gameover':
   G.resultT++;
   if(G.replay){
    if(hitK(KEY.Z)||hitK(KEY.ENTER)||hitK(KEY.X)||hitK(KEY.R)){sfx('cur');goTitle(false);}
    break;
   }
   if(hitK(KEY.C)&&G.coins>0){sfx('ok');continueFromBoss();}
   else if((hitK(KEY.Z)||hitK(KEY.R))&&G.coins>0){sfx('ok');spendCredit();restartRoute();}
   else if(hitK(KEY.X)){sfx('no');goTitle();}
   break;
  case 'result':
   G.resultT++;
   if(G.online&&(hitK(KEY.X)||hitK(KEY.ESC))){sfx('cur');goTitle();break;}
   if(G.resultT>90&&(hitK(KEY.Z)||hitK(KEY.ENTER))){
    sfx('ok');
    saveSelFlags();
    if(G.online)returnToOnlineLobby();else goTitle();
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
    if(it.k==='controller'){
     GamepadSupport.cancelCapture();G.gpadCursor=0;G.gpadMsg='';G.screen='controller';break;
    }
    if(it.k==='replay'){G.replayCursor=Replay.has()?0:2;G.replayFrom='settings';G.screen='replay';break;}
    if(it.k==='musicVol')settings.musicVol=(settings.musicVol+1)%VOL_STEPS.length;
    else if(it.k==='sfxVol')settings.sfxVol=(settings.sfxVol+1)%SFX_STEPS.length;
    else if(it.k==='mute')toggleMute();
    else settings[it.k]=!settings[it.k];
    applySettings();changed=true;
   }
   if(changed)saveSettings();
   break;}
  case 'replay':
   G.replayCursor=menuNav(5,G.replayCursor);
   if(hitK(KEY.Z)||hitK(KEY.ENTER)){
    if(G.replayCursor===0){
     G.replayMsg='';
     if(Replay.start()){sfx('ok');break;}
     sfx('no');
    }else if(G.replayCursor===1){
     if(Replay.has()&&Replay.download()){G.replayMsg='REPLAY EXPORTED';sfx('ok');}
     else sfx('no');
    }else if(G.replayCursor===2){
     if(Replay.requestImport()){G.replayMsg='SELECT A REPLAY FILE';sfx('ok');}
     else sfx('no');
    }else if(G.replayCursor===3){
     if(Replay.has()){Replay.delete();G.replayMsg='REPLAY DELETED';G.replayCursor=2;sfx('ok');}
     else sfx('no');
    }else{sfx('cur');G.replayMsg='';G.screen=G.replayFrom||'settings';}
   }
   break;
  case 'controller':{
   const ev=GamepadSupport.takeEvent();
   if(ev&&ev.type==='bound'){
    G.gpadMsg='BOUND TO '+GamepadSupport.buttonLabel(ev.index);
    sfx('ok');
   }
   if(GamepadSupport.listening)break;
   G.gpadCursor=menuNav(CONTROLLER_ROWS.length,G.gpadCursor);
   const row=CONTROLLER_ROWS[G.gpadCursor];
   if(hitK(KEY.Z)||hitK(KEY.ENTER)){
    if(row.k==='enabled'&&!GamepadSupport.supported){G.gpadMsg='GAMEPAD API UNAVAILABLE';sfx('no');break;}
    sfx('ok');
    if(row.k==='back'){G.screen='settings';G.gpadMsg='';break;}
    if(row.k==='enabled'){
     GamepadSupport.setEnabled(!GamepadSupport.enabled);
     G.gpadMsg=GamepadSupport.enabled?'INPUT ENABLED':'INPUT DISABLED';
    }else if(row.k==='reset'){
     GamepadSupport.resetBindings();G.gpadMsg='DEFAULT BINDINGS RESTORED';
    }else{
     GamepadSupport.beginCapture(row.k);G.gpadMsg='';
    }
   }
   break;}
  case 'online':
   updateOnline();
   break;
  case 'chara':
   updateChara();
   break;
  case 'help':
   if(hitK(KEY.Z)||hitK(KEY.ENTER)||hitK(KEY.X)){sfx('cur');G.screen=G.helpFrom;}
   break;
  }
}
function openOnline(){
 G.onlineFrom='title';G.onlineMsg='';
 if(typeof Net==='undefined')return;
 if(!G.onlineCode){try{const r=new URLSearchParams(location.search).get('room');if(r&&NET_CODE_RE.test(r.toUpperCase()))G.onlineCode=r.toUpperCase();}catch(e){}}
 if(Net.status==='error'){Net.error='';Net.status=Net.role?'lobby':'idle';}
 if(Net.role)G.onlineMode='lobby';
 else if(G.onlineCode&&NET_CODE_RE.test(G.onlineCode))G.onlineMode='join';
 else G.onlineMode='menu';
 G.onlineCursor=0;G.screen='online';
 if(G.onlineMode==='join'&&Net.codeEl)Net.codeEl.focus();
}
function onlineMenuRows(){
 if(G.onlineMode==='lobby'){
  const rows=[{k:'ready',label:(Net.localReady?'READY [YES]':'READY [NO]')}];
  rows.push({k:'chara',label:'CHARACTER'});
  if(Net.isHost)rows.push({k:'run',label:'CHANGE RUN'});
  if(Net.isHost)rows.push({k:'deploy',label:(Net.ready.guest&&Net.localReady&&Net.config)?'DEPLOY':'WAIT FOR P2'});
  rows.push({k:'leave',label:'LEAVE ROOM'});
  return rows;
 }
 if(G.onlineMode==='join')return [{k:'code',label:'ROOM CODE'},{k:'join',label:'JOIN'},{k:'back',label:'BACK'}];
 if(G.onlineMode==='error')return [{k:'back',label:'BACK'}];
 return [{k:'host',label:'HOST ROOM'},{k:'join',label:'JOIN ROOM'},{k:'back',label:'BACK'}];
}
function startHostConfig(){
 G.onlineSetup=true;G.onlineFrom='online';G.screen='diff';G.onlineMsg='CHOOSE RUN FOR THE ROOM';sfx('ok');
}
function updateOnline(){
 if(typeof Net==='undefined')return;
 if(Net.pendingStart){
  if(performance.now()>=Net.syncUntil){Net.completeStart();return;}
  G.onlineMode='lobby';G.onlineMsg='SYNCING...';return;
 }
 if(Net.status==='error'&&G.onlineMode!=='error')G.onlineMode='error';
 if(G.onlineMode!=='join'&&Net.codeEl&&document.activeElement===Net.codeEl)Net.codeEl.blur();
 const rows=onlineMenuRows();
 if(hitK(KEY.ESC)){if(G.onlineMode==='lobby'){sfx('cur');Net.leave();G.onlineMode='menu';G.screen='title';return;}onlineActivate('back');return;}
 G.onlineCursor=clamp(G.onlineCursor,0,rows.length-1);
 if(hitK(KEY.UP)){G.onlineCursor=(G.onlineCursor+rows.length-1)%rows.length;sfx('cur');}
 else if(hitK(KEY.DOWN)){G.onlineCursor=(G.onlineCursor+1)%rows.length;sfx('cur');}
 if(!(hitK(KEY.Z)||hitK(KEY.ENTER)))return;
 const row=rows[G.onlineCursor];
 if(row)onlineActivate(row.k);
}
function onlineActivate(k){
 if(typeof Net==='undefined')return;
 if(k==='back'){
  sfx('cur');
  if(G.onlineMode==='join'){G.onlineMode='menu';return;}
  if(Net.status==='error'){Net.error='';Net.status=Net.role?'lobby':'idle';}
  if(Net.role){G.onlineMode='lobby';return;}
  G.screen='title';return;
 }
 if(k==='host'){sfx('ok');G.onlineMsg='CONNECTING...';Net.createRoom();return;}
 if(k==='join'){
  if(G.onlineMode!=='join'){G.onlineMode='join';G.onlineCursor=0;sfx('ok');if(Net.codeEl)Net.codeEl.focus();return;}
  sfx('ok');G.onlineMsg='CONNECTING...';Net.joinRoom(G.onlineCode);return;
 }
 if(k==='code'){if(Net.codeEl)Net.codeEl.focus();return;}
 if(k==='ready'){Net.localReady=!Net.localReady;Net.sendJson({t:'ready',ready:Net.localReady});sfx('ok');return;}
 if(k==='chara'){enterChara('lobby',(typeof Net!=='undefined'&&Net.isGuest)?1:0);return;}
 if(k==='run'){startHostConfig();return;}
   if(k==='deploy'){
   if(!Net.config||!Net.ready.guest||!Net.localReady){sfx('no');return;}
   sfx('ok');Net.startHostRun(Object.assign({},Net.config,{chara:G.charaPicks[0]|0,p2chara:Net.peerChara|0}));return;
  }
 if(k==='leave'){sfx('cur');Net.leave();G.onlineMode='menu';return;}
}
function startOnlineRun(net){
 const c=net.config||{};
 DIFF=clamp(c.diff|0,0,DIFFS.length-1);
 const flags=c.flags||[];
 G.selFlags=new Array(ROUTES.length).fill(false);
 for(let i=0;i<ROUTES.length;i++)G.selFlags[i]=!!flags[i];
 G.story=false;G.oneCC=!!c.oneCC;
 if(G.oneCC)G.selFlags.fill(true);
 if(!G.selFlags.some(f=>f))G.selFlags.fill(true);
 autoFire=false;
 G.charaPicks[0]=clamp((c.chara!==undefined?c.chara:0)|0,0,CHARA_COUNT-1);
 G.charaPicks[1]=clamp((c.p2chara!==undefined?c.p2chara:0)|0,0,CHARA_COUNT-1);
 G.online=true;G.aiDialogue=false;G.idleT=0;
 if(typeof DMath!=='undefined')DMath.enable();
 SimRng.beginSeed(c.seed);
 startRun();
 if(G.screen!=='play'){G.onlineMsg='START FAILED // HOST RETRY';net.abortRun('START FAILED');return;}
 G.coins=1;
 G.screen='play';
}
function onlineCommitConfig(oneCC){
 G.onlineSetup=false;
 const flags=oneCC?new Array(ROUTES.length).fill(true):G.selFlags.slice();
 if(oneCC)G.oneCC=true;else G.oneCC=false;
 let seed;
 try{const a=new Uint32Array(1);crypto.getRandomValues(a);seed=(a[0]&0x7fffffff)||1;}catch(e){seed=(Math.random()*0x7fffffff)|0||1;}
 let D=6;
 const _rtt=(typeof Net!=='undefined')?(Net.rttP95>0?Net.rttP95:Net.rtt):0;
 if(_rtt>0)D=clamp(Math.ceil((_rtt*0.5)/16.667)+4,4,48);
 const cfg={diff:DIFF,oneCC:!!G.oneCC,story:false,flags:flags,seed:seed,D:D,autoFire:!!autoFire,
  chara:G.charaPicks[0]|0,p2chara:(typeof Net!=='undefined'?(Net.peerChara|0):G.charaPicks[1]|0)};
 if(typeof Net!=='undefined'){Net.config=cfg;Net.sendJson({t:'config',config:cfg});}
 G.onlineMode='lobby';G.onlineCursor=0;G.onlineMsg='RUN SET';G.screen='online';sfx('ok');
}
function enterChara(after,slot){
 G.charaFrom=G.screen;
 G.charaAfter=after;
 G.charaSlot=clamp(slot|0,0,1);
 G.charaCursor=clamp(G.charaPicks[G.charaSlot]|0,0,CHARA_COUNT-1);
 G.screen='chara';
}
function updateChara(){
 const needSecond=!G.onlineSetup&&!G.online&&settings.coop;
 const cols=3;
 if(hitK(KEY.LEFT)){G.charaCursor=(G.charaCursor+CHARA_COUNT-1)%CHARA_COUNT;sfx('cur');}
 else if(hitK(KEY.RIGHT)){G.charaCursor=(G.charaCursor+1)%CHARA_COUNT;sfx('cur');}
 else if(hitK(KEY.UP)){G.charaCursor=(G.charaCursor+CHARA_COUNT-cols)%CHARA_COUNT;sfx('cur');}
 else if(hitK(KEY.DOWN)){G.charaCursor=(G.charaCursor+cols)%CHARA_COUNT;sfx('cur');}
 if(hitK(KEY.ESC)){sfx('cur');G.screen=G.charaFrom;return;}
 if(!(hitK(KEY.Z)||hitK(KEY.ENTER)))return;
 G.charaPicks[G.charaSlot]=G.charaCursor;
 saveChara(G.charaSlot,G.charaCursor);
 sfx('ok');
 if(G.charaSlot===0&&needSecond){G.charaSlot=1;G.charaCursor=clamp(G.charaPicks[1]|0,0,CHARA_COUNT-1);return;}
 confirmChara();
}
function confirmChara(){
 if(G.charaAfter==='lobby'){
  if(typeof Net!=='undefined'&&Net.isGuest)Net.sendJson({t:'pick',chara:G.charaPicks[1]|0});
  else if(typeof Net!=='undefined'&&Net.config)Net.config.chara=G.charaPicks[0]|0;
  G.screen='online';G.onlineMode='lobby';return;
 }
 if(G.charaAfter==='commit'){onlineCommitConfig(!!G.oneCC);return;}
 if(G.charaAfter==='sel'){G.screen='sel';return;}
 startRun();
}
function returnToOnlineLobby(){
 if(typeof Net==='undefined'){goTitle();return;}
 Net.active=false;Net.capturing=false;Net.paused=false;Net.pauseAt=-1;
 Net.localReady=false;Net.ready={host:false,guest:false};
 Net.localBuf={};Net.remoteBuf={};
 if(typeof DMath!=='undefined')DMath.disable();
 G.online=false;G.aiDialogue=settings.aiDialogue!==false;
 if(typeof deactivatePlayer2==='function')deactivatePlayer2();
 if(typeof clearP2Input==='function')clearP2Input();
 if(Net.wsOpen()){Net.status='lobby';G.screen='online';G.onlineMode='lobby';G.onlineMsg='RUN COMPLETE';Net.sendJson({t:'ready',ready:false});}
 else{Net.status='error';G.screen='online';G.onlineMode='error';Net.error='CONNECTION LOST';}
}
function restartRoute(){
 if(Replay.rec)Replay.abort();
 G.replaySaved=false;G.replayEnded=false;
 resetBanterRun();
 beginRunRecording();
 BOSS=null;eshots.length=0;pshots.length=0;items.length=0;fx.length=0;ftext.length=0;elasers.length=0;
 mobs.length=0;G.wave=null;G.needWave=!!G.story;G.pauseConfirm=null;G.freeze=0;flashA=0;
 G.monoRay=null;
 if(((typeof Net!=='undefined'&&Net.active)||settings.coop||(typeof Replay!=='undefined'&&Replay.wantP2))&&!G.story&&!Gdemo)activatePlayer2();
  for(const p of players)resetPlayer(true,p);
 G.bossIdx=0;
 const R=ROUTES[G.routeQueue[G.routeIdx]];
 G.bannerText=R.title.toUpperCase();G.bannerT=110;
 G.screen='play';
 startStageBgm(R);
 if(R.bosses.length)prefetchBossBanter(BOSS_DEFS[R.bosses[0]]);
}
function autoPause(){
 for(const k in keys)keys[k]=false;
 for(const k in edge)edge[k]=false;
 clearP2Input();
 if(typeof GamepadSupport!=='undefined'&&GamepadSupport.releaseAll)GamepadSupport.releaseAll();
 if(typeof GamepadSupport!=='undefined'&&GamepadSupport.releaseAll2)GamepadSupport.releaseAll2();
 if(typeof TouchPad!=='undefined'&&TouchPad.release)TouchPad.release();
 else TouchUI.release();
 if(G.screen==='play'&&!Gdemo){
  if(typeof Net!=='undefined'&&Net.active)Net.requestPause();
  else{G.screen='pause';G.pauseCursor=0;G.pauseConfirm=null;}
 }
}
addEventListener('blur',autoPause);
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){
  autoPause();
  try{if(AudioSys.ctx&&AudioSys.ctx.state==='running'&&typeof AudioSys.ctx.suspend==='function'){const p=AudioSys.ctx.suspend();if(p&&p.catch)p.catch(()=>{});}}catch(e){}
 }else{
  try{if(AudioSys.ctx&&AudioSys.ctx.state==='suspended'&&typeof AudioSys.ctx.resume==='function'){const p=AudioSys.ctx.resume();if(p&&p.catch)p.catch(()=>{});}}catch(e){}
 }
});

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
 deactivatePlayer2();clearP2Input();
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
  mode:G.story&&G.oneCC?'story1cc':G.story?'story':G.oneCC?'1cc':'route',
  playerName:clipBanter((typeof charaDef==='function'?charaDef(PL.chara).name:(typeof PLAYER_NAME!=='undefined'?PLAYER_NAME:'Suzuran')),24),
  deaths:clamp(G.deaths|0,0,999),
  grazes:clamp(PL.graze|0,0,99999),
  captures:clamp(G.spellsCaptured|0,0,999),
  misses:clamp((G.spellsPlayed-G.spellsCaptured)|0,0,999),
  streak:clamp(G.streak|0,0,99)
 };
}
function prefetchBossBanter(def){
 if(!def||Gdemo||G.replay||!G.aiDialogue||_banterNoKey||typeof fetch!=='function')return;
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
 const bs=(G.frame>>2)%4;G.beat=bs===0?1:.7*(1-bs/4);
 const rk=(G.screen==='play'&&G.routeQueue.length)?routeBgKey():null;
 if(rk&&ASSETS[rk]&&perfLevel>0){
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
 for(let i=0;i<(perfLevel>0?3:1);i++){
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
  cx.fillStyle=s.col;
  cx.fillRect(s.x,s.y,s.s,s.s*2);
 }
 cx.globalAlpha=1;
 cx.globalCompositeOperation='lighter';
 if(perfLevel>0){
  cx.globalAlpha=.45+.35*G.beat;
  const nx=(t/90)%640,ny=(t/140)%480;
  cx.drawImage(nebula,-nx,-ny);cx.drawImage(nebula,640-nx,-ny);
  cx.drawImage(nebula,-nx-320,-160);cx.drawImage(nebula,-nx+200,300);
 }
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
  cx.fillText(who==='b'?BOSS.name.toUpperCase():(typeof charaDef==='function'?charaDef(PL.chara).name:PLAYER_NAME).toUpperCase(),bx+20,by+8);
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
function cabinetActive(){
 return typeof document!=='undefined'&&document.body&&document.body.classList&&
  document.body.classList.contains('cab-live');
}
function drawBossCabHud(){
 const tm=Math.ceil(BOSS.timer/60);
 const ratio=clamp(BOSS.hp/BOSS.maxHp,0,1);
 const disp=BOSS.hpDisp===undefined?ratio:clamp(BOSS.hpDisp,0,1);
 const top=cx.createLinearGradient(0,0,0,66);
 top.addColorStop(0,'rgba(2,8,16,.74)');top.addColorStop(.72,'rgba(2,8,16,.34)');
 top.addColorStop(1,'rgba(2,8,16,0)');
 cx.fillStyle=top;cx.fillRect(0,0,W,66);
 cx.textAlign='left';cx.textBaseline='top';
 cx.font='7px "Pixel8",monospace';cx.fillStyle=UI.dim;cx.fillText('ENEMY',18,8);
 cx.font='10px "Pixel8",monospace';cx.fillStyle='rgba(0,0,0,.7)';cx.fillText(BOSS.name,64,6);
 cx.fillStyle=BOSS.col[1];cx.fillText(BOSS.name,63,5);
 if(BOSS.leftInRoute>1){
  cx.textAlign='right';cx.font='7px "Pixel8",monospace';cx.fillStyle=UI.dim;
  cx.fillText(BOSS.leftInRoute+' LEFT',318,8);cx.textAlign='left';
 }
 const bw=300;
 const low=ratio<.25&&Math.floor(G.frame/8)%2===0;
 uiSegBar(18,23,bw,9,disp,'rgba(240,255,255,.5)',{segs:32,frame:false});
 uiSegBar(18,23,bw,9,ratio,low?'#ffe0e0':BOSS.col[0],{segs:32,frame:false});
 cx.strokeStyle='rgba(160,240,255,.42)';cx.lineWidth=1;cx.strokeRect(17.5,22.5,bw+1,10);
 cx.textAlign='right';cx.font='7px "Pixel8",monospace';cx.fillStyle=UI.dim;
 cx.fillText('TIME',W-20,8);
 cx.font='18px "Pixel8",monospace';
 if(tm<=10){cx.globalAlpha=.55+.45*Math.abs(Math.sin(G.frame/5));cx.fillStyle=UI.red;}
 else cx.fillStyle='#f2ffff';
 cx.fillText(String(tm).padStart(2,'0'),W-20,15);
 cx.globalAlpha=1;
 if(BOSS.atk&&BOSS.atk.n){
  cx.font='9px "Pixel8",monospace';cx.textAlign='center';
  const nm=BOSS.cutinName||'';
  if(!nameWCache.has(nm))nameWCache.set(nm,cx.measureText(nm).width);
  const tw=nameWCache.get(nm);
  const ncol=typeof BOSS.cutinCol==='string'?BOSS.cutinCol:UI.magenta;
  const pw=Math.min(W-180,tw+28);
  uiPanel(W/2-pw/2,38,pw,20,{cut:4,ticks:false,col:ncol,fill:'rgba(3,6,16,.82)'});
  cx.fillStyle=ncol;cx.textBaseline='middle';cx.fillText(nm,W/2,48);cx.textBaseline='top';
 }
}
function drawHUD(){
 const cab=cabinetActive();
 if(!cab){
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
    if(G.online)flags.push('ONLINE');
    if(players.length>1&&!Gdemo)flags.push('2P');
    if(!Gdemo)flags.push(charaDef(PL.chara).name.toUpperCase());
   if(G.replay){
    const rp=Replay.play;
    const cur=rp?Math.min(Math.floor(rp.idx/3),rp.data.frames|0):0;
    cx.fillStyle=UI.amber;cx.font='7px "Pixel8",monospace';
    cx.fillText(rp?'REPLAY '+cur+'/'+(rp.data.frames|0):'REPLAY',W-20,45);
   }
   else if(flags.length){cx.fillStyle=AudioSys.muted?UI.amber:UI.green;cx.font='7px "Pixel8",monospace';cx.fillText(flags.join(' · '),W-20,45);}
  if(showFps&&fpsVal>0){cx.fillStyle='#89f';cx.font='8px "Pixel8",monospace';cx.fillText(fpsVal+' FPS',W-20,64);}
 }
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
  if(cab)drawBossCabHud();
  else{
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
 }
 if(!cab){
  const coop=players.length>1&&!Gdemo;
  const stW=306,stH=coop?58:38,stX=8,stY=64;
  const nearHUD=players.some(p=>!p.dead&&p.x<stX+stW+10&&p.y>stY-12&&p.y<stY+stH+18);
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
   cx.fillText('CR x'+G.coins,196,rowLife+1);
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
  if(coop){
   const r2=stY+40,bar2=stY+50;
   cx.textAlign='left';cx.fillStyle=UI.magenta;cx.font='8px "Pixel8",monospace';
   cx.fillText('P2',14,r2);
   if(P2.dead===2){cx.fillStyle=UI.red;cx.fillText('DOWN',40,r2);}
   else{
    for(let i=0;i<clamp(P2.lives,0,8);i++){
     cx.fillStyle=UI.amber;cx.beginPath();
     cx.moveTo(40+i*7,r2+1);cx.lineTo(45+i*7,r2+6);cx.lineTo(35+i*7,r2+6);
     cx.closePath();cx.fill();
    }
    for(let i=0;i<clamp(P2.spells,0,4);i++){
     cx.fillStyle=UI.cyan;cx.fillRect(98+i*7,r2+1,5,5);
    }
   }
   cx.fillStyle='#8fb3c6';cx.fillText('PWR',136,r2);
   cx.textAlign='right';cx.fillStyle='#dff';cx.fillText(String(Math.floor(P2.power/100)),208,r2);
   uiSegBar(136,bar2,72,4,P2.power/500,'#ff70c0',{segs:14,frame:false});
   cx.textAlign='left';cx.fillStyle='#8fb3c6';cx.fillText('FLASH',218,r2);
   cx.textAlign='right';cx.fillStyle=P2.flash>=P2.flashMax?UI.cyan:'#bcdff0';
   cx.fillText(P2.flash>=P2.flashMax?'READY':P2.flash+'/'+P2.flashMax,296,r2);
   uiSegBar(218,bar2,78,4,P2.flash/P2.flashMax,P2.flash>=P2.flashMax?'#ffd0ee':'#ff70c0',{segs:14,frame:false});
   cx.textAlign='left';
  }
  cx.restore();
 }
 if(!cab&&G.streak>1){
  const sy=(BOSS&&!BOSS.dying)?96:68;
  cx.textAlign='right';cx.fillStyle=UI.amber;cx.font='9px "Pixel8",monospace';
  cx.fillText('STREAK x'+G.streakMult.toFixed(2)+' ('+G.streak+')',W-20,sy);
 }
 if(!cab&&G.screen==='play'&&G.routeQueue.length&&G.routeQueue[G.routeIdx]!==undefined){
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
 if(!cab&&G.wave){
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
function updatePerformance(){
 if(G.screen!=='play'&&G.screen!=='pause'){perfLevel=2;perfHold=0;return;}
 if(!fpsVal)return;
 const load=eshots.length+pshots.length+fx.length;
 let target=2;
 if(fpsVal<42||load>1100)target=0;
 else if(fpsVal<53||load>800)target=1;
 if(target<perfLevel){perfLevel=target;perfHold=90;}
 else if(target>perfLevel){
  if(perfHold>0)perfHold--;
  else perfLevel=Math.min(2,perfLevel+1);
 }
}
function applyBloom(){
 if(perfLevel<1)return;
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
 if(typeof CabinetUI!=='undefined'&&CabinetUI.sync)CabinetUI.sync();
 cx.setTransform(1,0,0,1,0,0);
 if(IS_TOUCH)TouchUI.reset();
 if(G.screen==='play'||G.screen==='pause'){
  cx.save();
  if(shakeT>0)cx.translate(vrnd(-shakeM,shakeM),vrnd(-shakeM,shakeM));
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
  if(typeof Net!=='undefined'&&Net.active&&Net.stalling&&!Gdemo){
   const hi=Net.stallT>600;
   cx.save();cx.fillStyle='rgba(0,0,10,.42)';cx.fillRect(0,0,W,H);
   cx.textAlign='center';cx.textBaseline='middle';
   cx.fillStyle=hi?UI.red:UI.cyan;cx.font='14px "Pixel8",monospace';
   cx.fillText(hi?'HIGH LATENCY':'WAITING FOR PEER',W/2,H/2-10);
   cx.fillStyle=UI.dim;cx.font='9px "Pixel8",monospace';
   cx.fillText(Math.round(Net.rtt)+'MS // DELAY '+Net.D+'F',W/2,H/2+14);
   cx.restore();
  }
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
  else if(G.screen==='replay')drawReplay();
  else if(G.screen==='controller')drawController();
  else if(G.screen==='online')drawOnline();
  else if(G.screen==='chara')drawChara();
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
const uiBand=document.createElement('canvas');uiBand.width=W;uiBand.height=90;
{
 const bc=uiBand.getContext('2d');
 const g=bc.createLinearGradient(0,0,0,90);
 g.addColorStop(0,'rgba(100,225,255,0)');g.addColorStop(.5,'rgba(100,225,255,.045)');g.addColorStop(1,'rgba(100,225,255,0)');
 bc.fillStyle=g;bc.fillRect(0,0,W,90);
}
function drawCRT(){
 const sy=(G.frame*1.3)%(H+120)-120;
 cx.save();
 cx.drawImage(uiScan,0,0);
 cx.drawImage(uiBand,0,sy);
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
 const padReady=GamepadSupport.enabled&&GamepadSupport.connected;
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
  touchBtn(18,42,104,30,'2P '+(settings.coop?'ON':'OFF'),()=>{settings.coop=!settings.coop;saveSettings();sfx('ok');},
   {id:'title:coop',col:settings.coop?UI.magenta:UI.cyan,font:'bold 9px "Pixel8",monospace'});
  touchBtn(W-122,42,104,30,'ONLINE',()=>{sfx('ok');openOnline();},
   {id:'title:online',col:UI.green,font:'bold 10px "Pixel8",monospace'});
  touchBtn(W/2-118,286,236,50,padReady?'START / PAD A':'START',()=>{sfx('ok');G.screen='diff';G.idleT=0;},
   {id:'title:start',font:padReady?'bold 14px "Pixel8",monospace':'bold 18px "Pixel8",monospace',col:UI.magenta});
  touchBtn(W/2-190,352,116,40,'SETTINGS',()=>{sfx('ok');G.settingsCursor=0;G.settingsFrom='title';G.screen='settings';},
   {id:'title:settings',col:UI.cyan});
  touchBtn(W/2-58,352,116,40,'REPLAY',()=>{sfx('ok');G.replayCursor=Replay.has()?0:2;G.replayFrom='title';G.screen='replay';},
   {id:'title:replay',col:Replay.has()?UI.magenta:UI.cyan});
  touchBtn(W/2+74,352,116,40,'HELP',()=>{sfx('ok');G.helpFrom='title';G.screen='help';},
   {id:'title:help',col:UI.cyan});
 }else{
  uiPanel(130,308,380,46,{cut:8,col:'rgba(110,230,255,.42)',ticks:true,fill:'rgba(3,9,18,.52)'});
  if(padReady)blinkText('Z / PAD A  TO DEPLOY',H/2+92,16);
  else blinkText('PRESS  Z  TO  DEPLOY',H/2+92,18);
  cx.fillStyle=UI.dim;cx.font='9px "Pixel8",monospace';cx.textAlign='center';cx.textBaseline='top';
    cx.fillText(padReady?'S SETTINGS   H HELP   V REPLAY   O ONLINE   2 CO-OP '+(settings.coop?'ON':'OFF'):'S  SETTINGS   H  HELP   V  REPLAY   O  ONLINE   2  CO-OP '+(settings.coop?'ON':'OFF'),W/2,H/2+142);
 }
 uiPanel(120,H-82,400,56,{cut:6,col:'rgba(90,220,255,.32)',ticks:false,fill:'rgba(3,9,18,.72)'});
 cx.textAlign='center';cx.textBaseline='top';
 cx.fillStyle=UI.dim;cx.font='8px "Pixel8",monospace';
 cx.fillText('GROUND-UP TRIBUTE // PROCEDURAL AUDIO & FX',W/2,H-70);
 cx.fillStyle=UI.cyan;cx.font='9px "Pixel8",monospace';
 cx.fillText('HI-SCORE  '+fmtScore(G.hi),W/2,H-52);
}
function drawOnline(){
 menuFrame('ONLINE CO-OP');
 if(typeof Net==='undefined'){cx.textAlign='center';cx.fillStyle=UI.red;cx.font='10px "Pixel8",monospace';cx.fillText('NETWORK MODULE MISSING',W/2,H/2);return;}
 const rows=onlineMenuRows();
 cx.textAlign='center';cx.textBaseline='top';
 const st=Net.status==='connecting'?'CONNECTING...':Net.status==='lobby'?'CONNECTED':Net.status==='error'?'OFFLINE':'IDLE';
 let hdr=(Net.transport==='p2p'?'P2P':'RELAY')+' '+st;
 if(Net.rtt>0)hdr+='  //  '+Math.round(Net.rtt)+'MS';
 if(Net.D)hdr+='  //  DELAY '+Net.D+'F';
 if(Net.region&&Net.region.country)hdr+='  //  '+Net.region.country;
 cx.font='8px "Pixel8",monospace';cx.fillStyle=(Net.transport==='p2p'?UI.green:UI.dim);cx.fillText(hdr,W/2,122);
 if(Net.pendingStart){
  cx.save();cx.fillStyle='rgba(2,6,14,.74)';cx.fillRect(0,0,W,H);
  cx.textAlign='center';cx.textBaseline='middle';
  cx.fillStyle=UI.cyan;cx.font='22px "Pixel8",monospace';cx.fillText('SYNCING',W/2,H/2-12);
  cx.fillStyle=UI.dim;cx.font='9px "Pixel8",monospace';
  cx.fillText('ALIGNING BOTH CLIENTS // '+Math.round(Net.rtt)+'MS',W/2,H/2+18);
  cx.restore();return;
 }
 if(G.onlineMode==='join'){
  cx.fillStyle=UI.cyan;cx.font='10px "Pixel8",monospace';cx.fillText('ENTER ROOM CODE',W/2,146);
  const code=(G.onlineCode||'').padEnd(5,' ');
  for(let i=0;i<5;i++){
   const bx=W/2-60+i*24,by=164;
   uiPanel(bx,by,20,28,{cut:3,col:i<G.onlineCode.length?UI.magenta:UI.line,fill:'rgba(2,8,16,.6)'});
   cx.fillStyle='#eaffff';cx.font='14px "Pixel8",monospace';cx.textAlign='center';cx.textBaseline='middle';
   cx.fillText(code[i].trim(),bx+10,by+15);
  }
  cx.textBaseline='top';cx.font='8px "Pixel8",monospace';cx.fillStyle=UI.dim;
  cx.fillText(IS_TOUCH?'TAP HERE TO TYPE':'TYPE OR PASTE A CODE',W/2,200);
  TouchUI.add(W/2-70,150,140,60,()=>{if(Net.codeEl)Net.codeEl.focus();},'code');
 }else if(G.onlineMode==='lobby'){
  cx.fillStyle=UI.cyan;cx.font='8px "Pixel8",monospace';cx.fillText('ROOM CODE',W/2,136);
  cx.fillStyle='#eaffff';cx.font='26px "Pixel8",monospace';cx.textBaseline='middle';
  cx.fillText(Net.code||'-----',W/2,158);
  cx.textBaseline='top';
  const c=Net.config;
  const line=c?(DIFFS[clamp(c.diff|0,0,DIFFS.length-1)]+(c.oneCC?' // 1CC':' // STANDARD')):'NO RUN SET';
  cx.fillStyle=c?UI.green:UI.dim;cx.font='8px "Pixel8",monospace';cx.fillText('RUN  '+line,W/2,180);
  const peer=Net.isHost?(Net.ready.guest?'P2 READY':'WAITING FOR P2'):(Net.ready.host?'HOST READY':'WAITING FOR HOST');
  cx.fillStyle=UI.amber;cx.fillText(peer+'     '+(Net.localReady?'YOU READY':'YOU NOT READY'),W/2,194);
  const c1=((Net.isGuest?(Net.config&&Net.config.chara||0):G.charaPicks[0])|0);
  const c2=((Net.isGuest?G.charaPicks[1]:(Net.peerChara||0))|0);
  cx.fillStyle=UI.cyan;cx.font='8px "Pixel8",monospace';
  cx.fillText('1P '+charaDef(c1).name+'   2P '+charaDef(c2).name,W/2,208);
 }else{
  cx.fillStyle=UI.cyan;cx.font='9px "Pixel8",monospace';
  cx.fillText('ROOM-CODE CO-OP // HOST SELECTS THE RUN',W/2,150);
 }
 const startY=G.onlineMode==='lobby'?224:(G.onlineMode==='join'?216:190);
 rows.forEach((r,i)=>{
  const y=startY+i*34,sel=i===G.onlineCursor;
  const w=W-240,x=120;
  const dis=(r.k==='deploy'&&!(Net.ready.guest&&Net.localReady&&Net.config));
  const col=r.k==='deploy'?UI.magenta:r.k==='leave'?UI.red:UI.cyan;
  uiTile(x,y,w,28,{sel:sel,col:dis?UI.dim:col,on:false});
  cx.textAlign='left';cx.textBaseline='middle';cx.font='10px "Pixel8",monospace';
  cx.fillStyle=dis?'#546':(sel?'#f2ffff':'#bfe6f2');
  cx.fillText(r.label,x+16,y+15);
  TouchUI.add(x,y,w,28,()=>{G.onlineCursor=i;onlineActivate(r.k);},r.k);
 });
 if(G.onlineMsg){cx.textAlign='center';cx.textBaseline='top';cx.fillStyle=UI.amber;cx.font='8px "Pixel8",monospace';cx.fillText(G.onlineMsg,W/2,H-64);}
 if(G.onlineMode==='error'){cx.fillStyle=UI.red;cx.font='10px "Pixel8",monospace';cx.fillText(Net.error||'CONNECTION ERROR',W/2,H-84);}
 cx.textAlign='center';cx.fillStyle=UI.dim;cx.font='8px "Pixel8",monospace';
 const padOn=(typeof GamepadSupport!=='undefined'&&GamepadSupport.enabled&&GamepadSupport.connected);
 cx.fillText(IS_TOUCH?'TAP TO SELECT':(padOn?'Z / PAD A SELECT   X / PAD B BACK':'Z SELECT   X/ESC BACK'),W/2,H-44);
}
function blinkText(s,y,sz){
 const on=Math.floor(G.frame/26)%2===0;
 cx.save();cx.font=`${sz}px "Pixel8",monospace`;cx.textAlign='center';cx.textBaseline='middle';
 cx.globalAlpha=on?.55:.18;cx.fillStyle=UI.cyan;cx.fillText(s,W/2,y+1);
 cx.globalAlpha=on?1:.35;cx.fillStyle='#eaffff';cx.fillText(s,W/2,y);
 cx.restore();
}
function menuFrame(title){
 const code={diff:'SYS/DIFF',sel:'SYS/ROUTE',chara:'SYS/CHARA',settings:'SYS/CFG',replay:'SYS/REPLAY',controller:'SYS/PAD',online:'SYS/NET',help:'SYS/HELP'}[G.screen]||'SYS/UI';
 uiPanel(48,104,W-96,312,{title:title,code:code,col:UI.cyan});
}
function drawDiff(){
 menuFrame('SELECT DIFFICULTY');
 if(IS_TOUCH)touchBtn(16,14,104,40,'BACK',()=>{sfx('cur');if(G.onlineSetup){G.onlineSetup=false;G.screen='online';G.onlineMode='lobby';}else{G.screen='title';G.idleT=0;}},{id:'diff:back',col:'#9ab'});
 DIFFS.forEach((d,i)=>{
  const sel=i===G.diffCursor,y=134+i*41;
  const col=i===3?UI.amber:i===4?UI.green:i===5?UI.magenta:UI.cyan;
  uiTile(86,y,W-172,35,{sel:sel,col:col,on:i>=3});
  uiTag('0'+(i+1),100,y+7,sel?col:UI.dim);
  cx.font='20px "VT323R",monospace';cx.textAlign='left';cx.textBaseline='middle';
  cx.fillStyle=sel?'#f2ffff':(i===3?'#d8b85a':i===4?'#7ccf9d':i===5?'#f0a8dc':'#9fb8c8');
  cx.fillText(d,132,y+18);
  if(i===3)uiTag('1CC',546,y+7,sel?UI.amber:UI.dim,'right');
  else if(i===4)uiTag('STORY',546,y+7,sel?UI.green:UI.dim,'right');
  else if(i===5)uiTag('STORY 1CC',546,y+7,sel?UI.magenta:UI.dim,'right');
  else uiTag('MODE 0'+i,546,y+7,sel?UI.dim:'rgba(110,140,160,.55)','right');
  if(IS_TOUCH)TouchUI.add(90,y,W-180,35,()=>{
   G.diffCursor=i;sfx('cur');edge[KEY.Z]=true;
  },'diff:'+i);
 });
 const desc=[
  'Relaxed patterns, weaker bosses. A gentle tour.',
  'The intended experience. Balanced and brisk.',
  'Dense, fast, merciless. For veterans.',
  'Full route · 1 credit · no continues. One clean run.',
  'Mob waves before every boss. Select stages and continue.',
  'Full-route Story · mob waves · 1 credit · no continues.'
 ][G.diffCursor];
 const dc=G.diffCursor===3?UI.amber:G.diffCursor===4?UI.green:G.diffCursor===5?UI.magenta:UI.cyan;
 uiPanel(86,378,W-172,26,{cut:4,ticks:false,col:dc,fill:'rgba(4,12,22,.82)'});
 cx.fillStyle=dc;cx.font='13px "VT323R",monospace';cx.textAlign='center';cx.textBaseline='middle';
 cx.fillText(desc,W/2,391);
 cx.fillStyle=UI.dim;cx.font='8px "Pixel8",monospace';cx.textBaseline='top';
 cx.fillText(IS_TOUCH?'TAP A MODE TO CHOOSE':'Z CONFIRM // ESC BACK',W/2,H-30);
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
   TouchUI.add(x,y,cw,ch,()=>{G.selFlags[i]=!G.selFlags[i];saveSelFlags();sfx('ok');},'sel:stage:'+i);
  });
  touchBtn(x0,346,cw,40,'SELECT ALL',()=>{G.selFlags.fill(true);saveSelFlags();sfx('ok');},{id:'sel:all',col:UI.cyan});
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
function charaBar(x,y,label,v,col){
 cx.textAlign='left';cx.textBaseline='top';cx.font='7px "Pixel8",monospace';cx.fillStyle=UI.dim;cx.fillText(label,x,y);
 cx.fillStyle='rgba(110,230,255,.18)';cx.fillRect(x+36,y+1,70,3);
 cx.fillStyle=col;cx.fillRect(x+36,y+1,70*clamp(v,0,1),3);
}
function charaWrap(text,x,y,maxw,lh){
 const words=String(text).split(' ');let line='',yy=y;
 for(const w of words){const t=line?line+' '+w:w;if(line&&cx.measureText(t).width>maxw){cx.fillText(line,x,yy);line=w;yy+=lh;}else line=t;}
 if(line)cx.fillText(line,x,yy);
}
function drawCharaPreview(idx,x,y,w,h){
 const c=charaDef(idx),vis=CHARA_VIS[clamp(idx,0,CHARA_VIS.length-1)];
 cx.save();
 cx.strokeStyle='rgba(110,230,255,.22)';cx.lineWidth=1;cx.strokeRect(x+.5,y+.5,w-1,h-1);
 cx.beginPath();cx.rect(x,y,w,h);cx.clip();
 const px=x+w/2,py=y+h-14;
 for(let i=0;i<3;i++){
  const ox=px+(i-1)*(c.optStyle==='wide'?16:c.optStyle==='forward'?8:11);
  cx.globalAlpha=.75;cx.fillStyle=c.accent;cx.beginPath();cx.arc(ox,py-5,2.4,0,TAU);cx.fill();
 }
 cx.globalAlpha=1;cx.fillStyle='#eef4ff';
 cx.beginPath();cx.moveTo(px,py-9);cx.lineTo(px+6,py+7);cx.lineTo(px,py+3);cx.lineTo(px-6,py+7);cx.closePath();cx.fill();
 cx.fillStyle=c.accent;cx.fillRect(px-1.2,py-6,2.4,8);
 const t=G.frame;
 for(let i=0;i<7;i++){
  const yy=y+h-22-((t*1.7+i*24)%(h-10));
  const xx=px+Math.sin(t/26+i)*6+(vis==='scatter'?(i-3)*7:0);
  cx.globalAlpha=.92;cx.fillStyle=c.accent;
  if(vis==='scatter'){cx.beginPath();cx.arc(xx,yy,3,0,TAU);cx.fill();}
  else if(vis==='needle'){cx.fillRect(xx-1,yy-6,2,12);}
  else if(vis==='lance'){cx.fillRect(xx-1.5,yy-9,3,18);}
  else if(vis==='knife'){cx.beginPath();cx.moveTo(xx,yy-6);cx.lineTo(xx+3,yy+5);cx.lineTo(xx-3,yy+5);cx.closePath();cx.fill();}
  else if(vis==='missile'){cx.beginPath();cx.moveTo(xx,yy-7);cx.lineTo(xx+3.5,yy+5);cx.lineTo(xx-3.5,yy+5);cx.closePath();cx.fill();}
  else{cx.beginPath();cx.moveTo(xx,yy-6);cx.lineTo(xx+3,yy);cx.lineTo(xx,yy+6);cx.lineTo(xx-3,yy);cx.closePath();cx.fill();}
  cx.globalAlpha=1;
 }
 cx.restore();
}
function drawChara(){
 menuFrame('SELECT CHARACTER');
 if(IS_TOUCH)touchBtn(16,14,104,40,'BACK',()=>{sfx('cur');G.screen=G.charaFrom;},{id:'chara:back',col:'#9ab'});
 const needSecond=!G.onlineSetup&&!G.online&&settings.coop;
 cx.textAlign='center';cx.textBaseline='top';
 cx.fillStyle=UI.cyan;cx.font='10px "Pixel8",monospace';
 cx.fillText((G.charaSlot===1?'2P':'1P')+' PICK'+(needSecond&&G.charaSlot===0?'   //   THEN 2P':''),W/2,120);
 cx.fillStyle=UI.dim;cx.font='8px "Pixel8",monospace';
 cx.fillText('1P '+charaDef(G.charaPicks[0]).name+(needSecond||G.online?'    2P '+charaDef(G.charaPicks[1]).name:''),W/2,136);
 const cols=3,tw=156,th=62,gx=10,gy=8,x0=76,y0=154;
 CHARAS.forEach((c,i)=>{
  const col=i%cols,row=(i/cols)|0,x=x0+col*(tw+gx),y=y0+row*(th+gy),sel=i===G.charaCursor;
  uiTile(x,y,tw,th,{sel:sel,col:c.accent,fill:sel?'rgba(8,24,38,.85)':'rgba(5,13,25,.7)'});
  cx.save();cx.translate(x+22,y+30);cx.fillStyle='#eef4ff';
  cx.beginPath();cx.moveTo(0,-11);cx.lineTo(7,9);cx.lineTo(0,4);cx.lineTo(-7,9);cx.closePath();cx.fill();
  cx.fillStyle=c.accent;cx.fillRect(-1.4,-8,2.8,9);cx.restore();
  cx.textAlign='left';cx.textBaseline='middle';
  cx.fillStyle=sel?'#f2ffff':'#bfe6f2';cx.font='17px "VT323R",monospace';cx.fillText(c.name,x+42,y+20);
  cx.fillStyle=UI.dim;cx.font='7px "Pixel8",monospace';cx.fillText(c.arch,x+42,y+38);
  cx.fillStyle='rgba(110,230,255,.5)';cx.fillRect(x+42,y+48,64,2);
  cx.fillStyle=c.accent;cx.fillRect(x+42,y+48,64*CHARA_STATS[i][0],2);
  TouchUI.add(x,y,tw,th,()=>{G.charaCursor=i;sfx('cur');},'chara:'+i);
 });
 const c=charaDef(G.charaCursor),st=CHARA_STATS[G.charaCursor];
 const dx=76,dy=292,dw=488,dh=138;
 uiPanel(dx,dy,dw,dh,{cut:6,col:c.accent,fill:'rgba(3,9,18,.72)'});
 cx.textAlign='left';cx.textBaseline='top';
 cx.fillStyle='#f2ffff';cx.font='20px "VT323R",monospace';cx.fillText(c.name,dx+14,dy+8);
 cx.fillStyle=c.accent;cx.font='8px "Pixel8",monospace';cx.fillText(String(c.title).toUpperCase(),dx+14,dy+32);
 cx.fillStyle=UI.dim;cx.fillText(c.arch,dx+14,dy+44);
 cx.fillStyle='#cfe6f2';cx.font='15px "VT323R",monospace';
 charaWrap(c.blurb,dx+14,dy+60,dw-160,15);
 charaBar(dx+14,dy+dh-24,'PWR',st[0],c.accent);
 charaBar(dx+118,dy+dh-24,'SPD',st[1],UI.cyan);
 charaBar(dx+222,dy+dh-24,'SPRD',st[2],UI.green);
 drawCharaPreview(G.charaCursor,dx+dw-132,dy+14,116,dh-28);
 cx.textAlign='center';cx.fillStyle=UI.dim;cx.font='8px "Pixel8",monospace';cx.textBaseline='top';
 cx.fillText(IS_TOUCH?'TAP TO PICK':(needSecond&&G.charaSlot===0?'Z PICK 1P':'Z CONFIRM   ESC BACK'),W/2,H-22);
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
   cx.textAlign='right';cx.fillStyle=G.replay?UI.dim:(sel?(G.coins>0?UI.amber:'#865c36'):'#5e7180');
   cx.font='8px "Pixel8",monospace';cx.fillText(G.replay?'REPLAY LOCK':'1 CREDIT',340,180+i*40);
  }
  if(IS_TOUCH&&!G.pauseConfirm&&!(i===1&&G.replay))TouchUI.add(80,180+i*40-26,280,38,()=>{
   G.pauseCursor=i;edge[KEY.Z]=true;
  },'pause:'+i);
 });
 uiPanel(368,132,210,232,{title:'TELEMETRY',code:'LIVE',col:UI.blue});
 cx.textAlign='left';cx.textBaseline='top';cx.font='16px "VT323R",monospace';
 const st=[['Score',fmtScore(G.score)],['Graze',PL.graze],['Deaths',G.deaths],
  ['Spells',G.spellsCaptured+' / '+G.spellsPlayed],['Credits',G.coins],
  ['Mode',runModeName()]];
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
   cx.fillStyle=UI.red;cx.fillText('CREDITS LEFT '+G.coins,W/2,252);
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
 const bd=R?BOSS_DEFS[R.bosses[clamp(G.contBoss,0,R.bosses.length-1)]]:null;
 cx.fillStyle='#8fa4b4';cx.font='15px "VT323R",monospace';cx.textAlign='center';cx.textBaseline='top';
 cx.fillText((R?R.title:'')+(bd?' · '+bd.name:''),W/2,174);
 cx.fillStyle='#8fa4b4';cx.font='10px "Pixel8",monospace';
 cx.fillText('SCORE',W/2,204);
 cx.fillStyle='#f2ffff';cx.font='16px "Pixel8",monospace';
 cx.fillText(fmtScore(G.score),W/2,220);
 cx.fillStyle=UI.amber;cx.font='10px "Pixel8",monospace';
 cx.fillText('CREDITS ×'+G.coins,W/2,250);
 if(IS_TOUCH){
  touchBtn(W/2-190,274,380,44,'CONTINUE AT BOSS',()=>{
   if(G.coins>0)edge[KEY.C]=true;else sfx('no');
  },{id:'gameover:continue',on:G.coins>0,sub:'1 CREDIT',col:UI.green});
  touchBtn(W/2-190,330,380,44,'RETRY STAGE',()=>{
   if(G.coins>0)edge[KEY.Z]=true;else sfx('no');
  },{id:'gameover:retry',on:G.coins>0,sub:'1 CREDIT',col:UI.amber});
  touchBtn(W/2-190,386,380,40,'RETURN TO TITLE',()=>{edge[KEY.X]=true;},{id:'gameover:title',col:UI.red});
  return;
 }
 let y=288;
 if(G.coins>0){
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
 if(G.replaySaved){cx.fillStyle=UI.green;cx.fillText('REPLAY SAVED // SETTINGS > REPLAY',66,78);}
 else if(G.replayEnded){cx.fillStyle=UI.amber;cx.fillText('REPLAY ENDED // NO SCORE SAVED',66,78);}
 const runTag=G.replay?(G.replayResult==='FAILED'?'REPLAY // FAILED':'REPLAY // COMPLETE'):(runModeName()+' '+(G.oneCC&&G.oneCCFailed?'FAILED':'RUN'));
 cx.textAlign='right';cx.fillStyle=G.replay?(G.replayResult==='FAILED'?UI.red:UI.amber):(G.oneCC?(G.oneCCFailed?UI.red:UI.amber):G.story?UI.green:UI.dim);
 cx.fillText(runTag,574,62);
 cx.restore();
 const rows=[
  ['Spell Cards Played',G.spellsPlayed],
  ['Spell Cards Captured',G.spellsCaptured],
  ['Best Capture Streak','×'+(1+Math.max(0,G.bestStreak-1)*.25).toFixed(2)+' ('+G.bestStreak+')'],
  ['Sparks Collected',G.sparksGot],
  ['Deaths',G.deaths],
  ['Credits Used',G.creditsUsed||0],
   ['Final Score',fmtScore(G.score)],
   ['Pilot',(function(){
     if(G.replay&&Replay.play&&Replay.play.data){const d=Replay.play.data;const a=charaDef(d.chara||0).name;const b=charaDef(d.p2chara||0).name;return (d.p2inputs&&d.p2inputs.length)?(a+' / '+b):a;}
     return players.length>1?(charaDef(PL.chara).name+' / '+charaDef(P2.chara).name):charaDef(PL.chara).name;
   })()]
  ];
 rows.forEach(([k,v],i)=>{
  if(G.resultT<i*20+10)return;
  const y=104+i*30;
  cx.fillStyle=i%2===0?'rgba(80,160,190,.055)':'rgba(0,0,0,0)';
  cx.fillRect(66,y-19,382,25);
  cx.textAlign='left';cx.textBaseline='middle';cx.fillStyle='#7d9aad';cx.font='17px "VT323R",monospace';
  cx.fillText(k,76,y-5);
   cx.textAlign='right';cx.fillStyle=i===6?UI.amber:(i===7?UI.cyan:'#dff4ff');cx.font=(i===7?'9px':i===6?'12px':'18px')+' "Pixel8",monospace';
  cx.fillText(String(v),436,y-4);
 });
 if(G.resultT>100){
  const ri=rankInfo();
  cx.textAlign='left';cx.textBaseline='middle';cx.fillStyle='#7d9aad';cx.font='17px "VT323R",monospace';
  cx.fillText('Spell Clear Rate',76,332);
  cx.textAlign='right';
  if(G.resultT<140){
   cx.fillStyle='#dff4ff';cx.font='18px "Pixel8",monospace';
   cx.fillText(virnd(0,99)+'%',436,332);
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
  const mode=G.story?'STORY 1CC':'1CC';
  cx.fillText(cleared?'★ '+mode+' CLEAR ★':mode+' FAILED'+(G.creditsUsed?' · '+G.creditsUsed+' CREDIT(S) USED':''),266,367);
 }
 if(IS_TOUCH){
  if(G.resultT>90)touchBtn(W/2-110,H-74,220,42,'CONTINUE',()=>{edge[KEY.Z]=true;},
   {id:'result:continue',col:UI.cyan,font:'bold 12px "Pixel8",monospace'});
 }else if(G.resultT>170)blinkText('Z  BACK TO TITLE',H-38,15);
}
function settingsValue(it,compact){
 const k=it.k;
 if(k==='musicVol')return Math.round(VOL_STEPS[settings.musicVol]*100)+'%';
 if(k==='sfxVol')return Math.round(SFX_STEPS[settings.sfxVol]*100)+'%';
 if(k==='mute')return AudioSys.muted?'ON':'OFF';
 if(k==='controller')return !GamepadSupport.supported?'N/A':GamepadSupport.enabled?(GamepadSupport.connected?(compact?'PAD':'ON · PAD'):'ON'):'OFF';
 if(k==='replay')return compact?(Replay.has()?'READY':'EMPTY'):Replay.label();
 return settings[k]?'ON':'OFF';
}
function settingsActive(it){
 const k=it.k;
 if(k==='mute')return AudioSys.muted;
 if(k==='controller')return GamepadSupport.supported&&GamepadSupport.enabled;
 if(k==='replay')return Replay.has();
 if(k==='musicVol'||k==='sfxVol')return true;
 return !!settings[k];
}
function drawTouchSettings(){
 menuFrame('SETTINGS');
 const x0=78,x1=324,cw=234,ch=39,y0=132,rh=47;
 SETTINGS_ITEMS.forEach((it,i)=>{
  const col=i%2,row=(i/2)|0;
  const x=x0+col*(x1-x0),y=y0+row*rh;
  const vol=it.k==='musicVol'||it.k==='sfxVol';
  const val=settingsValue(it,true);
  const active=settingsActive(it);
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
  const sel=i===G.settingsCursor,y=146+i*22,rowY=y-16;
  const vol=it.k==='musicVol'||it.k==='sfxVol',back=it.k==='back';
  const cc=back?UI.red:(sel?UI.cyan:UI.blue);
  uiTile(98,rowY,444,21,{sel:sel,col:cc,fill:back?'rgba(24,8,18,.5)':'rgba(5,13,25,.55)'});
  if(sel)uiCursor(106,y-5,cc);
  cx.textBaseline='middle';cx.textAlign='left';
  cx.font='18px "VT323R",monospace';
  cx.fillStyle=back?'#f3a8b8':(sel?'#f2ffff':'#a6bac8');
  cx.fillText(it.label,118,y-4);
  if(back)return;
  const val=settingsValue(it,false);
  const on=settingsActive(it);
  cx.textAlign='right';cx.font='11px "Pixel8",monospace';
  cx.fillStyle=on?UI.green:'#6d8494';
  cx.fillText((vol?'◀ '+val+' ▶':val),530,y-4);
 });
 cx.textAlign='center';cx.fillStyle=UI.dim;cx.font='8px "Pixel8",monospace';cx.textBaseline='top';
 cx.fillText('UP/DOWN SELECT // LEFT/RIGHT ADJUST // Z TOGGLE // ESC BACK',W/2,H-48);
}
function drawReplay(){
 menuFrame('REPLAY');
 const info=Replay.info();
 if(info){
  const rc=info.result==='CLEAR'?UI.amber:info.result==='FAILED'?UI.red:UI.cyan;
  cx.textAlign='left';cx.textBaseline='top';cx.font='8px "Pixel8",monospace';
  cx.fillStyle=UI.cyan;cx.fillText('LAST ATTEMPT // '+info.mode+' // '+info.diff,68,132);
  cx.textAlign='right';cx.fillStyle=rc;cx.fillText(info.result,572,132);
  const rows2=[['SCORE',info.score],['SPELLS',info.spells],['DEATHS',info.deaths],['LENGTH',Math.floor(info.frames/60)+'s']];
  rows2.forEach(([k,v],i)=>{
   const y=154+i*18;
   cx.textAlign='left';cx.fillStyle=UI.dim;cx.fillText(k,68,y);
   cx.textAlign='right';cx.fillStyle='#dff4ff';cx.fillText(String(v),572,y);
  });
  const date=info.date?info.date.toISOString().slice(0,10):'UNKNOWN';
  cx.textAlign='left';cx.fillStyle=UI.dim;cx.fillText('RECORDED',68,226);
  cx.textAlign='right';cx.fillStyle='#9fb8c8';cx.fillText(date,572,226);
  cx.textAlign='left';cx.fillStyle=UI.dim;cx.fillText('ROUTE',68,242);
  cx.textAlign='right';cx.fillStyle='#9fb8c8';cx.font='11px "VT323R",monospace';
  const routeText=info.routes||'UNRECORDED';
  cx.fillText(routeText.length>54?routeText.slice(0,51)+'...':routeText,572,241);
 }else{
  cx.textAlign='center';cx.textBaseline='top';cx.font='13px "VT323R",monospace';
  cx.fillStyle=UI.dim;cx.fillText('NO REPLAY SAVED',W/2,150);
  cx.font='8px "Pixel8",monospace';
  cx.fillText('FINISH A RUN TO RECORD ONE',W/2,168);
  cx.fillText('OR IMPORT A SHARED .JSON RUN',W/2,184);
 }
 const rows=[
  {label:'PLAY LAST ATTEMPT',tag:'LOCAL',col:UI.magenta,on:!!info},
  {label:'EXPORT RUN FILE',tag:'.JSON',col:UI.green,on:!!info},
  {label:'IMPORT RUN FILE',tag:'.JSON',col:UI.cyan,on:true},
  {label:'DELETE SAVE',tag:'LOCAL',col:UI.red,on:!!info},
  {label:'BACK',tag:'',col:UI.blue,on:true}
 ];
 const rowTop=info?254:220;
 rows.forEach((row,i)=>{
  const sel=i===G.replayCursor,rowY=rowTop+i*26,y=rowY+11;
  const cc=sel?(row.on?row.col:UI.dim):row.on?UI.blue:'rgba(90,160,190,.32)';
  uiTile(98,rowY,444,22,{sel:sel,col:cc,on:row.on,fill:row.label==='BACK'?'rgba(24,8,18,.5)':(row.on?'rgba(5,13,25,.72)':'rgba(5,13,25,.4)')});
  if(sel)uiCursor(106,y-5,cc);
  cx.textBaseline='middle';cx.textAlign='left';cx.font='18px "VT323R",monospace';
  cx.fillStyle=row.on?(row.label==='BACK'?'#d7c0d0':(sel?'#f2ffff':'#a6bac8')):'#526677';
  cx.fillText(row.label,118,y-1);
  if(row.tag)uiTag(row.tag,530,y-7,row.on?row.col:UI.dim,'right');
  TouchUI.add(98,rowY,444,22,()=>{if(!row.on){sfx('no');return;}G.replayCursor=i;edge[KEY.Z]=true;},'replay:'+i);
 });
 if(G.replayMsg){
  cx.textAlign='center';cx.textBaseline='top';cx.fillStyle=UI.amber;cx.font='8px "Pixel8",monospace';
  cx.fillText(G.replayMsg,W/2,406);
 }
 cx.textAlign='center';cx.fillStyle=UI.dim;cx.font='8px "Pixel8",monospace';cx.textBaseline='top';
 cx.fillText(IS_TOUCH?'TAP A ROW // BACK RETURNS':'UP/DOWN SELECT // Z CONFIRM // ESC BACK',W/2,H-30);
}
function controllerRows(){
 const gs=GamepadSupport;
 const map=gs.config.map;
 return CONTROLLER_ROWS.map(row=>{
  if(row.k==='enabled')return Object.assign({},row,{value:!gs.supported?'N/A':(gs.enabled?'ON':'OFF'),col:gs.supported&&gs.enabled?UI.green:'#6d8494'});
  if(row.k==='reset')return Object.assign({},row,{value:'DEFAULTS',col:UI.amber});
  if(row.k==='back')return Object.assign({},row,{value:'',col:UI.red});
  const listening=gs.listening&&gs.captureAction===row.k;
  return Object.assign({},row,{
   value:listening?(gs.captureArmed?'PRESS...':'RELEASE...'):gs.buttonLabel(map[row.k]),
   col:listening?UI.amber:UI.cyan
  });
});
}
function controllerStatus(){
 const gs=GamepadSupport;
 if(!gs.supported)return {line:'GAMEPAD API UNAVAILABLE',sub:'USE A SUPPORTED BROWSER',col:UI.red};
 if(gs.connected){
  const name=gs.padName.length>34?gs.padName.slice(0,31)+'...':gs.padName;
  return {line:'CONNECTED // '+name.toUpperCase(),sub:gs.padMapping==='standard'?'STANDARD MAPPING':'NON-STANDARD // REMAP AS NEEDED',col:UI.green};
 }
 if(!gs.enabled)return {line:'CONTROLLER INPUT OFF',sub:'ENABLE INPUT TO USE A PAD',col:UI.amber};
 return {line:'NO CONTROLLER DETECTED',sub:'CONNECT A PAD AND PRESS A BUTTON',col:UI.dim};
}
function controllerFooter(){
 if(!GamepadSupport.supported)return 'GAMEPAD API REQUIRED // KEYBOARD AND TOUCH STILL WORK';
 if(GamepadSupport.listening)
  return GamepadSupport.captureArmed?(IS_TOUCH?'PRESS A PAD BUTTON // TAP TO CANCEL':'PRESS ANY CONTROLLER BUTTON // ESC CANCELS'):'RELEASE THE BUTTONS, THEN PRESS A NEW ONE';
 return G.gpadMsg||(IS_TOUCH?'TAP A ROW TO BIND // BACK RETURNS':'UP/DOWN SELECT // Z / A BIND // ESC / B BACK');
}
function drawController(){
 if(IS_TOUCH){drawTouchController();return;}
 menuFrame('CONTROLLER');
 const st=controllerStatus();
 cx.textAlign='left';cx.textBaseline='top';cx.font='8px "Pixel8",monospace';
 cx.fillStyle=st.col;cx.fillText(st.line,68,136);
 cx.fillStyle=UI.dim;cx.fillText(st.sub,68,148);
 cx.textAlign='right';cx.font='7px "Pixel8",monospace';
 cx.fillText(GamepadSupport.connected?GamepadSupport.padButtons+' BTN // '+GamepadSupport.padAxes+' AXIS':'P1',W-68,136);
 const rows=controllerRows();
 rows.forEach((row,i)=>{
  const sel=i===G.gpadCursor,y=178+i*26,rowY=y-12;
  uiTile(98,rowY,444,22,{sel:sel,col:sel?row.col:UI.blue,fill:row.k==='back'?'rgba(24,8,18,.5)':'rgba(5,13,25,.55)'});
  if(sel)uiCursor(106,y,sel?row.col:UI.dim);
  cx.textBaseline='middle';cx.textAlign='left';
  cx.font='18px "VT323R",monospace';
  cx.fillStyle=row.k==='back'?'#f3a8b8':(sel?'#f2ffff':'#a6bac8');
  cx.fillText(row.label,118,y-4);
  if(row.value!==''){
   cx.textAlign='right';cx.font='11px "Pixel8",monospace';
   cx.fillStyle=row.col;cx.fillText(row.value,530,y-4);
  }
 });
 cx.textAlign='center';cx.fillStyle=UI.dim;cx.font='8px "Pixel8",monospace';cx.textBaseline='top';
 cx.fillText(controllerFooter(),W/2,H-48);
}
function drawTouchController(){
 menuFrame('CONTROLLER');
 const st=controllerStatus();
 cx.textAlign='left';cx.textBaseline='top';cx.font='8px "Pixel8",monospace';
 cx.fillStyle=st.col;cx.fillText(st.line,68,134);
 cx.fillStyle=UI.dim;cx.fillText(st.sub,68,146);
 const rows=controllerRows();
 const x0=78,x1=324,cw=234,ch=40,y0=164,rh=44;
 rows.forEach((row,i)=>{
  const col=i%2,rr=(i/2)|0,x=x0+col*(x1-x0),y=y0+rr*rh;
  const sel=i===G.gpadCursor,back=row.k==='back';
  const cc=back?UI.red:(sel?row.col:(row.k==='enabled'||row.value)?UI.blue:'rgba(90,160,190,.32)');
  uiTile(x,y,cw,ch,{sel:sel,col:cc,on:row.k==='enabled'&&GamepadSupport.supported&&GamepadSupport.enabled,fill:back?'rgba(24,8,18,.62)':'rgba(5,13,25,.72)'});
  uiTag('0'+(i+1),x+9,y+7,sel?cc:UI.dim);
  cx.textAlign='left';cx.textBaseline='top';
  cx.fillStyle=back?'#f3a8b8':'#dff4ff';cx.font='16px "VT323R",monospace';
  cx.fillText(row.label,x+9,y+17);
  if(row.value!==''){
   cx.textAlign='right';cx.font='10px "Pixel8",monospace';
   cx.fillStyle=row.col;cx.fillText(row.value,x+cw-9,y+19);
  }
  TouchUI.add(x,y,cw,ch,()=>{
   G.gpadCursor=i;sfx('cur');
   if(back){G.screen='settings';G.gpadMsg='';return;}
   if(row.k==='enabled'){
    if(!GamepadSupport.supported){G.gpadMsg='GAMEPAD API UNAVAILABLE';sfx('no');return;}
    GamepadSupport.setEnabled(!GamepadSupport.enabled);sfx('ok');
    G.gpadMsg=GamepadSupport.enabled?'INPUT ENABLED':'INPUT DISABLED';
   }else if(row.k==='reset'){
    GamepadSupport.resetBindings();sfx('ok');G.gpadMsg='DEFAULT BINDINGS RESTORED';
   }else{
    GamepadSupport.beginCapture(row.k);
   }
  },'controller:'+row.k);
 });
 cx.textAlign='center';cx.fillStyle=UI.dim;cx.font='8px "Pixel8",monospace';cx.textBaseline='top';
 cx.fillText(controllerFooter(),W/2,H-30);
 if(GamepadSupport.listening){
  cx.fillStyle='rgba(2,6,14,.86)';cx.fillRect(48,104,W-96,312);
  uiPanel(126,214,388,88,{cut:6,col:UI.amber,ticks:false,fill:'rgba(18,12,4,.94)'});
  cx.textAlign='center';cx.textBaseline='middle';
  cx.fillStyle=UI.amber;cx.font='10px "Pixel8",monospace';
  cx.fillText('BINDING '+CONTROLLER_ROWS[G.gpadCursor].label.toUpperCase(),W/2,240);
  cx.fillStyle='#fff2c8';cx.font='15px "VT323R",monospace';
  cx.fillText(GamepadSupport.captureArmed?'PRESS A CONTROLLER BUTTON':'RELEASE THE BUTTONS',W/2,260);
  cx.fillStyle='#a09060';cx.font='8px "Pixel8",monospace';
  cx.fillText('TAP HERE TO CANCEL',W/2,280);
  TouchUI.add(0,0,W,H,()=>{GamepadSupport.cancelCapture();G.gpadMsg='BIND CANCELLED';sfx('cur');},'controller:cancel');
 }
}
function drawHelp(){
 menuFrame('HOW TO PLAY');
 if(IS_TOUCH)touchBtn(16,14,104,40,'BACK',()=>{sfx('cur');G.screen=G.helpFrom;},{id:'help:back',col:'#9ab'});
 const left=IS_TOUCH?[
  ['MOVE','Stick / D-Pad'],['FOCUS','Focus / LB'],['SHOOT','FIRE / PAD A'],['BOMB','BOMB / PAD B'],
  ['SPELL','SPELL / PAD X'],['DEATHBOMB','BOMB / SPELL'],['PAUSE','II / START'],
  ['MENUS','Stick + FIRE'],['SETTINGS','Title / pause'],['AUDIO','Mute in settings']
 ]:[
  ['MOVE','Arrows / Stick'],['FOCUS','Shift / LB'],['SHOOT','Z / PAD A'],
  ['SPELL','C / PAD X'],['FLASH','X / PAD B'],['DEATHBOMB','X / C after hit'],
  ['PAUSE','Esc / START'],['CONFIRM','Z / Enter / A'],['AUTOFIRE','A toggle'],
  ['AUDIO','M mute · -/+ music']
 ];
 const right=[
  ['GRAZE','Charges flash + OD'],['FLASH','30 graze: clear + damage'],['OVERDRIVE','80 graze: ×1.5 dmg'],
  ['1CC','Full route · 1 credit'],['CONTINUE','1 credit · ends 1CC'],['RETRY','Pause restart · 1 credit'],
  ['STORY','Waves, then the boss'],['STORY 1CC','Waves + no continues'],
  ['RANK','Capture spells to rank up'],['REPLAY','Watch or share a run'],
  ['ONLINE / CO-OP','O · 2P WASD J/K/L/I'],['CHARACTER','Pick a shottype per run']
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
 cx.fillText(IS_TOUCH?'TAP BACK TO RETURN':(GamepadSupport.enabled&&GamepadSupport.connected?'ESC / Z / PAD B  BACK':'ESC / Z  BACK'),W/2,H-48);
}

/* ---------- boot/loop ---------- */
let acc=0,last=performance.now();
function frame(now){
 requestAnimationFrame(frame);
 acc+=Math.min(now-last,100);last=now;
 fpsFrames++;
 if(now-fpsTime>=1000){fpsVal=Math.round(fpsFrames*1000/(now-fpsTime));fpsFrames=0;fpsTime=now;updatePerformance();}
 while(acc>=1000/60){
  acc-=1000/60;
  G.frame++;
  if(typeof GamepadSupport!=='undefined'&&GamepadSupport.poll)GamepadSupport.poll();
  updatePetals();
  if(IS_TOUCH)TouchUI.updateStick(now);
   if(hitK(KEY.ESC)){
    const s=G.screen;
      if(s==='play'){
       if(Gdemo)endDemo();
       else if(G.replay){Replay.stop();goTitle(false);sfx('cur');}
       else if(typeof Net!=='undefined'&&Net.active){TouchUI.resetStick();Net.requestPause();}
       else{TouchUI.resetStick();G.screen='pause';G.pauseCursor=0;G.pauseConfirm=null;sfx('cur');}
      }else if(s==='pause'){
     if(G.pauseConfirm){G.pauseConfirm=null;sfx('no');}
     else G.screen='play';
    }else if(s==='diff'){if(G.onlineSetup){G.onlineSetup=false;G.screen='online';G.onlineMode='lobby';}else G.screen='title';sfx('cur');}
    else if(s==='sel'){G.screen='diff';sfx('cur');}
    else if(s==='settings'){G.screen=G.settingsFrom;sfx('cur');}
    else if(s==='controller'){
     if(GamepadSupport.listening){GamepadSupport.cancelCapture();G.gpadMsg='BIND CANCELLED';}
     else G.screen='settings';
     sfx('cur');
    }
    else if(s==='help'){G.screen=G.helpFrom;sfx('cur');}
    else if(s==='replay'){G.screen=G.replayFrom||'settings';sfx('cur');}
    else if(s==='gameover'){sfx('no');goTitle();}
   }
   if(hitK(KEY.MINUS)||hitK(KEY.COMMA)||hitK(KEY.NUMPAD_MINUS)||hitK(KEY.FF_MINUS)){settings.musicVol=clamp(settings.musicVol-1,0,VOL_STEPS.length-1);setMusicVol(settings.musicVol);saveSettings();}
   if(hitK(KEY.A)&&!G.replay&&!G.online){settings.autoFire=!settings.autoFire;autoFire=settings.autoFire;saveSettings();sfx("cur");}
   if(hitK(KEY.F)){settings.showFps=!settings.showFps;showFps=settings.showFps;saveSettings();}
   if(hitK(KEY.PLUS)||hitK(KEY.PERIOD)||hitK(KEY.NUMPAD_PLUS)||hitK(KEY.EQUALS)){settings.musicVol=clamp(settings.musicVol+1,0,VOL_STEPS.length-1);setMusicVol(settings.musicVol);saveSettings();}
   if(typeof Net!=='undefined'&&Net.pendingStart&&performance.now()>=Net.syncUntil)Net.completeStart();
   if(G.screen==='play'&&G.freeze>0){G.freeze--;clearEdges();continue;}
  if(G.screen==='play'){
   if(G.replay&&!Replay.playback){Replay.endPlayback();clearEdges();continue;}
   if(typeof Net!=='undefined'&&Net.active){
    Net.pump();
    if(Net.shouldPause()){Net.enterPause();clearEdges();continue;}
    if(!Net.beforeTick()){clearEdges();acc=0;continue;}
    updatePlay();
    Net.capturing=false;
   }else{
    Replay.beforeUpdate();
    if(G.replay&&!Replay.playback){Replay.endPlayback();clearEdges();continue;}
    updatePlay();
   }
  }else updateMenus();
  clearEdges();
 }
 drawScreen();
}
requestAnimationFrame(frame);
loadAssets();

/* ---- Mobile / Touch Support ---- */
/* The DOM pad and canvas tap zones are wired in boot.js. */

startTitleBgm();
