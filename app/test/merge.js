const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/achilles-app/test/out/index.html');await p.waitForTimeout(1200);
const r=await p.evaluate(()=>{const m=__t.mergeDay;return {
  homeN:m({homeN:2,homeAt:200,hips:1},{homeN:1,homeAt:100}).homeN,
  homeAt:m({homeN:2,homeAt:200},{homeN:1,homeAt:100}).homeAt,
  hips:m({hips:1},{}).hips,
  notesCleared:m({notes:'old'},{notes:''}).notes||null,
  notesKept:m({notes:'old'},{}).notes,
  skip:m({ankle:0,ankleDone:['pump'],ankleSkip:['pump']},{ankle:0,ankleDone:['scar']}).ankleSkip,
};});
// seed applies once and never overwrites a corrected answer
await p.evaluate(()=>{localStorage.removeItem('ach:seeded');__t.day().morning={swell:'more'};});
await p.evaluate(()=>window.dispatchEvent(new CustomEvent('ach:seed',{detail:{days:{[__t.today]:{morning:{swell:'same'},notes:'seed'}}}})));
const seed1=await p.evaluate(()=>({swell:__t.day().morning.swell,notes:__t.day().notes,flag:localStorage.getItem('ach:seeded')}));
await p.evaluate(()=>window.dispatchEvent(new CustomEvent('ach:seed',{detail:{days:{[__t.today]:{notes:'seed2'}}}})));
const seed2=await p.evaluate(()=>__t.day().notes);
// hidden flushes a pending save at once
await p.evaluate(()=>{__t.day().notes='typed fast';});await p.evaluate(()=>{const d=__t.day();d.notes='typed fast';});
await p.evaluate(()=>{__t.queue(); Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
const stored=await p.evaluate(()=>JSON.parse(localStorage.getItem('ach:day:'+__t.today)).notes);
console.log(JSON.stringify(r),'| seed',JSON.stringify(seed1),seed2,'| flushed',stored,errs);await b.close();})();
