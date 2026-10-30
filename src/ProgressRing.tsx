import { forming, formatNumber, type WheelStatus } from '../public/archive-core.js';
export function ProgressRing({ status, stale }: { status: WheelStatus | null; stale: boolean }) {
  const { progress, remaining, state } = forming(status);
  return <section className="forming" aria-labelledby="forming-title">
    <div className="progress-ring" role="img" aria-label={`Block progress: ${progress === null ? 'unknown' : `${(progress * 100).toFixed(1)} percent`}`}><svg viewBox="0 0 120 120" aria-hidden="true"><circle className="ring-track" cx="60" cy="60" r="51"/><circle className="ring-fill" cx="60" cy="60" r="51" pathLength="1" strokeDasharray={`${progress ?? 0} 1`} transform="rotate(-90 60 60)"/></svg><span>{progress === null ? '?' : `${(progress * 100).toFixed(1)}%`}</span></div>
    <div className="forming-copy"><div className="forming-heading"><h2 id="forming-title">Forming now</h2><span className={`wheel-state ${stale ? 'unknown' : state.toLowerCase()}`}><i/>{stale ? 'Unknown' : state}</span></div><p>{remaining === null ? 'Remaining work unknown' : `${formatNumber(remaining)} work to the next block`}{stale && status && ' · last snapshot'}</p><div className="forming-data"><span>Block <b>{status?.blockHeight ?? 'Unknown'}</b></span><span><b>{formatNumber(status?.rpmMilli === null || !status ? null : status.rpmMilli / 1000)}</b> rpm</span></div></div>
  </section>;
}
