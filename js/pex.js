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
  if(k%170===118)
   addText(b.x(),b.y()+34,'blink','#a8b8e0',10,28);
  if(k%170===130){
   fxRing(b.x(),b.y(),'#90a0c8',5,50,3,20);
   yield*b.mv(rnd(120,W-120),100,40);
   b.ring(b.x(),b.y(),DN(10),DV(2.4),rnd(360),'ball:blue',{r:4});
  }
  k++;yield;
 }
}
function*haiS(b){
 yield*b.mv(W/2,100,45);
 let t=0;
 while(t<3200){
  if(t%170===120){
   screenFlash(.5,'#000');sfx('warn');
   const ox=b.x(),oy=b.y();
   for(let i=0;i<2;i++)
    b.S({x:ox+(i*2-1)*24,y:oy,v:0,ang:0,g:'orb:white',r:6,keep:true,
     fn(u){if(u.t===44){
      b.ring(u.x,u.y,DN(6),DV(2.6),rnd(360),'ball:blue',{r:4});
      return false;}return true;}});
   yield 26;
   yield*b.mv(clamp(targetPlayer().x+rnd(-90,90),60,W-60),clamp(targetPlayer().y-160,70,190),12);
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
  if(k%150===96){
   const gap=clamp(targetPlayer().x+rnd(-46,46),36,W-36);
   addText(gap,26,'brush','#fa0',10,40);
   for(let x=10;x<W;x+=20){
    if(Math.abs(x-gap)<38)continue;
    b.S({x,y:-12-Math.abs(x-gap)*.1,v:DV(2.3),ang:90,g:'ball:orange',r:4});
   }
  }
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
  if(t%240===120){
   const a=b.aim();
   b.arc(b.x(),b.y(),DN(9),DV(3.2),a-62,a+62,'crystal:orange',{r:5});
   addText(b.x(),b.y()-38,'stroke','#fa0',10,36);
  }
  if(t%300===260)yield*b.mv(rnd(130,W-130),100,34);
  t++;yield;
 }
}
const DICE_PIPS=[[],[4],[0,8],[2,4,6],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]];
const DICE_NAMES=['','ACE HIGH','SPLIT POT','TRIPLE THREAT','FOUR CORNERS','FIVE ALIVE','SIX-SHOOTER'];
function xenoDiceFx(x,y,roll,life,s){
 if(fx.length>=300)return;
 fx.push({t:'dice',x,y,n:roll,pips:DICE_PIPS[roll],life,max:life,s:s||28,col:'#ffe880'});
}
function xenoDiceAttack(b,roll,x,y,boost){
 const aim=b.aim(x,y);
 if(roll===1){
  b.ring(x,y,DN(8),DV(2.2),rnd(360),'ball:yellow',{r:4,acc:DV(.012)});
  b.S({x,y,v:DV(3.8),ang:aim,g:'orb:white',r:8});
 }else if(roll===2){
  for(const s of [-1,1])b.fan(x+s*13,y,DN(3),DV(3.4),28,b.aim(x+s*13,y)+s*8,'ball:yellow',{r:4});
 }else if(roll===3){
  for(let i=-1;i<=1;i++)b.fan(x,y,DN(3),DV(3.3),18,aim+i*32,'rice:yellow',{r:3});
 }else if(roll===4){
  for(let i=0;i<4;i++){
   const a=45+i*90;
   b.fan(x,y,DN(2),DV(3.2),14,a,'rice:yellow',{r:3});
   b.S({x,y,v:DV(2.4),ang:a,g:'kunai:yellow',r:3,av:(i%2?-1:1)*12,dur:72});
  }
 }else if(roll===5){
  b.ring(x,y,DN(9),DV(2.7),rnd(360),'star:yellow',{r:4,av:DV(2.2),dur:64});
  for(let i=0;i<5;i++)b.S({x,y,v:DV(3.4),ang:aim+i*72,g:'ball:yellow',r:4,av:4,dur:42});
 }else{
  b.ring(x,y,DN(11),DV(3.3),rnd(360),'orb:white',{r:7});
  for(let i=0;i<6;i++)b.S({x,y,v:DV(2.9),ang:i*60+rnd(-4,4),g:'ball:yellow',r:4,av:7,dur:96});
 }
 if(boost)b.fan(x,y,DN(2),DV(3.1),16,aim,'rice:white',{r:3});
}
function*xenoN1(b){
 let k=0;
 while(true){
  if(k%90===0){
   const roll=irnd(1,6);
   const gx=rnd(100,W-100),gy=rnd(104,184);
   xenoDiceFx(gx,gy,roll,64,30);
   addText(gx,gy+38,DICE_NAMES[roll],'#ffe880',11,46);
   yield 24;
   xenoDiceAttack(b,roll,gx,gy,false);
  }
  if(k%16===0)b.S({x:b.x(),y:b.y(),v:DV(3.2),ang:b.aim()+rnd(-34,34),g:'ball:yellow',r:4});
  if(k%190===150)yield*b.mv(rnd(120,W-120),100,38);
  k++;yield;
 }
}
function*xenoDS(b){
 yield*b.mv(W/2,100,42);
 let t=0;
 while(t<3300){
  if(t%150===0){
   const a=irnd(1,6),c=irnd(1,6);
   const y=196;
   xenoDiceFx(W/2-34,y,a,66,28);
   xenoDiceFx(W/2+34,y,c,66,28);
   addText(W/2,y+40,a+' + '+c,'#fff',12,46);
   yield 22;
   xenoDiceAttack(b,a,W/2-34,y,true);
   xenoDiceAttack(b,c,W/2+34,y,true);
   if(a===c){
    addText(W/2,y+59,'DOUBLE!','#ffd45e',18,58);
    screenFlash(.18,'#ffe880');shake(4,3);sfx('spellget');
    b.ring(W/2,y+16,DN(15),DV(3.1),rnd(360),'orb:white',{r:6});
   }
  }
  if(t%13===0)b.S({x:b.x(),y:b.y(),v:DV(3.2),ang:b.aim()+rnd(-40,40),g:'ball:yellow',r:4});
  if(t%220===170)yield*b.mv(rnd(120,W-120),100,34);
  t++;yield;
 }
}
function xenoHandLabel(r,triple,pair,straight){
 const s=r.slice().sort((a,c)=>a-c);
 if(triple)return 'TRIPLE '+r[0]+'s';
 if(pair){
  const v=r[0]===r[1]?r[0]:r[1]===r[2]?r[1]:r[0];
  return 'PAIR OF '+v+'s';
 }
 if(straight)return 'STRAIGHT '+s.join('-');
 return 'HIGH CARD '+s[2];
}
function*xenoS(b){
 yield*b.mv(W/2,100,45);
 let t=0;
 while(t<3600){
  if(t%210===0){
   const r=[irnd(1,6),irnd(1,6),irnd(1,6)];
   const sum=r[0]+r[1]+r[2];
   const sorted=r.slice().sort((a,c)=>a-c);
   const triple=r[0]===r[1]&&r[1]===r[2];
   const pair=!triple&&(r[0]===r[1]||r[1]===r[2]||r[0]===r[2]);
   const straight=sorted[1]===sorted[0]+1&&sorted[2]===sorted[1]+1;
   const y=194;
   for(let i=0;i<3;i++)xenoDiceFx(W/2+(i-1)*38,y,r[i],74,28);
   addText(W/2,y+42,'HAND '+sum+' // '+xenoHandLabel(r,triple,pair,straight),'#ffe880',11,52);
   yield 28;
   b.ring(W/2,y+16,DN(4+Math.round(sum*.45)),DV(2.8),rnd(360),'ball:yellow',{r:4,acc:DV(.01)});
   for(let i=0;i<3;i++){
    const dx=W/2+(i-1)*38;
    b.fan(dx,y+8,DN(2),DV(3.3),18,b.aim(dx,y+8),'rice:yellow',{r:3});
   }
   if(triple){
    addText(W/2,y+61,'JACKPOT!','#fff',20,62);
    screenFlash(.22,'#ffe880');shake(6,4);sfx('spellget');
    b.ring(W/2,y+8,DN(14),DV(3.4),rnd(360),'orb:white',{r:7});
   }else if(pair){
    addText(W/2,y+61,'PAIR','#ffd45e',16,52);
    b.ring(W/2,y+8,DN(7),DV(2.6),rnd(360),'star:yellow',{r:4});
   }else if(straight){
    addText(W/2,y+61,'STRAIGHT','#6ff6ff',16,52);
    for(const dx of [-38,0,38])
     spawnLaser({x:W/2+dx,y:y+20,ang:90,len:H-y,warm:52,dur:26,wid:8,col:'#ffe880'});
   }
  }
  if(t%14===0)b.S({x:b.x(),y:b.y(),v:DV(3.3),ang:b.aim()+rnd(-36,36),g:'ball:yellow',r:4});
  if(t%260===215)yield*b.mv(rnd(120,W-120),100,38);
  t++;yield;
 }
}
function tenHold(u){u.vx=0;u.vy=0;return true;}
function tenEach(tag,fn){
 for(let i=eshots.length-1;i>=0;i--){const u=eshots[i];if(u.tag===tag)fn(u,i);}
}
function tenSketch(b,o,tag){
 b.S(Object.assign({x:b.x(),y:b.y(),v:0,ang:90,g:'ball',c:'dblue',r:4,keep:true,
  hit:false,grazed:true,alpha:.46,tag,fn:tenHold},o));
}
function tenInk(u){u.hit=true;u.grazed=false;u.alpha=1;u.c='orange';}
function tenLaunch(u,a,spd){
 u.fn=null;u.tag=null;u.keep=false;u.hit=true;u.grazed=false;u.alpha=1;u.c='orange';
 u.ang=a;u.v=spd;u.vx=Math.cos(a*Math.PI/180)*spd;u.vy=Math.sin(a*Math.PI/180)*spd;
}
function tenClear(tag,shard){
 tenEach(tag,(u,i)=>{
  if(shard&&fx.length<300)fxShard(u.x,u.y);
  killE(i);
 });
}
function tenCrane(b,cx,cy,tag){
 for(const side of [-1,1])
  for(let i=0;i<=8;i++){
   const u=i/8;
   tenSketch(b,{x:cx+side*(18+u*230),y:cy-8-u*30-Math.sin(u*Math.PI)*58,inkAt:100},tag);
  }
 for(let i=0;i<10;i++){
  const a=i*Math.PI*2/10;
  tenSketch(b,{x:cx+Math.cos(a)*42,y:cy+Math.sin(a)*28,inkAt:175},tag);
 }
 const neck=[[35,-10],[45,-42],[58,-74],[70,-104],[84,-128],[102,-144],[124,-150],[148,-146]];
 neck.forEach((p,i)=>tenSketch(b,{x:cx+p[0],y:cy+p[1],inkAt:i<5?240:999},tag));
}
function*tenN1(b){
 let k=0,tag=null;
 while(true){
  const ct=k%180,cyc=Math.floor(k/180);
  if(ct===0){
   tag={};
   for(const a of [[18,162],[198,342]])
    b.arc(b.x(),b.y(),DN(7),DV(1.6),a[0],a[1],'ball',{c:'dblue',r:4,tag,hit:false,grazed:true,alpha:.46,keep:true});
   addText(b.x(),b.y()+100,'DRAFT '+(cyc%3+1),'#9cf',11,34);
  }
  if(ct===48){
   tenEach(tag,u=>{u.fn=tenHold;u.v=0;});
   addText(b.x(),b.y()+100,'UNFINISHED','#9cf',10,34);
  }
  if(ct>=80&&ct<120)tenEach(tag,u=>{u.alpha=.5+.3*(1+Math.sin(k*.45))/2;});
  if(ct===120){
   if(cyc%3===2){
    addText(b.x(),b.y()+100,'SCRAPPED','#9cf',14,44);
    tenClear(tag,true);
   }else{
    addText(b.x(),b.y()+100,'INKED','#f93',14,44);
    tenEach(tag,u=>tenLaunch(u,u.ang,DV(3.1)));
   }
   tag=null;
  }
  if(k%20===10)b.fan(b.x(),b.y(),DN(3),DV(2.9),26,null,'rice:orange',{r:3});
  if(k%90===45)b.ring(b.x(),b.y(),DN(8),DV(2.2),k*7,'ball:orange',{r:4});
  if(ct===150)yield*b.mv(rnd(120,W-120),100,34);
  k++;yield;
 }
}
function*tenS(b){
 yield*b.mv(W/2,100,45);
 let t=0,tag=null,fr=null;
 while(t<3400){
  const ct=t%300;
  if(ct===0){
   tag={};
   const sides=['top','bottom','left','right'],fw=250,fh=190;
   fr={cx:clamp(targetPlayer().x,fw/2+12,W-fw/2-12),cy:clamp(targetPlayer().y,fh/2+12,H-fh/2-12),w:fw,h:fh,open:sides[irnd(0,3)],ink:false};
   const {cx,cy,w,h,open}=fr;
   const x0=cx-w/2,x1=cx+w/2,y0=cy-h/2,y1=cy+h/2;
   const wall=side=>{
    if(open===side)return;
    if(side==='top'||side==='bottom'){
     const y=side==='top'?y0:y1;
     for(let x=x0;x<=x1;x+=10)tenSketch(b,{x,y,fs:side,fu:(x-x0)/w},tag);
    }else{
     const x=side==='left'?x0:x1;
     for(let y=y0+10;y<=y1-10;y+=10)tenSketch(b,{x,y,fs:side,fu:(y-y0)/h},tag);
    }
   };
   wall('top');wall('bottom');wall('left');wall('right');
   const lx=open==='left'?x0+24:open==='right'?x1-24:cx;
   const ly=open==='top'?y0+14:open==='bottom'?y1-14:cy;
   addText(lx,ly,'OPEN','#9cf',12,90);
   addText(cx,y0+30,'UNFINISHED','#9cf',12,80);
  }
  if(fr){
   const scl=fr.ink?1-.98*clamp((ct-100)/90,0,1):1;
   const hw=fr.w*.5*scl,hh=fr.h*.5*scl;
   if(fr.ink)tenEach(tag,u=>{
    if(u.fs==='top'){u.x=fr.cx-hw+u.fu*2*hw;u.y=fr.cy-hh;}
    else if(u.fs==='bottom'){u.x=fr.cx-hw+u.fu*2*hw;u.y=fr.cy+hh;}
    else if(u.fs==='left'){u.x=fr.cx-hw;u.y=fr.cy-hh+u.fu*2*hh;}
    else{u.x=fr.cx+hw;u.y=fr.cy-hh+u.fu*2*hh;}
   });
   if(ct>=80&&ct<100)tenEach(tag,u=>{u.alpha=.52+.3*(1+Math.sin(t*.5))/2;});
   if(ct===100){
    fr.ink=true;
    tenEach(tag,tenInk);
    addText(fr.cx,fr.cy,'INK','#f93',14,24);
    screenFlash(.12,'#f93');shake(3,2);
   }
   if(ct===110){
    if(fr.open==='top'||fr.open==='bottom'){
     const y=fr.open==='top'?fr.cy-hh:fr.cy+hh;
     for(let x=fr.cx-hw;x<=fr.cx+hw;x+=10)
      tenSketch(b,{x,y,fs:fr.open,fu:(x-(fr.cx-hw))/(2*hw),seal:true},tag);
    }else{
     const x=fr.open==='left'?fr.cx-hw:fr.cx+hw;
     for(let y=fr.cy-hh;y<=fr.cy+hh;y+=10)
      tenSketch(b,{x,y,fs:fr.open,fu:(y-(fr.cy-hh))/(2*hh),seal:true},tag);
    }
    const sx=fr.open==='left'?fr.cx-hw+24:fr.open==='right'?fr.cx+hw-24:fr.cx;
    const sy=fr.open==='top'?fr.cy-hh+14:fr.open==='bottom'?fr.cy+hh-14:fr.cy;
    addText(sx,sy,'SEAL','#f93',13,24);
   }
   if(ct>=110&&ct<135)tenEach(tag,u=>{if(u.seal)u.alpha=.55+.3*(1+Math.sin(t*.5))/2;});
   if(ct===135){
    tenEach(tag,u=>{if(u.seal)tenInk(u);});
    sfx('warn');
    addText(fr.cx,fr.cy-hh-10,'SEALED','#f93',14,30);
   }
   if(ct===200){
    const ex=fr.cx,ey=fr.cy;
    tenClear(tag,false);tag=null;fr=null;
    addText(ex,ey,'ERASED','#9cf',15,46);
   }
  }
  if(t%20===0)b.S({x:b.x(),y:b.y(),v:DV(2.9),ang:b.aim()+rnd(-30,30),g:'rice:orange',r:3});
  if(ct===240)yield*b.mv(rnd(120,W-120),96,34);
  t++;yield;
 }
}
function*tenS2(b){
 yield*b.mv(W/2,90,40);
 const cx=W/2,cy=258;
 let t=0,tag=null;
 while(t<3400){
  const ct=t%360;
  if(ct===0){
   tag={};
   tenCrane(b,cx,cy,tag);
   addText(cx,cy+118,'CRANE // DRAFT','#9cf',12,60);
  }
  if(ct>=80&&ct<100)tenEach(tag,u=>{if(u.inkAt===100)u.alpha=.55+.3*(1+Math.sin(t*.5))/2;});
  if(ct===100){
   tenEach(tag,u=>{if(u.inkAt===100)tenInk(u);});
   addText(cx,cy-72,'WING INK','#f93',13,42);
   screenFlash(.1,'#f93');shake(3,2);
  }
  if(ct>=155&&ct<175)tenEach(tag,u=>{if(u.inkAt===175)u.alpha=.55+.3*(1+Math.sin(t*.5))/2;});
  if(ct===175){
   tenEach(tag,u=>{if(u.inkAt===175)tenInk(u);});
   addText(cx,cy+72,'BODY INK','#f93',13,42);
  }
  if(ct>=220&&ct<240)tenEach(tag,u=>{if(u.inkAt===240)u.alpha=.55+.3*(1+Math.sin(t*.5))/2;});
  if(ct===240){
   tenEach(tag,u=>{if(u.inkAt===240)tenInk(u);});
   addText(cx+126,cy-166,'HEAD INK','#f93',12,24);
  }
  if(ct===270){
   tenEach(tag,(u,i)=>{if(u.inkAt===999){if(fx.length<300)fxShard(u.x,u.y);killE(i);}});
   addText(cx+132,cy-160,'UNFINISHED','#9cf',12,58);
  }
  if(ct===280){
   tenEach(tag,u=>{
    const a=Math.atan2(u.y-cy,u.x-cx)*180/Math.PI;
    tenLaunch(u,a,DV(2.7));
    u.acc=DV(.008);
   });
   addText(cx,cy+118,'TAKEOFF','#f93',14,46);
   screenFlash(.12,'#f93');shake(4,2);
  }
  if(ct===320){
   tenClear(tag,false);tag=null;
   yield*b.mv(W/2,90,24);
  }
  if(ct%18===9)b.S({x:b.x(),y:b.y(),v:DV(2.9),ang:b.aim()+rnd(-28,28),g:'rice:orange',r:3});
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
  if(k%120===60){
   for(let i=0;i<DN(8);i++)
    b.S({x:b.x(),y:b.y(),v:DV(2.2),ang:i*360/DN(8)+k*3,g:i%2?'star:pink':'star:red',r:5,
     av:i%2?5:-5,dur:80});
  }
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
  if(t%260===0){
   screenFlash(.15,'#fff');addText(W/2,168,'♪ '+mname,'#fff',22,55);sfx('declare');
   b.ring(b.x(),b.y(),DN(12),DV(2.6),rnd(360),'ball:'+mcol,{r:5});
   fxRing(b.x(),b.y(),'#fff',5,58,3,22);
  }
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
 const past=[];
 while(k<330){
  if(k%6===0){
   past.push(clamp(targetPlayer().x,20,W-20));
   if(past.length>20)past.shift();
  }
  if(k%48===0){
   const x=rnd(30,W-30);
   for(let i=0;i<DN(8);i++)
    b.S({x,y:-12-i*10,v:DV(4.4),ang:90+rnd(-5,5),g:'rice:red',r:3});
  }
  if(k%48===24){
   for(let i=0;i<3;i++)
    b.S({x:W*i/2-10,y:rnd(40,120),v:DV(5),ang:90,g:'rice:red',r:3});
  }
  if(k%96===72&&past.length>4){
   const sx=past.shift();
   addText(sx,26,'|','#ff6060',18,28);
   spawnLaser({x:sx,y:-10,ang:90,len:H+40,warm:34,dur:14,wid:8,col:'#ff6060'});
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
   spawnLaser({x:clamp(snap[0],24,W-24),y:-10,ang:90,len:H+30,warm:30,dur:12,wid:7,col:'#ff8080'});
   yield*b.mv(snap[0],snap[1],8);
   b.ring(b.x(),b.y(),DN(16),DV(4.2),rnd(360),'ball:red',{r:5});
   for(const s of [-1,1])
    b.fan(b.x(),b.y(),DN(4),DV(3.4),28,b.aim()+s*28,'kunai:white');
  }
  if(t%12===0)b.S({x:b.x(),y:b.y(),v:DV(3.4),ang:b.aim()+rnd(-26,26),g:'kunai:red'});
  t++;yield;
 }
}
registerBoss('haiji','Tobari Yoi',['#3a4a6a','#90a0c8'],71,148,[{l:350,t:60,p:haiN1},{n:'Dream Lock “Between Blinks”',col:'#90a0c8',l:118,t:60,p:haiS}]);
registerBoss('yago','Zouei Arata',['#6a3a42','#e0a0ac'],72,144,[{l:360,t:60,p:yagoN1},{n:'“The Unfinished Masterpiece”',col:'#e0a0ac',l:122,t:60,p:yagoS}]);
registerBoss('xeno','Senri Bakuchi',['#5a5a4a','#ffe880'],73,152,[{l:330,t:55,p:xenoN1},{n:'Loaded Dice “Double or Nothing”',col:'#ffe880',l:118,t:60,p:xenoDS},{n:'All-In “Fortune’s Wildest Deal”',col:'#ffe880',l:126,t:60,p:xenoS}]);
registerBoss('tenkai','Tsuru Kaihou',['#6a4a2a','#ffb060'],74,156,[{l:380,t:60,p:tenN1},{n:'Unfinished Frame “A Side Left Open”',col:'#8fd8ff',l:130,t:60,p:tenS},{n:'Unfinished Perch “The Crane That Never Lands”',col:'#ffd080',l:134,t:60,p:tenS2}]);
registerBoss('kokoro','Menou Kana',['#8a3a2a','#ff9070'],75,150,[{l:390,t:60,p:kokN1},{n:'Masked Heart “Exorcism of Feelings”',col:'#ff9070',l:134,t:60,p:kokS}]);
registerBoss('suzumi','Ato Suzumi',['#6a2a2a','#ff6060'],76,162,[{l:400,t:60,p:suzN1},{n:'Scar “The Memory That Stays”',col:'#ff6060',l:138,t:60,p:suzS}]);
