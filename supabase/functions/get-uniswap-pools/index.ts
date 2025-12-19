import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Uniswap V3 Subgraph for Base
const UNISWAP_SUBGRAPH_URL = "https://api.studio.thegraph.com/query/48211/uniswap-v3-base/version/latest";

// Token icons mapping
const TOKEN_ICONS: Record<string, string> = {
  'WETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  'ETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  'USDC': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  'USDbC': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  'USDT': 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  'DAI': 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
  'WBTC': 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png',
  'cbETH': 'https://assets.coingecko.com/coins/images/27008/small/cbeth.png',
  'rETH': 'https://assets.coingecko.com/coins/images/20764/small/reth.png',
  'AERO': 'https://assets.coingecko.com/coins/images/31745/small/token.png',
  'BRETT': 'https://assets.coingecko.com/coins/images/35529/small/1000050750.png',
  'DEGEN': 'https://assets.coingecko.com/coins/images/34515/small/android-chrome-512x512.png',
};

const getTokenIcon = (symbol: string): string => {
  return TOKEN_ICONS[symbol] || `https://ui-avatars.com/api/?name=${symbol}&background=6366f1&color=fff&size=64`;
};

interface Pool {
  id: string;
  token0: { symbol: string; icon: string };
  token1: { symbol: string; icon: string };
  tvl: number;
  apr: number;
  volume24h: number;
  fees24h: number;
  feeTier: number;
}

async function fetchUniswapPools(): Promise<Pool[]> {
  const query = `
    {
      pools(
        first: 20
        orderBy: totalValueLockedUSD
        orderDirection: desc
        where: { totalValueLockedUSD_gt: "100000" }
      ) {
        id
        token0 {
          symbol
          name
        }
        token1 {
          symbol
          name
        }
        feeTier
        totalValueLockedUSD
        volumeUSD
        poolDayData(first: 1, orderBy: date, orderDirection: desc) {
          volumeUSD
          feesUSD
          tvlUSD
        }
      }
    }
  `;

  console.log("Fetching pools from Uniswap V3 subgraph...");

  const response = await fetch(UNISWAP_SUBGRAPH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Subgraph request failed: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    console.error("Subgraph errors:", data.errors);
    throw new Error(`Subgraph query error: ${data.errors[0]?.message}`);
  }

  const pools = data.data?.pools || [];
  console.log(`Fetched ${pools.length} pools from subgraph`);

  return pools.map((pool: any, index: number) => {
    const tvl = parseFloat(pool.totalValueLockedUSD) || 0;
    const dayData = pool.poolDayData?.[0];
    const volume24h = dayData ? parseFloat(dayData.volumeUSD) : 0;
    const fees24h = dayData ? parseFloat(dayData.feesUSD) : 0;
    
    // Calculate APR: (fees24h * 365 / tvl) * 100
    const apr = tvl > 0 ? ((fees24h * 365) / tvl) * 100 : 0;

    return {
      id: pool.id || `pool-${index}`,
      token0: {
        symbol: pool.token0.symbol,
        icon: getTokenIcon(pool.token0.symbol),
      },
      token1: {
        symbol: pool.token1.symbol,
        icon: getTokenIcon(pool.token1.symbol),
      },
      tvl,
      apr: Math.min(apr, 999), // Cap APR display at 999%
      volume24h,
      fees24h,
      feeTier: parseInt(pool.feeTier) / 10000, // Convert to percentage (e.g., 3000 -> 0.3%)
    };
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("get-uniswap-pools function called");
    
    const pools = await fetchUniswapPools();

    return new Response(
      JSON.stringify({ pools }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching pools:", errorMessage);
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch pools", 
        details: errorMessage,
        pools: [] 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 with empty pools to avoid breaking UI
      }
    );
  }
});
