const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-19T15:00:00')});await p.goto('file://'+process.cwd()+'/test/out/index.html');await p.waitForTimeout(1500);
await p.click('#sMap');await p.waitForTimeout(800);await p.click('#tJump');await p.waitForTimeout(400);
console.log(await p.evaluate(()=>[...document.querySelectorAll('#jumpList button')].map(b=>b.textContent)));
await p.evaluate(()=>document.getElementById('tStop').click());await p.waitForTimeout(1500);
console.log(await p.evaluate(()=>document.body.innerText.match(/map_\w+/g)),errs);await b.close();})();
