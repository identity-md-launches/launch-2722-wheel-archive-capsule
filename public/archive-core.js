// Dependency-free shared logic for the archive and OBS source.
export const API = 'https://api.squeekchain.com/v1';
export const RANGES = ['24h', '7d', '30d'];
export const TX_EXPLORER = 'https://sepolia.etherscan.io/tx/';
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const numeric = v => (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '')) && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : null;
const integer = v => { const n = numeric(v); return n !== null && Number.isSafeInteger(n) ? n : null; };
const identifier = v => typeof v === 'string' && /^\d+$/.test(v) ? BigInt(v).toString() : (integer(v) !== null ? String(v) : null);
const unavailable = v => object(v) && v.status === 'unavailable';
export async function fetchAPI(path, signal) {
  const response = await fetch(`${API}${path}`, { signal, cache: 'no-store', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`API HTTP ${response.status}`);
  const payload = await response.json();
  if (!object(payload) || unavailable(payload)) throw new Error('API unavailable');
  return payload;
}
export function readStatus(payload) {
  const status = object(payload.status) ? payload.status : payload;
  if (unavailable(status) || !object(status.measurement) || !object(status.builder?.anchor)) throw new Error('Status unavailable');
  const m = status.measurement, a = status.builder.anchor;
  return { coreStatus: typeof m.coreStatus === 'string' ? m.coreStatus : null, rpmMilli: numeric(m.rpmMilli), cumulativeWorkUnits: numeric(m.cumulativeWorkUnits), blockHeight: identifier(a.blockHeight), blockProgress: numeric(a.blockProgress), workPerThousandBlocks: numeric(a.workPerThousandBlocks), settledThroughRound: identifier(a.settledThroughRound) };
}
export function readEconomy(payload) {
  const economy = object(payload.economy) ? payload.economy : payload;
  if (unavailable(economy) || !object(economy.supply)) throw new Error('Supply unavailable');
  const baseUnits = identifier(economy.supply.totalMintedBaseUnits);
  if (baseUnits === null) throw new Error('Supply unavailable');
  // Exact decimal division without rounding large integers through JS numbers.
  const padded = baseUnits.padStart(19, '0'), fraction = padded.slice(-18).replace(/0+$/, '');
  return `${padded.slice(0, -18)}${fraction ? `.${fraction}` : ''}`;
}
export function readSettlements(payload) {
  const settlements = object(payload.settlements) ? payload.settlements : payload;
  if (unavailable(settlements) || !Array.isArray(settlements.recentSettlements) || !object(settlements.summary)) throw new Error('Settlements unavailable');
  const capsules = settlements.recentSettlements.map(row => {
    if (!object(row)) throw new Error('Invalid settlement');
    const round = identifier(row.round ?? row.roundId), block = identifier(row.blockHeight ?? row.blockNumber);
    const work = numeric(row.workAdded), blocks = integer(row.completedBlockCount), tx = row.transactionHash ?? row.txHash;
    if (round === null || block === null || work === null || blocks === null || typeof tx !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(tx)) throw new Error('Incomplete settlement');
    return { round, block, work, blocks, tx: tx.toLowerCase() };
  });
  const unique = [...new Map(capsules.map(c => [c.round, c])).values()];
  unique.sort((a, b) => BigInt(a.round) > BigInt(b.round) ? -1 : BigInt(a.round) < BigInt(b.round) ? 1 : 0);
  return { capsules: unique, summary: settlements.summary };
}
export function forming(status) {
  const progress = status?.blockProgress === null || status?.blockProgress === undefined ? null : Math.max(0, Math.min(1, status.blockProgress / 1e9));
  const remaining = progress === null || status.workPerThousandBlocks === null ? null : Math.ceil((1 - progress) * status.workPerThousandBlocks / 1000);
  const core = status?.coreStatus?.toLowerCase();
  return { progress, remaining, state: core === 'running' ? 'Running' : core === 'asleep' ? 'Asleep' : 'Unknown' };
}
// FNV-1a-32 over lowercase UTF-8 hash text. Expand the state by hashing counter
// bytes 0..7, emitting each resulting word little-endian. Explicit 32-bit overflow.
export function hashBytes(tx) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(tx)) throw new Error('Invalid transaction hash');
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(tx.toLowerCase())) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
  const bytes = [];
  for (let counter = 0; counter < 8; counter++) {
    hash = Math.imul(hash ^ counter, 0x01000193) >>> 0;
    for (let shift = 0; shift < 32; shift += 8) bytes.push((hash >>> shift) & 255);
  }
  return bytes;
}
const fixed = n => n.toFixed(4);
export function sealSVG(c) {
  const b = hashBytes(c.tx), count = Math.max(6, Math.min(48, 6 + Math.round(Math.log2(c.work + 2) * 4)));
  const color = `hsl(${24 + b[2] % 26}, 79%, 68%)`, arc = Math.min(1, c.blocks / 40), rotation = b[0] * 360 / 256;
  const spokes = Array.from({ length: count }, (_, i) => `<path d="M0 -27V-${fixed(59 + b[(i + 3) % 32] / 255 * 48)}" transform="rotate(${fixed(i * 360 / count + rotation)})" opacity="${fixed(.28 + b[(i + 17) % 32] / 255 * .72)}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" class="wheel-art" viewBox="0 0 300 300" role="img" aria-label="Settlement seal for round ${c.round}" data-spokes="${count}" data-arc="${arc}"><g transform="translate(150 150)" fill="none"><g stroke="#858c87" stroke-width="0.6" opacity="0.35"><circle r="122"/><circle r="108"/><circle r="65"/><path d="M-137 0H137M0 -137V137"/></g><g stroke="${color}" stroke-width="1.6" stroke-linecap="round">${spokes}</g><circle r="20" stroke="${color}" stroke-width="1.2"/><circle r="7" stroke="${color}" stroke-width="1.2"/><circle r="122" stroke="${color}" stroke-width="3" pathLength="1" stroke-dasharray="${fixed(arc)} 1" transform="rotate(-90)"/><circle r="114" stroke="#79c8bb" stroke-width="1.5" pathLength="1" stroke-dasharray="${fixed(.12 + b[1] / 255 * .48)} 1" transform="rotate(90) scale(-1 1)"/><g stroke="#858c87" opacity="0.7" stroke-width="1"><path d="M-139 -128v-11h11M128 -139h11v11M139 128v11h-11M-128 139h-11v-11"/></g></g></svg>`;
}
export function capsuleLine(c) {
  const register = c.work === 0 ? 'rest' : c.work < 400 ? 'trot' : 'sprint';
  const phrases = {
    rest: ['A rest, with no work added', 'No work added in this quiet turn', 'A pause in the work count', 'A turn at rest: zero work added'],
    trot: ['A trot, with a little work added', 'A modest turn in the work count', 'A little more work in the archive', 'A measured trot of added work'],
    sprint: ['A sprint of added work', 'A full sprint in the work count', 'A turn with at least 400 work added', 'At least 400 work in this sprint'],
  };
  return `${phrases[register][hashBytes(c.tx)[3] % 4]}; round ${c.round}, block ${c.block}.`;
}
export function summaryLine(summary) {
  const values = [];
  function visit(value, path = '') {
    for (const [key, item] of Object.entries(value)) {
      const label = `${path}${key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase()}`;
      if (object(item)) visit(item, `${label} `);
      else if (typeof item === 'number' || typeof item === 'string' || typeof item === 'boolean') values.push(`${label}: ${String(item)}`);
    }
  }
  visit(summary);
  return values.length ? values.join(' · ') : 'No summary figures returned.';
}
export function formatNumber(value) { return value === null || value === undefined ? 'Unknown' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(value); }
