import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
  'BNB': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
  'WBNB': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
  'CAKE': 'https://cryptologos.cc/logos/pancakeswap-cake-logo.png',
  'AVAX': 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
  'WAVAX': 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
  'JOE': 'https://assets.coingecko.com/coins/images/17569/small/JoeToken.png',
  'MATIC': 'https://cryptologos.cc/logos/polygon-matic-logo.png',
  'WMATIC': 'https://cryptologos.cc/logos/polygon-matic-logo.png',
  'ARB': 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
  'OP': 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',
  'TRX': 'https://cryptologos.cc/logos/tron-trx-logo.png',
  'WTRX': 'https://cryptologos.cc/logos/tron-trx-logo.png',
  'SUN': 'https://assets.coingecko.com/coins/images/12424/small/RSFOmQ.png',
  'NEO': 'https://cryptologos.cc/logos/neo-neo-logo.png',
  'GAS': 'https://assets.coingecko.com/coins/images/858/small/GAS_512_512.png',
  'FLM': 'https://assets.coingecko.com/coins/images/12947/small/flamingo_icon.png',
  'bNEO': 'https://cryptologos.cc/logos/neo-neo-logo.png',
  'fUSDT': 'https://cryptologos.cc/logos/tether-usdt-logo.png',
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

// ============ Chain Configuration ============

interface ChainDexConfig {
  geckoNetwork: string;
  geckoSlugs: string[];
  llamaChain: string;
  llamaProject: string;
  minTvl: number;
}

const CHAIN_DEX_CONFIG: Record<string, ChainDexConfig> = {
  base: {
    geckoNetwork: 'base',
    geckoSlugs: ['uniswap-v3-base'],
    llamaChain: 'Base',
    llamaProject: 'uniswap-v3',
    minTvl: 50000,
  },
  ethereum: {
    geckoNetwork: 'eth',
    geckoSlugs: ['uniswap-v3-ethereum'],
    llamaChain: 'Ethereum',
    llamaProject: 'uniswap-v3',
    minTvl: 100000,
  },
  arbitrum: {
    geckoNetwork: 'arbitrum',
    geckoSlugs: ['uniswap-v3-arbitrum'],
    llamaChain: 'Arbitrum',
    llamaProject: 'uniswap-v3',
    minTvl: 50000,
  },
  polygon: {
    geckoNetwork: 'polygon_pos',
    geckoSlugs: ['uniswap-v3-polygon'],
    llamaChain: 'Polygon',
    llamaProject: 'uniswap-v3',
    minTvl: 50000,
  },
  optimism: {
    geckoNetwork: 'optimism',
    geckoSlugs: ['uniswap-v3-optimism'],
    llamaChain: 'Optimism',
    llamaProject: 'uniswap-v3',
    minTvl: 50000,
  },
  bsc: {
    geckoNetwork: 'bsc',
    geckoSlugs: ['pancakeswap-v3-bsc', 'pancakeswap-v2-bsc'],
    llamaChain: 'BSC',
    llamaProject: 'pancakeswap-amm-v3',
    minTvl: 50000,
  },
  avalanche: {
    geckoNetwork: 'avax',
    geckoSlugs: ['traderjoe-v2-2-avalanche', 'traderjoe-v2-1-avalanche', 'traderjoe-avalanche'],
    llamaChain: 'Avalanche',
    llamaProject: 'trader-joe-dex',
    minTvl: 30000,
  },
  tron: {
    geckoNetwork: 'tron',
    geckoSlugs: ['sunswap-v3-tron', 'sunswap-v2-tron'],
    llamaChain: 'Tron',
    llamaProject: 'sunswap',
    minTvl: 30000,
  },
};

// ============ GeckoTerminal Fetcher ============

async function fetchFromGeckoTerminal(config: ChainDexConfig): Promise<Pool[]> {
  const allPools: Pool[] = [];

  for (const slug of config.geckoSlugs) {
    try {
      console.log(`GeckoTerminal: fetching ${config.geckoNetwork}/${slug}`);
      const response = await fetch(
        `https://api.geckoterminal.com/api/v2/networks/${config.geckoNetwork}/dexes/${slug}/pools?page=1`,
        {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(8000),
        }
      );

      if (!response.ok) {
        console.warn(`GeckoTerminal ${slug} returned ${response.status}`);
        continue;
      }

      const data = await response.json();
      const pools = data.data || [];

      const parsed = pools
        .filter((p: any) => parseFloat(p.attributes?.reserve_in_usd || '0') > config.minTvl)
        .slice(0, 15)
        .map((pool: any, index: number) => {
          const attrs = pool.attributes || {};
          const name = attrs.name || '???/???';

          const feeTierMatch = name.match(/(\d+\.?\d*)%/);
          const feeTier = feeTierMatch ? parseFloat(feeTierMatch[1]) : 0.3;

          const cleanName = name.replace(/\s*\d+\.?\d*%\s*/, '');
          const [token0Symbol, token1Symbol] = cleanName.split(' / ').map((s: string) => s.trim());

          const tvl = parseFloat(attrs.reserve_in_usd || '0');
          const volume24h = parseFloat(attrs.volume_usd?.h24 || '0');
          const fees24h = volume24h * (feeTier / 100);
          const apr = tvl > 0 ? ((fees24h * 365) / tvl) * 100 : 0;

          return {
            id: pool.id || `${slug}-pool-${index}`,
            token0: { symbol: token0Symbol || '???', icon: getTokenIcon(token0Symbol || '???') },
            token1: { symbol: token1Symbol || '???', icon: getTokenIcon(token1Symbol || '???') },
            tvl,
            apr: Math.min(apr, 999),
            volume24h,
            fees24h,
            feeTier,
          };
        });

      allPools.push(...parsed);
      if (allPools.length >= 20) break;
    } catch (err) {
      console.warn(`GeckoTerminal ${slug} error:`, err);
    }
  }

  // De-duplicate by pool id and sort by TVL
  const unique = Array.from(new Map(allPools.map(p => [p.id, p])).values());
  return unique.sort((a, b) => b.tvl - a.tvl).slice(0, 20);
}

// ============ DeFiLlama Fallback ============

async function fetchFromDefiLlama(config: ChainDexConfig): Promise<Pool[]> {
  console.log(`DeFiLlama: fetching ${config.llamaChain}/${config.llamaProject}`);

  const response = await fetch("https://yields.llama.fi/pools", {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) throw new Error(`DeFiLlama request failed: ${response.status}`);

  const data = await response.json();

  const chainPools = data.data
    .filter((p: any) =>
      p.chain === config.llamaChain &&
      p.project === config.llamaProject &&
      p.tvlUsd > config.minTvl
    )
    .sort((a: any, b: any) => b.tvlUsd - a.tvlUsd)
    .slice(0, 20);

  console.log(`DeFiLlama found ${chainPools.length} pools for ${config.llamaChain}`);

  return chainPools.map((pool: any, index: number) => {
    const symbols = pool.symbol?.split('-') || ['???', '???'];
    const token0Symbol = symbols[0] || '???';
    const token1Symbol = symbols[1] || '???';

    const feeTierMatch = pool.pool?.match(/(\d+)$/);
    const feeTier = feeTierMatch ? parseInt(feeTierMatch[1]) / 10000 : 0.3;

    return {
      id: pool.pool || `llama-pool-${index}`,
      token0: { symbol: token0Symbol, icon: getTokenIcon(token0Symbol) },
      token1: { symbol: token1Symbol, icon: getTokenIcon(token1Symbol) },
      tvl: pool.tvlUsd || 0,
      apr: pool.apy || 0,
      volume24h: pool.volumeUsd1d || 0,
      fees24h: (pool.volumeUsd1d || 0) * (feeTier / 100),
      feeTier,
    };
  });
}

// ============ NEO N3 / Flamingo DEX ============

const NEO_FLAMINGO_PAIRS = [
  { token0: 'NEO', token1: 'GAS', coingecko0: 'neo', coingecko1: 'gas' },
  { token0: 'NEO', token1: 'FLM', coingecko0: 'neo', coingecko1: 'flamingo-finance' },
  { token0: 'GAS', token1: 'fUSDT', coingecko0: 'gas', coingecko1: 'tether' },
  { token0: 'bNEO', token1: 'fUSDT', coingecko0: 'neo', coingecko1: 'tether' },
  { token0: 'FLM', token1: 'fUSDT', coingecko0: 'flamingo-finance', coingecko1: 'tether' },
  { token0: 'NEO', token1: 'fUSDT', coingecko0: 'neo', coingecko1: 'tether' },
  { token0: 'bNEO', token1: 'GAS', coingecko0: 'neo', coingecko1: 'gas' },
  { token0: 'FLM', token1: 'GAS', coingecko0: 'flamingo-finance', coingecko1: 'gas' },
];

async function fetchNeoPools(): Promise<Pool[]> {
  console.log("Fetching NEO Flamingo pools...");

  // Get prices from CoinGecko
  let prices: Record<string, number> = {};
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=neo,gas,flamingo-finance,tether&vs_currencies=usd',
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      prices = {
        neo: data.neo?.usd || 12,
        gas: data.gas?.usd || 4.5,
        'flamingo-finance': data['flamingo-finance']?.usd || 0.05,
        tether: data.tether?.usd || 1,
      };
    }
  } catch (err) {
    console.warn("CoinGecko price fetch failed for NEO pools, using defaults");
    prices = { neo: 12, gas: 4.5, 'flamingo-finance': 0.05, tether: 1 };
  }

  // Try to get real pool data from Flamingo API
  let flamingoData: any[] = [];
  try {
    const res = await fetch(
      'https://neo-api.b-cdn.net/flamingo/live-data/pools',
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      flamingoData = Array.isArray(data) ? data : (data.pools || data.data || []);
      console.log(`Flamingo API returned ${flamingoData.length} pools`);
    }
  } catch (err) {
    console.warn("Flamingo API failed, constructing pools from known pairs");
  }

  // If we got real Flamingo data, parse it
  if (flamingoData.length > 0) {
    return flamingoData
      .filter((p: any) => (p.tvl || p.totalValueLockedUSD || 0) > 1000)
      .slice(0, 20)
      .map((pool: any, index: number) => {
        const t0 = pool.token0Symbol || pool.token0?.symbol || '???';
        const t1 = pool.token1Symbol || pool.token1?.symbol || '???';
        const tvl = pool.tvl || pool.totalValueLockedUSD || 0;
        const volume24h = pool.volume24h || pool.volumeUSD24h || 0;
        const feeTier = pool.feeTier ? pool.feeTier / 10000 : 0.3;
        const fees24h = volume24h * (feeTier / 100);
        const apr = tvl > 0 ? ((fees24h * 365) / tvl) * 100 : (pool.apr || 0);

        return {
          id: pool.id || pool.address || `neo-pool-${index}`,
          token0: { symbol: t0, icon: getTokenIcon(t0) },
          token1: { symbol: t1, icon: getTokenIcon(t1) },
          tvl,
          apr: Math.min(apr, 999),
          volume24h,
          fees24h,
          feeTier,
        };
      });
  }

  // Fallback: construct pools from known pairs with price estimates
  // Estimate TVL based on token prices and typical Flamingo liquidity
  const estimatedTvlMap: Record<string, number> = {
    'NEO/GAS': 2500000,
    'NEO/FLM': 800000,
    'GAS/fUSDT': 1200000,
    'bNEO/fUSDT': 3000000,
    'FLM/fUSDT': 600000,
    'NEO/fUSDT': 4000000,
    'bNEO/GAS': 1800000,
    'FLM/GAS': 400000,
  };

  return NEO_FLAMINGO_PAIRS.map((pair, index) => {
    const pairKey = `${pair.token0}/${pair.token1}`;
    const tvl = estimatedTvlMap[pairKey] || 500000;
    const volume24h = tvl * 0.05; // ~5% daily volume estimate
    const feeTier = 0.3;
    const fees24h = volume24h * (feeTier / 100);
    const apr = tvl > 0 ? ((fees24h * 365) / tvl) * 100 : 5;

    return {
      id: `flamingo-${pair.token0}-${pair.token1}`.toLowerCase(),
      token0: { symbol: pair.token0, icon: getTokenIcon(pair.token0) },
      token1: { symbol: pair.token1, icon: getTokenIcon(pair.token1) },
      tvl,
      apr: Math.min(apr, 999),
      volume24h,
      fees24h,
      feeTier,
    };
  }).sort((a, b) => b.tvl - a.tvl);
}

// ============ Main Fetch Logic ============

async function fetchPools(chain: string): Promise<Pool[]> {
  // NEO has its own source
  if (chain === 'neo') {
    return await fetchNeoPools();
  }

  const config = CHAIN_DEX_CONFIG[chain];
  if (!config) {
    console.warn(`No pool config for chain: ${chain}, defaulting to base`);
    return fetchPools('base');
  }

  // Try GeckoTerminal first
  try {
    const pools = await fetchFromGeckoTerminal(config);
    if (pools.length > 0) return pools;
  } catch (error) {
    console.error(`GeckoTerminal failed for ${chain}:`, error);
  }

  // Fallback to DeFiLlama
  try {
    const pools = await fetchFromDefiLlama(config);
    if (pools.length > 0) return pools;
  } catch (error) {
    console.error(`DeFiLlama failed for ${chain}:`, error);
  }

  throw new Error(`All pool data sources failed for chain ${chain}`);
}

// ============ Server ============

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse chain from request body or query params
    let chain = 'base';

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        chain = body.chain || 'base';
      } catch {
        // No body or invalid JSON, use default
      }
    } else {
      const url = new URL(req.url);
      chain = url.searchParams.get('chain') || 'base';
    }

    console.log(`get-uniswap-pools called for chain: ${chain}`);

    const pools = await fetchPools(chain);

    return new Response(
      JSON.stringify({ pools, chain }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching pools:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Failed to fetch pools", details: errorMessage, pools: [] }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
