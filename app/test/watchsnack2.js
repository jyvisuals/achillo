const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1500);
//
await p.evaluate(()=>window.dispatchEvent(new CustomEvent('ach:remote',{detail:{from:'watch',cmd:'start',mode:'snack'}})));await p.waitForTimeout(600);
console.log('mode',await p.evaluate(()=>__t.sess&&__t.sess.mode),'sent',await p.evaluate(()=>JSON.stringify((window.__watchMsgs||[]).map(x=>x.type))),errs);await b.close();})();
