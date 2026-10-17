const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:390,height:844},colorScheme:'dark',deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-10-17T07:50:00')});
await p.goto('file://'+process.cwd()+'/test/out/index.html');await p.waitForTimeout(2000);
await p.evaluate(()=>__t.start(false,false,'home'));await p.waitForTimeout(800);
const plan=await p.evaluate(()=>__t.sess.steps.map((s,i)=>[i,s.ex,s.kind,s.secs,__t.ex(s.ex)&&__t.ex(s.ex).reps,s.rep]));
const pick=(f)=>plan.find(f);
const shots={
 setup:pick(s=>s[2]==='setup'),
 bfrRep:pick(s=>/^bcr/.test(s[1])&&s[2]==='up'&&s[5]===4),
 srest:pick((s,)=>s[1]==='srest'),
 hold:pick(s=>s[2]==='hold'&&s[3]>=10&&s[4]>1),
 hold1:pick(s=>s[2]==='hold'&&s[4]===1&&!/rest/.test(s[1])),
 shortRep:pick(s=>s[2]==='up'&&s[4]>1&&s[4]<=12&&s[5]===2&&!/^b/.test(s[1])),
};
for(const [k,v] of Object.entries(shots)){if(!v){console.log('no',k);continue;}
  await p.evaluate(i=>__t.jump(i),v[0]);await p.waitForTimeout(1600);
  console.log(k,v.join(','),'|',await p.textContent('#tCount'),'|',await p.textContent('#tPhase'),'|',await p.textContent('#cuffBadge'));
  await p.locator('.ring').screenshot({path:'test/out/ring-'+k+'.png'});if(k==='srest')await p.screenshot({path:'test/out/full-srest.png'});}
console.log('errs',errs);await b.close();})();
