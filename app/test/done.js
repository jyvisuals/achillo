const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:390,height:844},colorScheme:'dark'});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{const R=Date;window.__off=new R('2026-10-16T17:00').getTime()-R.now();class D extends R{constructor(...a){if(a.length)super(...a);else super(R.now()+window.__off);}static now(){return R.now()+window.__off;}};window.Date=D;
 localStorage.setItem('ach:day:2026-10-16',JSON.stringify({ankle:1,bfr:1,bfrA:1,foot:1,morning:{swell:'same',inc:'clean',pain:'none',quick:1},ankleDone:['scar','pump','invev','calfraise','doming','trunkrot','pfbent','bootback','inviso','eviso','toeyoga2']}));});
await p.goto('file://'+process.cwd()+'/test/out/index.html');await p.waitForTimeout(2200);
await p.evaluate(()=>document.querySelector('#nowBtns button.primary').click());await p.waitForTimeout(400);
console.log('focus:',await p.evaluate(()=>document.querySelector('.wrap').classList.contains('focus')),'tabbar shown:',await p.evaluate(()=>getComputedStyle(document.getElementById('tabbar')).display));
for(let i=0;i<200;i++){const h=await p.evaluate(()=>document.getElementById('sRun').hidden);if(h)break;await p.evaluate(()=>document.getElementById('tSkip').click());await p.waitForTimeout(15);}
await p.waitForTimeout(2200);
console.log('done screen:',await p.evaluate(()=>document.querySelector('.wrap').classList.contains('donemode')),await p.textContent('#doneH'),'|',await p.textContent('#doneSub'),'| rounds',await p.textContent('#dRounds'));
await p.screenshot({path:'test/out/s7-done.png'});
await p.click('#doneOk');await p.waitForTimeout(300);console.log('ring1:',await p.getAttribute('#rg1','stroke-dasharray'),errs);
await b.close();})();
