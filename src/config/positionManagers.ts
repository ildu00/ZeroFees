// Position Manager configuration per chain
// Maps chain IDs to their NFT-based position manager contracts (Uniswap V3 / PancakeSwap V3 compatible)

export interface PositionManagerConfig {
  address: string;
  type: 'uniswap-v3' | 'pancakeswap-v3';
  dexName: string;
}

// EVM chains with Uniswap V3 / PancakeSwap V3 compatible position managers
export const POSITION_MANAGERS: Record<string, PositionManagerConfig> = {
  base: {
    address: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1',
    type: 'uniswap-v3',
    dexName: 'Uniswap V3',
  },
  ethereum: {
    address: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    type: 'uniswap-v3',
    dexName: 'Uniswap V3',
  },
  arbitrum: {
    address: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    type: 'uniswap-v3',
    dexName: 'Uniswap V3',
  },
  polygon: {
    address: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    type: 'uniswap-v3',
    dexName: 'Uniswap V3',
  },
  optimism: {
    address: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    type: 'uniswap-v3',
    dexName: 'Uniswap V3',
  },
  bsc: {
    address: '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364',
    type: 'pancakeswap-v3',
    dexName: 'PancakeSwap V3',
  },
};

// Chains that don't use NFT-based position tracking
export interface UnsupportedChainInfo {
  dexName: string;
  dexUrl: string;
  reason: string;
}

export const UNSUPPORTED_POSITION_CHAINS: Record<string, UnsupportedChainInfo> = {
  avalanche: {
    dexName: 'Trader Joe',
    dexUrl: 'https://traderjoexyz.com/avalanche/pool',
    reason: 'Trader Joe uses Liquidity Book positions which are managed on their platform',
  },
  tron: {
    dexName: 'SunSwap',
    dexUrl: 'https://sun.io/#/v3',
    reason: 'SunSwap V3 positions are managed through TronLink on their platform',
  },
  neo: {
    dexName: 'Flamingo',
    dexUrl: 'https://flamingo.finance/earn',
    reason: 'Flamingo uses LP token-based positions managed on their platform',
  },
};

export const getPositionManager = (chainId: string): PositionManagerConfig | undefined => {
  return POSITION_MANAGERS[chainId];
};

export const getUnsupportedChainInfo = (chainId: string): UnsupportedChainInfo | undefined => {
  return UNSUPPORTED_POSITION_CHAINS[chainId];
};

export const isPositionChainSupported = (chainId: string): boolean => {
  return chainId in POSITION_MANAGERS;
};
