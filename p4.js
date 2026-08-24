"use strict";
/* Stage 4 */
function*hoaN1(b){
 let k=0;
 while(k<330){
  if(k%36===0){
   const hot=k%72<36,a=b.aim();
   b.arc(b.x(),b.y(),DN(7),DV(hot?5.5:2.2),a-54,a+54,hot?'ball:red':'ball:blue');
   b.ring(b.x(),b.y(),DN(6),DV(hot?2:5),rnd(360),hot?'rice:red':'rice:blue',{r:3});
  }
  if(k%180===120)yield*b.mv(rnd(120,W-120),100,40);
  k++;yield;
 }
}
function*hoaS(b){
 yield*b.mv(W/2,104,45);
 let t=0,divX=W/2,divDir=1;
 while(true){
  const cyc=t%280;
  if(cyc===0){divDir*=-1;sfx('warn');}
  divX=clamp(divX+divDir*(1.8+(G.beat||0)*.8),80,W-80);
  if(t%3===0){
   const side=(Math.floor(t/3)%2)===0;
   const sxs=side?-14:W+14;
   for(let s=0;s<DN(3);s++){
    b.S({x:sxs,y:rnd(60,H*.7),v:DV(6),ang:side?0:180,g:'rice:red',r:3,
     fn(u){
      if((divDir>0&&u.x>divX)||(divDir<0&&u.x<divX)){
       const aa=b.aim(u.x,u.y);u.vx=Math.cos(aa*Math.PI/180)*DV(4.2);u.vy=Math.sin(aa*Math.PI/180)*DV(4.2);
       fxSpark(u.x,u.y,'#ff5060',6);return false;}
      return true;}});
   }
  }
  if(t%90===45)b.fan(b.x(),b.y(),DN(8),DV(3.6),60,null,'orb:white',{});
  t++;yield;
 }
}

function*hibN1(b){
 let k=0;
 while(k<330){
  if(k%48===0){
   let px=rnd(60,W-60),dir=pick([-1,1]);
   for(let s=0;s<DN(10);s++){
    b.S({x:px,y:b.y()+s*12,v:DV(3.4),ang:90+dir*38,g:'kunai:green',
     fn(u){if(u.t%26===0)u.vx*=-1;if(u.y>H+16)return false;}});
    dir*=-1;
   }
  }
  if(k%160===140)yield*b.mv(rnd(120,W-120),95,36);
  k++;yield;
 }
}
function*hibS(b){
 yield*b.mv(W/2,92,45);
 let t=0;
 while(t<3400){
  if(t%240===0)
   for(let up=0;up<DN(14);up++)
    b.S({x:rnd(70,W-70),y:H+14,v:DV(.01),ang:-90,g:'crystal:green',r:5,acc:DV(.02),max:DV(3.2)});
  if(t%300===200){
   screenFlash(.2,'#fdd');shake(8,4);sfx('warn');
   const gap=rnd(70,W-70);
   for(let i=0;i<Math.round(W/22);i++){
    const x=i*22;
    if(Math.abs(x-gap)<110)continue;
    b.S({x,y:-14,v:DV(3.5),ang:90,g:'ball:red',r:6});
   }
  }
  if(t%44===22)b.fan(b.x(),b.y(),DN(5),DV(4.4),40,null,'kunai:green');
  t++;yield;
 }
}
function*kaoN1(b){
 let k=0;
 while(k<330){
  if(k%5===0)b.S({x:b.x(),y:b.y(),v:DV(1.4),ang:b.aim()+rnd(-70,70),g:'bubble:green',r:rnd(7,13)});
  if(k%120===110)b.ring(b.x(),b.y(),DN(12),DV(2.6),rnd(360),'kunai:lime');
  k++;yield;
 }
}
function*kaoS(b){
 yield*b.mv(W/2,98,45);
 let t=0;
 while(t<3400){
  if(t%80===0){
   const a=b.aim();
   for(let v=0;v<DN(5);v++)
    b.S({x:b.x(),y:b.y(),v:DV(6.2+v*.5),ang:a+rnd(-6,6),g:'kunai:purple',
     fn(u){if(u.t===52){fxRing(u.x,u.y,'#c6f',4,46,3,18);
      for(let i=0;i<DN(7);i++)b.S({x:u.x,y:u.y,v:DV(2.2),ang:i*360/DN(7)+u.t,g:'ball:purple',r:4});}}});
  }
  if(t%11===0)b.S({x:rnd(0,W),y:-12,v:DV(rnd(1,2)),ang:88,g:'bubble:green',r:rnd(6,12)});
  if(t%260===200)yield*b.mv(rnd(120,W-120),100,40);
  t++;yield;
 }
}
function*garN1(b){
 let k=0,a=0;
 yield*b.mv(W/2,115,40);
 while(k<330){
  a+=2.6;
  if(k%3===0){
   b.S({x:b.x()+Math.cos(a*Math.PI/180)*34,y:b.y()+Math.sin(a*Math.PI/180)*34,v:DV(3.4),ang:a*3%360,g:'ball:blue'});
   b.S({x:b.x()-Math.cos(a*Math.PI/180)*34,y:b.y()-Math.sin(a*Math.PI/180)*34,v:DV(4.2),ang:(a*-2)%360+180,g:'kunai:red'});
   b.S({x:b.x(),y:b.y(),v:DV(2.6),ang:a*2,g:'star:yellow'});
  }
  k++;yield;
 }
}
function*garS(b){
 yield*b.mv(W/2,108,45);
 let t=0;
 while(t<3300){
  const ph=Math.floor(t/280)%3;
  if(ph===0&&t%40===0)b.ring(b.x(),b.y(),DN(14),DV(3),t*9,'ball:blue');
  if(ph===1&&t%24===0)b.fan(b.x(),b.y(),DN(6),DV(5),30,null,'kunai:red');
  if(ph===2&&t%90===0)
   spawnLaser({x:b.x(),y:b.y(),ang:b.aim()+rnd(-40,40),len:600,warm:40,dur:22,wid:14,col:'#fd5'});
  if(t%280===250)yield*b.mv(rnd(120,W-120),100,30);
  t++;yield;
 }
}
registerBoss('hooaka','Kouka Suiren',['#8a3a3a','#ffb0a0'],41,158,[{l:280,t:60,p:hoaN1},{n:'Twin Faces “Mercury Divide”',col:'#ffb0a0',l:78,t:60,p:hoaS}]);
registerBoss('hibaru','Hibari Soukei',['#3a7a4a','#a0ffc0'],42,150,[{l:285,t:60,p:hibN1},{n:'Chart “The Great Crash”',col:'#a0ffc0',l:80,t:60,p:hibS}]);
registerBoss('kaoru','Dokuka Miyabi',['#5a3a7a','#c0a0ff'],43,146,[{l:290,t:60,p:kaoN1},{n:'Venom “Beast-Felling Spear”',col:'#c0a0ff',l:82,t:60,p:kaoS}]);
registerBoss('garaiya','Garaiya Sen',['#7a7a2a','#e8ff80'],44,152,[{l:295,t:60,p:garN1},{n:'Trinity “Wild Playground”',col:'#e8ff80',l:84,t:60,p:garS}]);
