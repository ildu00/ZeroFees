import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map token symbols to CoinGecko IDs
const GECKO_IDS: Record<string, string> = {
  'WETH': 'ethereum',
  'ETH': 'ethereum',
  'USDC': 'usd-coin',
  'USDbC': 'usd-coin',
  'USDT': 'tether',
  'DAI': 'dai',
  'WBTC': 'wrapped-bitcoin',
  'cbETH': 'coinbase-wrapped-staked-eth',
  'rETH': 'rocket-pool-eth',
  'AERO': 'aerodrome-finance',
  'BRETT': 'brett',
  'DEGEN': 'degen-base',
  'VIRTUAL': 'virtual-protocol',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token0, token1 } = await req.json();
    
    console.log(`Fetching price for ${token0}/${token1}`);
    
    const id0 = GECKO_IDS[token0];
    const id1 = GECKO_IDS[token1];
    
    if (!id0 || !id1) {
      console.log(`Token not found in mapping: ${token0}=${id0}, ${token1}=${id1}`);
      return new Response(
        JSON.stringify({ 
          error: "Token not supported",
          price: null 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch prices from CoinGecko
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id0},${id1}&vs_currencies=usd`
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CoinGecko error: ${response.status} - ${errorText}`);
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("CoinGecko response:", JSON.stringify(data));
    
    const price0 = data[id0]?.usd;
    const price1 = data[id1]?.usd;
    
    if (!price0 || !price1) {
      return new Response(
        JSON.stringify({ 
          error: "Price not available",
          price: null 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Calculate price of token0 in terms of token1
    const price = price0 / price1;
    
    console.log(`Price: 1 ${token0} = ${price} ${token1}`);
    
    return new Response(
      JSON.stringify({ 
        price,
        price0Usd: price0,
        price1Usd: price1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching token price:", errorMessage);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        price: null 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 with error in body to avoid CORS issues
      }
    );
  }
});
