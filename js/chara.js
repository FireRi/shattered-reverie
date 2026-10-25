"use strict";
/* ================= PLAYER CHARACTERS =================
   Six original shottypes. Each defines its own option layout
   (optStyle/optCount) and firing pattern (fire). Movement speeds
   and bullet visuals differ per character. Data is static so
   online lockstep and replay playback stay deterministic. */

function nearMult(p,range,bonus){
 const t=_ne();
 if(!t)return 1;
 const dx=p.x-t.x,dy=p.y-t.y;
 const d=Math.sqrt(dx*dx+dy*dy);
 return 1+Math.max(-0.35,Math.min(1,(range-d)/range))*bonus;
}
function homeMid(n){const m=Math.floor(n/2);return [m-1,m+1];}
function fireOptions(p,pint,cfg){
 const n=cfg.count;
 updateOptions(p,n);
 if(p.shootT%cfg.every!==0)return;
 const tgt=cfg.home?(_ne()||(typeof nearestMobTo==='function'?nearestMobTo(p.x,p.y):null)):null;
 const mid=homeMid(n);
 for(let i=0;i<n;i++){
  const o=p.opts[i]||{x:p.x,y:p.y};
  const home=!!(cfg.home&&tgt&&(mid[0]===i||mid[1]===i));
  const a=cfg.ang(p,i,n);
  spawnP({x:o.x,y:o.y,v:cfg.v,ang:a,dmg:home?(cfg.dmg*.5):cfg.dmg,type:cfg.type,col:cfg.col,own:p.slot??0,r:cfg.r||4,hom:home?.14:0,tgt});
 }
 if(cfg.sfx!==false)sfx('pshot');
}

const CHARAS=[
 {id:'suzuran',name:'Suzuran',title:'The Border Exorcist',arch:'HOMING',optStyle:'center',
  color:'#5af',accent:'#8fe6ff',outline:'#aabbee',move:5.5,focus:3.2,
  blurb:'Calm drifter who files every youkai like paperwork. Seals mark a target and always find their way home. Safe, forgiving, steady.',
  optCount:pint=>pint>=2?5:3,
  fire(p,pint){
   if(pint>=3)fireMainBeam(p,pint);
   if(p.shootT%4===0){
    spawnP({x:p.x-6,y:p.y-10,v:DV(14),ang:-90,dmg:1.7,type:'shot',col:this.accent,own:p.slot??0});
    spawnP({x:p.x+6,y:p.y-10,v:DV(14),ang:pint>1?-84:-96,dmg:1.7,type:'shot',col:this.accent,own:p.slot??0});
   }
   fireOptions(p,pint,{count:this.optCount(pint),every:4,v:DV(12),dmg:pint>=4?1.15:1.6,type:'amulet',col:this.accent,ang:(p)=>-90,home:true});
  }},

 {id:'kurogane',name:'Kurogane',title:'The Iron Fang',arch:'NEEDLE / SHOTGUN',optStyle:'forward',
  color:'#e0a24a',accent:'#ffd27f',outline:'#e8c98a',move:4.8,focus:2.8,
  blurb:'Retired smith who fights with the boundary-nails she used to forge. Ruinous at point-blank, nearly blind beyond it.',
  optCount:pint=>pint>=3?5:3,
  fire(p,pint){
   const mult=nearMult(p,340,1.05);
   if(p.shootT%3===0){
    const n=p.focus?(pint>=4?5:3):(pint>=2?3:2);
    const spread=p.focus?3:7;
    for(let i=0;i<n;i++){
     const a=-90+(i-(n-1)/2)*spread;
     spawnP({x:p.x,y:p.y-12,v:DV(18),ang:a,dmg:1.7*mult,type:'needle',col:this.accent,own:p.slot??0,r:3});
    }
    sfx('pshot');
   }
   fireOptions(p,pint,{count:this.optCount(pint),every:4,v:DV(17),dmg:1.25*mult,type:'needle',col:this.accent,ang:(p)=>-90,r:3,sfx:false});
  }},

 {id:'kagenui',name:'Kagenui',title:'The Shadow Seamstress',arch:'PIERCING LASER',optStyle:'forward',
  color:'#a884ff',accent:'#d9b8ff',outline:'#e3ccff',move:5.4,focus:3.0,
  blurb:'Tailor who stitches light into spears. Her lances thread straight through crowds and never break stride.',
  optCount:pint=>pint>=3?4:2,
  fire(p,pint){
   if(p.shootT%5===0){
    spawnP({x:p.x,y:p.y-16,v:DV(13),ang:-90,dmg:3.2,type:'lance',col:this.accent,own:p.slot??0,r:5,pierce:p.focus?5:3});
    if(pint>=4){spawnP({x:p.x-12,y:p.y-12,v:DV(13),ang:-90,dmg:2.4,type:'lance',col:this.accent,own:p.slot??0,r:4,pierce:2});}
    if(pint>=4){spawnP({x:p.x+12,y:p.y-12,v:DV(13),ang:-90,dmg:2.4,type:'lance',col:this.accent,own:p.slot??0,r:4,pierce:2});}
    sfx('pshot');
   }
   fireOptions(p,pint,{count:this.optCount(pint),every:6,v:DV(12),dmg:1.7,type:'lance',col:this.accent,ang:(p)=>-90,r:4,sfx:false});
  }},

 {id:'hibari',name:'Hibari',title:'The Skybound Flock',arch:'SPREADSHOT',optStyle:'wide',
  color:'#5fd48a',accent:'#9dffbe',outline:'#b7ffd0',move:6.2,focus:3.4,
  blurb:'Loud, cheerful racer whose shots scatter like startled birds. Clears wide lanes, struggles against single heavies.',
  optCount:pint=>pint>=2?5:3,
  fire(p,pint){
   const focus=p.focus;
   const n=focus?(pint>=3?5:3):(pint>=2?7:5);
   if(p.shootT%3===0){
    if(focus){
     const mult=nearMult(p,280,.9);
     for(let i=0;i<n;i++){
      const a=-90+(i-(n-1)/2)*4.5;
      spawnP({x:p.x,y:p.y-8,v:DV(16),ang:a,dmg:1.8*mult,type:'scatter',col:this.accent,own:p.slot??0,r:4});
     }
    }else{
     for(let i=0;i<n;i++){
      const a=-90+(i-(n-1)/2)*13;
      spawnP({x:p.x,y:p.y-8,v:DV(11),ang:a,dmg:1.35,type:'scatter',col:this.accent,own:p.slot??0,r:4});
     }
    }
    sfx('pshot');
   }
   fireOptions(p,pint,{count:this.optCount(pint),every:4,v:DV(11),dmg:1.1,type:'scatter',col:this.accent,ang:(p,i,n)=>-90+(i-(n-1)/2)*(p.focus?10:16),r:4,home:false,sfx:false});
  }},

 {id:'kaede',name:'Kaede',title:'The Windward Dancer',arch:'ANGLED',optStyle:'side',
  color:'#ff8a5c',accent:'#ffc2a0',outline:'#ffd8c0',move:6.0,focus:3.6,
  blurb:'Blades drift with her motion and lock the instant she stills. Rewards positioning and nerve.',
  optCount:pint=>pint>=3?4:2,
  fire(p,pint){
   const base=p.focus?-90:(p.aimAng||-90);
   const n=p.focus?(pint>=3?5:3):(pint>=2?4:3);
   if(p.shootT%3===0){
    for(let i=0;i<n;i++){
     const a=base+(i-(n-1)/2)*(p.focus?3:7);
     spawnP({x:p.x,y:p.y-10,v:DV(15),ang:a,dmg:2.35,type:'knife',col:this.accent,own:p.slot??0,r:3});
    }
    sfx('pshot');
   }
   fireOptions(p,pint,{count:this.optCount(pint),every:4,v:DV(14),dmg:1.65,type:'knife',col:this.accent,ang:(p)=>p.focus?-90:(p.aimAng||-90),r:3,sfx:false});
  }},

 {id:'yomogi',name:'Yomogi',title:'The Incense Burner',arch:'MISSILE',optStyle:'center',
  color:'#4fc7b0',accent:'#a8ffe6',outline:'#c0fff0',move:5.0,focus:2.9,
  blurb:'Solemn herbalist lobbing slow-burning warheads. Ruinous when lined up, harmless when not.',
  optCount:pint=>pint>=3?4:2,
  fire(p,pint){
   if(p.shootT%8===0){
    spawnP({x:p.x,y:p.y-14,v:DV(7),ang:-90,dmg:3.6,type:'missile',col:this.accent,own:p.slot??0,r:6});
    if(pint>=3){spawnP({x:p.x-10,y:p.y-10,v:DV(7),ang:-90,dmg:2.6,type:'missile',col:this.accent,own:p.slot??0,r:5});}
    if(pint>=3){spawnP({x:p.x+10,y:p.y-10,v:DV(7),ang:-90,dmg:2.6,type:'missile',col:this.accent,own:p.slot??0,r:5});}
    sfx('pshot');
   }
   fireOptions(p,pint,{count:this.optCount(pint),every:9,v:DV(7),dmg:2.2,type:'missile',col:this.accent,ang:(p)=>-90,r:5,home:true,sfx:false});
  }}
];
const CHARA_STATS=[[.5,.6,.4],[.85,.4,.3],[.8,.6,.25],[.5,.85,.9],[.75,.9,.45],[.95,.45,.2]];
const CHARA_VIS=['amulet','needle','lance','scatter','knife','missile'];
const CHARA_COUNT=CHARAS.length;
function charaDef(i){return CHARAS[clamp(i|0,0,CHARA_COUNT-1)];}
function charaOptCount(p){const c=charaDef(p.chara);return c.optCount(Math.floor(p.power/100));}
function charaStep(p){
 const target=p.focus?-90:-90+clamp(p.moveX||0,-1,1)*34;
 let a=p.aimAng===undefined?-90:p.aimAng;
 let d=((target-a+540)%360)-180;
 a+=d*0.18;
 p.aimAng=a;
}
