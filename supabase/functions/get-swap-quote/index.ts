import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base chain ID
const BASE_CHAIN_ID = 8453;

// Token addresses on Base
const TOKEN_ADDRESSES: Record<string, string> = {
  ETH: "0x0000000000000000000000000000000000000000",
  WETH: "0x4200000000000000000000000000000000000006",
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  USDbC: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
  DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  cbETH: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
  AERO: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
};

// Uniswap V3 Quoter address on Base
const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";

// ABI for quoteExactInputSingle
const QUOTER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "address", name: "tokenOut", type: "address" },
      { internalType: "uint24", name: "fee", type: "uint24" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" }
    ],
    name: "quoteExactInputSingle",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];

// Encode function call
function encodeQuoteCall(tokenIn: string, tokenOut: string, fee: number, amountIn: string): string {
  const methodId = "0xf7729d43";
  const paddedTokenIn = tokenIn.toLowerCase().replace("0x", "").padStart(64, "0");
  const paddedTokenOut = tokenOut.toLowerCase().replace("0x", "").padStart(64, "0");
  const paddedFee = fee.toString(16).padStart(64, "0");
  const paddedAmountIn = BigInt(amountIn).toString(16).padStart(64, "0");
  const paddedSqrtPriceLimit = "0".padStart(64, "0");
  
  return `${methodId}${paddedTokenIn}${paddedTokenOut}${paddedFee}${paddedAmountIn}${paddedSqrtPriceLimit}`;
}

// Get token prices from CoinGecko
async function getTokenPrices(): Promise<Record<string, number>> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin,dai,coinbase-wrapped-staked-eth,aerodrome-finance&vs_currencies=usd"
    );
    const data = await response.json();
    
    return {
      ETH: data.ethereum?.usd || 0,
      WETH: data.ethereum?.usd || 0,
      USDC: data["usd-coin"]?.usd || 1,
      USDbC: 1,
      DAI: data.dai?.usd || 1,
      cbETH: data["coinbase-wrapped-staked-eth"]?.usd || 0,
      AERO: data["aerodrome-finance"]?.usd || 0,
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

// Get quote from Uniswap
async function getUniswapQuote(
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  fee: number = 3000
): Promise<string | null> {
  const BASE_RPC = "https://mainnet.base.org";
  
  // Use WETH for ETH
  const actualTokenIn = tokenIn === TOKEN_ADDRESSES.ETH ? TOKEN_ADDRESSES.WETH : tokenIn;
  const actualTokenOut = tokenOut === TOKEN_ADDRESSES.ETH ? TOKEN_ADDRESSES.WETH : tokenOut;
  
  const callData = encodeQuoteCall(actualTokenIn, actualTokenOut, fee, amountIn);
  
  try {
    const response = await fetch(BASE_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [
          { to: QUOTER_ADDRESS, data: callData },
          "latest"
        ]
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error("RPC error:", data.error);
      return null;
    }
    
    if (data.result && data.result !== "0x") {
      return BigInt(data.result).toString();
    }
    
    return null;
  } catch (error) {
    console.error("Error getting quote:", error);
    return null;
  }
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
      return new Response(JSON.stringify({ prices, tokens: TOKEN_ADDRESSES }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "quote") {
      const tokenInAddress = TOKEN_ADDRESSES[tokenIn] || tokenIn;
      const tokenOutAddress = TOKEN_ADDRESSES[tokenOut] || tokenOut;
      
      if (!tokenInAddress || !tokenOutAddress) {
        throw new Error("Invalid token symbols");
      }

      // Try different fee tiers
      const feeTiers = [500, 3000, 10000];
      let bestQuote: string | null = null;
      let bestFee = 3000;

      for (const fee of feeTiers) {
        const quote = await getUniswapQuote(tokenInAddress, tokenOutAddress, amountIn, fee);
        if (quote && (!bestQuote || BigInt(quote) > BigInt(bestQuote))) {
          bestQuote = quote;
          bestFee = fee;
        }
      }

      if (!bestQuote) {
        // Fallback to price-based calculation
        const prices = await getTokenPrices();
        const priceIn = prices[tokenIn] || 1;
        const priceOut = prices[tokenOut] || 1;
        
        // Calculate based on prices
        const amountInNumber = parseFloat(amountIn) / 1e18;
        const amountOutNumber = (amountInNumber * priceIn) / priceOut;
        bestQuote = (amountOutNumber * 1e18).toFixed(0);
      }

      return new Response(JSON.stringify({ 
        amountOut: bestQuote,
        fee: bestFee,
        route: `${tokenIn} -> ${tokenOut}`,
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