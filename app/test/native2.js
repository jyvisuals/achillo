const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{const R=Date;window.__off=new R('2026-10-16T15:00').getTime()-R.now();class D extends R{constructor(...a){if(a.length)super(...a);else super(R.now()+window.__off);}static now(){return R.now()+window.__off;}};window.Date=D;
  window.__meta=[];class MM{constructor(o){Object.assign(this,o);window.__meta.push(o.title+' | '+o.artist);}};window.MediaMetadata=MM;});
await p.goto('file://'+process.cwd()+'/test/out/index.html');await p.waitForTimeout(2500);
console.log('errors',errs);
console.log('action types:',await p.evaluate(()=>window.__ln.types.map(t=>t.id+':'+t.actions.map(a=>a.id).join('/'))));
console.log('a snack note has actionTypeId:',await p.evaluate(()=>window.__ln.pending.find(n=>n.extra.kind==='snack').actionTypeId));
// start a quick one; haptics + keepawake + lock metadata
await p.evaluate(()=>document.querySelector('#nowBtns button.primary')?.click()||[...document.querySelectorAll('#nowBtns button')].find(b=>/Quick one/.test(b.textContent)).click());await p.waitForTimeout(600);
console.log('keep:',await p.evaluate(()=>window.__keep),'| haptics:',await p.evaluate(()=>window.__hap.slice(-3)),'| lock:',await p.evaluate(()=>window.__meta.slice(-1)));
for(let i=0;i<3;i++){await p.evaluate(()=>{window.__off+=9000;});await p.waitForTimeout(250);}
console.log('lock later:',await p.evaluate(()=>window.__meta.slice(-1)),'| haptics n:',await p.evaluate(()=>window.__hap.length));
// interruption: pauses, then resumes
await p.evaluate(()=>window.dispatchEvent(new CustomEvent('ach:interrupt',{detail:{began:true}})));await p.waitForTimeout(200);
console.log('paused after interrupt:',await p.textContent('#tPhase'));
await p.evaluate(()=>window.dispatchEvent(new CustomEvent('ach:interrupt',{detail:{began:false}})));await p.waitForTimeout(200);
console.log('resumed:',await p.textContent('#tPhase'),'| lock:',await p.evaluate(()=>window.__meta.slice(-1)));
// snooze action and 'done' action
await p.evaluate(()=>window.__ln.listeners.localNotificationActionPerformed({actionId:'snooze',notification:{title:'Quick one',body:'x',extra:{kind:'snack'}}}));await p.waitForTimeout(300);
console.log('snoozed at:',await p.evaluate(()=>{const n=window.__ln.scheduled.at(-1)[0];return new Date(n.schedule.at).toLocaleTimeString()+' '+n.actionTypeId;}));
// finish session -> keepawake off
for(let i=0;i<20;i++){await p.evaluate(()=>{window.__off+=15000;});await p.waitForTimeout(150);}await p.waitForTimeout(2200);
console.log('keep end:',await p.evaluate(()=>window.__keep.slice(-1)),'| session hidden:',await p.evaluate(()=>document.getElementById('sRun').hidden));
await p.evaluate(()=>window.__ln.listeners.localNotificationActionPerformed({actionId:'done',notification:{extra:{kind:'round'}}}));await p.waitForTimeout(800);
console.log('rounds after done-action:',await p.evaluate(()=>JSON.parse(localStorage.getItem('ach:day:2026-10-16')).ankle),'|',await p.textContent('#status'));
await b.close();})();
