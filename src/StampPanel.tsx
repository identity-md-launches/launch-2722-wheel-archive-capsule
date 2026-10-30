import { useRef, useState } from 'react';
import { WagmiProvider, useConnection, useDisconnect, useSwitchChain, useSendTransaction } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { stringToHex } from 'viem';
import { TX_EXPLORER, type Capsule } from '../public/archive-core.js';
import { walletConfig, archiveChain } from './wallet';
import { WalletSheet } from './WalletSheet';
import { Modal } from './Modal';
import { Icon } from './Icons';
export default function StampPanel(props: { capsule: Capsule; onClose: () => void }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return <WagmiProvider config={walletConfig} reconnectOnMount={false}><QueryClientProvider client={client}><StampDialog {...props}/></QueryClientProvider></WagmiProvider>;
}
function StampDialog({ capsule, onClose }: { capsule: Capsule; onClose: () => void }) {
  const { address, isConnected, chainId } = useConnection(), { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const { sendTransactionAsync, isPending } = useSendTransaction();
  const [error, setError] = useState(''), [hash, setHash] = useState('');
  const pending = useRef(false);
  const send = async () => {
    if (pending.current || !isConnected || !address || chainId !== archiveChain.id) return;
    pending.current = true; setError('');
    try {
      const result = await sendTransactionAsync({ account: address, to: address, value: 0n, data: stringToHex(`wheel-archive:${capsule.round}`), chainId: archiveChain.id });
      setHash(result);
    } catch (e) { setError(/reject|denied/i.test(String(e)) ? 'Stamp declined. Nothing was submitted by this request.' : 'The wallet did not return a transaction hash. Check its activity before trying again.'); }
    finally { pending.current = false; }
  };
  return <Modal title={`Stamp round ${capsule.round}`} onClose={onClose} className="stamp-modal"><p className="stamp-explanation">Stamp sends a 0 ETH transaction to your own address on Sepolia carrying “wheel-archive:{capsule.round}” as data; test ETH pays the network gas.</p>
    {hash ? <div className="stamp-success" role="status"><Icon name="check" size={28}/><h3>Stamp submitted</h3><p className="muted">Your wallet returned this hash; confirmation is shown on the explorer.</p><a className="transaction-detail" target="_blank" rel="noopener noreferrer" href={`${TX_EXPLORER}${hash}`}><code>{hash}</code><span>View stamp on Sepolia<Icon name="diagonal" size={16}/></span></a><p className="small muted">Copy the hash to keep it. This page does not save receipts.</p></div>
    : !isConnected || !address ? <WalletSheet/> : <><div className="connected-address"><span className="small muted">Stamping from and to</span><code>{address}</code><button className="text-button small" onClick={() => disconnect()}>Disconnect</button></div>
      {chainId !== archiveChain.id ? <button className="button primary full" disabled={switching} onClick={async () => { setError(''); try { await switchChainAsync({ chainId: archiveChain.id }); } catch { setError('Network change declined. Switch your wallet to Sepolia and try again.'); } }}>{switching ? 'Switching…' : 'Switch to Sepolia'}</button> : <button className="button primary full" disabled={isPending} onClick={() => void send()}><Icon name="stamp" size={18}/>{isPending ? 'Waiting for your wallet…' : 'Send zero-value stamp'}</button>}
      <p className="small muted stamp-note">No contract or approval. The wallet shows the transaction before you confirm.</p></>}
    <p className="inline-error" role="status">{error}</p>
  </Modal>;
}
