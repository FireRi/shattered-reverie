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
function ctrlAt(p){
 var C=TOUCH_CTRL;
 if(Math.hypot(p.x-C.fire.x,p.y-C.fire.y)<=C.fire.hit)return 'fire';
 if(Math.hypot(p.x-C.bomb.x,p.y-C.bomb.y)<=C.bomb.hit)return 'bomb';
 if(G.screen==='play'&&p.x<170&&p.y>330)return 'stick';
 if(Math.hypot(p.x-C.stick.x,p.y-C.stick.y)<=C.stick.hit)return 'stick';
 return '';
}
function pressBomb(){
 if(G.screen==='play')edge[KEY.X]=true;
 else edge[KEY.ESC]=true;
}
function endTouches(e){
 e.preventDefault();
 var list=e.changedTouches||[];
 for(var i=0;i<list.length;i++){
  var id=list[i].identifier;
  if(id===TouchUI.fireId){TouchUI.fireId=null;keys[KEY.Z]=false;}
  else if(id===TouchUI.bombId)TouchUI.bombId=null;
  else if(id===TouchUI.stick.id)TouchUI.resetStick();
 }
}

cv.addEventListener('touchstart',function(e){
 e.preventDefault();
 try{AudioSys.unlock();}catch(err){}
 G.idleT=0;hideHint();
 if(Gdemo){try{endDemo();}catch(err){}return;}
 var list=e.changedTouches||[],ctrl=TouchUI.visible();
 for(var i=0;i<list.length;i++){
  var t=list[i],p=gamePos(t),used=false;
  if(ctrl){
   var c=ctrlAt(p);
   if(c==='fire'){
    used=true;
    if(TouchUI.fireId===null){TouchUI.fireId=t.identifier;keys[KEY.Z]=true;edge[KEY.Z]=true;}
   }else if(c==='bomb'){
    used=true;
    if(TouchUI.bombId===null){TouchUI.bombId=t.identifier;pressBomb();}
   }else if(c==='stick'){
    used=true;
    if(!TouchUI.stick.active){
     TouchUI.stick.active=true;
     TouchUI.stick.id=t.identifier;
     TouchUI.setStick(p.x,p.y);
     TouchUI.stick.next=0;
    }
   }
  }
  if(!used){try{TouchUI.hit(p.x,p.y);}catch(err){console.error(err);}}
 }
},{passive:false});

cv.addEventListener('touchmove',function(e){
 e.preventDefault();
 var list=e.changedTouches||[];
 for(var i=0;i<list.length;i++){
  var t=list[i];
  if(t.identifier!==TouchUI.stick.id)continue;
  var p=gamePos(t);
  TouchUI.setStick(p.x,p.y);
  break;
 }
},{passive:false});

cv.addEventListener('touchend',endTouches,{passive:false});
cv.addEventListener('touchcancel',endTouches,{passive:false});
cv.addEventListener('contextmenu',function(e){e.preventDefault();});
})();
