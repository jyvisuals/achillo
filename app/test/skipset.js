const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-29T09:00:00')});await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1500);
await p.evaluate(()=>__t.start(false,false,'snack:doming'));await p.waitForTimeout(500);
const out=[];for(let i=0;i<5;i++){out.push(await p.evaluate(()=>__t.sess?(__t.sess.steps[__t.sess.i]||{}).ex+':'+(__t.sess.steps[__t.sess.i]||{}).kind:'finished'));await p.click('#tSkip');await p.waitForTimeout(300);}
console.log(out.join(' → '),errs);await b.close();})();
