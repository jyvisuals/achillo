const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{if(!localStorage.getItem('ach:prefs'))localStorage.setItem('ach:prefs',JSON.stringify({pool:['balance','tib','dance','bandsup','pfwall'],v2times:1}));});
await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1200);
const pool=await p.evaluate(()=>JSON.parse(localStorage.getItem('ach:prefs')).pool);
const out=[];for(const k of ['wshift','march']){await p.evaluate(k=>__t.start(false,false,'snack:'+k),k);await p.waitForTimeout(200);out.push(k+': '+await p.evaluate(()=>[...new Set(__t.sess.steps.map(s=>__t.ex(s.ex).name))].join(' | ')));await p.evaluate(()=>__t.finish(false));}
console.log(JSON.stringify(pool));out.forEach(x=>console.log(x));console.log(errs);await b.close();})();
