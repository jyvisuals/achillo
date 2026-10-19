const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:390,height:844},colorScheme:'dark',deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-19T15:00:00')});
await p.goto('file://'+process.cwd()+'/test/out/index.html');await p.waitForTimeout(1800);
await p.click('#sMap');await p.waitForTimeout(1200);
const steps=await p.evaluate(()=>__t.sess.steps.map((s,i)=>[i,s.ex,s.kind]));
const find=(ex,k)=>steps.find(s=>s[1]===ex&&s[2]===k)[0];
await p.evaluate(i=>__t.jump(i),find('map_mg_L','hold'));await p.waitForTimeout(1500);await p.screenshot({path:'test/out/map1.png'});
await p.evaluate(i=>__t.jump(i),find('map_lg_L','hold'));await p.waitForTimeout(1500);await p.screenshot({path:'test/out/map2.png'});
await p.evaluate(i=>__t.jump(i),find('map_per_L','hold'));await p.waitForTimeout(1200);await p.screenshot({path:'test/out/map3.png'});

console.log('after rate step:',await p.evaluate(()=>__t.sess&&__t.sess.steps[__t.sess.i].ex),'log',await p.evaluate(()=>localStorage.getItem('ach:mapLog')));
console.log('total min',await p.evaluate(()=>Math.round(__t.sess.steps.reduce((a,s)=>a+(s.kind==='mark'?0:s.secs),0)/60*10)/10),'errs',errs);await b.close();})();
