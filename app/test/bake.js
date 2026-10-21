const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-16T14:00:00')});
await p.goto('file://'+process.cwd()+'/test/out/index.html');await p.waitForTimeout(2000);
await p.evaluate(()=>{window.__aa.renderMs=1500;});
await p.evaluate(()=>[...document.querySelectorAll('#nowBtns button')].find(b=>b.textContent==='Pick a quick one').click());await p.waitForTimeout(200);
await p.click('#snackPick button[data-k="doming"]');await p.waitForTimeout(1500);
// cycle sound: both -> cues (restart without voice) -> voice -> off -> both (fresh track, voice baked live)
for(let k=0;k<4;k++){await p.evaluate(()=>document.getElementById('tAud').click());await p.waitForTimeout(400);}
await p.waitForTimeout(2500);
const log=await p.evaluate(()=>JSON.parse(localStorage.getItem('ach:dbg')||'[]').map(x=>String(x)).filter(x=>/audio|native: (voice|using|prepar|bake)/.test(x)));
console.log(log.join('\n'));
console.log(await p.evaluate(()=>window.__aa.calls.filter(c=>/render|open|play|stopSp/.test(c))));
console.log('plan:',JSON.stringify(await p.evaluate(()=>window.__aa.rendered.items)));console.log('playing:',await p.evaluate(()=>window.__aa.playing),'errs',errs);await b.close();})();
