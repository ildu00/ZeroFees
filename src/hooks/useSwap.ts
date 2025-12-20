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

// Token addresses on Base
export const BASE_TOKENS = {
  ETH: { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '⟠' },
  WETH: { symbol: 'WETH', name: 'Wrapped Ethereum', address: '0x4200000000000000000000000000000000000006', decimals: 18, icon: '⟠' },
  USDC: { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, icon: '💲' },
  USDbC: { symbol: 'USDbC', name: 'USD Base Coin', address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', decimals: 6, icon: '💲' },
  DAI: { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18, icon: '◈' },
  cbETH: { symbol: 'cbETH', name: 'Coinbase Wrapped Staked ETH', address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', decimals: 18, icon: '🔵' },
  AERO: { symbol: 'AERO', name: 'Aerodrome', address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', decimals: 18, icon: '✈️' },
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
