import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Flamingo DEX contracts on NEO N3 MainNet
const FLAMINGO_SWAP_ROUTER = '0xde3a4b093abbd07e9a69cdec88a54d9a1fe14975';
const BNEO_CONTRACT = '0x48c40d4666f93408be1bef038b6722404d9a4c2a';

// NEO N3 RPC nodes
const NEO_RPC_NODES = [
  'https://mainnet1.neo.coz.io:443',
  'https://mainnet2.neo.coz.io:443',
  'https://neo3-mainnet.neoline.vip',
];

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

// Build swap path through bNEO
function buildSwapPath(tokenIn: string, tokenOut: string): string[] {
  const inConfig = NEO_TOKENS[tokenIn];
  const outConfig = NEO_TOKENS[tokenOut];
  if (!inConfig || !outConfig) return [];

  const effectiveIn = tokenIn === 'NEO' ? BNEO_CONTRACT : inConfig.address;
  const effectiveOut = tokenOut === 'NEO' ? BNEO_CONTRACT : outConfig.address;

  if (effectiveIn === BNEO_CONTRACT || effectiveOut === BNEO_CONTRACT) {
    return [effectiveIn, effectiveOut];
  }

  return [effectiveIn, BNEO_CONTRACT, effectiveOut];
}

// Convert script hash to RPC format (reverse bytes, no 0x prefix)
function toRpcHash(hash: string): string {
  const clean = hash.startsWith('0x') ? hash.substring(2) : hash;
  // Reverse bytes
  const bytes = [];
  for (let i = clean.length - 2; i >= 0; i -= 2) {
    bytes.push(clean.substring(i, i + 2));
  }
  return bytes.join('');
}

// Call NEO N3 RPC invokefunction to get on-chain quote
async function getFlamingoQuote(
  tokenIn: string,
  tokenOut: string,
  amountInSmallest: string
): Promise<{ amountOut: string; path: string[] } | null> {
  const path = buildSwapPath(tokenIn, tokenOut);
  if (path.length < 2) return null;

  // For NEO, convert amount: 1 NEO = 1e8 bNEO
  const effectiveAmountIn = tokenIn === 'NEO'
    ? (BigInt(amountInSmallest) * BigInt(1e8)).toString()
    : amountInSmallest;

  // Build the path array for RPC
  const pathParam = {
    type: "Array",
    value: path.map(p => ({
      type: "Hash160",
      value: p,
    })),
  };

  const rpcBody = {
    jsonrpc: "2.0",
    id: 1,
    method: "invokefunction",
    params: [
      FLAMINGO_SWAP_ROUTER,
      "getAmountsOut",
      [
        { type: "Integer", value: effectiveAmountIn },
        pathParam,
      ],
    ],
  };

  // Try each RPC node
  for (const rpcUrl of NEO_RPC_NODES) {
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rpcBody),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) continue;

      const data = await response.json();

      if (data.result?.state === 'HALT' && data.result?.stack?.[0]) {
        const stack = data.result.stack[0];

        // getAmountsOut returns an Array of amounts
        if (stack.type === 'Array' && stack.value?.length > 0) {
          const lastAmount = stack.value[stack.value.length - 1];
          let amountOut: string;

          if (lastAmount.type === 'Integer') {
            amountOut = lastAmount.value;
          } else if (lastAmount.type === 'ByteString') {
            // Convert little-endian hex to BigInt
            const hex = atob(lastAmount.value)
              .split('')
              .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
              .reverse()
              .join('');
            amountOut = BigInt('0x' + (hex || '0')).toString();
          } else {
            continue;
          }

          // If swapping to NEO, convert bNEO back: bNEO / 1e8
          if (tokenOut === 'NEO') {
            amountOut = (BigInt(amountOut) / BigInt(1e8)).toString();
          }

          console.log("Flamingo on-chain quote:", { tokenIn, tokenOut, amountInSmallest, amountOut, path });
          return { amountOut, path };
        }
      }

      console.log("Flamingo RPC response not HALT or unexpected stack:", JSON.stringify(data.result?.state), JSON.stringify(data.result?.stack));
    } catch (err) {
      console.warn(`RPC node ${rpcUrl} failed:`, err);
      continue;
    }
  }

  return null;
}

// Get token prices from CoinGecko
async function getTokenPrices(): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  
  try {
    const ids = [...new Set(Object.values(NEO_TOKENS).map(t => t.coingeckoId).filter(Boolean))];
    const idsString = ids.join(",");
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=usd`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
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

// Calculate quote based on prices (fallback)
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
  
  const amountInHuman = Number(amountInSmallest) / Math.pow(10, tokenInConfig.decimals);
  const usdValue = amountInHuman * priceIn;
  const amountOutHuman = usdValue / priceOut;
  
  // Apply 0.3% fee
  const amountOutWithFee = amountOutHuman * 0.997;
  const amountOutSmallest = Math.floor(amountOutWithFee * Math.pow(10, tokenOutConfig.decimals));
  
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

      // Try on-chain Flamingo quote first
      let amountOut: string;
      let source = "price-estimate";
      let route = `${tokenIn} → ${tokenOut}`;

      const flamingoQuote = await getFlamingoQuote(tokenIn, tokenOut, amountIn);
      
      if (flamingoQuote && flamingoQuote.amountOut && BigInt(flamingoQuote.amountOut) > 0n) {
        amountOut = flamingoQuote.amountOut;
        source = "flamingo-dex";
        
        // Build human-readable route
        const pathSymbols = flamingoQuote.path.map(addr => {
          const found = Object.entries(NEO_TOKENS).find(([, t]) => t.address === addr);
          return found ? found[0] : addr.substring(0, 8);
        });
        route = pathSymbols.join(' → ');
        
        console.log("Using Flamingo on-chain quote:", { amountOut, route });
      } else {
        // Fallback to price-based calculation
        console.log("Flamingo quote unavailable, falling back to price estimate");
        const prices = await getTokenPrices();
        amountOut = calculatePriceBasedQuote(tokenIn, tokenOut, amountIn, prices);
      }

      return new Response(JSON.stringify({ 
        amountOut,
        fee: 3000,
        route,
        decimalsOut: tokenOutConfig.decimals,
        source,
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
