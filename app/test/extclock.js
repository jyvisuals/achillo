const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-30T20:00:00')});await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1500);
await p.evaluate(()=>__t.start(false,false,'snack:doming'));await p.waitForTimeout(500);
const at0=await p.evaluate(()=>Date.now());
// watch paused 30 s into the session while the page was asleep; event arrives 20 s later
await p.clock.runFor(50000);
await p.evaluate(at=>window.dispatchEvent(new CustomEvent('ach:remote',{detail:{from:'watch',cmd:'pause',pos:30,at:at+30000,paused:true}})),at0);
await p.waitForTimeout(300);
const a=await p.evaluate(()=>({paused:document.querySelector('#tPhase').textContent,i:__t.sess.i,ex:__t.sess.steps[__t.sess.i].ex}));
// watch resumes and skips
const at1=await p.evaluate(()=>Date.now());
await p.evaluate(at=>window.dispatchEvent(new CustomEvent('ach:remote',{detail:{from:'watch',cmd:'skip',pos:120,at:at,paused:false}})),at1);
await p.waitForTimeout(300);
const c=await p.evaluate(()=>({phase:document.querySelector('#tPhase').textContent,ex:__t.sess.steps[__t.sess.i].ex,done:JSON.stringify(__t.day().ankleDone||[])}));
// watch ends it
await p.evaluate(()=>window.dispatchEvent(new CustomEvent('ach:remote',{detail:{from:'watch',cmd:'end'}})));await p.waitForTimeout(300);
console.log(JSON.stringify(a),JSON.stringify(c),'ended:',await p.evaluate(()=>!__t.sess),errs);await b.close();})();
