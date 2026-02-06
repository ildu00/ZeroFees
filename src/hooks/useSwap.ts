import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletContext';
import { useChain } from '@/contexts/ChainContext';
import { getTokensForChain } from '@/config/tokens';
import { toast } from 'sonner';

// ── Uniswap V3 chain configs ────────────────────────────────────────
interface UniswapChainConfig {
  chainIdHex: string;
  chainName: string;
  router: string;
  weth: string;
  nativeSymbol: string;
  explorer: string;
  rpcUrls: string[];
  nativeCurrency: { name: string; symbol: string; decimals: number };
}

const UNISWAP_V3_CHAINS: Record<string, UniswapChainConfig> = {
  base: {
    chainIdHex: '0x2105',
    chainName: 'Base',
    router: '0x2626664c2603336E57B271c5C0b26F421741e481',
    weth: '0x4200000000000000000000000000000000000006',
    nativeSymbol: 'ETH',
    explorer: 'https://basescan.org',
    rpcUrls: ['https://mainnet.base.org'],
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  },
  ethereum: {
    chainIdHex: '0x1',
    chainName: 'Ethereum',
    router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    nativeSymbol: 'ETH',
    explorer: 'https://etherscan.io',
    rpcUrls: ['https://eth.llamarpc.com'],
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  },
  arbitrum: {
    chainIdHex: '0xa4b1',
    chainName: 'Arbitrum One',
    router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    nativeSymbol: 'ETH',
    explorer: 'https://arbiscan.io',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  },
  polygon: {
    chainIdHex: '0x89',
    chainName: 'Polygon',
    router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    weth: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    nativeSymbol: 'MATIC',
    explorer: 'https://polygonscan.com',
    rpcUrls: ['https://polygon-rpc.com'],
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },
  optimism: {
    chainIdHex: '0xa',
    chainName: 'Optimism',
    router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    weth: '0x4200000000000000000000000000000000000006',
    nativeSymbol: 'ETH',
    explorer: 'https://optimistic.etherscan.io',
    rpcUrls: ['https://mainnet.optimism.io'],
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  },
};

const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';

// ReGraph fee configuration
const REGRAPH_FEE_PERCENT = 0.3;
const REGRAPH_FEE_WALLET = '0x320b6a1080d6c2abbbff1a6e1d105812e4fb2716';

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

interface ProviderRequest {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

// Build token record from chain config tokens
type TokenRecord = Record<string, { symbol: string; name: string; address: string; decimals: number; icon: string }>;

function buildTokenRecord(chainId: string): TokenRecord {
  const tokens = getTokensForChain(chainId);
  const record: TokenRecord = {};
  for (const t of tokens) {
    record[t.symbol] = { symbol: t.symbol, name: t.name, address: t.address, decimals: t.decimals, icon: t.icon };
  }
  return record;
}

export const useSwap = () => {
  const { address, isConnected, walletProvider } = useWalletContext();
  const { currentChain } = useChain();
  const [prices, setPrices] = useState<TokenPrices>({});
  const [balances, setBalances] = useState<TokenBalances>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isWalletActionPending, setIsWalletActionPending] = useState(false);
  const walletActionDepthRef = useRef(0);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Dynamic chain config
  const chainConfig = useMemo(
    () => UNISWAP_V3_CHAINS[currentChain.id] || UNISWAP_V3_CHAINS.base,
    [currentChain.id]
  );

  // Dynamic token record for current chain
  const TOKENS = useMemo(() => buildTokenRecord(currentChain.id), [currentChain.id]);

  // Get provider
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
        const t = window.setTimeout(() => reject(new Error('WALLET_TIMEOUT')), timeoutMs);
        provider
          .request(args)
          .then((res) => { window.clearTimeout(t); resolve(res as T); })
          .catch((err) => { window.clearTimeout(t); reject(err); });
      });
    },
    []
  );

  // ── Fetch prices (chain-aware) ─────────────────────────────────────
  const fetchPrices = useCallback(async () => {
    setIsLoadingPrices(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-swap-quote', {
        body: { action: 'prices', chain: currentChain.id },
      });
      if (error) throw error;
      setPrices(data.prices);
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  }, [currentChain.id]);

  // ── Fetch balances (chain-aware) ───────────────────────────────────
  const fetchBalances = useCallback(async () => {
    if (isWalletActionPending) return;

    const provider = getProvider();
    if (!address || !provider) {
      setBalances({});
      return;
    }

    setIsLoadingBalances(true);
    try {
      const newBalances: TokenBalances = {};

      // Check if on correct chain
      const walletChainId = await provider.request({ method: 'eth_chainId' });
      if (walletChainId !== chainConfig.chainIdHex) {
        setBalances({});
        setIsLoadingBalances(false);
        return;
      }

      // Fetch native balance
      const nativeBalance = (await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      })) as string;
      newBalances[chainConfig.nativeSymbol] = (Number(BigInt(nativeBalance)) / 1e18).toFixed(6);

      // Fetch ERC20 balances
      const erc20Tokens = Object.entries(TOKENS).filter(([symbol]) => symbol !== chainConfig.nativeSymbol);

      await Promise.all(
        erc20Tokens.map(async ([symbol, token]) => {
          try {
            if (token.address === NATIVE_ADDRESS) {
              newBalances[symbol] = newBalances[chainConfig.nativeSymbol] || '0';
              return;
            }
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
          } catch {
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
  }, [address, getProvider, isWalletActionPending, chainConfig, TOKENS]);

  // ── Fetch quote (chain-aware) ──────────────────────────────────────
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
      const amountInWei = BigInt(Math.floor(parseFloat(amountIn) * Math.pow(10, decimalsIn))).toString();

      const { data, error } = await supabase.functions.invoke('get-swap-quote', {
        body: { action: 'quote', tokenIn, tokenOut, amountIn: amountInWei, chain: currentChain.id },
      });

      if (error) throw error;
      setQuote({ ...data, decimalsOut });
      return data;
    } catch (error) {
      console.error('Error fetching quote:', error);
      return null;
    } finally {
      setIsLoadingQuote(false);
    }
  }, [currentChain.id]);

  // ── Switch to correct chain ────────────────────────────────────────
  const switchToChain = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return false;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainConfig.chainIdHex }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainConfig.chainIdHex,
              chainName: chainConfig.chainName,
              nativeCurrency: chainConfig.nativeCurrency,
              rpcUrls: chainConfig.rpcUrls,
              blockExplorerUrls: [chainConfig.explorer],
            }],
          });
          return true;
        } catch (addError) {
          console.error('Error adding chain:', addError);
          return false;
        }
      }
      console.error('Error switching chain:', switchError);
      return false;
    }
  }, [getProvider, chainConfig]);

  // ── Approve token ──────────────────────────────────────────────────
  const approveToken = useCallback(async (tokenAddress: string, amount: string) => {
    const provider = getProvider();
    if (!provider || !address) return false;
    if (tokenAddress === NATIVE_ADDRESS) return true;

    try {
      beginWalletAction();

      const spender = chainConfig.router.toLowerCase().replace('0x', '').padStart(64, '0');
      const value = BigInt(amount).toString(16).padStart(64, '0');
      const data = `${ERC20_ABI.approve}${spender}${value}`;

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        toast.info('Confirm approval in wallet, then return here', { id: 'mobile-wallet-pending', duration: 60000 });
      }

      const txHash = isMobile
        ? await requestWithTimeout<string>(provider, {
            method: 'eth_sendTransaction',
            params: [{ from: address, to: tokenAddress, data }],
          }, 120000)
        : ((await provider.request({
            method: 'eth_sendTransaction',
            params: [{ from: address, to: tokenAddress, data }],
          })) as string);

      toast.dismiss('mobile-wallet-pending');
      if (isMobile && typeof txHash === 'string') setTimeout(() => window.focus(), 300);

      toast.success('Approval sent!', { description: 'Waiting for confirmation...' });

      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const receipt = await provider.request({ method: 'eth_getTransactionReceipt', params: [txHash] });
        if (receipt) return true;
      }
      return true;
    } catch (error: any) {
      toast.dismiss('mobile-wallet-pending');
      if (error?.message === 'WALLET_TIMEOUT') {
        toast.error('Wallet did not respond in time');
        return false;
      }
      if (error.code === 4001) toast.error('Approval rejected');
      else toast.error('Approval failed');
      return false;
    } finally {
      endWalletAction();
    }
  }, [address, getProvider, chainConfig, requestWithTimeout, beginWalletAction, endWalletAction]);

  // ── Send ReGraph fee ───────────────────────────────────────────────
  const sendReGraphFee = useCallback(async (
    tokenAddress: string,
    feeAmount: string,
    _decimals: number
  ): Promise<boolean> => {
    const provider = getProvider();
    if (!provider || !address) return false;

    try {
      if (tokenAddress === NATIVE_ADDRESS) {
        const value = '0x' + BigInt(feeAmount).toString(16);
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{ from: address, to: REGRAPH_FEE_WALLET, value }],
        }) as string;

        for (let i = 0; i < 15; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const receipt = await provider.request({ method: 'eth_getTransactionReceipt', params: [txHash] });
          if (receipt) return true;
        }
        return true;
      } else {
        const recipient = REGRAPH_FEE_WALLET.toLowerCase().replace('0x', '').padStart(64, '0');
        const amount = BigInt(feeAmount).toString(16).padStart(64, '0');
        const transferData = `0xa9059cbb${recipient}${amount}`;

        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{ from: address, to: tokenAddress, data: transferData }],
        }) as string;

        for (let i = 0; i < 15; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const receipt = await provider.request({ method: 'eth_getTransactionReceipt', params: [txHash] });
          if (receipt) return true;
        }
        return true;
      }
    } catch (error: any) {
      console.error('Fee transfer error:', error);
      if (error.code === 4001) toast.error('Fee transfer rejected');
      return false;
    }
  }, [address, getProvider]);

  // ── Execute swap (chain-aware) ─────────────────────────────────────
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

      // Switch to correct chain if needed
      const walletChainId = await provider.request({ method: 'eth_chainId' });
      if (walletChainId !== chainConfig.chainIdHex) {
        const switched = await switchToChain();
        if (!switched) {
          toast.error(`Please switch to ${chainConfig.chainName}`);
          return null;
        }
      }

      // Calculate ReGraph fee (0.3%)
      const totalAmountWei = BigInt(Math.floor(parseFloat(amountIn) * Math.pow(10, tokenIn.decimals)));
      const feeAmountWei = (totalAmountWei * BigInt(3)) / BigInt(1000);
      const swapAmountWei = totalAmountWei - feeAmountWei;

      // Send ReGraph fee first
      toast.info('Sending ReGraph fee (0.3%)...', { id: 'regraph-fee' });
      const feeSent = await sendReGraphFee(tokenIn.address, feeAmountWei.toString(), tokenIn.decimals);
      toast.dismiss('regraph-fee');

      if (!feeSent) {
        toast.error('Fee transfer failed');
        return null;
      }

      toast.success('ReGraph fee sent!');

      const amountInWei = swapAmountWei.toString();
      const minOut = (BigInt(quote.amountOut) * BigInt(100 - Math.floor(slippage * 10)) / BigInt(1000)).toString();
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      // Approve if not native token
      if (tokenIn.address !== NATIVE_ADDRESS) {
        const approved = await approveToken(tokenIn.address, amountInWei);
        if (!approved) return null;
      }

      // Build swap transaction — exactInputSingle
      let value = '0x0';
      const isNativeIn = tokenIn.address === NATIVE_ADDRESS;
      const isNativeOut = tokenOut.address === NATIVE_ADDRESS;

      const tokenInAddr = (isNativeIn ? chainConfig.weth : tokenIn.address).toLowerCase().replace('0x', '').padStart(64, '0');
      const tokenOutAddr = (isNativeOut ? chainConfig.weth : tokenOut.address).toLowerCase().replace('0x', '').padStart(64, '0');
      const fee = quote.fee.toString(16).padStart(64, '0');
      const recipient = address.toLowerCase().replace('0x', '').padStart(64, '0');
      const deadlineHex = deadline.toString(16).padStart(64, '0');
      const amountInHex = BigInt(amountInWei).toString(16).padStart(64, '0');
      const amountOutMinHex = BigInt(minOut).toString(16).padStart(64, '0');
      const sqrtPrice = '0'.padStart(64, '0');

      if (isNativeIn) {
        value = '0x' + BigInt(amountInWei).toString(16);
      }

      const txData = `0x414bf389${tokenInAddr}${tokenOutAddr}${fee}${recipient}${deadlineHex}${amountInHex}${amountOutMinHex}${sqrtPrice}`;

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        toast.info('Confirm in wallet, then return here', { id: 'mobile-wallet-pending', duration: 60000 });
      } else {
        toast.info('Please confirm the swap in your wallet');
      }

      const txHash = isMobile
        ? await requestWithTimeout<string>(provider, {
            method: 'eth_sendTransaction',
            params: [{ from: address, to: chainConfig.router, data: txData, value }],
          }, 120000)
        : ((await provider.request({
            method: 'eth_sendTransaction',
            params: [{ from: address, to: chainConfig.router, data: txData, value }],
          })) as string);

      toast.dismiss('mobile-wallet-pending');
      if (isMobile && typeof txHash === 'string') setTimeout(() => window.focus(), 300);

      toast.success('Swap submitted!', {
        description: 'Waiting for confirmation...',
        action: {
          label: 'View',
          onClick: () => window.open(`${chainConfig.explorer}/tx/${txHash}`, '_blank'),
        },
      });

      return txHash as string;
    } catch (error: any) {
      toast.dismiss('mobile-wallet-pending');
      toast.dismiss('regraph-fee');

      if (error?.message === 'WALLET_TIMEOUT') {
        toast.error('Wallet did not respond in time');
        return null;
      }

      console.error('Swap error:', error);
      if (error.code === 4001) toast.error('Swap rejected');
      else toast.error('Swap failed', { description: error.message });
      return null;
    } finally {
      endWalletAction();
      setIsSwapping(false);
    }
  }, [address, quote, switchToChain, approveToken, getProvider, chainConfig, requestWithTimeout, beginWalletAction, endWalletAction, sendReGraphFee]);

  // ── Lifecycle ──────────────────────────────────────────────────────
  // Fetch prices on mount and when chain changes
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Fetch balances
  useEffect(() => {
    if (isWalletActionPending) return;
    if (isConnected && address) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 15000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address, fetchBalances, isWalletActionPending]);

  // Reset state on chain change
  useEffect(() => {
    setQuote(null);
    setBalances({});
  }, [currentChain.id]);

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
    switchToBase: switchToChain, // backward compat alias
    TOKENS,
  };
};

// Re-export for backward compatibility
export { buildTokenRecord as BASE_TOKENS_BUILDER };
