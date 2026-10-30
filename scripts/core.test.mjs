import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { hashBytes, sealSVG, capsuleLine, forming, readStatus, readEconomy, readSettlements, summaryLine } from '../public/archive-core.js';
const tx = `0x${createHash('sha256').update('isolated test fixture').digest('hex')}`;
const capsule = { tx, round: '42', block: '780', work: 400, blocks: 20 };
test('hash expansion is stable, case-normalized, and exactly 32 bytes', () => {
  assert.equal(hashBytes(tx).length, 32);
  assert.deepEqual(hashBytes(tx), hashBytes(tx.toUpperCase().replace('0X', '0x')));
  assert.notDeepEqual(hashBytes(tx), hashBytes(`0x${createHash('sha256').update('another fixture').digest('hex')}`));
  assert.throws(() => hashBytes('not a transaction'));
});
test('seal count, arc and hue follow the specified arithmetic at boundaries', () => {
  for (const work of [0, 1, 399, 400, 1e12]) {
    const svg = sealSVG({ ...capsule, work });
    assert.match(svg, new RegExp(`data-spokes="${Math.max(6, Math.min(48, 6 + Math.round(Math.log2(work + 2) * 4)))}"`));
    assert.match(svg, new RegExp(`hsl\\(${24 + hashBytes(tx)[2] % 26},`));
    assert.equal(svg, sealSVG({ ...capsule, work }));
  }
  assert.match(sealSVG(capsule), /data-arc="0.5"/);
  assert.match(sealSVG({ ...capsule, blocks: 200 }), /data-arc="1"/);
  assert.doesNotMatch(sealSVG(capsule), /<image|<canvas|href=|url\(/);
});
test('voice register boundaries name the exact round and block', () => {
  for (const work of [0, 1, 399, 400]) {
    const line = capsuleLine({ ...capsule, work });
    assert.match(line, /round 42, block 780\.$/);
    if (work === 0) assert.match(line, /rest|pause|No work|no work/);
    else if (work < 400) assert.match(line, /trot|modest|little/i);
    else assert.match(line, /sprint|400/);
    assert.doesNotMatch(line, /\p{Extended_Pictographic}/u);
  }
});
test('forming ring scales by 1e9, rounds remaining work up, and preserves unknowns', () => {
  const status = { blockProgress: 250000000, workPerThousandBlocks: 1001, coreStatus: 'running' };
  assert.deepEqual(forming(status), { progress: .25, remaining: 1, state: 'Running' });
  assert.equal(forming({ ...status, blockProgress: 0 }).progress, 0);
  assert.equal(forming({ ...status, blockProgress: 0 }).remaining, 2);
  assert.equal(forming({ ...status, blockProgress: 1e9 }).remaining, 0);
  assert.equal(forming({ ...status, coreStatus: 'asleep' }).state, 'Asleep');
  assert.deepEqual(forming(null), { progress: null, remaining: null, state: 'Unknown' });
  assert.equal(forming({ ...status, coreStatus: 'unrecognized' }).state, 'Unknown');
});
test('supply division retains all 18 decimal places without floating-point loss', () => {
  assert.equal(readEconomy({ economy: { supply: { totalMintedBaseUnits: '1234567890123456789000000000000000001' } } }), '1234567890123456789.000000000000000001');
  assert.equal(readEconomy({ supply: { totalMintedBaseUnits: '0' } }), '0');
  assert.throws(() => readEconomy({ status: 'unavailable' }));
});
test('missing measurements are unknown and unavailable responses are never zero', () => {
  assert.equal(readStatus({ measurement: {}, builder: { anchor: {} } }).rpmMilli, null);
  assert.throws(() => readStatus({ status: 'unavailable' }));
  assert.throws(() => readSettlements({ status: 'unavailable' }));
  assert.throws(() => readSettlements({ settlements: { recentSettlements: [{}], summary: {} } }));
});
test('settlements validate and sort numeric rounds; summary uses actual API values', () => {
  const row = { transactionHash: tx, round: '42', blockHeight: '780', workAdded: 400, completedBlockCount: 20 };
  const result = readSettlements({ settlements: { recentSettlements: [row, { ...row, round: '100' }], summary: { totalWorkAdded: 800 } } });
  assert.deepEqual(result.capsules.map(c => c.round), ['100', '42']);
  assert.equal(summaryLine(result.summary), 'total work added: 800');
  assert.throws(() => readSettlements({ recentSettlements: [{ ...row, round: '<script>' }], summary: {} }));
});
test('live settlement fields preserve the capsule and returned summary', () => {
  // Public API record captured 2026-10-30; neither round nor roundId is present.
  const row = { settledThroughRound: '539', blockHeight: '4135', workAdded: '199', completedBlockCount: '17', transactionHash: '0xae5fab9c7d4ec6eff15a8e9fb9657345a6485b8dd7f6d96b0d675f651aa6e36c' };
  const summary = { settlementCount: '143', activeRoundCount: '27', workAdded: '13297', completedBlockCount: '1141', archivedSettlementCount: '133' };
  for (const settlements of [
    { status: 'available', recentSettlements: [row], summary },
    { settlements: { recentSettlements: [row], summary } },
  ]) {
    const result = readSettlements(settlements);
    assert.deepEqual(result.capsules, [{ round: '539', block: '4135', work: 199, blocks: 17, tx: row.transactionHash }]);
    assert.deepEqual(result.summary, summary);
  }
  const result = readSettlements({ recentSettlements: [{ ...row, round: '1', roundId: '2' }], summary });
  assert.equal(result.capsules[0].round, '539', 'settledThroughRound is authoritative');
});
test('live IDLE status becomes Asleep without changing ring measurements', () => {
  const payload = { measurement: { coreStatus: 'IDLE', rpmMilli: 0, cumulativeWorkUnits: '45957' }, builder: { anchor: { blockHeight: '4135', blockProgress: '35822082', workPerThousandBlocks: '11801', settledThroughRound: '569' } } };
  const status = readStatus(payload);
  assert.deepEqual(forming(status), { progress: .035822082, remaining: 12, state: 'Asleep' });
  for (const coreStatus of ['RUNNING', 'running']) assert.equal(forming({ ...status, coreStatus }).state, 'Running');
  for (const coreStatus of ['IDLE', 'idle', 'asleep']) assert.equal(forming({ ...status, coreStatus }).state, 'Asleep');
  for (const coreStatus of [null, 'unavailable', 'unrecognized']) assert.equal(forming({ ...status, coreStatus }).state, 'Unknown');
});
