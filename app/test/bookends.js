// Run after node build.js. Requires Playwright; set CHROMIUM_PATH if Chromium is not on its default path.
// Add --live-audio for the additions, or --all-audio for every stream (no media files are saved).
// BOOKENDS_AUDIO_IDS=0-12,0-17 limits live checks when rechecking individual sources.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../src/achilles-tracker.html'),'utf8');
const {LIB,AU,START}=vm.runInNewContext(src.slice(src.indexOf("const PCB="),src.indexOf('const PROMPTS='))+
  src.slice(src.indexOf('const AU={'),src.indexOf('const player=new Audio();'))+';({LIB,AU,START})');
const additions=['0-0','0-1','0-2','0-3','0-4','0-5','0-6','0-7','0-8','0-9','0-10','0-12','0-13','0-14','0-20','1-0','1-1','1-2','1-4','1-5','1-8','1-13','1-17','2-15'];
const protectedIds=['0-19','1-9','1-10','1-11','1-12','1-20'];
const prefs={loved:{'0-7':true,'0-19':true,'0-20':true},hidden:{'0-1':true}};
const row=id=>`.be-row[data-id="${id}"]`;

(async()=>{
  const server=http.createServer((req,res)=>{
    const name=new URL(req.url,'http://localhost').pathname;
    const file=name==='/'?'index.html':name.slice(1);
    if(!['index.html','native.js','icon.png','icon-512.png'].includes(file)){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':'image/png');
    fs.createReadStream(path.join(__dirname,'../www',file)).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
    context.setDefaultTimeout(20000);
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(seed=>{
      if(!localStorage.getItem('ach:beLib'))localStorage.setItem('ach:beLib',JSON.stringify(seed));
      const NativeAudio=window.Audio;window.__audio=[];
      window.Audio=function(...args){const a=new NativeAudio(...args);window.__audio.push(a);return a;};
      window.Audio.prototype=NativeAudio.prototype;
    },prefs);
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    const library=async tab=>{await page.click('#beAll');await page.click(`.be-tabs button[data-t="${tab}"]`);};
    const ids=()=>page.locator('.be-row').evaluateAll(rows=>rows.map(r=>r.dataset.id));
    const swipe=async(id,dx)=>{
      const front=page.locator(row(id)+' .be-front');await front.scrollIntoViewIfNeeded();
      const box=await front.boundingBox(),x=box.x+box.width*.7,y=box.y+box.height/2;
      await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y,{steps:8});await page.mouse.up();
    };
    await page.click('#beFab');await library(0);
    assert.deepEqual((await ids()).slice(0,4),['0-7','0-20','0-19','0-0']);
    assert.equal((await ids()).at(-1),'0-18');
    assert.equal(await page.locator(row('0-1')).count(),0);
    // Swiping preserves the DOM, animates the snap, and does not activate the recording.
    await page.locator(row('0-0')+' .be-front').evaluate(el=>{
      window.__swiped=el;window.__transitions=0;
      el.addEventListener('transitionrun',()=>window.__transitions++);
    });
    await swipe('0-0',-70);
    await page.waitForFunction(()=>window.__transitions>0);
    assert.ok(await page.locator(row('0-0')+' .be-front').evaluate(el=>el===window.__swiped));
    assert.equal(await page.locator(row('0-0')+'.open').count(),1);
    assert.ok(await page.evaluate(()=>window.__audio.every(a=>a.paused&&!a.currentSrc)));
    await page.waitForFunction(()=>getComputedStyle(window.__swiped).transform==='matrix(1, 0, 0, 1, -144, 0)');
    await page.locator(row('0-0')+' [data-a="love"]').click();
    assert.equal((await ids())[0],'0-0');
    assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('ach:beLib')).loved['0-0']));
    await swipe('0-0',-70);
    assert.equal(await page.locator(row('0-0')+' [data-a="love"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator(row('0-0')+' [data-a="love"] span').textContent(),'Hearted');
    await page.locator(row('0-0')+' [data-a="hide"]').click();
    assert.equal(await page.locator(row('0-0')).count(),0);
    await page.click('#beHid');assert.equal(await page.locator(row('0-0')+'.hid').count(),1);
    await swipe('0-0',-70);await page.locator(row('0-0')+' [data-a="hide"]').click();
    assert.equal(await page.locator(row('0-0')+'.hid').count(),0);
    // Touch uses the same animated interaction, including a right swipe to close.
    const cdp=await context.newCDPSession(page);
    const touchSwipe=async dx=>{
      const box=await page.locator(row('0-0')+' .be-front').boundingBox();
      const x=box.x+box.width*.7,y=box.y+box.height/2;
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/8,y}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    };
    await touchSwipe(-75);assert.equal(await page.locator(row('0-0')+'.open').count(),1);
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.be-row.open .be-front')).transform==='matrix(1, 0, 0, 1, -144, 0)');
    if(process.env.BOOKENDS_SCREENSHOT_DIR){
      fs.mkdirSync(process.env.BOOKENDS_SCREENSHOT_DIR,{recursive:true});
      await page.screenshot({path:path.join(process.env.BOOKENDS_SCREENSHOT_DIR,'bookends-light.png')});
      await page.emulateMedia({colorScheme:'dark'});
      await page.waitForTimeout(200); // Let the existing theme color transition finish for the screenshot.
      await page.screenshot({path:path.join(process.env.BOOKENDS_SCREENSHOT_DIR,'bookends-dark.png')});
      await page.emulateMedia({colorScheme:'light'});
    }
    await touchSwipe(75);assert.equal(await page.locator('.be-row.open').count(),0);
    assert.ok(await page.evaluate(()=>window.__audio.every(a=>a.paused&&!a.currentSrc)));
    await page.locator(row('0-0')+' .be-front').focus();await page.keyboard.press('ArrowLeft');
    assert.ok(await page.locator(row('0-0')+' [data-a="love"]').evaluate(el=>el===document.activeElement));
    await page.keyboard.press('Escape');assert.equal(await page.locator('.be-row.open').count(),0);
    await page.emulateMedia({reducedMotion:'reduce'});await swipe('0-0',-70);
    assert.equal(await page.locator(row('0-0')+' .be-front').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
    await swipe('0-0',70);await page.emulateMedia({reducedMotion:'no-preference'});
    await page.reload();await page.click('#beFab');await library(0);
    assert.equal((await ids())[0],'0-0'); // Saved ordering survives reload.
    await page.click('#beHid');
    let total=0,playable=0;
    for(let tab=0;tab<3;tab++){
      await page.click(`.be-tabs button[data-t="${tab}"]`);
      total+=await page.locator('.be-row').count();playable+=await page.locator('.be-front[data-play]').count();
      for(const id of protectedIds.filter(id=>id.startsWith(tab+'-'))){
        assert.equal(await page.locator(row(id)+' [data-play]').count(),0);
        assert.equal(await page.locator(row(id)+' .be-front').getAttribute('target'),'_blank');
      }
    }
    assert.equal(total,58);assert.equal(playable,52);
    assert.deepEqual(Array.from(LIB,tab=>tab.length),[21,21,16]);
    assert.ok(Object.values(AU).every(url=>url.startsWith('https://')));
    // A deterministic audio fixture checks intro seeking, resume, manual rewind, and replay.
    const intro=Object.entries(START).find(([id,start])=>start>3&&start<90);
    assert.ok(intro,'At least one verified intro offset must be exercised');
    const [introId,start]=intro;
    console.log('Checking intro seek/resume/replay with fixture:',introId,start);
    const seconds=120,rate=8000,dataBytes=seconds*rate*2,wav=Buffer.alloc(44+dataBytes);
    wav.write('RIFF');wav.writeUInt32LE(36+dataBytes,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);
    wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);
    wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(dataBytes,40);
    const fixture=await context.newPage();
    await fixture.addInitScript(()=>{
      const NativeAudio=window.Audio;window.__audio=[];
      window.Audio=function(...args){const a=new NativeAudio(...args);window.__audio.push(a);return a;};window.Audio.prototype=NativeAudio.prototype;
    });
    await fixture.route(AU[introId],route=>{
      const range=route.request().headers().range;
      if(!range)return route.fulfill({contentType:'audio/wav',headers:{'Accept-Ranges':'bytes'},body:wav});
      const match=/bytes=(\d+)-(\d*)/.exec(range),from=Number(match[1]),to=match[2]?Number(match[2]):wav.length-1;
      return route.fulfill({status:206,contentType:'audio/wav',headers:{'Accept-Ranges':'bytes','Content-Range':`bytes ${from}-${to}/${wav.length}`},body:wav.subarray(from,to+1)});
    });
    await fixture.goto(page.url());await fixture.click('#beFab');await fixture.click('#beAll');
    await fixture.click(`.be-tabs button[data-t="${introId.split('-')[0]}"]`);
    if(await fixture.locator(row(introId)).count()===0)await fixture.click('#beHid');
    await fixture.locator(row(introId)+' .be-front').click();
    await fixture.waitForFunction(start=>window.__audio.some(a=>a.currentTime>start&&a.currentTime<start+3&&!a.paused),start).catch(async e=>{
      console.error('Audio fixture state',await fixture.evaluate(()=>window.__audio.map(a=>({src:a.src,time:a.currentTime,duration:a.duration,paused:a.paused,error:a.error?.message,ready:a.readyState}))));throw e;
    });
    await fixture.click('.be-play');
    await fixture.waitForFunction(()=>document.querySelector('.be-play').getAttribute('aria-pressed')==='false');
    await fixture.locator('#beSeek').fill('0');
    await fixture.waitForFunction(()=>Number(document.querySelector('#beSeek').value)===0);
    await fixture.click('.be-play');
    await fixture.waitForFunction(start=>window.__audio.some(a=>!a.paused&&a.currentTime>.1&&a.currentTime<start),start);
    await fixture.locator('#beSeek').fill('119.9');
    await fixture.waitForFunction(start=>window.__audio.some(a=>a.paused&&Math.abs(a.currentTime-start)<.2),start);
    await fixture.click('.be-play');
    await fixture.waitForFunction(start=>window.__audio.some(a=>!a.paused&&a.currentTime>start&&a.currentTime<start+3),start);
    await fixture.close();
    console.log('Intro seek/resume/replay OK');
    if(process.argv.includes('--live-audio')||process.argv.includes('--all-audio')){
      const audioIds=process.env.BOOKENDS_AUDIO_IDS?.split(',')||(process.argv.includes('--all-audio')?Object.keys(AU):[...additions,'0-11']);
      assert.ok(audioIds.every(id=>AU[id]),'Every requested recording must exist');
      for(const id of audioIds){
        await page.click(`.be-tabs button[data-t="${id.split('-')[0]}"]`);
        const front=page.locator(row(id)+' .be-front');
        assert.equal(await front.locator('.ic svg path').getAttribute('d'),'M7 4l13 8-13 8z');
        await front.click();
        await page.waitForFunction(({url,start})=>window.__audio.some(a=>a.src===url&&!a.paused&&a.currentTime>start+.1),{url:AU[id],start:START[id]||0},{timeout:45000}).catch(async e=>{
          console.error('Live recording failed',id,await page.evaluate(()=>window.__audio.map(a=>({src:a.src,time:a.currentTime,duration:a.duration,paused:a.paused,error:a.error?.message,ready:a.readyState}))));throw e;
        });
        assert.equal(await page.locator('.be-play').getAttribute('data-play'),id);
        assert.equal(await page.locator('.be-play').getAttribute('aria-pressed'),'true');
        await page.waitForFunction(()=>Number(document.querySelector('#beSeek').value)>0);
        await page.click('.be-play');
        await page.waitForFunction(()=>document.querySelector('.be-play').getAttribute('aria-pressed')==='false');
        if(id==='0-0'){
          const position=await page.locator('#beSeek').inputValue();
          await page.click('.be-play');
          await page.waitForFunction(t=>Number(document.querySelector('#beSeek').value)>t+.1,Number(position));
          await page.click('.be-play');
          await page.waitForFunction(()=>document.querySelector('.be-play').getAttribute('aria-pressed')==='false');
          await page.locator('#beSeek').fill('0');
          await page.waitForFunction(()=>window.__audio.some(a=>a.currentSrc&&a.currentTime<.2));
          assert.equal(await page.locator('.be-play').getAttribute('aria-pressed'),'false');
          await page.locator('#beSeek').focus();await page.keyboard.press('ArrowRight');
          await page.waitForFunction(()=>Number(document.querySelector('#beSeek').value)>0);
        }
        const duration=await page.evaluate(url=>window.__audio.find(a=>a.src===url).duration,AU[id]);
        assert.ok(Number.isFinite(duration)&&duration>(START[id]||0),id+' has a valid duration');
        await page.locator('#beSeek').fill(String(Math.round((duration-.5)*10)/10));
        await page.click('.be-play');
        await page.waitForFunction(({url,start})=>window.__audio.some(a=>a.src===url&&a.paused&&Math.abs(a.currentTime-start)<.2),
          {url:AU[id],start:START[id]||0},{timeout:30000});
        assert.equal(await page.locator('.be-play').getAttribute('aria-pressed'),'false');
        assert.equal(context.pages().length,1);
        console.log('Played, paused, and reached the end',id,LIB[+id.split('-')[0]][+id.split('-')[1]][0]);
        await library(+id.split('-')[0]);
      }
    }
    assert.deepEqual(errors,[]);
    console.log('Bookends OK: 58 rows, 52 playable; ordering, saved preferences, animated mouse/touch swipes, no accidental playback or page errors.');
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
