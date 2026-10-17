const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const run=async(dt,seed)=>{const p=await b.newPage({viewport:{width:390,height:844}});const errs=[],logs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(/\[native\]/.test(m.text()))logs.push(m.text());});
 await p.addInitScript(([t,sd])=>{const R=Date;window.__off=new R(t).getTime()-R.now();class D extends R{constructor(...a){if(a.length)super(...a);else super(R.now()+window.__off);}static now(){return R.now()+window.__off;}};window.Date=D;if(sd)localStorage.setItem('ach:day:'+t.slice(0,10),JSON.stringify(sd));},[dt,seed]);
 await p.goto('file://'+process.cwd()+'/test/out/index.html');await p.waitForTimeout(2500);return {p,errs,logs};};
const fmt=(n)=>new Date(n.schedule.at).toLocaleString('en-US',{weekday:'short',hour:'numeric',minute:'2-digit'})+' '+n.title+(n.extra?' ['+n.extra.kind+']':'')+' — '+n.body;
const base={ankle:1,bfr:1,bfrA:1,foot:1,imagery:1,hingeSet:25,morning:{swell:'same',inc:'clean',pain:'none',quick:1},snacks:[{k:'toeyoga2',t:new Date('2026-10-16T09:30').getTime()}]};
let r=await run('2026-10-16T10:00',base);
console.log('errors:',r.errs,'\n',r.logs.join('\n'));
let pend=await r.p.evaluate(()=>window.__ln.pending);console.log('pending',pend.length);pend.slice(0,40).forEach(n=>console.log(' ',fmt(n)));
console.log('envNote hidden:',await r.p.evaluate(()=>document.getElementById('envNote').hidden),'share visible:',await r.p.evaluate(()=>!document.getElementById('shareLog').hidden),'status:',await r.p.textContent('#status'));
// tap a quick-one notification
await r.p.evaluate(()=>window.__ln.listeners.localNotificationActionPerformed({notification:{extra:{kind:'snack'}}}));await r.p.waitForTimeout(900);
console.log('after tap:',await r.p.textContent('#isoh'),'|',await r.p.textContent('#sName'));
// finish it quickly, check haptics + reschedule
for(let i=0;i<12;i++){await r.p.evaluate(()=>{window.__off+=15000;});await r.p.waitForTimeout(250);}await r.p.waitForTimeout(2500);
console.log('haptics:',(await r.p.evaluate(()=>window.__hap)).slice(-3),'| sched rounds:',await r.p.evaluate(()=>window.__ln.scheduled.length),'| first quick one now:',fmt((await r.p.evaluate(()=>window.__ln.pending)).filter(n=>n.extra.kind==='snack')[0]));
await r.p.evaluate(()=>document.getElementById('shareLog').click());await r.p.waitForTimeout(500);const sh=await r.p.evaluate(()=>window.__share);console.log('share:',sh.length,sh[0]&&sh[0].url,sh[0]&&sh[0].text);
await r.p.close();
// fresh morning, nothing done
r=await run('2026-10-16T07:00',{});pend=await r.p.evaluate(()=>window.__ln.pending);console.log('\nfresh 7am pending',pend.length,r.errs);pend.filter(n=>new Date(n.schedule.at).getDate()===16).forEach(n=>console.log(' ',fmt(n)));
await r.p.close();await b.close();})();
