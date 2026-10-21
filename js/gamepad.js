(function(){
"use strict";
if(typeof window==='undefined')return;
const STORE_KEY='lasr_gamepad';
const DEFAULT_MAP={shot:0,flash:1,spell:2,focus:4,pause:9,cancel:1};
const LABELS=['A','B','X','Y','LB','RB','LT','RT','VIEW','START','L3','R3','D-UP','D-DOWN','D-LEFT','D-RIGHT','GUIDE'];
const config={enabled:true,map:Object.assign({},DEFAULT_MAP)};
const supported=typeof navigator!=='undefined'&&typeof navigator.getGamepads==='function';
let connected=false,padIndex=-1,padName='',padMapping='',padButtons=0,padAxes=0;
let prevButtons=[],navDir=null,navNext=0;
let capture=null,captureArmed=false,event=null,suppress=false;

function load(){
 try{
  const raw=JSON.parse(localStorage.getItem(STORE_KEY)||'null');
  if(!raw||typeof raw!=='object')return;
  if(typeof raw.enabled==='boolean')config.enabled=raw.enabled;
  if(raw.map&&typeof raw.map==='object')
   for(const k in DEFAULT_MAP){
    const v=raw.map[k];
    if(Number.isInteger(v)&&v>=0&&v<32)config.map[k]=v;
   }
 }catch(e){}
}
function save(){
 try{localStorage.setItem(STORE_KEY,JSON.stringify(config));}catch(e){}
}
function releaseAll(){
 if(typeof padKeys!=='undefined')for(const k in padKeys)padKeys[k]=false;
 if(typeof padEdge!=='undefined')for(const k in padEdge)padEdge[k]=false;
 navDir=null;navNext=0;
}
function findPad(){
 if(!supported)return null;
 let list;
 try{list=navigator.getGamepads();}catch(e){return null;}
 if(!list)return null;
 if(padIndex>=0&&list[padIndex]&&list[padIndex].connected!==false)return list[padIndex];
 for(let i=0;i<list.length;i++){
  const p=list[i];
  if(p&&p.connected!==false)return p;
 }
 return null;
}
function down(pad,i){
 const b=pad.buttons&&pad.buttons[i];
 return !!b&&(b.pressed===true||(typeof b.value==='number'&&b.value>.5));
}
function axisCandidate(axes,ix,iy){
 const ax=Number(axes[ix]),ay=Number(axes[iy]);
 if(!Number.isFinite(ax)||!Number.isFinite(ay))return null;
 if(ax<=-.97&&ay<=-.97)return null;
 const mag=Math.hypot(ax,ay);
 if(mag<.3)return null;
 return {x:Math.abs(ax)>=.22?(ax<0?-1:1):0,y:Math.abs(ay)>=.22?(ay<0?-1:1):0,mag};
}
function readDir(pad,pressed){
 let x=0,y=0;
 if(pressed[12])y-=1;
 if(pressed[13])y+=1;
 if(pressed[14])x-=1;
 if(pressed[15])x+=1;
 if(!x&&!y){
  const axes=pad.axes||[];
  let best=null,bestMag=0;
  for(let i=0;i+1<axes.length&&i<6;i+=2){
   const cand=axisCandidate(axes,i,i+1);
   if(cand&&cand.mag>bestMag){best=cand;bestMag=cand.mag;}
  }
  if(best){x=best.x;y=best.y;}
 }
 return {x,y};
}
function syncWant(want){
 const seen={};
 for(const k in padKeys)seen[k]=1;
 for(const k in want)seen[k]=1;
 for(const k in seen){
  if(want[k]){
   if(!padKeys[k]){padKeys[k]=true;padEdge[k]=true;}
  }else if(padKeys[k])padKeys[k]=false;
 }
}
function assign(action,index){
 if(!Object.prototype.hasOwnProperty.call(DEFAULT_MAP,action))return false;
 if(!Number.isInteger(index)||index<0||index>=32)return false;
 config.map[action]=index;
 save();
 event={type:'bound',action,index};
 return true;
}
function beginCapture(action){
 if(!Object.prototype.hasOwnProperty.call(DEFAULT_MAP,action))return;
 capture=action;captureArmed=false;event=null;
 releaseAll();
}
function cancelCapture(){
 capture=null;captureArmed=false;
}
function setEnabled(on){
 config.enabled=!!on;
 save();
 if(!config.enabled)releaseAll();
}
function setBinding(action,index){return assign(action,index);}
function resetBindings(){
 config.map=Object.assign({},DEFAULT_MAP);
 save();
}
function buttonLabel(index){
 if(index==null||index<0)return '—';
 if((!connected||padMapping==='standard')&&LABELS[index])return LABELS[index];
 return 'BTN '+index;
}
function takeEvent(){
 const out=event;
 event=null;
 return out;
}
function poll(){
 if(typeof padKeys==='undefined'||typeof padEdge==='undefined'||typeof KEY==='undefined')return;
 const pad=findPad();
 if(!pad){
  if(connected){
   connected=false;padIndex=-1;padName='';padMapping='';padButtons=0;padAxes=0;
   prevButtons=[];capture=null;captureArmed=false;suppress=false;
  }
  releaseAll();
  return;
 }
 if(!connected||pad.index!==padIndex||(pad.id||'Controller')!==padName){
  connected=true;padIndex=pad.index;padName=pad.id||'Controller';
  padMapping=pad.mapping||'';padButtons=pad.buttons?pad.buttons.length:0;padAxes=pad.axes?pad.axes.length:0;
  prevButtons=[];navDir=null;navNext=0;
 }
 const buttons=pad.buttons||[];
 const pressed=[];
 let any=false;
 for(let i=0;i<buttons.length;i++){
  pressed[i]=down(pad,i);
  if(pressed[i])any=true;
 }
 const now=Date.now();
 if(suppress){
  if(!any)suppress=false;
  releaseAll();
  prevButtons=pressed;
  return;
 }
 if(capture){
  if(!captureArmed){
   if(!any)captureArmed=true;
   releaseAll();
   prevButtons=pressed;
   return;
  }
  let edge=-1;
  for(let i=0;i<pressed.length;i++)if(pressed[i]&&!prevButtons[i]){edge=i;break;}
  if(edge>=0){
   if(assign(capture,edge))suppress=true;
   capture=null;captureArmed=false;
   releaseAll();
   prevButtons=pressed;
   return;
  }
  releaseAll();
  prevButtons=pressed;
  return;
 }
 const ctx=typeof G!=='undefined'&&G?G.screen:'title';
 const allow=config.enabled||ctx==='controller';
 if(!allow){
  releaseAll();
  prevButtons=pressed;
  return;
 }
 const play=ctx==='play'||ctx==='demo';
 const dir=readDir(pad,pressed);
 const want={};
 if(dir.x<0)want[KEY.LEFT]=true;
 if(dir.x>0)want[KEY.RIGHT]=true;
 if(dir.y<0)want[KEY.UP]=true;
 if(dir.y>0)want[KEY.DOWN]=true;
 if(dir.x||dir.y){
  const nd=Math.abs(dir.y)>=Math.abs(dir.x)?(dir.y<0?KEY.UP:KEY.DOWN):(dir.x<0?KEY.LEFT:KEY.RIGHT);
  if(nd!==navDir){navDir=nd;navNext=now+340;padEdge[nd]=true;}
  else if(now>=navNext){padEdge[nd]=true;navNext=now+120;}
 }else navDir=null;

 const m=config.map;
 if(pressed[m.shot])want[KEY.Z]=true;
 if(pressed[m.spell])want[KEY.C]=true;
 if(play){
  if(pressed[m.flash])want[KEY.X]=true;
  if(pressed[m.focus])want[KEY.SHIFT]=true;
  if(pressed[m.pause])want[KEY.ESC]=true;
 }else if(ctx==='title'){
  if(pressed[m.pause])want[83]=true;
  if(pressed[8])want[72]=true;
 }else{
  if(pressed[m.pause]||pressed[m.cancel])want[KEY.ESC]=true;
 }
 if(ctx==='title'&&pressed[3])want[83]=true;
 syncWant(want);
 if((any||dir.x||dir.y)&&ctx==='title'&&typeof G!=='undefined')G.idleT=0;
 prevButtons=pressed;
}
window.addEventListener('gamepaddisconnected',()=>{releaseAll();capture=null;captureArmed=false;});
load();

window.GamepadSupport={
 config,supported,
 poll,releaseAll,setEnabled,setBinding,resetBindings,buttonLabel,takeEvent,
 beginCapture,cancelCapture,assign,
 get enabled(){return config.enabled;},
 get connected(){return connected;},
 get padName(){return padName;},
 get padMapping(){return padMapping;},
 get padButtons(){return padButtons;},
 get padAxes(){return padAxes;},
 get listening(){return !!capture;},
 get captureArmed(){return captureArmed;},
 get captureAction(){return capture;},
 get padIndex(){return padIndex;}
};
})();
