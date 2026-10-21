"use strict";
/* Stage 4 */
function*hoaN1(b){
 let k=0,divX=W/2,divDir=1;
 while(true){
  if(k%280===0){
   divDir*=-1;
   fxRing(divX,H/2,divDir>0?'#ff5060':'#4090ff',5,74,3,26);
   screenFlash(.1,divDir>0?'#ff3040':'#3070ff');
  }
  divX=clamp(divX+divDir*1.5,80,W-80);
  if(k%4===0){
   const hot=Math.floor(k/4)%2===0;
   const sx=hot?-14:W+14,ang=hot?0:180;
   b.S({x:sx,y:rnd(80,H*.7),v:DV(hot?5.5:2),ang,g:hot?'ball:red':'ball:blue',
    fn(u){
     if((divDir>0&&u.x>divX)||(divDir<0&&u.x<divX)){
      const aa=b.aim(u.x,u.y);u.vx=Math.cos(aa*Math.PI/180)*DV(4);u.vy=Math.sin(aa*Math.PI/180)*DV(4);
      u.g=hot?'ball:blue':'ball:red';
      fxSpark(u.x,u.y,hot?'#ff5060':'#4090ff',5);return false;}
     return true;}});
  }
  if(k%84===42){
   const side=(k/84|0)%2;
   for(let i=0;i<DN(4);i++)
    b.S({x:side?W-40:40,y:70+i*22,v:DV(2.6),ang:side?180:0,g:side?'ball:blue':'ball:red',r:5,
     fn(u){if((divDir>0&&u.x>divX)||(divDir<0&&u.x<divX)){
      u.vx=0;u.vy=DV(2.8);}return true;}});
  }
  if(k%36===18)b.fan(b.x(),b.y(),DN(6),DV(3.6),50,null,(Math.floor(k/36)%2===0)?'ball:red':'ball:blue');
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
  if(k%76===38){
   const cx=rnd(46,W-46),cy=rnd(H*.24,H*.52);
   addText(cx,cy-20,'▼','#a0ffc0',18,34);
   for(let i=0;i<DN(4);i++)
    b.S({x:cx+rnd(-7,7),y:cy+i*12,v:DV(2.8),ang:90,g:'crystal:green',r:4,
     fn(u){if(u.t===30){u.vx=0;u.vy=DV(3.8);}return true;}});
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
 let k=0,cloudR=8,cloudX=0,cloudY=0;
 while(true){
  if(k%80===0){
   cloudX=b.x();cloudY=b.y();cloudR=8;sfx('item');
   fxRing(cloudX,cloudY,'#60ff80',cloudR,cloudR+30,3,20);
  }
  if(cloudR<45&&k%80>0&&k%80<60)cloudR+=.7;
  if(k%8===0&&cloudR>12)
   b.S({x:cloudX+rnd(-cloudR,cloudR),y:cloudY+rnd(-cloudR,cloudR),v:DV(.8),ang:90+rnd(-30,30),
    g:'bubble:green',r:rnd(6,10),acc:DV(.06)});
  if(k%120===110){
   b.ring(b.x(),b.y(),DN(10),DV(2.4),rnd(360),'kunai:lime');
   const aa=b.aim(cloudX,cloudY);
   b.S({x:cloudX,y:cloudY,v:DV(6.4),ang:aa,g:'kunai:purple',r:4,
    fn(u){if(u.t===20)fxBurst(u.x,u.y,'#c6f',6);return true;}});
   addText(cloudX,cloudY-26,'fangs','#c0a0ff',10,28);
  }
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
   for(let i=0;i<3;i++){
    const aa=(a+i*120)*Math.PI/180,R=46+i*8;
    b.S({x:b.x()+Math.cos(aa)*R,y:b.y()+Math.sin(aa)*R*.7,v:DV(2.8+i*.3),
     ang:a*3+i*120,g:['ball:blue','kunai:red','star:yellow'][i],r:i===1?4:5});
   }
  }
  if(k%42===14){
   const i=(k/42|0)%3,aa=(a+i*120)*Math.PI/180,R=46+i*8;
   b.fan(b.x()+Math.cos(aa)*R,b.y()+Math.sin(aa)*R*.7,DN(4),DV(3.8),36,
    aa*180/Math.PI+180+(i-1)*22,['ball:blue','kunai:red','star:yellow'][i]);
  }
  if(k%150===120){
   const pts=[];
   for(let i=0;i<3;i++){
    const aa=(a+i*120)*Math.PI/180,R=46;
    pts.push([b.x()+Math.cos(aa)*R,b.y()+Math.sin(aa)*R*.7]);
   }
   for(let i=0;i<3;i++){
    const p=pts[i],q=pts[(i+1)%3];
    const ang=Math.atan2(q[1]-p[1],q[0]-p[0])*180/Math.PI;
    spawnLaser({x:p[0],y:p[1],ang,len:Math.hypot(q[0]-p[0],q[1]-p[1]),
     warm:26,dur:10,wid:5,col:'#ff8'});
   }
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
  if(t%280===0){
   screenFlash(.12,'#e8ff80');shake(3,2);
   for(let i=0;i<3;i++){
    const aa=t*.8+i*120;
    b.ring(b.x()+Math.cos(aa*Math.PI/180)*42,b.y()+Math.sin(aa*Math.PI/180)*32,
     DN(5),DV(2.5),aa,'star:'+['blue','red','yellow'][i],{r:4});
   }
  }
  if(t%50===25){
   for(let i=0;i<3;i++){
    const aa=t*.9+i*120;
    b.fan(b.x()+Math.cos(aa*Math.PI/180)*42,b.y()+Math.sin(aa*Math.PI/180)*32,
     DN(3),DV(3.2),26,aa+180,'ball:'+['blue','red','yellow'][i],{r:4});
   }
  }
  if(t%280===250)yield*b.mv(rnd(120,W-120),100,30);
  t++;yield;
 }
}
registerBoss('hooaka','Kouka Suiren',['#8a3a3a','#ffb0a0'],41,158,[{l:280,t:60,p:hoaN1},{n:'Twin Faces “Mercury Divide”',col:'#ffb0a0',l:78,t:60,p:hoaS}]);
registerBoss('hibaru','Hibari Soukei',['#3a7a4a','#a0ffc0'],42,150,[{l:285,t:60,p:hibN1},{n:'Chart “The Great Crash”',col:'#a0ffc0',l:80,t:60,p:hibS}]);
registerBoss('kaoru','Dokuka Miyabi',['#5a3a7a','#c0a0ff'],43,146,[{l:290,t:60,p:kaoN1},{n:'Venom “Beast-Felling Spear”',col:'#c0a0ff',l:82,t:60,p:kaoS}]);
registerBoss('garaiya','Garaiya Sen',['#7a7a2a','#e8ff80'],44,152,[{l:295,t:60,p:garN1},{n:'Trinity “Wild Playground”',col:'#e8ff80',l:84,t:60,p:garS}]);
