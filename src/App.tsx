import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { API, RANGES, TX_EXPLORER, capsuleLine, formatNumber, summaryLine, type Capsule, type Range } from '../public/archive-core.js';
import { Icon, WheelMark } from './Icons';
import { WheelArt } from './WheelArt';
import { Modal } from './Modal';
import { ProgressRing } from './ProgressRing';
import { useFeed } from './feed';
const StampPanel = lazy(() => import('./StampPanel'));
const routeRound = () => /^#capsule-(\d+)$/.exec(location.hash)?.[1] ?? null;
export default function App() {
  const [range, setRange] = useState<Range>(() => routeRound() ? '30d' : '24h');
  const feed = useFeed(range);
  const [round, setRound] = useState(routeRound), [stamp, setStamp] = useState<Capsule | null>(null);
  const [info, setInfo] = useState(false), [notice, setNotice] = useState(''), [copyFallback, setCopyFallback] = useState('');
  const searchAttempted = useRef<string | null>(null);
  const latest = feed.archive.data?.capsules[0], selected = feed.archive.data?.capsules.find(c => c.round === round);
  useEffect(() => {
    const changed = () => { setRound(routeRound()); setNotice(''); setCopyFallback(''); };
    addEventListener('hashchange', changed);
    return () => removeEventListener('hashchange', changed);
  }, []);
  useEffect(() => {
    if (round && feed.archive.data && !selected && !feed.refreshing && range !== '30d' && searchAttempted.current !== round) {
      searchAttempted.current = round; setRange('30d');
    }
  }, [round, selected, feed.archive.data, feed.refreshing, range]);
  const close = () => { history.pushState(null, '', `${location.pathname}${location.search}`); setRound(null); setCopyFallback(''); setNotice(''); };
  const copy = async (capsule: Capsule) => {
    const url = new URL(location.href); url.hash = `capsule-${capsule.round}`;
    try { await navigator.clipboard.writeText(url.href); setNotice('Capsule link copied.'); }
    catch { setCopyFallback(url.href); setNotice('Copy this capsule link:'); }
  };
  const failed = [feed.status.unavailable && 'wheel', feed.supply.unavailable && 'supply', feed.archive.unavailable && 'settlements'].filter(Boolean);
  const stale = failed.length > 0, hasSnapshot = Boolean(feed.status.data || feed.supply.data || feed.archive.data), dataRange = feed.archive.data?.range;
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="app-shell">
      <aside className="sidebar">
        <a href="./" className="brand" aria-label="Wheel Archive home"><WheelMark size={36}/><span>Wheel<br/>Archive<span className="brand-period">.</span></span></a>
        <nav className="main-nav" aria-label="Main navigation"><a href="#collection" aria-label="All capsules" aria-current="page"><Icon name="archive"/><span>All capsules</span><span className="nav-count">{feed.archive.data?.capsules.length ?? '?'}</span></a><a href="./overlay.html" aria-label="Stream overlay"><Icon name="sun"/><span>Stream overlay</span><Icon name="diagonal" size={16}/></a></nav>
        <div className="sidebar-note"><WheelMark size={27}/><p>A turn settles.<br/>A story stays.</p><span className="small muted">Sealed in the numbers.<br/>Kept in the archive.</span></div>
        <div className="sidebar-bottom"><button onClick={() => setInfo(true)}><Icon name="info" size={18}/>About the archive<Icon name="diagonal" size={16}/></button><span className="small muted">Sepolia testnet</span></div>
      </aside>
      <div className="workspace">
        <header className="topbar"><div className="breadcrumb"><span>Archive</span><span>/</span><span>All capsules</span></div><div className="topbar-actions"><span className="network-label">Sepolia testnet</span><button className="text-button" onClick={feed.refresh} disabled={feed.refreshing}><Icon name="refresh" size={16}/>{feed.refreshing ? 'Refreshing…' : 'Refresh'}</button></div></header>
        <main id="main" tabIndex={-1}>
          <div className="page-heading"><div><h1>Every turn, kept<span className="heading-dot">.</span></h1><p>Every settled batch of Squeekchain rounds becomes a sealed capsule.</p></div><button className="text-button how-button" onClick={() => setInfo(true)}>How it works<Icon name="diagonal" size={17}/></button></div>
          <div className={`feed-notice${stale ? ' is-stale' : ''}`} role="status">{stale ? `API unreachable (${failed.join(', ')}); ${hasSnapshot ? `showing the last good snapshot${dataRange && dataRange !== range ? ` for ${dataRange}; ${range} is unavailable` : ''}.` : 'live values are unknown. Try Refresh.'}` : feed.refreshing && !hasSnapshot ? 'Reading Squeekchain…' : 'Live from Squeekchain · refreshes every 15 seconds'}</div>
          <ProgressRing status={feed.status.data} stale={feed.status.unavailable}/>
          {latest ? <section className="featured" aria-labelledby="featured-title"><div className="featured-art"><span className="art-caption">Latest settled capsule</span><WheelArt capsule={latest}/><span className="art-edition">Round {latest.round}</span></div><div className="featured-copy"><div className="featured-title-row"><h2 id="featured-title">Round {latest.round}</h2><span className="sealed-label"><Icon name="check" size={15}/>Sealed</span></div><p className="featured-description">{capsuleLine(latest)}</p><CapsuleFacts capsule={latest}/><div className="featured-actions"><a className="button primary" href={`#capsule-${latest.round}`}>Open capsule<Icon name="arrow" size={18}/></a><button className="button secondary" onClick={() => setStamp(latest)}><Icon name="stamp" size={18}/>Stamp</button></div><a className="transaction-link small" href={`${TX_EXPLORER}${latest.tx}`} target="_blank" rel="noopener noreferrer">View settlement transaction<Icon name="diagonal" size={14}/></a></div></section>
          : <section className="empty-feature" aria-labelledby="empty-title"><WheelMark size={72}/><div><h2 id="empty-title">{feed.archive.unavailable ? 'Waiting for the next connection.' : feed.archive.data ? 'No settlements in this range.' : 'Opening the archive…'}</h2><p>{feed.archive.unavailable ? 'Capsules will appear when the live feed returns.' : feed.archive.data ? 'Choose another range to explore settled rounds.' : 'Each settlement will arrive with its own seal and record.'}</p><button className="button primary" onClick={feed.refresh} disabled={feed.refreshing}>{feed.refreshing ? 'Reading the feed…' : 'Retry live feed'}<Icon name="arrow" size={18}/></button></div></section>}
          <section className="collection" id="collection" aria-labelledby="collection-title"><div className="section-heading"><h2 id="collection-title">The collection<span className="section-count">{feed.archive.data?.capsules.length ?? '?'}</span></h2><div className="range-switch" role="group" aria-label="Archive range">{RANGES.map(value => <button key={value} aria-pressed={range === value} onClick={() => setRange(value)}>{value}</button>)}</div></div>
            <p className="summary-line" role="status">{feed.archive.data ? `${dataRange} · ${summaryLine(feed.archive.data.summary)}` : 'Archive summary unknown'}{feed.archive.unavailable && feed.archive.data && ' · last snapshot'}{feed.refreshing && ' · updating'}</p>
            {feed.archive.data?.capsules.length ? <div className="capsule-grid">{feed.archive.data.capsules.map(capsule => <CapsuleCard key={capsule.round} capsule={capsule}/>)}</div> : <p className="collection-empty muted">{feed.archive.unavailable ? 'Try Refresh, or return when the feed is available.' : feed.archive.data ? 'No capsules returned. Try 7d or 30d.' : 'Waiting for settled rounds…'}</p>}
          </section>
          <section className="archive-context" aria-label="Wheel context"><div><span className="muted">Cumulative work</span><strong>{formatNumber(feed.status.data?.cumulativeWorkUnits)}</strong></div><div><span className="muted">Settled through round</span><strong>{feed.status.data?.settledThroughRound ?? 'Unknown'}</strong></div><div><span className="muted">Total minted</span><strong>{feed.supply.data ?? 'Unknown'}</strong></div></section>
          <footer className="page-footer"><span className="small muted">A capsule per settlement. A little history to keep.</span><a className="text-button small" href="./overlay.html?panel=1">Open OBS overlay<Icon name="diagonal" size={15}/></a></footer>
        </main>
      </div>
    </div>
    {round && !stamp && <Modal title={`Capsule · round ${round}`} onClose={close} className="capsule-modal">{selected ? <>
      <div className="capsule-detail-art"><WheelArt capsule={selected}/></div><p className="detail-story">{capsuleLine(selected)}</p><CapsuleFacts capsule={selected}/><div className="detail-block">Settled at block <b>{selected.block}</b></div>
      <a className="transaction-detail" href={`${TX_EXPLORER}${selected.tx}`} target="_blank" rel="noopener noreferrer"><span>Settlement transaction on Sepolia<Icon name="diagonal" size={15}/></span><code>{selected.tx}</code></a>
      <div className="detail-actions"><button className="button primary" onClick={() => setStamp(selected)}><Icon name="stamp" size={18}/>Stamp this capsule</button><button className="button secondary" onClick={() => void copy(selected)}><Icon name="copy" size={18}/>Copy link</button></div><p className="copy-status" role="status">{notice}</p>{copyFallback && <input aria-label="Capsule link" className="copy-fallback" readOnly value={copyFallback} onFocus={e => e.currentTarget.select()}/>}
    </> : <div className="missing-capsule"><p>{feed.refreshing ? 'Looking for this round…' : feed.archive.unavailable ? 'The API is unreachable. This capsule cannot be checked yet.' : 'This round is not in the API’s last 30 days of settlements.'}</p><button className="button secondary" onClick={feed.refresh} disabled={feed.refreshing}>Retry live feed</button><button className="text-button" onClick={close}>Return to the collection</button></div>}</Modal>}
    {stamp && <Suspense fallback={<Modal title="Preparing stamp" onClose={() => setStamp(null)}><p>Loading wallet options…</p></Modal>}><StampPanel capsule={stamp} onClose={() => setStamp(null)}/></Suspense>}
    {info && <Modal title="A turn settles. A story stays." onClose={() => setInfo(false)} className="info-modal"><p>Every settled batch of Squeekchain rounds becomes a sealed capsule.</p><ol className="how-steps"><li><h3>Read a settled round.</h3><p>The API supplies the work, completed blocks and transaction. The seal’s spokes grow with work; its outer arc fills over 40 completed blocks.</p></li><li><h3>Keep the link.</h3><p>Each capsule has a shareable round link. Its transaction hash fixes its seal, so the same record looks the same every time.</p></li><li><h3>Leave a stamp.</h3><p>A stamp is a zero-value transaction to your own address on Sepolia with the round in its data. It uses test ETH for gas. Your wallet is opened only when you choose to stamp.</p></li></ol><p className="info-note">There are no bookmarks, saved receipts or browser storage. Last-good API snapshots stay in memory until you close or reload the page.</p><a className="text-button" href={`${API}/status`} target="_blank" rel="noopener noreferrer">View the Squeekchain status source<Icon name="diagonal" size={16}/></a></Modal>}
  </>;
}
function CapsuleFacts({ capsule }: { capsule: Capsule }) {
  return <dl className="capsule-facts"><div><dt>Round</dt><dd>{capsule.round}</dd></div><div><dt>Work added</dt><dd>{formatNumber(capsule.work)}</dd></div><div><dt>Blocks completed</dt><dd>{formatNumber(capsule.blocks)}</dd></div></dl>;
}
function CapsuleCard({ capsule }: { capsule: Capsule }) {
  return <article className="capsule-card"><a className="card-art" href={`#capsule-${capsule.round}`} aria-label={`Open capsule for round ${capsule.round}`}><WheelArt capsule={capsule}/><span className="card-open"><Icon name="diagonal" size={18}/></span></a><div className="card-copy"><div className="card-title"><h3><a href={`#capsule-${capsule.round}`}>Round {capsule.round}</a></h3><span className="small muted">Block {capsule.block}</span></div><p className="card-line">{capsuleLine(capsule)}</p><CapsuleFacts capsule={capsule}/><a className="transaction-link small" href={`${TX_EXPLORER}${capsule.tx}`} target="_blank" rel="noopener noreferrer">Settlement transaction<Icon name="diagonal" size={14}/></a></div></article>;
}
