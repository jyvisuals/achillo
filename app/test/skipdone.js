const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-28T21:00:00')});await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1500);
await p.evaluate(()=>{const d=__t.day();d.bfr=1;d.homeN=0;d.ankle=0;d.ankleDone=['scar','pump','doming','bandsup','calfman'];d.homeAt=Date.now();});
await p.evaluate(()=>__t.start(false,false,'home'));await p.waitForTimeout(500);
for(let i=0;i<3;i++){await p.click('#tSkip');await p.waitForTimeout(300);}
console.log('done:',await p.evaluate(()=>JSON.stringify(__t.day().ankleDone)),'homeN',await p.evaluate(()=>__t.day().homeN),'| now:',await p.textContent('#sName'),errs);await b.close();})();
