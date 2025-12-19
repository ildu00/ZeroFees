import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token config on Base with decimals
const TOKEN_CONFIG: Record<string, { address: string; decimals: number; coingeckoId?: string }> = {
  ETH: { address: "0x0000000000000000000000000000000000000000", decimals: 18, coingeckoId: "ethereum" },
  WETH: { address: "0x4200000000000000000000000000000000000006", decimals: 18, coingeckoId: "ethereum" },
  USDC: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, coingeckoId: "usd-coin" },
  USDbC: { address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", decimals: 6 },
  DAI: { address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18, coingeckoId: "dai" },
  cbETH: { address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22", decimals: 18, coingeckoId: "coinbase-wrapped-staked-eth" },
  AERO: { address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", decimals: 18, coingeckoId: "aerodrome-finance" },
};

// Get token prices from CoinGecko
async function getTokenPrices(): Promise<Record<string, number>> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin,dai,coinbase-wrapped-staked-eth,aerodrome-finance&vs_currencies=usd"
    );
    const data = await response.json();
    
    return {
      ETH: data.ethereum?.usd || 2400,
      WETH: data.ethereum?.usd || 2400,
      USDC: data["usd-coin"]?.usd || 1,
      USDbC: 1,
      DAI: data.dai?.usd || 1,
      cbETH: data["coinbase-wrapped-staked-eth"]?.usd || 2500,
      AERO: data["aerodrome-finance"]?.usd || 1.5,
    };
  } catch (error) {
    console.error("Error fetching prices:", error);
    return {
      ETH: 2400,
      WETH: 2400,
      USDC: 1,
      USDbC: 1,
      DAI: 1,
      cbETH: 2500,
      AERO: 1.5,
    };
  }
}

// Calculate quote based on prices (fallback when direct quote fails)
function calculatePriceBasedQuote(
  tokenIn: string,
  tokenOut: string,
  amountInWei: string,
  prices: Record<string, number>
): string {
  const tokenInConfig = TOKEN_CONFIG[tokenIn];
  const tokenOutConfig = TOKEN_CONFIG[tokenOut];
  
  if (!tokenInConfig || !tokenOutConfig) {
    throw new Error("Invalid token");
  }

  const priceIn = prices[tokenIn] || 1;
  const priceOut = prices[tokenOut] || 1;
  
  // Convert amountIn from wei to human readable
  const amountInHuman = Number(BigInt(amountInWei)) / Math.pow(10, tokenInConfig.decimals);
  
  // Calculate USD value
  const usdValue = amountInHuman * priceIn;
  
  // Calculate output amount in human readable
  const amountOutHuman = usdValue / priceOut;
  
  // Apply 0.3% fee
  const amountOutWithFee = amountOutHuman * 0.997;
  
  // Convert to wei for output token
  const amountOutWei = BigInt(Math.floor(amountOutWithFee * Math.pow(10, tokenOutConfig.decimals)));
  
  console.log("Price calculation:", {
    tokenIn,
    tokenOut,
    amountInWei,
    amountInHuman,
    priceIn,
    priceOut,
    usdValue,
    amountOutHuman,
    amountOutWithFee,
    amountOutWei: amountOutWei.toString(),
    decimalsIn: tokenInConfig.decimals,
    decimalsOut: tokenOutConfig.decimals,
  });
  
  return amountOutWei.toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, tokenIn, tokenOut, amountIn } = await req.json();
    
    console.log("Request:", { action, tokenIn, tokenOut, amountIn });

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
      if (!tokenIn || !tokenOut || !amountIn) {
        throw new Error("Missing required parameters");
      }

      const tokenInConfig = TOKEN_CONFIG[tokenIn];
      const tokenOutConfig = TOKEN_CONFIG[tokenOut];
      
      if (!tokenInConfig || !tokenOutConfig) {
        throw new Error("Invalid token symbols");
      }

      // Get prices for calculation
      const prices = await getTokenPrices();
      
      // Use price-based quote calculation
      const amountOut = calculatePriceBasedQuote(tokenIn, tokenOut, amountIn, prices);

      return new Response(JSON.stringify({ 
        amountOut,
        fee: 3000, // 0.3%
        route: `${tokenIn} -> ${tokenOut}`,
        decimalsOut: tokenOutConfig.decimals,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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