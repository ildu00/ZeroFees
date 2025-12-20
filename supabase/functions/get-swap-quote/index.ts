import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token config on Base with decimals and CoinGecko IDs
const TOKEN_CONFIG: Record<string, { address: string; decimals: number; coingeckoId?: string }> = {
  // Native & Wrapped ETH
  ETH: { address: "0x0000000000000000000000000000000000000000", decimals: 18, coingeckoId: "ethereum" },
  WETH: { address: "0x4200000000000000000000000000000000000006", decimals: 18, coingeckoId: "ethereum" },
  
  // Stablecoins
  USDC: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, coingeckoId: "usd-coin" },
  USDbC: { address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", decimals: 6 },
  DAI: { address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18, coingeckoId: "dai" },
  USDT: { address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", decimals: 6, coingeckoId: "tether" },
  crvUSD: { address: "0x417Ac0e078398C154EdFadD9Ef675d30Be60Af93", decimals: 18, coingeckoId: "crvusd" },
  EURC: { address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42", decimals: 6, coingeckoId: "euro-coin" },
  
  // LST / LRT
  cbETH: { address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22", decimals: 18, coingeckoId: "coinbase-wrapped-staked-eth" },
  wstETH: { address: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452", decimals: 18, coingeckoId: "wrapped-steth" },
  rETH: { address: "0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c", decimals: 18, coingeckoId: "rocket-pool-eth" },
  ezETH: { address: "0x2416092f143378750bb29b79eD961ab195CcEea5", decimals: 18, coingeckoId: "renzo-restaked-eth" },
  weETH: { address: "0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A", decimals: 18, coingeckoId: "wrapped-eeth" },
  
  // DeFi Tokens
  AERO: { address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", decimals: 18, coingeckoId: "aerodrome-finance" },
  WELL: { address: "0xA88594D404727625A9437C3f886C7643872296AE", decimals: 18, coingeckoId: "moonwell-artemis" },
  MORPHO: { address: "0xBAa5CC21fd487B8Fcc2F632f3F4E8D37262a0842", decimals: 18, coingeckoId: "morpho" },
  SEAM: { address: "0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85", decimals: 18, coingeckoId: "seamless-protocol" },
  EXTRA: { address: "0x2dAD3a13ef0C6366220f989157009e501e7938F8", decimals: 18, coingeckoId: "extra-finance" },
  BSWAP: { address: "0x78a087d713Be963Bf307b18F2Ff8122EF9A63ae9", decimals: 18, coingeckoId: "baseswap" },
  ALB: { address: "0x1dd2d631c92b1aCdFCDd51A0F7145A50130050C4", decimals: 18, coingeckoId: "alien-base" },
  
  // Memecoins
  BRETT: { address: "0x532f27101965dd16442E59d40670FaF5eBB142E4", decimals: 18, coingeckoId: "brett" },
  DEGEN: { address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", decimals: 18, coingeckoId: "degen-base" },
  TOSHI: { address: "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4", decimals: 18, coingeckoId: "toshi" },
  HIGHER: { address: "0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe", decimals: 18, coingeckoId: "higher" },
  NORMIE: { address: "0x7F12d13B34F5F4f0a9449c16Bcd42f0da47AF200", decimals: 9, coingeckoId: "normie-base" },
  MOCHI: { address: "0xF6e932Ca12afa26665dC4dDE7e27be02A7c02e50", decimals: 18, coingeckoId: "mochi-base" },
  KEYCAT: { address: "0x9a26F5433671751C3276a065f57e5a02D2817973", decimals: 18, coingeckoId: "keyboard-cat" },
  TYBG: { address: "0x0d97F261b1e88845184f678e2d1e7a98D9FD38dE", decimals: 18, coingeckoId: "base-god" },
  DOGINME: { address: "0x6921B130D297cc43754afba22e5EAc0FBf8Db75b", decimals: 18, coingeckoId: "doginme" },
  BENJI: { address: "0xBC45647eA894030a4E9801Ec03479739FA2485F0", decimals: 18, coingeckoId: "basenji" },
  MFER: { address: "0xE3086852A4B125803C815a158249ae468A3254Ca", decimals: 18, coingeckoId: "mfercoin" },
  BASED: { address: "0x32E0f9d26D1e33625742A52620cC76C1130efDE6", decimals: 18, coingeckoId: "based-markets" },
  BALD: { address: "0x27D2DECb4bFC9C76F0309b8E88dec3a601Fe25a8", decimals: 18, coingeckoId: "bald" },
  DINO: { address: "0x85E90a5430AF45776548ADB82eE4cD9E33B08077", decimals: 18, coingeckoId: "dino-base" },
  CHOMP: { address: "0x1a0B71A88d25dB40c8f59F24eB6424dD3D5e4aF9", decimals: 18, coingeckoId: "chomp" },
  SKI: { address: "0x768BE13e1680b5ebE0024C42c896E3dB59ec0149", decimals: 18, coingeckoId: "ski-mask-dog" },
  WEIRDO: { address: "0x76c02803c135b9aF79B9df597b83c2B37b3e74fc", decimals: 18, coingeckoId: "weirdo" },
  
  // Gaming / Social
  VIRTUAL: { address: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b", decimals: 18, coingeckoId: "virtual-protocol" },
  FRIEND: { address: "0x0BD4887f7D41B35CD75DFF9FfEE2856106f86670", decimals: 18, coingeckoId: "friend-tech" },
  
  // Other Popular DeFi
  SNX: { address: "0x22e6966B799c4D5B13BE962E1D117b56327FDa66", decimals: 18, coingeckoId: "havven" },
  COMP: { address: "0x9e1028F5F1D5eDE59748FFceE5532509976840E0", decimals: 18, coingeckoId: "compound-governance-token" },
  YFI: { address: "0x9EaF8C1E34F05a589EDa6BAfdF391Cf6Ad3CB239", decimals: 18, coingeckoId: "yearn-finance" },
  UNI: { address: "0xc3De830EA07524a0761646a6a4e4be0e114a3C83", decimals: 18, coingeckoId: "uniswap" },
  LINK: { address: "0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196", decimals: 18, coingeckoId: "chainlink" },
  CRV: { address: "0x8Ee73c484A26e0A5df2Ee2a4960B789967dd0415", decimals: 18, coingeckoId: "curve-dao-token" },
  BAL: { address: "0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2", decimals: 18, coingeckoId: "balancer" },
  LDO: { address: "0xfA980cEd6895AC314E7dE34Ef1bFAE90a5AdD21b", decimals: 18, coingeckoId: "lido-dao" },
  PENDLE: { address: "0xBC5B59EA1b6f8Da8258615EE38D40e999EC5D74F", decimals: 18, coingeckoId: "pendle" },
};

// Get all unique CoinGecko IDs
function getCoingeckoIds(): string[] {
  const ids = new Set<string>();
  for (const config of Object.values(TOKEN_CONFIG)) {
    if (config.coingeckoId) {
      ids.add(config.coingeckoId);
    }
  }
  return Array.from(ids);
}

// Default prices as fallback
const DEFAULT_PRICES: Record<string, number> = {
  ethereum: 2500,
  "usd-coin": 1,
  dai: 1,
  tether: 1,
  crvusd: 1,
  "euro-coin": 1.1,
  "coinbase-wrapped-staked-eth": 2700,
  "wrapped-steth": 2700,
  "rocket-pool-eth": 2700,
  "renzo-restaked-eth": 2600,
  "wrapped-eeth": 2600,
  "aerodrome-finance": 0.5,
  "moonwell-artemis": 0.03,
  morpho: 1.5,
  "seamless-protocol": 0.02,
  "extra-finance": 0.1,
  baseswap: 0.01,
  "alien-base": 0.005,
  brett: 0.1,
  "degen-base": 0.01,
  toshi: 0.0001,
  higher: 0.02,
  "normie-base": 0.01,
  "mochi-base": 0.001,
  "keyboard-cat": 0.001,
  "base-god": 0.0001,
  doginme: 0.001,
  basenji: 0.01,
  mfercoin: 0.001,
  "based-markets": 0.01,
  bald: 0.001,
  "dino-base": 0.001,
  chomp: 0.001,
  "ski-mask-dog": 0.001,
  weirdo: 0.001,
  "virtual-protocol": 1.5,
  "friend-tech": 0.5,
  havven: 2,
  "compound-governance-token": 50,
  "yearn-finance": 7000,
  uniswap: 10,
  chainlink: 15,
  "curve-dao-token": 0.5,
  balancer: 3,
  "lido-dao": 1.5,
  pendle: 4,
};

// Get token prices from CoinGecko
async function getTokenPrices(): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  
  try {
    const ids = getCoingeckoIds();
    const idsString = ids.join(",");
    
    console.log("Fetching prices for:", ids.length, "tokens");
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      console.error("CoinGecko API error:", response.status);
      throw new Error("CoinGecko API error");
    }
    
    const data = await response.json();
    console.log("CoinGecko response keys:", Object.keys(data).length);
    
    // Map prices to token symbols
    for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
      if (config.coingeckoId && data[config.coingeckoId]?.usd) {
        prices[symbol] = data[config.coingeckoId].usd;
      } else if (config.coingeckoId && DEFAULT_PRICES[config.coingeckoId]) {
        prices[symbol] = DEFAULT_PRICES[config.coingeckoId];
      } else if (symbol === "USDbC") {
        prices[symbol] = 1; // Stablecoin
      } else {
        prices[symbol] = 0;
      }
    }
    
    return prices;
  } catch (error) {
    console.error("Error fetching prices:", error);
    
    // Return default prices on error
    for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
      if (config.coingeckoId && DEFAULT_PRICES[config.coingeckoId]) {
        prices[symbol] = DEFAULT_PRICES[config.coingeckoId];
      } else if (symbol === "USDbC") {
        prices[symbol] = 1;
      } else {
        prices[symbol] = 0;
      }
    }
    
    return prices;
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
  
  if (priceIn === 0 || priceOut === 0) {
    throw new Error("Price not available for token");
  }
  
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
