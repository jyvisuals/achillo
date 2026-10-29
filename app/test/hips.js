const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-28T19:00:00')});await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1500);
await p.click('#sHips');await p.waitForTimeout(800);
console.log(await p.textContent('#isoh'),'|',await p.textContent('#sName'),'|',await p.textContent('#sessTime'));
console.log(await p.evaluate(()=>[...new Set(__t.sess.steps.map(s=>__t.ex(s.ex).name))].join(' | ')));
await p.evaluate(()=>__t.jump(__t.sess.steps.length));await p.waitForTimeout(800);
console.log('hips logged:',await p.evaluate(()=>__t.day().hips),errs);
await p.screenshot({path:'test/out/hips.png'});await b.close();})();
