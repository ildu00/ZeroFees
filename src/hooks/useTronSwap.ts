import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTronLink } from './useTronLink';
import { toast } from 'sonner';

// TRC-20 Token Configuration
export const TRON_TOKENS: Record<string, { symbol: string; name: string; address: string; decimals: number; icon: string }> = {
  TRX: { symbol: 'TRX', name: 'TRON', address: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb', decimals: 6, icon: '♦️' },
  USDT: { symbol: 'USDT', name: 'Tether USD', address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', decimals: 6, icon: '💵' },
  USDC: { symbol: 'USDC', name: 'USD Coin', address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8', decimals: 6, icon: '💲' },
  USDD: { symbol: 'USDD', name: 'USDD', address: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn', decimals: 18, icon: '💎' },
  BTT: { symbol: 'BTT', name: 'BitTorrent', address: 'TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4', decimals: 18, icon: '🔶' },
  WIN: { symbol: 'WIN', name: 'WINkLink', address: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7', decimals: 6, icon: '🎰' },
  JST: { symbol: 'JST', name: 'JUST', address: 'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9', decimals: 18, icon: '⚖️' },
  SUN: { symbol: 'SUN', name: 'SUN Token', address: 'TKkeiboTkxXKJpbmVFbv4a8ov5rAfRDMf9', decimals: 18, icon: '☀️' },
  NFT: { symbol: 'NFT', name: 'APENFT', address: 'TFczxzPhnThNSqr5by8tvxsdCFRRz6cPNq', decimals: 6, icon: '🎨' },
  WBTC: { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: 'TXpw8XeWYeTUd4quDskoUqeQPowRh4jY65', decimals: 8, icon: '₿' },
  WETH: { symbol: 'WETH', name: 'Wrapped Ethereum', address: 'TXWkP3jLBqRGojUih1ShzNyDaN5Csnebok', decimals: 18, icon: '⟠' },
  TUSD: { symbol: 'TUSD', name: 'TrueUSD', address: 'TUpMhErZL2fhh4sVNULAbNKLokS4GjC1F4', decimals: 18, icon: '💰' },
};

// SunSwap V2 Router address
const SUNSWAP_ROUTER = 'TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax';

export interface TronSwapQuote {
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

export const useTronSwap = () => {
  const { address, isConnected, tronWeb } = useTronLink();
  const [prices, setPrices] = useState<TokenPrices>({});
  const [balances, setBalances] = useState<TokenBalances>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [quote, setQuote] = useState<TronSwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Fetch token prices
  const fetchPrices = useCallback(async () => {
    setIsLoadingPrices(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-sunswap-quote', {
        body: { action: 'prices' },
      });
      
      if (error) throw error;
      setPrices(data.prices);
    } catch (error) {
      console.error('Error fetching TRON prices:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  }, []);

  // Fetch token balances
  const fetchBalances = useCallback(async () => {
    if (!address || !tronWeb) {
      setBalances({});
      return;
    }

    setIsLoadingBalances(true);
    try {
      const newBalances: TokenBalances = {};

      // Fetch TRX balance
      const trxBalance = await tronWeb.trx.getBalance(address);
      newBalances['TRX'] = (trxBalance / 1_000_000).toFixed(6);

      // Fetch TRC-20 balances
      const tokens = Object.entries(TRON_TOKENS).filter(([symbol]) => symbol !== 'TRX');

      await Promise.all(
        tokens.map(async ([symbol, token]) => {
          try {
            const contract = await tronWeb.contract().at(token.address) as any;
            const balance = await contract.balanceOf(address).call();
            const balanceNum = Number(balance) / Math.pow(10, token.decimals);
            newBalances[symbol] = balanceNum.toFixed(6);
          } catch (err) {
            console.error(`Error fetching ${symbol} balance:`, err);
            newBalances[symbol] = '0';
          }
        })
      );

      setBalances(newBalances);
    } catch (error) {
      console.error('Error fetching TRON balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [address, tronWeb]);

  // Fetch quote
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
      // Convert to smallest unit
      const amountInSmallest = BigInt(Math.floor(parseFloat(amountIn) * Math.pow(10, decimalsIn))).toString();
      
      const { data, error } = await supabase.functions.invoke('get-sunswap-quote', {
        body: { action: 'quote', tokenIn, tokenOut, amountIn: amountInSmallest },
      });
      
      if (error) throw error;
      
      setQuote({ ...data, decimalsOut });
      return data;
    } catch (error) {
      console.error('Error fetching TRON quote:', error);
      return null;
    } finally {
      setIsLoadingQuote(false);
    }
  }, []);

  // Approve TRC-20 token
  const approveToken = useCallback(async (
    tokenAddress: string,
    amount: string
  ): Promise<boolean> => {
    if (!tronWeb || !address) return false;
    if (tokenAddress === TRON_TOKENS.TRX.address) return true; // No approval needed for TRX

    try {
      const contract = await tronWeb.contract().at(tokenAddress) as any;
      
      // Approve max amount
      const maxAmount = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      const tx = await contract.approve(SUNSWAP_ROUTER, maxAmount).send({
        feeLimit: 100_000_000,
        callValue: 0,
        shouldPollResponse: true,
      });

      toast.success('Token approved!');
      return !!tx;
    } catch (error) {
      console.error('Token approval error:', error);
      toast.error('Approval failed');
      return false;
    }
  }, [tronWeb, address]);

  // Execute swap on SunSwap
  const executeSwap = useCallback(async (
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    amountOutMin: string,
    decimalsIn: number
  ): Promise<string | null> => {
    if (!tronWeb || !address) {
      toast.error('Wallet not connected');
      return null;
    }

    setIsSwapping(true);
    try {
      const tokenInConfig = TRON_TOKENS[tokenIn];
      const tokenOutConfig = TRON_TOKENS[tokenOut];

      if (!tokenInConfig || !tokenOutConfig) {
        throw new Error('Invalid token');
      }

      // Convert amounts
      const amountInSmallest = BigInt(Math.floor(parseFloat(amountIn) * Math.pow(10, decimalsIn))).toString();
      
      // Approve if needed
      if (tokenIn !== 'TRX') {
        const approved = await approveToken(tokenInConfig.address, amountInSmallest);
        if (!approved) {
          throw new Error('Approval failed');
        }
      }

      toast.info('Executing swap...', { id: 'swap-pending' });

      // Build swap transaction using SunSwap router
      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes

      let txHash: string;

      if (tokenIn === 'TRX') {
        // Swap TRX for token
        const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
          SUNSWAP_ROUTER,
          'swapExactETHForTokens(uint256,address[],address,uint256)',
          { feeLimit: 150_000_000, callValue: parseInt(amountInSmallest) },
          [
            { type: 'uint256', value: amountOutMin },
            { type: 'address[]', value: [tokenInConfig.address, tokenOutConfig.address] },
            { type: 'address', value: address },
            { type: 'uint256', value: deadline },
          ],
          address
        );
        
        const signedTx = await tronWeb.trx.sign(transaction);
        const result = await tronWeb.trx.sendRawTransaction(signedTx);
        txHash = result.txid || result.transaction?.txID;
      } else if (tokenOut === 'TRX') {
        // Swap token for TRX
        const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
          SUNSWAP_ROUTER,
          'swapExactTokensForETH(uint256,uint256,address[],address,uint256)',
          { feeLimit: 150_000_000, callValue: 0 },
          [
            { type: 'uint256', value: amountInSmallest },
            { type: 'uint256', value: amountOutMin },
            { type: 'address[]', value: [tokenInConfig.address, tokenOutConfig.address] },
            { type: 'address', value: address },
            { type: 'uint256', value: deadline },
          ],
          address
        );
        
        const signedTx = await tronWeb.trx.sign(transaction);
        const result = await tronWeb.trx.sendRawTransaction(signedTx);
        txHash = result.txid || result.transaction?.txID;
      } else {
        // Swap token for token
        const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
          SUNSWAP_ROUTER,
          'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)',
          { feeLimit: 150_000_000, callValue: 0 },
          [
            { type: 'uint256', value: amountInSmallest },
            { type: 'uint256', value: amountOutMin },
            { type: 'address[]', value: [tokenInConfig.address, tokenOutConfig.address] },
            { type: 'address', value: address },
            { type: 'uint256', value: deadline },
          ],
          address
        );
        
        const signedTx = await tronWeb.trx.sign(transaction);
        const result = await tronWeb.trx.sendRawTransaction(signedTx);
        txHash = result.txid || result.transaction?.txID;
      }

      toast.dismiss('swap-pending');
      toast.success('Swap executed!', {
        description: `Transaction: ${txHash?.slice(0, 10)}...`,
        action: {
          label: 'View',
          onClick: () => window.open(`https://tronscan.org/#/transaction/${txHash}`, '_blank'),
        },
      });

      // Refresh balances
      setTimeout(fetchBalances, 3000);

      return txHash;
    } catch (error: any) {
      toast.dismiss('swap-pending');
      console.error('Swap error:', error);
      
      if (error.message?.includes('User rejected')) {
        toast.error('Swap rejected');
      } else {
        toast.error('Swap failed', { description: error.message });
      }
      
      return null;
    } finally {
      setIsSwapping(false);
    }
  }, [tronWeb, address, approveToken, fetchBalances]);

  // Auto-refresh on connection
  useEffect(() => {
    if (isConnected) {
      fetchBalances();
    }
  }, [isConnected, fetchBalances]);

  // Initial price fetch
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  return {
    prices,
    balances,
    quote,
    isLoadingPrices,
    isLoadingBalances,
    isLoadingQuote,
    isSwapping,
    fetchPrices,
    fetchBalances,
    fetchQuote,
    executeSwap,
    tokens: TRON_TOKENS,
  };
};

export default useTronSwap;
