import type {
  ZeroFeesConfig,
  Chain,
  SwapQuoteParams,
  SwapQuoteResult,
  PricesParams,
  PricesResult,
  TokenPriceParams,
  TokenPriceResult,
  PoolsParams,
  PoolsResult,
  PositionsParams,
  PositionsResult,
  TransactionsParams,
  TransactionsResult,
} from './types';

const DEFAULT_BASE_URL = 'https://hkvmvhrwwvpjiypqvjyv.supabase.co/functions/v1';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhrdm12aHJ3d3Zwaml5cHF2anl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDk5NzIsImV4cCI6MjA4MTcyNTk3Mn0.GKZADDylL4yTcP7okLgBds8alQcu17kCx1sV6zwuFsM';

/**
 * Chains that use specialised quote endpoints instead of the generic
 * `get-swap-quote` function.
 */
const CHAIN_QUOTE_ENDPOINT: Partial<Record<Chain, string>> = {
  bsc: 'get-pancakeswap-quote',
  avalanche: 'get-traderjoe-quote',
  tron: 'get-sunswap-quote',
  neo: 'get-neo-quote',
};

/**
 * ZeroFees SDK client.
 *
 * ```ts
 * import { ZeroFees } from '@zerofees/sdk';
 *
 * const zf = new ZeroFees();
 * const quote = await zf.getQuote({ tokenIn: 'ETH', tokenOut: 'USDC', amountIn: '1000000000000000000' });
 * console.log(quote.amountOut);
 * ```
 */
export class ZeroFees {
  private readonly baseUrl: string;
  private readonly anonKey: string;
  private readonly _fetch: typeof globalThis.fetch;

  constructor(config: ZeroFeesConfig = {}) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.anonKey = config.anonKey ?? DEFAULT_ANON_KEY;
    this._fetch = config.fetch ?? globalThis.fetch.bind(globalThis);
  }

  // ── Internal helpers ────────────────────────────────────────────────

  private async post<T>(fn: string, body: Record<string, unknown>): Promise<T> {
    const res = await this._fetch(`${this.baseUrl}/${fn}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.anonKey}`,
        apikey: this.anonKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new ZeroFeesError(`${fn} returned ${res.status}: ${text}`, res.status);
    }

    return res.json() as Promise<T>;
  }

  // ── Swap Quotes ─────────────────────────────────────────────────────

  /**
   * Get a swap quote for the given token pair and amount.
   *
   * Automatically routes to the correct DEX endpoint based on the chain:
   * - Base / Ethereum / Arbitrum / Polygon / Optimism → Uniswap V3
   * - BSC → PancakeSwap
   * - Avalanche → Trader Joe
   * - TRON → SunSwap
   * - NEO → Flamingo
   */
  async getQuote(params: SwapQuoteParams): Promise<SwapQuoteResult> {
    const chain: Chain = params.chain ?? 'base';
    const endpoint = CHAIN_QUOTE_ENDPOINT[chain] ?? 'get-swap-quote';

    return this.post<SwapQuoteResult>(endpoint, {
      action: 'quote',
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      amountIn: params.amountIn,
      ...(endpoint === 'get-swap-quote' ? { chain } : {}),
    });
  }

  // ── Prices ──────────────────────────────────────────────────────────

  /**
   * Fetch current USD prices for all tokens on a given chain.
   *
   * For BSC, Avalanche, TRON, and NEO the specialised endpoint is used;
   * for EVM L2s the generic endpoint accepts a `chain` parameter.
   */
  async getPrices(params: PricesParams = {}): Promise<PricesResult> {
    const chain: Chain = params.chain ?? 'base';
    const endpoint = CHAIN_QUOTE_ENDPOINT[chain] ?? 'get-swap-quote';

    return this.post<PricesResult>(endpoint, {
      action: 'prices',
      ...(endpoint === 'get-swap-quote' ? { chain } : {}),
    });
  }

  // ── Token Price ─────────────────────────────────────────────────────

  /**
   * Get the price of `token0` denominated in `token1` (plus both USD prices).
   */
  async getTokenPrice(params: TokenPriceParams): Promise<TokenPriceResult> {
    return this.post<TokenPriceResult>('get-token-price', {
      token0: params.token0,
      token1: params.token1,
    });
  }

  // ── Pools ───────────────────────────────────────────────────────────

  /**
   * List liquidity pools for a given chain.
   *
   * Returns up to 20 pools sorted by TVL, sourced from
   * GeckoTerminal → DeFiLlama (fallback) → Flamingo API (NEO).
   */
  async getPools(params: PoolsParams = {}): Promise<PoolsResult> {
    const chain: Chain = params.chain ?? 'base';
    return this.post<PoolsResult>('get-uniswap-pools', { chain });
  }

  // ── Positions ───────────────────────────────────────────────────────

  /**
   * Fetch on-chain liquidity positions for a wallet address.
   *
   * Currently supports:
   * - `avalanche` — Trader Joe V2 subgraph + Barn API
   * - `neo` — Flamingo pool info
   */
  async getPositions(params: PositionsParams): Promise<PositionsResult> {
    return this.post<PositionsResult>('get-chain-positions', {
      chain: params.chain,
      address: params.address,
    });
  }

  // ── Transactions ────────────────────────────────────────────────────

  /**
   * Fetch recent swap transactions for a wallet address on any supported chain.
   *
   * Returns up to 10 most recent swaps.
   */
  async getTransactions(params: TransactionsParams): Promise<TransactionsResult> {
    return this.post<TransactionsResult>('get-wallet-transactions', {
      chain: params.chain,
      address: params.address,
    });
  }
}

// ── Error class ──────────────────────────────────────────────────────────────

export class ZeroFeesError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ZeroFeesError';
  }
}
