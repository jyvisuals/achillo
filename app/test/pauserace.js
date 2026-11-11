const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1500);
// start, then pause within the same tick (before the track is built)
await p.evaluate(()=>{__t.start(false,false,'snack:tib');document.querySelector('#tPause').click();});
await p.waitForTimeout(2500);
const r=await p.evaluate(()=>({paused:document.querySelector('#tPhase').textContent,log:JSON.parse(localStorage.getItem('ach:dbg')||'[]').filter(l=>/audio:/.test(l)).slice(-3).map(l=>l.replace(/^\S+ \S+ /,''))}));
console.log(JSON.stringify(r),errs);await b.close();})();
