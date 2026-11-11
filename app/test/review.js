const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-31T09:00:00')});await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1500);
// 5: one set of a 3-set quick one, then stop → not credited; finish all → credited
await p.evaluate(()=>__t.start(false,false,'snack:balance'));await p.clock.runFor(500);
await p.evaluate(()=>{const S=__t.sess.steps;const first=S.findIndex(s=>s.kind==='mark');__t.sess.doneEx.push(S[first].ex);__t.finish(false);});
const a=(await p.evaluate(()=>(__t.day().snacks||[]).length));
await p.evaluate(()=>__t.start(false,false,'snack:balance'));await p.clock.runFor(500);
await p.evaluate(()=>{__t.sess.steps.forEach(s=>{if(s.kind==='mark')__t.sess.doneEx.push(s.ex);});__t.finish(true);});
const b2=(await p.evaluate(()=>(__t.day().snacks||[]).length));
// 3: bfrCounted survives persist/resume
await p.evaluate(()=>{__t.start(false,false,'home');__t.sess.bfrCounted=true;});await p.clock.runFor(300);await p.click('#tPause');
const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('ach:sess')).bfrCounted);
await p.evaluate(()=>__t.finish(false));
// 2: an old day outside the 40-day window shows up in the export
await p.evaluate(()=>localStorage.setItem('ach:day:2026-06-01',JSON.stringify({iso:1})));
const exp=await p.evaluate(()=>!!__t.allDays()['2026-06-01']);
console.log('one set credited?',a,'| all sets credited?',b2,'| bfrCounted saved?',saved,'| old day in export?',exp,errs);await b.close();})();
