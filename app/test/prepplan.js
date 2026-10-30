const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-30T19:00:00')});await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1500);
await p.clock.runFor(8000);await p.waitForTimeout(3000);
const r=await p.evaluate(()=>{const x=window.__preparedPlan;return x?{title:x.title,mode:x.mode,steps:x.steps.length,first:x.ex[0][0]}:null;});
console.log(JSON.stringify(r),errs);await b.close();})();
