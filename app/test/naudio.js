const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:390,height:844},colorScheme:'dark'});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{const R=Date;window.__off=new R('2026-10-16T18:40').getTime()-R.now();class D extends R{constructor(...a){if(a.length)super(...a);else super(R.now()+window.__off);}static now(){return R.now()+window.__off;}};window.Date=D;});
await p.goto('file://'+process.cwd()+'/test/out/index.html');await p.waitForTimeout(2200);
await p.evaluate(()=>[...document.querySelectorAll('#nowBtns button')].find(b=>b.textContent==='Pick a quick one').click());await p.waitForTimeout(200);
await p.click('#snackPick button[data-k="doming"]');await p.waitForTimeout(3500);
console.log('errors',errs);console.log('native calls:',await p.evaluate(()=>window.__aa.calls.slice(0,8)),'bytes written',await p.evaluate(()=>window.__fsw));
console.log('playing:',await p.evaluate(()=>window.__aa.playing),'| warn hidden:',await p.evaluate(()=>document.getElementById('audWarn').hidden));
// iOS silently pauses the player: status poll should notice, page watchdog should resume
await p.evaluate(()=>{window.__aa.playing=false;});await p.waitForTimeout(4000);console.log('resumed after silent pause:',await p.evaluate(()=>window.__aa.playing));
// headphones out
await p.evaluate(()=>window.__aa.L.routeLost({}));await p.waitForTimeout(300);
console.log('after routeLost phase:',await p.textContent('#tPhase'),'| warn:',await p.textContent('#audWarnT'));
await p.evaluate(()=>window.__aa.L.remote({cmd:'play'}));await p.waitForTimeout(800);console.log('remote play -> playing:',await p.evaluate(()=>window.__aa.playing));
await p.evaluate(()=>window.__aa.L.remote({cmd:'next'}));await p.waitForTimeout(300);
console.log('np calls:',await p.evaluate(()=>window.__aa.calls.filter(c=>c.startsWith('np:')).slice(-2)));
console.log('controls:',await p.evaluate(()=>[...document.querySelectorAll('#ctlRow .ctlb')].filter(b=>!b.hidden).map(b=>b.getBoundingClientRect().width+'x'+b.getBoundingClientRect().height)),'| audRow:',await p.evaluate(()=>getComputedStyle(document.getElementById('audRow')).display));
await p.screenshot({path:'test/out/s8-sess.png'});
await b.close();})();
