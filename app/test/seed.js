const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{const R=Date;window.__off=new R('2026-10-16T14:30').getTime()-R.now();class D extends R{constructor(...a){if(a.length)super(...a);else super(R.now()+window.__off);}static now(){return R.now()+window.__off;}};window.Date=D;
  localStorage.setItem('ach:day:2026-10-16',JSON.stringify({ankle:0,snacks:[{k:'inviso',t:new Date('2026-10-16T14:00').getTime()}]}));});
await p.goto('file://'+process.cwd()+'/test/out/index.html');await p.waitForTimeout(2500);
console.log('errors',errs);console.log('status:',await p.textContent('#status'));console.log('ver:',await p.textContent('#ver'));
const d=await p.evaluate(()=>JSON.parse(localStorage.getItem('ach:day:2026-10-16')));console.log('today:',JSON.stringify({ankle:d.ankle,bfr:d.bfr,hinge:d.hingeSet,snacks:d.snacks.map(x=>x.k),gym:d.gym}));
console.log('days loaded:',await p.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('ach:day:')).length));
console.log('now:',(await p.textContent('#nowText')).slice(0,120));
// pause during imagery: speech should pause
await p.evaluate(()=>{window.__sp=[];const o=speechSynthesis;['pause','resume','cancel'].forEach(m=>{const f=o[m].bind(o);o[m]=()=>{window.__sp.push(m);return f();};});});
await p.evaluate(()=>document.getElementById('sImg').click());await p.waitForTimeout(800);
await p.evaluate(()=>document.getElementById('tPause').click());await p.waitForTimeout(200);
await p.evaluate(()=>document.getElementById('tPause').click());await p.waitForTimeout(700);
console.log('speech calls on pause/resume:',await p.evaluate(()=>window.__sp));
await b.close();})();
