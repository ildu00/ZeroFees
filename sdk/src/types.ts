// ─── Supported Chains ────────────────────────────────────────────────────────

export type Chain =
  | 'base'
  | 'ethereum'
  | 'arbitrum'
  | 'polygon'
  | 'optimism'
  | 'bsc'
  | 'avalanche'
  | 'tron'
  | 'neo';

// ─── Swap Quotes ─────────────────────────────────────────────────────────────

export interface SwapQuoteParams {
  /** Token symbol to sell (e.g. "ETH", "USDC") */
  tokenIn: string;
  /** Token symbol to buy */
  tokenOut: string;
  /** Amount in smallest unit (wei / sun / etc.) */
  amountIn: string;
  /** Chain id — defaults to "base" for Uniswap endpoint */
  chain?: Chain;
}

export interface SwapQuoteResult {
  /** Amount out in smallest unit */
  amountOut: string;
  /** Fee in basis points (3000 = 0.3%) */
  fee: number;
  /** Human-readable route (e.g. "ETH -> USDC") */
  route: string;
  /** Decimals of output token */
  decimalsOut: number;
  /** Chain that served the quote */
  chain?: string;
  /** Source DEX identifier */
  source?: string;
}

// ─── Prices ──────────────────────────────────────────────────────────────────

export interface PricesParams {
  chain?: Chain;
}

export interface PricesResult {
  /** Symbol → USD price */
  prices: Record<string, number>;
  /** Symbol → contract address */
  tokens: Record<string, string>;
  chain?: string;
}

// ─── Token Price ─────────────────────────────────────────────────────────────

export interface TokenPriceParams {
  /** Base token symbol */
  token0: string;
  /** Quote token symbol */
  token1: string;
}

export interface TokenPriceResult {
  /** Price of token0 in terms of token1 */
  price: number | null;
  /** token0 price in USD */
  price0Usd?: number;
  /** token1 price in USD */
  price1Usd?: number;
  error?: string;
}

// ─── Pools ───────────────────────────────────────────────────────────────────

export interface PoolsParams {
  chain?: Chain;
}

export interface PoolToken {
  symbol: string;
  icon: string;
}

export interface Pool {
  id: string;
  token0: PoolToken;
  token1: PoolToken;
  /** Total value locked (USD) */
  tvl: number;
  /** Annual percentage rate */
  apr: number;
  /** 24h volume (USD) */
  volume24h: number;
  /** 24h fees (USD) */
  fees24h: number;
  /** Fee tier as percentage (e.g. 0.3) */
  feeTier: number;
}

export interface PoolsResult {
  pools: Pool[];
  chain: string;
  error?: string;
}

// ─── Positions ───────────────────────────────────────────────────────────────

export interface PositionsParams {
  chain: 'avalanche' | 'neo';
  address: string;
}

export interface PositionToken {
  address: string;
  symbol: string;
  icon: string;
}

export interface Position {
  tokenId: string;
  token0: PositionToken;
  token1: PositionToken;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  tokensOwed0: string;
  tokensOwed1: string;
  inRange: boolean;
  dexName: string;
  chainType: string;
  pairAddress?: string;
  binStep?: number;
}

export interface PositionsResult {
  positions?: Position[];
  pools?: any[];
  error?: string;
}

// ─── Transactions ────────────────────────────────────────────────────────────

export interface TransactionsParams {
  chain: Chain;
  address: string;
}

export interface Transaction {
  id: string;
  hash: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  blockNumber: number;
}

export interface TransactionsResult {
  transactions: Transaction[];
  chain: string;
  error?: string;
}

// ─── Client Config ───────────────────────────────────────────────────────────

export interface ZeroFeesConfig {
  /**
   * Base URL of the Edge Functions endpoint.
   * Defaults to the ZeroFees production endpoint.
   */
  baseUrl?: string;
  /**
   * Supabase anon key for authorization.
   * Defaults to the ZeroFees public anon key.
   */
  anonKey?: string;
  /**
   * Custom fetch implementation (useful for Node 16 or test mocks).
   */
  fetch?: typeof globalThis.fetch;
}
