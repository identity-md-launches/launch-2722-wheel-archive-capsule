import { fetchAPI, readStatus, readSettlements, forming, formatNumber, sealSVG, capsuleLine, TX_EXPLORER } from './archive-core.js';
const params = new URLSearchParams(location.search), widget = document.querySelector('#widget');
const dimension = (key, fallback, max) => { const value = Number(params.get(key)); return Number.isFinite(value) && value > 0 ? Math.max(1, Math.min(max, value)) : fallback; };
if (params.get('panel') === '1') widget.classList.add('panel');
widget.style.setProperty('--widget-width', `${dimension('w', 440, 7680)}px`);
if (params.has('h') && params.get('h')) widget.style.setProperty('--widget-height', `${dimension('h', 420, 4320)}px`);
const showCapsule = params.get('capsule') !== '0';
document.querySelector('#capsule').hidden = !showCapsule;
const every = dimension('every', 15, 3600) * 1000;
let status = null, capsule = null, timer, controller, stopped = false;
const text = (id, value) => { document.getElementById(id).textContent = value; };
async function update() {
  controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const paths = [fetchAPI('/status', controller.signal).then(readStatus)];
  if (showCapsule) paths.push(fetchAPI('/settlements?range=24h', controller.signal).then(readSettlements));
  const results = await Promise.allSettled(paths);
  clearTimeout(timeout);
  if (stopped) return;
  const statusFailed = results[0].status === 'rejected';
  if (!statusFailed) status = results[0].value;
  const ring = forming(status);
  text('percentage', ring.progress === null ? '?' : `${(ring.progress * 100).toFixed(1)}%`);
  document.querySelector('#fill').setAttribute('stroke-dasharray', `${ring.progress ?? 0} 1`);
  document.querySelector('.progress-ring').setAttribute('aria-label', `Block progress ${ring.progress === null ? 'unknown' : `${(ring.progress * 100).toFixed(1)} percent`}`);
  text('state', statusFailed ? status ? 'Unknown · last snapshot' : 'Unknown' : ring.state);
  text('remaining', ring.remaining === null ? 'Remaining work unknown' : `${formatNumber(ring.remaining)} work to the next block`);
  text('block', `Block ${status?.blockHeight ?? 'unknown'}`);
  if (showCapsule && results[1].status === 'fulfilled') {
    capsule = results[1].value.capsules[0] ?? null;
    document.querySelector('#seal').innerHTML = capsule ? sealSVG(capsule) : '';
    text('capsule-title', capsule ? `Round ${capsule.round}` : 'No settled rounds in the last 24h');
    text('line', capsule ? capsuleLine(capsule) : 'The next settled batch will become a capsule.');
    text('facts', capsule ? `${formatNumber(capsule.work)} work · ${formatNumber(capsule.blocks)} blocks` : '');
    const link = document.querySelector('#transaction'); link.hidden = !capsule;
    if (capsule) link.href = `${TX_EXPLORER}${capsule.tx}`;
  }
  const failed = results.some(result => result.status === 'rejected');
  text('api-note', failed ? `API unreachable; ${status || capsule ? 'showing the last good snapshot.' : 'live values are unknown.'}` : `Live · updates every ${every / 1000}s`);
  document.querySelector('#api-note').classList.toggle('unavailable', failed);
  timer = setTimeout(update, every);
}
void update();
addEventListener('pagehide', () => { stopped = true; clearTimeout(timer); controller?.abort(); });
