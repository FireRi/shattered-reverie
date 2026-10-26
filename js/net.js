"use strict";
const Net={
 proto:NET_PROTO,
 active:false,capturing:false,role:null,isHost:false,isGuest:false,code:null,
 ws:null,status:'idle',error:'',msg:'',leaving:false,
 config:null,ready:{host:false,guest:false},localReady:false,peerChara:0,
 seed:null,D:6,tick:0,sendSeq:0,
 mask:0,mask2:0,edge:0,edge2:0,
 ax:0,ay:0,p2ax:0,p2ay:0,analog:false,p2analog:false,focus:false,p2focus:false,
 guestFocus:false,
 localBuf:{},remoteBuf:{},myChecks:{},remoteChecks:{},
 rtt:0,rttP95:0,rttSamples:[],pingT:0,lastPing:0,createAttempts:0,retrying:false,fatal:false,
 paused:false,pauseAt:-1,stalling:false,stallT:0,pendingStart:false,syncUntil:0,
 region:null,peerRegion:null,p2pWanted:false,transport:'relay',pc:null,dc:null,
 _hb:0,

 wsOpen(){return this.ws&&this.ws.readyState===1;},
 sendJson(o){if(this.wsOpen())try{this.ws.send(JSON.stringify(o));}catch(e){}},
 dcOpen(){return !!(this.dc&&this.dc.readyState==='open');},
 dcSend(d){if(this.dcOpen())try{this.dc.send(d);return true;}catch(e){}return false;},
 wsSend(d){if(this.dcSend(d))return;if(this.wsOpen())try{this.ws.send(d);}catch(e){}},
 closeP2P(){try{if(this.dc)this.dc.close();}catch(e){}try{if(this.pc)this.pc.close();}catch(e){}this.dc=null;this.pc=null;this.transport='relay';},
 maybeStartP2P(){
  if(this.p2pWanted)return;
  const a=this.region&&this.region.country,b=this.peerRegion&&this.peerRegion.country;
  if(!a||!b||a!==b)return;
  if(typeof RTCPeerConnection==='undefined')return;
  this.p2pWanted=true;
  if(this.isHost)this.startOffer();
 },
 wireDC(){
  const dc=this.dc;
  dc.onopen=()=>{this.transport='p2p';if(typeof G!=='undefined'&&G)G.onlineMsg='P2P LINK UP';};
  dc.onclose=()=>{this.transport='relay';this.dc=null;if(typeof G!=='undefined'&&G)G.onlineMsg='P2P LOST // RELAY';};
  dc.onmessage=e=>this.onMessage(e,'dc');
 },
 startOffer(){
  try{
   this.pc=new RTCPeerConnection({iceServers:NET_ICE});
   this.dc=this.pc.createDataChannel('lasr',{ordered:false,maxRetransmits:0});
   this.wireDC();
   this.pc.onicecandidate=e=>{if(e.candidate)this.sendJson({t:'rtc-ice',candidate:e.candidate});};
   this.pc.onconnectionstatechange=()=>{const s=this.pc&&this.pc.connectionState;if(s==='failed'||s==='disconnected'||s==='closed')this.closeP2P();};
   this.pc.createOffer().then(o=>this.pc.setLocalDescription(o)).then(()=>this.sendJson({t:'rtc-offer',sdp:this.pc.localDescription})).catch(()=>this.closeP2P());
  }catch(e){this.closeP2P();}
 },
 handleRTC(m){
  try{
   if(m.t==='rtc-offer'){
    this.p2pWanted=true;
    this.pc=new RTCPeerConnection({iceServers:NET_ICE});
    this.pc.ondatachannel=e=>{this.dc=e.channel;this.wireDC();};
    this.pc.onicecandidate=e=>{if(e.candidate)this.sendJson({t:'rtc-ice',candidate:e.candidate});};
    this.pc.onconnectionstatechange=()=>{const s=this.pc&&this.pc.connectionState;if(s==='failed'||s==='disconnected'||s==='closed')this.closeP2P();};
    this.pc.setRemoteDescription(m.sdp).then(()=>this.pc.createAnswer()).then(a=>this.pc.setLocalDescription(a)).then(()=>this.sendJson({t:'rtc-answer',sdp:this.pc.localDescription})).catch(()=>this.closeP2P());
   }else if(m.t==='rtc-answer'){if(this.pc)this.pc.setRemoteDescription(m.sdp).catch(()=>{});}
   else if(m.t==='rtc-ice'){if(this.pc)this.pc.addIceCandidate(m.candidate).catch(()=>{});}
  }catch(e){this.closeP2P();}
 },

 makeCode(){
  let s='';
  try{const a=new Uint8Array(5);crypto.getRandomValues(a);for(let i=0;i<5;i++)s+=NET_ALPHABET[a[i]%NET_ALPHABET.length];}
  catch(e){for(let i=0;i<5;i++)s+=NET_ALPHABET[Math.floor(Math.random()*NET_ALPHABET.length)];}
  return s;
 },
 roomUrl(code,role){const sep=NET_URL.indexOf('?')>=0?'&':'?';return NET_URL+sep+'code='+encodeURIComponent(code)+'&role='+role;},
 connect(code,role){
  if(this.wsOpen()||(this.ws&&this.ws.readyState===0))return;
  if(!NET_URL){this.status='error';this.error='RELAY NOT CONFIGURED';this.msg='SET NET_URL OR USE ?server=';return;}
  this.status='connecting';this.error='';
  let ws;
  try{ws=new WebSocket(this.roomUrl(code,role));}catch(e){this.status='error';this.error='RELAY OFFLINE';return;}
  ws.binaryType='arraybuffer';
  this.ws=ws;
  ws.onopen=()=>{this.status='idle';this.sendJson({t:'hello',proto:NET_PROTO});};
  ws.onmessage=e=>this.onMessage(e);
  ws.onclose=()=>this.onClose();
  ws.onerror=()=>{this.error='RELAY OFFLINE';};
 },

 createRoom(){
  this.role='host';this.isHost=true;this.isGuest=false;
  this.code=this.makeCode();this.createAttempts=0;
  this.connect(this.code,'host');
 },
 joinRoom(code){
  const c=String(code||'').toUpperCase();
  if(!NET_CODE_RE.test(c)){this.error='ENTER A 5-CHARACTER CODE';return;}
  this.role='guest';this.isGuest=true;this.isHost=false;this.code=c;
  this.connect(c,'guest');
 },
 leave(){
  this.leaving=true;
  if(this.wsOpen())this.sendJson({t:'leave'});
  try{if(this.ws)this.ws.close();}catch(e){}
  this.ws=null;this.status='idle';this.reset();
  this.leaving=false;
 },
 reset(){
  this.active=false;this.capturing=false;this.paused=false;this.pauseAt=-1;this.stalling=false;
  this.role=null;this.isHost=false;this.isGuest=false;this.code=null;this.config=null;
  this.ready={host:false,guest:false};this.localReady=false;this.peerChara=0;
  this.localBuf={};this.remoteBuf={};this.myChecks={};this.remoteChecks={};
  this.guestFocus=false;this.tick=0;this.sendSeq=0;this.createAttempts=0;this.retrying=false;this.fatal=false;
  this.rttSamples=[];this.rttP95=0;this.stallT=0;this.pendingStart=false;this.syncUntil=0;this.region=null;this.peerRegion=null;
  this.p2pWanted=false;this.closeP2P();
  if(typeof DMath!=='undefined')DMath.disable();
  if(typeof G!=='undefined'&&G){G.online=false;G.aiDialogue=settings.aiDialogue!==false;}
 },

 onClose(){
  this.ws=null;
  if(this.retrying)return;
  if(this.leaving){this.status='idle';this.active=false;return;}
  if(this.active){this.abortRun('CONNECTION LOST');return;}
  if(this.role){
   this.role=null;this.isHost=false;this.isGuest=false;this.active=false;this.paused=false;
   this.status='error';
   if(this.fatal)this.fatal=false;else this.error='CONNECTION LOST';
   if(typeof G!=='undefined'&&G){G.online=false;G.screen='online';G.onlineMode='error';}
  }else this.status='idle';
 },

 onMessage(e,src){
  const d=e.data;
  if(typeof d==='string'){let m;try{m=JSON.parse(d);}catch(err){return;}this.onControl(m,src||'ws');return;}
  let b;
  if(d instanceof ArrayBuffer)b=new Uint8Array(d);
  else if(d&&d.buffer)b=new Uint8Array(d.buffer);
  else return;
  if(b.length<1)return;
  if(b[0]===1)this.onInput(b);
  else if(b[0]===2)this.onChecksum(b);
 },

 onControl(m,src){
  switch(m.t){
   case 'dp':if(src==='dc')this.dcSend(JSON.stringify({t:'dp2',t0:m.t0}));break;
   case 'dp2':if(Number.isFinite(m.t0)){const r=Math.max(0,performance.now()-m.t0);this.rtt=this.rtt?this.rtt*.6+r*.4:r;this.rttSamples.push(r);if(this.rttSamples.length>24)this.rttSamples.shift();const s=this.rttSamples.slice().sort((a,b)=>a-b);this.rttP95=s[Math.min(s.length-1,Math.floor(s.length*0.95))];}break;
   case 'rtc-offer':case 'rtc-answer':case 'rtc-ice':this.handleRTC(m);break;
   case 'hello':
    if(m.proto!==NET_PROTO){this.status='error';this.error='PROTOCOL MISMATCH';}
    break;
   case 'created':
    this.role='host';this.isHost=true;this.isGuest=false;this.code=m.code;this.status='lobby';
    this.ready={host:false,guest:false};this.localReady=false;this.error='';this.region=m.region||null;
    if(typeof G!=='undefined'&&G){G.onlineMode='lobby';G.onlineCursor=0;G.onlineMsg='';}
    break;
   case 'joined':
    this.role='guest';this.isGuest=true;this.isHost=false;this.code=m.code;this.status='lobby';
    this.ready={host:false,guest:false};this.localReady=false;this.error='';this.region=m.region||null;
    if(typeof G!=='undefined'&&G){G.onlineMode='lobby';G.onlineCursor=0;G.onlineMsg='';}
    break;
   case 'peer':
    this.peerRegion=m.region||null;
    if(typeof G!=='undefined'&&G)G.onlineMsg='P2 CONNECTED';
    this.maybeStartP2P();
    break;
   case 'config':
    this.config=m.config;this.ready={host:false,guest:false};this.localReady=false;
    if(typeof G!=='undefined'&&G)G.onlineMsg='HOST UPDATED THE RUN';
    break;
   case 'pick':
    this.peerChara=clamp(m.chara|0,0,(typeof CHARA_COUNT!=='undefined'?CHARA_COUNT-1:5));
    if(typeof G!=='undefined'&&G){G.charaPicks[this.isHost?1:0]=this.peerChara;G.onlineMsg='P2 PICKED A CHARACTER';}
    break;
   case 'ready':
    this.ready[m.role]=m.ready===true;
    break;
   case 'start':
    this.beginRun(m.config);
    break;
   case 'pause-request':
    if(this.isHost&&this.active){
     const t=Math.max(this.tick,Math.floor(m.tick||0))+2*this.D+15;
     this.pauseAt=t;this.sendJson({t:'pause-at',tick:t});
    }
    break;
   case 'pause-at':
    if(this.active){const t=Math.floor(m.tick||0);this.pauseAt=this.tick>t?this.tick:t;}
    break;
   case 'resume':
    if(this.active)this.resume();
    break;
   case 'ping':
    this.sendJson({t:'pong',t0:m.t0,t1:performance.now()});
    break;
   case 'pong':
    if(Number.isFinite(m.t0)){
     const r=Math.max(0,performance.now()-m.t0);
     this.rtt=this.rtt?this.rtt*.6+r*.4:r;
     this.rttSamples.push(r);if(this.rttSamples.length>24)this.rttSamples.shift();
     const s=this.rttSamples.slice().sort((a,b)=>a-b);
     this.rttP95=s[Math.min(s.length-1,Math.floor(s.length*0.95))];
    }
    break;
   case 'peer-left':
    if(this.active)this.abortRun('PEER DISCONNECTED');
    else{this.ready={host:false,guest:false};this.localReady=false;if(typeof G!=='undefined'&&G)G.onlineMsg='P2 LEFT';}
    break;
   case 'room-closed':
    this.leave();
    if(typeof G!=='undefined'&&G){G.screen='online';G.onlineMode='error';}
    this.status='error';this.error='ROOM CLOSED';
    break;
   case 'error':
    if(m.code==='busy'&&this.role==='host'&&this.createAttempts<8){
     this.createAttempts++;this.retrying=true;this.error='';this.status='connecting';
     try{if(this.ws)this.ws.close();}catch(e){}
     this.ws=null;this.code=this.makeCode();
     const self=this;
     setTimeout(()=>{self.retrying=false;self.connect(self.code,'host');},60);
     break;
    }
    if(m.code==='no-room'||m.code==='full'||m.code==='bad-code'||m.code==='proto')this.fatal=true;
    this.error=({already:'ALREADY IN A ROOM',busy:'RELAY BUSY',badcode:'INVALID CODE','bad-code':'INVALID CODE','no-room':'ROOM NOT FOUND',full:'ROOM FULL','host-only':'HOST ONLY','bad-config':'BAD CONFIG',proto:'PROTOCOL MISMATCH'})[m.code]||'RELAY ERROR';
    this.status=this.role?'lobby':'error';
    break;
  }
 },

 onInput(b){
  const tick=(b[1]|(b[2]<<8)|(b[3]<<16)|(b[4]<<24))>>>0;
  const mask=(b[5]|(b[6]<<8)|(b[7]<<16)|(b[8]<<24))>>>0;
  const axs=b[9]|(b[10]<<8);const ays=b[11]|(b[12]<<8);
  const ax=(axs>32767?axs-65536:axs)/1000;
  const ay=(ays>32767?ays-65536:ays)/1000;
  this.remoteSeq=Math.max(this.remoteSeq||0,tick);
  this.remoteBuf[tick]={mask,ax,ay};
 },
 onChecksum(b){
  const tick=(b[1]|(b[2]<<8)|(b[3]<<16)|(b[4]<<24))>>>0;
  const hash=(b[5]|(b[6]<<8)|(b[7]<<16)|(b[8]<<24))>>>0;
  if(this.myChecks[tick]!==undefined){if(this.myChecks[tick]!==hash)this.desync();}
  else this.remoteChecks[tick]=hash;
 },

 sampleLocal(){
  const list=NET_KEYS;let mask=0,e=0;
  if(this.isGuest){
   for(let i=0;i<list.length;i++){const k=list[i];
    if(down(k)||p2keys[k]||pad2Keys[k])mask|=1<<i;
    if(edge[k]||padEdge[k]||p2edge[k]||pad2Edge[k])e|=1<<i;}
   mask|=e<<8;
   if(this.guestFocus)mask|=1<<16;
   const stick=IS_TOUCH&&TouchUI.stick.active;
   if(stick){mask|=1<<17;return {mask,ax:TouchUI.stick.ax,ay:TouchUI.stick.ay};}
   return {mask,ax:0,ay:0};
  }
  for(let i=0;i<list.length;i++){const k=list[i];
   if(down(k))mask|=1<<i;
   if(edge[k]||padEdge[k])e|=1<<i;}
  mask|=e<<8;
  if(TouchUI.focus)mask|=1<<16;
  if(typeof autoFire!=='undefined'&&autoFire)mask|=1<<18;
  const stick=IS_TOUCH&&TouchUI.stick.active;
  if(stick){mask|=1<<17;return {mask,ax:TouchUI.stick.ax,ay:TouchUI.stick.ay};}
  return {mask,ax:0,ay:0};
 },

 sendInput(tick,mask,ax,ay){
  const b=new Uint8Array(13);b[0]=1;
  b[1]=tick&255;b[2]=(tick>>8)&255;b[3]=(tick>>16)&255;b[4]=(tick>>24)&255;
  b[5]=mask&255;b[6]=(mask>>8)&255;b[7]=(mask>>16)&255;b[8]=(mask>>24)&255;
  let axs=Math.round((ax||0)*1000);axs=axs<-32768?-32768:axs>32767?32767:axs;axs&=0xffff;
  let ays=Math.round((ay||0)*1000);ays=ays<-32768?-32768:ays>32767?32767:ays;ays&=0xffff;
  b[9]=axs&255;b[10]=(axs>>8)&255;b[11]=ays&255;b[12]=(ays>>8)&255;
  this.wsSend(b);
 },

 pump(){
  if(this.pendingStart){if(performance.now()>=this.syncUntil)this.completeStart();return;}
  if(!this.active||this.paused)return;
  const now=performance.now();
  if(now-this.lastPing>1000){this.lastPing=now;this.pingT=now;this.sendJson({t:'ping',t0:now});if(this.dcOpen())this.dcSend(JSON.stringify({t:'dp',t0:now}));}
  const limit=this.tick+this.D+2;
  while(this.sendSeq<limit){const s=this.sampleLocal();this.localBuf[this.sendSeq]={mask:s.mask,ax:s.ax,ay:s.ay};this.sendInput(this.sendSeq,s.mask,s.ax,s.ay);this.sendSeq++;}
 },

 shouldPause(){return this.active&&!this.paused&&this.pauseAt>=0&&this.tick>=this.pauseAt;},
 enterPause(){
  this.paused=true;this.capturing=false;
  if(typeof G!=='undefined'&&G&&G.screen==='play'){G.screen='pause';G.pauseCursor=0;G.pauseConfirm=null;sfx('cur');}
 },
 requestPause(){
  if(!this.active||this.paused)return;
  if(this.isHost){const t=this.tick+2*this.D+15;this.pauseAt=t;this.sendJson({t:'pause-at',tick:t});}
  else this.sendJson({t:'pause-request',tick:this.tick});
 },
 requestResume(){if(this.active&&this.paused){this.sendJson({t:'resume'});this.resume();}},
 resume(){
  if(!this.paused)return;
  this.paused=false;this.pauseAt=-1;this.stalling=false;
  this.localBuf={};this.remoteBuf={};this.sendSeq=this.tick;
  if(typeof G!=='undefined'&&G){G.screen='play';G.pauseConfirm=null;}
  sfx('ok');
 },

 beforeTick(){
  if(!this.active)return true;
  const li=this.localBuf[this.tick],ri=this.remoteBuf[this.tick];
  if(!li||!ri){this.stalling=true;this.stallT++;return false;}
  delete this.localBuf[this.tick];delete this.remoteBuf[this.tick];
  let m1,m2,a1x,a1y,a2x,a2y;
  if(this.isHost){m1=li.mask;a1x=li.ax;a1y=li.ay;m2=ri.mask;a2x=ri.ax;a2y=ri.ay;}
  else{m1=ri.mask;a1x=ri.ax;a1y=ri.ay;m2=li.mask;a2x=li.ax;a2y=li.ay;}
  this.tick++;
  this.mask=m1;this.mask2=m2;
  this.edge=(m1>>8)&0xff;this.edge2=(m2>>8)&0xff;
  this.analog=!!(m1&(1<<17));this.ax=a1x;this.ay=a1y;
  this.p2analog=!!(m2&(1<<17));this.p2ax=a2x;this.p2ay=a2y;
  this.focus=!!(m1&(1<<16));this.p2focus=!!(m2&(1<<16));
  this.capturing=true;this.stalling=false;this.stallT=0;
  if(typeof Replay!=='undefined'&&Replay.rec&&Replay.rec.online)Replay.captureNet(m1,a1x,a1y,m2,a2x,a2y);
  if(this.tick%30===0)this.sendChecksum();
  return true;
 },

 hash(){
  let h=2166136261>>>0;
  const mix=v=>{const n=Math.floor(Math.abs(v)*256)&0x7fffffff;h^=n;h=Math.imul(h,16777619)>>>0;};
  const mixi=v=>{h^=(v|0)&0x7fffffff;h=Math.imul(h,16777619)>>>0;};
  mixi(SimRng.state||0);mixi(G.simFrame);mixi(G.routeIdx);mixi(G.bossIdx);mixi(G.score);
  mixi(G.spellsPlayed);mixi(G.spellsCaptured);mixi(G.deaths);mixi(G.coins);mixi(G.od);mixi(G.trance);
  for(const p of players){mix(p.x);mix(p.y);mixi(p.lives);mixi(p.spells);mixi(p.power);mixi(p.dead);mixi(p.inv);}
  if(BOSS){mix(BOSS.x);mix(BOSS.y);mix(BOSS.hp);mixi(BOSS.timer);mixi((BOSS.state||'').length);}
  mixi(eshots.length);mixi(mobs.length);mixi(items.length);mixi(pshots.length);mixi(elasers.length);
  for(let i=0;i<eshots.length;i+=7){const b=eshots[i];mix(b.x);mix(b.y);}
  return h>>>0;
 },
 sendChecksum(){
  const h=this.hash();this.myChecks[this.tick]=h;
  if(this.remoteChecks[this.tick]!==undefined&&this.remoteChecks[this.tick]!==h){this.desync();return;}
  const b=new Uint8Array(9);b[0]=2;const t=this.tick;
  b[1]=t&255;b[2]=(t>>8)&255;b[3]=(t>>16)&255;b[4]=(t>>24)&255;
  b[5]=h&255;b[6]=(h>>8)&255;b[7]=(h>>16)&255;b[8]=(h>>24)&255;
  this.wsSend(b);
  for(const k of Object.keys(this.myChecks)){if((+k)<this.tick-600)delete this.myChecks[k];}
  for(const k of Object.keys(this.remoteChecks)){if((+k)<this.tick-600)delete this.remoteChecks[k];}
 },
 desync(){
  if(this.active){
   if(typeof Replay!=='undefined'&&Replay.rec)Replay.abort();
   if(typeof DMath!=='undefined')DMath.disable();
   if(typeof G!=='undefined'&&G&&typeof deactivatePlayer2==='function')deactivatePlayer2();
  }
  try{if(this.wsOpen())this.sendJson({t:'leave'});}catch(e){}
  this.leave();
  this.status='error';this.error='DESYNC DETECTED';
  if(typeof G!=='undefined'&&G){G.online=false;G.screen='online';G.onlineMode='error';}
 },

 applyConfig(c){
  this.config=c;this.seed=c.seed;this.D=c.D;
  if(typeof G!=='undefined'&&G){
   G.onlineCfg={diff:c.diff,oneCC:!!c.oneCC,flags:(c.flags||[]).slice(),seed:c.seed,D:c.D,autoFire:!!c.autoFire};
  }
 },
 beginRun(config){
  this.applyConfig(config);
  this.tick=0;this.sendSeq=0;this.localBuf={};this.remoteBuf={};this.myChecks={};this.remoteChecks={};
  this.paused=false;this.pauseAt=-1;this.stalling=false;this.stallT=0;this.capturing=false;
  this.active=true;
  const LEAD=1500;
  const oneWay=this.rtt>0?this.rtt*0.5:80;
  const delay=Math.max(200,this.isHost?LEAD:(LEAD-oneWay));
  this.syncUntil=performance.now()+delay;
  this.pendingStart=true;
  if(typeof G!=='undefined'&&G){G.onlineMode='lobby';G.onlineMsg='SYNCING...';}
 },
 completeStart(){
  if(!this.pendingStart)return;
  this.pendingStart=false;this.syncUntil=0;
  if(typeof startOnlineRun==='function')startOnlineRun(this);
  else this.abortRun('START FAILED');
 },
 startHostRun(config){
  this.applyConfig(config);
  this.sendJson({t:'start',config:config});
  this.beginRun(config);
 },

 abortRun(reason){
  const wasConnected=this.wsOpen();
  this.active=false;this.capturing=false;this.paused=false;this.pauseAt=-1;this.stalling=false;
  this.localBuf={};this.remoteBuf={};this.closeP2P();
  if(typeof DMath!=='undefined')DMath.disable();
  if(typeof Replay!=='undefined'&&Replay.rec)Replay.abort();
  if(typeof G!=='undefined'&&G){
   G.online=false;G.aiDialogue=settings.aiDialogue!==false;
   if(typeof deactivatePlayer2==='function')deactivatePlayer2();
   if(typeof clearP2Input==='function')clearP2Input();
   if(wasConnected){this.status='lobby';G.screen='online';G.onlineMode='lobby';G.onlineMsg=reason||'';}
   else{G.screen='online';G.onlineMode='error';}
  }
  if(!wasConnected){this.status='error';this.error=reason||'DISCONNECTED';}
 },

 onTitle(){
  if(this.active||this.role||this.ws){this.leave();}
 }
};

if(typeof document!=='undefined'&&document.getElementById){
 const el=document.getElementById('roomCode');
 if(el){
  Net.codeEl=el;
  el.addEventListener('input',()=>{
   const v=String(el.value||'').toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g,'').slice(0,5);
   el.value=v;
   try{el.setSelectionRange(v.length,v.length);}catch(e){}
   if(typeof G!=='undefined'&&G)G.onlineCode=v;
  });
  el.addEventListener('keydown',e=>{
   if(e.key==='Enter'){if(typeof G!=='undefined'&&G){G.onlineCode=String(el.value||'').toUpperCase();}Net.joinRoom(el.value);}
   else if(e.key==='Escape'){if(typeof G!=='undefined'&&G)G.onlineMode='menu';el.blur();}
   e.stopPropagation();
  });
 }
}
