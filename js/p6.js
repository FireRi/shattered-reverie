"use strict";
/* Stage 6 */
function*claN1(b){
 let a=0,k=0;
 yield*b.mv(W/2,110,40);
 while(true){
  if(k%5===0){a+=7.5;
   for(let arm=0;arm<3;arm++){
    const ang=a+arm*120;
    b.S({x:b.x(),y:b.y(),v:DV(2.4),ang,g:'star:purple'});
    if(k%15===0)b.S({x:b.x(),y:b.y(),v:DV(1.4),ang:ang+60,g:'ball:purple',r:4,alpha:.8});
   }
  }
  if(k%120===90){
   const aa=b.aim();
   b.arc(b.x(),b.y(),DN(5),DV(3.6),aa-40,aa+40,'kunai:purple');
  }
  if(k%150===75){
   const pts=[];
   for(let i=0;i<3;i++){
    const px=rnd(56,W-56),py=rnd(52,H*.44);
    pts.push([px,py]);
    addText(px,py,'✦','#d8b0ff',14,48);
    b.S({x:px,y:py,v:0,ang:0,g:'star:purple',r:6,keep:true,
     fn(u){if(u.t===46){
      for(let s=-1;s<=1;s++)
       b.S({x:u.x,y:u.y,v:DV(4),ang:b.aim(u.x,u.y)+s*9,g:'rice:purple',r:3});
      fxSpark(u.x,u.y,'#c080e8',9);
      return false;}return true;}});
   }
   for(let i=0;i<3;i++){
    const p=pts[i],q=pts[(i+1)%3];
    const aa=Math.atan2(q[1]-p[1],q[0]-p[0])*180/Math.PI;
    spawnLaser({x:p[0],y:p[1],ang:aa,len:Math.hypot(q[0]-p[0],q[1]-p[1]),
     warm:28,dur:6,wid:2,col:'#c080e8',lethal:false});
   }
  }
  k++;yield;
 }
}
function*claS(b){
 yield*b.mv(W/2,96,45);
 let t=0,armA=rnd(360);
 while(true){
  if(t%5===0){
   armA+=3.1;
   const rr=Math.min(t%(360*4),240)/240*W*.55+40;
   b.S({x:b.x()+Math.cos(armA)*rr,y:b.y()+Math.sin(armA)*rr*.7,v:DV(.9),ang:armA+90,g:'ball:purple',r:3,alpha:.75});
  }
  if(t%230===0){
   const gap=rnd(90,W-90);
   for(let i=0;i<=W/16;i++){
    const x=i*16;
    if(Math.abs(x-gap)<80)continue;
    const bend=(x-W/2)/W*46;
    b.S({x,y:-16-Math.abs(bend),v:DV(2.6),ang:90+bend*.6,g:'star:purple',r:6});
   }
   sfx('warn');
  }
  if(t%24===0)b.S({x:b.x(),y:b.y(),v:DV(3.4),ang:b.aim()+rnd(-30,30),g:'ball:purple',r:4});
  t++;yield;
 }
}
function*yaoN1(b){
 let k=0;
 while(k<330){
  if(k%76===0){
   const y=rnd(120,H*.65);
   for(const dir of [1,-1])
    spawnLaser({x:dir>0?-10:W+10,y,ang:dir>0?0:180,len:W+40,warm:40,dur:22,wid:14,col:'#8fa'});
   b.fan(b.x(),b.y(),DN(8),DV(4),60,null,'kunai:green');
  }
  if(k%88===44){
   const gap=clamp(PL.x+rnd(-54,54),34,W-34);
   addText(gap,26,'∨','#aef',18,40);
   for(let x=10;x<W;x+=22){
    if(Math.abs(x-gap)<36)continue;
    b.S({x,y:-12,v:DV(2.8),ang:90,g:'ball:green',r:4,
     fn(u){u.x+=Math.sin((u.t+(u.x|0))/20)*.8;}});
   }
  }
  k++;yield;
 }
}
function*yaoS(b){
 yield*b.mv(W/2,88,45);
 let t=0;
 while(t<3300){
  if(t%150===0){
   screenFlash(.25,'#dfe');shake(8,4);sfx('warn');
   const slit=W/2+rnd(-90,90);
   for(let x=20;x<W;x+=40){
    if(Math.abs(x-slit)<52)continue;
    spawnLaser({x,y:-10,ang:90,len:H+40,warm:44,dur:26,wid:12,col:'#8fa'});
   }
   for(let i=0;i<DN(10);i++)b.S({x:slit+rnd(-30,30),y:-12,v:DV(3.6),ang:90,g:'ball:green',r:5});
  }
  if(t%19===9)b.fan(b.x(),b.y(),DN(4),DV(4.2),26,null,'kunai:green');
  t++;yield;
 }
}
function*yaoS2(b){
 yield*b.mv(W/2,84,45);
 let t=0;
 while(t<3200){
  if(t%170===0){
   const slit=clamp(PL.x+rnd(-70,70),50,W-50);
   addText(slit,26,'SKYFALL','#ccffdd',12,52);
   for(let x=12;x<W;x+=18){
    if(Math.abs(x-slit)<50)continue;
    b.S({x,y:-16-Math.abs(x-slit)*.12,v:DV(2.5),ang:90,g:'ball:green',r:5});
   }
   for(let i=0;i<DN(8);i++)
    b.S({x:slit+rnd(-22,22),y:-12,v:DV(4),ang:90+rnd(-5,5),g:'kunai:white'});
  }
  if(t%120===60)
   spawnLaser({x:rnd(20,W-20),y:-10,ang:90,len:H+40,warm:42,dur:16,wid:16,col:'#afa'});
  if(t%50===25){
   for(let i=0;i<DN(4);i++)
    b.S({x:rnd(30,W-30),y:-20,v:DV(2.5),ang:90,g:'crystal:green',r:6,acc:DV(.045),max:DV(5),
     fn(u){if(u.y>H-24){
      b.ring(u.x,u.y,DN(4),DV(2.4),rnd(360),'ball:green',{r:3});
      fxBurst(u.x,u.y,'#ccffdd',5,3);return false;}return true;}});
  }
  if(t%150===70)b.ring(b.x(),b.y(),DN(10),DV(2.8),rnd(360),'ball:green');
  t++;yield;
 }
}
function*sarN1(b){
 let k=0;
 while(k<330){
  if(k%30===0){
   b.fan(b.x(),b.y(),DN(4),DV(4.2),26,null,'kunai:blue');
   const mirX=W-b.x(),base=b.aim(mirX,b.y());
   for(let i=0;i<DN(4);i++)
    b.S({x:clamp(mirX,20,W-20),y:b.y(),v:DV(4.2),ang:base+(i-(DN(4)-1)/2)*9,g:'kunai:dblue'});
   if(k%60===30)
    b.S({x:W/2,y:b.y(),v:DV(2.2),ang:90,g:'crystal:red',r:5,av:3,dur:60});
  }
  k++;yield;
 }
}
function*sarS(b){
 yield*b.mv(W/2,100,45);
 let t=0;
 while(t<3300){
  const ph=Math.floor(t/360)%3;
  if(t%360===0){
   addText(W/2,66,['MIRROR','SWORD','JEWEL'][ph],'#8090ff',19,60);
   screenFlash(.14,'#8090ff');sfx('declare');
  }
  if(ph===0){
   if(t%32===0){
    const mx=W-b.x(),my=b.y();
    b.ring(mx,my,DN(8),DV(2.6),t*9,'ball:blue',{r:4});
    for(const s of [-1,1])
     b.S({x:mx,y:my,v:DV(3.4),ang:b.aim(mx,my)+s*15,g:'rice:dblue',r:3});
   }
   if(t%12===0)b.S({x:b.x(),y:b.y(),v:DV(3),ang:b.aim()+rnd(-20,20),g:'kunai:blue',r:3});
  }else if(ph===1){
   if(t%72===0){
    const a=b.aim();
    spawnLaser({x:b.x(),y:b.y(),ang:a,len:720,warm:34,dur:12,wid:10,col:'#8090ff'});
    spawnLaser({x:W-b.x(),y:b.y(),ang:180-a,len:720,warm:44,dur:12,wid:10,col:'#8090ff'});
    for(let s=-2;s<=2;s++)
     b.S({x:b.x(),y:b.y(),v:DV(4.2),ang:a+s*10,g:'kunai:white'});
   }
   if(t%18===9)b.S({x:rnd(0,W),y:rnd(70,200),v:DV(3.2),ang:90+rnd(-25,25),g:'ball:blue',r:4});
  }else{
   if(t%44===0){
    const mx=W-b.x(),my=b.y();
    for(let i=0;i<6;i++){
     const a=i*60+t*2;
     b.S({x:b.x()+Math.cos(a*Math.PI/180)*44,y:b.y()+Math.sin(a*Math.PI/180)*30,
      v:DV(.4),ang:a,g:'crystal:red',r:5,av:2,dur:180});
     b.S({x:mx+Math.cos(a*Math.PI/180)*44,y:my+Math.sin(a*Math.PI/180)*30,
      v:DV(.4),ang:180-a,g:'crystal:blue',r:5,av:-2,dur:180});
    }
   }
   if(t%20===10)b.S({x:b.x(),y:b.y(),v:DV(2.8),ang:b.aim()+rnd(-16,16),g:'rice:yellow',r:3});
  }
  if(t%300===240)yield*b.mv(rnd(120,W-120),100,32);
  t++;yield;
 }
}
function*shiN1(b){
 let k=0;
 yield*b.mv(W/2,102,45);
 while(k<330){
  const heads=[[-46,'red'],[0,'green'],[46,'white']];
  for(const [off,c] of heads){
   const hx=b.x()+off,hy=b.y()+10;
   if(off<0&&k%44===0)b.fan(hx,hy,DN(6),DV(4.2),46,b.aim(hx,hy),'ball:'+c,{r:4});
   if(off===0&&k%10===0)b.S({x:hx,y:hy,v:DV(3.4),ang:b.aim(hx,hy)+Math.sin(k/8)*32,g:'rice:'+c,r:3});
   if(off>0&&k%64===0)
    for(let i=0;i<DN(5);i++)b.S({x:hx,y:hy,v:DV(2.4),ang:rnd(360),g:'crystal:'+c,r:5});
  }
  if(k%150===120)yield*b.mv(rnd(130,W-130),105,40);
  k++;yield;
 }
}
function*shiS(b){
 yield*b.mv(W/2,102,45);
 let t=0;
 const heads=[[-46,'red'],[0,'green'],[46,'white']];
 while(t<3300){
  for(const [off,c] of heads){
   const hx=b.x()+off,hy=b.y()+10;
   if(off<0&&t%26===0)b.fan(hx,hy,DN(5),DV(4.6),36,b.aim(hx,hy),'ball:'+c,{r:4});
   if(off===0&&t%8===0)b.S({x:hx,y:hy,v:DV(3),ang:b.aim(hx,hy)+Math.sin(t/9)*40,g:'rice:'+c,r:3,
    fn(u){u.vx+=Math.sin(u.t/13)*.05;}});
   if(off>0&&t%60===0)for(let i=0;i<DN(4);i++)b.S({x:hx,y:hy,v:DV(2.2),ang:rnd(360),g:'crystal:'+c,r:5});
  }
  if(t%110===55){
   for(let i=0;i<3;i++){
    const [off,c]=heads[i];
    b.ring(b.x()+off,b.y()+10,DN(4),DV(2.5),t*7+i*120,'ball:'+c,{r:4});
   }
  }
  if(t%280===240)yield*b.mv(rnd(130,W-130),105,40);
  t++;yield;
 }
}
function*mtoN1(b){
 let k=0,pumpCycle=0;
 while(true){
  pumpCycle=k%70;
  if(pumpCycle<4||(pumpCycle>10&&pumpCycle<14)){
   b.S({x:b.x(),y:b.y(),v:DV(3.8),ang:b.aim()+Math.sin(k/7)*28,g:'ball:red',r:4});
  }
  if(pumpCycle===35)b.ring(b.x(),b.y(),DN(10),DV(2.2),k*13,'kunai:red');
  if(k%5===0)b.S({x:b.x()+rnd(-20,20),y:b.y(),v:DV(2),ang:90+rnd(-15,15),g:'rice:red',r:3,
   fn(u){u.x+=Math.sin(u.t/11)*1.2;}});
  if(k%140===95){
   const gap=clamp(PL.x+rnd(-54,54),34,W-34);
   addText(gap,H-40,'⌃','#ff8080',20,44);
   for(let x=12;x<W;x+=24){
    if(Math.abs(x-gap)<38)continue;
    b.S({x,y:H+14,v:DV(1.9),ang:-90,g:'ball:red',r:5,
     fn(u){u.x+=Math.sin(u.t/18)*.5;}});
   }
  }
  k++;yield;
 }

}
function*mtoS(b){
 yield*b.mv(W/2,98,45);
 let t=0;
 while(true){
  if(t%9===0){
   const lane=(t/9|0)%3;
   for(let s=0;s<2;s++){
    const seed=lane+s*1.5;
    b.S({x:(lane+.5)*(W/3)+Math.cos(t/16)*26,y:-14,v:DV(3),ang:90,g:'orb:red',r:6,seed,
     fn(u){u.x+=Math.sin(u.t/17+(u.seed||0)*2.09)*30/17;}});
   }
  }
  if(t%120===60){
   const nx=W/4+rnd(0,W/2);
   fxRing(nx,rnd(80,220),'#ff8080',3,22,2,16);
   for(let i=0;i<DN(5);i++)b.S({x:nx,y:rnd(70,210),v:DV(2.8),ang:i*72+36,g:'ball:red',r:3});
  }
  if(t%200===120){
   const gap=clamp(PL.x+rnd(-58,58),34,W-34);
   addText(gap,H-36,'tide','#ff8080',10,48);
   for(let x=12;x<W;x+=22){
    if(Math.abs(x-gap)<40)continue;
    b.S({x,y:H+14,v:DV(1.8),ang:-90,g:'ball:red',r:5,
     fn(u){u.x+=Math.sin(u.t/16)*.6;}});
   }
  }
  if(t%90===0){b.fan(b.x(),b.y(),DN(6),DV(4.2),54,null,'kunai:red');}
  if(t%260===200)yield*b.mv(rnd(120,W-120),100,40);
  t++;yield;
 }
}
function*choN1(b){
 let k=0;
 while(k<330){
  if(k%58===0){
   const a=rnd(360);
   spawnLaser({x:b.x(),y:b.y(),ang:a,len:560,warm:36,dur:16,wid:8,col:'#edb'});
   spawnLaser({x:b.x(),y:b.y(),ang:a+180,len:560,warm:36,dur:16,wid:8,col:'#edb'});
   fxSlash(b.x(),b.y(),a,1.1);
  }
  if(k%29===14){
   b.ring(b.x(),b.y(),DN(8),DV(3),k*7,'ball:gray',{r:4});
   const px=rnd(30,W-30),py=rnd(60,H*.6);
   b.S({x:px,y:py,v:0,ang:0,g:'kunai:white',r:4,keep:true,
    fn(u){if(u.t===24){
     const a=b.aim(u.x,u.y)*Math.PI/180;
     u.vx=Math.cos(a)*DV(5.2);u.vy=Math.sin(a)*DV(5.2);u.keep=false;
     fxSpark(u.x,u.y,'#fed',7);
    }return true;}});
  }
  k++;yield;
 }
}
function*choS(b){
 yield*b.mv(W/2,94,45);
 let t=0;
 while(t<3200){
  if(t%40===0){
   const va=t%80===0;
   for(let i=0;i<5;i++){
    const y=60+i*((H-80)/5)+(va?0:24);
    spawnLaser({x:va?-10:rnd(0,W),y,ang:va?0:90,len:va?W+30:200,warm:34,dur:14,wid:9,col:'#fed'});
   }
  }
  if(t%180===120){
   const gap=clamp(PL.x+rnd(-52,52),34,W-34);
   addText(gap,26,'stitch','#f0e0b0',10,44);
   for(let x=12;x<W;x+=20){
    if(Math.abs(x-gap)<38)continue;
    b.S({x,y:-12,v:DV(2.2),ang:90,g:'ball:gray',r:4,
     fn(u){u.x+=Math.sin(u.t/14)*.6;}});
   }
  }
  if(t%24===12)b.fan(b.x(),b.y(),DN(3),DV(5),18,b.aim(),'kunai:white');
  t++;yield;
 }
}
registerBoss('clause','Setsu Amanogawa',['#5a2a6a','#c080e8'],61,150,[{l:320,t:60,p:claN1},{n:'Great Wall “Spiral of Distant Stars”',col:'#c080e8',l:96,t:60,p:claS}]);
registerBoss('yaorochi','Souka Kirihane',['#2a6a3a','#80e8a0'],62,156,[{l:330,t:60,p:yaoN1},{n:'Perfect Cut “Parting the Clouds”',col:'#80e8a0',l:100,t:60,p:yaoS},{n:'“No More Sky”',col:'#ccffdd',l:104,t:60,p:yaoS2}]);
registerBoss('saragimaru','Sarashina Jun',['#2a3a8a','#8090ff'],63,152,[{l:335,t:60,p:sarN1},{n:'Three Treasures “Mirror, Sword, Jewel”',col:'#8090ff',l:104,t:60,p:sarS}]);
registerBoss('shion','Kyouzou Ran',['#5a3a5a','#d0a0d0'],64,146,[{l:340,t:60,p:shiN1},{n:'Chimera Soul “Three Heads, One Wish”',col:'#d0a0d0',l:108,t:60,p:shiS}]);
registerBoss('mitori','Akitsu Michiru',['#6a2a2a','#ff8080'],65,158,[{l:345,t:60,p:mtoN1},{n:'Crimson Tide “Weaving Red Rivers”',col:'#ff8080',l:112,t:60,p:mtoS}]);
registerBoss('chouki','Nui Hojo',['#6a5a3a','#f0e0b0'],66,154,[{l:350,t:60,p:choN1},{n:'Grudge Stitch “Almost-Torn Seams”',col:'#f0e0b0',l:116,t:60,p:choS}]);
