"use strict";
const NET_PROTO=1;
const NET_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const NET_CODE_RE=/^[A-HJ-NP-Z2-9]{5}$/;
const NET_DEFAULT_URL='wss://shattered-reverie-relay.shattered-reverie.workers.dev/ws';
const NET_URL=(()=>{
 try{
  if(typeof window!=='undefined'&&typeof window.LASR_NET_URL==='string'&&window.LASR_NET_URL)return window.LASR_NET_URL;
  const q=new URLSearchParams(location.search).get('server');
  if(q)return q;
  const h=location.hostname;
  if(h==='localhost'||h==='127.0.0.1'||h==='')return 'ws://localhost:8787/ws';
 }catch(e){}
 return NET_DEFAULT_URL;
})();
