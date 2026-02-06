import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// NEP-17 Token Configuration on NEO N3
const NEO_TOKENS: Record<string, { address: string; decimals: number; coingeckoId?: string }> = {
  NEO: { address: "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5", decimals: 0, coingeckoId: "neo" },
  GAS: { address: "0xd2a4cff31913016155e38e474a2c06d08be276cf", decimals: 8, coingeckoId: "gas" },
  FLM: { address: "0xf0151f528127558851b39c2cd8aa47da7418ab28", decimals: 8, coingeckoId: "flamingo-finance" },
  fUSDT: { address: "0xcd48b160c1bbc9d74997b803b9a7ad50a4bef020", decimals: 6, coingeckoId: "tether" },
  bNEO: { address: "0x48c40d4666f93408be1bef038b6722404d9a4c2a", decimals: 8, coingeckoId: "neo" },
  SWTH: { address: "0x78e1330db47634afdb5ea455302ba2d12b8d549d", decimals: 8, coingeckoId: "switcheo" },
};

// Default prices as fallback
const DEFAULT_PRICES: Record<string, number> = {
  neo: 12,
  gas: 4.5,
  "flamingo-finance": 0.05,
  tether: 1,
  switcheo: 0.01,
};

// Get token prices from CoinGecko
async function getTokenPrices(): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  
  try {
    const ids = [...new Set(Object.values(NEO_TOKENS).map(t => t.coingeckoId).filter(Boolean))];
    const idsString = ids.join(",");
    
    console.log("Fetching NEO token prices for:", ids.length, "tokens");
    
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
    
    for (const [symbol, config] of Object.entries(NEO_TOKENS)) {
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
    console.error("Error fetching NEO prices:", error);
    
    for (const [symbol, config] of Object.entries(NEO_TOKENS)) {
      if (config.coingeckoId && DEFAULT_PRICES[config.coingeckoId]) {
        prices[symbol] = DEFAULT_PRICES[config.coingeckoId];
      } else {
        prices[symbol] = 0;
      }
    }
    
    return prices;
  }
}

// Calculate quote based on prices (Flamingo DEX integration placeholder)
function calculatePriceBasedQuote(
  tokenIn: string,
  tokenOut: string,
  amountInSmallest: string,
  prices: Record<string, number>
): string {
  const tokenInConfig = NEO_TOKENS[tokenIn];
  const tokenOutConfig = NEO_TOKENS[tokenOut];
  
  if (!tokenInConfig || !tokenOutConfig) {
    throw new Error("Invalid token");
  }

  const priceIn = prices[tokenIn] || 0;
  const priceOut = prices[tokenOut] || 0;
  
  if (priceIn === 0 || priceOut === 0) {
    throw new Error("Price not available for token");
  }
  
  const amountInHuman = Number(BigInt(amountInSmallest)) / Math.pow(10, tokenInConfig.decimals);
  const usdValue = amountInHuman * priceIn;
  const amountOutHuman = usdValue / priceOut;
  
  // Apply 0.3% fee
  const amountOutWithFee = amountOutHuman * 0.997;
  const amountOutSmallest = BigInt(Math.floor(amountOutWithFee * Math.pow(10, tokenOutConfig.decimals)));
  
  console.log("NEO price calculation:", {
    tokenIn, tokenOut, amountInSmallest, amountInHuman,
    priceIn, priceOut, usdValue, amountOutWithFee,
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
    
    console.log("NEO Quote Request:", { action, tokenIn, tokenOut, amountIn });

    if (action === "prices") {
      const prices = await getTokenPrices();
      const tokens: Record<string, { address: string; decimals: number }> = {};
      for (const [symbol, config] of Object.entries(NEO_TOKENS)) {
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

      const tokenInConfig = NEO_TOKENS[tokenIn];
      const tokenOutConfig = NEO_TOKENS[tokenOut];
      
      if (!tokenInConfig || !tokenOutConfig) {
        throw new Error("Invalid token symbols");
      }

      // Price-based calculation (Flamingo DEX API integration can be added later)
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
      for (const [symbol, config] of Object.entries(NEO_TOKENS)) {
        tokens[symbol] = { address: config.address, decimals: config.decimals, symbol };
      }
      return new Response(JSON.stringify({ tokens }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error: unknown) {
    console.error("NEO Quote Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
