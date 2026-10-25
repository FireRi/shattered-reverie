"use strict";
/* ================= DRAW ================= */
const _bulletSprCache=new Map();
const _bloomGradCache=new Map();
const BSPR_SIZE=96,BSPR_REF=10;
function bulletSprite(fam,bc,color,fxOn){
 const key=fam+'|'+bc+'|'+(fxOn?1:0);
 if(_bulletSprCache.has(key))return _bulletSprCache.get(key);
 let img=null,haloCol=color,elong=false,highlight=false;
 if(fam==='shadow'){img=ASSETS.th_shadowbullet;haloCol='#606070';elong=true;}
 else if(fam==='ball'){img=thImg('ball',bc);highlight=true;}
 else if(fam==='orb'){img=ASSETS['orb_'+TH_COLOR[bc]];}
 else if(fam==='rice'||fam==='ah'){img=thImg(fam,bc);elong=true;}
 if(!img||typeof document==='undefined')return null;
 const cv=document.createElement('canvas');cv.width=cv.height=BSPR_SIZE;
 const cc=cv.getContext('2d'),C=BSPR_SIZE/2,R=BSPR_REF;
 const halo=fxOn?tinted('gen_glow',haloCol):null;
 if(halo){cc.globalAlpha=fam==='shadow'?.3:.5;cc.drawImage(halo,C-R*2,C-R*2,R*4,R*4);cc.globalAlpha=1;}
 if(elong){
  cc.drawImage(img,C-R*1.15,C-R*1.7,R*2.3,R*3.4);
 }else{
  cc.drawImage(img,C-R*1.3,C-R*1.3,R*2.6,R*2.6);
  if(highlight){
   cc.globalCompositeOperation='lighter';cc.fillStyle='#fff';
   cc.beginPath();cc.arc(C-R*.15,C-R*.15,R*.42,0,TAU);cc.fill();
   cc.globalCompositeOperation='source-over';
  }
 }
 _bulletSprCache.set(key,cv);
 return cv;
}
const _procSprCache=new Map();
function proceduralSprite(g,bc,col,fxOn){
 const key=g+'|'+bc+'|'+(fxOn?1:0);
 if(_procSprCache.has(key))return _procSprCache.get(key);
 if(typeof document==='undefined')return null;
 const cv=document.createElement('canvas');cv.width=cv.height=BSPR_SIZE;
 const cc=cv.getContext('2d'),C=BSPR_SIZE/2,R=BSPR_REF;
 const halo=fxOn?tinted('gen_glow',col[0]):null;
 if(halo){cc.globalCompositeOperation='lighter';cc.globalAlpha=.5;
  cc.drawImage(halo,C-R*2.2,C-R*2.2,R*4.4,R*4.4);
  cc.globalCompositeOperation='source-over';cc.globalAlpha=1;}
 if(g==='ball'){
  cc.globalAlpha=.28;cc.fillStyle=col[0];cc.beginPath();cc.arc(C,C,R*1.6,0,TAU);cc.fill();
  cc.globalAlpha=1;cc.fillStyle=col[0];cc.beginPath();cc.arc(C,C,R,0,TAU);cc.fill();
  cc.strokeStyle=col[1];cc.lineWidth=1.5;cc.beginPath();cc.arc(C,C,R,0,TAU);cc.stroke();
 }else if(g==='orb'){
  const gr=cc.createRadialGradient(C,C,1,C,C,R);
  gr.addColorStop(0,'#fff');gr.addColorStop(.35,col[0]);gr.addColorStop(1,'rgba(0,0,0,0)');
  cc.fillStyle=gr;cc.beginPath();cc.arc(C,C,R,0,TAU);cc.fill();
  cc.strokeStyle=col[1];cc.lineWidth=2;cc.beginPath();cc.arc(C,C,R*.62,0,TAU);cc.stroke();
 }else if(g==='star'){
  cc.fillStyle=col[0];cc.strokeStyle=col[1];cc.lineWidth=1;
  cc.beginPath();
  for(let i=0;i<10;i++){const rr=i%2?R*.45:R;const a=i/10*TAU-Math.PI/2;
   cc[i?'lineTo':'moveTo'](C+Math.cos(a)*rr,C+Math.sin(a)*rr);}
  cc.closePath();cc.fill();cc.stroke();
  cc.globalCompositeOperation='lighter';cc.fillStyle='#fff';
  cc.beginPath();cc.arc(C-R*.15,C-R*.15,R*.3,0,TAU);cc.fill();
  cc.globalCompositeOperation='source-over';
 }else if(g==='bubble'){
  cc.globalAlpha=.26;cc.fillStyle=col[0];cc.beginPath();cc.arc(C,C,R,0,TAU);cc.fill();
  cc.globalAlpha=1;cc.strokeStyle=col[1];cc.lineWidth=2;cc.beginPath();cc.arc(C,C,R,0,TAU);cc.stroke();
  cc.strokeStyle='rgba(255,255,255,.5)';cc.lineWidth=1;cc.beginPath();cc.arc(C,C,R*.7,0,TAU);cc.stroke();
  cc.fillStyle='rgba(255,255,255,.85)';cc.beginPath();cc.arc(C-R*.32,C-R*.34,R*.17,0,TAU);cc.fill();
 }else return null;
 _procSprCache.set(key,cv);
 return cv;
}
function drawBullet(b){
 const c=COL[b.c]||COL.white,fxOn=perfLevel>0;
 const grow=Math.min(1,.35+b.t*.16);
 const angD=Math.atan2(b.vy,b.vx)*180/Math.PI;
 const fam=b.g==='ball'?(b.c==='black'&&ASSETS.th_shadowbullet?'shadow':(thImg('ball',b.c)?'ball':null)):b.g==='rice'?(thImg('rice',b.c)?'rice':null):b.g==='kunai'?(thImg('ah',b.c)?'ah':null):b.g==='orb'?((ASSETS['orb_'+TH_COLOR[b.c]])?'orb':null):null;
 if(fam){
  const spr=bulletSprite(fam,b.c,c[0],fxOn);
  if(spr){
   const r=(b.r||5)*grow*1.25,sc=r/BSPR_REF;
   cx.save();cx.translate(b.x,b.y);
   cx.globalAlpha=(b.alpha??1);
   if(fam!=='ball'&&fam!=='orb')cx.rotate(Math.atan2(b.vy,b.vx)+Math.PI/2);
   cx.drawImage(spr,-BSPR_SIZE*sc/2,-BSPR_SIZE*sc/2,BSPR_SIZE*sc,BSPR_SIZE*sc);
   cx.restore();
   return;
  }
 }
 if(b.g==='ball'||b.g==='orb'||b.g==='star'||b.g==='bubble'){
  const pspr=proceduralSprite(b.g,b.c,c,fxOn);
  if(pspr){
   const base=b.g==='star'?(b.r||7):b.g==='bubble'?(b.r||14):(b.r||5);
   const growF=b.g==='star'?1:grow;
   const mul=b.g==='bubble'?1.15:1;
   const sc=base*growF*mul/BSPR_REF;
   cx.save();cx.translate(b.x,b.y);
   if(b.alpha<1)cx.globalAlpha=b.alpha;
   if(b.g==='star')cx.rotate(b.spin||0);
   cx.drawImage(pspr,-BSPR_SIZE*sc/2,-BSPR_SIZE*sc/2,BSPR_SIZE*sc,BSPR_SIZE*sc);
   cx.restore();
   return;
  }
 }
 if(b.g==='bubble'){
  const size=b.r*grow*1.15;
  const halo=tinted('gen_glow',c[0]);
  cx.save();cx.translate(b.x,b.y);
  if(halo&&fxOn){cx.globalCompositeOperation='lighter';
   cx.globalAlpha=(b.alpha??1)*.3;cx.drawImage(halo,-size*1.6,-size*1.6,size*3.2,size*3.2);
   cx.globalCompositeOperation='source-over';}
  cx.globalAlpha=(b.alpha??1)*.26;
  cx.fillStyle=c[0];cx.beginPath();cx.arc(0,0,size,0,TAU);cx.fill();
  cx.globalAlpha=b.alpha??1;
  cx.strokeStyle=c[1];cx.lineWidth=2;
  cx.beginPath();cx.arc(0,0,size,0,TAU);cx.stroke();
  cx.strokeStyle='rgba(255,255,255,.5)';cx.lineWidth=1;
  cx.beginPath();cx.arc(0,0,size*.7,0,TAU);cx.stroke();
  cx.fillStyle='rgba(255,255,255,.85)';
  cx.beginPath();cx.arc(-size*.32,-size*.34,size*.17,0,TAU);cx.fill();
  cx.restore();
  return;
 }
 if(b.g==='crystal'&&ASSETS['th_jellybean'+(TH_COLOR[b.c]||'')]){
  const img=ASSETS['th_jellybean'+TH_COLOR[b.c]];
  const r=(b.r||5)*grow;
  cx.save();cx.translate(b.x,b.y);cx.rotate((Math.atan2(b.vy,b.vx)+Math.PI/2));
  cx.drawImage(img,-r*1.2,-r*1.5,r*2.4,r*3);
  cx.restore();
  return;
 }
 if(b.g==='flower'){
  const r=(b.r||6)*grow*1.3;
  const fl=tinted('th_sunflower',c[0])||tinted('th_purpleflower',c[0]);
  cx.save();cx.translate(b.x,b.y);cx.rotate(Math.atan2(b.vy,b.vx)+performance.now()/900);
  if(fl){cx.globalAlpha=(b.alpha??1)*.95;cx.drawImage(fl,-r*1.2,-r*1.2,r*2.4,r*2.4);}
  cx.globalCompositeOperation='lighter';cx.fillStyle='#fff';cx.beginPath();cx.arc(0,0,r*.28,0,TAU);cx.fill();
  cx.restore();
  return;
 }
 if(b.g==='feather'&&ASSETS.th_feather){
  const r=(b.r||4)*grow;
  cx.save();cx.translate(b.x,b.y);cx.rotate(Math.atan2(b.vy,b.vx)+Math.PI/4);
  cx.globalAlpha=(b.alpha??1)*.9;
  cx.drawImage(ASSETS.th_feather,-r*1.1,-r*2.2,r*2.2,r*4.4);
  cx.restore();
  return;
 }
 if((b.g==='ball'||b.g==='orb'||b.g==='star'||b.g==='crystal')&&ASSETS.gen_glow&&ASSETS.gen_disc){
  const r=(b.r||5)*grow*1.15;
  const halo=tinted('gen_glow',c[0]);
  const disc=tinted('gen_disc',c[0]);
  if(halo&&disc){
   cx.save();cx.translate(b.x,b.y);
   cx.globalAlpha=(b.alpha??1)*.55;
   cx.drawImage(halo,-r*2.6,-r*2.6,r*5.2,r*5.2);
   cx.globalAlpha=(b.alpha??1);
   cx.drawImage(disc,-r*1.35,-r*1.35,r*2.7,r*2.7);
   cx.globalCompositeOperation='lighter';
   cx.fillStyle='#fff';
   cx.beginPath();cx.arc(-r*.18,-r*.18,r*(b.g==='orb'?.62:.42),0,TAU);cx.fill();
   if(b.g==='star'){
    const stImg=tinted('th_staryellow',c[0])||disc;
    const rot=(Math.atan2(b.vy,b.vx)+performance.now()/600);
    cx.rotate(rot);cx.globalAlpha=(b.alpha??1)*.9;
    cx.drawImage(stImg,-r*.95,-r*.95,r*1.9,r*1.9);
   }else if(b.g==='crystal'){
    const tw=tinted('twirl_01',c[1]||'#fff');
    cx.rotate(performance.now()/600);cx.globalAlpha=(b.alpha??1)*.85;
    if(tw)cx.drawImage(tw,-r*1.05,-r*1.05,r*2.1,r*2.1);
   }
   cx.restore();
   return;
  }
 }
 if((b.g==='rice'||b.g==='kunai')&&ASSETS.trace_02){
  const r=(b.r||4)*grow;
  const img=b.g==='kunai'?tinted('trace_06',c[0]):tinted('trace_02',c[0]);
  const glow=tinted('gen_glow',c[0]);
  if(img){
   const aD=Math.atan2(b.vy,b.vx)*180/Math.PI+90;
   cx.save();cx.translate(b.x,b.y);cx.rotate(aD*Math.PI/180);
   if(glow&&fxOn){cx.globalAlpha=(b.alpha??1)*.45;cx.drawImage(glow,-r*2.2,-r*2.2,r*4.4,r*4.4);}
   cx.globalAlpha=(b.alpha??1);
   cx.drawImage(img,-r*1.1,-r*2.6,r*2.2,r*5.2);
   cx.restore();
   return;
  }
 }
 if(b.g==='amulet'&&(ASSETS.seal_red||ASSETS.seal_blue||ASSETS.seal_green)){
  const r=(b.r||5)*grow;
  const cn=COL[b.c]?b.c:'white';
  const sym=cn==='red'||cn==='pink'||cn==='orange'?ASSETS.seal_red:(cn==='blue'||cn==='dblue'||cn==='teal'||cn==='cyan'?ASSETS.seal_blue:ASSETS.seal_green);
  const glow=tinted('gen_glow',c[0]);
  if(sym){
   cx.save();cx.translate(b.x,b.y);cx.rotate(angD*Math.PI/180+Math.PI/2);
   if(glow&&fxOn){cx.globalAlpha=(b.alpha??1)*.4;cx.drawImage(glow,-r*2,-r*2,r*4,r*4);}
   cx.globalAlpha=(b.alpha??1);
   cx.drawImage(sym,-r*1.3,-r*1.3,r*2.6,r*2.6);
   cx.restore();
   return;
  }
 }
 cx.save();cx.translate(b.x,b.y);
 if(b.alpha<1)cx.globalAlpha=b.alpha;
 switch(b.g){
  case 'rice':cx.rotate(angD*Math.PI/180);
   glowEllipse(0,0,8,3,c);break;
  case 'kunai':cx.rotate(angD*Math.PI/180);
   cx.fillStyle=c[0];cx.beginPath();cx.moveTo(9,0);cx.lineTo(-3,3.4);cx.lineTo(-7,0);cx.lineTo(-3,-3.4);cx.closePath();cx.fill();
   cx.strokeStyle=c[1];cx.lineWidth=1;cx.stroke();break;
  case 'bubble':{const r=b.r||14;
   cx.fillStyle=c[0]+'44';cx.beginPath();cx.arc(0,0,r,0,TAU);cx.fill();
   cx.strokeStyle=c[1];cx.lineWidth=2.5;cx.beginPath();cx.arc(0,0,r,0,TAU);cx.stroke();
   cx.fillStyle='#ffffffaa';cx.beginPath();cx.arc(-r*.3,-r*.3,r*.22,0,TAU);cx.fill();break;}
  case 'star':cx.rotate(b.spin||0);drawStar(0,0,b.r||7,5,c);break;
  case 'crystal':cx.rotate(angD*Math.PI/180);cx.fillStyle=c[0];
   cx.beginPath();cx.moveTo(b.r||6,0);cx.lineTo(0,(b.r||6)*.6);cx.lineTo(-(b.r||6),0);cx.lineTo(0,-(b.r||6)*.6);cx.closePath();cx.fill();
   cx.strokeStyle=c[1];cx.lineWidth=1;cx.stroke();break;
  case 'orb':{const r=b.r||12;const g=cx.createRadialGradient(0,0,1,0,0,r);
   g.addColorStop(0,'#fff');g.addColorStop(.35,c[0]);g.addColorStop(1,'rgba(0,0,0,0)');
   cx.fillStyle=g;cx.beginPath();cx.arc(0,0,r,0,TAU);cx.fill();
   cx.strokeStyle=c[1];cx.lineWidth=2;cx.beginPath();cx.arc(0,0,r*.62,0,TAU);cx.stroke();break;}
  case 'amulet':{const r=b.r||5;cx.rotate(angD*Math.PI/180);
   cx.fillStyle=c[0];cx.fillRect(-r,-r*1.6,r*2,r*3.2);
   cx.strokeStyle=c[1];cx.lineWidth=1.4;cx.strokeRect(-r,-r*1.6,r*2,r*3.2);break;}
  default:{const r=(b.r||5)*grow;const ga=cx.globalAlpha;
   cx.globalAlpha=ga*.28;cx.fillStyle=c[0];
   cx.beginPath();cx.arc(0,0,r*1.6,0,TAU);cx.fill();
   cx.globalAlpha=ga;cx.fillStyle=c[0];
   cx.beginPath();cx.arc(0,0,r,0,TAU);cx.fill();
   cx.strokeStyle=c[1];cx.lineWidth=1.5;
   cx.beginPath();cx.arc(0,0,r,0,TAU);cx.stroke();}
 }
   cx.restore();
}
function glowEllipse(x,y,rx,ry,c){cx.fillStyle=c[0];cx.beginPath();cx.ellipse(x,y,rx,ry,0,0,TAU);cx.fill();cx.strokeStyle=c[1];cx.lineWidth=1;cx.stroke();}
function drawStar(x,y,r,n,c){cx.fillStyle=c[0];cx.beginPath();for(let i=0;i<n*2;i++){const rr=i%2?r*.45:r;const a=i/(n*2)*TAU-Math.PI/2;cx[i?'lineTo':'moveTo'](x+Math.cos(a)*rr,y+Math.sin(a)*rr);}cx.closePath();cx.fill();cx.strokeStyle=c[1];cx.lineWidth=1;cx.stroke();}
function drawSpellBG(){
 if(!BOSS||!BOSS.def||!BOSS.spellActive||BOSS.dying)return;
 const t=performance.now();
 const spellBg=ASSETS[BOSS.def.spellBg];
 if(spellBg){
  cx.save();
  cx.globalAlpha=.34+.06*(G.beat||0);
  cx.drawImage(spellBg,0,0,W,H);
  cx.fillStyle='rgba(5,5,14,.42)';
  cx.fillRect(0,0,W,H);
  cx.restore();
 }
 const wave=tinted('gen_seigaiha',BOSS.col[0]);
 if(wave&&perfLevel>0){
  const tw=128,tOff=(t/40)%tw;
  cx.save();cx.globalCompositeOperation='lighter';
  cx.globalAlpha=.05+.04*(G.beat||0);
  for(let ty=-1;ty<4;ty++)for(let tx=-1;tx<6;tx++)
   cx.drawImage(wave,tx*tw+tOff*2-64,ty*tw+((t/60)%tw)-64,tw,tw);
  cx.restore();
 }
}
function drawMagicCircleFloor(x,y){
 const t=performance.now();
 cx.save();
 cx.translate(x,y);
 const ring=tinted('gen_ring',BOSS?BOSS.col[0]:'#8cf');
 if(ring){
  cx.save();
  cx.globalCompositeOperation='lighter';
  cx.globalAlpha=.22+.1*(G.beat||0);
  const rr=150+18*Math.sin(t/700);
  cx.drawImage(ring,-rr,-rr,rr*2,rr*2);
  cx.globalAlpha=.16;
  cx.drawImage(tinted('gen_disc','#ffffff'),-96,-96,192,192);
  cx.restore();
 }
 cx.globalCompositeOperation='lighter';
 cx.strokeStyle='rgba(255,255,255,.14)';
 for(let ring=0;ring<3;ring++){
  const r=70+ring*38,dir=ring%2?-1:1;
  cx.save();cx.rotate(t/2600*dir+ring);
  cx.lineWidth=2;cx.beginPath();cx.arc(0,0,r,0,TAU);cx.stroke();
  cx.setLineDash([10,14]);cx.lineWidth=1;
  cx.beginPath();cx.arc(0,0,r-8,t/900,r/700+t);cx.stroke();
  cx.setLineDash([]);
  const n=6;
  cx.beginPath();
  for(let i=0;i<=n;i++){const a=i/n*TAU;cx[i?'lineTo':'moveTo'](Math.cos(a)*(r-22),Math.sin(a)*(r-22));}
  cx.stroke();
  cx.restore();
 }
 for(let p=0;p<6;p++){
  const a=t/1800+p*TAU/6;
  cx.fillStyle='rgba(255,255,255,.05)';
  cx.beginPath();cx.arc(Math.cos(a)*104,Math.sin(a)*104,7,0,TAU);cx.fill();
 }
 cx.restore();
}
function drawPlayer(p=PL){
 if(p.dead)return;
 const blink=p.inv>0&&Math.floor(p.inv/3)%2===0;
 const cd=(typeof charaDef==='function')?charaDef(p.chara):null;
 const accent=p===P2?'#ff70c0':(cd?cd.accent:'#5af');
 const outline=p===P2?'#ffb0d8':(cd?cd.outline:'#aabbee');
 const body=cd?cd.color:'#5af';
 if(p.shooting&&G.frame%2===0){
  for(const o of p.opts)if(o&&fx.length<300)
   fx.push({t:'trail',x:o.x+vrnd(-2,2),y:o.y+vrnd(-1,3),c:p===P2?'#ffb7e0':'#9cf',life:9,max:9});
 }
 if(G.frame%5===0&&fx.length<280)fxSpr('gen_glow',p.x+vrnd(-3,3),p.y+14,.22,.35,-.15);
 cx.save();cx.translate(p.x,p.y);
 cx.rotate((p.tilt||0)*.28);
 if(G.trance>0){
  cx.save();cx.globalCompositeOperation='lighter';
  const ta=.35+.2*Math.sin(G.frame/3);
  cx.strokeStyle=`rgba(120,200,255,${ta})`;cx.lineWidth=2;
  cx.beginPath();cx.arc(0,0,20+3*Math.sin(G.frame/4),0,TAU);cx.stroke();
  cx.beginPath();cx.arc(0,0,27+5*Math.sin(G.frame/5+2),0,TAU);cx.stroke();
  cx.restore();
 }
 if(blink)cx.globalAlpha=.4;
 for(const o of p.opts){
  if(!o)continue;
  cx.save();cx.translate(o.x-p.x,o.y-p.y);
  const t=performance.now();
  cx.globalCompositeOperation='lighter';
  const halo=tinted('gen_glow',p===P2?'#ff9fd4':(cd?cd.accent:'#7fdfff'));
  if(halo&&perfLevel>0){cx.globalAlpha=.85;cx.drawImage(halo,-14,-14,28,28);}
  cx.globalAlpha=1;
  cx.fillStyle='#eef6ff';
  cx.beginPath();cx.arc(0,0,4.6+0.6*Math.sin(t/180),0,TAU);cx.fill();
  cx.strokeStyle=p===P2?'rgba(255,170,220,.85)':'rgba(140,210,255,.85)';cx.lineWidth=1.6;
  cx.beginPath();cx.arc(0,0,8.5,t/300,t/300+4.6);cx.stroke();
  cx.globalCompositeOperation='source-over';
  cx.restore();
 }
 cx.rotate((p.face||1)>0?0:0);
 cx.fillStyle='#22242e';
 cx.beginPath();cx.moveTo(0,-16);cx.lineTo(11,10);cx.lineTo(0,5);cx.lineTo(-11,10);cx.closePath();cx.fill();
 cx.strokeStyle=outline;cx.lineWidth=1.6;cx.stroke();
 cx.fillStyle='#eef4ff';cx.beginPath();cx.moveTo(0,-13);cx.lineTo(6,7);cx.lineTo(0,3);cx.lineTo(-6,7);cx.closePath();cx.fill();
 cx.fillStyle=body;cx.globalAlpha=.85;cx.fillRect(-1.3,-10,2.6,10);cx.globalAlpha=1;
 cx.fillStyle=accent;cx.beginPath();cx.arc(0,-4,2.4,0,TAU);cx.fill();
 cx.restore();
 if(p.focus){
  cx.save();cx.translate(p.x,p.y);cx.rotate(performance.now()/500);
  cx.strokeStyle='rgba(255,255,255,.9)';cx.lineWidth=1.4;
  cx.beginPath();for(let i=0;i<=4;i++){const a=i/4*TAU;cx[i?'lineTo':'moveTo'](Math.cos(a)*5,Math.sin(a)*5);}cx.stroke();
  cx.strokeStyle=p===P2?'rgba(255,150,210,.7)':'rgba(120,200,255,.7)';
  cx.beginPath();cx.arc(0,0,9,0,TAU);cx.stroke();cx.restore();
 }
}
function drawPShot(b){
 const own=b.own===1;
 const col=b.col||'#9cf';
 const rim=own?'rgba(255,120,200,.5)':'rgba(140,220,255,.45)';
 cx.save();cx.translate(b.x,b.y);
 cx.rotate(Math.atan2(b.vy,b.vx)+Math.PI/2);
 switch(b.type){
  case 'homing':
   cx.globalCompositeOperation='lighter';cx.fillStyle=rim;cx.fillRect(-3,-2,6,12);
   cx.fillStyle='#dff6ff';cx.beginPath();cx.moveTo(0,-7);cx.lineTo(3.2,2);cx.lineTo(0,5);cx.lineTo(-3.2,2);cx.closePath();cx.fill();
   cx.globalCompositeOperation='source-over';cx.strokeStyle=col;cx.lineWidth=1;cx.beginPath();cx.moveTo(0,-7);cx.lineTo(0,5);cx.stroke();
   break;
  case 'amulet':
   cx.globalCompositeOperation='lighter';cx.fillStyle=rim;cx.beginPath();cx.arc(0,0,7,0,TAU);cx.fill();
   cx.save();cx.rotate(b.t*.22);cx.fillStyle=col;cx.beginPath();cx.moveTo(0,-6);cx.lineTo(4.4,0);cx.lineTo(0,6);cx.lineTo(-4.4,0);cx.closePath();cx.fill();cx.restore();
   cx.globalCompositeOperation='source-over';cx.strokeStyle='#fff';cx.lineWidth=1;cx.beginPath();cx.moveTo(0,-6);cx.lineTo(0,6);cx.stroke();
   break;
  case 'needle':
   cx.globalCompositeOperation='lighter';cx.strokeStyle=rim;cx.lineWidth=3.2;cx.lineCap='round';cx.beginPath();cx.moveTo(0,-11);cx.lineTo(0,8);cx.stroke();
   cx.strokeStyle=col;cx.lineWidth=1.4;cx.beginPath();cx.moveTo(0,-11);cx.lineTo(0,8);cx.stroke();cx.lineCap='butt';cx.globalCompositeOperation='source-over';
   break;
  case 'lance':{
   const l=b.pierce>0?24:17;
   cx.globalCompositeOperation='lighter';cx.fillStyle=rim;cx.fillRect(-3.2,-l*.55,6.4,l);
   cx.fillStyle=col;cx.fillRect(-1.7,-l,3.4,l*1.55);
   cx.fillStyle='#fff';cx.fillRect(-.8,-l*1.2,1.6,l*1.75);cx.globalCompositeOperation='source-over';
   break;}
  case 'scatter':
   cx.globalCompositeOperation='lighter';cx.fillStyle=rim;cx.beginPath();cx.arc(0,0,7,0,TAU);cx.fill();
   cx.fillStyle=col;cx.beginPath();cx.arc(0,0,4,0,TAU);cx.fill();
   cx.fillStyle='#fff';cx.beginPath();cx.arc(0,0,1.8,0,TAU);cx.fill();cx.globalCompositeOperation='source-over';
   break;
  case 'knife':
   cx.globalCompositeOperation='lighter';cx.fillStyle=rim;cx.beginPath();cx.moveTo(0,-10);cx.lineTo(5,6);cx.lineTo(0,3);cx.lineTo(-5,6);cx.closePath();cx.fill();
   cx.fillStyle=col;cx.beginPath();cx.moveTo(0,-8);cx.lineTo(3.2,5);cx.lineTo(0,2.4);cx.lineTo(-3.2,5);cx.closePath();cx.fill();
   cx.globalCompositeOperation='source-over';cx.strokeStyle='#fff';cx.lineWidth=.9;cx.beginPath();cx.moveTo(0,-8);cx.lineTo(0,5);cx.stroke();
   break;
  case 'missile':
   cx.globalCompositeOperation='lighter';cx.fillStyle=rim;cx.fillRect(-4,-4,8,14);
   cx.fillStyle=col;cx.beginPath();cx.moveTo(0,-9);cx.lineTo(4.5,-1);cx.lineTo(4.5,7);cx.lineTo(-4.5,7);cx.lineTo(-4.5,-1);cx.closePath();cx.fill();
   cx.fillStyle='#ffe';cx.fillRect(-1.6,-11,3.2,4);cx.globalCompositeOperation='source-over';
   break;
  default:
   cx.globalCompositeOperation='lighter';cx.strokeStyle=rim;cx.lineWidth=4.5;cx.lineCap='round';cx.beginPath();cx.moveTo(0,-9);cx.lineTo(0,7);cx.stroke();
   cx.strokeStyle=col;cx.lineWidth=2;cx.beginPath();cx.moveTo(0,-9);cx.lineTo(0,7);cx.stroke();cx.lineCap='butt';cx.globalCompositeOperation='source-over';
 }
 cx.restore();
}
function drawEntities(){
 for(const L of elasers){
  if(L.state===0){const p=L.t/L.warm;
   cx.save();cx.globalAlpha=.25+p*.35;cx.strokeStyle=L.col||'#f66';cx.lineWidth=2;
   cx.beginPath();cx.moveTo(L.x,L.y);cx.lineTo(L.x+Math.cos(L.ang*Math.PI/180)*L.len,L.y+Math.sin(L.ang*Math.PI/180)*L.len);cx.stroke();cx.restore();}
  else if(L.state===1){cx.save();cx.globalAlpha=.7;cx.strokeStyle='#fff';cx.lineWidth=L.wid*L.t/8;
   cx.beginPath();cx.moveTo(L.x,L.y);cx.lineTo(L.x+Math.cos(L.ang*Math.PI/180)*L.len,L.y+Math.sin(L.ang*Math.PI/180)*L.len);cx.stroke();cx.restore();}
  else{const fade=L.t>L.dur-10?(L.dur-L.t)/10:1;
   cx.save();cx.globalAlpha=fade;const w=L.wid*(L.t<6?L.t/6:1);
   if(L.grad){cx.strokeStyle=L.grad;}
   else{cx.strokeStyle=L.col||'#f66';}
   cx.lineWidth=w;cx.lineCap='round';
   cx.beginPath();cx.moveTo(L.x1,L.y1);cx.lineTo(L.x2!==undefined?L.x2:L.x1,L.y2!==undefined?L.y2:L.y1);cx.stroke();
   if(isFinite(L.x2)){
    cx.strokeStyle='#fff';cx.lineWidth=Math.max(2,w*.3);cx.stroke();
   }
   cx.restore();cx.lineCap='butt';}
 }
 drawMobs();
 for(const b of eshots){
  if(b.x<-30||b.x>W+30||b.y<-30||b.y>H+30)continue;
  drawBullet(b);
 }
  for(const b of pshots)drawPShot(b);
 cx.fillStyle='#fff';cx.font='bold 8px monospace';cx.textAlign='center';cx.textBaseline='middle';
 for(const it of items){
  if(it.x<-14||it.x>W+14||it.y<-16||it.y>H+16)continue;
  cx.save();cx.translate(it.x,it.y);
  if(it.ground&&it.life<120&&Math.floor(G.frame/5)%2===0)cx.globalAlpha=.35;
  const spr={P:'item_P',B:'item_B',L:'item_L',S:'item_S'}[it.t];
  if(ASSETS[spr]){
   const s=15+2*Math.sin(G.frame/9);
   cx.drawImage(ASSETS[spr],-s/2,-s/2,s,s);
  }else{
   const c=IT[it.t];cx.fillStyle=c;
   if(it.t==='P'||it.t==='L'){cx.beginPath();cx.moveTo(0,-7);cx.lineTo(6,0);cx.lineTo(0,7);cx.lineTo(-6,0);cx.closePath();cx.fill();}
   else cx.fillRect(-5,-5,10,10);
  }
  cx.fillStyle='#fff';cx.strokeStyle='rgba(0,0,0,.75)';cx.lineWidth=2;
  cx.font='bold 8px monospace';cx.textAlign='center';cx.textBaseline='middle';
  cx.strokeText(it.t,0,.5);cx.fillText(it.t,0,.5);
  cx.restore();
 }
 for(const p of players)drawPlayer(p);
 for(const f of fx)drawFx(f);
 for(const t of ftext){
  const p=t.life/t.max;
  const popIn=Math.min(1,(1-p)*6+.4);
  cx.save();
  cx.translate(t.x,t.y);
  cx.scale(popIn,popIn);
  cx.globalAlpha=clamp(p*2,0,1);cx.fillStyle=t.c;
  cx.font=`bold ${t.sz}px monospace`;cx.textAlign='center';
  cx.fillText(t.s,0,0);cx.restore();
 }
}
function drawFx(f){
 const p=f.life/f.max;
 cx.save();
 if(f.t==='ring'){cx.globalAlpha=p;cx.strokeStyle=f.c;cx.lineWidth=f.w*p+1;
  cx.beginPath();cx.arc(f.x,f.y,lerp(f.r1,f.r0,p),0,TAU);cx.stroke();}
 else if(f.t==='p'){cx.globalAlpha=p;cx.fillStyle=f.c;cx.fillRect(f.x-2,f.y-2,4,4);}
 else if(f.t==='spark'){cx.globalAlpha=p;cx.fillStyle=f.c;cx.beginPath();cx.arc(f.x,f.y,3+6*(1-p),0,TAU);cx.fill();}
 else if(f.t==='shard'){cx.globalAlpha=p;cx.strokeStyle='#9cf';cx.lineWidth=1.6;
  cx.beginPath();cx.moveTo(f.x,f.y);cx.lineTo(f.x+Math.cos(f.ang)*7,f.y+Math.sin(f.ang)*7);cx.stroke();}
 else if(f.t==='trail'){cx.globalAlpha=p*.5;cx.fillStyle=f.c||'#8af';cx.beginPath();cx.arc(f.x,f.y,2.4*(p)+0.6,0,TAU);cx.fill();}
 else if(f.t==='puff'){
  cx.globalAlpha=p*.4;cx.fillStyle='#c8ccd8';
  cx.beginPath();cx.arc(f.x,f.y,(1-p)*26*f.sc+6,0,TAU);cx.fill();
  cx.globalAlpha=p*.25;cx.fillStyle='#fff';
  cx.beginPath();cx.arc(f.x-f.sc*3,f.y-f.sc*2,(1-p)*14*f.sc+3,0,TAU);cx.fill();}
 else if(f.t==='crescent'){
  cx.save();cx.translate(f.x,f.y);cx.rotate(f.ang);
  cx.globalCompositeOperation='lighter';
  cx.globalAlpha=p;
  const R=70*f.scale;
  cx.strokeStyle='#fff';cx.lineWidth=10*f.scale*p+2;
  cx.beginPath();cx.arc(0,0,R,-.55,.55);cx.stroke();
  cx.strokeStyle='#9cf';cx.lineWidth=4*f.scale*p+1;
  cx.beginPath();cx.arc(0,0,R*.86,-.5,.5);cx.stroke();
  cx.globalCompositeOperation='source-over';
  cx.restore();}
 else if(f.t==='spr'){
  const img=ASSETS[f.img];
  if(img){
   cx.globalCompositeOperation='lighter';
   cx.save();cx.translate(f.x,f.y);cx.rotate(f.rot||0);
   const sc=f.sc*(1.7-p*.7);
   cx.globalAlpha=p*(f.al||0.85);
   cx.drawImage(img,-32*sc,-32*sc,64*sc,64*sc);
   cx.restore();
   cx.globalCompositeOperation='source-over';
  }
 }
 else if(f.t==='cross'){
  const gr=1-p;cx.globalCompositeOperation='lighter';
  cx.globalAlpha=p;cx.fillStyle='#fff';
  cx.fillRect(f.x-14*gr*8,f.y-3,W,6*gr+2);
  cx.save();cx.translate(f.x,f.y);cx.rotate(Math.PI/2);cx.fillRect(-14*gr*8,-3,W,6*gr+2);cx.restore();
  cx.globalCompositeOperation='source-over';}
 else if(f.t==='monochrome'){
  const mx=PL.dead?PL.rebirthX||f.x:PL.x,my=PL.dead?PL.rebirthY||f.y:PL.y;
  cx.globalCompositeOperation='lighter';cx.globalAlpha=.5*p+.2;
  cx.strokeStyle='#fff';cx.lineWidth=3;
  cx.beginPath();cx.moveTo(mx,my);cx.lineTo(mx,-H);cx.stroke();
  cx.globalAlpha=p*.4;cx.fillStyle='#fff';
  cx.beginPath();cx.arc(mx,my,(1-p)*300+40,0,TAU);cx.fill();
  cx.globalCompositeOperation='source-over';}
 else if(f.t==='beam'){
  cx.globalCompositeOperation='lighter';cx.globalAlpha=p*(f.hit?.9:.4);
  cx.fillStyle=f.hit?'#bff6ff':'#9ac';
  cx.fillRect(f.x-f.w/2,0,f.w,f.y);
  cx.fillStyle='#fff';cx.fillRect(f.x-f.w/6,0,f.w/3,f.y);
  cx.globalCompositeOperation='source-over';}
 else if(f.t==='dice'){
  const s=f.s||28,h=s/2;
  cx.globalAlpha=Math.min(1,p*2.4);cx.translate(f.x,f.y);
  cx.shadowColor=f.col||'#ffe880';cx.shadowBlur=10;
  cx.fillStyle='rgba(7,9,16,.92)';cx.strokeStyle=f.col||'#ffe880';cx.lineWidth=2;
  cx.fillRect(-h,-h,s,s);cx.strokeRect(-h+1,-h+1,s-2,s-2);
  cx.shadowBlur=0;cx.fillStyle='#fff';
  for(const pip of (f.pips||[])){
   const px=(pip%3-1)*s*.25,py=(Math.floor(pip/3)-1)*s*.25;
   cx.beginPath();cx.arc(px,py,Math.max(1.5,s*.055),0,TAU);cx.fill();
  }}
 else if(f.t==='focusring'){cx.globalAlpha=p*.5;cx.strokeStyle='#9df';cx.lineWidth=2;
  cx.beginPath();cx.arc(f.x,f.y,(1-p)*46+8,0,TAU);cx.stroke();}
 else if(f.t==='bloom'&&perfLevel>0){
  cx.globalCompositeOperation='lighter';cx.globalAlpha=p*.5;
  let g=_bloomGradCache.get(f.col);
  if(!g){g=cx.createRadialGradient(W/2,H/2,0,W/2,H/2,H*.7);
   g.addColorStop(0,f.col);g.addColorStop(1,'rgba(0,0,0,0)');_bloomGradCache.set(f.col,g);}
  cx.fillStyle=g;cx.fillRect(0,0,W,H);
  cx.globalCompositeOperation='source-over';}
 cx.restore();
}

