import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletContext';
import { toast } from 'sonner';

// Base chain config
const BASE_CHAIN_ID = 8453;
const BASE_CHAIN_CONFIG = {
  chainId: '0x2105',
  chainName: 'Base',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
};

// Token addresses on Base (comprehensive list)
export const BASE_TOKENS: Record<string, { symbol: string; name: string; address: string; decimals: number; icon: string }> = {
  // Native & Wrapped ETH
  ETH: { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '⟠' },
  WETH: { symbol: 'WETH', name: 'Wrapped Ethereum', address: '0x4200000000000000000000000000000000000006', decimals: 18, icon: '⟠' },
  
  // Stablecoins
  USDC: { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, icon: '💲' },
  USDbC: { symbol: 'USDbC', name: 'USD Base Coin', address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', decimals: 6, icon: '💲' },
  DAI: { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18, icon: '◈' },
  USDT: { symbol: 'USDT', name: 'Tether USD', address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', decimals: 6, icon: '💵' },
  crvUSD: { symbol: 'crvUSD', name: 'Curve USD', address: '0x417Ac0e078398C154EdFadD9Ef675d30Be60Af93', decimals: 18, icon: '📈' },
  EURC: { symbol: 'EURC', name: 'Euro Coin', address: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42', decimals: 6, icon: '💶' },
  
  // LST / LRT
  cbETH: { symbol: 'cbETH', name: 'Coinbase Wrapped Staked ETH', address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', decimals: 18, icon: '🔵' },
  wstETH: { symbol: 'wstETH', name: 'Wrapped stETH', address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452', decimals: 18, icon: '🔷' },
  rETH: { symbol: 'rETH', name: 'Rocket Pool ETH', address: '0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c', decimals: 18, icon: '🚀' },
  ezETH: { symbol: 'ezETH', name: 'Renzo Restaked ETH', address: '0x2416092f143378750bb29b79eD961ab195CcEea5', decimals: 18, icon: '🔶' },
  weETH: { symbol: 'weETH', name: 'Wrapped eETH', address: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A', decimals: 18, icon: '🟢' },
  
  // DeFi Tokens
  AERO: { symbol: 'AERO', name: 'Aerodrome', address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', decimals: 18, icon: '✈️' },
  WELL: { symbol: 'WELL', name: 'Moonwell', address: '0xA88594D404727625A9437C3f886C7643872296AE', decimals: 18, icon: '🌙' },
  MORPHO: { symbol: 'MORPHO', name: 'Morpho', address: '0xBAa5CC21fd487B8Fcc2F632f3F4E8D37262a0842', decimals: 18, icon: '🦋' },
  SEAM: { symbol: 'SEAM', name: 'Seamless Protocol', address: '0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85', decimals: 18, icon: '🧵' },
  EXTRA: { symbol: 'EXTRA', name: 'Extra Finance', address: '0x2dAD3a13ef0C6366220f989157009e501e7938F8', decimals: 18, icon: '➕' },
  BSWAP: { symbol: 'BSWAP', name: 'BaseSwap', address: '0x78a087d713Be963Bf307b18F2Ff8122EF9A63ae9', decimals: 18, icon: '🔄' },
  ALB: { symbol: 'ALB', name: 'Alien Base', address: '0x1dd2d631c92b1aCdFCDd51A0F7145A50130050C4', decimals: 18, icon: '👽' },
  
  // Memecoins
  BRETT: { symbol: 'BRETT', name: 'Brett', address: '0x532f27101965dd16442E59d40670FaF5eBB142E4', decimals: 18, icon: '🐸' },
  DEGEN: { symbol: 'DEGEN', name: 'Degen', address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', decimals: 18, icon: '🎩' },
  TOSHI: { symbol: 'TOSHI', name: 'Toshi', address: '0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4', decimals: 18, icon: '🐱' },
  HIGHER: { symbol: 'HIGHER', name: 'Higher', address: '0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe', decimals: 18, icon: '⬆️' },
  NORMIE: { symbol: 'NORMIE', name: 'Normie', address: '0x7F12d13B34F5F4f0a9449c16Bcd42f0da47AF200', decimals: 9, icon: '😐' },
  MOCHI: { symbol: 'MOCHI', name: 'Mochi', address: '0xF6e932Ca12afa26665dC4dDE7e27be02A7c02e50', decimals: 18, icon: '🍡' },
  KEYCAT: { symbol: 'KEYCAT', name: 'Keyboard Cat', address: '0x9a26F5433671751C3276a065f57e5a02D2817973', decimals: 18, icon: '🐈' },
  TYBG: { symbol: 'TYBG', name: 'Base God', address: '0x0d97F261b1e88845184f678e2d1e7a98D9FD38dE', decimals: 18, icon: '🙏' },
  DOGINME: { symbol: 'DOGINME', name: 'doginme', address: '0x6921B130D297cc43754afba22e5EAc0FBf8Db75b', decimals: 18, icon: '🐕' },
  BENJI: { symbol: 'BENJI', name: 'Benji', address: '0xBC45647eA894030a4E9801Ec03479739FA2485F0', decimals: 18, icon: '🐶' },
  MFER: { symbol: 'MFER', name: 'mfercoin', address: '0xE3086852A4B125803C815a158249ae468A3254Ca', decimals: 18, icon: '😎' },
  BASED: { symbol: 'BASED', name: 'Based', address: '0x32E0f9d26D1e33625742A52620cC76C1130efDE6', decimals: 18, icon: '🔵' },
  BALD: { symbol: 'BALD', name: 'Bald', address: '0x27D2DECb4bFC9C76F0309b8E88dec3a601Fe25a8', decimals: 18, icon: '👨‍🦲' },
  DINO: { symbol: 'DINO', name: 'Dino', address: '0x85E90a5430AF45776548ADB82eE4cD9E33B08077', decimals: 18, icon: '🦖' },
  CHOMP: { symbol: 'CHOMP', name: 'Chomp', address: '0x1a0B71A88d25dB40c8f59F24eB6424dD3D5e4aF9', decimals: 18, icon: '🦈' },
  SKI: { symbol: 'SKI', name: 'Ski Mask Dog', address: '0x768BE13e1680b5ebE0024C42c896E3dB59ec0149', decimals: 18, icon: '🎿' },
  WEIRDO: { symbol: 'WEIRDO', name: 'Weirdo', address: '0x76c02803c135b9aF79B9df597b83c2B37b3e74fc', decimals: 18, icon: '🤪' },
  
  // Gaming / Social
  VIRTUAL: { symbol: 'VIRTUAL', name: 'Virtuals Protocol', address: '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b', decimals: 18, icon: '🎮' },
  FRIEND: { symbol: 'FRIEND', name: 'friend.tech', address: '0x0BD4887f7D41B35CD75DFF9FfEE2856106f86670', decimals: 18, icon: '🤝' },
  
  // Other Popular
  SNX: { symbol: 'SNX', name: 'Synthetix', address: '0x22e6966B799c4D5B13BE962E1D117b56327FDa66', decimals: 18, icon: '⚡' },
  COMP: { symbol: 'COMP', name: 'Compound', address: '0x9e1028F5F1D5eDE59748FFceE5532509976840E0', decimals: 18, icon: '🏦' },
  YFI: { symbol: 'YFI', name: 'yearn.finance', address: '0x9EaF8C1E34F05a589EDa6BAfdF391Cf6Ad3CB239', decimals: 18, icon: '🔵' },
  UNI: { symbol: 'UNI', name: 'Uniswap', address: '0xc3De830EA07524a0761646a6a4e4be0e114a3C83', decimals: 18, icon: '🦄' },
  LINK: { symbol: 'LINK', name: 'Chainlink', address: '0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196', decimals: 18, icon: '🔗' },
  CRV: { symbol: 'CRV', name: 'Curve DAO', address: '0x8Ee73c484A26e0A5df2Ee2a4960B789967dd0415', decimals: 18, icon: '📉' },
  BAL: { symbol: 'BAL', name: 'Balancer', address: '0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2', decimals: 18, icon: '⚖️' },
  LDO: { symbol: 'LDO', name: 'Lido DAO', address: '0xfA980cEd6895AC314E7dE34Ef1bFAE90a5AdD21b', decimals: 18, icon: '🌊' },
  PENDLE: { symbol: 'PENDLE', name: 'Pendle', address: '0xBC5B59EA1b6f8Da8258615EE38D40e999EC5D74F', decimals: 18, icon: '🔮' },
};

// Uniswap V3 SwapRouter02 on Base
const SWAP_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481';

// ERC20 ABI selectors
const ERC20_ABI = {
  approve: '0x095ea7b3',
  allowance: '0xdd62ed3e',
  balanceOf: '0x70a08231',
};

export interface SwapQuote {
  amountOut: string;
  fee: number;
  route: string;
  priceImpact?: number;
  decimalsOut?: number;
}

export interface TokenPrices {
  [key: string]: number;
}

export interface TokenBalances {
  [key: string]: string;
}

// Type for EIP-1193 provider request
interface ProviderRequest {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

export const useSwap = () => {
  const { address, isConnected, walletProvider } = useWalletContext();
  const [prices, setPrices] = useState<TokenPrices>({});
  const [balances, setBalances] = useState<TokenBalances>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isWalletActionPending, setIsWalletActionPending] = useState(false);
  const walletActionDepthRef = useRef(0);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Get provider - use walletProvider from context or fallback to window.ethereum
  const getProvider = useCallback((): ProviderRequest | null => {
    if (walletProvider) return walletProvider as unknown as ProviderRequest;
    if (typeof window !== 'undefined' && window.ethereum) return window.ethereum as unknown as ProviderRequest;
    return null;
  }, [walletProvider]);

  const beginWalletAction = useCallback(() => {
    walletActionDepthRef.current += 1;
    setIsWalletActionPending(true);
  }, []);

  const endWalletAction = useCallback(() => {
    walletActionDepthRef.current = Math.max(0, walletActionDepthRef.current - 1);
    if (walletActionDepthRef.current === 0) setIsWalletActionPending(false);
  }, []);

  const requestWithTimeout = useCallback(
    async <T,>(
      provider: ProviderRequest,
      args: { method: string; params?: unknown[] },
      timeoutMs: number
    ): Promise<T> => {
      return await new Promise<T>((resolve, reject) => {
        const t = window.setTimeout(() => {
          reject(new Error('WALLET_TIMEOUT'));
        }, timeoutMs);

        provider
          .request(args)
          .then((res) => {
            window.clearTimeout(t);
            resolve(res as T);
          })
          .catch((err) => {
            window.clearTimeout(t);
            reject(err);
          });
      });
    },
    []
  );

  // Fetch token prices
  const fetchPrices = useCallback(async () => {
    setIsLoadingPrices(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-swap-quote', {
        body: { action: 'prices' },
      });
      
      if (error) throw error;
      setPrices(data.prices);
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  }, []);

  // Fetch token balances from wallet
  const fetchBalances = useCallback(async () => {
    // During a WalletConnect approval/signature on mobile, background RPC calls can
    // break the wallet handshake (MetaMask shows a blank/white sheet and returns late).
    if (isWalletActionPending) return;

    const provider = getProvider();
    if (!address || !provider) {
      setBalances({});
      return;
    }

    setIsLoadingBalances(true);
    try {
      const newBalances: TokenBalances = {};

      // Check if on Base network
      const chainId = await provider.request({ method: 'eth_chainId' });
      if (chainId !== BASE_CHAIN_CONFIG.chainId) {
        // Not on Base, show empty balances
        setBalances({});
        setIsLoadingBalances(false);
        return;
      }

      // Fetch ETH balance
      const ethBalance = (await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      })) as string;
      newBalances['ETH'] = (Number(BigInt(ethBalance)) / 1e18).toFixed(6);

      // Fetch ERC20 balances
      const tokens = Object.entries(BASE_TOKENS).filter(([symbol]) => symbol !== 'ETH');

      await Promise.all(
        tokens.map(async ([symbol, token]) => {
          try {
            const paddedAddress = address.toLowerCase().replace('0x', '').padStart(64, '0');
            const data = `${ERC20_ABI.balanceOf}${paddedAddress}`;

            const result = (await provider.request({
              method: 'eth_call',
              params: [{ to: token.address, data }, 'latest'],
            })) as string;

            if (result && result !== '0x') {
              const balance = Number(BigInt(result)) / Math.pow(10, token.decimals);
              newBalances[symbol] = balance.toFixed(6);
            } else {
              newBalances[symbol] = '0';
            }
          } catch (err) {
            console.error(`Error fetching ${symbol} balance:`, err);
            newBalances[symbol] = '0';
          }
        })
      );

      setBalances(newBalances);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [address, getProvider, isWalletActionPending]);

  // Fetch quote - don't clear existing quote during loading to avoid flicker
  const fetchQuote = useCallback(async (
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    decimalsIn: number,
    decimalsOut: number
  ) => {
    if (!amountIn || parseFloat(amountIn) === 0) {
      setQuote(null);
      return null;
    }

    setIsLoadingQuote(true);
    try {
      // Convert to wei based on input token decimals
      const amountInWei = BigInt(Math.floor(parseFloat(amountIn) * Math.pow(10, decimalsIn))).toString();
      
      const { data, error } = await supabase.functions.invoke('get-swap-quote', {
        body: { action: 'quote', tokenIn, tokenOut, amountIn: amountInWei },
      });
      
      if (error) throw error;
      
      // Store decimalsOut in quote for later use
      setQuote({ ...data, decimalsOut });
      return data;
    } catch (error) {
      console.error('Error fetching quote:', error);
      // Don't clear quote on error - keep showing the estimate
      return null;
    } finally {
      setIsLoadingQuote(false);
    }
  }, []);

  // Switch to Base network
  const switchToBase = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return false;
    
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_CHAIN_CONFIG.chainId }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [BASE_CHAIN_CONFIG],
          });
          return true;
        } catch (addError) {
          console.error('Error adding Base chain:', addError);
          return false;
        }
      }
      console.error('Error switching to Base:', switchError);
      return false;
    }
  }, [getProvider]);

  // Check and approve token
  const approveToken = useCallback(async (
    tokenAddress: string,
    amount: string
  ) => {
    const provider = getProvider();
    if (!provider || !address) return false;
    if (tokenAddress === BASE_TOKENS.ETH.address) return true; // No approval needed for ETH

    try {
      beginWalletAction();

      // Encode approve call
      const spender = SWAP_ROUTER.toLowerCase().replace('0x', '').padStart(64, '0');
      const value = BigInt(amount).toString(16).padStart(64, '0');
      const data = `${ERC20_ABI.approve}${spender}${value}`;

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        toast.info('Confirm approval in MetaMask, then return here', {
          id: 'mobile-wallet-pending',
          duration: 60000,
        });
      }

      const txHash = isMobile
        ? await requestWithTimeout<string>(
            provider,
            {
              method: 'eth_sendTransaction',
              params: [
                {
                  from: address,
                  to: tokenAddress,
                  data,
                },
              ],
            },
            120000
          )
        : ((await provider.request({
            method: 'eth_sendTransaction',
            params: [
              {
                from: address,
                to: tokenAddress,
                data,
              },
            ],
          })) as string);

      toast.dismiss('mobile-wallet-pending');

      // On mobile, try to refocus the browser after approval
      if (isMobile && typeof txHash === 'string') {
        setTimeout(() => window.focus(), 300);
      }

      toast.success('Approval sent!', { description: 'Waiting for confirmation...' });

      // Wait for confirmation
      let confirmed = false;
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const receipt = await provider.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        });
        if (receipt) {
          confirmed = true;
          break;
        }
      }

      return confirmed;
    } catch (error: any) {
      // Dismiss pending toast on error/rejection
      toast.dismiss('mobile-wallet-pending');

      if (error?.message === 'WALLET_TIMEOUT') {
        toast.error('Wallet did not respond in time', {
          description: 'If you approved in MetaMask, return to Safari and try again.',
        });
        return false;
      }

      if (error.code === 4001) {
        toast.error('Approval rejected');
      } else {
        toast.error('Approval failed');
      }
      return false;
    } finally {
      endWalletAction();
    }
  }, [address, getProvider, requestWithTimeout, beginWalletAction, endWalletAction]);

  // Execute swap
  const executeSwap = useCallback(async (
    tokenIn: { symbol: string; address: string; decimals: number },
    tokenOut: { symbol: string; address: string; decimals: number },
    amountIn: string,
    amountOutMin: string,
    slippage: number = 0.5
  ) => {
    const provider = getProvider();
    if (!provider || !address || !quote) return null;

    setIsSwapping(true);
    try {
      beginWalletAction();

      // Switch to Base if needed
      const chainId = await provider.request({ method: 'eth_chainId' });
      if (chainId !== BASE_CHAIN_CONFIG.chainId) {
        const switched = await switchToBase();
        if (!switched) {
          toast.error('Please switch to Base network');
          return null;
        }
      }

      const amountInWei = (parseFloat(amountIn) * Math.pow(10, tokenIn.decimals)).toFixed(0);
      const minOut = (BigInt(quote.amountOut) * BigInt(100 - Math.floor(slippage * 10)) / BigInt(1000)).toString();
      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes

      // Approve if not ETH
      if (tokenIn.address !== BASE_TOKENS.ETH.address) {
        const approved = await approveToken(tokenIn.address, amountInWei);
        if (!approved) return null;
      }

      // Build swap transaction
      let txData: string;
      let value = '0x0';

      if (tokenIn.address === BASE_TOKENS.ETH.address) {
        // ETH -> Token: exactInputSingle with value
        value = '0x' + BigInt(amountInWei).toString(16);
        const tokenInAddr = BASE_TOKENS.WETH.address.toLowerCase().replace('0x', '').padStart(64, '0');
        const tokenOutAddr = tokenOut.address.toLowerCase().replace('0x', '').padStart(64, '0');
        const fee = quote.fee.toString(16).padStart(64, '0');
        const recipient = address.toLowerCase().replace('0x', '').padStart(64, '0');
        const deadlineHex = deadline.toString(16).padStart(64, '0');
        const amountInHex = BigInt(amountInWei).toString(16).padStart(64, '0');
        const amountOutMinHex = BigInt(minOut).toString(16).padStart(64, '0');
        const sqrtPrice = '0'.padStart(64, '0');

        txData = `0x414bf389${tokenInAddr}${tokenOutAddr}${fee}${recipient}${deadlineHex}${amountInHex}${amountOutMinHex}${sqrtPrice}`;
      } else if (tokenOut.address === BASE_TOKENS.ETH.address) {
        // Token -> ETH
        const tokenInAddr = tokenIn.address.toLowerCase().replace('0x', '').padStart(64, '0');
        const tokenOutAddr = BASE_TOKENS.WETH.address.toLowerCase().replace('0x', '').padStart(64, '0');
        const fee = quote.fee.toString(16).padStart(64, '0');
        const recipient = address.toLowerCase().replace('0x', '').padStart(64, '0');
        const deadlineHex = deadline.toString(16).padStart(64, '0');
        const amountInHex = BigInt(amountInWei).toString(16).padStart(64, '0');
        const amountOutMinHex = BigInt(minOut).toString(16).padStart(64, '0');
        const sqrtPrice = '0'.padStart(64, '0');

        txData = `0x414bf389${tokenInAddr}${tokenOutAddr}${fee}${recipient}${deadlineHex}${amountInHex}${amountOutMinHex}${sqrtPrice}`;
      } else {
        // Token -> Token
        const tokenInAddr = tokenIn.address.toLowerCase().replace('0x', '').padStart(64, '0');
        const tokenOutAddr = tokenOut.address.toLowerCase().replace('0x', '').padStart(64, '0');
        const fee = quote.fee.toString(16).padStart(64, '0');
        const recipient = address.toLowerCase().replace('0x', '').padStart(64, '0');
        const deadlineHex = deadline.toString(16).padStart(64, '0');
        const amountInHex = BigInt(amountInWei).toString(16).padStart(64, '0');
        const amountOutMinHex = BigInt(minOut).toString(16).padStart(64, '0');
        const sqrtPrice = '0'.padStart(64, '0');

        txData = `0x414bf389${tokenInAddr}${tokenOutAddr}${fee}${recipient}${deadlineHex}${amountInHex}${amountOutMinHex}${sqrtPrice}`;
      }

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // On mobile, show a toast that the user should return after confirming
      if (isMobile) {
        toast.info('Confirm in MetaMask, then return here', {
          id: 'mobile-wallet-pending',
          duration: 60000,
        });
      } else {
        toast.info('Please confirm the swap in your wallet');
      }

      const txHash = isMobile
        ? await requestWithTimeout<string>(
            provider,
            {
              method: 'eth_sendTransaction',
              params: [
                {
                  from: address,
                  to: SWAP_ROUTER,
                  data: txData,
                  value,
                },
              ],
            },
            120000
          )
        : ((await provider.request({
            method: 'eth_sendTransaction',
            params: [
              {
                from: address,
                to: SWAP_ROUTER,
                data: txData,
                value,
              },
            ],
          })) as string);

      // Dismiss the "confirm" toast
      toast.dismiss('mobile-wallet-pending');

      // On mobile, try to refocus the browser after TX is sent
      if (isMobile && typeof txHash === 'string') {
        setTimeout(() => window.focus(), 300);
      }

      toast.success('Swap submitted!', {
        description: 'Waiting for confirmation...',
        action: {
          label: 'View',
          onClick: () => window.open(`https://basescan.org/tx/${txHash}`, '_blank'),
        },
      });

      return txHash as string;
    } catch (error: any) {
      // Always dismiss the pending toast on error/rejection
      toast.dismiss('mobile-wallet-pending');

      if (error?.message === 'WALLET_TIMEOUT') {
        toast.error('Wallet did not respond in time', {
          description: 'If you confirmed in MetaMask, return to Safari and try again.',
        });
        return null;
      }

      console.error('Swap error:', error);
      if (error.code === 4001) {
        toast.error('Swap rejected');
      } else {
        toast.error('Swap failed', { description: error.message });
      }
      return null;
    } finally {
      endWalletAction();
      setIsSwapping(false);
    }
  }, [address, quote, switchToBase, approveToken, getProvider, requestWithTimeout, beginWalletAction, endWalletAction]);

  // Fetch prices on mount
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Fetch balances when address changes or on mount
  useEffect(() => {
    if (isWalletActionPending) return;

    if (isConnected && address) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 15000); // Refresh every 15s
      return () => clearInterval(interval);
    }
  }, [isConnected, address, fetchBalances, isWalletActionPending]);

  return {
    prices,
    balances,
    isLoadingPrices,
    isLoadingBalances,
    quote,
    isLoadingQuote,
    isSwapping,
    fetchQuote,
    fetchBalances,
    executeSwap,
    switchToBase,
    BASE_TOKENS,
  };
};
