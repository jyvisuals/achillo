const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1500);
await p.evaluate(()=>{window.__prepared=[];const t=document.getElementById('track');t.__prepare=(u,i,o,j,slot)=>{window.__prepared.push([slot||'pre',JSON.parse(j).mode]);};});
await p.evaluate(()=>{__t.renderNow();});await p.waitForTimeout(12000);
const prepared=await p.evaluate(()=>window.__prepared);
// the watch started the prepared quick one while the phone slept, 40 s ago; it's 2 min long at most? just check mode + position
const at=await p.evaluate(()=>Date.now()-40000);
await p.evaluate(at=>window.dispatchEvent(new CustomEvent('ach:remote',{detail:{from:'watch',cmd:'start',mode:'snack:doming',pos:0,at,paused:false}})),at);await p.waitForTimeout(400);
const s1=await p.evaluate(()=>({mode:__t.sess&&__t.sess.mode,i:__t.sess&&__t.sess.i}));
await p.evaluate(()=>__t.finish(false));
// a quick one that finished entirely while asleep: should be logged
const at2=await p.evaluate(()=>Date.now()-3600000);
await p.evaluate(at=>window.dispatchEvent(new CustomEvent('ach:remote',{detail:{from:'watch',cmd:'start',mode:'snack:invev',pos:0,at,paused:false}})),at2);await p.waitForTimeout(500);
const s2=await p.evaluate(()=>({sess:!!__t.sess,snacks:(__t.day().snacks||[]).map(x=>x.k)}));
console.log('prepared',JSON.stringify(prepared),'| start asleep',JSON.stringify(s1),'| finished asleep',JSON.stringify(s2),errs);await b.close();})();
