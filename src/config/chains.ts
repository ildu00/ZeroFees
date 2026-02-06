// Chain Types
export type ChainType = 'evm' | 'tron' | 'neo';

export interface ChainConfig {
  id: string;
  name: string;
  shortName: string;
  type: ChainType;
  chainId: number | string;
  icon: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  blockExplorer: string;
  color: string;
  // DEX configuration
  dex: {
    name: string;
    routerAddress?: string;
    factoryAddress?: string;
  };
  // Wallet requirements
  walletType: 'walletconnect' | 'tronlink' | 'neon';
  isTestnet?: boolean;
}

// EVM Chains
export const CHAINS: Record<string, ChainConfig> = {
  // Base (current default)
  base: {
    id: 'base',
    name: 'Base',
    shortName: 'Base',
    type: 'evm',
    chainId: 8453,
    icon: '🔵',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    color: '#0052FF',
    dex: {
      name: 'Uniswap V3',
      routerAddress: '0x2626664c2603336E57B271c5C0b26F421741e481',
      factoryAddress: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
    },
    walletType: 'walletconnect',
  },

  // Ethereum Mainnet
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    shortName: 'ETH',
    type: 'evm',
    chainId: 1,
    icon: '⟠',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    color: '#627EEA',
    dex: {
      name: 'Uniswap V3',
      routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    },
    walletType: 'walletconnect',
  },

  // Arbitrum
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    shortName: 'ARB',
    type: 'evm',
    chainId: 42161,
    icon: '🔷',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    color: '#28A0F0',
    dex: {
      name: 'Uniswap V3',
      routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    },
    walletType: 'walletconnect',
  },

  // Polygon
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    shortName: 'MATIC',
    type: 'evm',
    chainId: 137,
    icon: '💜',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    color: '#8247E5',
    dex: {
      name: 'Uniswap V3',
      routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    },
    walletType: 'walletconnect',
  },

  // Optimism
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    shortName: 'OP',
    type: 'evm',
    chainId: 10,
    icon: '🔴',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    color: '#FF0420',
    dex: {
      name: 'Uniswap V3',
      routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    },
    walletType: 'walletconnect',
  },

  // BNB Chain
  bsc: {
    id: 'bsc',
    name: 'BNB Smart Chain',
    shortName: 'BSC',
    type: 'evm',
    chainId: 56,
    icon: '🟡',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    color: '#F3BA2F',
    dex: {
      name: 'PancakeSwap',
      routerAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
      factoryAddress: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    },
    walletType: 'walletconnect',
  },

  // Avalanche
  avalanche: {
    id: 'avalanche',
    name: 'Avalanche',
    shortName: 'AVAX',
    type: 'evm',
    chainId: 43114,
    icon: '🔺',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    color: '#E84142',
    dex: {
      name: 'Trader Joe',
      routerAddress: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4',
      factoryAddress: '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10',
    },
    walletType: 'walletconnect',
  },

  // TRON
  tron: {
    id: 'tron',
    name: 'TRON',
    shortName: 'TRX',
    type: 'tron',
    chainId: 'tron-mainnet',
    icon: '♦️',
    nativeCurrency: { name: 'TRON', symbol: 'TRX', decimals: 6 },
    rpcUrl: 'https://api.trongrid.io',
    blockExplorer: 'https://tronscan.org',
    color: '#FF0013',
    dex: {
      name: 'SunSwap',
      routerAddress: 'TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax',
    },
    walletType: 'tronlink',
  },

  // NEO
  neo: {
    id: 'neo',
    name: 'NEO N3',
    shortName: 'NEO',
    type: 'neo',
    chainId: 'neo-mainnet',
    icon: '💚',
    nativeCurrency: { name: 'NEO', symbol: 'NEO', decimals: 0 },
    rpcUrl: 'https://mainnet1.neo.coz.io:443',
    blockExplorer: 'https://explorer.onegate.space',
    color: '#00E599',
    dex: {
      name: 'Flamingo',
    },
    walletType: 'neon',
  },
};

// Chain groups for UI
export const CHAIN_GROUPS = {
  evm: {
    label: 'EVM Networks',
    chains: ['base', 'ethereum', 'arbitrum', 'polygon', 'optimism', 'bsc', 'avalanche'],
  },
  tron: {
    label: 'TRON Network',
    chains: ['tron'],
  },
  neo: {
    label: 'NEO Network',
    chains: ['neo'],
  },
};

// Helper functions
export const getChainById = (id: string): ChainConfig | undefined => CHAINS[id];

export const getChainByChainId = (chainId: number | string): ChainConfig | undefined => {
  return Object.values(CHAINS).find((chain) => chain.chainId === chainId);
};

export const getEvmChains = (): ChainConfig[] => {
  return Object.values(CHAINS).filter((chain) => chain.type === 'evm');
};

export const getAllChains = (): ChainConfig[] => {
  return Object.values(CHAINS);
};

export const getChainHexId = (chain: ChainConfig): string | null => {
  if (chain.type !== 'evm' || typeof chain.chainId !== 'number') return null;
  return `0x${chain.chainId.toString(16)}`;
};

// Default chain
export const DEFAULT_CHAIN = CHAINS.base;
