(function(){
"use strict";
/* ---- Responsive canvas scaling ---- */
var cv=document.getElementById('cv');
function fit(){
 var vw=window.innerWidth,vh=window.innerHeight;
 var s=Math.min(vw/640,vh/480);
 var w=Math.round(640*s),h=Math.round(480*s);
 cv.style.width=w+'px';
 cv.style.height=h+'px';
}
window.addEventListener('resize',fit,{passive:true});
window.addEventListener('orientationchange',function(){setTimeout(fit,200)});
fit();

/* ---- Orientation hint ---- */
var rotateEl=document.getElementById('rotate');
var rotateSkip=document.getElementById('rotateSkip');
if(rotateSkip)rotateSkip.addEventListener('click',function(e){
 e.preventDefault();e.stopPropagation();
 if(rotateEl)rotateEl.style.display='none';
});

/* ---- Touch controls ---- */
var hintEl=document.getElementById('hint');
function hideHint(){if(hintEl)hintEl.style.display='none';}
function gamePos(t){
 var r=cv.getBoundingClientRect();
 return {
  x:(t.clientX-r.left)/r.width*W,
  y:(t.clientY-r.top)/r.height*H
 };
}
function startMove(t,p){
 TouchUI.moveId=t.identifier;
 TouchUI.moveSX=p.x;TouchUI.moveSY=p.y;
}
function endMove(e){
 e.preventDefault();
 var list=e.changedTouches||[];
 for(var i=0;i<list.length;i++){
  if(list[i].identifier===TouchUI.moveId){TouchUI.moveId=null;break;}
 }
}

cv.addEventListener('touchstart',function(e){
 e.preventDefault();
 try{AudioSys.unlock();}catch(err){}
 G.idleT=0;hideHint();
 if(Gdemo){try{endDemo();}catch(err){}return;}
 if(G.screen==='play'){
  var list=e.changedTouches||[];
  for(var i=0;i<list.length;i++){
   var t=list[i],p=gamePos(t);
   var used=false;
   try{used=TouchUI.hit(p.x,p.y);}catch(err){console.error(err);}
   if(used||G.screen!=='play')continue;
   if(TouchUI.moveId===null&&!PL.dead&&G.freeze<=0)startMove(t,p);
  }
  return;
 }
 var t0=(e.changedTouches||[])[0];
 if(t0){
  var p0=gamePos(t0);
  try{TouchUI.hit(p0.x,p0.y);}catch(err){console.error(err);}
 }
},{passive:false});

cv.addEventListener('touchmove',function(e){
 e.preventDefault();
 if(G.screen!=='play'){TouchUI.moveId=null;return;}
 if(TouchUI.moveId===null||PL.dead||G.freeze>0)return;
 var list=e.changedTouches||[];
 for(var i=0;i<list.length;i++){
  var t=list[i];
  if(t.identifier!==TouchUI.moveId)continue;
  var p=gamePos(t);
  var mul=TouchUI.focus?0.58:1;
  PL.x=clamp(PL.x+(p.x-TouchUI.moveSX)*1.7*mul,12,W-12);
  PL.y=clamp(PL.y+(p.y-TouchUI.moveSY)*1.7*mul,12,H-12);
  TouchUI.moveSX=p.x;TouchUI.moveSY=p.y;
  break;
 }
},{passive:false});

cv.addEventListener('touchend',endMove,{passive:false});
cv.addEventListener('touchcancel',endMove,{passive:false});
cv.addEventListener('contextmenu',function(e){e.preventDefault();});
})();
