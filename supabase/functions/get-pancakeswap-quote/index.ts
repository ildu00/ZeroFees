import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// BNB Chain token config with decimals and CoinGecko IDs
const TOKEN_CONFIG: Record<string, { address: string; decimals: number; coingeckoId?: string }> = {
  BNB:   { address: "0x0000000000000000000000000000000000000000", decimals: 18, coingeckoId: "binancecoin" },
  WBNB:  { address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", decimals: 18, coingeckoId: "binancecoin" },
  USDT:  { address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18, coingeckoId: "tether" },
  USDC:  { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18, coingeckoId: "usd-coin" },
  BUSD:  { address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", decimals: 18, coingeckoId: "binance-usd" },
  CAKE:  { address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", decimals: 18, coingeckoId: "pancakeswap-token" },
  ETH:   { address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", decimals: 18, coingeckoId: "ethereum" },
  BTCB:  { address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", decimals: 18, coingeckoId: "binance-bitcoin" },
  XRP:   { address: "0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE", decimals: 18, coingeckoId: "ripple" },
  ADA:   { address: "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47", decimals: 18, coingeckoId: "cardano" },
  DOT:   { address: "0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402", decimals: 18, coingeckoId: "polkadot" },
  LINK:  { address: "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD", decimals: 18, coingeckoId: "chainlink" },
  UNI:   { address: "0xBf5140A22578168FD562DCcF235E5D43A02ce9B1", decimals: 18, coingeckoId: "uniswap" },
  DOGE:  { address: "0xbA2aE424d960c26247Dd6c32edC70B295c744C43", decimals: 8,  coingeckoId: "dogecoin" },
  SHIB:  { address: "0x2859e4544C4bB03966803b044A93563Bd2D0DD4D", decimals: 18, coingeckoId: "shiba-inu" },
  MATIC: { address: "0xCC42724C6683B7E57334c4E856f4c9965ED682bD", decimals: 18, coingeckoId: "matic-network" },
  AVAX:  { address: "0x1CE0c2827e2eF14D5C4f29a091d735A204794041", decimals: 18, coingeckoId: "avalanche-2" },
  FIL:   { address: "0x0D8Ce2A99Bb6e3B7Db580eD848240e4a0F9aE153", decimals: 18, coingeckoId: "filecoin" },
  ATOM:  { address: "0x0Eb3a705fc54725037CC9e008bDede697f62F335", decimals: 18, coingeckoId: "cosmos" },
  LTC:   { address: "0x4338665CBB7B2485A8855A139b75D5e34AB0DB94", decimals: 18, coingeckoId: "litecoin" },
  DAI:   { address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3", decimals: 18, coingeckoId: "dai" },
  XVS:   { address: "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63", decimals: 18, coingeckoId: "venus" },
  ALPACA: { address: "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F", decimals: 18, coingeckoId: "alpaca-finance" },
  BAKE:  { address: "0xE02dF9e3e622DeBdD69fb838bB799E3F168902c5", decimals: 18, coingeckoId: "bakerytoken" },
  TWT:   { address: "0x4B0F1812e5Df2A09796481Ff14017e6005508003", decimals: 18, coingeckoId: "trust-wallet-token" },
};

// Default prices as fallback
const DEFAULT_PRICES: Record<string, number> = {
  binancecoin: 600,
  tether: 1,
  "usd-coin": 1,
  "binance-usd": 1,
  "pancakeswap-token": 2.5,
  ethereum: 2500,
  "binance-bitcoin": 60000,
  ripple: 0.5,
  cardano: 0.4,
  polkadot: 6,
  chainlink: 15,
  uniswap: 10,
  dogecoin: 0.08,
  "shiba-inu": 0.00001,
  "matic-network": 0.7,
  "avalanche-2": 30,
  filecoin: 5,
  cosmos: 8,
  litecoin: 70,
  dai: 1,
  venus: 5,
  "alpaca-finance": 0.2,
  bakerytoken: 0.15,
  "trust-wallet-token": 1,
};

// Get all unique CoinGecko IDs
function getCoingeckoIds(): string[] {
  const ids = new Set<string>();
  for (const config of Object.values(TOKEN_CONFIG)) {
    if (config.coingeckoId) ids.add(config.coingeckoId);
  }
  return Array.from(ids);
}

// Get token prices from CoinGecko
async function getTokenPrices(): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};

  try {
    const ids = getCoingeckoIds();
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) throw new Error("CoinGecko API error");

    const data = await response.json();

    for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
      if (config.coingeckoId && data[config.coingeckoId]?.usd) {
        prices[symbol] = data[config.coingeckoId].usd;
      } else if (config.coingeckoId && DEFAULT_PRICES[config.coingeckoId]) {
        prices[symbol] = DEFAULT_PRICES[config.coingeckoId];
      } else {
        prices[symbol] = 0;
      }
    }
    return prices;
  } catch (error) {
    console.error("Error fetching prices:", error);
    for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
      if (config.coingeckoId && DEFAULT_PRICES[config.coingeckoId]) {
        prices[symbol] = DEFAULT_PRICES[config.coingeckoId];
      } else {
        prices[symbol] = 0;
      }
    }
    return prices;
  }
}

// Calculate quote based on prices
function calculatePriceBasedQuote(
  tokenIn: string,
  tokenOut: string,
  amountInWei: string,
  prices: Record<string, number>
): string {
  const tokenInConfig = TOKEN_CONFIG[tokenIn];
  const tokenOutConfig = TOKEN_CONFIG[tokenOut];

  if (!tokenInConfig || !tokenOutConfig) throw new Error("Invalid token");

  const priceIn = prices[tokenIn] || 0;
  const priceOut = prices[tokenOut] || 0;

  if (priceIn === 0 || priceOut === 0) throw new Error("Price not available");

  const amountInHuman = Number(BigInt(amountInWei)) / Math.pow(10, tokenInConfig.decimals);
  const usdValue = amountInHuman * priceIn;
  const amountOutHuman = usdValue / priceOut;
  // PancakeSwap V2 fee is 0.25%
  const amountOutWithFee = amountOutHuman * 0.9975;
  const amountOutWei = BigInt(Math.floor(amountOutWithFee * Math.pow(10, tokenOutConfig.decimals)));

  return amountOutWei.toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, tokenIn, tokenOut, amountIn } = await req.json();

    if (action === "prices") {
      const prices = await getTokenPrices();
      const tokens: Record<string, string> = {};
      for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
        tokens[symbol] = config.address;
      }
      return new Response(JSON.stringify({ prices, tokens }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "quote") {
      if (!tokenIn || !tokenOut || !amountIn) throw new Error("Missing required parameters");

      const tokenOutConfig = TOKEN_CONFIG[tokenOut];
      if (!tokenOutConfig) throw new Error("Invalid token symbols");

      const prices = await getTokenPrices();
      const amountOut = calculatePriceBasedQuote(tokenIn, tokenOut, amountIn, prices);

      return new Response(
        JSON.stringify({
          amountOut,
          fee: 2500, // 0.25% PancakeSwap V2
          route: `${tokenIn} → ${tokenOut}`,
          decimalsOut: tokenOutConfig.decimals,
          source: "pancakeswap-v2",
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
