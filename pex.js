"use strict";
/* Extra Stage */
function*haiN1(b){
 let k=0;
 while(true){
  if(k%70===0){
   const gx=rnd(50,W-50);
   for(let i=0;i<DN(5);i++)
    b.S({x:gx,y:-12-i*22,v:DV(1.8),ang:90,g:'bubble:blue',r:rnd(7,12),seed:i,
     fn(u){u.x+=Math.sin((u.t+(u.seed||0)*30)/26)*1.3;}});
  }
  if(k%70===35)b.fan(b.x(),b.y(),DN(5),DV(3.4),40,null,'ball:purple');
  if(k%170===130)yield*b.mv(rnd(120,W-120),100,40);
  k++;yield;
 }
}
function*haiS(b){
 yield*b.mv(W/2,100,45);
 let t=0;
 while(t<3200){
  if(t%170===120){
   screenFlash(.5,'#000');sfx('warn');
   yield 26;
   yield*b.mv(clamp(PL.x+rnd(-90,90),60,W-60),clamp(PL.y-160,70,190),12);
   b.ring(b.x(),b.y(),DN(14),DV(4),b.aim(),'ball:blue',{r:5});
   screenFlash(.35,'#88f');
  }
  if(t%9===4)b.S({x:b.x(),y:b.y(),v:DV(2.2),ang:b.aim()+rnd(-50,50),g:'bubble:purple',r:rnd(6,11)});
  t++;yield;
 }
}
function*yagoN1(b){
 let k=0;
 while(k<340){
  if(k%80<50&&k%6===0)
   b.S({x:b.x(),y:b.y(),v:DV(.5),ang:b.aim()+rnd(-16,16),g:'kunai:gray',acc:DV(.18),max:DV(7)});
  if(k%80===52){addText(b.x(),b.y()-34,'*click*','#aaa',13,30);}
  if(k%80===78)b.ring(b.x(),b.y(),DN(12),DV(3),k*9,'ball:gray');
  if(k%200===180)yield*b.mv(rnd(120,W-120),100,36);
  k++;yield;
 }
}
function*yagoS(b){
 yield*b.mv(W/2,92,45);
 let t=0;
 while(t<3300){
  if(t%240===0){
   const a=b.aim();
   addText(W/2,150,'CHARGING','#fa0',18,60);sfx('warn');
   spawnLaser({x:b.x(),y:b.y(),ang:a,len:700,warm:76,dur:20,wid:22,col:'#f80'});
   for(let i=0;i<DN(12);i++)
    b.S({x:b.x(),y:b.y(),v:DV(rnd(2,5)),ang:a+rnd(-70,70),g:'crystal:orange',r:5});
  }
  if(t%14===0)b.S({x:b.x(),y:b.y(),v:DV(3),ang:b.aim()+rnd(-24,24),g:'ball:orange',r:4});
  if(t%300===260)yield*b.mv(rnd(130,W-130),100,34);
  t++;yield;
 }
}
function*xenoN1(b){
 const PIPS=[[],[4],[2,6],[2,4,6],[0,2,4,6,8],[0,2,3,5,6,8],[0,1,2,3,5,6,7,8]];
 let k=0;
 while(true){
  if(k%64===0){
   const roll=irnd(1,6);
   const face=PIPS[roll];
   const gx=rnd(90,W-90),gy=rnd(60,150),cell=17;
   addText(gx-14,gy-26,String(roll)+'!','#ff0',20,44);
   for(const pip of face){
    const px=gx+(pip%3-1)*cell,py=gy+(Math.floor(pip/3)-1)*cell;
    b.S({x:px,y:py,v:DV(2.6),ang:90,g:'star:yellow',r:5,
     fn(u){if(u.t===40){const a=b.aim(u.x,u.y);u.vx=Math.cos(a*Math.PI/180)*DV(4.2);u.vy=Math.sin(a*Math.PI/180)*DV(4.2);}return true;}});
   }
   if(roll===6){
    b.ring(gx+cell,gy+cell,DN(12),DV(3.4),rnd(360),'ball:yellow',{r:4});
    addText(gx-8,gy+34,'LUCKY 7x','#fff',13,36);
   }
  }
  if(k%140===110)yield*b.mv(rnd(120,W-120),100,38);
  k++;yield;
 }
}
function*xenoS(b){
 yield*b.mv(W/2,100,45);
 let t=0;
 while(t<3200){
  if(t%180===0){
   sfx('warn');
   const burst=irnd(1,3);
   for(let q=0;q<burst;q++){
    const bx=rnd(60,W-60),by=rnd(70,220);
    fxSpark(bx,by,'#fff',20);
    yield 30;
    b.ring(bx,by,DN(12),DV(3.6),rnd(360),'orb:white',{r:8});
    shake(5,3);
   }
  }
  if(t%12===0)b.S({x:b.x(),y:b.y(),v:DV(3.4),ang:b.aim()+rnd(-36,36),g:'ball:yellow',r:4});
  t++;yield;
 }
}
function*tenN1(b){
 let k=0,fold=1;
 while(k<330){
  if(k%56===0){
   fold*=-1;
   for(let w=0;w<2;w++)
    b.arc(b.x(),b.y(),DN(8),DV(3.4+w),fold>0?200:340,fold>0?340:200,'rice:white',{r:3});
  }
  if(k%170===130)yield*b.mv(rnd(120,W-120),95,40);
  k++;yield;
 }
}
function*tenS(b){
 yield*b.mv(W/2,96,45);
 let t=0;
 while(t<3200){
  if(t%200===0){
   sfx('warn');
   for(const x of [30,W-30])
    spawnLaser({x,y:-10,ang:x<W/2?78:102,len:H+60,warm:60,dur:60,wid:20,col:'#f93'});
   for(const y of [40,H*.55])
    spawnLaser({x:-10,y,ang:12,len:W+60,warm:80,dur:60,wid:20,col:'#f93'});
  }
  if(t%15===0)b.fan(b.x(),b.y(),DN(4),DV(4.4),30,null,'star:orange');
  if(DIFF===2&&t%300===250){screenFlash(.2,'#f93');
   for(let i=0;i<DN(20);i++)b.S({x:b.x(),y:b.y(),v:DV(rnd(4,7)),ang:rnd(360),g:'ball:orange',r:5});}
  t++;yield;
 }
}
function*tenS2(b){
 yield*b.mv(W/2,90,40);
 const cols=['red','orange','yellow','green','teal','blue','purple'];
 let t=0;
 while(t<3000){
  if(t%4===0){
   const ci=(t/4|0)%cols.length;
   b.S({x:b.x(),y:b.y(),v:DV(4.5+Math.sin(t/40)*2.4),ang:t*17%360,g:'ball:'+cols[ci],r:5});
  }
  if(t%90===0){b.ring(b.x(),b.y(),DN(10),DV(5),rnd(360),'star:'+pick(cols));shake(3,2);}
  t++;yield;
 }
}
function*kokN1(b){
 let k=0;
 while(k<330){
  if(k%66===0){
   for(let s=-1;s<=1;s+=2)
    b.S({x:b.x(),y:b.y(),v:DV(3.4),ang:b.aim()+s*70,g:'star:pink',r:6,
     fn(u){if(u.t===44){const a=b.aim(u.x,u.y)+Math.PI;u.vx=Math.cos(a)*DV(4.6);u.vy=Math.sin(a)*DV(4.6);}return true;}});
  }
  if(k%33===16)b.fan(b.x(),b.y(),DN(4),DV(3.8),30,null,'ball:pink');
  k++;yield;
 }
}
function*kokS(b){
 yield*b.mv(W/2,100,45);
 const moods=[['RAGE','red'],['SORROW','blue'],['JOY','yellow'],['CALM','green']];
 let t=0;
 while(true){
  const mi=Math.floor(t/260)%4;
  const [mname,mcol]=moods[mi];
  if(t%260===0){screenFlash(.15,'#fff');addText(W/2,168,'♪ '+mname,'#fff',22,55);sfx('declare');}
  if(mi===0&&t%20===0)b.fan(b.x(),b.y(),DN(5),DV(4.4),42,null,'ball:red',{r:4});
  if(mi===1&&t%6===0)b.S({x:b.x(),y:b.y(),v:DV(2.7),ang:b.aim()+Math.sin(t/12)*55,g:'ball:blue',r:4,
   fn(u){u.vy+=.012;}});
  if(mi===2&&t%46===23)b.ring(b.x(),b.y(),DN(11),DV(3),t*9,'star:yellow',{r:5});
  if(mi===3&&t%16===8){
   const x=rnd(20,W-20);
   b.S({x,y:-10,v:DV(1.9),ang:90,g:'ball:green',r:5,seed:t,
    fn(u){u.x+=Math.sin((u.t+(u.seed||0))/24)*1.2;}});
  }
  if(t%14===7&&fx.length<300)
   fx.push({t:'trail',x:b.x()+rnd(-40,40),y:b.y()+rnd(-30,30),c:mcol,life:16,max:16});
  if(t%330===300)yield*b.mv(rnd(120,W-120),105,34);
  t++;yield;
 }
}
function*suzN1(b){
 let k=0;
 while(k<330){
  if(k%48===0){
   const x=rnd(30,W-30);
   for(let i=0;i<DN(8);i++)
    b.S({x,y:-12-i*10,v:DV(4.4),ang:90+rnd(-5,5),g:'rice:red',r:3});
  }
  if(k%48===24){
   for(let i=0;i<3;i++)
    b.S({x:W*i/2-10,y:rnd(40,120),v:DV(5),ang:90,g:'rice:red',r:3});
  }
  k++;yield;
 }
}
function*suzS(b){
 yield*b.mv(W/2,96,45);
 let t=0;
 const trail=[];
 while(t<3200){
  trail.push([b.x(),b.y()]);
  if(trail.length>40)trail.shift();
  if(t%150===100){
   screenFlash(.25,'#f88');sfx('warn');
   const snap=pick(trail.filter(p=>p[1]<H*.6))||[W/2,100];
   yield*b.mv(snap[0],snap[1],8);
   b.ring(b.x(),b.y(),DN(16),DV(4.2),rnd(360),'ball:red',{r:5});
  }
  if(t%12===0)b.S({x:b.x(),y:b.y(),v:DV(3.4),ang:b.aim()+rnd(-26,26),g:'kunai:red'});
  t++;yield;
 }
}
registerBoss('haiji','Tobari Yoi',['#3a4a6a','#90a0c8'],71,148,[{l:350,t:60,p:haiN1},{n:'Dream Lock “Between Blinks”',col:'#90a0c8',l:118,t:60,p:haiS}]);
registerBoss('yago','Zouei Arata',['#6a3a42','#e0a0ac'],72,144,[{l:360,t:60,p:yagoN1},{n:'“The Unfinished Masterpiece”',col:'#e0a0ac',l:122,t:60,p:yagoS}]);
registerBoss('xeno','Senri Bakuchi',['#5a5a4a','#ffe880'],73,152,[{l:370,t:60,p:xenoN1},{n:'All-In “Fortune’s Wildest Deal”',col:'#ffe880',l:126,t:60,p:xenoS}]);
registerBoss('tenkai','Tsuru Kaihou',['#6a4a2a','#ffb060'],74,156,[{l:380,t:60,p:tenN1},{n:'Boundary Ward “Crane’s New Perch”',col:'#ffb060',l:130,t:60,p:tenS},{n:'“SUPER INTENSIFY”',col:'#ffd080',l:134,t:60,p:tenS2}]);
registerBoss('kokoro','Menou Kana',['#8a3a2a','#ff9070'],75,150,[{l:390,t:60,p:kokN1},{n:'Masked Heart “Exorcism of Feelings”',col:'#ff9070',l:134,t:60,p:kokS}]);
registerBoss('suzumi','Ato Suzumi',['#6a2a2a','#ff6060'],76,162,[{l:400,t:60,p:suzN1},{n:'Scar “The Memory That Stays”',col:'#ff6060',l:138,t:60,p:suzS}]);
