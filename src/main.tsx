import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource-variable/dm-sans/wght.css';
import '@fontsource/dm-mono/latin-400.css';
import { walletConfig } from './wallet';
import App from './App';
import './styles.css';

const client = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><WagmiProvider config={walletConfig}><QueryClientProvider client={client}><App/></QueryClientProvider></WagmiProvider></React.StrictMode>);
