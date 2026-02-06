import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Avalanche C-Chain token config with decimals and CoinGecko IDs
const TOKEN_CONFIG: Record<string, { address: string; decimals: number; coingeckoId?: string }> = {
  AVAX:     { address: "0x0000000000000000000000000000000000000000", decimals: 18, coingeckoId: "avalanche-2" },
  WAVAX:    { address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", decimals: 18, coingeckoId: "avalanche-2" },
  USDC:     { address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6,  coingeckoId: "usd-coin" },
  "USDC.e": { address: "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664", decimals: 6,  coingeckoId: "usd-coin" },
  USDT:     { address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", decimals: 6,  coingeckoId: "tether" },
  "USDT.e": { address: "0xc7198437980c041c805A1EDcbA50c1Ce5db95118", decimals: 6,  coingeckoId: "tether" },
  JOE:      { address: "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd", decimals: 18, coingeckoId: "joe" },
  "WETH.e": { address: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB", decimals: 18, coingeckoId: "ethereum" },
  "WBTC.e": { address: "0x50b7545627a5162F82A992c33b87aDc75187B218", decimals: 8,  coingeckoId: "wrapped-bitcoin" },
  "DAI.e":  { address: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70", decimals: 18, coingeckoId: "dai" },
  "LINK.e": { address: "0x5947BB275c521040051D82396e4B9d3f7694cB02", decimals: 18, coingeckoId: "chainlink" },
  "AAVE.e": { address: "0x63a72806098Bd3D9520cC43356dD78afe5D386D9", decimals: 18, coingeckoId: "aave" },
  sAVAX:    { address: "0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE", decimals: 18, coingeckoId: "benqi-liquid-staked-avax" },
  QI:       { address: "0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5", decimals: 18, coingeckoId: "benqi" },
  PNG:      { address: "0x60781C2586D68229fde47564546784ab3fACA982", decimals: 18, coingeckoId: "pangolin" },
  GMX:      { address: "0x62edc0692BD897D2295872a9FFCac5425011c661", decimals: 18, coingeckoId: "gmx" },
};

// Default prices as fallback
const DEFAULT_PRICES: Record<string, number> = {
  "avalanche-2": 30,
  "usd-coin": 1,
  tether: 1,
  joe: 0.4,
  ethereum: 2500,
  "wrapped-bitcoin": 60000,
  dai: 1,
  chainlink: 15,
  aave: 90,
  "benqi-liquid-staked-avax": 32,
  benqi: 0.015,
  pangolin: 0.05,
  gmx: 30,
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
  // Trader Joe V1 fee is 0.3%
  const amountOutWithFee = amountOutHuman * 0.997;
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
          fee: 3000, // 0.3% Trader Joe V1
          route: `${tokenIn} → ${tokenOut}`,
          decimalsOut: tokenOutConfig.decimals,
          source: "traderjoe-v1",
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
