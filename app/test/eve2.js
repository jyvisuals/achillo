const { chromium } = require('playwright');
const run=async(h,label)=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-28T'+h)});await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1500);
await p.evaluate(()=>{const d=__t.day();d.bfr=1;d.homeN=0;d.ankle=0;d.ankleDone=['scar','pump','doming','bandsup'];d.homeAt=new Date('2026-10-28T07:00:00').getTime();});
await p.evaluate(()=>__t.start(false,false,'home'));await p.waitForTimeout(500);
console.log(label,await p.evaluate(()=>[...new Set(__t.sess.steps.map(s=>__t.ex(s.ex).name.split(' · set')[0].split(' · round')[0]))].join(' | ')),errs);await b.close();};
(async()=>{await run('09:00:00','9am (same round):');await run('21:50:00','9:50pm (new round):');})();
