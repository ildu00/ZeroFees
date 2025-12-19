import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multiple subgraph endpoints to try (fallback approach)
const SUBGRAPH_ENDPOINTS = [
  // Oku Trade public API for Base (no API key required)
  "https://api.oku.trade/v1/base/pools",
];

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
  'TOSHI': 'https://assets.coingecko.com/coins/images/31126/small/toshi.png',
  'VIRTUAL': 'https://assets.coingecko.com/coins/images/36382/small/VIRTUAL.png',
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

// Fetch from DeFiLlama yields API (free, no API key)
async function fetchFromDefiLlama(): Promise<Pool[]> {
  console.log("Fetching from DeFiLlama pools API...");
  
  const response = await fetch("https://yields.llama.fi/pools", {
    headers: { 'Accept': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`DeFiLlama request failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Filter for Uniswap V3 pools on Base
  const basePools = data.data
    .filter((p: any) => 
      p.chain === 'Base' && 
      p.project === 'uniswap-v3' &&
      p.tvlUsd > 100000
    )
    .sort((a: any, b: any) => b.tvlUsd - a.tvlUsd)
    .slice(0, 20);
  
  console.log(`Found ${basePools.length} Uniswap V3 pools on Base from DeFiLlama`);
  
  return basePools.map((pool: any, index: number) => {
    // Parse symbol like "WETH-USDC" or "VIRTUAL-WETH"
    const symbols = pool.symbol?.split('-') || ['???', '???'];
    const token0Symbol = symbols[0] || '???';
    const token1Symbol = symbols[1] || '???';
    
    // Calculate fee tier from pool data if available
    const feeTierMatch = pool.pool?.match(/(\d+)$/);
    const feeTier = feeTierMatch ? parseInt(feeTierMatch[1]) / 10000 : 0.3;
    
    return {
      id: pool.pool || `pool-${index}`,
      token0: {
        symbol: token0Symbol,
        icon: getTokenIcon(token0Symbol),
      },
      token1: {
        symbol: token1Symbol,
        icon: getTokenIcon(token1Symbol),
      },
      tvl: pool.tvlUsd || 0,
      apr: pool.apy || 0,
      volume24h: pool.volumeUsd1d || 0,
      fees24h: (pool.volumeUsd1d || 0) * (feeTier / 100),
      feeTier,
    };
  });
}

// Alternative: use GeckoTerminal API (free, no API key)
async function fetchFromGeckoTerminal(): Promise<Pool[]> {
  console.log("Fetching from GeckoTerminal API...");
  
  const response = await fetch(
    "https://api.geckoterminal.com/api/v2/networks/base/dexes/uniswap-v3-base/pools?page=1",
    {
      headers: { 
        'Accept': 'application/json',
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`GeckoTerminal request failed: ${response.status}`);
  }
  
  const data = await response.json();
  const pools = data.data || [];
  
  console.log(`Found ${pools.length} pools from GeckoTerminal`);
  
  return pools
    .filter((p: any) => parseFloat(p.attributes?.reserve_in_usd || '0') > 100000)
    .slice(0, 20)
    .map((pool: any, index: number) => {
      const attrs = pool.attributes || {};
      const name = attrs.name || '???/???';
      const [token0Symbol, token1Symbol] = name.split(' / ').map((s: string) => s.trim());
      
      const tvl = parseFloat(attrs.reserve_in_usd || '0');
      const volume24h = parseFloat(attrs.volume_usd?.h24 || '0');
      
      // Extract fee tier from pool name or default to 0.3%
      const feeTierMatch = name.match(/(\d+\.\d+)%/);
      const feeTier = feeTierMatch ? parseFloat(feeTierMatch[1]) : 0.3;
      
      const fees24h = volume24h * (feeTier / 100);
      const apr = tvl > 0 ? ((fees24h * 365) / tvl) * 100 : 0;
      
      return {
        id: pool.id || `pool-${index}`,
        token0: {
          symbol: token0Symbol || '???',
          icon: getTokenIcon(token0Symbol || '???'),
        },
        token1: {
          symbol: token1Symbol || '???',
          icon: getTokenIcon(token1Symbol || '???'),
        },
        tvl,
        apr: Math.min(apr, 999),
        volume24h,
        fees24h,
        feeTier,
      };
    });
}

async function fetchPools(): Promise<Pool[]> {
  // Try GeckoTerminal first (more reliable)
  try {
    return await fetchFromGeckoTerminal();
  } catch (error) {
    console.error("GeckoTerminal failed:", error);
  }
  
  // Fallback to DeFiLlama
  try {
    return await fetchFromDefiLlama();
  } catch (error) {
    console.error("DeFiLlama failed:", error);
  }
  
  throw new Error("All pool data sources failed");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("get-uniswap-pools function called");
    
    const pools = await fetchPools();

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
        status: 200
      }
    );
  }
});
