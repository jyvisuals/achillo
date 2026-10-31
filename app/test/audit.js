// Walks a day through the round logic and prints what each start would give.
const { chromium } = require('playwright');
const names=async p=>p.evaluate(()=>{const S=__t.sess.steps;const out=[];let last='';S.forEach(s=>{const n=__t.ex(s.ex).name.replace(/ · (set|round|30 s hold) .*/,'');if(n!==last){out.push(n);last=n;}});return out.join(' | ');});
const mins=async p=>p.evaluate(()=>Math.round(__t.sess.steps.reduce((a,s)=>a+(s.kind==='mark'?0:s.secs),0)/60));
const finishAll=async p=>p.evaluate(()=>{const S=__t.sess.steps;S.forEach(s=>{if(s.kind==='mark')__t.recordDone(s.ex);});__t.finish(true);});
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const at=async t=>{await p.clock.setSystemTime(new Date('2026-11-02T'+t));};
await p.clock.install({time:new Date('2026-11-02T06:30:00')}); // Monday: BFR day
await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1500);
const st=async()=>p.evaluate(()=>{const d=__t.day();return {homeN:d.homeN||0,ankle:d.ankle||0,bfr:d.bfr||0,bfrA:d.bfrA||0,done:(d.ankleDone||[]).join(',')};});
const run=async(label)=>{await p.evaluate(()=>__t.start(false,false,'home'));await p.waitForTimeout(300);console.log('\n'+label+'  ['+await mins(p)+' min]');console.log('  '+await names(p));};
await run('A. Morning, BFR day, before the check-in');
await finishAll(p);console.log('  after:',JSON.stringify(await st()));
await at('09:00:00');await run('B. 9am again (should be a 2nd round, David holds)');
await p.evaluate(()=>__t.finish(false));
await at('20:00:00');await run('C. Evening');
await finishAll(p);console.log('  after:',JSON.stringify(await st()));
await at('21:00:00');await p.evaluate(()=>__t.start(false,false,'home'));await p.waitForTimeout(300);
console.log('\nD. Third start: session?',await p.evaluate(()=>!!__t.sess),'msg:',await p.evaluate(()=>document.querySelector('#nowDone').textContent));
// quick ones
for(const k of ['pfwall','doming','toeyoga2','invev','bandsup']){await p.evaluate(k=>__t.start(false,false,'snack:'+k),k);await p.waitForTimeout(200);console.log('Quick '+k+' ['+await mins(p)+' min]: '+await names(p));await p.evaluate(()=>__t.finish(false));}
// E. BFR morning interrupted during the cuff isometrics
await p.evaluate(()=>{localStorage.clear();});await p.clock.setSystemTime(new Date('2026-11-04T06:30:00'));await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>__t.start(false,false,'home'));await p.waitForTimeout(300);
await p.evaluate(()=>{const S=__t.sess.steps;for(const s of S){if(s.kind==='mark'){__t.recordDone(s.ex);if(s.ex==='bpi2')break;}}__t.finish(false);});
console.log('\nE. quit during BFR isometrics:',JSON.stringify(await st()));
await at('06:50:00');await run('   restart 20 min later (want: just the rest of BFR)');
// F. non-BFR day (Tuesday) morning + evening
await p.evaluate(()=>{localStorage.clear();});await p.clock.setSystemTime(new Date('2026-11-03T06:30:00'));await p.reload();await p.waitForTimeout(1500);
await run('F. Non-BFR day morning');await finishAll(p);
await at('20:00:00');await run('   evening');
console.log('\nerrs',errs);await b.close();})();
