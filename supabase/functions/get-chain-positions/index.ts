import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Trader Joe V2 subgraph (Avalanche)
const JOE_V2_SUBGRAPH = 'https://api.goldsky.com/api/public/project_clnbo3e3c16lj33xva5r23iu6/subgraphs/joe-v2-avax/prod/gn';

// Flamingo API (NEO N3)
const FLAMINGO_POOLS_API = 'https://neo-api.b-cdn.net/flamingo/live-data/pools';

// Token icon map
const TOKEN_ICONS: Record<string, string> = {
  'WAVAX': 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
  'AVAX': 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
  'USDC': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  'USDC.e': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  'USDT': 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  'USDT.e': 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  'WETH.e': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  'WBTC.e': 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png',
  'DAI.e': 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
  'JOE': 'https://cryptologos.cc/logos/joe-joe-logo.png',
  'sAVAX': 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
  'NEO': 'https://cryptologos.cc/logos/neo-neo-logo.png',
  'GAS': 'https://cryptologos.cc/logos/gas-gas-logo.png',
  'FLM': 'https://flamingo.finance/assets/tokens/FLM.png',
  'fUSDT': 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  'bNEO': 'https://cryptologos.cc/logos/neo-neo-logo.png',
};

function getIcon(symbol: string): string {
  return TOKEN_ICONS[symbol] || `https://ui-avatars.com/api/?name=${symbol.slice(0, 2)}&background=6366f1&color=fff&size=64`;
}

// Fetch Avalanche Trader Joe LB positions from subgraph
async function fetchAvalanchePositions(userAddress: string) {
  try {
    const query = `{
      user(id: "${userAddress.toLowerCase()}") {
        liquidityPositions(first: 50, where: { liquidityTokenBalance_gt: "0" }) {
          id
          liquidityTokenBalance
          pair {
            id
            token0 { id symbol name decimals }
            token1 { id symbol name decimals }
          }
        }
      }
    }`;

    // Try Joe V2 subgraph
    const response = await fetch(JOE_V2_SUBGRAPH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.data?.user?.liquidityPositions) {
        return data.data.user.liquidityPositions.map((pos: any, index: number) => ({
          tokenId: `joe-${index}`,
          token0: {
            address: pos.pair.token0.id,
            symbol: pos.pair.token0.symbol,
            icon: getIcon(pos.pair.token0.symbol),
          },
          token1: {
            address: pos.pair.token1.id,
            symbol: pos.pair.token1.symbol,
            icon: getIcon(pos.pair.token1.symbol),
          },
          fee: 0.003,
          tickLower: 0,
          tickUpper: 0,
          liquidity: pos.liquidityTokenBalance || '0',
          tokensOwed0: '0',
          tokensOwed1: '0',
          inRange: true,
          dexName: 'Trader Joe',
          chainType: 'trader-joe-lb',
          pairAddress: pos.pair.id,
        }));
      }
    }
  } catch (e) {
    console.error('Subgraph query failed:', e);
  }

  // Fallback: try alternative API
  try {
    const response = await fetch(
      `https://barn.traderjoexyz.com/v1/user/${userAddress.toLowerCase()}/pool?chainId=43114`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.filter((p: any) => parseFloat(p.balance || '0') > 0).map((pos: any, index: number) => ({
          tokenId: `joe-${index}`,
          token0: {
            address: pos.tokenX?.address || '',
            symbol: pos.tokenX?.symbol || 'Token0',
            icon: getIcon(pos.tokenX?.symbol || ''),
          },
          token1: {
            address: pos.tokenY?.address || '',
            symbol: pos.tokenY?.symbol || 'Token1',
            icon: getIcon(pos.tokenY?.symbol || ''),
          },
          fee: (pos.binStep || 20) / 10000,
          tickLower: 0,
          tickUpper: 0,
          liquidity: pos.balance || '0',
          tokensOwed0: '0',
          tokensOwed1: '0',
          inRange: true,
          dexName: 'Trader Joe',
          chainType: 'trader-joe-lb',
          pairAddress: pos.pairAddress || '',
          binStep: pos.binStep || 20,
        }));
      }
    }
  } catch (e) {
    console.error('Barn API failed:', e);
  }

  return [];
}

// Fetch NEO Flamingo pool info
async function fetchNeoPoolInfo() {
  try {
    const response = await fetch(FLAMINGO_POOLS_API);
    if (!response.ok) return [];
    const pools = await response.json();

    if (!Array.isArray(pools)) return [];

    return pools
      .filter((pool: any) => pool.token0 && pool.token1)
      .map((pool: any) => ({
        poolHash: pool.poolHash || pool.hash || '',
        lpToken: pool.lpToken || pool.poolHash || '',
        token0: {
          address: pool.token0.hash || pool.token0.contractHash || '',
          symbol: pool.token0.symbol || 'Token0',
          decimals: pool.token0.decimals || 8,
          icon: getIcon(pool.token0.symbol || ''),
        },
        token1: {
          address: pool.token1.hash || pool.token1.contractHash || '',
          symbol: pool.token1.symbol || 'Token1',
          decimals: pool.token1.decimals || 8,
          icon: getIcon(pool.token1.symbol || ''),
        },
        fee: pool.fee || 0.003,
        tvl: pool.tvl || '0',
        volume24h: pool.volume24h || '0',
      }));
  } catch (e) {
    console.error('Flamingo API error:', e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chain, address } = await req.json();

    if (!chain || !address) {
      return new Response(
        JSON.stringify({ error: 'Missing chain or address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: any = {};

    switch (chain) {
      case 'avalanche': {
        const positions = await fetchAvalanchePositions(address);
        result = { positions };
        break;
      }
      case 'neo': {
        const pools = await fetchNeoPoolInfo();
        result = { pools };
        break;
      }
      default:
        result = { error: `Unsupported chain: ${chain}` };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
