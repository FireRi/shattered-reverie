(function(){
"use strict";
var cv=document.getElementById('cv');
var wrapEl=document.getElementById('wrap');
var padEl=document.getElementById('pad');
var stickEl=document.getElementById('padStick');
var knobEl=document.getElementById('padKnob');
var pauseEl=document.getElementById('padPause');
var fullEl=document.getElementById('padFull');
var focusEl=document.getElementById('padFocus');
var spellEl=document.getElementById('padSpell');
var bombEl=document.getElementById('padBomb');
var fireEl=document.getElementById('padFire');
var rotateEl=document.getElementById('rotate');
var rotateSkip=document.getElementById('rotateSkip');
var rotateFull=document.getElementById('rotateFull');
var cabEl=document.getElementById('cabinet');
var cabL=document.getElementById('cabL');
var cabR=document.getElementById('cabR');
var touch=typeof IS_TOUCH!=='undefined'&&IS_TOUCH;
if(touch&&document.body&&document.body.classList)document.body.classList.add('touch');

var canvasW=640,canvasH=480;
var padLayout={mode:'none',stickCx:0,stickCy:0,stickD:0,stickR:0,knobD:0};
var padShown=false,stickPtr=null,firePtr=null;

function viewRect(){
 var vv=window.visualViewport;
 if(vv&&vv.width&&vv.height)return{x:vv.offsetLeft||0,y:vv.offsetTop||0,w:vv.width,h:vv.height};
 return{x:0,y:0,w:window.innerWidth,h:window.innerHeight};
}

function place(el,cx,cy,d,fs){
 if(!el)return;
 var q=Math.max(1,Math.round(d));
 el.style.left=Math.round(cx-q/2)+'px';
 el.style.top=Math.round(cy-q/2)+'px';
 el.style.width=q+'px';
 el.style.height=q+'px';
 el.style.display='flex';
 if(fs)el.style.fontSize=Math.max(8,Math.round(fs))+'px';
}

function stickAt(cx,cy,d){
 place(stickEl,cx,cy,d);
 var kd=Math.max(14,Math.round(d*.44));
 if(knobEl){
  knobEl.style.width=kd+'px';
  knobEl.style.height=kd+'px';
 }
 padLayout.stickCx=cx;padLayout.stickCy=cy;padLayout.stickD=d;
 padLayout.stickR=d/2;padLayout.knobD=kd;
}

function safeInset(name){
 if(!window.getComputedStyle)return 0;
 try{
  var n=parseFloat(window.getComputedStyle(padEl).getPropertyValue(name));
  return isFinite(n)?n:0;
 }catch(err){return 0;}
}

function layoutPad(v,w,h,portrait){
 if(!padEl)return;
 padEl.style.left=v.x+'px';
 padEl.style.top=v.y+'px';
 padEl.style.width=w+'px';
 padEl.style.height=h+'px';
 padEl.style.display=padShown?'block':'none';
 if(!touch){padLayout.mode='none';return;}
 var sal=safeInset('--sal'),sar=safeInset('--sar'),sat=safeInset('--sat'),sab=safeInset('--sab');
 var u=Math.max(42,Math.min(88,Math.min(w,h)*.19));
 var stickD,fireD,bombD,spellD,focusD,pauseD,fullD;
 if(portrait){
  padLayout.mode='deck';
  var top=h-Math.max(190,Math.min(300,Math.round(h*.30)));
  u=Math.max(36,Math.min(u,(w-sal-sar-64)/4.38));
  stickD=u*1.18;fireD=u;bombD=u*.78;spellD=u*.74;focusD=u*.68;pauseD=u*.56;fullD=pauseD;
  var left=14+sal,right=w-14-sar,bottom=h-14-sab;
  stickAt(left+stickD/2,bottom-stickD/2,stickD);
  place(focusEl,left+stickD+8+focusD/2,bottom-focusD/2,focusD,focusD*.16);
  var fireCx=right-fireD/2,fireCy=bottom-fireD/2;
  place(fireEl,fireCx,fireCy,fireD,fireD*.18);
  var bombCx=fireCx-fireD/2-8-bombD/2;
  place(bombEl,bombCx,bottom-bombD/2,bombD,bombD*.16);
  place(spellEl,bombCx-bombD/2-8-spellD/2,bottom-spellD/2,spellD,spellD*.15);
  place(pauseEl,left+pauseD/2,top+14+sat+pauseD/2,pauseD,pauseD*.32);
  if(fullSupported)place(fullEl,right-fullD/2,top+14+sat+fullD/2,fullD,fullD*.28);
  return;
 }
 var gutter=(w-canvasW)/2;
 if(gutter>=64){
  padLayout.mode='gutter';
  u=Math.max(36,Math.min(u,(gutter-Math.max(sal,sar)-14)/1.18));
  stickD=u*1.18;fireD=u;bombD=u*.78;spellD=u*.74;focusD=u*.68;pauseD=u*.56;fullD=pauseD;
  var lx=sal+(gutter-sal)/2,rx=(w-gutter)+(gutter-sar)/2;
  var stickCy=h-12-sab-stickD/2;
  stickAt(lx,stickCy,stickD);
  place(focusEl,lx,stickCy-stickD/2-10-focusD/2,focusD,focusD*.16);
  place(pauseEl,lx,12+sat+pauseD/2,pauseD,pauseD*.32);
  if(fullSupported)place(fullEl,rx,12+sat+fullD/2,fullD,fullD*.28);
  var fireCy=h-12-sab-fireD/2;
  place(fireEl,rx,fireCy,fireD,fireD*.18);
  var bombCy=fireCy-fireD/2-10-bombD/2;
  place(bombEl,rx,bombCy,bombD,bombD*.16);
  place(spellEl,rx,bombCy-bombD/2-10-spellD/2,spellD,spellD*.15);
  return;
 }
 padLayout.mode='overlay';
 u=Math.max(36,Math.min(u,(w-sal-sar-64)/4.38));
 stickD=u*1.18;fireD=u;bombD=u*.78;spellD=u*.74;focusD=u*.68;pauseD=u*.56;fullD=pauseD;
 var oleft=12+sal,oright=w-12-sar,ob=h-12-sab;
 stickAt(oleft+stickD/2,ob-stickD/2,stickD);
 place(focusEl,oleft+stickD+8+focusD/2,ob-focusD/2,focusD,focusD*.16);
 var ofx=oright-fireD/2,ofy=ob-fireD/2;
 place(fireEl,ofx,ofy,fireD,fireD*.18);
 var obx=ofx-fireD/2-8-bombD/2;
 place(bombEl,obx,ob-bombD/2,bombD,bombD*.16);
 place(spellEl,obx-bombD/2-8-spellD/2,ob-spellD/2,spellD,spellD*.15);
 place(pauseEl,oleft+pauseD/2,12+sat+pauseD/2,pauseD,pauseD*.32);
 if(fullSupported)place(fullEl,oright-fullD/2,12+sat+fullD/2,fullD,fullD*.28);
}

function layoutCabinet(v,w,wrapH,scale,cw,ch,portrait){
 var gutter=(w-cw)/2;
 var eligible=!touch&&!portrait&&gutter>=150&&!!cabEl&&!!cabL&&!!cabR;
 if(document.body&&document.body.classList){
  document.body.classList.toggle('cab-eligible',eligible);
  if(!eligible)document.body.classList.remove('cab-live');
 }
 if(!eligible)return;
 var gap=Math.max(8,Math.round(10*scale));
 var pw=Math.max(1,Math.floor(gutter-gap));
 var top=Math.round((wrapH-ch)/2);
 cabEl.style.setProperty('--cab-scale',String(Math.min(scale,Math.max(.85,pw/140))));
 cabL.style.left=Math.round(v.x)+'px';
 cabL.style.top=Math.round(v.y+top)+'px';
 cabL.style.width=pw+'px';
 cabL.style.height=ch+'px';
 cabR.style.left=Math.round(v.x+w-pw)+'px';
 cabR.style.top=Math.round(v.y+top)+'px';
 cabR.style.width=pw+'px';
 cabR.style.height=ch+'px';
}

function fit(){
 var v=viewRect(),w=v.w,h=v.h;
 var portrait=h>w,wrapH=h;
 var scale=Math.min(w/640,h/480);
 if(touch&&portrait){
  var deckH=Math.max(190,Math.min(300,Math.round(h*.30)));
  var deckTop=h-deckH;
  var bottom=(h-480*scale)/2+480*scale;
  if(bottom>deckTop){
   wrapH=deckTop;
   scale=Math.min(w/640,deckTop/480);
  }
 }
 canvasW=Math.max(1,Math.round(640*scale));
 canvasH=Math.max(1,Math.round(480*scale));
 cv.style.width=canvasW+'px';
 cv.style.height=canvasH+'px';
 if(wrapEl){
  wrapEl.style.left=v.x+'px';
  wrapEl.style.top=v.y+'px';
  wrapEl.style.width=w+'px';
  wrapEl.style.height=wrapH+'px';
 }
 layoutPad(v,w,h,portrait);
 layoutCabinet(v,w,wrapH,scale,canvasW,canvasH,portrait);
}

window.addEventListener('resize',fit,{passive:true});
window.addEventListener('orientationchange',function(){setTimeout(fit,200);});
if(window.visualViewport){
 window.visualViewport.addEventListener('resize',fit,{passive:true});
 window.visualViewport.addEventListener('scroll',fit,{passive:true});
}

if(rotateSkip)rotateSkip.addEventListener('click',function(e){
 e.preventDefault();e.stopPropagation();
 if(rotateEl)rotateEl.style.display='none';
});

function lockLandscape(){
 try{
  var so=window.screen&&window.screen.orientation;
  if(so&&so.lock){
   var p=so.lock('landscape');
   if(p&&p.catch)p.catch(function(){});
  }
 }catch(err){}
}

function fullElement(){
 return document.fullscreenElement||document.webkitFullscreenElement||document.msFullscreenElement||null;
}
function canFullscreen(){
 var d=document.documentElement;
 return !!(d&&(d.requestFullscreen||d.webkitRequestFullscreen||d.msRequestFullscreen));
}
function requestFullscreen(){
 var d=document.documentElement;
 var req=d&&(d.requestFullscreen||d.webkitRequestFullscreen||d.msRequestFullscreen);
 if(!req)return;
 try{
  var p=req.call(d);
  if(p&&p.then)p.then(lockLandscape).catch(function(){});
  else setTimeout(lockLandscape,150);
 }catch(err){}
}
function exitFullscreen(){
 var d=document;
 var fn=d.exitFullscreen||d.webkitExitFullscreen||d.msExitFullscreen;
 if(fn)try{fn.call(d);}catch(err){}
}
function toggleFullscreen(){
 if(fullElement())exitFullscreen();
 else requestFullscreen();
}
var fullSupported=canFullscreen();

if(rotateFull){
 if(!fullSupported)rotateFull.style.display='none';
 else{
  rotateFull.style.display='inline-block';
  rotateFull.addEventListener('click',function(e){
   e.preventDefault();e.stopPropagation();
   requestFullscreen();
  });
 }
}

var hintEl=document.getElementById('hint');
function hideHint(){if(hintEl)hintEl.style.display='none';}
function gamePos(t){
 var r=cv.getBoundingClientRect();
 return{
  x:(t.clientX-r.left)/r.width*W,
  y:(t.clientY-r.top)/r.height*H
 };
}

function pressBomb(){
 if(G.screen==='play')edge[KEY.X]=true;
 else edge[KEY.ESC]=true;
}
function pressSpell(){
 try{AudioSys.unlock();}catch(err){}
 if(PL.dead){
  if(PL.deathWindow>0)tryDeathbomb();
  return;
 }
 if(!useSpell())sfx('no');
}
function pressFocus(){
 if(G.screen!=='play')return;
 TouchUI.focus=!TouchUI.focus;
 sfx('cur');
}
function pressPause(){
 if(G.screen!=='play'||Gdemo)return;
 TouchUI.resetStick();
 G.screen='pause';G.pauseCursor=0;G.pauseConfirm=null;
 sfx('cur');
}

function releasePad(){
 TouchUI.release();
 stickPtr=null;firePtr=null;
 if(stickEl&&stickEl.classList)stickEl.classList.remove('active');
 if(knobEl)knobEl.style.transform='translate(-50%,-50%)';
 var els=[fireEl,bombEl,spellEl,focusEl,pauseEl,fullEl];
 for(var i=0;i<els.length;i++)if(els[i]&&els[i].classList)els[i].classList.remove('press');
}

function syncPad(){
 if(!padEl)return;
 var show=touch&&!Gdemo&&['title','diff','sel','pause','play','settings'].indexOf(G.screen)>=0;
 if(show!==padShown){
  padShown=show;
  if(!show)releasePad();
 }
 padEl.style.display=show?'block':'none';
 padEl.setAttribute('aria-hidden',show?'false':'true');
 if(!show)return;
 var inPlay=G.screen==='play';
 if(pauseEl)pauseEl.style.display=inPlay?'flex':'none';
 if(fullEl){
  fullEl.style.display=fullSupported?'flex':'none';
  if(fullSupported){
   var fullLabel=fullElement()?'EXIT':'FULL';
   if(fullEl.textContent!==fullLabel)fullEl.textContent=fullLabel;
  }
 }
 if(focusEl)focusEl.style.display=inPlay?'flex':'none';
 if(spellEl)spellEl.style.display=inPlay?'flex':'none';
 if(bombEl){
  bombEl.style.display=G.screen==='title'?'none':'flex';
  var bombLabel=inPlay?'BOMB':'BACK';
  if(bombEl.textContent!==bombLabel)bombEl.textContent=bombLabel;
 }
 if(fireEl)fireEl.style.display='flex';
 if(stickEl)stickEl.style.display='flex';
 var s=TouchUI.stick;
 if(stickEl&&stickEl.classList)stickEl.classList.toggle('active',!!s.active);
 if(focusEl&&focusEl.classList)focusEl.classList.toggle('on',!!TouchUI.focus);
 if(knobEl)knobEl.style.transform='translate(-50%,-50%) translate('+(s.kx||0)+'px,'+(s.ky||0)+'px)';
 if(bombEl&&bombEl.classList){
  var canBomb=inPlay&&!PL.dead&&bombsAvailable();
  var canSave=inPlay&&PL.dead&&PL.deathWindow>0;
  bombEl.classList.toggle('off',inPlay&&!canBomb&&!canSave);
 }
 if(spellEl&&spellEl.classList){
  var canCast=inPlay&&!PL.dead&&PL.spells>0&&bombsAvailable();
  var canDeath=inPlay&&PL.dead&&PL.deathWindow>0&&PL.spells>0;
  spellEl.classList.toggle('off',inPlay&&!canCast&&!canDeath);
 }
}

function onPadDown(el,fn){
 if(!el)return;
 el.addEventListener('pointerdown',function(e){
  e.preventDefault();e.stopPropagation();
  try{AudioSys.unlock();}catch(err){}
  G.idleT=0;
  try{el.setPointerCapture(e.pointerId);}catch(err){}
  fn(e);
 },{passive:false});
 el.addEventListener('contextmenu',function(e){e.preventDefault();});
}
function onPadUp(el,fn){
 if(!el)return;
 var types=['pointerup','pointercancel','lostpointercapture'];
 for(var i=0;i<types.length;i++)el.addEventListener(types[i],function(e){
  if(e.type!=='lostpointercapture'){e.preventDefault();e.stopPropagation();}
  fn(e);
 },{passive:false});
}

function stickMove(e){
 if(stickPtr===null||e.pointerId!==stickPtr)return;
 e.preventDefault();e.stopPropagation();
 var r=stickEl.getBoundingClientRect();
 var cx=r.width?r.left+r.width/2:padLayout.stickCx;
 var cy=r.height?r.top+r.height/2:padLayout.stickCy;
 var rad=r.width?r.width/2:(padLayout.stickR||48);
 TouchUI.setStickDelta(e.clientX-cx,e.clientY-cy,rad);
}

onPadDown(stickEl,function(e){
 if(stickPtr!==null)return;
 stickPtr=e.pointerId;
 TouchUI.stick.active=true;
 TouchUI.stick.next=0;
 stickMove(e);
});
if(stickEl)stickEl.addEventListener('pointermove',stickMove,{passive:false});
onPadUp(stickEl,function(e){
 if(stickPtr===null||e.pointerId!==stickPtr)return;
 stickPtr=null;
 TouchUI.resetStick();
});

onPadDown(fireEl,function(e){
 if(firePtr!==null)return;
 firePtr=e.pointerId;
 TouchUI.fireDown();
 if(fireEl&&fireEl.classList)fireEl.classList.add('press');
});
onPadUp(fireEl,function(e){
 if(firePtr===null||e.pointerId!==firePtr)return;
 firePtr=null;
 TouchUI.fireUp();
 if(fireEl&&fireEl.classList)fireEl.classList.remove('press');
});

onPadDown(bombEl,function(){
 pressBomb();
 if(bombEl&&bombEl.classList)bombEl.classList.add('press');
});
onPadUp(bombEl,function(){if(bombEl&&bombEl.classList)bombEl.classList.remove('press');});

onPadDown(spellEl,function(){
 pressSpell();
 if(spellEl&&spellEl.classList)spellEl.classList.add('press');
});
onPadUp(spellEl,function(){if(spellEl&&spellEl.classList)spellEl.classList.remove('press');});

onPadDown(focusEl,function(){
 pressFocus();
 if(focusEl&&focusEl.classList)focusEl.classList.add('press');
});
onPadUp(focusEl,function(){if(focusEl&&focusEl.classList)focusEl.classList.remove('press');});

onPadDown(pauseEl,function(){
 pressPause();
 if(pauseEl&&pauseEl.classList)pauseEl.classList.add('press');
});
onPadUp(pauseEl,function(){if(pauseEl&&pauseEl.classList)pauseEl.classList.remove('press');});

onPadDown(fullEl,function(){
 toggleFullscreen();
 if(fullEl&&fullEl.classList)fullEl.classList.add('press');
});
onPadUp(fullEl,function(){if(fullEl&&fullEl.classList)fullEl.classList.remove('press');});

cv.addEventListener('touchstart',function(e){
 e.preventDefault();
 try{AudioSys.unlock();}catch(err){}
 G.idleT=0;hideHint();
 if(Gdemo){try{endDemo();}catch(err){}return;}
 var list=e.changedTouches||[];
 for(var i=0;i<list.length;i++){
  var p=gamePos(list[i]);
  try{TouchUI.hit(p.x,p.y);}catch(err){console.error(err);}
 }
},{passive:false});
cv.addEventListener('touchmove',function(e){e.preventDefault();},{passive:false});
cv.addEventListener('touchend',function(e){e.preventDefault();},{passive:false});
cv.addEventListener('touchcancel',function(e){e.preventDefault();},{passive:false});
cv.addEventListener('contextmenu',function(e){e.preventDefault();});

var TouchPad={
 sync:syncPad,
 release:releasePad,
 fireDown:function(){TouchUI.fireDown();},
 fireUp:function(){TouchUI.fireUp();},
 bomb:pressBomb,
 spell:pressSpell,
 focus:pressFocus,
 pause:pressPause,
 stick:function(dx,dy,r){
  TouchUI.stick.active=true;
  TouchUI.stick.next=0;
  TouchUI.setStickDelta(dx,dy,r||48);
 },
 endStick:function(){TouchUI.resetStick();},
 fullscreen:toggleFullscreen,
 fit:fit
};
if(typeof window!=='undefined')window.TouchPad=TouchPad;
if(typeof globalThis!=='undefined')globalThis.TouchPad=TouchPad;

fit();
syncPad();
})();
