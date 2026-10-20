const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-19T20:00:00')});await p.goto('file://'+process.cwd()+'/test/out/index.html');await p.waitForTimeout(1500);
const tryGym=async(n)=>{await p.evaluate(n=>{const d=__t.day();d.ankleDone=__t.gymBases();d.gymN=n;},n);await p.evaluate(()=>__t.start(false,false,'gym'));await p.waitForTimeout(400);
  const on=await p.evaluate(()=>!!__t.sess);const note=await p.evaluate(()=>document.getElementById('nowDone').hidden?'':document.getElementById('nowDone').textContent);
  if(on)await p.evaluate(()=>document.getElementById('tStop').click());await p.waitForTimeout(400);return [on,note];};
console.log('gym done once → second pass starts:',await tryGym(1));
console.log('gym done twice → third pass:',await tryGym(2));
console.log('errs',errs);await b.close();})();
