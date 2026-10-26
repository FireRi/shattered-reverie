"use strict";
const http=require("http");
const {WebSocketServer}=require("ws");

const PROTO=1;
const PORT=parseInt(process.env.PORT||"8787",10);
const CODE_RE=/^[A-HJ-NP-Z2-9]{5}$/;
const ROOM_TTL_MS=15*60*1000;
const MAX_PAYLOAD=2048;
const MAX_MSG_PER_SEC=200;
const MAX_ROOMS=500;

const allowedOrigins=(process.env.ALLOWED_ORIGINS||"").split(",").map(s=>s.trim()).filter(Boolean);
function originAllowed(origin){
 if(!allowedOrigins.length||allowedOrigins.includes("*"))return true;
 if(!origin)return true;
 return allowedOrigins.includes(origin);
}

const rooms=new Map();

function validateConfig(c){
 if(!c||typeof c!=="object")return null;
 const diff=Number.isInteger(c.diff)&&c.diff>=0&&c.diff<=5?c.diff:null;
 if(diff===null)return null;
 if(c.story===true)return null;
 const oneCC=c.oneCC===true;
 const seed=Number.isInteger(c.seed)?(c.seed|0):null;
 if(seed===null)return null;
 const D=Number.isInteger(c.D)&&c.D>=1&&c.D<=48?c.D:null;
 if(D===null)return null;
 let flags=[];
 if(Array.isArray(c.flags)){
  if(c.flags.length>64)return null;
  flags=c.flags.map(v=>v===true);
 }
 const chara=Number.isInteger(c.chara)?Math.max(0,Math.min(5,c.chara)):0;
 const p2chara=Number.isInteger(c.p2chara)?Math.max(0,Math.min(5,c.p2chara)):0;
 return {diff,oneCC,story:false,seed,D,flags,autoFire:c.autoFire===true,chara,p2chara};
}

function send(ws,obj){
 if(ws.readyState===1)ws.send(JSON.stringify(obj));
}
function peerOf(ws){
 const room=ws.room;
 if(!room)return null;
 return room.host===ws?room.guest:room.guest===ws?room.host:null;
}
function relay(ws,data,isBinary){
 const peer=peerOf(ws);
 if(peer&&peer.readyState===1)peer.send(data,{binary:isBinary});
}

function closeRoom(room,notify){
 for(const s of [room.host,room.guest]){
  if(!s)continue;
  if(notify)send(s,{t:"room-closed"});
  s.room=null;s.role=null;
 }
 rooms.delete(room.code);
}

function leaveRoom(ws,reason){
 const room=ws.room;
 if(!room)return;
 ws.room=null;
 if(room.host===ws){
  room.host=null;
  if(room.guest){
   send(room.guest,{t:"room-closed",reason:reason||"host-left"});
   room.guest.room=null;room.guest.role=null;
  }
  rooms.delete(room.code);
  return;
 }
 if(room.guest===ws){
  room.guest=null;
  if(room.host)send(room.host,{t:"peer-left",reason:reason||"left"});
  room.last=Date.now();
  return;
 }
}

function handleControl(ws,msg){
 const t=msg&&msg.t;
 switch(t){
  case "hello":{
   if(ws.rejected){send(ws,ws.rejected);try{ws.close(1008,ws.rejected.code);}catch(e){}break;}
   if(ws.role==="host"&&ws.room)send(ws,{t:"created",code:ws.room.code,role:"host"});
   else if(ws.role==="guest"&&ws.room){
    send(ws,{t:"joined",code:ws.room.code,role:"guest"});
    if(ws.room.config)send(ws,{t:"config",config:ws.room.config});
    if(ws.room.host)send(ws.room.host,{t:"peer",role:"guest"});
   }
   break;
  }
  case "config":{
   if(!ws.room||ws.role!=="host"){send(ws,{t:"error",code:"host-only"});break;}
   const clean=validateConfig(msg.config);
   if(!clean){send(ws,{t:"error",code:"bad-config"});break;}
   ws.room.config=clean;ws.room.ready.host=false;ws.room.ready.guest=false;ws.room.last=Date.now();
   relay(ws,JSON.stringify({t:"config",config:clean}),false);
   break;
  }
  case "ready":{
   if(!ws.room){send(ws,{t:"error",code:"no-room"});break;}
   ws.room.ready[ws.role]=msg.ready===true;
   ws.room.last=Date.now();
   relay(ws,JSON.stringify({t:"ready",role:ws.role,ready:msg.ready===true}),false);
   break;
  }
  case "start":{
   if(!ws.room||ws.role!=="host"){send(ws,{t:"error",code:"host-only"});break;}
   const clean=validateConfig(msg.config||ws.room.config);
   if(!clean){send(ws,{t:"error",code:"bad-config"});break;}
   ws.room.config=clean;ws.room.last=Date.now();
   relay(ws,JSON.stringify({t:"start",config:clean}),false);
   break;
  }
  case "pick":{
   if(!ws.room)break;
   relay(ws,JSON.stringify({t:"pick",chara:Number.isInteger(msg.chara)?msg.chara:0}),false);
   break;
  }
  case "rtc-offer":case "rtc-answer":case "rtc-ice":{
   if(!ws.room)break;
   relay(ws,JSON.stringify(msg),false);
   break;
  }
  case "pause-request":{
   if(!ws.room)break;
   const tick=Number.isFinite(msg.tick)?Math.max(0,Math.floor(msg.tick)):0;
   relay(ws,JSON.stringify({t:"pause-request",tick}),false);
   break;
  }
  case "pause-at":{
   if(!ws.room||ws.role!=="host"){send(ws,{t:"error",code:"host-only"});break;}
   const tick=Number.isFinite(msg.tick)?Math.max(0,Math.floor(msg.tick)):0;
   relay(ws,JSON.stringify({t:"pause-at",tick}),false);
   break;
  }
  case "resume":{
   if(!ws.room){send(ws,{t:"error",code:"no-room"});break;}
   relay(ws,JSON.stringify({t:"resume"}),false);
   break;
  }
  case "ping":{
   relay(ws,JSON.stringify({t:"ping",t0:msg.t0}),false);
   break;
  }
  case "pong":{
   relay(ws,JSON.stringify({t:"pong",t0:msg.t0,t1:msg.t1}),false);
   break;
  }
  case "leave":{
   leaveRoom(ws,"left");
   break;
  }
  default:
   send(ws,{t:"error",code:"unknown"});
 }
}

function handleBinary(ws,buf){
 if(!ws.room)return;
 const type=buf[0];
 if(type===1){
  if(buf.length!==13)return;
 }else if(type===2){
  if(buf.length!==9)return;
 }else return;
 relay(ws,buf,true);
}

const server=http.createServer((req,res)=>{
 if(req.url==="/health"||req.url==="/healthz"){
  res.writeHead(200,{"content-type":"application/json","cache-control":"no-store"});
  res.end(JSON.stringify({ok:true,proto:PROTO,rooms:rooms.size,uptime:Math.floor(process.uptime())}));
  return;
 }
 res.writeHead(200,{"content-type":"application/json","cache-control":"no-store"});
 res.end(JSON.stringify({service:"shattered-reverie-relay",proto:PROTO,rooms:rooms.size}));
});

const wss=new WebSocketServer({noServer:true,maxPayload:MAX_PAYLOAD});

server.on("upgrade",(req,socket,head)=>{
 if(!originAllowed(req.headers.origin)){
  socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
  socket.destroy();
  return;
 }
 const url=(req.url||"").split("?")[0];
 if(url!=="/ws"&&url!=="/"){
  socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
  socket.destroy();
  return;
 }
 wss.handleUpgrade(req,socket,head,ws=>wss.emit("connection",ws,req));
});

wss.on("connection",(ws,req)=>{
 ws.isAlive=true;
 ws.room=null;
 ws.role=null;
 ws.rejected=null;
 ws.msgCount=0;
 ws.msgWindow=Date.now();
 let code="",role="";
 try{
  const u=new URL(req.url||"/","http://localhost");
  code=(u.searchParams.get("code")||"").toUpperCase();
  role=u.searchParams.get("role")||"";
 }catch(e){}
 if(!CODE_RE.test(code)||(role!=="host"&&role!=="guest")){
  ws.rejected={t:"error",code:"bad-code"};
 }else if(role==="host"){
  const existing=rooms.get(code);
  if(existing&&existing.host&&existing.host.readyState===1)ws.rejected={t:"error",code:"busy"};
  else if(!existing&&rooms.size>=MAX_ROOMS)ws.rejected={t:"error",code:"busy"};
  else{
   const room={code,host:ws,guest:(existing&&existing.guest&&existing.guest.readyState===1)?existing.guest:null,
    config:existing?existing.config:null,ready:{host:false,guest:false},created:Date.now(),last:Date.now()};
   rooms.set(code,room);ws.room=room;ws.role="host";
  }
 }else{
  const room=rooms.get(code);
  if(!room||!room.host||room.host.readyState!==1)ws.rejected={t:"error",code:"no-room"};
  else if(room.guest&&room.guest.readyState===1)ws.rejected={t:"error",code:"full"};
  else{room.guest=ws;ws.room=room;ws.role="guest";room.last=Date.now();}
 }
 ws.on("pong",()=>{ws.isAlive=true;});
 ws.on("message",(data,isBinary)=>{
  const now=Date.now();
  if(now-ws.msgWindow>=1000){ws.msgWindow=now;ws.msgCount=0;}
  ws.msgCount++;
  if(ws.msgCount>MAX_MSG_PER_SEC){try{ws.close(1008,"rate");}catch(e){}return;}
  if(isBinary){
   handleBinary(ws,Buffer.isBuffer(data)?data:Buffer.from(data));
   return;
  }
  let msg;
  try{msg=JSON.parse(data.toString("utf8"));}catch(e){return;}
  handleControl(ws,msg);
 });
 ws.on("close",()=>leaveRoom(ws,"disconnected"));
 ws.on("error",()=>{});
});

const heartbeat=setInterval(()=>{
 for(const ws of wss.clients){
  if(!ws.isAlive){try{ws.terminate();}catch(e){}continue;}
  ws.isAlive=false;
  try{ws.ping();}catch(e){}
 }
},20000);

const sweeper=setInterval(()=>{
 const now=Date.now();
 for(const room of [...rooms.values()]){
  if(now-room.last>ROOM_TTL_MS)closeRoom(room,true);
 }
},60000);

function shutdown(){
 clearInterval(heartbeat);clearInterval(sweeper);
 for(const ws of wss.clients){try{ws.close(1001,"shutdown");}catch(e){}}
 server.close(()=>process.exit(0));
 setTimeout(()=>process.exit(0),1500).unref();
}
process.on("SIGTERM",shutdown);
process.on("SIGINT",shutdown);

server.listen(PORT,()=>{
 console.log("shattered-reverie-relay listening on :"+PORT+" proto "+PROTO);
});
