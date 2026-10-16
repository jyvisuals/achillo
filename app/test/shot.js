const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:390,height:844},colorScheme:'dark',deviceScaleFactor:2});
await p.goto('file://'+process.cwd()+'/test/out/index.html');await p.waitForTimeout(1500);await p.click('#setBtn');await p.waitForTimeout(400);
await p.screenshot({path:'test/out/settings.png',fullPage:true});await b.close();})();
