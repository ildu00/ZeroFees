import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletContext';
import { toast } from 'sonner';

// Avalanche C-Chain config
const AVAX_CHAIN_CONFIG = {
  chainId: '0xa86a',
  chainName: 'Avalanche C-Chain',
  nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://snowtrace.io'],
};

// Avalanche Token Configuration
export const AVAX_TOKENS: Record<string, { symbol: string; name: string; address: string; decimals: number; icon: string }> = {
  AVAX:     { symbol: 'AVAX',     name: 'Avalanche',           address: '0x0000000000000000000000000000000000000000', decimals: 18, icon: '🔺' },
  WAVAX:    { symbol: 'WAVAX',    name: 'Wrapped AVAX',        address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', decimals: 18, icon: '🔺' },
  USDC:     { symbol: 'USDC',     name: 'USD Coin',            address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6,  icon: '💵' },
  'USDC.e': { symbol: 'USDC.e',   name: 'USD Coin (Bridged)',  address: '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664', decimals: 6,  icon: '💵' },
  USDT:     { symbol: 'USDT',     name: 'Tether USD',          address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', decimals: 6,  icon: '💲' },
  'USDT.e': { symbol: 'USDT.e',   name: 'Tether USD (Bridged)',address: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118', decimals: 6,  icon: '💲' },
  JOE:      { symbol: 'JOE',      name: 'Trader Joe',          address: '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd', decimals: 18, icon: '🦜' },
  'WETH.e': { symbol: 'WETH.e',   name: 'Wrapped Ether',       address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', decimals: 18, icon: '⟠' },
  'WBTC.e': { symbol: 'WBTC.e',   name: 'Wrapped Bitcoin',     address: '0x50b7545627a5162F82A992c33b87aDc75187B218', decimals: 8,  icon: '₿' },
  'DAI.e':  { symbol: 'DAI.e',    name: 'Dai Stablecoin',      address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', decimals: 18, icon: '🔶' },
  'LINK.e': { symbol: 'LINK.e',   name: 'Chainlink',           address: '0x5947BB275c521040051D82396e4B9d3f7694cB02', decimals: 18, icon: '🔗' },
  'AAVE.e': { symbol: 'AAVE.e',   name: 'Aave',               address: '0x63a72806098Bd3D9520cC43356dD78afe5D386D9', decimals: 18, icon: '👻' },
  sAVAX:    { symbol: 'sAVAX',    name: 'Staked AVAX',         address: '0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE', decimals: 18, icon: '❄️' },
  QI:       { symbol: 'QI',       name: 'BENQI',               address: '0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5', decimals: 18, icon: '🔷' },
  PNG:      { symbol: 'PNG',      name: 'Pangolin',            address: '0x60781C2586D68229fde47564546784ab3fACA982', decimals: 18, icon: '🐧' },
  GMX:      { symbol: 'GMX',      name: 'GMX',                 address: '0x62edc0692BD897D2295872a9FFCac5425011c661', decimals: 18, icon: '📊' },
};

// Trader Joe V1 Router
const TRADERJOE_ROUTER = '0x60aE616a2155Ee3d9A68541Ba4544862310933d4';

// ReGraph fee config
const REGRAPH_FEE_PERCENT = 0.3;
const REGRAPH_FEE_WALLET = '0x320b6a1080d6c2abbbff1a6e1d105812e4fb2716';

// ERC20 ABI selectors
const ERC20_ABI = {
  approve: '0x095ea7b3',
  balanceOf: '0x70a08231',
};

export interface AvaxSwapQuote {
  amountOut: string;
  fee: number;
  route: string;
  priceImpact?: number;
  decimalsOut?: number;
  source?: string;
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

export const useAvalancheSwap = () => {
  const { address, isConnected, walletProvider } = useWalletContext();
  const [prices, setPrices] = useState<TokenPrices>({});
  const [balances, setBalances] = useState<TokenBalances>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isWalletActionPending, setIsWalletActionPending] = useState(false);
  const walletActionDepthRef = useRef(0);
  const [quote, setQuote] = useState<AvaxSwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

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

  // Fetch token prices
  const fetchPrices = useCallback(async () => {
    setIsLoadingPrices(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-traderjoe-quote', {
        body: { action: 'prices' },
      });
      if (error) throw error;
      setPrices(data.prices);
    } catch (error) {
      console.error('Error fetching AVAX prices:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  }, []);

  // Fetch token balances
  const fetchBalances = useCallback(async () => {
    if (isWalletActionPending) return;
    const provider = getProvider();
    if (!address || !provider) { setBalances({}); return; }

    setIsLoadingBalances(true);
    try {
      const newBalances: TokenBalances = {};

      const chainId = await provider.request({ method: 'eth_chainId' });
      if (chainId !== AVAX_CHAIN_CONFIG.chainId) { setBalances({}); setIsLoadingBalances(false); return; }

      // AVAX native balance
      const avaxBalance = (await provider.request({ method: 'eth_getBalance', params: [address, 'latest'] })) as string;
      newBalances['AVAX'] = (Number(BigInt(avaxBalance)) / 1e18).toFixed(6);

      // ERC-20 balances
      const tokens = Object.entries(AVAX_TOKENS).filter(([s]) => s !== 'AVAX');
      await Promise.all(
        tokens.map(async ([symbol, token]) => {
          try {
            const paddedAddress = address.toLowerCase().replace('0x', '').padStart(64, '0');
            const data = `${ERC20_ABI.balanceOf}${paddedAddress}`;
            const result = (await provider.request({ method: 'eth_call', params: [{ to: token.address, data }, 'latest'] })) as string;
            if (result && result !== '0x') {
              newBalances[symbol] = (Number(BigInt(result)) / Math.pow(10, token.decimals)).toFixed(6);
            } else {
              newBalances[symbol] = '0';
            }
          } catch { newBalances[symbol] = '0'; }
        })
      );
      setBalances(newBalances);
    } catch (error) {
      console.error('Error fetching AVAX balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [address, getProvider, isWalletActionPending]);

  // Fetch quote
  const fetchQuote = useCallback(async (
    tokenIn: string, tokenOut: string, amountIn: string, decimalsIn: number, decimalsOut: number
  ) => {
    if (!amountIn || parseFloat(amountIn) === 0) { setQuote(null); return null; }

    setIsLoadingQuote(true);
    try {
      const amountInWei = BigInt(Math.floor(parseFloat(amountIn) * Math.pow(10, decimalsIn))).toString();
      const { data, error } = await supabase.functions.invoke('get-traderjoe-quote', {
        body: { action: 'quote', tokenIn, tokenOut, amountIn: amountInWei },
      });
      if (error) throw error;
      setQuote({ ...data, decimalsOut });
      return data;
    } catch (error) {
      console.error('Error fetching AVAX quote:', error);
      return null;
    } finally {
      setIsLoadingQuote(false);
    }
  }, []);

  // Switch to Avalanche
  const switchToAvalanche = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return false;
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: AVAX_CHAIN_CONFIG.chainId }] });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await provider.request({ method: 'wallet_addEthereumChain', params: [AVAX_CHAIN_CONFIG] });
          return true;
        } catch { return false; }
      }
      return false;
    }
  }, [getProvider]);

  // Approve token
  const approveToken = useCallback(async (tokenAddress: string, amount: string) => {
    const provider = getProvider();
    if (!provider || !address) return false;
    if (tokenAddress === AVAX_TOKENS.AVAX.address) return true;

    try {
      beginWalletAction();
      const spender = TRADERJOE_ROUTER.toLowerCase().replace('0x', '').padStart(64, '0');
      const value = BigInt(amount).toString(16).padStart(64, '0');
      const data = `${ERC20_ABI.approve}${spender}${value}`;

      const txHash = (await provider.request({
        method: 'eth_sendTransaction',
        params: [{ from: address, to: tokenAddress, data }],
      })) as string;

      toast.success('Approval sent!', { description: 'Waiting for confirmation...' });

      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const receipt = await provider.request({ method: 'eth_getTransactionReceipt', params: [txHash] });
        if (receipt) return true;
      }
      return true;
    } catch (error: any) {
      if (error.code === 4001) toast.error('Approval rejected');
      else toast.error('Approval failed');
      return false;
    } finally {
      endWalletAction();
    }
  }, [address, getProvider, beginWalletAction, endWalletAction]);

  // Send ReGraph fee
  const sendReGraphFee = useCallback(async (
    tokenAddress: string, feeAmount: string
  ): Promise<boolean> => {
    const provider = getProvider();
    if (!provider || !address) return false;

    try {
      if (tokenAddress === AVAX_TOKENS.AVAX.address) {
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
      if (error.code === 4001) toast.error('Fee transfer rejected');
      return false;
    }
  }, [address, getProvider]);

  // Execute swap via Trader Joe V1 Router
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

      // Switch to Avalanche if needed
      const chainId = await provider.request({ method: 'eth_chainId' });
      if (chainId !== AVAX_CHAIN_CONFIG.chainId) {
        const switched = await switchToAvalanche();
        if (!switched) { toast.error('Please switch to Avalanche C-Chain'); return null; }
      }

      // Calculate ReGraph fee (0.3%)
      const totalAmountWei = BigInt(Math.floor(parseFloat(amountIn) * Math.pow(10, tokenIn.decimals)));
      const feeAmountWei = (totalAmountWei * BigInt(3)) / BigInt(1000);
      const swapAmountWei = totalAmountWei - feeAmountWei;

      // Send fee
      toast.info('Sending ReGraph fee (0.3%)...', { id: 'regraph-fee' });
      const feeSent = await sendReGraphFee(tokenIn.address, feeAmountWei.toString());
      toast.dismiss('regraph-fee');
      if (!feeSent) { toast.error('Fee transfer failed'); return null; }
      toast.success('ReGraph fee sent!');

      const amountInWei = swapAmountWei.toString();
      const minOut = (BigInt(quote.amountOut) * BigInt(100 - Math.floor(slippage * 10)) / BigInt(1000)).toString();
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes

      // Approve if not AVAX
      if (tokenIn.address !== AVAX_TOKENS.AVAX.address) {
        const approved = await approveToken(tokenIn.address, amountInWei);
        if (!approved) return null;
      }

      // Build Trader Joe V1 swap transaction (Uniswap V2 style router)
      const WAVAX = AVAX_TOKENS.WAVAX.address;
      const path = tokenIn.address === AVAX_TOKENS.AVAX.address
        ? [WAVAX, tokenOut.address]
        : tokenOut.address === AVAX_TOKENS.AVAX.address
          ? [tokenIn.address, WAVAX]
          : [tokenIn.address, WAVAX, tokenOut.address];

      let txData: string;
      let value = '0x0';

      if (tokenIn.address === AVAX_TOKENS.AVAX.address) {
        // swapExactAVAXForTokens
        value = '0x' + BigInt(amountInWei).toString(16);
        const amountOutMinHex = BigInt(minOut).toString(16).padStart(64, '0');
        const recipientPadded = address.toLowerCase().replace('0x', '').padStart(64, '0');
        const deadlineHex = BigInt(deadline).toString(16).padStart(64, '0');
        const pathOffset = BigInt(128).toString(16).padStart(64, '0');
        const pathLength = BigInt(path.length).toString(16).padStart(64, '0');
        const pathEncoded = path.map(a => a.toLowerCase().replace('0x', '').padStart(64, '0')).join('');
        
        // swapExactAVAXForTokens selector: 0x7ff36ab5
        txData = `0x7ff36ab5${amountOutMinHex}${pathOffset}${recipientPadded}${deadlineHex}${pathLength}${pathEncoded}`;
      } else if (tokenOut.address === AVAX_TOKENS.AVAX.address) {
        // swapExactTokensForAVAX
        const amountInHex = BigInt(amountInWei).toString(16).padStart(64, '0');
        const amountOutMinHex = BigInt(minOut).toString(16).padStart(64, '0');
        const recipientPadded = address.toLowerCase().replace('0x', '').padStart(64, '0');
        const deadlineHex = BigInt(deadline).toString(16).padStart(64, '0');
        const pathOffset = BigInt(160).toString(16).padStart(64, '0');
        const pathLength = BigInt(path.length).toString(16).padStart(64, '0');
        const pathEncoded = path.map(a => a.toLowerCase().replace('0x', '').padStart(64, '0')).join('');

        // swapExactTokensForAVAX selector: 0x18cbafe5
        txData = `0x18cbafe5${amountInHex}${amountOutMinHex}${pathOffset}${recipientPadded}${deadlineHex}${pathLength}${pathEncoded}`;
      } else {
        // swapExactTokensForTokens
        const amountInHex = BigInt(amountInWei).toString(16).padStart(64, '0');
        const amountOutMinHex = BigInt(minOut).toString(16).padStart(64, '0');
        const recipientPadded = address.toLowerCase().replace('0x', '').padStart(64, '0');
        const deadlineHex = BigInt(deadline).toString(16).padStart(64, '0');
        const pathOffset = BigInt(160).toString(16).padStart(64, '0');
        const pathLength = BigInt(path.length).toString(16).padStart(64, '0');
        const pathEncoded = path.map(a => a.toLowerCase().replace('0x', '').padStart(64, '0')).join('');

        // swapExactTokensForTokens selector: 0x38ed1739
        txData = `0x38ed1739${amountInHex}${amountOutMinHex}${pathOffset}${recipientPadded}${deadlineHex}${pathLength}${pathEncoded}`;
      }

      toast.info('Please confirm the swap in your wallet');

      const txHash = (await provider.request({
        method: 'eth_sendTransaction',
        params: [{ from: address, to: TRADERJOE_ROUTER, data: txData, value }],
      })) as string;

      toast.success('Swap submitted!', {
        description: 'Waiting for confirmation...',
        action: {
          label: 'View',
          onClick: () => window.open(`https://snowtrace.io/tx/${txHash}`, '_blank'),
        },
      });

      return txHash;
    } catch (error: any) {
      toast.dismiss('regraph-fee');
      if (error.code === 4001) toast.error('Swap rejected');
      else toast.error('Swap failed', { description: error.message });
      return null;
    } finally {
      endWalletAction();
      setIsSwapping(false);
    }
  }, [address, quote, switchToAvalanche, approveToken, getProvider, beginWalletAction, endWalletAction, sendReGraphFee]);

  // Auto-fetch prices
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
    switchToAvalanche,
    AVAX_TOKENS,
  };
};
