const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,colorScheme:'dark'});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-19T15:00:00')});await p.goto('file://'+process.cwd()+'/test/out/index.html');await p.waitForTimeout(1500);
await p.click('#sMap');await p.waitForTimeout(800);const seq=[];
for(let k=0;k<5;k++){seq.push(await p.evaluate(()=>__t.sess.steps[__t.sess.i].ex));await p.evaluate(()=>document.getElementById('tSkip').click());await p.waitForTimeout(400);}
console.log(seq.join(' → '));
const i=await p.evaluate(()=>__t.sess.steps.findIndex(s=>s.ex==='map_tp_L'&&s.kind==='hold'));await p.evaluate(i=>__t.jump(i),i);await p.waitForTimeout(1500);
await p.screenshot({path:'test/out/tp.png'});console.log('errs',errs);await b.close();})();
