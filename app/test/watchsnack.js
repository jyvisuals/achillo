const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.__sent=[];window.addEventListener('ach:watch',e=>{try{window.__sent.push(JSON.parse(e.detail.json).type)}catch(x){}});});
await p.clock.install({time:new Date('2026-10-30T16:00:00')});await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.clock.runFor(3000);
const menu='';
await p.evaluate(()=>window.dispatchEvent(new CustomEvent('ach:remote',{detail:{from:'watch',cmd:'start',mode:'snack'}})));await p.waitForTimeout(400);
console.log('menu',menu,'| mode',await p.evaluate(()=>__t.sess&&__t.sess.mode),errs);await b.close();})();
