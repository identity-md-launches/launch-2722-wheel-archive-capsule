import { useEffect, useMemo, useRef, useState } from 'react';
import { useConnection } from 'wagmi';
import { capsules, capsuleNumber, formatDate, type Capsule } from './data';
import { Icon, WheelMark } from './Icons';
import { WheelArt } from './WheelArt';
import { Modal } from './Modal';
import { WalletSheet } from './WalletSheet';
import { StampPanel } from './StampPanel';
import { archiveChain, shortAddress } from './wallet';
import { downloadJson, persist, readSaved, readStamps, SAVED_KEY, STAMPS_KEY, type Stamp } from './storage';

type View = 'archive' | 'saved' | 'stamps';
function getRoute() { return location.hash.slice(2) || 'archive'; }

export default function App() {
  const { address, isConnected, chainId } = useConnection();
  const [route, setRoute] = useState(getRoute);
  const [saved, setSaved] = useState(readSaved);
  const [stamps, setStamps] = useState(readStamps);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [month, setMonth] = useState('all');
  const [connectOpen, setConnectOpen] = useState(false);
  const [info, setInfo] = useState<'about' | 'privacy' | null>(null);
  const [notice, setNotice] = useState('');
  const previousView = useRef<View>(route === 'saved' || route === 'stamps' ? route : 'archive');
  const mainRef = useRef<HTMLElement>(null);
  const view: View = ['saved', 'stamps'].includes(route) ? route as View : previousView.current;
  const selected = route.startsWith('capsule/') ? capsules.find(c => c.id === Number(route.split('/')[1])) : undefined;
  useEffect(() => {
    const onHash = () => {
      const next = getRoute(); setRoute(next);
      if (['archive', 'saved', 'stamps'].includes(next)) {
        const changedView = next !== previousView.current;
        previousView.current = next as View;
        if (changedView) { setQuery(''); setMonth('all'); requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true })); window.scrollTo({ top: 0 }); }
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const ownStamps = useMemo(() => stamps.filter(s => s.address.toLowerCase() === address?.toLowerCase()), [stamps, address]);
  const toggleSave = (id: number) => {
    const next = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id];
    const stored = persist(SAVED_KEY, next); setSaved(next);
    setNotice(stored ? `${capsuleNumber(id)} ${next.includes(id) ? 'saved to your collection.' : 'removed from saved capsules.'}` : 'Browser storage is unavailable. This change lasts until you close the page.');
  };
  const addStamp = (stamp: Stamp) => {
    const next = [...stamps.filter(s => !(s.capsuleId === stamp.capsuleId && s.address.toLowerCase() === stamp.address.toLowerCase())), stamp];
    const stored = persist(STAMPS_KEY, next); setStamps(next);
    setNotice(stored ? `Your stamp on ${capsuleNumber(stamp.capsuleId)} is saved in this browser.` : 'Your stamp is signed, but browser storage is unavailable. Download its receipt before leaving.');
  };
  const filtered = capsules.filter(c => {
    if (view === 'saved' && !saved.includes(c.id)) return false;
    if (view === 'stamps' && !ownStamps.some(s => s.capsuleId === c.id)) return false;
    if (month !== 'all' && !c.date.startsWith(month)) return false;
    return `${c.id} ${capsuleNumber(c.id)} ${c.title} ${c.note}`.toLowerCase().includes(query.trim().toLowerCase());
  }).sort((a, b) => sort === 'oldest' ? a.id - b.id : sort === 'title' ? a.title.localeCompare(b.title) : b.id - a.id);
  const latest = capsules[0];
  const showFeature = view === 'archive' && !query && month === 'all';
  const openCapsule = (capsule: Capsule) => { location.hash = `/capsule/${capsule.id}`; };
  const resetFilters = () => { setQuery(''); setMonth('all'); setSort('newest'); };
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="app-shell">
      <aside className="sidebar">
        <a href="#/archive" className="brand" aria-label="Wheel Archive home"><WheelMark size={36}/><span>Wheel<br/>Archive<span className="brand-period">.</span></span></a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#/archive" aria-label="All capsules" aria-current={view === 'archive' ? 'page' : undefined}><Icon name="archive"/><span>All capsules</span><span className="nav-count">{capsules.length.toString().padStart(2, '0')}</span></a>
          <a href="#/saved" aria-label="Saved capsules" aria-current={view === 'saved' ? 'page' : undefined}><Icon name="bookmark"/><span>Saved capsules</span>{saved.length > 0 && <span className="nav-count">{saved.length}</span>}</a>
          <a href="#/stamps" aria-label="My stamps" aria-current={view === 'stamps' ? 'page' : undefined}><Icon name="stamp"/><span>My stamps</span>{ownStamps.length > 0 && <span className="nav-count">{ownStamps.length}</span>}</a>
        </nav>
        <div className="sidebar-note"><span className="mini-wheel"><WheelMark size={25}/></span><p>A turn settles.<br/>A story stays.</p><span className="small muted">An archive of moments<br/>worth keeping.</span></div>
        <div className="sidebar-bottom"><button onClick={() => setInfo('about')}><Icon name="info" size={18}/>About the archive<Icon name="diagonal" size={16}/></button><span className="small muted">Made for the long turn.</span></div>
      </aside>

      <div className="workspace">
        <header className="topbar"><div className="breadcrumb"><span>Archive</span><span className="breadcrumb-slash">/</span><span>{view === 'saved' ? 'Saved capsules' : view === 'stamps' ? 'My stamps' : 'All capsules'}</span></div><button className="connect-button" onClick={() => setConnectOpen(true)}><span className={`connection-dot${isConnected ? ' connected' : ''}`}/>{isConnected && address ? chainId !== archiveChain.id ? 'Switch to Base' : shortAddress(address) : 'Connect wallet'}<Icon name="wallet" size={17}/></button></header>
        <main id="main" ref={mainRef} tabIndex={-1}>
          <div className="page-heading"><div><h1>{view === 'archive' ? <>Every turn, kept<span className="heading-dot">.</span></> : view === 'saved' ? 'Keep a few close.' : 'A mark that’s yours.'}</h1><p>{view === 'archive' ? 'A capsule for every settlement. A stamp you can leave on your own address.' : view === 'saved' ? 'The capsules you want to come back to, saved in this browser.' : 'Your wallet-signed keepsakes, collected in this browser.'}</p></div><button className="text-button how-button" onClick={() => setInfo('about')}>How it works<Icon name="diagonal" size={17}/></button></div>

          {showFeature && <section className="featured" aria-labelledby="featured-title"><div className="featured-art"><WheelArt large theme={latest.theme} shape={latest.shape}/><span className="art-caption">The latest turn</span><span className="art-edition">01 / 06</span></div><div className="featured-copy"><div className="featured-title-row"><h2 id="featured-title">{latest.title}</h2><Icon name="sun" size={24}/></div><p className="featured-description">{latest.note}{' '}<br/>The latest capsule in the Wheel Archive.</p><dl className="featured-facts"><div><dt>Settlement</dt><dd>{capsuleNumber(latest.id)}</dd></div><div><dt>Settled on</dt><dd>{formatDate(latest.date)}</dd></div></dl><div className="featured-actions"><button className="button primary" onClick={() => openCapsule(latest)}>Explore capsule<Icon name="arrow" size={18}/></button><button className={`icon-button save-button${saved.includes(latest.id) ? ' saved' : ''}`} aria-label={`${saved.includes(latest.id) ? 'Unsave' : 'Save'} ${latest.title}`} aria-pressed={saved.includes(latest.id)} onClick={() => toggleSave(latest.id)}><Icon name="bookmark"/></button></div><span className="small featured-footnote"><span className="tiny-square"/>Exhibition collection · sample settlement</span></div></section>}

          {view === 'stamps' && !isConnected && <section className="empty-state stamp-empty"><span className="empty-icon"><Icon name="stamp" size={30}/></span><h2>Your address has a story.</h2><p>Connect your wallet to see its stamps, or open a capsule to leave your first one.</p><button className="button primary" onClick={() => setConnectOpen(true)}>Connect to view stamps<Icon name="arrow" size={18}/></button><a className="text-button" href="#/archive">Explore all capsules</a></section>}

          {(view !== 'stamps' || isConnected) && <section className="collection" aria-labelledby="collection-title">
            <div className="section-heading"><h2 id="collection-title">{view === 'archive' ? 'The collection' : view === 'saved' ? 'Saved capsules' : 'Your stamps'}<span className="section-count">{filtered.length.toString().padStart(2, '0')}</span></h2>{view === 'archive' && <span className="collection-note">Small records. Lasting impressions.</span>}{view === 'stamps' && ownStamps.length > 0 && <button className="text-button" onClick={() => downloadJson(ownStamps, 'wheel-archive-stamps.json')}><Icon name="download" size={17}/>Export all stamps</button>}</div>
            <div className="collection-toolbar"><div className="search-field"><label htmlFor="capsule-search" className="sr-only">Search capsules</label><Icon name="search" size={19}/><input id="capsule-search" name="capsule-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or settlement…" autoComplete="off"/>{query && <button className="clear-search" aria-label="Clear search" onClick={() => setQuery('')}><Icon name="close" size={17}/></button>}</div><div className="filter-group"><label className="select-wrap"><Icon name="archive" size={16}/><span className="sr-only">Filter by month</span><select aria-label="Filter by month" value={month} onChange={e => setMonth(e.target.value)}><option value="all">All months</option><option value="2026-10">October 2026</option><option value="2026-09">September 2026</option></select><Icon name="down" size={16}/></label><label className="select-wrap"><span className="sr-only">Sort capsules</span><select aria-label="Sort capsules" value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Name A–Z</option></select><Icon name="down" size={16}/></label></div></div>
            <p className="sr-only" role="status">{filtered.length} {filtered.length === 1 ? 'capsule' : 'capsules'} found{query ? ` for ${query}` : ''}.</p>
            {filtered.length ? <div className="capsule-grid">{filtered.map(c => <CapsuleCard key={c.id} capsule={c} saved={saved.includes(c.id)} stamped={ownStamps.some(s => s.capsuleId === c.id)} onSave={() => toggleSave(c.id)} onOpen={() => openCapsule(c)}/>)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name={view === 'saved' && !query ? 'bookmark' : view === 'stamps' ? 'stamp' : 'search'} size={28}/></span><h3>{query || month !== 'all' ? 'No capsules found.' : view === 'saved' ? 'Make room for a favorite.' : 'Your first stamp is waiting.'}</h3><p>{query || month !== 'all' ? `Nothing matches ${query ? `“${query}”` : 'this month'}. Try another search or clear your filters.` : view === 'saved' ? 'Use the bookmark on a capsule to keep it in this collection.' : 'Open a capsule and sign a keepsake with your connected address.'}</p>{query || month !== 'all' ? <button className="button secondary" onClick={resetFilters}>Clear filters<Icon name="close" size={16}/></button> : <a className="button secondary" href="#/archive">Explore capsules<Icon name="arrow" size={17}/></a>}</div>}
            {filtered.length > 0 && <div className="collection-end"><span className="small muted">{view === 'archive' ? `All ${filtered.length} exhibition capsules, each a different turn.` : `${filtered.length} ${filtered.length === 1 ? 'capsule' : 'capsules'} in this collection.`}</span><WheelMark size={20}/></div>}
          </section>}

          {view === 'archive' && <section className="stamp-invitation"><div className="printed-stamp" aria-hidden="true"><WheelMark size={42}/><span>I was here</span></div><div><h2>The turn is shared.<br/>The stamp is yours.</h2><p>Find a capsule that means something.<br/>Leave a signed mark on your own address.</p></div><button className="text-button" onClick={() => openCapsule(latest)}>Leave your first stamp<Icon name="arrow" size={19}/></button></section>}
          <footer className="page-footer"><span className="small">A capsule per settlement. A little history to keep.</span><button className="small text-button" onClick={() => setInfo('privacy')}>Stored in your browser<Icon name="info" size={15}/></button></footer>
        </main>
      </div>
    </div>
    <div className={`notice${notice ? ' visible' : ''}`} role="status"><span>{notice}</span>{notice && <button className="icon-button" aria-label="Dismiss notification" onClick={() => setNotice('')}><Icon name="close" size={17}/></button>}</div>
    {selected && !connectOpen && <Modal title={`Capsule ${capsuleNumber(selected.id)}`} onClose={() => { location.hash = `/${previousView.current}`; }} className="capsule-modal">
      <div className="capsule-detail-art"><WheelArt theme={selected.theme} shape={selected.shape}/><span className="art-caption">Exhibition collection</span></div>
      <div className="detail-title"><h3>{selected.title}</h3><button className={`icon-button save-button${saved.includes(selected.id) ? ' saved' : ''}`} aria-pressed={saved.includes(selected.id)} aria-label={`${saved.includes(selected.id) ? 'Unsave' : 'Save'} ${selected.title}`} onClick={() => toggleSave(selected.id)}><Icon name="bookmark"/></button></div>
      <p className="detail-story">{selected.story}</p>
      <dl className="detail-facts"><div><dt>Settlement</dt><dd>{capsuleNumber(selected.id)}</dd></div><div><dt>Settled on</dt><dd>{formatDate(selected.date)}</dd></div><div><dt>Form</dt><dd>{String(selected.shape + 1).padStart(2, '0')} / {selected.turns} turns</dd></div></dl>
      <p className="small muted exhibition-disclosure">This is an illustrative settlement, not a live or verified onchain record.</p>
      <StampPanel capsule={selected} stamps={stamps} onStamp={addStamp} onConnect={() => setConnectOpen(true)}/>
    </Modal>}
    {route.startsWith('capsule/') && !selected && <Modal title="Capsule not found" onClose={() => { location.hash = '/archive'; }}><p>This capsule is not part of the exhibition collection.</p><a className="button primary" href="#/archive">Return to the archive</a></Modal>}
    {connectOpen && <WalletSheet onClose={() => setConnectOpen(false)}/>}
    {info && <Modal title={info === 'about' ? 'A little history to keep.' : 'Your collection stays with you.'} onClose={() => setInfo(null)} className="info-modal">{info === 'about' ? <>
      <WheelMark size={48}/><p className="modal-intro">Wheel Archive gives each settlement a capsule: a form, a moment, and a place for your own mark.</p>
      <ol className="how-steps"><li><span>01</span><div><h3>Find a turn.</h3><p>Explore six original capsules in this exhibition collection. Each one represents an illustrative settlement.</p></div></li><li><span>02</span><div><h3>Keep it close.</h3><p>Save a capsule with its bookmark. Your saved collection stays in this browser.</p></div></li><li><span>03</span><div><h3>Leave your stamp.</h3><p>Connect your wallet and sign a personal message. The signature binds the capsule to your address. Download a receipt to keep a copy.</p></div></li></ol>
      <p className="info-note">The archive is an exhibition, with no live settlement feed. Stamps are local keepsakes, not tokens or onchain transactions.</p>
    </> : <>
      <p className="modal-intro">Bookmarks and signed stamps are saved in this browser’s local storage. They are not shared with other visitors or synced between devices.</p>
      <p>Clearing site data removes this collection. Export your stamps from My stamps, or download a receipt inside any stamped capsule.</p><p>Wallet connection uses your chosen wallet provider. A stamp asks only for a readable message signature. Your keys stay in your wallet. Smart wallet signature verification may contact the public Base RPC.</p>
      <p className="info-note">To remove a saved capsule, select its bookmark again. To disconnect your wallet, open the address control in the header.</p>
    </>}</Modal>}
  </>;
}

function CapsuleCard({ capsule, saved, stamped, onSave, onOpen }: { capsule: Capsule; saved: boolean; stamped: boolean; onSave: () => void; onOpen: () => void }) {
  return <article className="capsule-card"><div className="card-art"><a href={`#/capsule/${capsule.id}`} aria-label={`Explore ${capsule.title}`}><WheelArt theme={capsule.theme} shape={capsule.shape}/></a><button className={`icon-button card-bookmark${saved ? ' saved' : ''}`} aria-label={`${saved ? 'Unsave' : 'Save'} ${capsule.title}`} aria-pressed={saved} onClick={onSave}><Icon name="bookmark" size={18}/></button>{stamped && <span className="stamped-label"><Icon name="check" size={14}/>Stamped</span>}</div><div className="card-content"><div className="card-meta"><span>Settlement {capsuleNumber(capsule.id)}</span><span>{formatDate(capsule.date).replace(' 2026', '')}</span></div><h3><a href={`#/capsule/${capsule.id}`}>{capsule.title}</a></h3><p>{capsule.note}</p><div className="card-footer"><span className="small muted">{String(capsule.shape + 1).padStart(2, '0')} / Wheel study</span><button className="icon-button" aria-label={`Open ${capsule.title}`} onClick={onOpen}><Icon name="diagonal" size={19}/></button></div></div></article>;
}
