import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { base, mainnet } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';

// WalletConnect Project ID (public identifier)
const projectId = '4a8f1f90250caf4cf14abd6c1d0fe873';

// Define networks
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [base, mainnet];

// Metadata for the app
const metadata = {
  name: 'ZeroFees',
  description: 'Zero-fee decentralized exchange on Base',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://zerofees.online',
  icons: ['https://zerofees.online/favicon.ico']
};

// Create ethers adapter
const ethersAdapter = new EthersAdapter();

// Create the AppKit instance
export const appkit = createAppKit({
  adapters: [ethersAdapter],
  networks,
  metadata,
  projectId,
  features: {
    analytics: false,
    email: false,
    socials: false
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#0052FF',
    '--w3m-border-radius-master': '2px'
  }
});

export { networks, projectId };
