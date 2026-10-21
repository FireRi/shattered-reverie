"use strict";
/* ================= AUDIO ================= */
const VOL_STEPS=[.2,.35,.5,.7,1];
const SFX_STEPS=[.2,.35,.5,.7,1];
let musicVolIdx=2,sfxVolIdx=2;
const AudioSys={ctx:null,master:null,sfxGain:null,limiter:null,muted:false,bgmTimer:null,nextT:0,step:0,seed:1,vol:.17,
 buffers:{},
 unlock(){
  try{
   if(this.ctx){
    if(this.ctx.state==='suspended'&&typeof this.ctx.resume==='function'){
     const p=this.ctx.resume();
     if(p&&typeof p.catch==='function')p.catch(()=>{});
    }
    return;
   }
   const Ctor=window.AudioContext||window.webkitAudioContext;
   if(!Ctor)return;
   const c=new Ctor();
   this.ctx=c;
   this.master=c.createGain();this.master.gain.value=this.vol;
   if(typeof c.createDynamicsCompressor==='function'){
    const lim=this.limiter=c.createDynamicsCompressor();
    if(lim.threshold)lim.threshold.value=-8;
    if(lim.knee)lim.knee.value=12;
    if(lim.ratio)lim.ratio.value=4;
    if(lim.attack)lim.attack.value=.003;
    if(lim.release)lim.release.value=.25;
    this.master.connect(lim);lim.connect(c.destination);
   }else this.master.connect(c.destination);
   this.sfxGain=c.createGain();this.sfxGain.gain.value=.9*SFX_STEPS[sfxVolIdx];this.sfxGain.connect(this.master);
   try{preloadSfx();}catch(e){}
  }catch(e){this.ctx=null;this.master=null;this.sfxGain=null;this.limiter=null;}
 },
 playSample(name){
  const key=SFX_FILES[name];if(!key)return false;
  const buf=this.buffers[key];if(!buf)return false;
  if(this.muted||!this.ctx)return true;
  const s=this.ctx.createBufferSource();s.buffer=buf;
  const g=this.ctx.createGain();g.gain.value=SFX_VOL[name]??.4;
  g.connect(this.sfxGain||this.master);s.connect(g);s.start(this.ctx.currentTime);return true;
 },
 tone(f,dur,type='square',vol=.5,slide=0,delay=0){if(!this.ctx||this.muted)return;const t=this.ctx.currentTime+delay;
  const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g);g.connect(this.sfxGain||this.master);o.start(t);o.stop(t+dur+.02);},
 noise(dur,vol=.4,delay=0,hp=0){if(!this.ctx||this.muted)return;const t=this.ctx.currentTime+delay;
  const n=this.ctx.sampleRate*dur,buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=this.ctx.createBufferSource();s.buffer=buf;const g=this.ctx.createGain();g.gain.value=vol;
  let node=s;if(hp){const f=this.ctx.createBiquadFilter();f.type='highpass';f.frequency.value=hp;s.connect(f);node=f;}
  node.connect(g);g.connect(this.sfxGain||this.master);s.start(t);}};
function sfx(name,o={}){
 if(AudioSys.playSample(name))return;
 switch(name){
   case 'graze':if(grazeTick%3===0)AudioSys.tone(1800+vrnd(600),.03,'sine',.12,-400);break;
  case 'pshot':break;
  case 'eshot':if(hitTick%4===0)AudioSys.noise(.03,.06,0,3000);break;
  case 'bossHit':if(hitTick%6===0)AudioSys.tone(220,.03,'square',.05,-40);break;
  case 'item':AudioSys.tone(1200,.06,'sine',.18,300);break;
  case 'extend':[660,880,1100,1320].forEach((f,i)=>AudioSys.tone(f,.1,'triangle',.25,0,i*.07));break;
  case 'spellget':AudioSys.tone(900,.12,'triangle',.22,500);break;
  case 'flash':AudioSys.noise(.5,.5);AudioSys.tone(120,.5,'sawtooth',.4,-90);break;
  case 'bomb':AudioSys.tone(80,.6,'sawtooth',.5,-40);AudioSys.noise(.6,.35);break;
  case 'declare':AudioSys.tone(200,.5,'sawtooth',.3,900);AudioSys.noise(.3,.2,0,1500);break;
  case 'capture':[523,659,784,1047,1319].forEach((f,i)=>AudioSys.tone(f,.16,'triangle',.3,0,i*.09));break;
  case 'timeout':AudioSys.tone(160,.5,'square',.3,-60);break;
  case 'bosswalk':AudioSys.tone(90,.3,'triangle',.3,60);break;
  case 'death':AudioSys.noise(.8,.5);AudioSys.tone(200,.8,'sawtooth',.4,-160);break;
  case 'bossDie':AudioSys.noise(1,.55);[300,200,130,80].forEach((f,i)=>AudioSys.tone(f,.3,'sawtooth',.3,-60,i*.1));break;
  case 'cur':AudioSys.tone(700,.04,'square',.15);break;
  case 'ok':AudioSys.tone(900,.07,'square',.2);AudioSys.tone(1350,.07,'square',.15,0,.05);break;
  case 'no':AudioSys.tone(200,.15,'square',.2,-80);break;
  case 'laser':AudioSys.tone(1400,.2,'sawtooth',.12,-900);break;
  case 'warn':AudioSys.tone(500,.1,'square',.2,0);AudioSys.tone(500,.1,'square',.2,0,.15);break;
 }}
function setMusicVol(idx,silent){
 musicVolIdx=clamp(idx,0,VOL_STEPS.length-1);
 if(Music.gain)Music.gain.gain.value=.9*VOL_STEPS[musicVolIdx];
 try{localStorage.setItem('lasr_mvol',String(musicVolIdx));}catch(e){}
 if(!silent)addText(W-70,H-60,'MUSIC '+Math.round(VOL_STEPS[musicVolIdx]*100)+'%','#9cf',13,50);
}
function setSfxVol(idx,silent){
 sfxVolIdx=clamp(idx,0,SFX_STEPS.length-1);
 if(AudioSys.sfxGain)AudioSys.sfxGain.gain.value=.9*SFX_STEPS[sfxVolIdx];
 try{localStorage.setItem('lasr_svol',String(sfxVolIdx));}catch(e){}
 if(!silent)addText(W-70,H-80,'SFX '+Math.round(SFX_STEPS[sfxVolIdx]*100)+'%','#9cf',13,50);
}
try{const v=parseInt(localStorage.getItem('lasr_mvol')||'2');if(v>=0&&v<VOL_STEPS.length)musicVolIdx=v;}catch(e){}
try{const v=parseInt(localStorage.getItem('lasr_svol')||'2');if(v>=0&&v<SFX_STEPS.length)sfxVolIdx=v;}catch(e){}
