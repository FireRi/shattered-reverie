(function(){
"use strict";
if(typeof document==='undefined'||!document.getElementById)return;
var cabEl=document.getElementById('cabinet');
var cabL=document.getElementById('cabL');
var cabR=document.getElementById('cabR');
var cabArt=document.getElementById('cabArt');
if(!cabEl||!cabL||!cabR)return;
var el={
 routeId:document.getElementById('cabRouteId'),
 stageNo:document.getElementById('cabStageNo'),
 stageTitle:document.getElementById('cabStageTitle'),
 stageMode:document.getElementById('cabStageMode'),
 diff:document.getElementById('cabDiff'),
 modeTag:document.getElementById('cabModeTag'),
 hi:document.getElementById('cabHi'),
 score:document.getElementById('cabScore'),
 credits:document.getElementById('cabCredits'),
 lives:document.getElementById('cabLives'),
 spellVal:document.getElementById('cabSpellVal'),
 bombs:document.getElementById('cabBombs'),
 powerVal:document.getElementById('cabPowerVal'),
 powerBar:document.getElementById('cabPowerBar'),
 flashVal:document.getElementById('cabFlashVal'),
 flashBar:document.getElementById('cabFlashBar'),
 odVal:document.getElementById('cabOdVal'),
 odBar:document.getElementById('cabOdBar'),
 graze:document.getElementById('cabGraze'),
 sparks:document.getElementById('cabSparks'),
 deaths:document.getElementById('cabDeaths'),
 captures:document.getElementById('cabCaptures'),
 waveRow:document.getElementById('cabWaveRow'),
 wave:document.getElementById('cabWave'),
 streak:document.getElementById('cabStreak'),
 flags:document.getElementById('cabFlags'),
 fps:document.getElementById('cabFps')
};
var SCREENS={play:1,pause:1,gameover:1,result:1,demo:1};
var DIFF_SHORT=['EASY','ORIGINAL','ALL-STAR','1CC','STORY','STORY 1CC'];
var cached={};
var liveState=false;

function text(name,value){
 var node=el[name];
 if(!node)return;
 var next=String(value==null?'':value);
 if(cached[name]===next)return;
 cached[name]=next;
 node.textContent=next;
}

function pips(node,count,max){
 if(!node)return;
 if(node.childNodes.length!==max){
  node.innerHTML='';
  for(var i=0;i<max;i++)node.appendChild(document.createElement('i'));
  node._cabCount=-1;
 }
 count=Math.max(0,Math.min(max,count|0));
 if(node._cabCount===count)return;
 node._cabCount=count;
 for(var j=0;j<max;j++){
  var child=node.childNodes[j];
  if(child&&child.classList)child.classList.toggle('on',j<count);
 }
}

function bar(node,ratio){
 if(!node)return;
 var pct=Math.max(0,Math.min(100,Math.round(ratio*100)));
 if(node._cabPct===pct)return;
 node._cabPct=pct;
 node.style.width=pct+'%';
}

function setArt(key){
 if(!cabArt)return;
 var im=key&&typeof ASSETS!=='undefined'?ASSETS[key]:null;
 var src=im&&im.src?im.src:'';
 if(cached.art===key&&cached.artSrc===src)return;
 cached.art=key;cached.artSrc=src;
 cabArt.style.backgroundImage=src?'url("'+src+'")':'';
}

function sync(){
 if(typeof document==='undefined'||!document.body||!document.body.classList)return;
 var eligible=document.body.classList.contains('cab-eligible');
 var live=!!(eligible&&G&&SCREENS[G.screen]&&!(typeof IS_TOUCH!=='undefined'&&IS_TOUCH));
 if(live!==liveState){
  liveState=live;
  document.body.classList.toggle('cab-live',live);
  if(cabEl.setAttribute)cabEl.setAttribute('aria-hidden',live?'false':'true');
 }
 if(!live)return;

 var hasRoute=G.routeQueue&&G.routeQueue.length&&G.routeIdx>=0&&G.routeQueue[G.routeIdx]!==undefined;
 var R=hasRoute?ROUTES[G.routeQueue[G.routeIdx]]:null;
 var diffName=G.story&&G.oneCC?'STORY 1CC':G.oneCC?'1CC':G.story?'STORY':DIFF_SHORT[DIFF]||DIFFS[DIFF]||'ORIGINAL';
 var routeMode=R&&R.mode?String(R.mode).toUpperCase():'STANDARD';
 var modeLabel=G.oneCC?'NO CONTINUE':G.story?'WAVE RUN':'ROUTE';
 var score=Math.floor(G.dispScore);
 var hi=Math.max(G.hi,G.score);

 text('routeId',R?'R.'+String(G.routeIdx+1).padStart(2,'0'):'--');
 text('stageNo',R?R.id:'--');
 text('stageTitle',R?R.title:'Standby');
 text('stageMode',routeMode+' // '+diffName);
 text('diff',diffName);
 text('modeTag',modeLabel);
 text('hi',fmtScore(hi));
 text('score',fmtScore(score));
 text('credits','CR '+G.coins);
 text('spellVal',PL.spells+'/4');
 text('powerVal',(PL.power/100).toFixed(2));
 text('flashVal',PL.flash>=PL.flashMax?'READY':PL.flash+'/'+PL.flashMax);
 text('odVal',G.trance>0?'x1.5':G.od+'/'+G.odMax);
 text('graze',PL.graze);
 text('sparks',G.sparksGot);
 text('deaths',G.deaths);
 text('captures',G.spellsCaptured+'/'+G.spellsPlayed);
 text('streak','STREAK x'+(G.streakMult||1).toFixed(2));

 pips(el.lives,PL.lives,8);
 pips(el.bombs,PL.spells,4);
 bar(el.powerBar,PL.power/500);
 bar(el.flashBar,PL.flash/PL.flashMax);
 bar(el.odBar,G.trance>0?G.trance/330:G.od/G.odMax);

 var flags=[];
 if(autoFire)flags.push('AUTO');
 if(AudioSys.muted)flags.push('MUTED');
 if(typeof GamepadSupport!=='undefined'&&GamepadSupport.connected&&GamepadSupport.enabled)flags.push('PAD');
 if(settings&&settings.aiDialogue===false)flags.push('AI OFF');
 if(perfLevel<2)flags.push(perfLevel?'FX HALF':'FX LOW');
 text('flags',flags.join(' // '));
 text('fps',showFps&&fpsVal>0?fpsVal+' FPS'+(perfLevel<2?' // FX '+(perfLevel?'HALF':'LOW'):''):'');

 var wave=G.wave;
 if(el.waveRow&&el.waveRow.classList)el.waveRow.classList.toggle('is-hidden',!wave);
 if(wave){
  text('wave',(wave.kills||0)+'/'+wave.queue.length);
 }
 setArt(R&&typeof routeBgKey==='function'?routeBgKey():null);
}

window.CabinetUI={sync:sync};
})();
