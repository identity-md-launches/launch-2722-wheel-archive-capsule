import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.WHEEL_PLAYWRIGHT ? pathToFileURL(process.env.WHEEL_PLAYWRIGHT).href : 'playwright');
// The share card uses the brand wheel, not a fabricated settlement record.
const spokes = Array.from({ length:24 }, (_, i) => `<path d="M0 -60V-188" transform="rotate(${i*15})"/>`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#111714"/><rect x="720" width="480" height="630" fill="#171f1b"/><g font-family="Arial,sans-serif" fill="#edf0e7"><text x="64" y="88" font-size="28" font-weight="600">Wheel Archive<tspan fill="#d5ec92">.</tspan></text><text x="60" y="280" font-size="80" letter-spacing="-4" font-weight="600">Every turn,</text><text x="60" y="370" font-size="80" letter-spacing="-4" font-weight="600">kept<tspan fill="#d5ec92">.</tspan></text><g font-size="25" fill="#a6afa5"><text x="64" y="438">Every settled batch of Squeekchain rounds</text><text x="64" y="475">becomes a sealed capsule.</text><text x="64" y="568" font-size="20">Squeekchain settlements · Sepolia testnet</text></g></g><g transform="translate(960 315)" fill="none"><g stroke="#35433a" stroke-width="1"><circle r="213"/><circle r="196"/><circle r="116"/></g><g stroke="#e7b67d" stroke-width="2" opacity=".8">${spokes}<circle r="52"/><circle r="16"/></g><circle r="213" stroke="#e7b67d" stroke-width="3" pathLength="1" stroke-dasharray=".7 1" transform="rotate(-90)"/><circle r="203" stroke="#79c8bb" stroke-width="2" pathLength="1" stroke-dasharray=".3 1" transform="rotate(100)"/></g></svg>`;
await writeFile('public/share.svg',svg);
const browser = await chromium.launch({headless:true,...(process.env.WHEEL_CHROMIUM ? {executablePath:process.env.WHEEL_CHROMIUM} : {})});
try {
  const page = await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  await page.setContent(`<style>html,body{margin:0}img{display:block}</style><img width="1200" height="630" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">`);
  await page.locator('img').evaluate(img=>img.decode());
  await page.screenshot({path:'public/share.png'});
  console.log('Generated share.svg and share.png (1200 × 630).');
} finally { await browser.close(); }
