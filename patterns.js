"use strict";
const BOSS_DEFS={};

/* ---------- reusable micro-patterns ---------- */
const cols7=['red','orange','yellow','green','teal','blue','purple'];
function sgShot(b,x,y,ang,g,v1,v2,tHold,r=4){
 b.S({x,y,v:v1,ang,g,r,fn(u){
  if(u.t===tHold){
   const a=b.aim(u.x,u.y)*Math.PI/180;
   u.vx=Math.cos(a)*v2;u.vy=Math.sin(a)*v2;
  }
  return true;
 }});
}

/* ================= STAGE 1 ================= */

/* Kurohebi - shadow snake */
function*kuroN1(b){
 yield*b.mv(W/2,105,50);
 let k=0,a=rnd(360);
 while(true){
  if(k%7===0){
   a+=17;
   for(const dir of [0,180]){
    const ang=a+dir;
    b.S({x:b.x(),y:b.y(),v:DV(2.6),ang,g:'ball:purple',r:5,av:14,dur:60});
   }
  }
  if(k%64===30){
   const aa=b.aim();
   for(let s=-1;s<=1;s++)
    b.S({x:b.x(),y:b.y(),v:DV(4.6),ang:aa+s*10,g:'kunai:green'});
  }
  if(k%210===120)
   yield*b.mv(clamp(W/2+Math.sin(k/40)*220,90,W-90),rnd(85,125),55);
  k++;yield;
 }
}
function*kuroN2(b){
 let k=0;
 while(true){
  if(k%56===24){
   const base=b.aim();
   const n=Math.max(DN(7),3);
   for(let i=0;i<n;i++){
    const ang=base+(i-(n-1)/2)*(70/Math.max(n-1,1));
    sgShot(b,b.x(),b.y(),ang,'kunai:dblue',DV(1.4),DV(4.4),34);
   }
  }
  if(k%80===10){
   const n=DN(16);
   for(let i=0;i<n;i++)
    b.S({x:b.x(),y:b.y(),v:DV(1.9),ang:i*360/n+k*2,g:'ball:black',r:5,acc:DV(.02)});
  }
  if(k%160===100)yield*b.mv(rnd(110,W-110),95+rnd(-15,25),45);
  k++;yield;
 }
}
function*kuroS(b){
 yield*b.mv(W/2,100,50);
 let t=0,wheel=0;
 while(true){
  if(t%11===0){
   wheel+=9;
   for(let arm=0;arm<7;arm++){
    const ang=wheel+arm*(360/7);
    b.S({x:b.x(),y:b.y(),v:DV(3.1),ang,g:'kunai:'+cols7[arm%7],r:4});
   }
  }
  if(t%150===60){
   fxSpark(PL.x,PL.y-150,'#fff',20);
   addText(PL.x,clamp(PL.y-170,30,H-40),'!','#fff',22,26);
   sfx('warn');
   yield 26;
   const sa=b.aim(),perp=sa+90;
   for(let j=-2;j<=2;j++){
    const ox=Math.cos(perp*Math.PI/180)*j*14,oy=Math.sin(perp*Math.PI/180)*j*14;
    b.S({x:b.x()+ox,y:b.y()+oy,v:DV(6.3),ang:sa,g:'kunai:white'});
   }
   yield 8;
   yield*b.mv(rnd(120,W-120),rnd(85,130),40);
  }
  t++;yield;
 }
}

/* Jun - rain gloom */
function*junN1(b){
 let r=0,gust=1;
 while(true){
  if(r%4===0)gust*=-1;
  yield*b.mv(clamp(W/2+gust*rnd(60,140),100,W-100),90+rnd(-15,25),30);
  for(let i=0;i<DN(12);i++){
   const curve=(i%2?1:-1)*(20+i%3*14);
   b.S({x:rnd(0,W),y:-10,v:DV(rnd(3.2,4.2)),ang:90+gust*10+rnd(-4,4),g:'rice:blue',r:3,av:curve,dur:46});
  }
  b.fan(b.x(),b.y(),DN(7),DV(3),60,null,'ball:dblue',{acc:.03,max:DV(5)});
  yield 40;
  r++;
 }
}
function*junS(b){
 yield*b.mv(W/2,96,50);
 let t=0,gust=0;
 while(true){
  const cycle=t%300;
  if(cycle===0){gust=pick([-1,1]);addText(b.x(),b.y()-40,'~ wind shifts ~','#a0c8e0',14,50);}
  if(cycle>60&&t%4===0){
   const x=rnd(-80,W+80);
   b.S({x,y:-12,v:DV(5.6),ang:90+gust*16+rnd(-3,3),g:'rice:teal',r:3,
    fn(u){u.x+=gust*Math.min(u.t/40,1)*.55;}});
  }
  if(t%30===15){
   const lx=rnd(20,W-20);
   fxRing(lx,H-12,'#7fdfff',3,26,2,18);
   for(let s=0;s<3;s++)b.S({x:lx,y:H-14,v:DV(2.6),ang:-90-s*24*gust,g:'ball:dblue',r:3});
  }
  if(cycle===150&&t>300){
   sfx('warn');screenFlash(.18,'#bcd0ff');
   for(const bx of [PL.x-70,PL.x,PL.x+70]){
    addText(clamp(bx,20,W-20),120,'|','#bcd0ff',34,26);
    spawnLaser({x:clamp(bx,20,W-20),y:-10,ang:90,len:H+30,warm:46,dur:16,wid:10,col:'#bcd0ff'});
   }
  }
  if(cycle===290)yield*b.mv(rnd(140,W-140),100,26);
  t++;yield;
 }
}

/* Souko - sealed blossoms */
function*souN1(b){
 let a=rnd(360),k=0;
 while(true){
  if(k%6===0){
   a+=13;
   for(let i=0;i<2;i++){
    const ang=a+i*180;
    sgShot(b,b.x(),b.y(),ang,'star:pink',DV(2.4),DV(3.6),30,5);
   }
  }
  if(k%160===80)yield*b.mv(rnd(120,W-120),95,40);
  k++;yield;
 }
}
function*souS(b){
 yield*b.mv(W/2,105,45);
 let t=0;
 while(true){
  const cyc=t%240;
  if(cyc===0){
   const px=rnd(90,W-90),py=rnd(70,150),petals=DN(8);
   fxRing(px,py,'#ffb0d8',4,30,2,20);sfx('spellget');
   for(let layer=0;layer<3;layer++){
    for(let p=0;p<petals;p++){
     const aa=p*360/petals+layer*(180/petals)+t*.7;
     const rr=(layer+1)*16;
     sgShot(b,px,py,aa,'star:pink',DV(2.2),DV(3.4),46+layer*22,5);
    }
   }
   b.S({x:px,y:py,v:DV(.25),ang:0,g:'orb:white',r:9,acc:DV(.04),max:DV(1.6)});
  }
  if(t%48===24)b.fan(b.x(),b.y(),DN(5),DV(3.6),30,null,'ball:red');
  t++;yield;
 }
}

/* Mitsumo - centipede dread */
function*mitN1(b){
 let k=0,spin=1;
 while(true){
  const gx=(k%2)?W-90:90;
  yield*b.mv(gx,rnd(85,125),36);
  for(let col=0;col<3;col++){
   for(let i=0;i<DN(8);i++){
    b.S({x:gx+(col-1)*26,y:b.y(),v:DV(2.6)+col*.4,ang:90,
     g:i%2?'ball:purple':'ball:green',r:5,
     av:spin*(14-col*3),dur:70});
   }
   yield 22;
  }
  if(k%2===0){
   const aa=b.aim();
   b.S({x:b.x(),y:b.y(),v:DV(4.8),ang:aa,g:'kunai:green'});
  }
  spin*=-1;k++;
 }
}
function*mitS(b){
 yield*b.mv(W/2,100,50);
 let t=0;
 while(true){
  if(t%44===0){
   const headX=rnd(40,W-40);
   const curve=pick([-1,1])*rnd(8,20);
   for(let i=0;i<DN(12);i++){
    b.S({x:headX,y:-16-i*14,v:DV(2.7),ang:90,g:'orb:purple',r:7,
     fn(u){u.x+=Math.sin((u.t+i*9)/17)*1.7;
      if(u.t===30&&i%4===0){u.av=curve;u.dur=50;}
      if(u.y>H+20)return false;}});
   }
  }
  if(t%100===60){
   const base=b.aim();
   for(let s=0;s<3;s++)
    b.fan(b.x(),b.y(),DN(3),DV(3.6+s*.5),14,base+(s-1)*22,'kunai:green');
  }
  if(t%200===150)yield*b.mv(rnd(110,W-110),100,40);
  t++;yield;
 }
}

/* ================= STAGE 2 ================= */

/* Aoji - whirlpool */
function*aojN1(b){
 let a=0,k=0;
 yield*b.mv(W/2,110,40);
 while(true){
  if(k%4===0){a+=11;
   b.S({x:b.x(),y:b.y(),v:DV(2.9),ang:a,g:'ball:blue'});
   b.S({x:b.x(),y:b.y(),v:DV(2.9),ang:a+180,g:'ball:teal'});
   b.S({x:b.x(),y:b.y(),v:DV(3.4),ang:-a*1.4+90,g:'rice:white',r:3});}
  if(k%90===45){
   const aa=b.aim();
   for(let s=-1;s<=1;s++)b.S({x:b.x(),y:b.y(),v:DV(5),ang:aa+s*8,g:'kunai:blue'});
  }
  k++;yield;
 }
}
function*aojS(b){
 yield*b.mv(W/2,115,45);
 let t=0;
 const well={x:W/2,y:H*.45};
 while(true){
  const phase=t%360;
  if(phase===0){
   well.x=rnd(140,W-140);well.y=rnd(H*.3,H*.62);
   fxRing(well.x,well.y,'#90b8e8',8,70,4,26);
   addText(well.x,well.y-30,'▼','#90b8e8',22,40);
  }
  if(t%3===0){
   const aa=rnd(360);
   b.S({x:well.x+Math.cos(aa)*(W*.42),y:well.y+Math.sin(aa)*(H*.36),v:DV(1.7),ang:aa+180,g:'ball:blue',r:5,
    fn(u){
     if(u.t>20&&u.t<130){
      const dx=well.x-u.x,dy=well.y-u.y;
      u.vx+=dx*.0016;u.vy+=dy*.0016;
     }
     if(u.t===150){
      const out=Math.atan2(u.y-well.y,u.x-well.x);
      u.vx=Math.cos(out)*DV(4.8);u.vy=Math.sin(out)*DV(4.8);u.acc=DV(.02);
     }
    }});
  }
  if(t%9===0)fxSpark(well.x+Math.cos(t)*46,well.y+Math.sin(t)*46,'#6090ff',10);
  if(phase>=240&&phase<330&&t%14===0){
   const aa=b.aim();
   for(let s=-1;s<=1;s++)b.S({x:b.x(),y:b.y(),v:DV(4.6),ang:aa+s*12,g:'kunai:teal'});
  }
  t++;yield;
 }
}

/* Shou - slug intersections */
function*shoN1(b){
 let k=0;
 while(true){
  if(k%64===0){
   const gy=rnd(140,260),cols=DN(10);
   for(let i=0;i<cols;i++){
    if(i===irnd(1,cols-2))continue;
    b.S({x:i*(W/cols)+20,y:-14,v:DV(2.2),ang:90,g:'bubble:green',r:11,
     fn(u){if(u.y>=gy){u.vx=0;u.vy=0;u.keep=true;
      if(u.t===0||u.fn._set!==true){u.fn._set=true;}
      const self=u;u.fn=function(inner){if(inner.t-self.t>80){
       fxRing(self.x,self.y,'#b0ff30',4,30,2,14);
       for(let s=0;s<4;s++)b.S({x:self.x,y:self.y,v:DV(2.6),ang:s*90+45,g:'ball:lime',r:4});
       return false;}return true;};return true;}}});
   }
  }
  if(k%52===26){
   const dir=k%104===26?1:-1;
   for(let i=0;i<DN(5);i++)
    b.S({x:dir>0?-14:W+14,y:rnd(60,220),v:DV(4.4),ang:dir>0?0:180,g:'kunai:yellow'});
  }
  k++;yield;
 }
}
function*shoS(b){
 yield*b.mv(W/2,100,45);
 let t=0;
 while(true){
  const ix=W/4+Math.floor(t/100)%3*(W/4),iy=130+Math.floor(t/140)%2*90;
  if(t%22===0){
   b.S({x:-12,y:iy+rnd(-5,5),v:DV(3.6),ang:0,g:'ball:lime',r:6});
   b.S({x:W+12,y:iy+rnd(-5,5),v:DV(3.6),ang:180,g:'ball:lime',r:6});
  }
  if(t%30===15)
   for(let s=-1;s<=1;s++)
    b.S({x:ix+s*34,y:-14,v:DV(3),ang:90,g:'bubble:green',r:9});
  if(t%190===95){
   fxRing(ix,iy,'#b0ff30',4,46,3,20);sfx('bossHit');
   b.ring(ix,iy,DN(10),DV(2.9),rnd(360),'ball:green',{r:4});
  }
  if(t%66===33)b.fan(b.x(),b.y(),DN(4),DV(4),32,null,'kunai:yellow');
  if(t%300===240)yield*b.mv(rnd(120,W-120),100,40);
  t++;yield;
 }
}

/* Tsugumi - speed racer */
function*tsgN1(b){
 let d=0;
 while(true){
  const y=90+(d%4)*14,left=d%2===0;
  yield*b.mv(left?70:W-70,y,26);
  const dashAng=left?0:180;
  for(let v=0;v<5;v++){
   b.fan(b.x(),b.y(),DN(7),DV(5.4),40,b.aim(),'kunai:yellow');
   /* speed-line trail: rice bullets stop mid-air, then fire at where player WAS */
   const px=PL.x,py=PL.y;
   b.S({x:b.x(),y:b.y(),v:DV(7),ang:left?10:170,g:'rice:yellow',keep:true,
    fn(u){if(u.t===26){u.vx=0;u.vy=0;u.keep=true;}
     if(u.t===44){const aa=b.aim(u.x,u.y)*Math.PI/180;u.vx=Math.cos(aa)*DV(5.2);u.vy=Math.sin(aa)*DV(5.2);u.keep=false;}
     if(u.x<-20||u.x>W+20)return false;}});
   yield 14;
  }
  yield 20;
  d++;
 }
}
function*tsgS(b){
 let t=0;
 while(t<3300){
  const side=t%700<350;
  const tx=side?W-80:80;
  if(t%350===0)yield*b.mv(tx,100,30);
  if(t%16===0)
   b.S({x:b.x(),y:b.y(),v:DV(2.8),ang:b.aim()+rnd(-20,20),g:'rice:yellow',r:3,keep:false});
  if(t%70===0)b.ring(b.x(),b.y(),DN(12),DV(2.6),t*11,'ball:orange');
  t++;yield;
 }
}
function*tsgS2(b){
 yield*b.mv(W/2,120,40);
 let t=0,a=0;
 while(t<3400){
  a+=9.4;
  if(t%2===0){
   b.S({x:b.x(),y:b.y(),v:DV(3.4),ang:a,g:'kunai:orange'});
   b.S({x:b.x(),y:b.y(),v:DV(3.4),ang:-a,g:'kunai:yellow'});
  }
  if(t%180===0){b.fan(b.x(),b.y(),DN(11),DV(5),60,null,'ball:red');}
  if(t%240===120){const ox=b.x();yield*b.mv(clamp(ox+rnd(-260,260),80,W-80),rnd(90,160),50);}
  t++;yield;
 }
}

/* Medias - frictionless */
function*medN1(b){
 let k=0;
 while(true){
  if(k%40===0){
   for(let i=0;i<DN(6);i++)
    b.S({x:b.x(),y:b.y(),v:DV(.5),ang:b.aim()-60+i*24,g:'crystal:teal',acc:DV(.16),max:DV(6)});
  }
  if(k%40===20){
   b.ring(b.x(),b.y(),DN(10),DV(1.2),rnd(360),'ball:blue',{acc:DV(.08),max:DV(4)});
  }
  if(k%9===0)
   b.S({x:rnd(0,W),y:-12,v:DV(2.2),ang:90,g:'ball:teal',r:4,seed:k,
    fn(u){u.x+=Math.sin((u.t+(u.seed||0))/14)*1.5;}});
  k++;yield;
 }
}
function*medS(b){
 yield*b.mv(W/2,105,45);
 let t=0;
 while(true){
  const cyc=t%220;
  if(cyc===12){
   for(let l=0;l<3;l++){
    const ly=95+l*105;
    spawnLaser({x:0,y:ly,ang:0,len:W,warm:64,dur:1,wid:20,col:'#8cf',lethal:false});
   }
   sfx('warn');
  }
  if(cyc===80){
   for(let l=0;l<3;l++){
    const ly=95+l*105,dir=l%2?-1:1;
    for(let ccar=0;ccar<3;ccar++)
     b.S({x:dir>0?-14-ccar*80:W+14+ccar*80,y:ly+rnd(-4,4),v:DV(7.2),ang:dir>0?0:180,g:'kunai:teal',r:4});
   }
   sfx('laser');
  }
  if(t%40===20)b.fan(b.x(),b.y(),DN(4),DV(3),26,null,'ball:blue');
  if(cyc>90&&cyc<150&&t%6===0)
   b.S({x:b.x(),y:b.y(),v:DV(.5),ang:b.aim()+rnd(-50,50),g:'crystal:teal',acc:DV(.15),max:DV(5.5)});
  t++;yield;
 }
}

/* Kujiru - slug city */
function*kujN1(b){
 let k=0;
 while(true){
  if(k%58===0){
   const bx=rnd(60,W-60);
   b.S({x:bx,y:b.y()+10,v:DV(1),ang:90,g:'bubble:lime',r:16,
    fn(u){if(u.t>70){u.v*=0;fxRing(u.x,u.y,'#b0ff30',6,60,3,18);
     for(let i=0;i<DN(8);i++)b.S({x:u.x,y:u.y,v:DV(3),ang:i*360/DN(8)+rnd(10),g:'ball:lime'});
     return false;}return true;}});
  }
  if(k%37===5){
   const px=rnd(30,W-30),py=rnd(60,H*.6);
   fxSpark(px,py,'#b0ff30',12);
   b.S({x:px,y:H+14,v:DV(2.8),ang:-90,g:'bubble:green',r:rnd(7,11),
    fn(u){const pop=40+(u.seed||0)%50;
     if(u.t===pop){for(let i=0;i<DN(4);i++)b.S({x:u.x,y:u.y,v:DV(2.5),ang:i*90+45,g:'ball:green',r:4});fxRing(u.x,u.y,'#b0ff30',3,20,2,14);return false;}
     return true;}});
  }
  if(k%30===15)b.fan(b.x(),b.y(),DN(6),DV(3.3),50,null,'ball:green');
  k++;yield;
 }
}
function*kujS(b){
 yield*b.mv(W/2,95,45);
 let t=0;
 while(true){
  if(t%130===0){
   const bx=rnd(60,W-60),hgt=rnd(H*.3,H*.55),seg=DN(5);
   addText(bx,H-hgt-16,'▲','#b8d89a',15,70);
   for(let i=0;i<seg;i++)
    b.S({x:bx+rnd(-8,8),y:H-12-i*(hgt/seg),v:DV(.75),ang:-90,g:'bubble:green',r:rnd(9,14),seed:i,
     fn(u){
      if(u.t>120){
       for(let s=0;s<4;s++)b.S({x:u.x,y:u.y,v:DV(2.3),ang:s*90+45,g:'ball:lime',r:4});
       return false;
      }
      return true;
     }});
  }
  if(t%9===0)
   b.S({x:rnd(20,W-20),y:H+16,v:DV(rnd(1.6,2.2)),ang:-90,g:'bubble:green',r:rnd(7,11),
    fn(u){if(u.t>110){for(let i=0;i<4;i++)b.S({x:u.x,y:u.y,v:DV(2.4),ang:i*90+45,g:'ball:green',r:4});return false;}return true;}});
  if(t%170===85)b.ring(b.x(),b.y(),DN(14),DV(2.2),t*9,'ball:lime');
  t++;yield;
 }
}

/* ================= STAGE 3 ================= */

/* Lumen - light */
function*lumN1(b){
 let k=0,spin=rnd(360);
 const prism=['red','yellow','green','cyan'];
 while(true){
  if(k%5===0){
   spin+=6;
   for(let ray=0;ray<4;ray++){
    const a=spin+ray*90;
    b.S({x:b.x(),y:b.y(),v:DV(4.8),ang:a,g:'rice:'+prism[ray],r:3});
    b.S({x:b.x(),y:b.y(),v:DV(3.2),ang:a+9,g:'rice:'+prism[(ray+1)%4],r:3});
   }
  }
  if(k%56===28){
   const a=b.aim();
   b.arc(b.x(),b.y(),DN(9),DV(3.4),a-64,a+64,'ball:white',{acc:DV(.03)});
  }
  if(k%180===130)yield*b.mv(rnd(130,W-130),95,40);
  k++;yield;
 }
}
function*lumS(b){
 yield*b.mv(W/2,100,45);
 let t=0;
 while(t<3400){
  if(t%180===0){
   screenFlash(.28,'#fffbe0');sfx('warn');
   const ga=rnd(360);
   for(let ray=0;ray<DN(10);ray++)
    for(let s=0;s<4;s++)
     b.S({x:b.x(),y:b.y(),v:DV(2+s*1.5),ang:ga+ray*360/DN(10),g:s%2?'ball:yellow':'orb:white',r:s%2?4:7});
  }
  if(t%7===0)b.ring(b.x(),b.y(),DN(4),DV(2),t*13,'ball:white',{r:3});
  t++;yield;
 }
}
function*lumS2(b){
 yield*b.mv(W/2,108,45);
 const cols=['red','orange','yellow','green','teal','blue','purple'];
 let t=0;
 while(t<3300){
  if(t%4===0){
   const ci=Math.floor(t/4)%cols.length;
   b.S({x:b.x(),y:b.y(),v:DV(.6),ang:b.aim()+rnd(-30,30),g:'ball:'+cols[ci],acc:DV(.12),max:DV(7)});
  }
  if(t%120===60){b.ring(b.x(),b.y(),DN(14),DV(3.4),rnd(360),'star:'+pick(cols));}
  if(t%300===240)yield*b.mv(rnd(120,W-120),rnd(90,140),40);
  t++;yield;
 }
}

/* Iyozane - immortal war */
function*iyzN1(b){
 let f=0;
 while(true){
  const cols=DN(9),gap=irnd(1,cols-2);
  yield*b.mv(W/2+(f%2?70:-70),92,26);
  const soldiers=[];
  for(let i=0;i<cols;i++){
   if(i===gap)continue;
   soldiers.push(b.S({x:40+i*((W-80)/(cols-1)),y:-14,v:DV(2.4),ang:90,g:'amulet:gray',r:5,
    fn(u){if(u.t===46){u.vx=0;u.vy=0;}if(u.t===74){const a=b.aim(u.x,u.y)*Math.PI/180;
     u.vx=Math.cos(a)*DV(4.6);u.vy=Math.sin(a)*DV(4.6);}return true;}}));
  }
  yield 34;
  b.fan(b.x(),b.y(),DN(5),DV(4),36,null,'kunai:blue');
  yield 60;
  f++;
 }
}
function*iyzS(b){
 yield*b.mv(W/2,100,45);
 let t=0;
 while(t<3400){
  if(t%70===0){
   b.fan(b.x(),b.y(),DN(7),DV(4),44,null,'kunai:blue',
    {fn(u){if(u.t===46){fxSpark(u.x,u.y,'#bcd0ff');const a=b.aim(u.x,u.y);
      u.vx=Math.cos(a*Math.PI/180)*DV(5.4);u.vy=Math.sin(a*Math.PI/180)*DV(5.4);}return true;}});
  }
  if(t%23===0)b.S({x:rnd(0,W),y:-12,v:DV(2.4),ang:90,g:'ball:red',r:4});
  if(t%250===190)yield*b.mv(rnd(120,W-120),100,40);
  t++;yield;
 }
}

/* Ooya - quick sword */
function*ooyN1(b){
 let k=0;
 while(k<330){
  if(k%62===0){
   const vert=Math.random()<.5;
   for(let i=0;i<3;i++){
    spawnLaser({x:vert?rnd(40,W-40):rnd(60,W-60),y:vert?-10:rnd(40,H*.6),
     ang:vert?90:(k%124<62?12:168),len:H+40,warm:44,dur:26,wid:12,col:'#ff9050'});
   }
   b.fan(b.x(),b.y(),DN(9),DV(3.8),70,null,'star:orange');
  }
  k++;yield;
 }
}
function*ooyS(b){
 yield*b.mv(W/2,96,45);
 let t=0;
 while(true){
  if(t%140===20){
   const mx=clamp(PL.x,40,W-40),my=clamp(PL.y-20,40,H-40);
   addText(mx,my,'✦','#ffd050',30,42);sfx('warn');
   yield 36;
   const slashA=Math.atan2(my-b.y(),mx-b.x())*180/Math.PI+rnd(-14,14);
   spawnLaser({x:b.x(),y:b.y(),ang:slashA,len:720,warm:8,dur:13,wid:12,col:'#ffd050'});
   for(let s=-2;s<=2;s++)
    b.S({x:b.x(),y:b.y(),v:DV(4.6),ang:slashA+s*9,g:'kunai:white'});
   fxSlash(b.x()+Math.cos(slashA*Math.PI/180)*180,b.y()+Math.sin(slashA*Math.PI/180)*180,slashA,1.4);
   sfx('laser');shake(5,2);
  }
  if(t%19===9)b.fan(b.x(),b.y(),DN(3),DV(3.4),26,null,'ball:orange');
  if(t%300===250)yield*b.mv(rnd(120,W-120),100,34);
  t++;yield;
 }
}

/* Kaisen - lucky toad */
function*kaiN1(b){
 let k=0;
 while(true){
  if(k%46===0){
   const x0=b.x(),dir=k%92<46?1:-1;
   for(let j=0;j<3;j++){
     b.S({x:x0,y:b.y(),v:DV(4+j*.6),ang:60*dir+(dir>0?20:70),g:'orb:yellow',r:8,
      fn(u){
       let bounces=0;
       if(u.y>H-30&&u.vy>0){
        u.vy*=-.72;fxRing(u.x,u.y,'#ffe060',4,30,2,14);
        for(let i=0;i<DN(5);i++)b.S({x:u.x,y:u.y,v:DV(2.6),ang:180+i*30,g:'ball:yellow',r:4});
        u.av=dir*rnd(6,18);u.dur=999;
        bounces++;
        if(bounces>=3){for(let i=0;i<DN(6);i++)b.S({x:u.x,y:u.y,v:DV(2),ang:i*60+30,g:'ball:orange',r:3});return false;}
       }
       return true;
      }});
   }
  }
  k++;yield;
 }
}
function*kaiS(b){
 yield*b.mv(W/2,100,45);
 let t=0;
 while(t<3400){
  if(t%110===0){
   const tx=rnd(70,W-70);
   yield*b.mv(tx,110,24);
   fxRing(b.x(),b.y(),'#ffe060',6,70,4,20);shake(6,3);sfx('bossHit');
   b.ring(b.x(),b.y(),DN(20),DV(3.2),rnd(360),'ball:yellow',{r:5});
   for(let i=0;i<DN(8);i++)b.S({x:b.x(),y:b.y(),v:DV(rnd(2,5)),ang:rnd(60,120),g:'orb:yellow',r:7,
    fn(u){if(u.y>H-26&&u.vy>0){u.vy*=-.75;for(let q=0;q<DN(4);q++)b.S({x:u.x,y:u.y,v:DV(2.8),ang:225+q*30,g:'ball:orange',r:4});}}});
  }
  if(t%40===20)b.fan(b.x(),b.y(),DN(3),DV(4.4),22,null,'ball:yellow');
  if(t%55===10){
   const cxp=rnd(40,W-40);
   for(let c=0;c<DN(6);c++)
    b.S({x:cxp+c*8-DN(6)*4,y:-12,v:DV(2.2),ang:90+rnd(-14,14),g:'star:yellow',r:5,
     fn(u){u.vy+=.05;if(u.y>H-24&&u.vy>0){u.vy*=-.6;fxSpark(u.x,H-16,'#ffe060',10);}}});
  }
  t++;yield;
 }
}

/* Sese - graveyard */
function*sesN1(b){
 let k=0;
 while(true){
  if(k%80===0){
   const cols=DN(7),rows=3;
   const toward=PL.x<W/2?0:1;
   for(let cIdx=0;cIdx<cols;cIdx++){
    const order=toward?cIdx:(cols-1-cIdx);
    for(let rI=0;rI<rows;rI++){
     const cxp=30+order*((W-60)/(cols-1)),cyp=90+rI*54+rnd(-8,8);
     fxSpark(cxp,cyp,'#aef',14);
     b.S({x:cxp,y:cyp,v:DV(.01),ang:-90,g:'ball:teal',r:5,
      fn(u){if(u.t===26+order*6){fxSpark(u.x,u.y,'#aef',10);
       b.S({x:u.x,y:u.y,v:DV(2.9),ang:b.aim(u.x,u.y)+rnd(-14,14),g:'ball:green',r:4});}
       if(u.t>150)return false;return true;}});
    }
    yield 9;
   }
  }
  if(k%54===27){
   for(let i=0;i<DN(6);i++)
    b.S({x:rnd(0,W),y:H+12,v:DV(2),ang:-90+rnd(-20,20),g:'ball:teal',r:5,
     fn(u){if(u.t>40)u.x+=Math.sin(u.t/9)*1.6;if(u.y<-20)return false;}});
  }
  k++;yield;
 }
}
function*sesS(b){
 yield*b.mv(W/2,98,45);
 let t=0;
 while(t<3400){
  if(t%18===0){
   const x=rnd(0,W);
   b.S({x,y:H+14,v:DV(2.6),ang:-90,g:'ball:green',r:5,
    fn(u){if(u.t===56){const a=b.aim(u.x,u.y);u.vx=Math.cos(a*Math.PI/180)*DV(5);u.vy=Math.sin(a*Math.PI/180)*DV(5);}if(u.y<-20)return false;}});
  }
  if(t%100===0){
   for(let i=0;i<DN(5);i++)spawnLaser({x:rnd(30,W-30),y:-10,ang:90,len:H+30,warm:46,dur:24,wid:12,col:'#aef'});
  }
  t++;yield;
 }
}
function*sesS2(b){
 yield*b.mv(W/2,104,45);
 let t=0;
 while(t<3300){
  if(t%160===0){
   const gx=rnd(60,W-60);
   for(let s=-1;s<=1;s+=2)
    spawnLaser({x:gx+s*40,y:-10,ang:90,len:H+40,warm:50,dur:34,wid:16,col:'#afa'});
   for(let i=0;i<DN(10);i++)
    b.S({x:gx+rnd(-50,50),y:-14,v:DV(3.2),ang:90+rnd(-14,14),g:'orb:white',r:8});
  }
  if(t%30===15){b.ring(b.x(),b.y(),DN(9),DV(3),t*5,'ball:teal');}
  t++;yield;
 }
}

registerBoss('kurohebi','Yamiko',['#5a4632','#c8a86a'],11,148,[{l:225,t:60,p:kuroN1},{l:225,t:60,p:kuroN2},{n:'Darkness “Pitch Curtain Danmaku”',col:'#c8a86a',l:56,t:60,p:kuroS}]);
registerBoss('jun','Amayui',['#4a6a8a','#a0c8e0'],12,144,[{l:230,t:60,p:junN1},{n:'Gloomy Sign “Rainwalk Reverie”',col:'#a0c8e0',l:60,t:60,p:junS}]);
registerBoss('souko','Sumika Haneya',['#8a4a6a','#e0a0c0'],13,146,[{l:235,t:60,p:souN1},{n:'Charm “Petal-Sealing Bloom”',col:'#e0a0c0',l:60,t:60,p:souS}]);
registerBoss('mitsumo','Hyakurei Soko',['#6a4a7a','#c0a0e0'],14,142,[{l:245,t:60,p:mitN1},{n:'Dread “Hundred-Legged Nightmare”',col:'#c0a0e0',l:62,t:60,p:mitS}]);
registerBoss('aoji','Uzuma Sen',['#3a5a8a','#90b8e8'],21,150,[{l:250,t:60,p:aojN1},{n:'Maelstrom “Descending Whirlpool”',col:'#90b8e8',l:64,t:60,p:aojS}]);
registerBoss('shou','Oboro Nume',['#6a5a4a','#cab89a'],22,138,[{l:255,t:60,p:shoN1},{n:'Trigger “Slug Crossroads”',col:'#cab89a',l:64,t:60,p:shoS}]);
registerBoss('tsugumi','Hayakaze Rin',['#8a8a3a','#e8e89a'],23,168,[{l:260,t:60,p:tsgN1},{n:'Valkyrie “Full-Throttle Dash”',col:'#e8e89a',l:66,t:60,p:tsgS},{n:'Tusk — “Endless Spin”',col:'#ffe860',l:70,t:60,p:tsgS2}]);
registerBoss('medias','Hakuseki Mira',['#4a4a7a','#a0a0d8'],24,152,[{l:260,t:60,p:medN1},{n:'Zero Friction “Glass Highway”',col:'#a0a0d8',l:68,t:60,p:medS}]);
registerBoss('kujiru','Numeko Miyako',['#5a7a4a','#b8d89a'],25,134,[{l:265,t:60,p:kujN1},{n:'“Metropolis of Slime”',col:'#b8d89a',l:70,t:60,p:kujS}]);
registerBoss('lumen','Kohaku Hikari',['#8a7a3a','#fff0b0'],31,158,[{l:270,t:60,p:lumN1},{n:'Radiance “Let There Be Brilliance”',col:'#fff0b0',l:74,t:60,p:lumS},{n:'“Prism Overdrive”',col:'#ffffff',l:78,t:60,p:lumS2}]);
registerBoss('iyozane','Chitose Fushira',['#7a6a5a','#d8c8b0'],32,144,[{l:275,t:60,p:iyzN1},{n:'Elixir “Clan Eternal”',col:'#d8c8b0',l:76,t:60,p:iyzS}]);
registerBoss('ooya','Hayaten Kirigaya',['#8a5a2a','#ffc880'],33,156,[{l:280,t:60,p:ooyN1},{n:'Draw “Blade Evil Cannot Face”',col:'#ffc880',l:78,t:60,p:ooyS}]);
registerBoss('kaisen','Manae Kinko',['#7a6a2a','#e8d860'],34,140,[{l:285,t:60,p:kaiN1},{n:'Fortune “Golden Toad’s Gambol”',col:'#e8d860',l:80,t:60,p:kaiS}]);
registerBoss('sese','Yomotsu Haka',['#4a7a6a','#a0e8d0'],35,146,[{l:290,t:60,p:sesN1},{n:'Exhumation “Night Digger”',col:'#a0e8d0',l:82,t:60,p:sesS},{n:'“Sovereign of the Underground”',col:'#ccffdd',l:86,t:60,p:sesS2}]);
