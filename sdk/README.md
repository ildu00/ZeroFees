# @zerofees/sdk

TypeScript SDK for the **ZeroFees** multi-chain DEX aggregator.

Wraps all ZeroFees Edge Functions with a typed, ergonomic API — swap quotes, token prices, liquidity pools, positions, and transaction history across 9 blockchain networks.

## Installation

```bash
npm install @zerofees/sdk
# or
yarn add @zerofees/sdk
# or
pnpm add @zerofees/sdk
```

## Quick Start

```ts
import { ZeroFees } from '@zerofees/sdk';

const zf = new ZeroFees();

// Get a swap quote on Base (default chain)
const quote = await zf.getQuote({
  tokenIn: 'ETH',
  tokenOut: 'USDC',
  amountIn: '1000000000000000000', // 1 ETH in wei
});

console.log(quote.amountOut); // USDC amount in smallest unit
console.log(quote.route);     // "ETH -> USDC"
```

## Supported Chains

| Chain        | ID          | DEX          |
|-------------|-------------|-------------|
| Base         | `base`      | Uniswap V3   |
| Ethereum     | `ethereum`  | Uniswap V3   |
| Arbitrum     | `arbitrum`  | Uniswap V3   |
| Polygon      | `polygon`   | Uniswap V3   |
| Optimism     | `optimism`  | Uniswap V3   |
| BNB Chain    | `bsc`       | PancakeSwap  |
| Avalanche    | `avalanche` | Trader Joe   |
| TRON         | `tron`      | SunSwap      |
| NEO N3       | `neo`       | Flamingo     |

## API Reference

### `new ZeroFees(config?)`

Create a client instance.

```ts
const zf = new ZeroFees({
  // All options are optional — defaults point to production
  baseUrl: 'https://your-endpoint.supabase.co/functions/v1',
  anonKey: 'your-anon-key',
  fetch: customFetch, // e.g. node-fetch for Node 16
});
```

---

### `zf.getQuote(params): Promise<SwapQuoteResult>`

Get a swap quote. Automatically routes to the correct DEX based on chain.

```ts
const quote = await zf.getQuote({
  tokenIn: 'BNB',
  tokenOut: 'CAKE',
  amountIn: '1000000000000000000',
  chain: 'bsc', // → uses PancakeSwap
});
```

**Returns:**

| Field        | Type     | Description                          |
|-------------|----------|--------------------------------------|
| `amountOut`  | `string` | Output amount in smallest unit       |
| `fee`        | `number` | Fee in basis points (3000 = 0.3%)    |
| `route`      | `string` | Human-readable route                 |
| `decimalsOut`| `number` | Output token decimals                |
| `source`     | `string` | DEX source (e.g. `"pancakeswap-v2"`) |

---

### `zf.getPrices(params?): Promise<PricesResult>`

Fetch current USD prices for all tokens on a chain.

```ts
const { prices, tokens } = await zf.getPrices({ chain: 'avalanche' });
console.log(prices.AVAX);  // e.g. 30.5
console.log(tokens.AVAX);  // "0x0000..."
```

---

### `zf.getTokenPrice(params): Promise<TokenPriceResult>`

Get the price of one token denominated in another.

```ts
const { price, price0Usd, price1Usd } = await zf.getTokenPrice({
  token0: 'ETH',
  token1: 'USDC',
});
// price = how many USDC per 1 ETH
```

---

### `zf.getPools(params?): Promise<PoolsResult>`

List top liquidity pools sorted by TVL.

```ts
const { pools } = await zf.getPools({ chain: 'base' });
pools.forEach(p => {
  console.log(`${p.token0.symbol}/${p.token1.symbol} — TVL: $${p.tvl.toLocaleString()}`);
});
```

---

### `zf.getPositions(params): Promise<PositionsResult>`

Fetch on-chain liquidity positions for a wallet.

```ts
const { positions } = await zf.getPositions({
  chain: 'avalanche',
  address: '0xYourWallet...',
});
```

> Currently supports `avalanche` (Trader Joe) and `neo` (Flamingo).

---

### `zf.getTransactions(params): Promise<TransactionsResult>`

Fetch recent swap transactions for a wallet.

```ts
const { transactions } = await zf.getTransactions({
  chain: 'ethereum',
  address: '0xYourWallet...',
});
```

Returns up to 10 most recent swaps with token symbols and amounts.

---

## Error Handling

All methods throw `ZeroFeesError` on HTTP errors:

```ts
import { ZeroFees, ZeroFeesError } from '@zerofees/sdk';

try {
  const quote = await zf.getQuote({ ... });
} catch (err) {
  if (err instanceof ZeroFeesError) {
    console.error(`API error ${err.status}: ${err.message}`);
  }
}
```

## Browser & Node.js

The SDK works in both environments. For Node.js 16 (without native `fetch`), pass a polyfill:

```ts
import fetch from 'node-fetch';

const zf = new ZeroFees({ fetch: fetch as any });
```

Node.js 18+ and all modern browsers have native `fetch` support.

## License

MIT
