import { useState } from 'react';
import { useConnect, useConnectors, type Connector } from 'wagmi';
import { Icon } from './Icons';
import { archiveChain, OPEN_IN } from './wallet';
export function WalletSheet() {
  const { connectAsync, isPending, variables } = useConnect();
  const connectors = useConnectors(), [error, setError] = useState('');
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && !connectors.some(c => c.type === 'injected' && c.id !== 'injected');
  const named = connectors.some(c => c.type === 'injected' && c.id !== 'injected');
  const listed = [...connectors.filter(c => c.type === 'injected'), ...connectors.filter(c => c.type !== 'injected')].filter(c => !(c.id === 'injected' && named) && !(mobile && c.type === 'injected'));
  const connect = async (connector: Connector) => {
    setError('');
    try { await connectAsync({ connector, chainId: archiveChain.id }); }
    catch (e) { setError(/reject|denied/i.test(String(e)) ? 'Connection declined. Choose a wallet to try again.' : 'No browser wallet connected. Nothing has been sent; choose an installed wallet or open this page in its browser.'); }
  };
  return <><h3 className="wallet-title">Choose a wallet</h3><div className="wallet-rows">
    {mobile && OPEN_IN.map(w => <a className="wallet-row" key={w.id} href={w.href(location.href)}><img src={`./wallets/${w.id}.svg`} width="28" height="28" alt=""/><span>Open in {w.name}</span><Icon name="diagonal" size={18}/></a>)}
    {listed.map(c => <button className="wallet-row" key={c.uid} disabled={isPending} onClick={() => void connect(c)}>{c.icon ? <img src={c.icon} width="28" height="28" alt=""/> : c.id === 'coinbaseWalletSDK' ? <img src="./wallets/coinbase.svg" width="28" height="28" alt=""/> : <Icon name="wallet" size={28}/>}<span>{c.id === 'injected' ? 'Browser wallet' : c.id === 'coinbaseWalletSDK' && mobile ? 'Coinbase Smart Wallet' : c.name}{isPending && variables?.connector === c ? ' · opening…' : ''}</span><Icon name="arrow" size={18}/></button>)}
  </div><p className="small muted wallet-help">No wallet connected, no transaction sent. On a phone, open this page in your wallet’s browser.</p><p className="inline-error" role="status">{error}</p></>;
}
