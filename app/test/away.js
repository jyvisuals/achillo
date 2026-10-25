const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-25T07:50:00')});await p.goto('file://'+process.cwd()+'/test/out/index.html');await p.waitForTimeout(1500);
await p.evaluate(()=>__t.start(false,false,'home'));await p.waitForTimeout(2000);
await p.evaluate(()=>{const i=__t.sess.steps.findIndex(s=>s.ex==='scar'&&s.kind==='rest');__t.jump(i);});await p.waitForTimeout(3000);
const pos=()=>p.evaluate(()=>{const s=__t.sess;return s.i+' '+s.steps[s.i].ex+' left '+s.left;});
console.log('before',await pos());
// go to background: hidden, timers frozen, wall clock moves 24 s
await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
await p.clock.pauseAt(new Date(Date.now()));const t=await p.evaluate(()=>Date.now());await p.clock.setSystemTime(t+24000);await p.clock.resume();
await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
await p.waitForTimeout(3000);console.log('after 24s away',await pos());
console.log((await p.evaluate(()=>JSON.parse(localStorage.getItem('ach:dbg')||'[]').slice(-8))).join('\n'),errs);await b.close();})();
