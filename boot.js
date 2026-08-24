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

/* ---- Touch controls ---- */
var _tAct=false,_tSX=0,_tSY=0,_tPX=0,_tPY=0,_lastBombTap=0;
cv.addEventListener('touchstart',function(e){
 e.preventDefault();
 try{AudioSys.unlock();}catch(err){}
 G.idleT=0;

 if(G.screen==='title'){sfx('ok');G.screen='diff';return;}
 if(G.screen==='diff'){G.screen='sel';return;}
 if(G.screen==='pause'){edge[90]=true;return;}
 if(G.screen!=='play'||Gdemo)return;

 /* Bottom 18% = bomb/spell action zone */
 var r=cv.getBoundingClientRect();
 var gx=(e.touches[0].clientX-r.left)/r.width*640;
 var gy=(e.touches[0].clientY-r.top)/r.height*480;
 if(gy>420){
  var now=Date.now();
  if(now-_lastBombTap<280){useFlashBomb();}
  else{useSpell();}
  _lastBombTap=now;return;
 }

 /* Movement zone */
 _tAct=true;_tSX=gx;_tSY=gy;_tPX=PL.x;_tPY=PL.y;
},{passive:false});

cv.addEventListener('touchmove',function(e){
 e.preventDefault();
 if(!_tAct||G.screen!=='play')return;
 var t=e.touches[0];var r=cv.getBoundingClientRect();
 var gx=(t.clientX-r.left)/r.width*640;
 var gy=(t.clientY-r.top)/r.height*480;
 PL.x=Math.max(12,Math.min(W-12,_tPX+(gx-_tSX)*1.7));
 PL.y=Math.max(12,Math.min(H-12,_tPY+(gy-_tSY)*1.7));
},{passive:false});

cv.addEventListener('touchend',function(e){e.preventDefault();_tAct=false;},{passive:false});
})();
