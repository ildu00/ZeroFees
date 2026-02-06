import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token config type
type TokenInfo = { address: string; decimals: number; coingeckoId?: string };

// ── Base tokens ──────────────────────────────────────────────────────
const BASE_TOKENS: Record<string, TokenInfo> = {
  ETH: { address: "0x0000000000000000000000000000000000000000", decimals: 18, coingeckoId: "ethereum" },
  WETH: { address: "0x4200000000000000000000000000000000000006", decimals: 18, coingeckoId: "ethereum" },
  USDC: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, coingeckoId: "usd-coin" },
  USDbC: { address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", decimals: 6 },
  DAI: { address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18, coingeckoId: "dai" },
  USDT: { address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", decimals: 6, coingeckoId: "tether" },
  crvUSD: { address: "0x417Ac0e078398C154EdFadD9Ef675d30Be60Af93", decimals: 18, coingeckoId: "crvusd" },
  EURC: { address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42", decimals: 6, coingeckoId: "euro-coin" },
  cbETH: { address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22", decimals: 18, coingeckoId: "coinbase-wrapped-staked-eth" },
  wstETH: { address: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452", decimals: 18, coingeckoId: "wrapped-steth" },
  rETH: { address: "0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c", decimals: 18, coingeckoId: "rocket-pool-eth" },
  ezETH: { address: "0x2416092f143378750bb29b79eD961ab195CcEea5", decimals: 18, coingeckoId: "renzo-restaked-eth" },
  weETH: { address: "0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A", decimals: 18, coingeckoId: "wrapped-eeth" },
  AERO: { address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", decimals: 18, coingeckoId: "aerodrome-finance" },
  WELL: { address: "0xA88594D404727625A9437C3f886C7643872296AE", decimals: 18, coingeckoId: "moonwell-artemis" },
  MORPHO: { address: "0xBAa5CC21fd487B8Fcc2F632f3F4E8D37262a0842", decimals: 18, coingeckoId: "morpho" },
  SEAM: { address: "0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85", decimals: 18, coingeckoId: "seamless-protocol" },
  EXTRA: { address: "0x2dAD3a13ef0C6366220f989157009e501e7938F8", decimals: 18, coingeckoId: "extra-finance" },
  BSWAP: { address: "0x78a087d713Be963Bf307b18F2Ff8122EF9A63ae9", decimals: 18, coingeckoId: "baseswap" },
  ALB: { address: "0x1dd2d631c92b1aCdFCDd51A0F7145A50130050C4", decimals: 18, coingeckoId: "alien-base" },
  BRETT: { address: "0x532f27101965dd16442E59d40670FaF5eBB142E4", decimals: 18, coingeckoId: "brett" },
  DEGEN: { address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", decimals: 18, coingeckoId: "degen-base" },
  TOSHI: { address: "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4", decimals: 18, coingeckoId: "toshi" },
  HIGHER: { address: "0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe", decimals: 18, coingeckoId: "higher" },
  NORMIE: { address: "0x7F12d13B34F5F4f0a9449c16Bcd42f0da47AF200", decimals: 9, coingeckoId: "normie-base" },
  MOCHI: { address: "0xF6e932Ca12afa26665dC4dDE7e27be02A7c02e50", decimals: 18, coingeckoId: "mochi-base" },
  KEYCAT: { address: "0x9a26F5433671751C3276a065f57e5a02D2817973", decimals: 18, coingeckoId: "keyboard-cat" },
  TYBG: { address: "0x0d97F261b1e88845184f678e2d1e7a98D9FD38dE", decimals: 18, coingeckoId: "base-god" },
  DOGINME: { address: "0x6921B130D297cc43754afba22e5EAc0FBf8Db75b", decimals: 18, coingeckoId: "doginme" },
  BENJI: { address: "0xBC45647eA894030a4E9801Ec03479739FA2485F0", decimals: 18, coingeckoId: "basenji" },
  MFER: { address: "0xE3086852A4B125803C815a158249ae468A3254Ca", decimals: 18, coingeckoId: "mfercoin" },
  BASED: { address: "0x32E0f9d26D1e33625742A52620cC76C1130efDE6", decimals: 18, coingeckoId: "based-markets" },
  BALD: { address: "0x27D2DECb4bFC9C76F0309b8E88dec3a601Fe25a8", decimals: 18, coingeckoId: "bald" },
  DINO: { address: "0x85E90a5430AF45776548ADB82eE4cD9E33B08077", decimals: 18, coingeckoId: "dino-base" },
  CHOMP: { address: "0x1a0B71A88d25dB40c8f59F24eB6424dD3D5e4aF9", decimals: 18, coingeckoId: "chomp" },
  SKI: { address: "0x768BE13e1680b5ebE0024C42c896E3dB59ec0149", decimals: 18, coingeckoId: "ski-mask-dog" },
  WEIRDO: { address: "0x76c02803c135b9aF79B9df597b83c2B37b3e74fc", decimals: 18, coingeckoId: "weirdo" },
  VIRTUAL: { address: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b", decimals: 18, coingeckoId: "virtual-protocol" },
  FRIEND: { address: "0x0BD4887f7D41B35CD75DFF9FfEE2856106f86670", decimals: 18, coingeckoId: "friend-tech" },
  SNX: { address: "0x22e6966B799c4D5B13BE962E1D117b56327FDa66", decimals: 18, coingeckoId: "havven" },
  COMP: { address: "0x9e1028F5F1D5eDE59748FFceE5532509976840E0", decimals: 18, coingeckoId: "compound-governance-token" },
  YFI: { address: "0x9EaF8C1E34F05a589EDa6BAfdF391Cf6Ad3CB239", decimals: 18, coingeckoId: "yearn-finance" },
  UNI: { address: "0xc3De830EA07524a0761646a6a4e4be0e114a3C83", decimals: 18, coingeckoId: "uniswap" },
  LINK: { address: "0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196", decimals: 18, coingeckoId: "chainlink" },
  CRV: { address: "0x8Ee73c484A26e0A5df2Ee2a4960B789967dd0415", decimals: 18, coingeckoId: "curve-dao-token" },
  BAL: { address: "0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2", decimals: 18, coingeckoId: "balancer" },
  LDO: { address: "0xfA980cEd6895AC314E7dE34Ef1bFAE90a5AdD21b", decimals: 18, coingeckoId: "lido-dao" },
  PENDLE: { address: "0xBC5B59EA1b6f8Da8258615EE38D40e999EC5D74F", decimals: 18, coingeckoId: "pendle" },
};

// ── Ethereum Mainnet tokens ──────────────────────────────────────────
const ETHEREUM_TOKENS: Record<string, TokenInfo> = {
  ETH: { address: "0x0000000000000000000000000000000000000000", decimals: 18, coingeckoId: "ethereum" },
  WETH: { address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18, coingeckoId: "ethereum" },
  USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, coingeckoId: "usd-coin" },
  USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, coingeckoId: "tether" },
  DAI: { address: "0x6B175474E89094C44Da98b954EescdCF505fBAE0D", decimals: 18, coingeckoId: "dai" },
  WBTC: { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8, coingeckoId: "wrapped-bitcoin" },
  UNI: { address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", decimals: 18, coingeckoId: "uniswap" },
  LINK: { address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals: 18, coingeckoId: "chainlink" },
  AAVE: { address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", decimals: 18, coingeckoId: "aave" },
  MKR: { address: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2", decimals: 18, coingeckoId: "maker" },
};

// ── Arbitrum tokens ──────────────────────────────────────────────────
const ARBITRUM_TOKENS: Record<string, TokenInfo> = {
  ETH: { address: "0x0000000000000000000000000000000000000000", decimals: 18, coingeckoId: "ethereum" },
  WETH: { address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18, coingeckoId: "ethereum" },
  USDC: { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6, coingeckoId: "usd-coin" },
  USDT: { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6, coingeckoId: "tether" },
  ARB: { address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18, coingeckoId: "arbitrum" },
  GMX: { address: "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a", decimals: 18, coingeckoId: "gmx" },
  MAGIC: { address: "0x539bdE0d7Dbd336b79148AA742883198BBF60342", decimals: 18, coingeckoId: "magic" },
};

// ── Polygon tokens ───────────────────────────────────────────────────
const POLYGON_TOKENS: Record<string, TokenInfo> = {
  MATIC: { address: "0x0000000000000000000000000000000000000000", decimals: 18, coingeckoId: "matic-network" },
  WMATIC: { address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", decimals: 18, coingeckoId: "matic-network" },
  USDC: { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6, coingeckoId: "usd-coin" },
  USDT: { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6, coingeckoId: "tether" },
  WETH: { address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", decimals: 18, coingeckoId: "ethereum" },
  WBTC: { address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", decimals: 8, coingeckoId: "wrapped-bitcoin" },
};

// ── Optimism tokens ──────────────────────────────────────────────────
const OPTIMISM_TOKENS: Record<string, TokenInfo> = {
  ETH: { address: "0x0000000000000000000000000000000000000000", decimals: 18, coingeckoId: "ethereum" },
  WETH: { address: "0x4200000000000000000000000000000000000006", decimals: 18, coingeckoId: "ethereum" },
  USDC: { address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", decimals: 6, coingeckoId: "usd-coin" },
  USDT: { address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", decimals: 6, coingeckoId: "tether" },
  OP: { address: "0x4200000000000000000000000000000000000042", decimals: 18, coingeckoId: "optimism" },
  SNX: { address: "0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4", decimals: 18, coingeckoId: "havven" },
};

// ── Chain → token config map ─────────────────────────────────────────
const CHAIN_TOKEN_CONFIGS: Record<string, Record<string, TokenInfo>> = {
  base: BASE_TOKENS,
  ethereum: ETHEREUM_TOKENS,
  arbitrum: ARBITRUM_TOKENS,
  polygon: POLYGON_TOKENS,
  optimism: OPTIMISM_TOKENS,
};

// Collect ALL unique CoinGecko IDs across every chain
function getAllCoingeckoIds(): string[] {
  const ids = new Set<string>();
  for (const chainTokens of Object.values(CHAIN_TOKEN_CONFIGS)) {
    for (const config of Object.values(chainTokens)) {
      if (config.coingeckoId) ids.add(config.coingeckoId);
    }
  }
  return Array.from(ids);
}

// Default prices as fallback
const DEFAULT_PRICES: Record<string, number> = {
  ethereum: 2500,
  "usd-coin": 1,
  dai: 1,
  tether: 1,
  crvusd: 1,
  "euro-coin": 1.1,
  "coinbase-wrapped-staked-eth": 2700,
  "wrapped-steth": 2700,
  "rocket-pool-eth": 2700,
  "renzo-restaked-eth": 2600,
  "wrapped-eeth": 2600,
  "aerodrome-finance": 0.5,
  "moonwell-artemis": 0.03,
  morpho: 1.5,
  "seamless-protocol": 0.02,
  "extra-finance": 0.1,
  baseswap: 0.01,
  "alien-base": 0.005,
  brett: 0.1,
  "degen-base": 0.01,
  toshi: 0.0001,
  higher: 0.02,
  "normie-base": 0.01,
  "mochi-base": 0.001,
  "keyboard-cat": 0.001,
  "base-god": 0.0001,
  doginme: 0.001,
  basenji: 0.01,
  mfercoin: 0.001,
  "based-markets": 0.01,
  bald: 0.001,
  "dino-base": 0.001,
  chomp: 0.001,
  "ski-mask-dog": 0.001,
  weirdo: 0.001,
  "virtual-protocol": 1.5,
  "friend-tech": 0.5,
  havven: 2,
  "compound-governance-token": 50,
  "yearn-finance": 7000,
  uniswap: 10,
  chainlink: 15,
  "curve-dao-token": 0.5,
  balancer: 3,
  "lido-dao": 1.5,
  pendle: 4,
  // New cross-chain tokens
  "wrapped-bitcoin": 40000,
  aave: 100,
  maker: 1500,
  arbitrum: 1.2,
  gmx: 30,
  magic: 0.5,
  optimism: 2,
  "matic-network": 0.8,
};

// Cached price data
let cachedPrices: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000; // 30 seconds

// Get token prices from CoinGecko (shared across all chains)
async function getTokenPrices(): Promise<Record<string, number>> {
  // Return cached if fresh
  if (cachedPrices && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedPrices;
  }

  const prices: Record<string, number> = {};

  try {
    const ids = getAllCoingeckoIds();
    const idsString = ids.join(",");
    console.log("Fetching prices for:", ids.length, "tokens");

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=usd`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) {
      console.error("CoinGecko API error:", response.status);
      throw new Error("CoinGecko API error");
    }

    const data = await response.json();
    console.log("CoinGecko response keys:", Object.keys(data).length);

    // Map coingeckoId → USD price
    for (const id of ids) {
      if (data[id]?.usd) {
        prices[id] = data[id].usd;
      } else if (DEFAULT_PRICES[id]) {
        prices[id] = DEFAULT_PRICES[id];
      }
    }

    cachedPrices = prices;
    cacheTimestamp = Date.now();
    return prices;
  } catch (error) {
    console.error("Error fetching prices:", error);
    // Fallback to defaults
    for (const id of getAllCoingeckoIds()) {
      prices[id] = DEFAULT_PRICES[id] || 0;
    }
    return prices;
  }
}

// Build symbol→price map for a specific chain
function buildChainPrices(
  rawPrices: Record<string, number>,
  tokenConfig: Record<string, TokenInfo>
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [symbol, config] of Object.entries(tokenConfig)) {
    if (config.coingeckoId && rawPrices[config.coingeckoId]) {
      result[symbol] = rawPrices[config.coingeckoId];
    } else if (symbol === "USDbC") {
      result[symbol] = 1;
    } else {
      result[symbol] = 0;
    }
  }
  return result;
}

// Calculate quote based on prices
function calculatePriceBasedQuote(
  tokenIn: string,
  tokenOut: string,
  amountInWei: string,
  tokenConfig: Record<string, TokenInfo>,
  symbolPrices: Record<string, number>
): string {
  const tokenInConfig = tokenConfig[tokenIn];
  const tokenOutConfig = tokenConfig[tokenOut];

  if (!tokenInConfig || !tokenOutConfig) throw new Error("Invalid token");

  const priceIn = symbolPrices[tokenIn] || 0;
  const priceOut = symbolPrices[tokenOut] || 0;

  if (priceIn === 0 || priceOut === 0) throw new Error("Price not available for token");

  const amountInHuman = Number(BigInt(amountInWei)) / Math.pow(10, tokenInConfig.decimals);
  const usdValue = amountInHuman * priceIn;
  const amountOutHuman = usdValue / priceOut;
  const amountOutWithFee = amountOutHuman * 0.997; // 0.3% fee
  const amountOutWei = BigInt(Math.floor(amountOutWithFee * Math.pow(10, tokenOutConfig.decimals)));

  console.log("Quote:", { tokenIn, tokenOut, amountInHuman, priceIn, priceOut, amountOutWithFee });

  return amountOutWei.toString();
}

// ── Handler ──────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, tokenIn, tokenOut, amountIn, chain = "base" } = await req.json();

    console.log("Request:", { action, chain, tokenIn, tokenOut, amountIn });

    const tokenConfig = CHAIN_TOKEN_CONFIGS[chain] || CHAIN_TOKEN_CONFIGS.base;

    if (action === "prices") {
      const rawPrices = await getTokenPrices();
      const symbolPrices = buildChainPrices(rawPrices, tokenConfig);
      const tokens: Record<string, string> = {};
      for (const [symbol, config] of Object.entries(tokenConfig)) {
        tokens[symbol] = config.address;
      }
      return new Response(JSON.stringify({ prices: symbolPrices, tokens, chain }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "quote") {
      if (!tokenIn || !tokenOut || !amountIn) throw new Error("Missing required parameters");

      const tokenInConfig = tokenConfig[tokenIn];
      const tokenOutConfig = tokenConfig[tokenOut];
      if (!tokenInConfig || !tokenOutConfig) throw new Error("Invalid token symbols for chain " + chain);

      const rawPrices = await getTokenPrices();
      const symbolPrices = buildChainPrices(rawPrices, tokenConfig);
      const amountOut = calculatePriceBasedQuote(tokenIn, tokenOut, amountIn, tokenConfig, symbolPrices);

      return new Response(
        JSON.stringify({
          amountOut,
          fee: 3000,
          route: `${tokenIn} -> ${tokenOut}`,
          decimalsOut: tokenOutConfig.decimals,
          chain,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
