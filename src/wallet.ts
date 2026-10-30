import { createConfig, http } from 'wagmi';
import { coinbaseWallet, injected } from 'wagmi/connectors';
import { base } from 'wagmi/chains';

export const archiveChain = base;
export const walletConfig = createConfig({
  chains: [base],
  multiInjectedProviderDiscovery: true,
  connectors: [injected(), coinbaseWallet({ appName: 'Wheel Archive', preference: { options: 'all' } })],
  transports: { [base.id]: http('https://mainnet.base.org') },
});

export const OPEN_IN = [
  { id: 'metamask', name: 'MetaMask', href: (url: string) => `https://link.metamask.io/dapp/${url.replace(/^https?:\/\//, '')}` },
  { id: 'coinbase', name: 'Coinbase Wallet', href: (url: string) => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}` },
  { id: 'rabby', name: 'Rabby', href: (url: string) => `https://go.rabby.io/mobile/?_cmd=open-dapp&dapp=${encodeURIComponent(url)}` },
  { id: 'phantom', name: 'Phantom', href: (url: string) => `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(new URL(url).origin)}` },
];
export const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;
