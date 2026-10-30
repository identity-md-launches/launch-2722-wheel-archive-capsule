// This module is imported only by the user-opened stamp dialog.
import { createConfig, http } from 'wagmi';
import { coinbaseWallet, injected } from 'wagmi/connectors';
import { sepolia } from 'wagmi/chains';
export const archiveChain = sepolia;
export const walletConfig = createConfig({
  chains: [sepolia], storage: null, multiInjectedProviderDiscovery: true,
  connectors: [injected(), coinbaseWallet({ appName: 'Wheel Archive', preference: { options: 'all' } })],
  transports: { [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com') },
});
export const OPEN_IN = [
  { id: 'metamask', name: 'MetaMask', href: (url: string) => `https://link.metamask.io/dapp/${url.replace(/^https?:\/\//, '')}` },
  { id: 'coinbase', name: 'Coinbase Wallet', href: (url: string) => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}` },
  { id: 'rabby', name: 'Rabby', href: (url: string) => `https://go.rabby.io/mobile/?_cmd=open-dapp&dapp=${encodeURIComponent(url)}` },
  { id: 'phantom', name: 'Phantom', href: (url: string) => `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(new URL(url).origin)}` },
];
