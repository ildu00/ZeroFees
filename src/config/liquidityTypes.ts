// Liquidity type configuration per chain
// Defines how each DEX handles liquidity provisioning

export type LiquidityModel = 'tick-based' | 'bin-based' | 'simple-lp';

export interface TickBasedConfig {
  model: 'tick-based';
  dexName: string;
  feeTiers: { value: number; label: string; description: string }[];
  tickSpacing: Record<number, number>;
  defaultFeeTier: number;
  defaultRangePercent: number;
  rangeOptions: number[];
}

export interface BinBasedConfig {
  model: 'bin-based';
  dexName: string;
  binSteps: { value: number; label: string; description: string }[];
  defaultBinStep: number;
  defaultBinRange: number; // number of bins around active bin
  binRangeOptions: number[];
  shapes: { value: string; label: string; description: string }[];
  defaultShape: string;
}

export interface SimpleLpConfig {
  model: 'simple-lp';
  dexName: string;
  description: string;
}

export type LiquidityConfig = TickBasedConfig | BinBasedConfig | SimpleLpConfig;

// Uniswap V3 / PancakeSwap V3 / SunSwap V3 tick-based config
const TICK_BASED_CONFIG: TickBasedConfig = {
  model: 'tick-based',
  dexName: 'Uniswap V3',
  feeTiers: [
    { value: 100, label: '0.01%', description: 'Best for stable pairs' },
    { value: 500, label: '0.05%', description: 'Best for stable pairs' },
    { value: 3000, label: '0.3%', description: 'Best for most pairs' },
    { value: 10000, label: '1%', description: 'Best for exotic pairs' },
  ],
  tickSpacing: { 100: 1, 500: 10, 3000: 60, 10000: 200 },
  defaultFeeTier: 3000,
  defaultRangePercent: 30,
  rangeOptions: [10, 20, 30, 50],
};

// Trader Joe Liquidity Book V2.1 bin-based config
const BIN_BASED_CONFIG: BinBasedConfig = {
  model: 'bin-based',
  dexName: 'Trader Joe',
  binSteps: [
    { value: 1, label: '1 bp', description: 'Ultra-tight (stable pairs)' },
    { value: 5, label: '5 bp', description: 'Tight range pairs' },
    { value: 10, label: '10 bp', description: 'Standard pairs' },
    { value: 15, label: '15 bp', description: 'Medium volatility' },
    { value: 20, label: '20 bp', description: 'High volatility' },
    { value: 25, label: '25 bp', description: 'Very high volatility' },
  ],
  defaultBinStep: 15,
  defaultBinRange: 10,
  binRangeOptions: [5, 10, 20, 50],
  shapes: [
    { value: 'uniform', label: 'Uniform', description: 'Equal distribution across all bins' },
    { value: 'curve', label: 'Curve', description: 'Concentrated around active price' },
    { value: 'bid-ask', label: 'Bid-Ask', description: 'Heavier on edges for range trading' },
  ],
  defaultShape: 'uniform',
};

// Flamingo simple LP config
const SIMPLE_LP_CONFIG: SimpleLpConfig = {
  model: 'simple-lp',
  dexName: 'Flamingo',
  description: 'Provide liquidity to earn swap fees. Tokens are deposited in equal value.',
};

// SunSwap V3 (TRON) uses tick-based like Uniswap V3
const SUNSWAP_TICK_CONFIG: TickBasedConfig = {
  ...TICK_BASED_CONFIG,
  dexName: 'SunSwap V3',
};

// PancakeSwap V3 (BSC) uses tick-based
const PANCAKESWAP_TICK_CONFIG: TickBasedConfig = {
  ...TICK_BASED_CONFIG,
  dexName: 'PancakeSwap V3',
  feeTiers: [
    { value: 100, label: '0.01%', description: 'Best for stable pairs' },
    { value: 500, label: '0.05%', description: 'Best for stable pairs' },
    { value: 2500, label: '0.25%', description: 'Best for most pairs' },
    { value: 10000, label: '1%', description: 'Best for exotic pairs' },
  ],
  tickSpacing: { 100: 1, 500: 10, 2500: 50, 10000: 200 },
  defaultFeeTier: 2500,
};

// Chain → Liquidity config mapping
export const LIQUIDITY_CONFIGS: Record<string, LiquidityConfig> = {
  base: { ...TICK_BASED_CONFIG, dexName: 'Uniswap V3' },
  ethereum: { ...TICK_BASED_CONFIG, dexName: 'Uniswap V3' },
  arbitrum: { ...TICK_BASED_CONFIG, dexName: 'Uniswap V3' },
  polygon: { ...TICK_BASED_CONFIG, dexName: 'Uniswap V3' },
  optimism: { ...TICK_BASED_CONFIG, dexName: 'Uniswap V3' },
  bsc: PANCAKESWAP_TICK_CONFIG,
  avalanche: BIN_BASED_CONFIG,
  tron: SUNSWAP_TICK_CONFIG,
  neo: SIMPLE_LP_CONFIG,
};

export const getLiquidityConfig = (chainId: string): LiquidityConfig => {
  return LIQUIDITY_CONFIGS[chainId] || TICK_BASED_CONFIG;
};

export const isTickBased = (config: LiquidityConfig): config is TickBasedConfig => config.model === 'tick-based';
export const isBinBased = (config: LiquidityConfig): config is BinBasedConfig => config.model === 'bin-based';
export const isSimpleLp = (config: LiquidityConfig): config is SimpleLpConfig => config.model === 'simple-lp';
