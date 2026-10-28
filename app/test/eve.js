const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-27T20:30:00')});await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1500);
// morning: BFR done, one boot-off pass done, toe yoga not done yet
await p.evaluate(()=>{const d=__t.day();d.bfr=1;d.homeN=1;d.ankle=0;d.ankleDone=['scar','pump','invev','doming','bandsup'];});
await p.evaluate(()=>__t.start(false,false,'home'));await p.waitForTimeout(500);
console.log(await p.evaluate(()=>[...new Set(__t.sess.steps.map(s=>__t.ex(s.ex).name.split(' · set')[0]))].join(' | ')),errs);await b.close();})();
