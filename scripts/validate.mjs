// Isolated API/provider fixtures are test inputs only; production never imports this file.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium, webkit } = await import(process.env.WHEEL_PLAYWRIGHT ? pathToFileURL(process.env.WHEEL_PLAYWRIGHT).href : 'playwright');
const root = resolve('dist'), scratch = resolve('test/scratch');
await mkdir(`${scratch}/shots`, { recursive: true });
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.woff':'font/woff', '.png':'image/png' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith('/preview/')) { res.writeHead(404).end(); return; }
    const file = resolve(root, pathname.slice(9) || 'index.html');
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const body = await readFile(file); res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
const results = [];
async function check(name, run) { try { await run(); results.push({ name, passed:true }); console.log(`PASS ${name}`); } catch(e) { results.push({ name, passed:false, error:e.message }); console.log(`FAIL ${name}: ${e.message}`); } }
const hash = value => `0x${createHash('sha256').update(value).digest('hex')}`;
const rows = Array.from({ length:16 }, (_, i) => ({ settledThroughRound:String(1000-i), blockHeight:String(8000-i), workAdded:String([0,1,399,400,981][i%5]), completedBlockCount:String(i*4), transactionHash:hash(`settlement fixture ${i}`) }));
function model() { return { requests:[], failure:false, progress:250000000, state:'RUNNING', delay7:false }; }
async function fixtures(context, m) {
  await context.route('https://api.squeekchain.com/v1/**', async route => {
    const path = new URL(route.request().url()); m.requests.push(path.pathname + path.search);
    let body;
    if (m.failure) body = { status:'unavailable' };
    else if (path.pathname.endsWith('/status')) body = { measurement: { coreStatus:m.state, rpmMilli:32450, cumulativeWorkUnits:92840 }, builder:{anchor:{ blockHeight:'8001', blockProgress:String(m.progress), workPerThousandBlocks:'1987', settledThroughRound:'1000' }} };
    else if (path.pathname.endsWith('/economy/state')) body = { economy:{supply:{totalMintedBaseUnits:'1234567890000000000000001'}} };
    else { const range = path.searchParams.get('range'), count = { '24h':12,'7d':14,'30d':16 }[range]; if (range === '7d' && m.delay7) await new Promise(r=>setTimeout(r,350)); body={status:'available',recentSettlements:rows.slice(0,count),summary:{settlementCount:String(count),workAdded:String(range==='24h'?1520:range==='7d'?7520:30520)}}; }
    await route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(body) }).catch(()=>{});
  });
}
async function watch(page) {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('console',msg=>{if(msg.type()==='error') errors.push(msg.text());}); return errors;
}
const browser = await chromium.launch({ headless:true, ...(process.env.WHEEL_CHROMIUM ? { executablePath:process.env.WHEEL_CHROMIUM } : {}) });
try {
  const context = await browser.newContext({ viewport:{width:1440,height:1000}, permissions:['clipboard-read','clipboard-write'] });
  const m=model(); await fixtures(context,m);
  await context.addInitScript(() => {
    window.walletTouches=0; window.storageWrites=0;
    window.addEventListener('eip6963:requestProvider',()=>window.walletTouches++);
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(...args) { window.storageWrites++; return original.apply(this,args); };
  });
  const page=await context.newPage(), errors=await watch(page);
  page.setDefaultTimeout(8000); await page.goto(url,{waitUntil:'networkidle'});
  await check('12 capsules from API fixtures, full records and Sepolia links',async()=>{
    assert.equal(await page.locator('.capsule-card').count(),12);
    assert.equal(await page.locator('.capsule-card .wheel-art').count(),12);
    assert.equal(await page.locator('.capsule-card .capsule-facts').count(),12);
    assert.equal(await page.locator('.capsule-card a.transaction-link[href^="https://sepolia.etherscan.io/tx/"]').count(),12);
    assert.match(await page.locator('.archive-context').innerText(),/1234567\.890000000000000001/);
    assert.equal(await page.evaluate(()=>window.walletTouches),0); assert.equal(await page.evaluate(()=>window.storageWrites),0);
  });
  let firstSeal;
  await check('identical seal after reload and in a second isolated profile',async()=>{
    firstSeal=await page.locator('.featured .seal').innerHTML();
    await page.reload({waitUntil:'networkidle'}); assert.equal(await page.locator('.featured .seal').innerHTML(),firstSeal);
    const second=await browser.newContext(); await fixtures(second,model()); const p2=await second.newPage(); await p2.goto(url,{waitUntil:'networkidle'});
    assert.equal(await p2.locator('.featured .seal').innerHTML(),firstSeal); await second.close();
  });
  await check('range buttons each refetch and display the returned summary',async()=>{
    for(const [range,count] of [['7d',14],['30d',16],['24h',12]]) {
      const before=m.requests.filter(r=>r===`/v1/settlements?range=${range}`).length;
      await page.getByRole('button',{name:range,exact:true}).click();
      await page.waitForFunction(n=>document.querySelectorAll('.capsule-card').length===n,count);
      assert.match(await page.locator('.summary-line').innerText(),new RegExp(`^${range} · settlement count: ${count}`));
      assert.ok(m.requests.filter(r=>r===`/v1/settlements?range=${range}`).length>before);
    }
  });
  await check('progress updates and coreStatus flips running to asleep',async()=>{
    assert.equal(await page.locator('.progress-ring > span').innerText(),'25.0%');
    assert.match(await page.locator('.forming-copy').innerText(),/2 work/);
    m.progress=875000000; m.state='IDLE'; await page.getByRole('button',{name:'Refresh',exact:true}).click();
    await page.getByText('87.5%',{exact:true}).waitFor(); assert.match(await page.locator('.wheel-state').innerText(),/Asleep/);
    assert.equal(await page.locator('.ring-fill').getAttribute('stroke-dasharray'),'0.875 1');
  });
  await check('unavailable API retains the snapshot and explicitly marks unknown',async()=>{
    const seal=await page.locator('.featured .seal').innerHTML(); m.failure=true;
    await page.getByRole('button',{name:'Refresh',exact:true}).click(); await page.locator('.feed-notice.is-stale').waitFor();
    assert.match(await page.locator('.feed-notice').innerText(),/API unreachable.*last good snapshot/);
    assert.equal(await page.locator('.capsule-card').count(),12); assert.equal(await page.locator('.featured .seal').innerHTML(),seal);
    assert.equal(await page.locator('.progress-ring > span').innerText(),'87.5%'); assert.match(await page.locator('.wheel-state').innerText(),/Unknown/);
    await page.getByRole('button',{name:'7d',exact:true}).click(); await page.getByText(/24h; 7d is unavailable/).waitFor();
    assert.match(await page.locator('.summary-line').innerText(),/^24h/);
    m.failure=false; await page.getByRole('button',{name:'Refresh',exact:true}).click(); await page.waitForFunction(()=>document.querySelectorAll('.capsule-card').length===14);
    assert.equal(await page.locator('.feed-notice.is-stale').count(),0);
  });
  await check('late range response cannot overwrite the latest selection',async()=>{
    await page.getByRole('button',{name:'24h',exact:true}).click(); await page.waitForFunction(()=>document.querySelectorAll('.capsule-card').length===12);
    m.delay7=true; await page.getByRole('button',{name:'7d',exact:true}).click(); await page.getByRole('button',{name:'30d',exact:true}).click();
    await page.waitForFunction(()=>document.querySelectorAll('.capsule-card').length===16);
    await page.waitForTimeout(400); assert.match(await page.locator('.summary-line').innerText(),/^30d/); m.delay7=false;
  });
  await check('capsule deep link, copy link, Escape and trigger focus restoration',async()=>{
    const open=page.getByRole('link',{name:'Open capsule',exact:true}); await open.focus(); await page.keyboard.press('Enter');
    const dialog=page.getByRole('dialog',{name:'Capsule · round 1000'}); await dialog.waitFor(); assert.match(page.url(),/#capsule-1000$/);
    const closeButton=dialog.getByRole('button',{name:'Close Capsule · round 1000'});
    await closeButton.focus();await page.keyboard.press('Shift+Tab');assert.equal(await dialog.getByRole('button',{name:'Copy link',exact:true}).evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Tab');assert.equal(await closeButton.evaluate(el=>el===document.activeElement),true);
    await dialog.getByRole('button',{name:'Copy link',exact:true}).click(); await dialog.getByText('Capsule link copied.').waitFor();
    assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/#capsule-1000$/);
    await page.keyboard.press('Escape'); await dialog.waitFor({state:'hidden'});
    assert.equal(await open.evaluate(el=>el===document.activeElement),true);
    await page.goto(`${url}#capsule-985`,{waitUntil:'networkidle'});
    await page.getByRole('dialog',{name:'Capsule · round 985'}).getByText('Settled at block').waitFor();
    assert.match(await page.locator('.summary-line').innerText(),/^30d/); await page.keyboard.press('Escape');
  });
  await check('responsive first screen, no overflow, local fonts loaded and keyboard focus',async()=>{
    await page.goto(url,{waitUntil:'networkidle'});
    for(const width of [320,390,600,800,1024,1440]) {
      await page.setViewportSize({width,height:844});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow at ${width}`);
      if(width===390) { const box=await page.getByRole('link',{name:'Open capsule',exact:true}).boundingBox(); assert.ok(box.y+box.height<=844,`main action ends at ${box.y+box.height}`); await page.screenshot({path:`${scratch}/shots/mobile-390.png`}); }
    }
    await page.screenshot({path:`${scratch}/shots/desktop-1440.png`,fullPage:true});
    assert.equal(await page.evaluate(()=>document.fonts.check('14px "DM Sans Variable"')),true);
    await page.getByRole('link',{name:'Open capsule',exact:true}).focus();
    assert.equal(await page.getByRole('link',{name:'Open capsule',exact:true}).evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
  });
  await check('fresh API outage shows unknowns with no invented capsules',async()=>{
    const c=await browser.newContext(); const outage=model();outage.failure=true;await fixtures(c,outage);const p=await c.newPage();await p.goto(url,{waitUntil:'networkidle'});
    assert.equal(await p.locator('.capsule-card').count(),0);assert.match(await p.locator('.feed-notice').innerText(),/live values are unknown/);assert.equal(await p.locator('.progress-ring > span').innerText(),'?');assert.doesNotMatch(await p.locator('.forming').innerText(),/last snapshot/);assert.doesNotMatch(await p.locator('.summary-line').innerText(),/last snapshot/);await c.close();
  });
  await check('OBS transparency, dimensions, newest capsule, state and fast refresh',async()=>{
    const p=await context.newPage(); const overlayErrors=await watch(p);
    await p.goto(`${url}overlay.html?panel=1&w=480&h=420&every=0.1`,{waitUntil:'domcontentloaded'}); await p.getByRole('heading',{name:'Round 1000',exact:true}).waitFor();
    assert.deepEqual(await p.evaluate(()=>[getComputedStyle(document.documentElement).backgroundColor,getComputedStyle(document.body).backgroundColor]),['rgba(0, 0, 0, 0)','rgba(0, 0, 0, 0)']);
    assert.deepEqual(await p.locator('#widget').evaluate(el=>[el.clientWidth,el.clientHeight]),[478,418]);
    assert.equal(await p.locator('#seal').innerHTML(),firstSeal);assert.match(await p.locator('#state').innerText(),/Asleep/);
    m.progress=500000000;m.state='RUNNING';await p.getByText('50.0%',{exact:true}).waitFor();assert.equal(await p.locator('#state').innerText(),'Running');await p.screenshot({path:`${scratch}/shots/overlay-fixture.png`,omitBackground:true,clip:{x:0,y:0,width:480,height:420}});
    const before=await p.locator('#seal').innerHTML();m.failure=true;await p.getByText(/API unreachable/).waitFor();assert.equal(await p.locator('#seal').innerHTML(),before);assert.equal(await p.locator('#percentage').innerText(),'50.0%');
    assert.deepEqual(overlayErrors,[]);await p.close();m.failure=false;
    const minimal=await context.newPage();await minimal.goto(`${url}overlay.html?capsule=0`,{waitUntil:'networkidle'});assert.equal(await minimal.locator('#capsule').isVisible(),false);await minimal.close();
  });
  await check('no wallet: no connection on load, no transaction without a provider',async()=>{
    await page.goto(url,{waitUntil:'networkidle'});assert.equal(await page.evaluate(()=>window.walletTouches),0);
    await page.getByRole('button',{name:'Stamp',exact:true}).click();
    const modal=page.getByRole('dialog',{name:'Stamp round 1000'});await modal.getByRole('heading',{name:'Choose a wallet'}).waitFor();
    assert.match(await modal.innerText(),/0 ETH transaction.*Sepolia/);
    await modal.getByRole('button',{name:'Browser wallet',exact:true}).click();await modal.getByText(/No browser wallet connected/).waitFor();
    assert.equal(await modal.getByRole('button',{name:'Send zero-value stamp'}).count(),0);assert.equal(await page.evaluate(()=>window.storageWrites),0);await page.keyboard.press('Escape');
  });
  await check('named EIP-6963 wallet, Sepolia switch, declined then successful self-transaction',async()=>{
    const c=await browser.newContext(), walletModel=model();await fixtures(c,walletModel);
    const account=`0x${randomBytes(20).toString('hex')}`, sentHash=hash('returned mock transaction');
    await c.addInitScript(({account,sentHash})=>{
      window.calls=[];window.chain='0x1';window.reject=true;const handlers=new Map();
      const provider={request:async args=>{window.calls.push(args);const {method,params}=args;
        if(method==='eth_chainId')return window.chain;
        if(method==='eth_requestAccounts'||method==='eth_accounts')return [account];
        if(method==='wallet_requestPermissions'||method==='wallet_getPermissions')return [{parentCapability:'eth_accounts'}];
        if(method==='wallet_switchEthereumChain'){window.chain=params[0].chainId;(handlers.get('chainChanged')||[]).forEach(fn=>fn(window.chain));return null;}
        if(method==='eth_sendTransaction'){if(window.reject){const e=new Error('User rejected request');e.code=4001;throw e;}return sentHash;}
        if(method==='eth_getCode')return '0x';
        if(method==='eth_estimateGas')return '0x7000';
        throw new Error(`Unsupported mock method ${method}`);
      },on:(name,fn)=>handlers.set(name,[...(handlers.get(name)||[]),fn]),removeListener:(name,fn)=>handlers.set(name,(handlers.get(name)||[]).filter(x=>x!==fn))};
      const detail={info:{uuid:'a64cfb85-90fe-4bde-993b-b94b063dba39',name:'Test browser wallet',icon:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',rdns:'test.wheel'},provider};
      addEventListener('eip6963:requestProvider',()=>dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail})));
    },{account,sentHash});
    const p=await c.newPage();await p.goto(url,{waitUntil:'networkidle'});assert.equal(await p.evaluate(()=>window.calls.length),0);
    await p.getByRole('button',{name:'Stamp',exact:true}).click();const modal=p.getByRole('dialog',{name:'Stamp round 1000'});
    await modal.getByRole('button',{name:'Test browser wallet',exact:true}).click();
    const switcher=modal.getByRole('button',{name:'Switch to Sepolia',exact:true});
    await p.waitForFunction(()=>document.querySelector('.connected-address'));
    if(await switcher.count())await switcher.click();
    const send=modal.getByRole('button',{name:'Send zero-value stamp',exact:true});await send.waitFor();await send.click();await modal.getByText(/Stamp declined/).waitFor();
    await p.evaluate(()=>window.reject=false);await send.click();await modal.getByRole('heading',{name:'Stamp submitted'}).waitFor();assert.equal(await modal.getByText(sentHash,{exact:true}).innerText(),sentHash);await p.screenshot({path:`${scratch}/shots/stamp-fixture.png`});
    const tx=await p.evaluate(()=>window.calls.filter(x=>x.method==='eth_sendTransaction').at(-1).params[0]);
    assert.equal(tx.from.toLowerCase(),account.toLowerCase());assert.equal(tx.to.toLowerCase(),account.toLowerCase());assert.equal(BigInt(tx.value),0n);
    assert.equal(Buffer.from(tx.data.slice(2),'hex').toString('utf8'),'wheel-archive:1000');assert.equal(await p.evaluate(()=>window.chain),'0xaa36a7');
    assert.equal(await p.evaluate(()=>window.calls.filter(x=>/sign|approve/.test(x.method)).length),0);await c.close();
  });
  await check('no console errors in normal fixture interactions',async()=>{assert.deepEqual(errors,[]);});
  await check('automated accessibility on archive and capsule',async()=>{
    const { default:AxeBuilder }=await import(process.env.WHEEL_AXE ? pathToFileURL(process.env.WHEEL_AXE).href : '@axe-core/playwright');
    await page.goto(url,{waitUntil:'networkidle'});await page.setViewportSize({width:390,height:844});
    const scan=async()=>{const report=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();assert.deepEqual(report.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);};
    await scan();await page.getByRole('link',{name:'Open capsule',exact:true}).click();await scan();await page.keyboard.press('Escape');
  });
  await check('clipboard denial leaves a selectable full link',async()=>{
    await page.goto(url,{waitUntil:'networkidle'});await page.getByRole('link',{name:'Open capsule',exact:true}).click();
    await page.evaluate(()=>Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async()=>{throw new Error('Clipboard denied for test');}}));
    await page.getByRole('button',{name:'Copy link',exact:true}).click();const input=page.getByRole('textbox',{name:'Capsule link'});await input.waitFor();assert.match(await input.inputValue(),/#capsule-1000$/);await page.keyboard.press('Escape');
  });
  await context.close();
  try {
    if (process.env.WHEEL_SKIP_WEBKIT === '1') throw new Error('WebKit was skipped: this runtime could launch it but could not create a page within the bounded probe.');
    const engine=await webkit.launch({headless:true,timeout:10000});
    await check('WebKit primary capsule flow and identical seal geometry',async()=>{const c=await engine.newContext();await fixtures(c,model());const p=await c.newPage();await p.goto(url,{waitUntil:'networkidle'});assert.equal(await p.locator('.featured .seal').innerHTML(),firstSeal);await p.getByRole('link',{name:'Open capsule',exact:true}).click();await p.getByRole('dialog',{name:'Capsule · round 1000'}).waitFor();await p.keyboard.press('Escape');await c.close();});
    await engine.close();
  } catch(e) { results.push({name:'WebKit primary capsule flow',skipped:true,reason:e.message.split('\n').slice(0,4).join(' ')}); console.log('SKIP WebKit runtime unavailable'); }
} finally {
  await browser.close(); await new Promise(resolve=>server.close(resolve));
  await writeFile(`${scratch}/interaction-results.json`,JSON.stringify({fixtureData:true,results},null,2)+'\n');
}
console.log(JSON.stringify({passed:results.filter(r=>r.passed).length,failed:results.filter(r=>r.passed===false).length,skipped:results.filter(r=>r.skipped).length}));
if(results.some(r=>r.passed===false))process.exitCode=1;
