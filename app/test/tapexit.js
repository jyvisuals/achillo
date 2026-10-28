const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-27T20:30:00')});await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1500);
await p.evaluate(()=>__t.start(false,false,'snack:pump'));await p.waitForTimeout(800);
await p.mouse.click(195,600);await p.waitForTimeout(200);
const a=await p.textContent('#tPhase');
await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{get:()=>'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
await p.waitForTimeout(300);const b2=await p.textContent('#tPhase');
// a deliberate tap, then leaving later, stays paused
await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{get:()=>'visible',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
await p.mouse.click(195,600);await p.clock.runFor(3000);
await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{get:()=>'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
const c=await p.textContent('#tPhase');
const log=await p.evaluate(()=>(window.__dbgLog||[]).slice?.(-6));
console.log('after tap:',a,'| after exit:',b2,'| deliberate:',c,errs);await b.close();})();
