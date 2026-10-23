"use strict";
/* Stage 5 */
function*kurN1(b){
 let k=0,a=rnd(360);
 while(k<330){
  a+=7;
  if(k%8===0){
   for(const s of [-1,1]){
    const aa=(a*s+90)*Math.PI/180;
    b.S({x:b.x()+Math.cos(aa)*26,y:b.y()+Math.sin(aa)*18,v:DV(2.8),ang:aa*180/Math.PI+90,
     g:s<0?'rice:dblue':'rice:white',r:3,av:s*7,dur:52});
   }
  }
  if(k%50===0){
   for(const s of [-1,1])
    b.arc(b.x()+s*20,b.y(),DN(8),DV(3.6),s>0?-34:146,s>0?34:214,
     s<0?'rice:dblue':'rice:white',{r:3});
  }
  if(k%170===130)yield*b.mv(rnd(120,W-120),95,40);
  k++;yield;
 }
}
function*kurS(b){
 yield*b.mv(W/2,100,45);
 let t=0;
 while(t<3400){
  if(t%3===0){
   const ph=t*7*Math.PI/180;
   for(const s of [0,Math.PI]){
    const R=26+18*Math.sin(t/23);
    b.S({x:b.x()+Math.cos(ph+s)*R,y:b.y()+Math.sin(ph+s)*R,v:DV(2.6),ang:90+rnd(-16,16),g:s?'ball:white':'ball:dblue',r:4});
   }
  }
  if(t%210===0)b.fan(b.x(),b.y(),DN(11),DV(4.6),80,null,'kunai:dblue');
  t++;yield;
 }
}
function*sukN1(b){
 let k=0;
 while(k<330){
  if(k%56===0)
   for(let j=0;j<DN(4);j++){
    const tx=rnd(40,W-40);
    b.S({x:b.x(),y:b.y(),v:DV(5+j*.4),ang:Math.atan2(H*.8-b.y(),tx-b.x())*180/Math.PI,g:'orb:brown',r:9,
     fn(u){if(u.t===46){fxBurst(u.x,u.y,'#c85',10,4);fxRing(u.x,u.y,'#c85',6,54,4,18);
      b.ring(u.x,u.y,DN(10),DV(2.6),rnd(360),'ball:brown',{r:5});return false;}return true;}});
   }
  if(k%112===56){
   const px=clamp(targetPlayer().x+rnd(-60,60),30,W-30);
   fxRing(px,H-12,'#c85',4,28,2,24);
   b.S({x:px,y:H-8,v:DV(.2),ang:-90,g:'orb:brown',r:7,keep:true,
    fn(u){if(u.t===42){
     fxBurst(u.x,u.y,'#ea8',8,3);b.ring(u.x,u.y,DN(7),DV(2.4),rnd(360),'ball:brown',{r:4});
     return false;}return true;}});
  }
  k++;yield;
 }
}
function*sukS(b){
 yield*b.mv(W/2,96,45);
 let t=0;
 while(t<3400){
  if(t%90===0)
   b.S({x:b.x(),y:b.y(),v:DV(4.4),ang:b.aim(),g:'orb:brown',r:11,
    fn(u){
     if(u.t===40){
      fxRing(u.x,u.y,'#c85',8,70,5,20);shake(4,2);
      for(let i=0;i<DN(8);i++)
       b.S({x:u.x,y:u.y,v:DV(3.4),ang:i*360/DN(8)+rnd(8),g:'orb:brown',r:7,
        fn(v){if(v.t===30){fxBurst(v.x,v.y,'#ea8',8,3);
         b.ring(v.x,v.y,DN(6),DV(2),rnd(360),'ball:brown',{r:4});return false;}return true;}});
      return false;}
     return true;}});
  if(t%180===45){
   for(let i=0;i<DN(5);i++){
    const px=rnd(36,W-36);
    fxRing(px,H-14,'#c85',3,22,2,18);
    b.S({x:px,y:H-8,v:0,ang:0,g:'orb:brown',r:5,keep:true,
     fn(u){if(u.t===64){
      fxBurst(u.x,u.y,'#ea8',7,3);
      b.ring(u.x,u.y,DN(5),DV(2.3),rnd(360),'ball:brown',{r:4});
      return false;}return true;}});
   }
  }
  if(t%34===17)b.fan(b.x(),b.y(),DN(4),DV(3.4),28,null,'ball:brown');
  if(t%300===240)yield*b.mv(rnd(120,W-120),100,40);
  t++;yield;
 }
}
function*taiN1(b){
 let k=0,oa=0;
 while(k<330){
  oa+=3;
  if(k%2===0)
   for(const rr of [30,46])
    b.S({x:b.x()+Math.cos(oa*Math.PI/180)*rr,y:b.y()+Math.sin(oa*Math.PI/180)*rr,v:DV(2.8),ang:oa+90,g:'ball:gray',r:5});
  if(k%42===21){
   for(const rr of [30,46]){
    const aa=oa*Math.PI/180;
    b.S({x:b.x()+Math.cos(aa)*rr,y:b.y()+Math.sin(aa)*rr,v:DV(3.8),ang:oa+180,
     g:rr>40?'rice:white':'rice:gray',r:3});
   }
  }
  if(k%84===0)b.fan(b.x(),b.y(),DN(7),DV(4.4),50,null,'kunai:gray');
  k++;yield;
 }
}
function*taiS(b){
 yield*b.mv(W/2,102,45);
 let t=0;
 while(t<3400){
  if(t%160===0){
   const n=DN(10);
   for(let i=0;i<n;i++){
    const a0=i*360/n;
    b.S({x:b.x(),y:b.y(),v:DV(0),ang:a0,g:'orb:white',r:7,
     fn(u){const R=60+((u.t*1.4)%60);const a=(a0-u.t*.8)*Math.PI/180;
      u.x=b.x()+Math.cos(a)*R;u.y=b.y()+Math.sin(a)*R;
      if(u.t===80||u.t===200||u.t===320){
       for(let s=-1;s<=1;s++)
        b.S({x:u.x,y:u.y,v:DV(2.8),ang:b.aim(u.x,u.y)+s*10,g:'rice:gray',r:3});
      }
      if(u.t>400)return false;}});
   }
  }
  if(t%50===25)b.fan(b.x(),b.y(),DN(5),DV(3.8),40,null,'ball:gray');
  if(t%240===180)yield*b.mv(rnd(130,W-130),105,44);
  t++;yield;
 }
}
function*sanN1(b){
 for(let r=0;r<6;r++){
  yield 46;
  const tx=clamp(targetPlayer().x+rnd(-60,60),40,W-40),ty=clamp(targetPlayer().y-250,70,180);
  fxSpark(tx,ty,'#ccc',14);
  yield*b.mv(tx,ty,14);
  b.fan(b.x(),b.y(),DN(7),DV(4.4),64,b.aim(),'ball:white',{r:4});
  const dx=W-b.x(),dy=clamp(H-b.y(),70,H*.5);
  addText(dx,dy,'?','#e8e8f0',20,30);
  b.S({x:dx,y:dy,v:0,ang:0,g:'orb:white',r:7,keep:true,
   fn(u){if(u.t===24){
    b.fan(u.x,u.y,DN(5),DV(3.8),50,b.aim(u.x,u.y),'ball:gray',{r:4});
    return false;}return true;}});
  yield 16;
  b.fan(b.x(),b.y(),DN(4),DV(5.2),44,b.aim(),'kunai:red');
  sfx('eshot');
 }
}
function*sanS(b){
 yield*b.mv(W/2,100,40);
 let t=0;
 while(t<3300){
  if(t%150===0){
   const mx=clamp(targetPlayer().x+rnd(-40,40),50,W-50),my=clamp(targetPlayer().y-230,60,190);
   addText(mx,my,'!','#f66',30,40);sfx('warn');
   yield 52;
   yield*b.mv(mx,my,10);
   for(const dx of [70,W-70]){
    addText(dx,my,'?','#e8e8f0',18,32);
    b.S({x:dx,y:my,v:0,ang:0,g:'orb:white',r:6,keep:true,
     fn(u){if(u.t===18){
      b.fan(u.x,u.y,DN(5),DV(4),58,b.aim(u.x,u.y),'ball:gray',{r:4});
      return false;}return true;}});
   }
   for(let w=0;w<2;w++){
    b.fan(b.x(),b.y(),DN(9)-w*2,DV(4.6+w*1.1),78,b.aim(),'ball:white',{r:w?3:5});
    yield 10;
   }
  }
  t++;yield;
 }
}
function*parN1(b){
 let k=0;
 while(true){
  if(k%90===0){
   screenFlash(.14,'#fff');sfx('graze');
   const fx_=rnd(80,W-80),fy=rnd(60,H*.5),grid=DN(4);
   for(let gx=0;gx<grid;gx++)for(let gy=0;gy<grid;gy++){
    const px=fx_+(gx-(grid-1)/2)*22,py=fy+(gy-(grid-1)/2)*22;
    b.S({x:px,y:py,v:DV(.05),ang:0,g:'crystal:white',r:5,
     fn(u){
      if(u.t===50){
       const aa=b.aim(u.x,u.y)*Math.PI/180;
       u.vx=Math.cos(aa)*DV(4.8)+(gx-(grid-1)/2)*.4;
       u.vy=Math.sin(aa)*DV(4.8)+(gy-(grid-1)/2)*.4;
       fxSpark(u.x,u.y,'#fff',8);
      }
      if(u.t>50)u.vy+=.02;
     }});
   }
   yield 30;
   for(let i=0;i<DN(8);i++)
    b.S({x:b.x(),y:b.y(),v:DV(rnd(2,4)),ang:i*360/DN(8)+rnd(8),g:'crystal:white',r:5,
     fn(u){u.vy+=.015;}});
  }
  if(k%140===100)yield*b.mv(rnd(120,W-120),100,40);
  k++;yield;
 }

}
function*parS(b){
 yield*b.mv(W/2,98,45);
 let t=0;
 while(t<3300){
  if(t%8===0)
   b.S({x:rnd(20,W-20),y:-12,v:DV(1.6),ang:90,g:'crystal:white',r:3,
    fn(u){if(u.t===26){u.vx=rnd(-1.4,1.4);}if(u.t%40===39)u.vx*=.2;}});
  if(t%160===0)b.ring(b.x(),b.y(),DN(12),DV(3.4),rnd(360),'crystal:teal');
  if(t%240===160){
   const vertical=(t/240|0)%2===0,gp=vertical?rnd(80,W-80):rnd(70,H-90);
   sfx('warn');screenFlash(.12,'#ffd0e0');
   addText(vertical?gp:W/2,vertical?34:H-34,'◇','#ffb0c8',20,54);
   if(vertical){
    for(let x=14;x<W;x+=24){
     if(Math.abs(x-gp)<56)continue;
     b.S({x,y:-14,v:0,ang:90,g:'crystal:white',r:4,keep:true,
      fn(u){if(u.t===34){u.vy=DV(2.2);u.keep=false;}return true;}});
     b.S({x,y:H+14,v:0,ang:-90,g:'crystal:white',r:4,keep:true,
      fn(u){if(u.t===34){u.vy=-DV(2.2);u.keep=false;}return true;}});
    }
   }else{
    for(let y=60;y<H-40;y+=24){
     if(Math.abs(y-gp)<56)continue;
     b.S({x:-14,y,v:0,ang:0,g:'crystal:teal',r:4,keep:true,
      fn(u){if(u.t===34){u.vx=DV(2.2);u.keep=false;}return true;}});
     b.S({x:W+14,y,v:0,ang:180,g:'crystal:teal',r:4,keep:true,
      fn(u){if(u.t===34){u.vx=-DV(2.2);u.keep=false;}return true;}});
    }
   }
   for(let i=0;i<DN(4);i++)
    b.S({x:vertical?gp:rnd(30,W-30),y:vertical?rnd(40,H*.5):gp,v:DV(2.4),
     ang:rnd(360),g:'crystal:pink',r:4});
  }
  t++;yield;
 }
}
registerBoss('kuroji','Kurose Ji',['#2a3a7a','#8090ff'],51,154,[{l:300,t:60,p:kurN1},{n:'Helix “Twin Black Wings”',col:'#8090ff',l:86,t:60,p:kurS}]);
registerBoss('sukune','Haniko Sue',['#7a5a3a','#e0b080'],52,140,[{l:305,t:60,p:sukN1},{n:'Haniwa Bomb “Chain Detonation”',col:'#e0b080',l:88,t:60,p:sukS}]);
registerBoss('taira','Tairagi Go',['#5a5a5a','#d8d8d8'],53,148,[{l:310,t:60,p:taiN1},{n:'Little Emperor “Rotating Court”',col:'#d8d8d8',l:90,t:60,p:taiS}]);
registerBoss('sanra','Ameyubi Ran',['#6a6a72','#e8e8f0'],54,160,[{l:315,t:60,p:sanN1},{n:'Vanishing Shot “Ambush Instinct”',col:'#e8e8f0',l:92,t:60,p:sanS}]);
registerBoss('para','Memoira Pare',['#7a4a5a','#ffb0c8'],55,144,[{l:320,t:60,p:parN1},{n:'Crumbling Thought “Shattered Frame”',col:'#ffb0c8',l:94,t:60,p:parS}]);
