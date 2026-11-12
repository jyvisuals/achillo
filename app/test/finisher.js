const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1200);
await p.click('#sFin');await p.waitForTimeout(400);
const r=await p.evaluate(()=>({title:document.querySelector('#isoh').textContent,min:Math.round(__t.sess.steps.reduce((a,s)=>a+(s.kind==='mark'?0:s.secs),0)/60),names:[...new Set(__t.sess.steps.map(s=>__t.ex(s.ex).name.replace(/ · set .*/,'')))].join(' | ')}));
await p.evaluate(()=>{__t.sess.steps.forEach(s=>{if(s.kind==='mark')__t.recordDone(s.ex);});__t.finish(true);});
const d=await p.evaluate(()=>({fin:__t.day().fin,homeN:__t.day().homeN||0,ankle:__t.day().ankle||0}));
console.log(JSON.stringify(r));console.log(JSON.stringify(d),errs);await b.close();})();
