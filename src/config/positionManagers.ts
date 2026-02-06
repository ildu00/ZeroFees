// Position Manager configuration per chain

export interface PositionManagerConfig {
  address: string;
  type: 'uniswap-v3' | 'pancakeswap-v3' | 'trader-joe-lb' | 'sunswap-v3' | 'flamingo';
  dexName: string;
}

// All chains with position support
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
  avalanche: {
    address: '0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30',
    type: 'trader-joe-lb',
    dexName: 'Trader Joe',
  },
  tron: {
    address: 'TLSWrv7eC1AZCXkRjpqMZUmvgd99cj7pPF',
    type: 'sunswap-v3',
    dexName: 'SunSwap V3',
  },
  neo: {
    address: '0xde3a4b093abbd07e9a69cdec88a54d9a1fe14975',
    type: 'flamingo',
    dexName: 'Flamingo',
  },
};

// No more unsupported chains - all have position support
export interface UnsupportedChainInfo {
  dexName: string;
  dexUrl: string;
  reason: string;
}

export const UNSUPPORTED_POSITION_CHAINS: Record<string, UnsupportedChainInfo> = {};

export const getPositionManager = (chainId: string): PositionManagerConfig | undefined => {
  return POSITION_MANAGERS[chainId];
};

export const getUnsupportedChainInfo = (chainId: string): UnsupportedChainInfo | undefined => {
  return UNSUPPORTED_POSITION_CHAINS[chainId];
};

export const isPositionChainSupported = (chainId: string): boolean => {
  return chainId in POSITION_MANAGERS;
};

// Check if the chain uses EVM-based NFT position manager (Uniswap V3 / PancakeSwap V3)
export const isEvmNftPositionChain = (chainId: string): boolean => {
  const manager = POSITION_MANAGERS[chainId];
  return manager?.type === 'uniswap-v3' || manager?.type === 'pancakeswap-v3';
};
