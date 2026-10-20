"use strict";

function musicRandom(s){
 s|=0;
 return function(){
  s=s+0x6D2B79F5|0;
  let t=Math.imul(s^s>>>15,1|s);
  t=t+Math.imul(t^t>>>7,61|t)^t;
  return((t^t>>>14)>>>0)/4294967296;
 };
}
const musicHz=m=>440*Math.pow(2,(m-69)/12);
const MUSIC_SCALES={
 aeolian:[0,2,3,5,7,8,10],
 dorian:[0,2,3,5,7,9,10],
 harmonic:[0,2,3,5,7,8,11],
 phrygian:[0,1,3,5,7,8,10],
 phrygianDom:[0,1,4,5,7,8,10],
 lydian:[0,2,4,6,7,9,11],
 ionian:[0,2,4,5,7,9,11],
 mixolydian:[0,2,4,5,7,9,10]
};
const MUSIC_STYLES={
 S1:{root:53,modes:['aeolian','dorian'],progs:[[0,5,3,4,0,5,6,4],[0,3,5,4,0,6,3,4],[0,5,6,4,0,3,4,4]],bpm:148,leads:['pulse25','triangle'],arp:'square',pad:'triangle',drums:'half',swing:.045,echo:.2,feedback:.26,roots:[0,2,3,5,-2],leadLow:62,leadHigh:86,seventh:false},
 S2:{root:50,modes:['dorian','aeolian'],progs:[[0,3,5,4,0,3,6,4],[0,5,3,4,0,2,3,4],[0,3,1,4,0,6,5,4]],bpm:152,leads:['triangle','pulse25'],arp:'triangle',pad:'sawtooth',drums:'break',swing:.055,echo:.28,feedback:.32,roots:[0,2,5,-2,3],leadLow:62,leadHigh:88,seventh:true},
 S3:{root:55,modes:['ionian','lydian','mixolydian'],progs:[[0,4,5,3,0,4,6,4],[0,5,3,4,0,6,5,4],[0,4,1,5,0,4,5,3]],bpm:160,leads:['sawtooth','pulse25'],arp:'square',pad:'sawtooth',drums:'four',swing:.025,echo:.17,feedback:.24,roots:[0,-2,2,5,3],leadLow:64,leadHigh:90,seventh:false},
 S4:{root:51,modes:['phrygian','aeolian'],progs:[[0,1,0,4,0,1,5,4],[0,3,1,4,0,5,1,4],[0,1,5,4,0,1,3,4]],bpm:144,leads:['square','pulse25'],arp:'triangle',pad:'sawtooth',drums:'half',swing:.02,echo:.25,feedback:.31,roots:[0,1,-2,3,5],leadLow:60,leadHigh:84,seventh:true},
 S5:{root:45,modes:['harmonic','phrygianDom'],progs:[[0,5,6,4,0,5,3,4],[0,3,4,0,5,4,6,4],[0,5,1,4,0,6,5,4]],bpm:166,leads:['sawtooth','square'],arp:'square',pad:'sawtooth',drums:'metal',swing:.015,echo:.15,feedback:.22,roots:[0,2,3,5,-2],leadLow:62,leadHigh:88,seventh:false},
 S6:{root:48,modes:['harmonic','aeolian'],progs:[[0,5,2,6,0,5,3,4],[0,4,5,3,0,6,5,4],[0,5,6,4,0,3,4,4]],bpm:158,leads:['pulse25','sawtooth'],arp:'square',pad:'sawtooth',drums:'four',swing:.025,echo:.24,feedback:.29,roots:[0,2,5,-2,3],leadLow:64,leadHigh:90,seventh:true},
 EX:{root:57,modes:['lydian','mixolydian','dorian'],progs:[[0,4,1,5,0,6,3,4],[0,3,1,4,0,4,5,3],[0,4,5,3,0,6,1,4]],bpm:152,leads:['triangle','pulse25'],arp:'triangle',pad:'triangle',drums:'break',swing:.06,echo:.32,feedback:.34,roots:[0,-2,2,5,3],leadLow:64,leadHigh:90,seventh:true},
 EXA:{root:47,modes:['phrygianDom','harmonic','phrygian'],progs:[[0,1,5,4,0,6,1,4],[0,3,1,4,0,5,1,4],[0,1,0,4,0,6,5,4]],bpm:170,leads:['sawtooth','pulse25'],arp:'square',pad:'sawtooth',drums:'metal',swing:0,echo:.2,feedback:.27,roots:[0,2,3,5,-2],leadLow:62,leadHigh:90,seventh:false}
};
const MUSIC_DRUMS={
 half:{
  kick:[1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0],
  snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
  hat:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
  open:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0]
 },
 rock:{
  kick:[1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0],
  snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
  hat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
  open:[0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0]
 },
 four:{
  kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
  snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
  hat:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
  open:[0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0]
 },
 break:{
  kick:[1,0,0,1,0,0,1,0,1,0,0,0,0,0,1,0],
  snare:[0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0],
  hat:[1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1],
  open:[0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0]
 },
 metal:{
  kick:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
  snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
  hat:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
  open:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0]
 }
};
const MUSIC_BASS={
 half:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
 rock:[1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0],
 four:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
 break:[1,0,0,0,0,0,1,0,1,0,0,0,0,1,0,0],
 metal:[1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1]
};
const MUSIC_RHYTHMS=[
 [1,0,0,1,0,0,1,0,1,0,0,1,0,1,0,0],
 [1,0,1,0,0,1,0,1,1,0,0,1,0,0,1,0],
 [1,0,0,0,1,0,1,0,1,0,0,0,1,0,1,0],
 [1,0,1,0,1,0,0,1,1,0,1,0,0,1,0,0],
 [1,1,0,1,0,1,0,0,1,0,1,1,0,0,1,0],
 [1,0,0,1,0,1,0,0,1,0,0,1,0,1,1,0],
 [1,0,1,1,0,1,0,1,1,0,1,0,1,0,1,0],
 [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]
];
const MUSIC_CONTOURS=[
 [4,2,0,2,4,5,4,2],
 [0,2,4,2,0,1,2,4],
 [4,5,4,2,0,2,4,7],
 [7,4,2,4,5,4,2,0],
 [2,4,5,7,5,4,2,0],
 [0,4,2,5,4,2,0,2],
 [4,7,9,7,5,4,2,4],
 [9,7,5,4,2,4,5,7]
];
function musicPick(list,R){return list[Math.floor(R()*list.length)];}
function musicScaleNote(root,scale,degree){
 let oct=Math.floor(degree/7),idx=degree%7;
 if(idx<0){idx+=7;oct--;}
 return root+scale[idx]+oct*12;
}
function musicChord(cfg,bar){
 const deg=cfg.prog[bar%cfg.prog.length];
 const root=musicScaleNote(cfg.root,cfg.scale,deg);
 const third=musicScaleNote(cfg.root,cfg.scale,deg+2);
 const fifth=musicScaleNote(cfg.root,cfg.scale,deg+4);
 const seventh=musicScaleNote(cfg.root,cfg.scale,deg+6);
 return {deg,root,third,fifth,seventh,tones:[root,third,fifth]};
}
function musicStageForSeed(seed){
 if(seed>=80)return'EXA';
 if(seed>=70)return'EX';
 if(seed>=60)return'S6';
 if(seed>=50)return'S5';
 if(seed>=40)return'S4';
 if(seed>=30)return'S3';
 if(seed>=20)return'S2';
 return'S1';
}

const Music={
 on:false,timer:null,step:0,nextT:0,cfg:null,gain:null,noiseBuf:null,lastM:60,
 echo:null,echoWet:null,echoFb:null,echoHp:null,pw25:null,
 stats:{notes:0},_track:null,_seed:null,phase:0,
 resetClock(){
  this.nextT=AudioSys.ctx?AudioSys.ctx.currentTime+.05:0;
 },
 ensureBus(){
  if(!AudioSys.ctx)return null;
  if(!this.gain){
   const c=AudioSys.ctx;
   this.gain=c.createGain();this.gain.gain.value=.9*VOL_STEPS[musicVolIdx];
   const comp=c.createDynamicsCompressor();
   comp.threshold.value=-18;comp.ratio.value=3.2;
   this.gain.connect(comp);comp.connect(AudioSys.master);
   this.echo=c.createDelay(1);this.echoFb=c.createGain();this.echoFb.gain.value=.28;
   this.echoWet=c.createGain();this.echoWet.gain.value=.18;
   this.echoHp=c.createBiquadFilter();this.echoHp.type='highpass';this.echoHp.frequency.value=850;
   this.echo.connect(this.echoFb);this.echoFb.connect(this.echo);
   this.echo.connect(this.echoHp);this.echoHp.connect(this.echoWet);this.echoWet.connect(this.gain);
   const n=c.sampleRate|0;
   const buf=c.createBuffer(1,n,n);const d=buf.getChannelData(0);
   for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
   this.noiseBuf=buf;
   if(c.createPeriodicWave){
    const N=32,re=new Float32Array(N),im=new Float32Array(N);
    for(let k=1;k<N;k++)im[k]=(2/(k*Math.PI))*Math.sin(k*Math.PI*.25);
    this.pw25=c.createPeriodicWave(re,im,{disableNormalization:false});
   }
   this.setEcho();
  }
  return this.gain;
 },
 setEcho(){
  if(!this.cfg||!this.echo)return;
  this.echo.delayTime.value=Math.min(1,(60/this.cfg.bpm/4)*3);
  this.echoWet.gain.value=this.cfg.echo;
  this.echoFb.gain.value=this.cfg.feedback;
  if(this.echoHp)this.echoHp.frequency.value=this.cfg.echoHp||820;
 },
 makeRhythm(R){
  const rhythm=musicPick(MUSIC_RHYTHMS,R).slice();
  for(let i=0;i<2;i++){const j=2+Math.floor(R()*13);rhythm[j]=rhythm[j]?0:1;}
  let n=rhythm.reduce((a,b)=>a+b,0);
  if(n<6)for(let i=0;i<16&&n<6;i++)if(!rhythm[i]){rhythm[i]=1;n++;}
  if(n>10){for(let i=15;i>0&&n>10;i--)if(rhythm[i]){rhythm[i]=0;n--;}}
  rhythm[0]=1;
  return rhythm;
 },
 makeContour(R){
  const contour=musicPick(MUSIC_CONTOURS,R).slice();
  for(let i=0;i<2;i++){const j=1+Math.floor(R()*7);contour[j]+=R()<.5?-1:1;}
  return contour;
 },
 buildTheme(o){
  const R=o.rng;
  const cfg={
   kind:o.kind,id:o.id,stage:o.stage,root:o.root,mode:o.mode,scale:MUSIC_SCALES[o.mode],
   prog:o.prog.slice(),bpm:o.bpm,swing:o.style.swing||0,echo:o.style.echo??.18,feedback:o.style.feedback??.28,
   drums:o.style.drums,leadWave:o.leadWave||musicPick(o.style.leads,R),arpWave:o.style.arp,padWave:o.style.pad,
   seventh:!!o.style.seventh,leadLow:o.style.leadLow||62,leadHigh:o.style.leadHigh||88,
   rhythmA:this.makeRhythm(R),rhythmB:this.makeRhythm(R),
   contourA:this.makeContour(R),contourB:this.makeContour(R),phase:o.phase|0,leadBars:[]
  };
  for(let bar=0;bar<16;bar++){
   const chord=musicChord(cfg,bar);
   const rhythm=bar<8?cfg.rhythmA:cfg.rhythmB;
   const contour=bar<8?cfg.contourA:cfg.contourB;
   const events=[];let k=0;
   for(let st=0;st<16;st++){
    if(!rhythm[st])continue;
    const off=contour[(k+(bar>>1))%contour.length];
    let m=musicScaleNote(cfg.root,cfg.scale,chord.deg+off);
    while(m<cfg.leadLow)m+=12;
    while(m>cfg.leadHigh)m-=12;
    let gap=16-st;
    for(let j=st+1;j<16;j++)if(rhythm[j]){gap=j-st;break;}
    events.push({st,m,dur:Math.max(1,Math.min(gap,8)),vel:.1+(st===0?.028:0)+(st%4===0?.012:0)+R()*.012});
    k++;
   }
   cfg.leadBars.push(events);
  }
  cfg.signature=[cfg.root,cfg.mode,cfg.prog.join(','),cfg.rhythmA.join(''),cfg.contourA.join(','),cfg.rhythmB.join(''),cfg.contourB.join(',')].join('|');
  this.cfg=cfg;
  this.lastM=cfg.root+12;
 },
 buildBoss(def,phase){
  const stage=musicStageForSeed(def.bgmSeed);
  const style=MUSIC_STYLES[stage]||MUSIC_STYLES.S1;
  const R=musicRandom(((def.bgmSeed|0)*7919+(def.name||'').length*131+(def.atk?def.atk.length*17:0)+13)>>>0);
  this.buildTheme({
   kind:'boss',id:def.id,stage,style,rng:R,phase:clamp(phase|0,0,2),
   root:style.root+musicPick(style.roots,R),mode:musicPick(style.modes,R),
   prog:musicPick(style.progs,R).slice(),bpm:clamp(def.bgmTempo||style.bpm,124,188)
  });
 },
 buildStage(route){
  const stage=MUSIC_STYLES[route.id]?route.id:'S1';
  const style=MUSIC_STYLES[stage];
  const R=musicRandom(((route.seed|0)*3571+97)>>>0);
  this.buildTheme({
   kind:'stage',id:route.id,stage,style,rng:R,phase:0,
   root:style.root+musicPick([0,-2,2,3],R),mode:musicPick(style.modes,R),
   prog:musicPick(style.progs,R).slice(),bpm:style.bpm+(route.seed%3-1)*2
  });
 },
 buildSeed(seed,tempoHint){
  const ids=Object.keys(MUSIC_STYLES);
  const stage=ids[Math.abs(seed|0)%ids.length];
  const style=MUSIC_STYLES[stage];
  const R=musicRandom(((seed|0)*4871+31)>>>0);
  this.buildTheme({
   kind:'stage',id:'seed'+seed,stage,style,rng:R,phase:0,
   root:style.root+musicPick(style.roots,R),mode:musicPick(style.modes,R),
   prog:musicPick(style.progs,R).slice(),bpm:tempoHint||style.bpm
  });
 },
 buildTitle(){
  const style=MUSIC_STYLES.EX;
  const R=musicRandom(0x5EED);
  this.buildTheme({
   kind:'title',id:'title',stage:'EX',style,rng:R,phase:0,
   root:57,mode:'lydian',prog:[0,4,1,5,0,6,3,4],bpm:116
  });
 },
 arrangementFor(bar,phase){
  const kind=this.cfg.kind,sec=bar>>2;
  if(kind==='title')
   return {drums:bar>=4,pad:true,arp:bar>=2,bass:bar>=2,lead:bar>=8,counter:false,full:bar>=12,fill:bar%4===3,crash:bar===0,breakdown:false};
  const breakdown=kind==='stage'&&bar===7&&phase===0;
  return {
   drums:!breakdown,pad:true,arp:!breakdown,bass:!breakdown,
   lead:!breakdown&&(sec>=1||phase>=1||bar>=8),
   counter:phase>=2&&sec>=2,full:phase>=2||sec>=2,
   fill:bar%4===3,crash:bar%4===0,breakdown
  };
 },
 padTones(ct){
  let tones=ct.tones.slice();
  while(tones[0]>=60)tones=tones.map(x=>x-12);
  while(tones[0]<45)tones=tones.map(x=>x+12);
  return tones;
 },
 vLead(t,m,dur,v,wave){
  const c=AudioSys.ctx;
  const g=c.createGain(),f=c.createBiquadFilter();
  f.type='lowpass';f.Q.value=.8;
  f.frequency.setValueAtTime(4600,t);
  f.frequency.exponentialRampToValueAtTime(1700,t+dur);
  g.gain.setValueAtTime(.0001,t);
  g.gain.linearRampToValueAtTime(v,t+.012);
  g.gain.setValueAtTime(v*.82,t+Math.max(.03,dur*.62));
  g.gain.exponentialRampToValueAtTime(.001,t+dur);
  f.connect(g);g.connect(this.gain);
  const send=c.createGain();send.gain.value=.38;f.connect(send);send.connect(this.echo);
  for(const det of [-.004,.004]){
   const o=c.createOscillator(),og=c.createGain();
   og.gain.value=.62;
   if(wave==='pulse25'&&this.pw25)o.setPeriodicWave(this.pw25);
   else o.type=wave==='pulse25'?'square':wave;
   o.frequency.value=musicHz(m)*(1+det);
   o.connect(og);og.connect(f);o.start(t);o.stop(t+dur+.04);
  }
  this.stats.notes++;
 },
 vPad(t,tones,dur,v,wave){
  const c=AudioSys.ctx;
  const g=c.createGain(),f=c.createBiquadFilter();
  f.type='lowpass';f.frequency.value=1500;f.Q.value=.55;
  g.gain.setValueAtTime(.0001,t);
  g.gain.linearRampToValueAtTime(v,t+.16);
  g.gain.setValueAtTime(v*.9,t+Math.max(.2,dur*.62));
  g.gain.exponentialRampToValueAtTime(.001,t+dur);
  f.connect(g);g.connect(this.gain);
  const send=c.createGain();send.gain.value=.28;f.connect(send);send.connect(this.echo);
  for(const m of tones)for(const det of [-.006,.006]){
   const o=c.createOscillator(),og=c.createGain();
   og.gain.value=.22;
   o.type=wave||'triangle';
   o.frequency.value=musicHz(m)*(1+det);
   o.connect(og);og.connect(f);o.start(t);o.stop(t+dur+.05);
  }
  this.stats.notes++;
 },
 vBass(t,m,dur,v,cut){
  const c=AudioSys.ctx;
  const g=c.createGain(),f=c.createBiquadFilter();
  f.type='lowpass';f.Q.value=1.8;
  f.frequency.setValueAtTime(cut||520,t);
  f.frequency.exponentialRampToValueAtTime(150,t+dur);
  g.gain.setValueAtTime(.0001,t);
  g.gain.linearRampToValueAtTime(v,t+.012);
  g.gain.setValueAtTime(v*.8,t+dur*.55);
  g.gain.exponentialRampToValueAtTime(.001,t+dur);
  f.connect(g);g.connect(this.gain);
  const o=c.createOscillator();o.type='sawtooth';o.frequency.value=musicHz(m);
  o.connect(f);o.start(t);o.stop(t+dur+.03);
  const sub=c.createOscillator(),sg=c.createGain();
  sub.type='sine';sub.frequency.value=musicHz(m);
  sg.gain.value=.55;sub.connect(sg);sg.connect(g);
  sub.start(t);sub.stop(t+dur+.03);
  this.stats.notes++;
 },
 vKick(t,v){
  const c=AudioSys.ctx,o=c.createOscillator(),g=c.createGain();
  o.frequency.setValueAtTime(155,t);o.frequency.exponentialRampToValueAtTime(44,t+.1);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.24);
  o.connect(g);g.connect(this.gain);o.start(t);o.stop(t+.26);this.stats.notes++;
 },
 vSnare(t,v){
  this.noiseHit(t,.14,v*.45,'bandpass',1900,.9);
  const c=AudioSys.ctx,o=c.createOscillator(),g=c.createGain();
  o.type='triangle';o.frequency.setValueAtTime(190,t);
  o.frequency.exponentialRampToValueAtTime(95,t+.1);
  g.gain.setValueAtTime(v*.18,t);g.gain.exponentialRampToValueAtTime(.001,t+.14);
  o.connect(g);g.connect(this.gain);o.start(t);o.stop(t+.16);this.stats.notes++;
 },
 vHat(t,v,open){
  this.noiseHit(t,open?.12:.035,v,'highpass',open?6200:7800,.7);
 },
 vTom(t,f,v){
  const c=AudioSys.ctx,o=c.createOscillator(),g=c.createGain();
  o.type='sine';o.frequency.setValueAtTime(f,t);
  o.frequency.exponentialRampToValueAtTime(Math.max(40,f*.62),t+.2);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.23);
  o.connect(g);g.connect(this.gain);o.start(t);o.stop(t+.25);this.stats.notes++;
 },
 vCrash(t,v){
  this.noiseHit(t,.48,v,'highpass',4800,.6);
 },
 noiseHit(t,dur,vol,type,freq,q){
  const c=AudioSys.ctx,s=c.createBufferSource();s.buffer=this.noiseBuf;
  s.loop=true;s.playbackRate.value=1;
  const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;if(q)f.Q.value=q;
  const g=c.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  s.connect(f);f.connect(g);g.connect(this.gain);s.start(t);s.stop(t+dur+.02);this.stats.notes++;
 },
 vPluck(t,m,dur,v,wave){
  const c=AudioSys.ctx,o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
  o.type=wave||'square';o.frequency.value=musicHz(m);
  f.type='lowpass';f.frequency.setValueAtTime(2300,t);
  f.frequency.exponentialRampToValueAtTime(540,t+dur);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(f);f.connect(g);g.connect(this.gain);o.start(t);o.stop(t+dur+.03);this.stats.notes++;
 },
 scheduleDrums(t,st,bar,A,phase,R){
  const V=b=>b*(.86+R()*.28);
  const cfg=this.cfg,D=MUSIC_DRUMS[cfg.drums]||MUSIC_DRUMS.rock;
  if(D.kick[st])this.vKick(t,V(st===0?.7:.55));
  if(phase>=2&&cfg.drums==='metal'&&st%2===1)this.vKick(t,V(.34));
  if(D.snare[st])this.vSnare(t,V(.24));
  if(D.hat[st])this.vHat(t,V(st%4===0?.055:.035),false);
  if(A.full&&st%2===1)this.vHat(t,V(.022),false);
  if(D.open[st]&&(st===7||st===15))this.vHat(t,V(.06),true);
  if(A.crash&&st===0&&bar%4===0)this.vCrash(t,V(.11));
  if(A.fill&&st>=12){
   if(st===12)this.vTom(t,110,V(.19));
   else if(st===13)this.vTom(t,88,V(.17));
   else if(st===14)this.vTom(t,66,V(.15));
   else this.vSnare(t,V(.18));
  }
 },
 scheduleStep(s,tRaw,spb){
  if(AudioSys.muted)return;
  const cfg=this.cfg,st=s%16,bar=Math.floor(s/16)%16;
  const R=musicRandom((s*48271+1)>>>0);
  const hum=(R()-.5)*.006;
  const t=tRaw+(st%2?cfg.swing*spb:0)+hum;
  const phase=this.phase|0;
  const A=this.arrangementFor(bar,phase);
  const ct=musicChord(cfg,bar);
  const V=b=>b*(.86+R()*.28);
  if(A.drums)this.scheduleDrums(t,st,bar,A,phase,R);
  if(A.pad&&st===0)this.vPad(t,this.padTones(ct),spb*15.4,cfg.kind==='title'?.05:.04,cfg.padWave);
  if(A.bass&&(MUSIC_BASS[cfg.drums]||MUSIC_BASS.rock)[st]){
   let m=st%8===4?ct.fifth:ct.root;
   while(m>48)m-=12;
   while(m<31)m+=12;
   if(A.full&&st===14)m+=12;
   this.vBass(t,m,spb*.9,V(.22),cfg.drums==='metal'?640:520);
  }
  if(A.arp&&(st%2===0||(A.full&&st%2===1))){
   const tones=cfg.seventh?ct.tones.concat(ct.seventh):ct.tones;
   let m=tones[(s>>1)%tones.length]+12;
   if(A.full&&st%2===1)m+=12;
   this.vPluck(t,m,spb*.68,V(.042),cfg.arpWave);
  }
  if(A.lead){
   const ev=(cfg.leadBars[bar]||[]).find(e=>e.st===st);
   if(ev){
    const dur=Math.max(.06,Math.min(spb*7,spb*ev.dur*.92));
    this.vLead(t,ev.m,dur,V(ev.vel)*(cfg.kind==='stage'?.78:1),cfg.leadWave);
    if(phase>=2&&st%4===0)this.vPluck(t,ev.m+12,spb*.5,.026,'triangle');
   }
  }
  if(A.counter&&st===0){
   let m=ct.fifth-12;
   while(m<45)m+=12;
   this.vLead(t,m,spb*6,V(.048),'triangle');
  }
 },
 tick(){
  if(!this.on)return;
  if(!AudioSys.ctx||!this.cfg)return;
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
function musicTimer(){
 if(!Music.timer)Music.timer=setInterval(()=>Music.tick(),40);
}
function startBgm(seed,tempoHint){
 const id='seed:'+seed;
 if(!Music.on||Music._track!==id){
  Music.buildSeed(seed,tempoHint);Music._track=id;Music._seed=seed;Music.step=0;Music.resetClock();
 }
 if(tempoHint){Music.cfg.bpm=tempoHint;Music.setEcho();}
 Music.on=true;Music.phase=0;Music.cfg.phase=0;musicTimer();
}
function startStageBgm(route){
 if(!route)return;
 const id='stage:'+route.id;
 if(!Music.on||Music._track!==id){
  Music.buildStage(route);Music._track=id;Music._seed=route.seed;Music.step=0;Music.resetClock();
 }
 Music.on=true;Music.phase=0;Music.cfg.phase=0;Music.setEcho();musicTimer();
}
function startBossBgm(def,phase){
 if(!def)return;
 phase=clamp(phase|0,0,2);
 const id='boss:'+def.id;
 if(!Music.on||Music._track!==id){
  Music.buildBoss(def,phase);Music._track=id;Music._seed=def.bgmSeed;Music.step=0;Music.resetClock();
 }
 Music.phase=Math.max(Music.phase|0,phase);
 Music.cfg.phase=Music.phase;
 Music.on=true;Music.setEcho();musicTimer();
}
function startTitleBgm(){
 if(!Music.on||Music._track!=='title'){
  Music.buildTitle();Music._track='title';Music._seed=999;Music.step=0;Music.resetClock();
 }
 Music.on=true;Music.phase=0;Music.cfg.phase=0;Music.setEcho();musicTimer();
}
function stopBgm(){
 Music.on=false;
 Music._track=null;
}
