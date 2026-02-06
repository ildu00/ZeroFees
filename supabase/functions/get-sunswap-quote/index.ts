import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// TRC-20 Token Configuration on TRON
const TRON_TOKENS: Record<string, { address: string; decimals: number; coingeckoId?: string }> = {
  // Native
  TRX: { address: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb", decimals: 6, coingeckoId: "tron" },
  WTRX: { address: "TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR", decimals: 6, coingeckoId: "tron" },
  
  // Stablecoins
  USDT: { address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", decimals: 6, coingeckoId: "tether" },
  USDC: { address: "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8", decimals: 6, coingeckoId: "usd-coin" },
  TUSD: { address: "TUpMhErZL2fhh4sVNULAbNKLokS4GjC1F4", decimals: 18, coingeckoId: "true-usd" },
  USDJ: { address: "TMwFHYXLJaRUPeW6421aqXL4ZEzPRFGkGT", decimals: 18, coingeckoId: "usdj" },
  USDD: { address: "TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn", decimals: 18, coingeckoId: "usdd" },
  
  // TRON Ecosystem
  BTT: { address: "TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4", decimals: 18, coingeckoId: "bittorrent" },
  WIN: { address: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7", decimals: 6, coingeckoId: "winklink" },
  JST: { address: "TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9", decimals: 18, coingeckoId: "just" },
  SUN: { address: "TKkeiboTkxXKJpbmVFbv4a8ov5rAfRDMf9", decimals: 18, coingeckoId: "sun-token" },
  NFT: { address: "TFczxzPhnThNSqr5by8tvxsdCFRRz6cPNq", decimals: 6, coingeckoId: "apenft" },
  
  // Wrapped assets
  WBTC: { address: "TXpw8XeWYeTUd4quDskoUqeQPowRh4jY65", decimals: 8, coingeckoId: "wrapped-bitcoin" },
  WETH: { address: "TXWkP3jLBqRGojUih1ShzNyDaN5Csnebok", decimals: 18, coingeckoId: "ethereum" },
};

// Default prices as fallback
const DEFAULT_PRICES: Record<string, number> = {
  tron: 0.12,
  tether: 1,
  "usd-coin": 1,
  "true-usd": 1,
  usdj: 1,
  usdd: 1,
  bittorrent: 0.000001,
  winklink: 0.0001,
  just: 0.03,
  "sun-token": 0.02,
  apenft: 0.0000005,
  "wrapped-bitcoin": 100000,
  ethereum: 3500,
};

// SunSwap API endpoints
const SUNSWAP_API = "https://openapi.sun.io";

// Get token prices from CoinGecko
async function getTokenPrices(): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  
  try {
    const ids = [...new Set(Object.values(TRON_TOKENS).map(t => t.coingeckoId).filter(Boolean))];
    const idsString = ids.join(",");
    
    console.log("Fetching TRON token prices for:", ids.length, "tokens");
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=usd`,
      {
        headers: { 'Accept': 'application/json' },
      }
    );
    
    if (!response.ok) {
      console.error("CoinGecko API error:", response.status);
      throw new Error("CoinGecko API error");
    }
    
    const data = await response.json();
    
    // Map prices to token symbols
    for (const [symbol, config] of Object.entries(TRON_TOKENS)) {
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
    console.error("Error fetching TRON prices:", error);
    
    // Return default prices on error
    for (const [symbol, config] of Object.entries(TRON_TOKENS)) {
      if (config.coingeckoId && DEFAULT_PRICES[config.coingeckoId]) {
        prices[symbol] = DEFAULT_PRICES[config.coingeckoId];
      } else {
        prices[symbol] = 0;
      }
    }
    
    return prices;
  }
}

// Get swap quote from SunSwap API
async function getSunSwapQuote(
  tokenIn: string,
  tokenOut: string,
  amountIn: string
): Promise<{ amountOut: string; route: string } | null> {
  try {
    const tokenInConfig = TRON_TOKENS[tokenIn];
    const tokenOutConfig = TRON_TOKENS[tokenOut];
    
    if (!tokenInConfig || !tokenOutConfig) {
      return null;
    }

    // Try to get quote from SunSwap V2 API
    const response = await fetch(`${SUNSWAP_API}/v2/router/getSwapInfo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenIn: tokenInConfig.address,
        tokenOut: tokenOutConfig.address,
        amountIn: amountIn,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data?.amountOut) {
        return {
          amountOut: data.data.amountOut,
          route: data.data.route || `${tokenIn} -> ${tokenOut}`,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("SunSwap API error:", error);
    return null;
  }
}

// Calculate quote based on prices (fallback)
function calculatePriceBasedQuote(
  tokenIn: string,
  tokenOut: string,
  amountInSun: string,
  prices: Record<string, number>
): string {
  const tokenInConfig = TRON_TOKENS[tokenIn];
  const tokenOutConfig = TRON_TOKENS[tokenOut];
  
  if (!tokenInConfig || !tokenOutConfig) {
    throw new Error("Invalid token");
  }

  const priceIn = prices[tokenIn] || 0;
  const priceOut = prices[tokenOut] || 0;
  
  if (priceIn === 0 || priceOut === 0) {
    throw new Error("Price not available for token");
  }
  
  // Convert amountIn from smallest unit to human readable
  const amountInHuman = Number(BigInt(amountInSun)) / Math.pow(10, tokenInConfig.decimals);
  
  // Calculate USD value
  const usdValue = amountInHuman * priceIn;
  
  // Calculate output amount
  const amountOutHuman = usdValue / priceOut;
  
  // Apply 0.3% SunSwap fee
  const amountOutWithFee = amountOutHuman * 0.997;
  
  // Convert to smallest unit
  const amountOutSmallest = BigInt(Math.floor(amountOutWithFee * Math.pow(10, tokenOutConfig.decimals)));
  
  console.log("TRON price calculation:", {
    tokenIn,
    tokenOut,
    amountInSun,
    amountInHuman,
    priceIn,
    priceOut,
    usdValue,
    amountOutWithFee,
    amountOutSmallest: amountOutSmallest.toString(),
  });
  
  return amountOutSmallest.toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, tokenIn, tokenOut, amountIn } = await req.json();
    
    console.log("SunSwap Request:", { action, tokenIn, tokenOut, amountIn });

    if (action === "prices") {
      const prices = await getTokenPrices();
      const tokens: Record<string, { address: string; decimals: number }> = {};
      for (const [symbol, config] of Object.entries(TRON_TOKENS)) {
        tokens[symbol] = { address: config.address, decimals: config.decimals };
      }
      return new Response(JSON.stringify({ prices, tokens }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "quote") {
      if (!tokenIn || !tokenOut || !amountIn) {
        throw new Error("Missing required parameters");
      }

      const tokenInConfig = TRON_TOKENS[tokenIn];
      const tokenOutConfig = TRON_TOKENS[tokenOut];
      
      if (!tokenInConfig || !tokenOutConfig) {
        throw new Error("Invalid token symbols");
      }

      // Try SunSwap API first
      const sunswapQuote = await getSunSwapQuote(tokenIn, tokenOut, amountIn);
      
      if (sunswapQuote) {
        return new Response(JSON.stringify({ 
          amountOut: sunswapQuote.amountOut,
          fee: 3000,
          route: sunswapQuote.route,
          decimalsOut: tokenOutConfig.decimals,
          source: "sunswap",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fallback to price-based calculation
      const prices = await getTokenPrices();
      const amountOut = calculatePriceBasedQuote(tokenIn, tokenOut, amountIn, prices);

      return new Response(JSON.stringify({ 
        amountOut,
        fee: 3000,
        route: `${tokenIn} -> ${tokenOut}`,
        decimalsOut: tokenOutConfig.decimals,
        source: "price-estimate",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "tokens") {
      const tokens: Record<string, { address: string; decimals: number; symbol: string }> = {};
      for (const [symbol, config] of Object.entries(TRON_TOKENS)) {
        tokens[symbol] = { 
          address: config.address, 
          decimals: config.decimals,
          symbol: symbol,
        };
      }
      return new Response(JSON.stringify({ tokens }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error: unknown) {
    console.error("SunSwap Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
