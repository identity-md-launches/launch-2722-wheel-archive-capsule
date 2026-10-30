import { useEffect, useState } from 'react';
import { useConnect, useConnectors, useConnection, useDisconnect, useSwitchChain, type Connector } from 'wagmi';
import { getAddress } from 'viem';
import { Icon } from './Icons';
import { Modal } from './Modal';
import { archiveChain, OPEN_IN, shortAddress } from './wallet';

export function WalletSheet({ onClose }: { onClose: () => void }) {
  const { address, isConnected, chainId } = useConnection();
  const { connectAsync, isPending, variables } = useConnect();
  const connectors = useConnectors();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const [error, setError] = useState('');
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && !connectors.some(c => c.type === 'injected' && c.id !== 'injected');
  const named = connectors.some(c => c.type === 'injected' && c.id !== 'injected');
  const listed = [...connectors.filter(c => c.type === 'injected'), ...connectors.filter(c => c.type !== 'injected')].filter(c => !(c.id === 'injected' && named) && !(mobile && c.type === 'injected'));
  useEffect(() => { if (isConnected && !address) onClose(); }, [isConnected, address, onClose]);
  const connectWallet = async (connector: Connector) => {
    setError('');
    try { await connectAsync({ connector, chainId: archiveChain.id }); onClose(); }
    catch (e) { setError((e as { name?: string }).name === 'UserRejectedRequestError' || /reject|denied/i.test(String(e)) ? 'Connection declined. Choose a wallet to try again.' : 'Unable to connect. Open your wallet, then try again.'); }
  };
  const label = (c: Connector) => c.id === 'injected' ? 'Browser wallet' : c.id === 'coinbaseWalletSDK' && mobile ? 'Coinbase Smart Wallet' : c.name;
  return <Modal title={isConnected ? 'Your address' : 'Connect a wallet'} onClose={onClose} className="wallet-modal">
    {isConnected && address ? <>
      <p className="modal-intro">Your stamps belong to this address.</p><code className="full-address">{getAddress(address)}</code>
      <p className="muted small">{chainId === archiveChain.id ? 'Connected to Base' : 'Switch to Base to leave a stamp.'}</p>
      {chainId !== archiveChain.id && <button className="button primary full" disabled={switching} onClick={async () => { setError(''); try { await switchChainAsync({ chainId: archiveChain.id }); } catch { setError('Network change declined. Try switching to Base in your wallet.'); } }}>{switching ? 'Switching…' : 'Switch to Base'}</button>}
      <button className="button secondary full" onClick={() => { disconnect(); onClose(); }}>Disconnect {shortAddress(address)}</button>
    </> : <>
      <p className="modal-intro">Sign a keepsake with your own address. No payment, gas, or token approval.</p>
      <div className="wallet-rows">
        {mobile && OPEN_IN.map(w => <a key={w.id} className="wallet-row" href={w.href(location.href)}><img src={`./wallets/${w.id}.svg`} width="28" height="28" alt=""/><span>Open in {w.name}</span><Icon name="diagonal" size={18}/></a>)}
        {listed.map(c => <button className="wallet-row" key={c.uid} disabled={isPending} onClick={() => void connectWallet(c)}>
          {c.icon ? <img src={c.icon} width="28" height="28" alt=""/> : c.id === 'coinbaseWalletSDK' ? <img src="./wallets/coinbase.svg" width="28" height="28" alt=""/> : <span className="browser-wallet-icon"><Icon name="wallet" size={24}/></span>}
          <span>{label(c)}{isPending && variables?.connector === c ? ' · opening…' : ''}</span><Icon name="arrow" size={18}/>
        </button>)}
      </div>
      <p className="small muted">On your phone, open this page in your wallet’s browser. Your wallet never shares its private key.</p>
    </>}
    <p className="inline-error" role="status">{error}</p>
  </Modal>;
}
