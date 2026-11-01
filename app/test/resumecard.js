const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1500);
await p.evaluate(()=>__t.start(false,false,'snack:doming'));await p.waitForTimeout(1200);
await p.evaluate(()=>{__t.jump(3);});await p.waitForTimeout(800);   // into doming_1 reps
const before=await p.evaluate(()=>({i:__t.sess.i,ex:__t.sess.steps[__t.sess.i].ex}));
await p.reload();await p.waitForTimeout(1500);
const card=await p.evaluate(()=>({shown:!document.querySelector('#resumeCard').hidden,body:document.querySelector('#rcBody').textContent,paused:document.querySelector('#tPhase').textContent,i:__t.sess&&__t.sess.i}));
await p.click('#rcRestart');await p.waitForTimeout(300);
const after=await p.evaluate(()=>({i:__t.sess.i,ex:__t.sess.steps[__t.sess.i].ex,hidden:document.querySelector('#resumeCard').hidden,phase:document.querySelector('#tPhase').textContent}));
// skipped vs complete marker
await p.evaluate(()=>__t.finish(false));await p.evaluate(()=>__t.start(false,false,'home'));await p.waitForTimeout(500);
await p.evaluate(()=>{const S=__t.sess.steps;const j=S.findIndex(s=>s.ex==='doming_1');__t.jump(j);});await p.waitForTimeout(300);
const sk=await p.evaluate(()=>({done:__t.day().ankleDone,skip:__t.day().ankleSkip,row:[...document.querySelectorAll('.ankrow span')].map(x=>x.textContent).filter(t=>/skipped/.test(t))}));
console.log('before',JSON.stringify(before),'| card',JSON.stringify(card),'| restart',JSON.stringify(after));console.log('skip',JSON.stringify(sk),errs);await b.close();})();
