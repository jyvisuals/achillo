const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.__h={};const ms=navigator.mediaSession;if(ms){const o=ms.setActionHandler.bind(ms);ms.setActionHandler=(a,f)=>{window.__h[a]=f;try{o(a,f)}catch(e){}};}});
await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1500);
await p.evaluate(()=>__t.start(false,false,'snack:doming'));await p.waitForTimeout(800);
// leaving: media pause then hidden in the same moment
await p.evaluate(()=>{window.__h.pause&&window.__h.pause();Object.defineProperty(document,'visibilityState',{get:()=>'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
await p.waitForTimeout(1200);const a=await p.textContent('#tPhase');
await p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{get:()=>'visible',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
await p.waitForTimeout(2500);
// a real lock-screen pause while staying visible still pauses
await p.evaluate(()=>window.__h.pause&&window.__h.pause());await p.waitForTimeout(1200);const c=await p.textContent('#tPhase');
console.log('after leaving:',a,'| real media pause:',c,'| handler:',await p.evaluate(()=>!!window.__h.pause),errs);await b.close();})();
