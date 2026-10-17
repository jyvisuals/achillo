const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/test/out/index.html');await p.waitForTimeout(2000);
await p.evaluate(()=>[...document.querySelectorAll('#nowBtns button')].find(b=>b.textContent==='Pick a quick one').click());await p.waitForTimeout(200);
await p.click('#snackPick button[data-k="inviso"]');await p.waitForTimeout(2500);
for(let k=0;k<4;k++){await p.evaluate(()=>document.getElementById('tSkip').click());await p.waitForTimeout(700);
 const r=await p.evaluate(async()=>{const s=await (window.__aa?{position:window.__aa.playing?window.__aa.pos+(performance.now()-window.__aa.t)/1000:window.__aa.pos}:{});return s.position;});
 console.log('skip',k,'native pos',r&&r.toFixed(1),'| screen',await p.textContent('#sName'));}
console.log('playing:',await p.evaluate(()=>window.__aa.playing),errs);await b.close();})();
