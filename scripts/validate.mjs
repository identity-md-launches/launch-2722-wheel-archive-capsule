import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { verifyMessage, hexToString } from 'viem';

const root = resolve('dist');
const output = resolve('test/scratch/validation');
await mkdir(output, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!path.startsWith('/preview/')) { res.writeHead(404).end(); return; }
    const file = resolve(root, '.' + path.slice('/preview'.length), path.endsWith('/') ? 'index.html' : '');
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    res.setHeader('content-type', mime[extname(file)] ?? 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
const results = [];
const check = async (name, fn) => {
  try { const detail = await fn(); results.push({ name, passed: true, ...(detail ? { detail } : {}) }); console.log('PASS ' + name); }
  catch (error) { results.push({ name, passed: false, error: error.message }); console.error('FAIL ' + name + ': ' + error.message); }
};
const browsers = [];
try {
  const browser = await chromium.launch({ headless: true }); browsers.push(browser);
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.url().startsWith(url) && r.status() >= 400) errors.push(`Local resource ${r.status()}`); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await check('Static subpath, complete local assets, and share image', async () => {
    await page.getByRole('heading', { name: 'Every turn, kept.' }).waitFor();
    assert.equal(await page.locator('.capsule-card').count(), 6);
    const response = await page.request.get(new URL(await page.locator('meta[property="og:image"]').getAttribute('content'), url).href);
    assert.equal(response.status(), 200); assert.match(response.headers()['content-type'], /image\/png/);
    assert.deepEqual(errors, []);
  });
  await check('Search by name and settlement, empty state and clear', async () => {
    const search = page.getByRole('searchbox', { name: 'Search capsules' });
    await search.fill('orbit'); assert.equal(await page.locator('.capsule-card').count(), 1);
    await search.fill('#0180'); await page.getByRole('heading', { name: 'In good time' }).waitFor();
    await search.fill('No such settlement'); await page.getByRole('heading', { name: 'No capsules found.' }).waitFor();
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    assert.equal(await page.locator('.capsule-card').count(), 6);
  });
  await check('Month filter and chronological/name sorting', async () => {
    await page.getByRole('combobox', { name: 'Filter by month' }).selectOption('2026-09');
    assert.equal(await page.locator('.capsule-card').count(), 2);
    await page.getByRole('combobox', { name: 'Sort capsules' }).selectOption('oldest');
    assert.equal(await page.locator('.capsule-card h3').first().innerText(), 'Common ground');
    await page.getByRole('combobox', { name: 'Filter by month' }).selectOption('all');
    await page.getByRole('combobox', { name: 'Sort capsules' }).selectOption('title');
    assert.equal(await page.locator('.capsule-card h3').first().innerText(), 'A different orbit');
    await page.getByRole('combobox', { name: 'Sort capsules' }).selectOption('newest');
  });
  await check('Bookmarks persist, saved navigation, removal and empty recovery', async () => {
    await page.locator('.capsule-card').first().getByRole('button', { name: 'Save A full circle', exact: true }).click();
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /Saved capsules/ }).click();
    await page.waitForURL('**/#/saved');
    await page.getByRole('heading', { name: 'Keep a few close.' }).waitFor();
    assert.equal(await page.locator('.capsule-card').count(), 1);
    await page.getByRole('button', { name: 'Unsave A full circle', exact: true }).click();
    await page.getByRole('heading', { name: 'Make room for a favorite.' }).waitFor();
    await page.getByRole('link', { name: 'Explore capsules', exact: true }).click();
    await page.waitForURL('**/#/archive');
  });
  await check('Capsule deep link, dialog focus trap, Escape and focus return', async () => {
    const trigger = page.getByRole('button', { name: 'Explore capsule', exact: true });
    await trigger.focus(); await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Capsule #0184', exact: true }); await dialog.waitFor();
    assert.equal(await dialog.getByRole('heading', { name: 'A full circle' }).count(), 1);
    for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => !!document.activeElement?.closest('dialog')), true); }
    await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' });
    assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
    await page.goto(url + '#/capsule/182'); await page.getByRole('dialog', { name: 'Capsule #0182' }).waitFor();
    await page.keyboard.press('Escape');
    await page.goto(url + '#/capsule/999'); await page.getByRole('dialog', { name: 'Capsule not found' }).waitFor();
    await page.getByRole('link', { name: 'Return to the archive' }).click();
  });
  await check('Disconnected stamps state and wallet picker, no-wallet recovery', async () => {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /My stamps/ }).click();
    await page.getByRole('heading', { name: 'Your address has a story.' }).waitFor();
    await page.getByRole('button', { name: 'Connect to view stamps' }).click();
    const dialog = page.getByRole('dialog', { name: 'Connect a wallet' });
    await dialog.getByRole('button', { name: 'Browser wallet' }).click();
    await dialog.getByRole('status').filter({ hasText: 'Unable to connect' }).waitFor();
    assert.equal(await dialog.getByText('Injected', { exact: true }).count(), 0);
    await page.keyboard.press('Escape');
  });
  await check('Mobile first action, reflow, and all four wallet app links', async () => {
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1' });
    const m = await mobile.newPage(); await m.goto(url, { waitUntil: 'networkidle' });
    const action = await m.getByRole('button', { name: 'Explore capsule', exact: true }).boundingBox();
    assert.ok(action && action.y + action.height < 844);
    await m.screenshot({ path: output + '/390.png' });
    for (const width of [320, 390, 600, 800, 1024, 1440]) {
      await m.setViewportSize({ width, height: 900 });
      assert.equal(await m.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'overflow at ' + width);
    }
    await m.setViewportSize({ width: 390, height: 844 });
    await m.getByRole('button', { name: 'Connect wallet', exact: true }).click();
    const sheet = m.getByRole('dialog', { name: 'Connect a wallet' });
    for (const name of ['MetaMask', 'Coinbase Wallet', 'Rabby', 'Phantom']) { const link = sheet.getByRole('link', { name: 'Open in ' + name }); await link.waitFor(); assert.ok((await link.getAttribute('href')).includes(encodeURIComponent('/preview/')) || name === 'MetaMask'); }
    await sheet.getByRole('button', { name: 'Coinbase Smart Wallet' }).waitFor();
    const rect = await sheet.boundingBox(); assert.ok(rect && Math.abs(rect.y + rect.height - 844) < 2);
    await m.screenshot({ path: output + '/wallet-mobile.png' });
    await mobile.close(); return 'Main action fits at 390 × 844; no overflow at six widths.';
  });
  await check('Automated accessibility: archive and capsule dialog', async () => {
    await page.goto(url, { waitUntil: 'networkidle' });
    const archive = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    assert.deepEqual(archive.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
    await page.getByRole('button', { name: 'Explore capsule', exact: true }).click();
    const detail = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    assert.deepEqual(detail.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 800, height: 900 });
    const tablet = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    assert.deepEqual(tablet.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
    await page.setViewportSize({ width: 1440, height: 1000 });
    return 'No axe violations for the selected WCAG tags in the archive, capsule dialog, or 800px collapsed navigation.';
  });
  await check('Reduced motion and visible keyboard focus', async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const trigger = page.getByRole('button', { name: 'Explore capsule', exact: true });
    await trigger.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
    const style = await trigger.evaluate(el => { const c = getComputedStyle(el); return { outline: c.outlineStyle, width: parseFloat(c.outlineWidth), transition: c.transitionDuration }; });
    assert.equal(style.outline, 'solid'); assert.ok(style.width >= 2); assert.equal(style.transition, '0s');
    await page.screenshot({ path: output + '/focus-desktop.png' });
  });
  await check('EIP-6963 connection, rejected signature, verified stamp, receipt, reconnect and address isolation', async () => {
    // An ephemeral test signer exists only in this process. No key is shipped, saved, or logged.
    const account = privateKeyToAccount(generatePrivateKey());
    const otherAccount = privateKeyToAccount(generatePrivateKey());
    const wallet = await browser.newContext({ viewport: { width: 1100, height: 900 }, acceptDownloads: true });
    await wallet.exposeFunction('wheelTestSign', async hex => account.signMessage({ message: hexToString(hex) }));
    await wallet.addInitScript(({ address }) => {
      const handlers = new Map();
      let chain = '0x1';
      let authorized = localStorage.getItem('wheel-test-authorized') === 'true';
      window.wheelTestReject = true;
      const provider = {
        request: async ({ method, params }) => {
          if (method === 'eth_requestAccounts') { authorized = true; localStorage.setItem('wheel-test-authorized', 'true'); return [window.wheelTestAddress || address]; }
          if (method === 'eth_accounts') return authorized ? [window.wheelTestAddress || address] : [];
          if (method === 'eth_chainId') return chain;
          if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain') { chain = params[0].chainId; (handlers.get('chainChanged') || []).forEach(fn => fn(chain)); return null; }
          if (method === 'personal_sign') { if (window.wheelTestReject) { const e = new Error('User rejected signature'); e.code = 4001; throw e; } return window.wheelTestSign(params[0]); }
          if (method === 'wallet_getCapabilities') return {};
          if (method === 'wallet_requestPermissions' || method === 'wallet_getPermissions') return [{ parentCapability: 'eth_accounts' }];
          if (method === 'wallet_revokePermissions') return null;
          throw new Error('Unsupported test request ' + method);
        },
        on: (event, handler) => handlers.set(event, [...(handlers.get(event) || []), handler]),
        removeListener: (event, handler) => handlers.set(event, (handlers.get(event) || []).filter(fn => fn !== handler)),
      };
      window.wheelTestChangeAddress = next => { window.wheelTestAddress = next; (handlers.get('accountsChanged') || []).forEach(fn => fn([next])); };
      const detail = { info: { uuid: 'f6f6c6fc-61f9-4ba0-aed6-0618ae653cc5', name: 'Archive test wallet', icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>', rdns: 'test.wheel.wallet' }, provider };
      window.addEventListener('eip6963:requestProvider', () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail })));
      window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }));
    }, { address: account.address });
    const w = await wallet.newPage(); w.setDefaultTimeout(10000); await w.goto(url, { waitUntil: 'networkidle' });
    await w.getByRole('button', { name: 'Connect wallet', exact: true }).click();
    const picker = w.getByRole('dialog', { name: 'Connect a wallet' });
    assert.equal(await picker.getByRole('button', { name: 'Browser wallet' }).count(), 0);
    await picker.getByRole('button', { name: 'Archive test wallet' }).click(); await picker.waitFor({ state: 'hidden' });
    await w.getByRole('button', { name: 'Explore capsule', exact: true }).click();
    const detail = w.getByRole('dialog', { name: 'Capsule #0184' });
    const switchButton = detail.getByRole('button', { name: 'Switch to Base', exact: true });
    if (await switchButton.count()) await switchButton.click();
    await detail.getByRole('button', { name: 'Sign and leave a stamp' }).click();
    await detail.getByRole('status').filter({ hasText: 'Signature declined' }).waitFor();
    assert.equal(await detail.getByText('Signed by your address', { exact: true }).count(), 0);
    await w.evaluate(() => { window.wheelTestReject = false; });
    await detail.getByRole('button', { name: 'Sign and leave a stamp' }).click();
    await detail.getByText('Signed by your address', { exact: true }).waitFor();
    const downloaded = w.waitForEvent('download'); await detail.getByRole('button', { name: 'Download stamp receipt' }).click();
    const download = await downloaded; assert.equal(download.suggestedFilename(), 'wheel-stamp-184.json');
    const stream = await download.createReadStream(); const chunks = []; for await (const chunk of stream) chunks.push(chunk);
    const stamp = JSON.parse(Buffer.concat(chunks).toString());
    assert.equal(stamp.address, account.address); assert.equal(stamp.capsuleId, 184);
    assert.equal(await verifyMessage({ address: stamp.address, message: stamp.message, signature: stamp.signature }), true);
    await w.keyboard.press('Escape'); await w.getByRole('link', { name: /My stamps/ }).click();
    await w.getByRole('heading', { name: 'A mark that’s yours.' }).waitFor();
    assert.equal(await w.locator('.capsule-card').count(), 1);
    const exportEvent = w.waitForEvent('download'); await w.getByRole('button', { name: 'Export all stamps' }).click(); assert.equal((await exportEvent).suggestedFilename(), 'wheel-archive-stamps.json');
    await w.reload({ waitUntil: 'networkidle' }); await w.locator('.capsule-card').waitFor();
    await w.evaluate(next => window.wheelTestChangeAddress(next), otherAccount.address);
    await w.getByRole('heading', { name: 'Your first stamp is waiting.' }).waitFor();
    await wallet.close(); return 'A real ephemeral EOA signature was verified locally and in its downloaded receipt. No real wallet or funds used.';
  });
  await check('Corrupted browser storage recovers to usable archive', async () => {
    await page.evaluate(() => { localStorage.setItem('wheel-archive:saved:v1', '{broken'); localStorage.setItem('wheel-archive:stamps:v1', '{broken'); });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' }); assert.equal(await page.locator('.capsule-card').count(), 6);
    await page.getByRole('button', { name: 'Explore capsule', exact: true }).click(); await page.getByRole('dialog').waitFor(); await page.keyboard.press('Escape');
  });
  await check('Unavailable browser storage reports temporary changes', async () => {
    const noStorage = await browser.newContext();
    await noStorage.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Storage unavailable', 'QuotaExceededError'); }; });
    const p = await noStorage.newPage(); await p.goto(url, { waitUntil: 'networkidle' });
    await p.locator('.capsule-card').first().getByRole('button', { name: 'Save A full circle', exact: true }).click();
    await p.getByRole('status').filter({ hasText: 'Browser storage is unavailable' }).waitFor();
    await p.getByRole('link', { name: 'Saved capsules', exact: true }).click(); await p.getByRole('heading', { name: 'Keep a few close.' }).waitFor(); assert.equal(await p.locator('.capsule-card').count(), 1);
    await noStorage.close();
  });
  await check('No page exceptions or missing local resources during interactions', async () => assert.deepEqual(errors, []));
  try {
    const safari = await webkit.launch({ headless: true }); browsers.push(safari);
    await check('WebKit search and capsule interaction', async () => {
      const p = await safari.newPage({ viewport: { width: 390, height: 844 } }); await p.goto(url);
      await p.getByRole('button', { name: 'Explore capsule', exact: true }).click(); await p.getByRole('dialog', { name: 'Capsule #0184' }).waitFor(); await p.keyboard.press('Escape');
      await p.getByRole('searchbox', { name: 'Search capsules' }).fill('orbit'); assert.equal(await p.locator('.capsule-card').count(), 1);
    });
  } catch { results.push({ name: 'WebKit rendered interactions', passed: null, limitation: 'WebKit could not launch in this validation runtime; Safari and native device behavior remain unverified.' }); console.log('NOT VERIFIED WebKit rendered interactions: browser launch unavailable.'); }
} finally {
  for (const browser of browsers) await browser.close();
  await new Promise(done => server.close(done));
  await writeFile(output + '/results.json', JSON.stringify(results, null, 2) + '\n');
}
console.log(`${results.filter(r => r.passed === true).length} passed; ${results.filter(r => r.passed === false).length} failed; ${results.filter(r => r.passed === null).length} not verified.`);
if (results.some(r => r.passed === false)) process.exitCode = 1;
