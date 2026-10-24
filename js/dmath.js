"use strict";
/* Deterministic math shim for online lockstep and seeded replay playback.
   Uses only +,-,*,/ and comparisons so results are identical across JS engines.
   Enabled only while an online run or a seeded replay is active; solo play keeps native Math. */
const DMath=(()=>{
 const PI=3.141592653589793,TAU=PI*2,HALF=PI*.5;
 const orig={sin:Math.sin,cos:Math.cos,atan2:Math.atan2,sqrt:Math.sqrt,hypot:Math.hypot};
 function reduce(x){
  if(!isFinite(x))return 0;
  let n=x/TAU;
  n=n>=0?Math.floor(n):Math.ceil(n);
  x-=n*TAU;
  if(x>PI)x-=TAU;else if(x<-PI)x+=TAU;
  return x;
 }
 function sinPoly(x){
  const x2=x*x;
  return x*(1+x2*(-1/6+x2*(1/120+x2*(-1/5040+x2*(1/362880+x2*(-1/39916800))))));
 }
 function dsin(x){
  x=reduce(x);
  if(x>HALF)x=PI-x;else if(x<-HALF)x=-PI-x;
  return sinPoly(x);
 }
 function dcos(x){return dsin(x+HALF);}
 function datanUnit(x){
  const x2=x*x;
  return x*(0.99997726+x2*(-0.33262347+x2*(0.19354346+x2*(-0.11643287+x2*(0.05265332+x2*(-0.01172120))))));
 }
 function datan(x){
  if(x===0)return 0;
  const neg=x<0;
  x=neg?-x:x;
  let inv=false;
  if(x>1){x=1/x;inv=true;}
  let a=inv?HALF-datanUnit(x):datanUnit(x);
  return neg?-a:a;
 }
 function datan2(y,x){
  if(x===0){
   if(y>0)return HALF;
   if(y<0)return -HALF;
   return 0;
  }
  let a=datan(y/x);
  if(x<0){if(y>=0)a+=PI;else a-=PI;}
  return a;
 }
 function dsqrt(x){
  if(x===0)return 0;
  if(x<0)return NaN;
  if(!isFinite(x))return Infinity;
  let s=1;
  while(x>=4){x*=.25;s*=2;}
  while(x<1){x*=4;s*=.5;}
  let r=.5*(1+x);
  for(let i=0;i<6;i++)r=.5*(r+x/r);
  return r*s;
 }
 function dhypot(x,y){return dsqrt(x*x+y*y);}
 let enabled=false;
 function enable(){
  if(enabled)return;
  enabled=true;
  Math.sin=dsin;Math.cos=dcos;Math.atan2=datan2;Math.sqrt=dsqrt;Math.hypot=dhypot;
 }
 function disable(){
  if(!enabled)return;
  enabled=false;
  Math.sin=orig.sin;Math.cos=orig.cos;Math.atan2=orig.atan2;Math.sqrt=orig.sqrt;Math.hypot=orig.hypot;
 }
 return {enable,disable,enabled:()=>enabled,sin:dsin,cos:dcos,atan2:datan2,sqrt:dsqrt,hypot:dhypot,PI:PI,TAU:TAU};
})();
