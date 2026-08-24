"use strict";
/* Extra+a Stage + routes */
function*shiN(b){
 let k=0,orbA=0;
 while(true){
  orbA+=4.2;
  if(k%3===0){
   for(let d=0;d<3;d++){
    const px=b.x()+Math.cos(orbA*Math.PI/180+d*120)*44;
    const py=b.y()+10+Math.sin(orbA*Math.PI/180+d*120)*30;
    b.S({x:px,y:py,v:DV(3),ang:b.aim(px,py)+rnd(-8,8),g:'amulet:white',r:5});
   }
  }
  if(k%40===20)b.fan(b.x(),b.y(),DN(6),DV(4),50,null,'kunai:gray');
  if(k%170===140)yield*b.mv(rnd(120,W-120),98,36);
  k++;yield;
 }
}
function*shoS(b){
 yield*b.mv(W/2,96,45);
 let t=0,slot=0;
 while(t<3200){
  if(t%160===0){slot=irnd(0,2);}
  if(slot===0&&t%8===0)b.ring(b.x(),b.y(),DN(4),DV(4),t*13,'ball:red',{r:4});
  if(slot===1&&t%14===0)b.arc(b.x(),b.y(),DN(7),DV(5),b.aim()-60,b.aim()+60,'kunai:blue');
  if(slot===2&&t%30===0)b.ring(b.x(),b.y(),DN(9),DV(2.6),rnd(360),'star:yellow');
  t++;yield;
 }
}
function*preN(b){
 let k=0;
 while(k<330){
  if(k%52===0)
   for(let i=0;i<DN(6);i++)
    b.S({x:b.x(),y:b.y(),v:DV(4.6),ang:70+i*(40/Math.max(DN(6)-1,1))+25,g:'orb:brown',r:7,
     fn(u){if(u.t>26&&u.y>H-24&&u.vy>0){u.vy*=-.7;fxRing(u.x,u.y,'#c85',3,22,2,12);}}});
  if(k%170===150)yield*b.mv(rnd(110,W-110),92,34);
  k++;yield;
 }
}
function*preS(b){
 yield*b.mv(W/2,94,45);
 let t=0;
 while(t<3200){
  if(t%80===0){
   const x=rnd(40,W-40);
   fxRing(x,H-10,'#8f8',6,40,3,18);
   yield 26;
   for(let i=0;i<DN(9);i++)
    b.S({x,y:H-16,v:DV(rnd(3.4,5)),ang:-90+rnd(-26,26),g:'ball:green',r:5});
  }
  if(t%20===10)b.fan(b.x(),b.y(),DN(3),DV(4),22,b.aim(),'orb:brown',{r:6});
  t++;yield;
 }
}
function*empN(b){
 let k=0;
 while(true){
  if(k%46===0){
   const cols=DN(7);
   for(let i=0;i<cols;i++){
    const x=40+i*((W-80)/(cols-1));
    fxSpark(x,-6,'#fff',18);
    b.S({x,y:-14,v:DV(.01),ang:90,g:'amulet:white',r:5,
     fn(u){if(u.t===26)u.acc=DV(.06);if(u.t===44)u.max=DV(6);return true;}});
   }
  }
  if(k%46===23)b.fan(b.x(),b.y(),DN(5),DV(4),36,null,'kunai:gray');
  k++;yield;
 }
}
function*empS(b){
 yield*b.mv(W/2,92,45);
 let t=0;
 while(t<3200){
  if(t%130===0){
   const a=b.aim();
   addText(b.x()+60,b.y(),'→','#ff0',26,40);
   b.S({x:b.x(),y:b.y(),v:DV(.01),ang:a,g:'orb:white',r:9,
    fn(u){if(u.t===30){const aa=b.aim(u.x,u.y)*Math.PI/180;u.vx=Math.cos(aa)*DV(7);u.vy=Math.sin(aa)*DV(7);
     u.fn=null;}return true;}});
   for(let s=-1;s<=1;s+=2)
    for(let q=1;q<=DN(4);q++)
     b.S({x:b.x(),y:b.y(),v:DV(3+q*.5),ang:a+s*q*9,g:'kunai:white'});
  }
  t++;yield;
 }
}
function*brkN(b){
 let k=0,a=rnd(360);
 while(true){
  if(k%4===0){
   a+=17;
   const shards=DN(3),gapA=a+Math.floor(k/40)*47;
   for(let s=0;s<shards;s++){
    const ang=gapA+s*(360/(shards+1));
    b.S({x:b.x(),y:b.y(),v:DV(3.6),ang,g:'crystal:white',r:5,av:(s%2?12:-12),dur:40});
   }
  }
  if(k%90===60)b.ring(b.x(),b.y(),DN(11),DV(2.8),(k*11)%360,'kunai:white');
  k++;yield;
 }
}
function*brkS(b){
 yield*b.mv(W/2,90,45);
 let t=0;
 while(t<3200){
  if(t%64===0){
   const y=rnd(60,H*.7),va=Math.random()<.5;
   spawnLaser({x:va?-10:y,y:va?y:-10,ang:va?0:90,len:va?W+40:H+40,warm:40,dur:18,wid:12,col:'#aef'});
   spawnLaser({x:W+10,y:H-y+40,ang:180,len:W+40,warm:56,dur:18,wid:12,col:'#aef'});
  }
  if(t%16===8)b.fan(b.x(),b.y(),DN(4),DV(5),24,null,'kunai:blue');
  t++;yield;
 }
}
function*brkS2(b){
 yield*b.mv(W/2,84,40);
 const cols=['red','orange','yellow','green','teal','blue','purple'];
 let t=0,row=0;
 while(t<3000){
  if(t%70===0){
   row++;
   for(let ci=0;ci<cols.length;ci++){
    const dir=row%2?1:-1;
    spawnLaser({x:dir>0?-10:W+10,y:40+ci*(H-80)/(cols.length-1),ang:dir>0?0:180,len:W+40,warm:44,dur:20,wid:10,col:'#fff'});
   }
   screenFlash(.15,'#fff');shake(6,3);
  }
  if(t%12===6)b.S({x:b.x(),y:b.y(),v:DV(5),ang:b.aim()+rnd(-20,20),g:'ball:'+pick(cols),r:4});
  t++;yield;
 }
}
function*jinN(b){
 let k=0,swirl=rnd(360);
 while(true){
  swirl+=5;
  if(k%2===0){
   const sa=swirl+pick([0,120,240]);
   const rr=W*.46;
   b.S({x:b.x()+Math.cos(sa)*rr,y:b.y()+Math.sin(sa)*rr*.6,v:DV(1),ang:sa+180,g:'amulet:gray',r:5,
    fn(u){
     if(u.t<80){const inw=(u.t/80)*DV(3);u.vx=Math.cos((sa+180)*Math.PI/180)*inw+Math.cos(u.t/9)*1.1;u.vy=Math.sin((sa+180)*Math.PI/180)*inw*.7;}
     if(u.t===90){const a=b.aim(u.x,u.y)*Math.PI/180;u.vx=Math.cos(a)*DV(4.4);u.vy=Math.sin(a)*DV(4.4);}
    }});
  }
  if(k%110===80)b.ring(b.x(),b.y(),DN(13),DV(2.6),rnd(360),'ball:gray');
  if(k%220===190)yield*b.mv(rnd(120,W-120),100,38);
  k++;yield;
 }
}
function*jinS(b){
 yield*b.mv(W/2,96,45);
 let t=0;
 while(t<3200){
  const talent=(t/200|0)%5;
  if(t%200===0)sfx('declare'),addText(b.x()+70,b.y()-20,['Whirl','Rain','Fan','Wall','Storm'][talent],'#ccc',16,50);
  if(talent===0&&t%10===0)b.ring(b.x(),b.y(),DN(3),DV(3.6),t*17,'ball:gray');
  if(talent===1&&t%5===0)b.S({x:rnd(0,W),y:-12,v:DV(5),ang:90+rnd(-8,8),g:'rice:white',r:3});
  if(talent===2&&t%26===0)b.fan(b.x(),b.y(),DN(7),DV(4.6),54,null,'kunai:white');
  if(talent===3&&t%120===60){
   const gap=rnd(60,W-60);
   for(let x=10;x<W;x+=24){if(Math.abs(x-gap)<58)continue;b.S({x,y:-12,v:DV(3.8),ang:90,g:'ball:white',r:4});}
  }
  if(talent===4&&t%40===0)for(let i=0;i<DN(14);i++)b.S({x:b.x(),y:b.y(),v:DV(rnd(3,6)),ang:rnd(360),g:'crystal:gray',r:5});
  t++;yield;
 }
}
function*yabN(b){
 let k=0;
 while(k<330){
  if(k%44===0){
   for(const s of [-1,1]){
    const px=clamp(PL.x+s*130,30,W-30);
    fxSpark(px,-8,'#ccb',16);
    for(let i=0;i<3;i++)b.S({x:px,y:-12-i*12,v:DV(4+i*.6),ang:88,g:'rice:white',r:3});
   }
  }
  if(k%44===22)b.fan(b.x(),b.y(),DN(6),DV(4),44,null,'ball:white');
  k++;yield;
 }
}
function*yabS(b){
 yield*b.mv(W/2,92,45);
 let t=0;
 while(t<3100){
  if(t%170===0){
   sfx('warn');
   for(let w=0;w<3;w++)
    for(let i=0;i<DN(5);i++)
     b.S({x:w*W/3+i*(W/3/Math.max(DN(5)-1,1)),y:-14,v:DV(3.4+w*.5),ang:90,g:'ball:white',r:4});
   yield 40;
   for(let w=0;w<3;w++)
    for(let i=0;i<DN(5);i++)
     b.S({x:i*(W/Math.max(DN(5)-1,1)),y:-14,v:DV(3.4+w*.5),ang:90,g:'ball:white',r:4});
  }
  if(t%18===9)b.S({x:b.x(),y:b.y(),v:DV(4.4),ang:b.aim(),g:'kunai:white'});
  t++;yield;
 }
}
function*turN1(b){
 let k=0,a=0;
 while(k<340){
  a+=5;
  if(k%3===0){
   b.S({x:b.x(),y:b.y(),v:DV(3),ang:a,g:'ball:white',r:4});
   b.S({x:b.x(),y:b.y(),v:DV(2.4),ang:a+180,g:'ball:gray',r:4});
  }
  if(k%180===150)yield*b.mv(rnd(120,W-120),95,36);
  k++;yield;
 }
}
function*turN2(b){
 let k=0;
 while(k<330){
  if(k%60===0){
   for(let s=0;s<3;s++)
    spawnLaser({x:b.x(),y:b.y(),ang:b.aim()+(s-1)*26,len:640,warm:44,dur:18,wid:10,col:'#bbb'});
  }
  if(k%60===30)b.ring(b.x(),b.y(),DN(12),DV(3),rnd(360),'kunai:gray');
  k++;yield;
 }
}
function*turS1(b){
 yield*b.mv(W/2,86,45);
 let t=0;
 while(t<3100){
  if(t%6===0){
   const mir={x:clamp(2*b.x()-PL.x,10,W-10)};
   b.fan(b.x(),b.y(),DN(3),DV(4.6),16,b.aim(),'kunai:white');
   b.S({x:mir.x,y:b.y(),v:DV(4.6),ang:b.aim(mir.x,b.y()),g:'kunai:gray'});
  }
  if(t%240===200)yield*b.mv(rnd(120,W-120),95,32);
  t++;yield;
 }
}
function*turS2(b){
 yield*b.mv(W/2,82,40);
 let t=0;
 while(t<3000){
   if(t%58===0){
    const a=rnd(360);
    for(let s=-2;s<=2;s++){
     const bl=b.S({x:b.x(),y:b.y(),v:DV(5.2),ang:a+s*10,g:'kunai:white',seed:s,
      fn(u){if(u.t===30){const aa=(b.aim(u.x,u.y)+ (u.seed||0))*Math.PI/180;u.vx=Math.cos(aa)*DV(6.4);u.vy=Math.sin(aa)*DV(6.4);}return true;}});
    }
    fxSlash(b.x(),b.y(),a,1.2);sfx('laser');
   }
   if(t%14===3)b.S({x:b.x(),y:b.y(),v:DV(3),ang:b.aim()+Math.sin(t/11)*46,g:'ball:gray',r:4});
  t++;yield;
 }
}
function*turS3(b){
 yield*b.mv(W/2,78,40);
 let t=0;
 while(true){
  if(t%200===40){
   screenFlash(.3,'#000');sfx('warn');shake(8,4);
   for(let w=0;w<3;w++){
    const bx=rnd(70,W-70),by=rnd(60,H*.5);
    fxRing(bx,by,'#000',4,34,6,26);
    b.S({x:bx,y:by,v:DV(.55),ang:90,g:'ball:black',r:10,keep:true,
     fn(u){
      if(u.t===52){
       fxRing(u.x,u.y,'#fff',6,60,5,22);shake(4,2);
       for(let i=0;i<DN(12);i++)
        b.S({x:u.x+Math.cos(i*360/DN(12))*14,y:u.y+Math.sin(i*360/DN(12))*14,v:DV(3.1),ang:i*360/DN(12)+rnd(6),g:'kunai:white',r:3});
       return false;
      }
      return true;
     }});
   }
  }
  if(t%13===0)b.S({x:b.x(),y:b.y(),v:DV(4),ang:b.aim()+rnd(-26,26),g:'kunai:white'});
  if(t%36===18)b.ring(b.x(),b.y(),DN(7),DV(2.2),rnd(360),'orb:white',{r:6});
  t++;yield;
 }
}
function*suxN(b){
 let k=0;
 while(k<330){
  if(k%4===0){
   const pint=2;
   for(let i=0;i<pint+1;i++)
    b.S({x:b.x()+(i-1)*16,y:b.y(),v:DV(9),ang:-90,g:'rice:white',r:3});
  }
  if(k%90===60)b.fan(b.x(),b.y(),DN(5),DV(4),40,null,'kunai:red');
  k++;yield;
 }
}
function*suxS(b){
 yield*b.mv(W/2,90,42);
 let t=0;
 while(t<3000){
  if(t%30===0){
   const a=t*13%360;
   for(let s=0;s<2;s++)
    b.S({x:b.x(),y:b.y(),v:DV(3.4),ang:a+s*180,g:'ball:pink',r:5});
  }
  if(t%120===60){
   screenFlash(.2,'#fdf');sfx('graze');
   b.ring(b.x(),b.y(),DN(16),DV(3.6),rnd(360),'star:pink',{r:6});
  }
  if(t%260===230)yield*b.mv(rnd(120,W-120),100,34);
  t++;yield;
 }
}
function*shrN(b){
 let k=0;
 while(k<330){
  if(k%6===0)
   b.S({x:b.x()+rnd(-60,60),y:b.y()+rnd(-10,10),v:DV(2.8),ang:b.aim()+rnd(-24,24),g:pick(['ball:white','ball:gray']),r:4});
  if(k%120===90)b.ring(b.x(),b.y(),DN(14),DV(2.8),rnd(360),'kunai:white');
  k++;yield;
 }
}
function*shrS1(b){
 yield*b.mv(W/2,84,44);
 let t=0;
 while(t<3000){
  screenFlash(.05,'#000');
   if(t%14===0){
    const dark=Math.random()<.55;
    b.S({x:rnd(0,W),y:-12,v:DV(4.2),ang:90+rnd(-10,10),g:dark?'ball:black':'ball:white',r:5});
   }
   if(t%170===85){
    const gap=rnd(60,W-60);
    for(let x=8;x<W;x+=26){if(Math.abs(x-gap)<84)continue;
     b.S({x,y:-12,v:DV(3.5),ang:90,g:Math.random()<.5?'ball:black':'ball:white',r:4});}
   }
  t++;yield;
 }
}
function*shrS2(b){
 yield*b.mv(W/2,80,40);
 let t=0;
 while(t<2900){
  if(t%46===0){
   const a=b.aim();
   for(let s=-3;s<=3;s++)
    b.S({x:b.x(),y:b.y(),v:DV(6),ang:a+s*7,g:'kunai:white',seed:s,
     fn(u){if(u.t===26){const aa=(b.aim(u.x,u.y)+ (u.seed||0))*Math.PI/180;u.vx=Math.cos(aa)*DV(6);u.vy=Math.sin(aa)*DV(6);}return true;}});
  }
  if(t%13===6)b.S({x:b.x(),y:b.y(),v:DV(2.6),ang:b.aim()+rnd(-60,60),g:'ball:gray',r:4});
  t++;yield;
 }
}
function*shrS3(b){
 yield*b.mv(W/2,76,40);
 let t=0;
 while(t<2800){
  if(t%140===0){
   sfx('warn');
   for(let i=0;i<DN(8);i++){
    const px=rnd(30,W-30),py=rnd(50,H*.5);
    b.S({x:px,y:py,v:DV(.01),ang:0,g:'orb:white',r:10,
     fn(u){if(u.t===50){fxRing(u.x,u.y,'#fff',10,90,5,22);
      for(let q=0;q<DN(8);q++)b.S({x:u.x,y:u.y,v:DV(3.4),ang:q*360/DN(8)+rnd(6),g:'ball:white',r:4});
      return false;}return true;}});
   }
  }
  if(t%8===0)b.S({x:b.x(),y:b.y(),v:DV(3.8),ang:b.aim()+rnd(-40,40),g:'kunai:white'});
  t++;yield;
 }
}
registerBoss('shitodo','Yotsuba Trio',['#4a4a5a','#c0c0d0'],81,150,[{l:380,t:60,p:shiN},{n:'Household Sign “Chaotic Routine”',col:'#c0c0d0',l:136,t:60,p:shoS}]);
registerBoss('preschool','Haniwa Youchien',['#5a6a4a','#c8e0a0'],82,144,[{l:390,t:60,p:preN},{n:'Undead Playtime “Haniwa Recess”',col:'#c8e0a0',l:140,t:60,p:preS}]);
registerBoss('emperor','Mikado Shin',['#5a5a6a','#e0e0f0'],83,152,[{l:400,t:60,p:empN},{n:'First Decree “Order Absolute”',col:'#e0e0f0',l:144,t:60,p:empS}]);
registerBoss('brokenteam','Hakudan Hebi',['#3a4a5a','#a0c0e0'],84,158,[{l:410,t:60,p:brkN},{n:'Heavenly Snake “Fractured Waltz”',col:'#a0c0e0',l:148,t:60,p:brkS},{n:'“TRIPLE MOW”',col:'#ffffff',l:152,t:60,p:brkS2}]);
registerBoss('jinbei','Kamishiro Jin',['#4a5a5a','#c0d8d8'],85,146,[{l:420,t:60,p:jinN},{n:'Senri Craft “Untested Talents”',col:'#c0d8d8',l:156,t:60,p:jinS}]);
registerBoss('yabusameX','Yabusame',['#6a5a4a','#dccbaa'],86,154,[{l:430,t:60,p:yabN},{n:'“Parallel Worlds Collide”',col:'#dccbaa',l:160,t:60,p:yabS}]);
registerBoss('tsurubami','Shiraha Tsubame',['#3a3a3a','#bbbbbb'],87,164,[{l:450,t:60,p:turN1},{l:450,t:60,p:turN2},
 {n:'“Monochrome Frenzy”',col:'#cccccc',l:170,t:70,p:turS1},
 {n:'Successor Blade “Spirit Heirloom”',col:'#dddddd',l:180,t:70,p:turS2},
 {n:'Calamity “Ink of the Void”',col:'#888888',l:190,t:70,p:turS3}]);
registerBoss('suzumiex','Suzumi EX',['#7a2030','#ff5070'],88,168,[{l:440,t:60,p:suxN},{n:'Scarlet Scar “Never Forgotten”',col:'#ff5070',l:170,t:70,p:suzS},{n:'“Tsu-ba-ku-raaa~!”',col:'#ffb0c8',l:175,t:70,p:suxS}]);
registerBoss('shrineteam','Shrine Team',['#2a2a2a','#eeeeee'],89,172,[{l:460,t:60,p:shrN},
 {n:'“World Drained of Color”',col:'#eeeeee',l:185,t:70,p:shrS1},
 {n:'Black Blade “Engraved Severance”',col:'#ffffff',l:195,t:70,p:shrS2},
 {n:'Soul Seal “Your Spirit Is Mine”',col:'#dddddd',l:205,t:70,p:shrS3}]);

const ROUTES=[
 {id:'S1',title:'Stage 1',bosses:['kurohebi','jun','souko','mitsumo'],seed:101,tint:[46,34,58]},
 {id:'S2',title:'Stage 2',bosses:['aoji','shou','tsugumi','medias','kujiru'],seed:102,tint:[22,38,60]},
 {id:'S3',title:'Stage 3',bosses:['lumen','iyozane','ooya','kaisen','sese'],seed:103,tint:[48,48,26]},
 {id:'S4',title:'Stage 4',bosses:['hooaka','hibaru','kaoru','garaiya'],seed:104,tint:[30,42,66],mode:'fog'},
 {id:'S5',title:'Stage 5',bosses:['kuroji','sukune','taira','sanra','para'],seed:105,tint:[54,32,22]},
 {id:'S6',title:'Stage 6',bosses:['clause','yaorochi','saragimaru','shion','mitori','chouki'],seed:106,tint:[38,18,50]},
 {id:'EX',title:'Extra Stage',bosses:['haiji','yago','xeno','tenkai','kokoro','suzumi'],seed:107,tint:[16,48,42],mode:'back'},
 {id:'EXA',title:'Extra+a Stage',bosses:['shitodo','preschool','emperor','brokenteam','jinbei','yabusameX','tsurubami','suzumiex','shrineteam'],seed:108,tint:[10,10,16],mode:'neg'}
];
