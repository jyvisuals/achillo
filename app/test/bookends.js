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
const {LIB,AU,START,END,SKIP,clipRanges,clipLength,clipPosition,sourcePosition}=vm.runInNewContext(src.slice(src.indexOf("const PCB="),src.indexOf('const PROMPTS='))+
  src.slice(src.indexOf('const AU={'),src.indexOf('const player=new Audio();'))+';({LIB,AU,START,END,SKIP,clipRanges,clipLength,clipPosition,sourcePosition})');
const longerIds=[...Array.from({length:8},(_,i)=>'0-'+(23+i)),...Array.from({length:7},(_,i)=>'1-'+(22+i))];
const additions=[...longerIds,'0-22','1-18','1-19'];
const protectedIds=['0-19','1-9','1-10','1-11','1-12','1-20'];
const prefs={loved:{'0-7':true,'0-19':true,'0-20':true,'0-16':true},hidden:{'0-1':true}};
const row=id=>`.be-row[data-id="${id}"]`;
const tabFor=id=>id.startsWith('2-')||['0-16','0-17','0-18','1-15','1-16'].includes(id)?2:+id.split('-')[0];

assert.deepEqual(Object.keys(END).sort(),Object.keys(AU).sort(),'Every stream has a reviewed end');
for(const id of Object.keys(AU)){
  const start=START[id]||0,end=END[id];
  assert.ok(Number.isFinite(end)&&end>start,id+' has valid content bounds');
  let previous=start;
  for(const [from,to] of SKIP[id]||[]){
    assert.ok(from>=previous&&to>from&&to<=end,id+' has ordered interior exclusions');previous=to;
  }
  const ranges=clipRanges(id,end+60),length=clipLength(ranges);
  assert.ok(length>0,id+' retains content');
  assert.ok(length<40*60,id+' stays under 40 minutes');
  assert.equal(sourcePosition(0,ranges),start);
  assert.ok(Math.abs(sourcePosition(length,ranges)-end)<1e-6);
}
for(const id of longerIds){
  assert.ok(AU[id],id+' is playable in the card');
  assert.ok(clipLength(clipRanges(id,END[id]))>=8*60,id+' retains at least eight minutes after trimming');
}

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
    const fabBox=await page.locator('#beFab').boundingBox();
    assert.equal(fabBox.width,44);assert.equal(fabBox.height,44);assert.equal(Math.round(fabBox.x+fabBox.width),378);
    const cdp=await context.newCDPSession(page);
    const dragHandle=async(dy,cancel=false)=>{
      await page.locator('#beClose').scrollIntoViewIfNeeded();
      const box=await page.locator('#beClose').boundingBox(),x=box.x+50,y=box.y+box.height/2;
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+dy*i/6}]});
      await page.waitForFunction(dy=>document.querySelector('#beSheet').style.transform===`translateY(${dy}px)`,dy);
      await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
    };
    await page.click('#beFab');
    await dragHandle(30);assert.equal(await page.locator('#beSheet').isVisible(),true);
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('#beSheet')).transform==='none'||getComputedStyle(document.querySelector('#beSheet')).transform==='matrix(1, 0, 0, 1, 0, 0)');
    await dragHandle(120,true);assert.equal(await page.locator('#beSheet').isVisible(),true);
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('#beSheet')).transform==='none'||getComputedStyle(document.querySelector('#beSheet')).transform==='matrix(1, 0, 0, 1, 0, 0)');
    await dragHandle(120);await page.locator('#beSheet').waitFor({state:'hidden'});
    await page.click('#beFab');await library(0);
    assert.deepEqual((await ids()).slice(0,4),['0-7','0-20','0-19','0-0']);
    assert.equal((await ids()).at(-1),'0-21');
    assert.equal(await page.locator(row('0-16')).count(),0);
    assert.equal(await page.locator(row('0-22')).count(),1);
    assert.equal(await page.locator(row('0-21')+' .be-front').getAttribute('href'),'https://www.youtube.com/watch?v=aWmq9gw4Rq0');
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
    // Vertical touches on recording rows still scroll the library rather than play or swipe a row.
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:650}]});
    for(let y=620;y>=350;y-=30)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:180,y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForFunction(()=>document.querySelector('.be-list').scrollTop>80);
    assert.equal(await page.locator('.be-row.open').count(),0);
    assert.ok(await page.evaluate(()=>window.__audio.every(a=>a.paused&&!a.currentSrc)));
    await dragHandle(120);await page.locator('#beSheet').waitFor({state:'hidden'});
    await page.click('#beFab');await library(0);
    await page.locator(row('0-0')+' .be-front').focus();await page.keyboard.press('ArrowLeft');
    assert.ok(await page.locator(row('0-0')+' [data-a="love"]').evaluate(el=>el===document.activeElement));
    await page.keyboard.press('Escape');assert.equal(await page.locator('.be-row.open').count(),0);
    await page.emulateMedia({reducedMotion:'reduce'});await swipe('0-0',-70);
    assert.equal(await page.locator(row('0-0')+' .be-front').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
    await swipe('0-0',70);await page.emulateMedia({reducedMotion:'no-preference'});
    await page.reload();await page.click('#beFab');await library(0);
    assert.equal((await ids())[0],'0-0'); // Saved ordering survives reload.
    await page.click('#beHid');
    let total=0,playable=0;const groupedCounts=[];
    for(let tab=0;tab<3;tab++){
      await page.click(`.be-tabs button[data-t="${tab}"]`);
      total+=await page.locator('.be-row').count();playable+=await page.locator('.be-front[data-play]').count();
      groupedCounts.push(await page.locator('.be-row').count());
      if(tab===2){assert.equal((await ids())[0],'0-16');assert.equal(await page.locator('.be-tabs button[data-t="2"]').textContent(),'Meditations');}
      for(const id of protectedIds.filter(id=>id.startsWith(tab+'-'))){
        assert.equal(await page.locator(row(id)+' [data-play]').count(),0);
        assert.equal(await page.locator(row(id)+' .be-front').getAttribute('target'),'_blank');
      }
    }
    assert.equal(total,76);assert.equal(playable,69);
    assert.deepEqual(groupedCounts,[28,27,21]);
    assert.deepEqual(Array.from(LIB,tab=>tab.length),[31,29,16]);
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
    fixture.on('pageerror',e=>errors.push(e.message));
    const fixtureEnd=100,fixtureLength=fixtureEnd-start-10;
    // Use a longer source than the listening section, with a synthetic mid-roll excluded.
    const fixtureHTML=fs.readFileSync(path.join(__dirname,'../www/index.html'),'utf8')
      .replace(/const END=\{[\s\S]*?\};/,'const END='+JSON.stringify({[introId]:fixtureEnd})+';')
      .replace(/const SKIP=\{[\s\S]*?\};/,'const SKIP='+JSON.stringify({[introId]:[[40,50]]})+';');
    await fixture.route(page.url(),route=>route.fulfill({contentType:'text/html',body:fixtureHTML}));
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
    await fixture.click(`.be-tabs button[data-t="${tabFor(introId)}"]`);
    if(await fixture.locator(row(introId)).count()===0)await fixture.click('#beHid');
    await fixture.locator(row(introId)+' .be-front').click();
    await fixture.waitForFunction(start=>window.__audio.some(a=>a.currentTime>start&&a.currentTime<start+3&&!a.paused),start).catch(async e=>{
      console.error('Audio fixture state',await fixture.evaluate(()=>window.__audio.map(a=>({src:a.src,time:a.currentTime,duration:a.duration,paused:a.paused,error:a.error?.message,ready:a.readyState}))));throw e;
    });
    await fixture.click('.be-play');
    await fixture.waitForFunction(()=>document.querySelector('.be-play').getAttribute('aria-pressed')==='false');
    await fixture.locator('#beSeek').fill('0');
    await fixture.waitForFunction(()=>Number(document.querySelector('#beSeek').value)===0);
    assert.ok(Math.abs(Number(await fixture.locator('#beSeek').getAttribute('max'))-fixtureLength)<.001);
    await fixture.waitForFunction(start=>window.__audio.some(a=>Math.abs(a.currentTime-start)<.2),start);
    await fixture.click('.be-play');
    await fixture.waitForFunction(start=>window.__audio.some(a=>!a.paused&&a.currentTime>start+.1&&a.currentTime<start+3),start);
    await fixture.locator('#beSeek').fill(String(Math.round((39.8-start)*10)/10));
    await fixture.waitForFunction(()=>window.__audio.some(a=>!a.paused&&a.currentTime>=50&&a.currentTime<52));
    await fixture.locator('#beSeek').fill(String(Math.round((fixtureLength-.1)*10)/10));
    await fixture.waitForFunction(start=>window.__audio.some(a=>a.paused&&Math.abs(a.currentTime-start)<.2),start);
    await fixture.click('.be-play');
    await fixture.waitForFunction(start=>window.__audio.some(a=>!a.paused&&a.currentTime>start&&a.currentTime<start+3),start);
    // A finger can drift vertically while scrubbing. It must not drag the sheet or lose the seek.
    const seekTouch=await context.newCDPSession(fixture);
    await fixture.click('.be-play');
    await fixture.locator('#beSeek').fill('0');
    const seekBox=await fixture.locator('#beSeek').boundingBox();
    const seekX=seekBox.x+7,seekY=seekBox.y+seekBox.height/2;
    await seekTouch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:seekX,y:seekY}]});
    await seekTouch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:seekX+2,y:seekY+20}]});
    await seekTouch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:seekBox.x+seekBox.width*.75,y:seekY+20}]});
    assert.equal(await fixture.locator('#beSheet').evaluate(el=>el.style.transform),'');
    await seekTouch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const touchTarget=start+10+fixtureLength*.75;
    await fixture.waitForFunction(target=>window.__audio.some(a=>Math.abs(a.currentTime-target)<3&&a.paused),touchTarget).catch(async e=>{
      console.error('Touch seek state',await fixture.evaluate(()=>({value:document.querySelector('#beSeek').value,audio:window.__audio.map(a=>({time:a.currentTime,paused:a.paused}))})));throw e;
    });
    assert.equal(await fixture.locator('#beSheet').isVisible(),true);
    await fixture.click('.be-play');
    await seekTouch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:seekBox.x+seekBox.width*.75,y:seekY}]});
    await seekTouch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:seekBox.x+seekBox.width*.25,y:seekY-20}]});
    const preview=Number(await fixture.locator('#beSeek').inputValue());
    assert.ok(Math.abs(preview-fixtureLength*.25)<3);
    // Playback updates arriving during a held drag must not reset the preview or seek repeatedly.
    await fixture.evaluate(()=>window.__audio.forEach(a=>a.dispatchEvent(new Event('timeupdate'))));
    assert.equal(Number(await fixture.locator('#beSeek').inputValue()),preview);
    assert.ok(await fixture.evaluate(target=>window.__audio.some(a=>Math.abs(a.currentTime-target)<5&&!a.paused),touchTarget));
    await seekTouch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await fixture.waitForFunction(target=>window.__audio.some(a=>Math.abs(a.currentTime-target)<3&&!a.paused),start+fixtureLength*.25);
    await fixture.click('.be-play');
    await fixture.mouse.click(seekBox.x+seekBox.width/2,seekY);
    const midpoint=start+10+fixtureLength/2;
    await fixture.waitForFunction(target=>window.__audio.some(a=>Math.abs(a.currentTime-target)<.2&&a.paused),midpoint);
    await fixture.locator('#beSeek').focus();await fixture.keyboard.press('ArrowRight');
    await fixture.waitForFunction(target=>window.__audio.some(a=>a.currentTime>target&&a.currentTime<target+1&&a.paused),midpoint);
    const beforeCancel=Number(await fixture.locator('#beSeek').inputValue());
    await seekTouch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:seekBox.x+seekBox.width*.9,y:seekY}]});
    await seekTouch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    assert.equal(Number(await fixture.locator('#beSeek').inputValue()),beforeCancel);
    // Native/lock-screen seeks also stay out of trimmed content, and the end timer handles rate changes.
    await fixture.evaluate(()=>{window.__audio[0].currentTime=0;});
    await fixture.waitForFunction(start=>window.__audio.some(a=>Math.abs(a.currentTime-start)<.2),start);
    await fixture.evaluate(()=>{window.__audio[0].currentTime=45;});
    await fixture.waitForFunction(()=>window.__audio.some(a=>Math.abs(a.currentTime-50)<.2));
    await fixture.locator('#beSeek').fill(String(Math.round((fixtureLength-.6)*10)/10));
    await fixture.evaluate(()=>{window.__audio[0].playbackRate=2;});
    await fixture.click('.be-play');
    await fixture.waitForFunction(start=>window.__audio.some(a=>a.paused&&Math.abs(a.currentTime-start)<.2),start);
    await fixture.close();
    console.log('Intro seek/resume/replay, touch scrubbing, canceled drag, mouse and keyboard seeking OK');
    if(process.argv.includes('--live-audio')||process.argv.includes('--all-audio')){
      const audioIds=process.env.BOOKENDS_AUDIO_IDS?.split(',')||(process.argv.includes('--all-audio')?Object.keys(AU):[...additions,'0-11']);
      assert.ok(audioIds.every(id=>AU[id]),'Every requested recording must exist');
      for(const id of audioIds){
        await page.click(`.be-tabs button[data-t="${tabFor(id)}"]`);
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
          await page.waitForFunction(start=>window.__audio.some(a=>a.currentSrc&&Math.abs(a.currentTime-start)<.2),START[id]||0);
          assert.equal(await page.locator('.be-play').getAttribute('aria-pressed'),'false');
          await page.locator('#beSeek').focus();await page.keyboard.press('ArrowRight');
          await page.waitForFunction(()=>Number(document.querySelector('#beSeek').value)>0);
        }
        const duration=await page.evaluate(url=>window.__audio.find(a=>a.src===url).duration,AU[id]);
        assert.ok(Number.isFinite(duration)&&duration>(START[id]||0),id+' has a valid duration');
        const length=clipLength(clipRanges(id,duration));
        assert.ok(length>0,id+' has a valid listening section');
        assert.ok(length<40*60,id+' plays for less than 40 minutes');
        if(longerIds.includes(id))assert.ok(length>=8*60,id+' plays for at least eight minutes');
        assert.ok(Math.abs(Number(await page.locator('#beSeek').getAttribute('max'))-length)<.1);
        for(const [from,to] of SKIP[id]||[]){
          await page.locator('#beSeek').fill(String(Math.round(clipPosition(from-.4,clipRanges(id,duration))*10)/10));
          await page.click('.be-play');
          await page.waitForFunction(({url,to})=>window.__audio.some(a=>a.src===url&&!a.paused&&a.currentTime>=to&&a.currentTime<to+5),{url:AU[id],to},{timeout:30000});
          await page.click('.be-play');
        }
        await page.locator('#beSeek').fill(String(Math.round((length-.5)*10)/10));
        await page.click('.be-play');
        await page.waitForFunction(({url,start})=>window.__audio.some(a=>a.src===url&&a.paused&&Math.abs(a.currentTime-start)<.2),
          {url:AU[id],start:START[id]||0},{timeout:30000});
        assert.equal(await page.locator('.be-play').getAttribute('aria-pressed'),'false');
        assert.equal(context.pages().length,1);
        console.log('Played, paused, and reached the end',id,LIB[+id.split('-')[0]][+id.split('-')[1]][0]);
        await library(tabFor(id));
      }
    }
    assert.deepEqual(errors,[]);
    console.log('Bookends OK: 76 rows, 69 playable; 15 new readings of 8–40 minutes, all streams under 40 minutes, saved preferences and gestures preserved.');
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
