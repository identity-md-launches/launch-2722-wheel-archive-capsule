import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const paths = Array.from({ length: 64 }, (_, i) => {
  const theta = i / 64 * Math.PI * 2;
  return '<path d="' + Array.from({ length: 81 }, (_, j) => {
    const phi = j / 80 * Math.PI * 2;
    const x = (82 + 30 * Math.cos(phi)) * Math.cos(theta);
    const y = (82 + 30 * Math.cos(phi)) * Math.sin(theta);
    return `${j ? 'L' : 'M'}${(x * .96 - y * .2).toFixed(2)},${((y * .96 + x * .2) * .72 + 30 * Math.sin(phi) * .88).toFixed(2)}`;
  }).join(' ') + 'Z"/>';
}).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#4d613b" stroke-opacity=".1"/></pattern></defs>
<rect width="1200" height="630" fill="#f7f7f2"/><rect x="660" width="540" height="630" fill="#e4ead5"/><rect x="660" width="540" height="630" fill="url(#grid)"/>
<g fill="none" stroke="#283329" stroke-width="2"><circle cx="80" cy="74" r="22"/><circle cx="80" cy="74" r="9"/><path d="M80 52v13m0 18v13M58 74h13m18 0h13M64.4 58.4l9.2 9.2m12.8 12.8 9.2 9.2m0-31.2-9.2 9.2m-12.8 12.8-9.2 9.2"/></g>
<g font-family="Arial, sans-serif" fill="#283329"><text x="119" y="82" font-size="26" font-weight="600">Wheel Archive.</text><text x="56" y="265" font-size="76" font-weight="600" letter-spacing="-4">Every turn,</text><text x="56" y="350" font-size="76" font-weight="600" letter-spacing="-4">kept.</text><text x="59" y="411" font-size="24" fill="#656b5d">A capsule for every settlement.</text><text x="59" y="447" font-size="24" fill="#656b5d">A stamp that’s yours.</text><rect x="58" y="507" width="240" height="57" rx="6" fill="#d5ec92"/><text x="82" y="543" font-size="20" font-weight="600">Explore the archive</text><text x="690" y="55" font-size="16">Exhibition collection</text><text x="690" y="586" font-size="16">A full circle · Settlement #0184</text></g>
<g transform="translate(930 320) scale(2)" fill="none" stroke="#4d613b" stroke-width=".65">${paths}</g></svg>`;
await writeFile('public/share.svg', svg);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<style>html,body{margin:0}img{display:block}</style><img width="1200" height="630" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">`);
  await page.locator('img').evaluate(img => img.decode());
  await page.screenshot({ path: 'public/share.png' });
  console.log('Generated public/share.svg and public/share.png (1200 × 630).');
} finally { await browser.close(); }
