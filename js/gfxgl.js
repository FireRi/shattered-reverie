"use strict";
/* ================= WEBGL PROJECTILE BATCH (optional) =================
   Instanced rendering for enemy bullets that resolve to a cached sprite.
   Renders to an offscreen 640x480 WebGL canvas, then blits once into the
   2D canvas. Falls back to the Canvas 2D path when WebGL is unavailable. */
const GfxGL=(function(){
 const MAX=4096,FSTRIDE=10;
 const glc=(typeof document!=='undefined')?document.createElement('canvas'):null;
 let gl=null,ok=false,tried=false,inst=null,ext=null,prog=null,tex=null;
 let atlasCv=null,atlasCtx=null,PW=2048,PH=2048,px=0,py=0,rowH=0;
 const cells=new Map();const ids=new WeakMap();const bakeCache=new Map();let idc=0;
 let buf=null,dataArr=new Float32Array(MAX*FSTRIDE),cornerBuf=null;
 let aCorner=-1,aUV=-1,aPos=-1,aSize=-1,aRot=-1,aAlpha=-1,uRes=null,uTex=null;
 let lastN=0;

 function glCompile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s;}
 function init(){
  if(!glc||ok)return ok;
  try{
   gl=glc.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false})
     ||glc.getContext('experimental-webgl',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false});
  }catch(e){gl=null;}
  if(!gl||typeof gl.createShader!=='function')return false;
  glc.width=W;glc.height=H;
  ext=gl.getExtension('ANGLE_instanced_arrays');
  const isGL2=(typeof WebGL2RenderingContext!=='undefined')&&(gl instanceof WebGL2RenderingContext);
  if(!isGL2&&!ext)return false;
  const vs=glCompile(gl.VERTEX_SHADER,
   'attribute vec2 a_corner;attribute vec4 a_uv;attribute vec2 a_pos;attribute vec2 a_size;attribute float a_rot;attribute float a_alpha;'+
   'uniform vec2 u_res;varying vec2 v_uv;varying float v_alpha;'+
   'void main(){float c=cos(a_rot),s=sin(a_rot);vec2 p=a_corner*a_size;vec2 rp=vec2(p.x*c-p.y*s,p.x*s+p.y*c);vec2 pos=a_pos+rp;'+
   'vec2 clip=vec2(pos.x/u_res.x*2.0-1.0,1.0-pos.y/u_res.y*2.0);gl_Position=vec4(clip,0.0,1.0);'+
   'v_uv=a_uv.xy+(a_corner+0.5)*a_uv.zw;v_alpha=a_alpha;}');
  const fs=glCompile(gl.FRAGMENT_SHADER,
   'precision mediump float;uniform sampler2D u_tex;varying vec2 v_uv;varying float v_alpha;'+
   'void main(){vec4 c=texture2D(u_tex,v_uv);gl_FragColor=c*v_alpha;}');
  prog=gl.createProgram();gl.attachShader(prog,vs);gl.attachShader(prog,fs);gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){prog=null;return false;}
  gl.useProgram(prog);
  aCorner=gl.getAttribLocation(prog,'a_corner');aUV=gl.getAttribLocation(prog,'a_uv');
  aPos=gl.getAttribLocation(prog,'a_pos');aSize=gl.getAttribLocation(prog,'a_size');
  aRot=gl.getAttribLocation(prog,'a_rot');aAlpha=gl.getAttribLocation(prog,'a_alpha');
  uRes=gl.getUniformLocation(prog,'u_res');uTex=gl.getUniformLocation(prog,'u_tex');
  gl.uniform2f(uRes,W,H);gl.uniform1i(uTex,0);
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.DEPTH_TEST);
  cornerBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,cornerBuf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-.5,-.5,.5,-.5,.5,.5,-.5,-.5,.5,.5,-.5,.5]),gl.STATIC_DRAW);
  buf=gl.createBuffer();
  atlasCv=document.createElement('canvas');atlasCv.width=PW;atlasCv.height=PH;
  atlasCtx=atlasCv.getContext('2d');
  tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  window.addEventListener('webglcontextlost',e=>{},false);
  glc.addEventListener('webglcontextlost',e=>{e.preventDefault();ok=false;},false);
  glc.addEventListener('webglcontextrestored',()=>{ok=false;init();},false);
  ok=true;
  return true;
 }
 function uploadAtlas(){try{gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlasCv);return true;}catch(e){ok=false;return false;}}
 function addSource(src){
  if(!src)return null;
  let id=ids.get(src);
  if(id===undefined){id=++idc;ids.set(src,id);}
  const key='s'+id;
  let cell=cells.get(key);
  if(cell)return cell;
  const w=src.width,h=src.height;
  if(px+w>PW){px=0;py+=rowH;rowH=0;}
  if(py+h>PH)return null;
  atlasCtx.clearRect(px,py,w,h);
  try{atlasCtx.drawImage(src,px,py);}catch(e){return null;}
  if(!uploadAtlas())return null;
  cell={u0:px/PW,v0:py/PH,u1:(px+w)/PW,v1:(py+h)/PH};
  cells.set(key,cell);
  px+=w;if(h>rowH)rowH=h;
  return cell;
 }
 function pushBullet(b,o){
  const c=COL[b.c]||COL.white,fxOn=perfLevel>0,grow=Math.min(1,.35+b.t*.16);
  let src=null,size=0,rot=0;
  const fam=b.g==='ball'?(b.c==='black'&&ASSETS.th_shadowbullet?'shadow':(thImg('ball',b.c)?'ball':null)):b.g==='rice'?(thImg('rice',b.c)?'rice':null):b.g==='kunai'?(thImg('ah',b.c)?'ah':null):b.g==='orb'?((ASSETS['orb_'+TH_COLOR[b.c]])?'orb':null):null;
  if(fam){
   const s=bulletSprite(fam,b.c,c[0],fxOn);
   if(s){const r=(b.r||5)*grow*1.25;size=BSPR_SIZE*(r/BSPR_REF);rot=(fam!=='ball'&&fam!=='orb')?Math.atan2(b.vy,b.vx)+Math.PI/2:0;src=s;}
  }
  if(!src&&(b.g==='ball'||b.g==='orb'||b.g==='star'||b.g==='bubble')){
   const p=proceduralSprite(b.g,b.c,c,fxOn);
   if(p){const base=b.g==='star'?(b.r||7):b.g==='bubble'?(b.r||14):(b.r||5);
    const growF=b.g==='star'?1:grow;const mul=b.g==='bubble'?1.15:1;
    size=BSPR_SIZE*(base*growF*mul/BSPR_REF);rot=b.g==='star'?(b.spin||0):0;src=p;}
  }
  if(!src)return false;
  const cell=addSource(src);
  if(!cell)return false;
  if(b.trail&&b.th){
   const A=[.5,.3,.14],S=[.72,.5,.32];
   for(let k=0;k<3;k++){const p=b.th[k+1];if(!p)break;pushInst(cell,p.x,p.y,size*S[k],rot,(b.alpha??1)*A[k],o);}
  }
  pushInst(cell,b.x,b.y,size,rot,(b.alpha??1),o);
  return true;
 }
 function pushInst(cell,x,y,size,rot,alpha,o){
  if(o.n>=MAX)return false;
  const i=o.n*FSTRIDE;
  dataArr[i]=cell.u0;dataArr[i+1]=cell.v0;dataArr[i+2]=cell.u1-cell.u0;dataArr[i+3]=cell.v1-cell.v0;
  dataArr[i+4]=x;dataArr[i+5]=y;dataArr[i+6]=size;dataArr[i+7]=size;dataArr[i+8]=rot;dataArr[i+9]=alpha;
  o.n++;
  return true;
 }
 function bakePShot(type,col,own,pierce){
  if(typeof drawPShot!=='function'||typeof document==='undefined')return null;
  const key='p|'+type+'|'+col+'|'+(own?1:0)+'|'+(type==='lance'?(pierce?1:0):0);
  let cv=bakeCache.get(key);
  if(cv)return cv;
  cv=document.createElement('canvas');cv.width=cv.height=64;
  const c2=cv.getContext('2d');
  c2.translate(32,32);
  try{drawPShot({type,x:0,y:0,vx:0,vy:-1,col,own:own?1:0,pierce:pierce?1:0,t:0},c2);}catch(e){return null;}
  bakeCache.set(key,cv);
  return cv;
 }
 function bakeItem(type){
  if(typeof drawItem!=='function'||typeof document==='undefined')return null;
  const key='i|'+type;
  let cv=bakeCache.get(key);
  if(cv)return cv;
  cv=document.createElement('canvas');cv.width=cv.height=32;
  const c2=cv.getContext('2d');
  const gf=G.frame;G.frame=0;
  try{drawItem(c2,{t:type,x:0,y:0,ground:false,life:999});}catch(e){}
  G.frame=gf;
  bakeCache.set(key,cv);
  return cv;
 }
 function renderShotsItems(sh,its){
  if(!ok)return false;
  const o={n:0};
  for(let k=0;k<sh.length;k++){
   const b=sh[k];
   if(b.x<-24||b.x>W+24||b.y<-32||b.y>H+32)continue;
   const cell=addSource(bakePShot(b.type,b.col||'#9cf',b.own===1,b.pierce));
   if(!cell)continue;
   pushInst(cell,b.x,b.y,64,Math.atan2(b.vy,b.vx)+Math.PI/2,1,o);
  }
  const pulse=15+2*Math.sin(G.frame/9);
  const isz=32*(pulse/15);
  for(let k=0;k<its.length;k++){
   const it=its[k];
   if(it.x<-14||it.x>W+14||it.y<-16||it.y>H+16)continue;
   const cell=addSource(bakeItem(it.t));
   if(!cell)continue;
   const a=(it.ground&&it.life<120&&Math.floor(G.frame/5)%2===0)?.35:1;
   pushInst(cell,it.x,it.y,isz,0,a,o);
  }
  if(!ok){cx.save();cx.imageSmoothingEnabled=false;for(let k=0;k<sh.length;k++)drawPShot(sh[k]);for(let k=0;k<its.length;k++)drawItem(cx,its[k]);cx.restore();return true;}
  if(o.n===0)return true;
  gl.viewport(0,0,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  lastN=o.n;draw();blit();
  return true;
 }
 function bindAttrib(loc,size,stride,offset,divisor){
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc,size,gl.FLOAT,false,stride,offset);
  if(ext)ext.vertexAttribDivisorANGLE(loc,divisor);else gl.vertexAttribDivisor(loc,divisor);
 }
 function draw(){
  gl.bindBuffer(gl.ARRAY_BUFFER,cornerBuf);
  gl.enableVertexAttribArray(aCorner);
  gl.vertexAttribPointer(aCorner,2,gl.FLOAT,false,0,0);
  if(ext)ext.vertexAttribDivisorANGLE(aCorner,0);else gl.vertexAttribDivisor(aCorner,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,dataArr.subarray(0,lastN*FSTRIDE),gl.DYNAMIC_DRAW);
  const st=FSTRIDE*4;
  bindAttrib(aUV,4,st,0,1);
  bindAttrib(aPos,2,st,16,1);
  bindAttrib(aSize,2,st,24,1);
  bindAttrib(aRot,1,st,32,1);
  bindAttrib(aAlpha,1,st,36,1);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
  if(ext)ext.drawArraysInstancedANGLE(gl.TRIANGLES,0,6,lastN);else gl.drawArraysInstanced(gl.TRIANGLES,0,6,lastN);
 }
 function blit(){
  cx.save();cx.imageSmoothingEnabled=false;cx.drawImage(glc,0,0,W,H);cx.restore();
 }
 function renderBullets(list){
  if(!ok)return false;
  const o={n:0};const fb=[];
  for(let k=0;k<list.length;k++){
   const b=list[k];
   if(b.x<-30||b.x>W+30||b.y<-30||b.y>H+30)continue;
   if(o.n>=MAX)break;
   if(!pushBullet(b,o))fb.push(b);
  }
  if(!ok){cx.save();cx.imageSmoothingEnabled=false;for(let k=0;k<list.length;k++){const b=list[k];if(b.x<-30||b.x>W+30||b.y<-30||b.y>H+30)continue;drawBullet(b);}cx.restore();return true;}
  if(o.n===0&&fb.length===0)return true;
  gl.viewport(0,0,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  lastN=o.n;
  if(lastN)draw();
  blit();
  if(fb.length){cx.save();cx.imageSmoothingEnabled=false;for(let k=0;k<fb.length;k++)drawBullet(fb[k]);cx.restore();}
  return true;
 }
 function renderAll(list,sh,its){
  if(!ok)return false;
  const o={n:0};const fb=[];
  for(let k=0;k<list.length;k++){
   const b=list[k];
   if(b.x<-30||b.x>W+30||b.y<-30||b.y>H+30)continue;
   if(o.n>=MAX)break;
   if(!pushBullet(b,o))fb.push(b);
  }
  for(let k=0;k<sh.length;k++){
   const b=sh[k];
   if(b.x<-24||b.x>W+24||b.y<-32||b.y>H+32)continue;
   const cell=addSource(bakePShot(b.type,b.col||'#9cf',b.own===1,b.pierce));
   if(cell)pushInst(cell,b.x,b.y,64,Math.atan2(b.vy,b.vx)+Math.PI/2,1,o);
  }
  const pulse=15+2*Math.sin(G.frame/9);const isz=32*(pulse/15);
  for(let k=0;k<its.length;k++){
   const it=its[k];
   if(it.x<-14||it.x>W+14||it.y<-16||it.y>H+16)continue;
   const cell=addSource(bakeItem(it.t));
   if(cell)pushInst(cell,it.x,it.y,isz,0,(it.ground&&it.life<120&&Math.floor(G.frame/5)%2===0)?.35:1,o);
  }
  if(!ok){
   cx.save();cx.imageSmoothingEnabled=false;
   for(let k=0;k<list.length;k++){const b=list[k];if(b.x<-30||b.x>W+30||b.y<-30||b.y>H+30)continue;drawBullet(b);}
   for(let k=0;k<sh.length;k++)drawPShot(sh[k]);
   for(let k=0;k<its.length;k++)drawItem(cx,its[k]);
   cx.restore();
   return true;
  }
  if(fb.length){cx.save();cx.imageSmoothingEnabled=false;for(let k=0;k<fb.length;k++)drawBullet(fb[k]);cx.restore();}
  if(o.n===0)return true;
  gl.viewport(0,0,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  lastN=o.n;draw();blit();
  return true;
 }
 function available(){if(ok)return true;if(tried)return false;tried=true;return init();}
 return {init,available,renderBullets,renderShotsItems};
})();
