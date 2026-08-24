"use strict";
/* ================= AUDIO ================= */
const AudioSys={ctx:null,master:null,muted:false,bgmTimer:null,nextT:0,step:0,seed:1,vol:.17,
 buffers:{},
 unlock(){if(this.ctx)return;try{this.ctx=new(window.AudioContext||window.webkitAudioContext)();
  this.master=this.ctx.createGain();this.master.gain.value=this.vol;this.master.connect(this.ctx.destination);
  preloadSfx();}catch(e){}},
 playSample(name){
  const key=SFX_FILES[name];if(!key)return false;
  const buf=this.buffers[key];if(!buf)return false;
  if(this.muted||!this.ctx)return true;
  const s=this.ctx.createBufferSource();s.buffer=buf;
  const g=this.ctx.createGain();g.gain.value=SFX_VOL[name]??.4;
  g.connect(this.master);s.connect(g);s.start(this.ctx.currentTime);return true;
 },
 tone(f,dur,type='square',vol=.5,slide=0,delay=0){if(!this.ctx||this.muted)return;const t=this.ctx.currentTime+delay;
  const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+.02);},
 noise(dur,vol=.4,delay=0,hp=0){if(!this.ctx||this.muted)return;const t=this.ctx.currentTime+delay;
  const n=this.ctx.sampleRate*dur,buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=this.ctx.createBufferSource();s.buffer=buf;const g=this.ctx.createGain();g.gain.value=vol;
  let node=s;if(hp){const f=this.ctx.createBiquadFilter();f.type='highpass';f.frequency.value=hp;s.connect(f);node=f;}
  node.connect(g);g.connect(this.master);s.start(t);}};
function sfx(name,o={}){
 if(AudioSys.playSample(name))return;
 switch(name){
  case 'graze':if(grazeTick%3===0)AudioSys.tone(1800+rnd(600),.03,'sine',.12,-400);break;
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
/* ================= MUSIC v2 — seeded theory-driven synth score ================= */
function mulberry(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const nf=m=>440*Math.pow(2,(m-69)/12);
const Music={on:false,timer:null,step:0,nextT:0,cfg:null,gain:null,noiseBuf:null,lastM:0,
 echo:null,echoWet:null,echoFb:null,
 stats:{notes:0},badNotes:0,
 PROGS:[[0,8,3,10],[0,5,10,7],[0,3,8,10],[0,10,5,7],[0,8,7,10],[0,5,8,7],[0,10,3,8]],
 KICKS:[[0,4,8,12],[0,4,7,10,12],[0,6,8,14],[0,4,8,11,12]],
 build(seed){
  const R=mulberry((seed|0)*7919+13);
  const root=45+[0,2,3,5,7,8,10][Math.floor(R()*7)];
  const prog=this.PROGS[Math.floor(R()*this.PROGS.length)];
  const kick=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  this.KICKS[Math.floor(R()*this.KICKS.length)].forEach(i=>kick[i]=1);
  const MOTIFS=[
   [1,0,0,1, 0,1,0,0, 1,0,1,0, 0,1,0,0],
   [1,0,1,0, 0,1,0,1, 1,0,0,1, 0,0,1,0],
   [1,1,0,0, 1,0,0,1, 0,1,0,0, 1,0,1,0],
   [1,0,0,1, 0,0,1,0, 1,0,1,0, 0,1,0,0]
  ];
  const motif=MOTIFS[Math.floor(R()*MOTIFS.length)].slice();
  for(let k=0;k<2;k++){const i=Math.floor(R()*16);motif[i]=motif[i]?0:1;}
  if(motif.filter(Boolean).length<5)motif[0]=1;
  const arpMask=[],melMask=[];
  this.cfg={root,prog,bpm:[148,156,162,168,174][Math.floor(R()*5)],
   leadWave:'sawtooth',motif,
   swing:R()*.07,kick,arpMask,melMask,hatDiv:1,arpUp:R()<.55};
  this.lastM=root+12;
 },
 setEcho(){
  if(this.echo&&this.cfg)this.echo.delayTime.value=Math.min(.9,(60/this.cfg.bpm/4)*3);
 },
 ensureBus(){
  if(!AudioSys.ctx)return null;
  if(!this.gain){
   const c=AudioSys.ctx;
   this.gain=c.createGain();this.gain.gain.value=.9*VOL_STEPS[musicVolIdx];
   const comp=c.createDynamicsCompressor();
   comp.threshold.value=-20;comp.ratio.value=4;
   this.gain.connect(comp);comp.connect(AudioSys.master);
   this.echo=c.createDelay(1);this.echoFb=c.createGain();this.echoFb.gain.value=.28;
   this.echoWet=c.createGain();this.echoWet.gain.value=.15;
   const echoHp=c.createBiquadFilter();echoHp.type='highpass';echoHp.frequency.value=850;
   this.echo.connect(this.echoFb);this.echoFb.connect(this.echo);
   this.echo.connect(echoHp);echoHp.connect(this.echoWet);this.echoWet.connect(this.gain);
   const n=c.sampleRate|0;
   const buf=c.createBuffer(1,n,n);const d=buf.getChannelData(0);
   for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
   this.noiseBuf=buf;
   this.setEcho();
   if(c.createPeriodicWave){
    const N=32,re=new Float32Array(N),im=new Float32Array(N);
    for(let k=1;k<N;k++){const a=(2/(k*Math.PI))*Math.sin(k*Math.PI*.25);im[k]=a;}
    this.pw25=c.createPeriodicWave(re,im,{disableNormalization:false});
   }
   this.usesChip=true;
  }
  return this.gain;
 },
 arrangementFor(bar8,inten){
  return {
   drums:true,
   arp:bar8>=2&&bar8<7||inten>1,
   lead:inten>1||(bar8>=4&&bar8<7),
   breakdown:bar8===7&&inten<=1,
   full:inten>1
  };
 },
 intensity(){return (typeof BOSS!=='undefined'&&BOSS&&BOSS.spellActive)?2:1;},
 chordTones(bar){
  const deg=this.cfg.prog[bar%4];
  const r=this.cfg.root+deg;
  const minor=(deg===0||deg===5);
  const iv=minor?[0,3,7]:[0,4,7];
  return {root:r,tones:[r,r+iv[1],r+iv[2]]};
 },
 vChip(t,m,dur,v,wave){const c=AudioSys.ctx;
  const g=c.createGain();
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.012);
  g.gain.setValueAtTime(v*.85,t+dur*.7);g.gain.linearRampToValueAtTime(.0001,t+dur);
  const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=5200;
  g.connect(f);f.connect(this.gain);
  const send=c.createGain();send.gain.value=.4;f.connect(send);send.connect(this.echo);
  const lfo=c.createOscillator(),lg=c.createGain();
  lfo.frequency.value=6;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(9,t+.1);
  lfo.connect(lg);lfo.start(t);lfo.stop(t+dur+.05);
  const o=c.createOscillator();
  if(wave==='pulse25'&&this.pw25)o.setPeriodicWave(this.pw25);
  else o.type=wave||'square';
  o.frequency.setValueAtTime(nf(m)*.94,t);
  o.frequency.exponentialRampToValueAtTime(nf(m),t+.05);
  lg.connect(o.detune);
  o.connect(g);o.start(t);o.stop(t+dur+.04);this.stats.notes++;
 },
 osc(t,f,dur,type,vol,dest){const c=AudioSys.ctx,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.008);
  g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g);g.connect(dest||this.gain);o.start(t);o.stop(t+dur+.03);this.stats.notes++;},
 noiseHit(t,dur,vol,type,freq,q){const c=AudioSys.ctx,s=c.createBufferSource();s.buffer=this.noiseBuf;
  s.loop=true;s.playbackRate.value=1;
  const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;if(q)f.Q.value=q;
  const g=c.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  s.connect(f);f.connect(g);g.connect(this.gain);s.start(t);s.stop(t+dur+.02);this.stats.notes++;},
 vKick(t,v){const c=AudioSys.ctx,o=c.createOscillator(),g=c.createGain();
  o.frequency.setValueAtTime(155,t);o.frequency.exponentialRampToValueAtTime(44,t+.1);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.24);
  o.connect(g);g.connect(this.gain);o.start(t);o.stop(t+.26);this.stats.notes++;},
 vBass(t,m,dur,v=.28){const c=AudioSys.ctx,o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
  o.type='sawtooth';o.frequency.value=nf(m);
  f.type='lowpass';f.frequency.value=320;f.Q.value=2;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.014);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(f);f.connect(g);g.connect(this.gain);o.start(t);o.stop(t+dur+.05);this.stats.notes++;},
 vPluck(t,m,dur,v,wave){const c=AudioSys.ctx,o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
  o.type=wave;o.frequency.value=nf(m);
  f.type='lowpass';f.frequency.setValueAtTime(1900,t);f.frequency.exponentialRampToValueAtTime(520,t+dur);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
   o.connect(f);f.connect(g);g.connect(this.gain);o.start(t);o.stop(t+dur+.03);this.stats.notes++;},
 leadNote(ct,R){
  let best=null,bd=99;
  for(const tn of ct.tones){
   for(const oct of [-12,0,12]){
    const cand=tn+oct;
    const d=Math.abs(cand-this.lastM)+R()*3;
    if(cand>this.cfg.root&&d<bd){bd=d;best=cand;}
   }
  }
  if(R()<.22)best+=(best-this.lastM>4?-12:(this.lastM-best>4?12:0));
  this.lastM=best;
  return best;
 },
 inKey(m){
  const rel=((m-this.cfg.root)%12+12)%12;
  return [0,2,3,5,7,8,10,11].includes(rel);
 },
 scheduleStep(s,tRaw,spb){
  if(AudioSys.muted)return;
  const cfg=this.cfg,st=s%16,bar=Math.floor(s/16)%8,ch=bar%4;
  const R=mulberry(s*48271+1);
  const hum=(R()-.5)*.008;
  const vel=(base)=>base*(0.85+R()*.3);
  const t=tRaw+(st%2===1?cfg.swing*spb:0)+hum;
  const inten=this.intensity();
  const A=this.arrangementFor(bar,inten);
  const ct=this.chordTones(ch);
  if(A.breakdown&&st!==0){
   if(st>=12)this.noiseHit(t,.09,.09+(st-12)*.05,'bandpass',2600,.8);
   if(cfg.kick[st])this.vKick(t,.45);
   return;
  }
  if(cfg.kick[st])this.vKick(t,vel(.75));
  if(st===4||st===12)this.noiseHit(t,.12,vel(.3),'bandpass',2100,1);
  if(s%256===0)this.noiseHit(t,.7,.15,'highpass',5400);
  if(st%2===1)this.noiseHit(t,st===7||st===15?.06:.03,st===7||st===15?.16:.08,'highpass',8200);
  if(st%2===0||(inten>1&&st===15))
   this.vBass(t,ct.root-12+((st%8===6)?12:0),spb*.92,vel(.26));
  if(A.arp&&R()>.14){
   const seq=[...ct.tones].sort((a,b)=>cfg.arpUp?a-b:b-a);
   const m=seq[(s>>1)%3]+12;
   this.vPluck(t,m,spb*.9,.05,'square');
  }
  if(A.lead&&cfg.motif[st]){
   const m=this.leadNote(ct,R)+12;
   if(!this.inKey(m))this.badNotes++;
   const nextOn=st<15?cfg.motif[st+1]:0;
   this.vChip(t,m,spb*(nextOn?1.3:2.5),vel(.14),'pulse25');
   if(st%8===0&&R()<.35)
    this.vPluck(t,m+12,spb*.28,.05,'square');
  }else if(A.lead&&st%4===2){
   const hm=ct.tones[(st>>2)%3]-12;
   this.vChip(t,hm+12,spb*.9,.04,'square');
  }
  if(st===0&&(bar%2===0||inten>1)){
   for(const tn of [ct.tones[0],ct.tones[2]]){
    const c=AudioSys.ctx,o=c.createOscillator(),g=c.createGain();
    o.type='square';o.frequency.value=nf(tn-12)/2;
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.02,t+.06);
    g.gain.linearRampToValueAtTime(.0001,t+spb*14);
    o.connect(g);g.connect(this.gain);o.start(t);o.stop(t+spb*14+.05);this.stats.notes++;
   }
  }
 },
 tick(){
  if(!this.on)return;
  if(!AudioSys.ctx||!this.cfg){return;}
  if(!this.ensureBus())return;
  const c=AudioSys.ctx,spb=60/this.cfg.bpm/4;
  if(this.nextT<c.currentTime)this.nextT=c.currentTime+.06;
  let guard=0;
  while(this.nextT<c.currentTime+.24&&guard++<64){
   this.scheduleStep(this.step,this.nextT,spb);
   this.step++;this.nextT+=spb;
  }
 }
};
function startBgm(seed,tempoHint){
 if(!Music.on||Music._seed!==seed){Music.build(seed);Music._seed=seed;Music.setEcho();}
 if(tempoHint){Music.cfg.bpm=tempoHint;Music.setEcho();}
 Music.on=true;
 if(!Music.timer)Music.timer=setInterval(()=>Music.tick(),40);
}
function stopBgm(){Music.on=false;}
const VOL_STEPS=[.2,.35,.5,.7,1];
let musicVolIdx=2;
function setMusicVol(idx){
 musicVolIdx=clamp(idx,0,VOL_STEPS.length-1);
 if(Music.gain)Music.gain.gain.value=.9*VOL_STEPS[musicVolIdx];
 try{localStorage.setItem('lasr_mvol',String(musicVolIdx));}catch(e){}
 addText(W-70,H-60,'MUSIC '+Math.round(VOL_STEPS[musicVolIdx]*100)+'%','#9cf',13,50);
}
try{const v=parseInt(localStorage.getItem('lasr_mvol')||'2');if(v>=0&&v<VOL_STEPS.length)musicVolIdx=v;}catch(e){}

