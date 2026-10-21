const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-21T18:00:00')});await p.goto('file://'+process.cwd()+'/test/out/index.html');await p.waitForTimeout(1500);
await p.evaluate(()=>{const d=__t.day();d.bfr=2;d.ankle=1;});
await p.evaluate(()=>__t.start(false,false,'ankle'));await p.waitForTimeout(500);
console.log(await p.evaluate(()=>[...new Set(__t.sess.steps.map(s=>__t.ex(s.ex).name.replace(/ · (set|round) \d of \d/,'')))].join(' | ')),errs);await b.close();})();
