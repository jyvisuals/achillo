const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-30T20:00:00')});await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1500);
await p.evaluate(()=>__t.start(false,false,'snack:pfwall'));await p.waitForTimeout(800);
await p.click('#tPause');await p.waitForTimeout(200);await p.click('#tPause');await p.waitForTimeout(200);
await p.click('#tSkip');await p.waitForTimeout(300);
// a command from the watch
await p.evaluate(()=>window.dispatchEvent(new CustomEvent('ach:remote',{detail:{cmd:'pause',from:'watch'}})));await p.waitForTimeout(200);
const r=await p.evaluate(()=>{const m=window.__watchMsgs||[];const pl=m.find(x=>x.type==='plan');return {types:m.map(x=>x.type).join(','),steps:pl&&pl.steps.length,ex:pl&&pl.ex.slice(0,4),first:pl&&pl.steps.slice(0,4),last:m[m.length-1].paused};});
console.log(JSON.stringify(r),errs);await b.close();})();
