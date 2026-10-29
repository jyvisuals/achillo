const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:390,height:844},colorScheme:'dark',deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-28T19:00:00')});await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1500);
await p.click('#sHips');await p.waitForTimeout(800);
const keys=['hip_9090','hip_glute_R','hip_rock','hip_kneel_L','hip_stand_R','hip_itb_R'];
for(const k of keys){const i=await p.evaluate(k=>__t.sess.steps.findIndex(s=>s.ex===k&&s.kind==='hold'),k);await p.evaluate(i=>__t.jump(i),i);await p.waitForTimeout(700);
 await p.locator('#hipFig').screenshot({path:'test/out/fig-'+k+'.png'});}
await p.screenshot({path:'test/out/hips-full.png'});
console.log(await p.evaluate(()=>[...new Set(__t.sess.steps.map(s=>__t.ex(s.ex).name))].join(' | ')),errs);await b.close();})();
