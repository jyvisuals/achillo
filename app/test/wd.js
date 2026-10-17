const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-16T14:00:00')});await p.goto('file://'+process.cwd()+'/test/out/index.html');await p.waitForTimeout(1500);
await p.evaluate(()=>[...document.querySelectorAll('#nowBtns button')].find(b=>b.textContent==='Pick a quick one').click());await p.waitForTimeout(200);await p.click('#snackPick button[data-k="inviso"]');await p.waitForTimeout(3000);
console.log('playing at start:',await p.evaluate(()=>!document.getElementById('track').paused));
await p.evaluate(()=>document.getElementById('track').pause());await p.waitForTimeout(2500);
console.log('after forced pause, resumed:',await p.evaluate(()=>!document.getElementById('track').paused),errs);
await b.close();})();
