import { useState } from 'react';
import { useConnection, useSignMessage, useSwitchChain } from 'wagmi';
import { createPublicClient, getAddress, http, verifyMessage } from 'viem';
import { Icon } from './Icons';
import { WheelMark } from './Icons';
import type { Capsule } from './data';
import { capsuleNumber } from './data';
import { archiveChain } from './wallet';
import { downloadJson, type Stamp } from './storage';

export function StampPanel({ capsule, stamps, onStamp, onConnect }: { capsule: Capsule; stamps: Stamp[]; onStamp: (s: Stamp) => void; onConnect: () => void }) {
  const { address, isConnected, chainId } = useConnection();
  const { signMessageAsync, isPending } = useSignMessage();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const stamp = stamps.find(s => s.capsuleId === capsule.id && s.address.toLowerCase() === address?.toLowerCase());
  const busy = working || isPending || switching;
  const sign = async () => {
    if (!isConnected || !address) { onConnect(); return; }
    setError('');
    if (chainId !== archiveChain.id) {
      try { await switchChainAsync({ chainId: archiveChain.id }); } catch { setError('Switch declined. Select Base in your wallet, then try again.'); }
      return;
    }
    setWorking(true);
    const owner = getAddress(address);
    const createdAt = new Date().toISOString();
    const message = `Wheel Archive · Personal stamp\n\nCollection: Exhibition (sample settlements)\nCapsule: ${capsuleNumber(capsule.id)} · ${capsule.title}\nAddress: ${owner}\nChain: Base (${archiveChain.id})\nWebsite: ${location.origin}${location.pathname}\nCreated: ${createdAt}\n\nI leave this keepsake on my own address. This message authorizes no transaction, payment, token approval, or login. The stamp is stored in this browser only.`;
    try {
      const signature = await signMessageAsync({ message });
      let valid = await verifyMessage({ address: owner, message, signature }).catch(() => false);
      if (!valid) {
        const publicClient = createPublicClient({ chain: archiveChain, transport: http('https://mainnet.base.org', { timeout: 12000, retryCount: 0 }) });
        valid = await publicClient.verifyMessage({ address: owner, message, signature });
      }
      if (!valid) throw new Error('Signature verification failed');
      onStamp({ version: 1, collection: 'wheel-archive-exhibition', capsuleId: capsule.id, address: owner, chainId: archiveChain.id, createdAt, message, signature });
    } catch (e) {
      setError(/reject|denied/i.test(String(e)) ? 'Signature declined. Your address has not been stamped. Try again when you’re ready.' : 'The signature could not be verified. Check your wallet and connection, then try again.');
    } finally { setWorking(false); }
  };
  return <section className={`stamp-panel${stamp ? ' is-stamped' : ''}`} aria-labelledby="stamp-heading">
    <div className="stamp-panel-title"><WheelMark size={32}/><div><h3 id="stamp-heading">{stamp ? 'You were here.' : 'Leave your mark.'}</h3><p className="small muted">{stamp ? 'A little proof of a turn remembered.' : 'One capsule. Your address. A personal keepsake.'}</p></div></div>
    {stamp ? <>
      <div className="stamp-success"><Icon name="check"/><span>Signed by your address</span></div>
      <code className="full-address">{stamp.address}</code>
      <button className="button secondary full" onClick={() => downloadJson(stamp, `wheel-stamp-${capsule.id}.json`)}><Icon name="download" size={18}/>Download stamp receipt</button>
    </> : <>
      <p className="small">A free wallet signature, saved in this browser. It does not create an onchain record.</p>
      <button className="button primary full" disabled={busy} onClick={() => void sign()}><Icon name={chainId && chainId !== archiveChain.id ? 'wallet' : 'stamp'} size={18}/>{busy ? (switching ? 'Switching to Base…' : isPending ? 'Confirm in your wallet…' : 'Verifying signature…') : !isConnected ? 'Connect to leave a stamp' : chainId !== archiveChain.id ? 'Switch to Base' : 'Sign and leave a stamp'}</button>
      {isConnected && address && <p className="small muted address-hint">Signing as <code>{getAddress(address)}</code></p>}
    </>}
    <p className="inline-error" role="status">{error}</p>
  </section>;
}
