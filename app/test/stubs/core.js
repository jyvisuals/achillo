export const Capacitor={isNativePlatform:()=>true,getPlatform:()=>'ios',isPluginAvailable:()=>true};
window.__aa={calls:[],L:{},playing:false,pos:0,t:0,dur:0};
export function registerPlugin(name){const a=window.__aa;const now=()=>performance.now();
 const cur=()=>a.playing?a.pos+(now()-a.t)/1000:a.pos;
 return {
  open:async(o)=>{a.calls.push('open:'+String(o.path).split('/').pop());a.dur=60;a.pos=0;return {duration:a.dur};},
  play:async(o)=>{a.calls.push('play');if(window.__failNative)throw new Error('simulated native failure');if(o&&o.time!=null)a.pos=o.time;a.playing=true;a.t=now();return {playing:true,position:a.pos};},
  pause:async()=>{a.calls.push('pause');a.pos=cur();a.playing=false;return {position:a.pos};},
  seek:async(o)=>{a.calls.push('seek');a.pos=o.time;a.t=now();},
  stop:async()=>{a.calls.push('stop');a.playing=false;},
  status:async()=>({playing:a.playing,position:cur(),duration:a.dur,speaking:false}),
  speak:async(o)=>{a.calls.push('speak:'+o.text.slice(0,20));},
  render:async(o)=>{a.calls.push('render:'+o.items.length+':'+o.out);a.rendered=o;await new Promise(r=>setTimeout(r,a.renderMs||300));if(a.renderFail)throw new Error('render broke');return {path:'file:///cache/'+o.out,placed:o.items.length,duration:a.dur};},
  stopSpeaking:async()=>{a.calls.push('stopSpeaking');},
  voices:async()=>({voices:[{id:'com.apple.voice.enhanced.en-US.Zoe',name:'Zoe',lang:'en-US',quality:'enhanced'}]}),
  nowPlaying:async(o)=>{a.calls.push('np:'+o.title+'|'+o.artist);},
  addListener:(n,f)=>{a.L[n]=f;return {remove(){}};},
 };}
