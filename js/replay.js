"use strict";
const REPLAY_VERSION=3,REPLAY_KEY='lasr_replay',REPLAY_MAX_BYTES=4200000;
const REPLAY_KEYS=[KEY.LEFT,KEY.RIGHT,KEY.UP,KEY.DOWN,KEY.SHIFT,KEY.Z,KEY.X,KEY.C];
const Replay={
 data:null,rec:null,play:null,playback:false,ax:0,ay:0,analog:false,p2ax:0,p2ay:0,p2analog:false,autoFire:null,wantP2:false,
 validText(v,max){
  return typeof v==='string'&&v.length>0&&v.length<=max;
 },
 normalize(d){
  if(!d||typeof d!=='object'||(d.v!==1&&d.v!==2&&d.v!==3))return null;
  if(!Array.isArray(d.inputs)||!Array.isArray(d.rng))return null;
  const inputs=d.inputs;
  if(inputs.length<90||inputs.length%3!==0||inputs.length>5400000)return null;
  if(d.rng.length>2400000)return null;
  const seed=Number.isInteger(d.seed)?(d.seed|0):null;
  const usesSeed=d.v===3&&seed!==null;
  if(!usesSeed&&d.rng.length===0)return null;
  for(let i=0;i<inputs.length;i++){
   if(!Number.isFinite(inputs[i]))return null;
  }
  for(let i=0;i<d.rng.length;i++){
   if(!Number.isFinite(d.rng[i]))return null;
  }
  let p2inputs=null;
  if(d.v>=2&&d.p2inputs!=null){
   if(!Array.isArray(d.p2inputs)||d.p2inputs.length!==inputs.length)return null;
   for(let i=0;i<d.p2inputs.length;i++){
    if(!Number.isFinite(d.p2inputs[i]))return null;
   }
   p2inputs=d.p2inputs.slice();
  }
  const dialogues={};
  if(d.dialogues&&typeof d.dialogues==='object'){
   for(const id of Object.keys(d.dialogues)){
    if(id.length>40)continue;
    const lines=d.dialogues[id];
    if(!Array.isArray(lines)||lines.length!==4)continue;
    const clean=[];
    for(const line of lines){
     if(!Array.isArray(line)||line.length<2)break;
     const who=line[0]==='b'?'b':line[0]==='p'?'p':'';
     const text=String(line[1]||'').replace(/[<>&"\x00-\x1f\x7f]/g,'').trim().slice(0,240);
     if(!who||!text){clean.length=0;break;}
     clean.push([who,text]);
    }
    if(clean.length===4&&clean[0][0]==='b'&&clean[1][0]==='p'&&clean[2][0]==='b'&&clean[3][0]==='p')
     dialogues[id]=clean;
   }
  }
  const diff=Number.isInteger(d.diff)?d.diff:1;
  const flags=Array.isArray(d.flags)?d.flags.map(v=>v===true):[];
  const routeTitles=Array.isArray(d.routeTitles)?d.routeTitles.slice(0,32).map(v=>String(v||'').slice(0,80)):[];
  const result=typeof d.result==='string'?d.result.toUpperCase().replace(/[^A-Z0-9 _-]/g,'').trim().slice(0,16)||'RUN':'RUN';
  return {
   v:REPLAY_VERSION,
   seed:usesSeed?seed:null,
   online:d.online===true,
   dmath:d.v===3&&d.dmath===true,
   inputs:inputs.slice(),
   p2inputs,
   rng:d.rng.slice(),
   dialogues,
   diff:diff>=0&&diff<=5?diff:1,
   diffName:String(d.diffName||'').slice(0,32),
   story:d.story===true,
   oneCC:d.oneCC===true,
   chara:Number.isInteger(d.chara)?clamp(d.chara,0,(typeof CHARA_COUNT!=='undefined'?CHARA_COUNT-1:5)):0,
   p2chara:Number.isInteger(d.p2chara)?clamp(d.p2chara,0,(typeof CHARA_COUNT!=='undefined'?CHARA_COUNT-1:5)):0,
   flags,
   routeTitles,
   autoFire:d.autoFire===true,
   result,
   score:Number.isFinite(d.score)?Math.max(0,Math.floor(d.score)):0,
   spellsPlayed:Number.isFinite(d.spellsPlayed)?Math.max(0,Math.floor(d.spellsPlayed)):0,
   spellsCaptured:Number.isFinite(d.spellsCaptured)?Math.max(0,Math.floor(d.spellsCaptured)):0,
   deaths:Number.isFinite(d.deaths)?Math.max(0,Math.floor(d.deaths)):0,
   frames:Math.floor(inputs.length/3),
   date:Number.isFinite(d.date)?d.date:Date.now()
  };
 },
 load(){
  try{
   const raw=localStorage.getItem(REPLAY_KEY);
   if(!raw)return null;
   return this.normalize(JSON.parse(raw));
  }catch(e){return null;}
 },
 save(d){
  const clean=this.normalize(d);
  if(!clean)return false;
  try{
   const raw=JSON.stringify(clean);
   if(raw.length>REPLAY_MAX_BYTES)return false;
   localStorage.setItem(REPLAY_KEY,raw);
   this.data=clean;
   return true;
  }catch(e){return false;}
 },
 has(){return !!(this.data&&this.data.inputs&&this.data.inputs.length);},
 delete(){this.data=null;try{localStorage.removeItem(REPLAY_KEY);}catch(e){}},
 label(){
  const d=this.data;
  if(!d)return 'EMPTY';
  return (d.online?'ONLINE ':'')+(d.oneCC&&d.story?'STORY 1CC':d.oneCC?'1CC':d.story?'STORY':'ROUTE')+' '+(d.result||'RUN');
 },
 startRecording(config){
  if(this.playback)return;
  this.rec=Object.assign({v:REPLAY_VERSION,inputs:[],rng:[],dialogues:{},result:'RUN',date:Date.now()},config||{});
  SimRng.beginRecord();
 },
 startOnlineRecording(config){
  if(this.playback)return;
  this.rec=Object.assign({v:REPLAY_VERSION,online:true,dmath:true,inputs:[],p2inputs:[],rng:[],dialogues:{},result:'RUN',date:Date.now()},config||{});
 },
 captureNet(mask,ax,ay,mask2,ax2,ay2){
  if(!this.rec||!this.rec.online)return;
  this.rec.inputs.push(mask|0,ax||0,ay||0);
  if(!this.rec.p2inputs)this.rec.p2inputs=[];
  this.rec.p2inputs.push(mask2|0,ax2||0,ay2||0);
 },
 beforeUpdate(){
  if(typeof Net!=='undefined'&&Net&&Net.active)return;
  if(this.playback){this.applyFrame();return;}
  if(!this.rec)return;
  const ins=this.rec.inputs;
  let mask=0,edgeMask=0;
  for(let i=0;i<REPLAY_KEYS.length;i++){
   const k=REPLAY_KEYS[i];
   if(down(k))mask|=1<<i;
   if(edge[k]||padEdge[k])edgeMask|=1<<i;
  }
  mask|=edgeMask<<8;
  if(TouchUI.focus)mask|=1<<16;
  const stick=IS_TOUCH&&TouchUI.stick.active;
  if(stick)mask|=1<<17;
  if(autoFire)mask|=1<<18;
  ins.push(mask,stick?TouchUI.stick.ax:0,stick?TouchUI.stick.ay:0);
  if(typeof players!=='undefined'&&players.length>1){
   if(!this.rec.p2inputs)this.rec.p2inputs=[];
   let mask2=0,edge2=0;
   for(let i=0;i<REPLAY_KEYS.length;i++){
    const k=REPLAY_KEYS[i];
    if(p2keys[k]||pad2Keys[k])mask2|=1<<i;
    if(p2edge[k]||pad2Edge[k])edge2|=1<<i;
   }
   mask2|=edge2<<8;
   this.rec.p2inputs.push(mask2,0,0);
  }
 },
 captureDialogue(id,lines){
  if(!this.rec||!id||!Array.isArray(lines)||lines.length!==4)return;
  const clean=[];
  for(const l of lines){
   if(!Array.isArray(l))return;
   const who=l[0]==='b'?'b':l[0]==='p'?'p':'';
   const text=String(l[1]||'').replace(/[<>&"\x00-\x1f\x7f]/g,'').trim().slice(0,240);
   if(!who||!text)return;
   clean.push([who,text]);
  }
  if(clean.length===4)this.rec.dialogues[id]=clean;
 },
 dialogueFor(id){
  if(!this.playback||!this.play||!id)return null;
  const d=this.play.data.dialogues;
  const lines=d&&d[id];
  return Array.isArray(lines)?lines.map(l=>[l[0],String(l[1])]):null;
 },
 applyFrame(){
  const d=this.play;
  if(!d)return false;
  if(d.idx>=d.data.inputs.length){this.playback=false;return false;}
  const ins=d.data.inputs;
  const off=d.idx;
  const mask=ins[off]|0,ax=ins[off+1]||0,ay=ins[off+2]||0;
  d.idx+=3;
  for(let i=0;i<REPLAY_KEYS.length;i++){
   const k=REPLAY_KEYS[i];
   keys[k]=!!(mask&(1<<i));
   edge[k]=!!(mask&(1<<(i+8)));
   padKeys[k]=false;
   padEdge[k]=false;
  }
  TouchUI.focus=!!(mask&(1<<16));
  this.analog=!!(mask&(1<<17));
  this.ax=ax;this.ay=ay;
  autoFire=!!(mask&(1<<18));
  const p2=d.data.p2inputs;
  if(p2){
   const m2=p2[off]|0,ax2=p2[off+1]||0,ay2=p2[off+2]||0;
   for(let i=0;i<REPLAY_KEYS.length;i++){
    const k=REPLAY_KEYS[i];
    p2keys[k]=!!(m2&(1<<i));
    p2edge[k]=!!(m2&(1<<(i+8)));
    pad2Keys[k]=false;
    pad2Edge[k]=false;
   }
   this.p2analog=!!(m2&(1<<17));
   this.p2ax=ax2;this.p2ay=ay2;
  }
  return true;
 },
 finish(result){
  if(!this.rec)return false;
  const rec=this.rec;this.rec=null;
  const onlineRec=!!rec.online;
  const rng=onlineRec?[]:SimRng.log.slice();
  SimRng.end();
  if(rec.inputs.length<90)return false;
  rec.rng=rng;
  rec.frames=rec.inputs.length/3;
  rec.result=result||rec.result||'RUN';
  rec.score=G.score|0;
  rec.spellsPlayed=G.spellsPlayed|0;
  rec.spellsCaptured=G.spellsCaptured|0;
  rec.deaths=G.deaths|0;
  rec.diffName=DIFFS[rec.diff]||'';
  return this.save(rec);
 },
 abort(){
  this.rec=null;this.wantP2=false;
  this._endMath();
  SimRng.end();
 },
 _endMath(){if(this.dmath&&typeof DMath!=='undefined')DMath.disable();this.dmath=false;},
 start(){
  const d=this.normalize(this.data);
  if(!d)return false;
  this.data=d;
  this.playback=true;
  this.play={data:d,idx:0};
  this.ax=0;this.ay=0;this.analog=false;
  this.p2ax=0;this.p2ay=0;this.p2analog=false;
  this.wantP2=!!(d.p2inputs&&d.p2inputs.length);
  this.autoFire=autoFire;
  G.replay=true;G.replayEnded=false;G.replayResult=d.result||'RUN';G.replaySaved=false;G.replayMsg='';
  DIFF=clamp(d.diff|0,0,DIFFS.length-1);
  G.story=!!d.story;G.oneCC=!!d.oneCC;
  G.charaPicks[0]=d.chara|0;G.charaPicks[1]=d.p2chara|0;
  const flags=d.flags.slice(0,ROUTES.length);
  G.selFlags=new Array(ROUTES.length).fill(false);
  for(let i=0;i<flags.length;i++)G.selFlags[i]=!!flags[i];
  autoFire=!!d.autoFire;
  G.idleT=0;
  G.online=false;
  if(d.online)G.aiDialogue=false;
  if(d.seed!==null){
   SimRng.beginSeed(d.seed);
   this.dmath=!!d.dmath;
   if(this.dmath&&typeof DMath!=='undefined')DMath.enable();
  }else{
   this.dmath=false;
   SimRng.beginPlayback(d.rng||[]);
  }
  startRun();
  if(G.screen!=='play'){this.stop();return false;}
  G.screen='play';
  return true;
 },
 stop(){
  if(!this.playback&&!this.play&&!this.autoFire&&G&&!G.replay)return;
  this.playback=false;this.play=null;this.wantP2=false;
  this.ax=0;this.ay=0;this.analog=false;this.p2ax=0;this.p2ay=0;this.p2analog=false;
  for(const k of REPLAY_KEYS){keys[k]=false;edge[k]=false;padKeys[k]=false;padEdge[k]=false;}
  if(typeof clearP2Input==='function')clearP2Input();
  if(this.autoFire!==null)autoFire=this.autoFire;
  this.autoFire=null;
  if(typeof G!=='undefined'&&G){G.replay=false;G.replayResult='';G.aiDialogue=settings.aiDialogue!==false;}
  this._endMath();
  SimRng.end();
 },
 endPlayback(){
  this.playback=false;this.play=null;this.wantP2=false;
  this.ax=0;this.ay=0;this.analog=false;this.p2ax=0;this.p2ay=0;this.p2analog=false;
  for(const k of REPLAY_KEYS){keys[k]=false;edge[k]=false;padKeys[k]=false;padEdge[k]=false;}
  if(typeof clearP2Input==='function')clearP2Input();
  if(this.autoFire!==null)autoFire=this.autoFire;
  this.autoFire=null;
  if(typeof settings!=='undefined')G.aiDialogue=settings.aiDialogue!==false;
  this._endMath();
  G.replayEnded=true;
  showResults();
 },
 info(){
  const d=this.data;
  if(!d)return null;
  return {
   mode:(d.online?'ONLINE ':'')+(d.oneCC&&d.story?'STORY 1CC':d.oneCC?'1CC':d.story?'STORY':'ROUTE'),
   diff:d.diffName||DIFFS[clamp(d.diff|0,0,DIFFS.length-1)]||'',
   score:fmtScore(d.score|0),
   spells:(d.spellsCaptured|0)+' / '+(d.spellsPlayed|0),
   deaths:d.deaths|0,
   frames:d.frames|0,
   result:d.result||'RUN',
   routes:(d.routeTitles||[]).join('  >  '),
   date:Number.isFinite(d.date)?new Date(d.date):null
  };
 },
 exportData(){return this.data?JSON.stringify(this.data):'';},
 importData(d){
  const clean=this.normalize(d);
  if(!clean)return false;
  return this.save(clean);
 },
 download(){
  if(!this.has())return false;
  if(typeof Blob==='undefined'||typeof URL==='undefined'||typeof URL.createObjectURL!=='function'||typeof document==='undefined'||!document.body)return false;
  try{
   const blob=new Blob([this.exportData()],{type:'application/json'});
   const url=URL.createObjectURL(blob);
   const a=document.createElement('a');
   a.href=url;
   a.download='shattered-reverie-'+String(this.data.score|0)+'.lasrreplay.json';
   a.style.display='none';
   document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>{try{URL.revokeObjectURL(url);}catch(e){}},1000);
   return true;
  }catch(e){return false;}
 },
 importText(text){
  try{
   const d=JSON.parse(String(text||''));
   if(!this.importData(d)){if(typeof G!=='undefined'&&G)G.replayMsg='INVALID REPLAY FILE';return false;}
   if(typeof G!=='undefined'&&G)G.replayMsg='REPLAY LOADED';
   return true;
  }catch(e){
   if(typeof G!=='undefined'&&G)G.replayMsg='INVALID REPLAY FILE';
   return false;
  }
 },
 requestImport(){
  if(typeof document==='undefined'||!document.body||typeof document.createElement!=='function')return false;
  try{
   const input=document.createElement('input');
   input.type='file';input.accept='.json,application/json';input.style.display='none';
   input.addEventListener('change',()=>{
    const file=input.files&&input.files[0];
    if(!file){input.remove();return;}
    if(file.size>REPLAY_MAX_BYTES){if(typeof G!=='undefined'&&G)G.replayMsg='REPLAY FILE TOO LARGE';input.remove();return;}
    const done=text=>{this.importText(text);input.remove();};
    if(typeof file.text==='function')file.text().then(done).catch(()=>{if(typeof G!=='undefined'&&G)G.replayMsg='REPLAY READ FAILED';input.remove();});
    else{
     const reader=new FileReader();
     reader.onload=()=>done(reader.result);
     reader.onerror=()=>{if(typeof G!=='undefined'&&G)G.replayMsg='REPLAY READ FAILED';input.remove();};
     reader.readAsText(file);
    }
   });
   document.body.appendChild(input);input.click();
   return true;
  }catch(e){return false;}
 }
};
Replay.data=Replay.load();
