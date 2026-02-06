// Token configuration for each chain
export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
  coingeckoId?: string;
}

// Base tokens (existing)
export const BASE_TOKENS: Token[] = [
  { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '⟠', coingeckoId: 'ethereum' },
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', decimals: 18, icon: '⟠', coingeckoId: 'ethereum' },
  { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, icon: '💵', coingeckoId: 'usd-coin' },
  { symbol: 'USDbC', name: 'USD Base Coin', address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', decimals: 6, icon: '💵', coingeckoId: 'usd-coin' },
  { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18, icon: '🔶', coingeckoId: 'dai' },
  { symbol: 'USDT', name: 'Tether USD', address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', decimals: 6, icon: '💲', coingeckoId: 'tether' },
  { symbol: 'cbETH', name: 'Coinbase Wrapped Staked ETH', address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', decimals: 18, icon: '🔵', coingeckoId: 'coinbase-wrapped-staked-eth' },
  { symbol: 'wstETH', name: 'Wrapped stETH', address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452', decimals: 18, icon: '🔷', coingeckoId: 'wrapped-steth' },
  { symbol: 'rETH', name: 'Rocket Pool ETH', address: '0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c', decimals: 18, icon: '🚀', coingeckoId: 'rocket-pool-eth' },
  { symbol: 'AERO', name: 'Aerodrome', address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', decimals: 18, icon: '✈️', coingeckoId: 'aerodrome-finance' },
  { symbol: 'BRETT', name: 'Brett', address: '0x532f27101965dd16442E59d40670FaF5eBB142E4', decimals: 18, icon: '🐸', coingeckoId: 'brett' },
  { symbol: 'DEGEN', name: 'Degen', address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', decimals: 18, icon: '🎩', coingeckoId: 'degen-base' },
  { symbol: 'VIRTUAL', name: 'Virtual Protocol', address: '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b', decimals: 18, icon: '🎮', coingeckoId: 'virtual-protocol' },
  { symbol: 'UNI', name: 'Uniswap', address: '0xc3De830EA07524a0761646a6a4e4be0e114a3C83', decimals: 18, icon: '🦄', coingeckoId: 'uniswap' },
  { symbol: 'LINK', name: 'Chainlink', address: '0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196', decimals: 18, icon: '🔗', coingeckoId: 'chainlink' },
];

// Ethereum Mainnet tokens
export const ETHEREUM_TOKENS: Token[] = [
  { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '⟠', coingeckoId: 'ethereum' },
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, icon: '⟠', coingeckoId: 'ethereum' },
  { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, icon: '💵', coingeckoId: 'usd-coin' },
  { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, icon: '💲', coingeckoId: 'tether' },
  { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EescdCF505fBAE0D', decimals: 18, icon: '🔶', coingeckoId: 'dai' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, icon: '₿', coingeckoId: 'wrapped-bitcoin' },
  { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, icon: '🦄', coingeckoId: 'uniswap' },
  { symbol: 'LINK', name: 'Chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, icon: '🔗', coingeckoId: 'chainlink' },
  { symbol: 'AAVE', name: 'Aave', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18, icon: '👻', coingeckoId: 'aave' },
  { symbol: 'MKR', name: 'Maker', address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', decimals: 18, icon: '🏛️', coingeckoId: 'maker' },
];

// Arbitrum tokens
export const ARBITRUM_TOKENS: Token[] = [
  { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '⟠', coingeckoId: 'ethereum' },
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18, icon: '⟠', coingeckoId: 'ethereum' },
  { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6, icon: '💵', coingeckoId: 'usd-coin' },
  { symbol: 'USDT', name: 'Tether USD', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6, icon: '💲', coingeckoId: 'tether' },
  { symbol: 'ARB', name: 'Arbitrum', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18, icon: '🔷', coingeckoId: 'arbitrum' },
  { symbol: 'GMX', name: 'GMX', address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a', decimals: 18, icon: '📊', coingeckoId: 'gmx' },
  { symbol: 'MAGIC', name: 'Magic', address: '0x539bdE0d7Dbd336b79148AA742883198BBF60342', decimals: 18, icon: '✨', coingeckoId: 'magic' },
];

// Polygon tokens
export const POLYGON_TOKENS: Token[] = [
  { symbol: 'MATIC', name: 'Polygon', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '💜', coingeckoId: 'matic-network' },
  { symbol: 'WMATIC', name: 'Wrapped MATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18, icon: '💜', coingeckoId: 'matic-network' },
  { symbol: 'USDC', name: 'USD Coin', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6, icon: '💵', coingeckoId: 'usd-coin' },
  { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6, icon: '💲', coingeckoId: 'tether' },
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18, icon: '⟠', coingeckoId: 'ethereum' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', decimals: 8, icon: '₿', coingeckoId: 'wrapped-bitcoin' },
];

// BNB Chain tokens
export const BSC_TOKENS: Token[] = [
  { symbol: 'BNB', name: 'BNB', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '🟡', coingeckoId: 'binancecoin' },
  { symbol: 'WBNB', name: 'Wrapped BNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18, icon: '🟡', coingeckoId: 'binancecoin' },
  { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, icon: '💲', coingeckoId: 'tether' },
  { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18, icon: '💵', coingeckoId: 'usd-coin' },
  { symbol: 'BUSD', name: 'Binance USD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18, icon: '💵', coingeckoId: 'binance-usd' },
  { symbol: 'CAKE', name: 'PancakeSwap', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', decimals: 18, icon: '🥞', coingeckoId: 'pancakeswap-token' },
  { symbol: 'ETH', name: 'Ethereum', address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', decimals: 18, icon: '⟠', coingeckoId: 'ethereum' },
  { symbol: 'BTCB', name: 'Bitcoin BEP2', address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', decimals: 18, icon: '₿', coingeckoId: 'binance-bitcoin' },
  { symbol: 'XRP', name: 'XRP', address: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE', decimals: 18, icon: '💧', coingeckoId: 'ripple' },
  { symbol: 'ADA', name: 'Cardano', address: '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47', decimals: 18, icon: '🔵', coingeckoId: 'cardano' },
  { symbol: 'DOT', name: 'Polkadot', address: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402', decimals: 18, icon: '⬛', coingeckoId: 'polkadot' },
  { symbol: 'LINK', name: 'Chainlink', address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD', decimals: 18, icon: '🔗', coingeckoId: 'chainlink' },
  { symbol: 'UNI', name: 'Uniswap', address: '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1', decimals: 18, icon: '🦄', coingeckoId: 'uniswap' },
  { symbol: 'DOGE', name: 'Dogecoin', address: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', decimals: 8, icon: '🐕', coingeckoId: 'dogecoin' },
  { symbol: 'SHIB', name: 'Shiba Inu', address: '0x2859e4544C4bB03966803b044A93563Bd2D0DD4D', decimals: 18, icon: '🐶', coingeckoId: 'shiba-inu' },
  { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', decimals: 18, icon: '🔶', coingeckoId: 'dai' },
  { symbol: 'XVS', name: 'Venus', address: '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63', decimals: 18, icon: '🪐', coingeckoId: 'venus' },
  { symbol: 'TWT', name: 'Trust Wallet', address: '0x4B0F1812e5Df2A09796481Ff14017e6005508003', decimals: 18, icon: '🛡️', coingeckoId: 'trust-wallet-token' },
];

// Optimism tokens
export const OPTIMISM_TOKENS: Token[] = [
  { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '⟠', coingeckoId: 'ethereum' },
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', decimals: 18, icon: '⟠', coingeckoId: 'ethereum' },
  { symbol: 'USDC', name: 'USD Coin', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6, icon: '💵', coingeckoId: 'usd-coin' },
  { symbol: 'USDT', name: 'Tether USD', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6, icon: '💲', coingeckoId: 'tether' },
  { symbol: 'OP', name: 'Optimism', address: '0x4200000000000000000000000000000000000042', decimals: 18, icon: '🔴', coingeckoId: 'optimism' },
  { symbol: 'SNX', name: 'Synthetix', address: '0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4', decimals: 18, icon: '💠', coingeckoId: 'havven' },
];

// Avalanche tokens
export const AVALANCHE_TOKENS: Token[] = [
  { symbol: 'AVAX', name: 'Avalanche', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '🔺', coingeckoId: 'avalanche-2' },
  { symbol: 'WAVAX', name: 'Wrapped AVAX', address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', decimals: 18, icon: '🔺', coingeckoId: 'avalanche-2' },
  { symbol: 'USDC', name: 'USD Coin', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6, icon: '💵', coingeckoId: 'usd-coin' },
  { symbol: 'USDT', name: 'Tether USD', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', decimals: 6, icon: '💲', coingeckoId: 'tether' },
  { symbol: 'JOE', name: 'Trader Joe', address: '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd', decimals: 18, icon: '🦜', coingeckoId: 'joe' },
  { symbol: 'WETH.e', name: 'Wrapped Ether', address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', decimals: 18, icon: '⟠', coingeckoId: 'ethereum' },
];

// TRON tokens (TRC-20)
export const TRON_TOKENS: Token[] = [
  { symbol: 'TRX', name: 'TRON', address: 'native', decimals: 6, icon: '♦️', coingeckoId: 'tron' },
  { symbol: 'USDT', name: 'Tether USD', address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', decimals: 6, icon: '💲', coingeckoId: 'tether' },
  { symbol: 'USDC', name: 'USD Coin', address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8', decimals: 6, icon: '💵', coingeckoId: 'usd-coin' },
  { symbol: 'USDD', name: 'USDD', address: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn', decimals: 18, icon: '💵', coingeckoId: 'usdd' },
  { symbol: 'BTT', name: 'BitTorrent', address: 'TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4', decimals: 18, icon: '🔷', coingeckoId: 'bittorrent' },
  { symbol: 'JST', name: 'JUST', address: 'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9', decimals: 18, icon: '⚖️', coingeckoId: 'just' },
  { symbol: 'SUN', name: 'SUN', address: 'TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S', decimals: 18, icon: '☀️', coingeckoId: 'sun-token' },
  { symbol: 'WIN', name: 'WINkLink', address: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7', decimals: 6, icon: '🎰', coingeckoId: 'wink' },
  { symbol: 'WTRX', name: 'Wrapped TRX', address: 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR', decimals: 6, icon: '♦️', coingeckoId: 'tron' },
];

// NEO tokens (NEP-17)
export const NEO_TOKENS: Token[] = [
  { symbol: 'NEO', name: 'NEO', address: '0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5', decimals: 0, icon: '💚', coingeckoId: 'neo' },
  { symbol: 'GAS', name: 'GAS', address: '0xd2a4cff31913016155e38e474a2c06d08be276cf', decimals: 8, icon: '⛽', coingeckoId: 'gas' },
  { symbol: 'FLM', name: 'Flamingo', address: '0xf0151f528127558851b39c2cd8aa47da7418ab28', decimals: 8, icon: '🦩', coingeckoId: 'flamingo-finance' },
  { symbol: 'fUSDT', name: 'fUSDT', address: '0xcd48b160c1bbc9d74997b803b9a7ad50a4bef020', decimals: 6, icon: '💲', coingeckoId: 'tether' },
  { symbol: 'bNEO', name: 'Burger NEO', address: '0x48c40d4666f93408be1bef038b6722404d9a4c2a', decimals: 8, icon: '🍔', coingeckoId: 'neo' },
  { symbol: 'SWTH', name: 'Switcheo', address: '0x78e1330db47634afdb5ea455302ba2d12b8d549d', decimals: 8, icon: '🔄', coingeckoId: 'switcheo' },
];

// Token map by chain ID
export const TOKENS_BY_CHAIN: Record<string, Token[]> = {
  base: BASE_TOKENS,
  ethereum: ETHEREUM_TOKENS,
  arbitrum: ARBITRUM_TOKENS,
  polygon: POLYGON_TOKENS,
  bsc: BSC_TOKENS,
  optimism: OPTIMISM_TOKENS,
  avalanche: AVALANCHE_TOKENS,
  tron: TRON_TOKENS,
  neo: NEO_TOKENS,
};

// Get tokens for a specific chain
export const getTokensForChain = (chainId: string): Token[] => {
  return TOKENS_BY_CHAIN[chainId] || [];
};

// Get native token for a chain
export const getNativeToken = (chainId: string): Token | undefined => {
  const tokens = getTokensForChain(chainId);
  return tokens.find((t) => t.address === '0x0000000000000000000000000000000000000000' || t.address === 'native');
};

// Get stablecoins for a chain
export const getStablecoins = (chainId: string): Token[] => {
  const tokens = getTokensForChain(chainId);
  return tokens.filter((t) => ['USDC', 'USDT', 'DAI', 'BUSD', 'USDD', 'fUSDT'].includes(t.symbol));
};
