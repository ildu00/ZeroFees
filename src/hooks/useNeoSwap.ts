import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNeoLine } from './useNeoLine';
import { toast } from 'sonner';

// NEP-17 Token Configuration
export const NEO_SWAP_TOKENS: Record<string, { symbol: string; name: string; address: string; decimals: number; icon: string }> = {
  NEO: { symbol: 'NEO', name: 'NEO', address: '0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5', decimals: 0, icon: '💚' },
  GAS: { symbol: 'GAS', name: 'GAS', address: '0xd2a4cff31913016155e38e474a2c06d08be276cf', decimals: 8, icon: '⛽' },
  FLM: { symbol: 'FLM', name: 'Flamingo', address: '0xf0151f528127558851b39c2cd8aa47da7418ab28', decimals: 8, icon: '🦩' },
  fUSDT: { symbol: 'fUSDT', name: 'fUSDT', address: '0xcd48b160c1bbc9d74997b803b9a7ad50a4bef020', decimals: 6, icon: '💲' },
  bNEO: { symbol: 'bNEO', name: 'Burger NEO', address: '0x48c40d4666f93408be1bef038b6722404d9a4c2a', decimals: 8, icon: '🍔' },
  SWTH: { symbol: 'SWTH', name: 'Switcheo', address: '0x78e1330db47634afdb5ea455302ba2d12b8d549d', decimals: 8, icon: '🔄' },
};

export interface NeoSwapQuote {
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

export const useNeoSwap = () => {
  const { address, isConnected, provider } = useNeoLine();
  const [prices, setPrices] = useState<TokenPrices>({});
  const [balances, setBalances] = useState<TokenBalances>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [quote, setQuote] = useState<NeoSwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Fetch token prices
  const fetchPrices = useCallback(async () => {
    setIsLoadingPrices(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-neo-quote', {
        body: { action: 'prices' },
      });
      
      if (error) throw error;
      setPrices(data.prices);
    } catch (error) {
      console.error('Error fetching NEO prices:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  }, []);

  // Fetch token balances via NeoLine
  const fetchBalances = useCallback(async () => {
    if (!address || !provider) {
      setBalances({});
      return;
    }

    try {
      const newBalances: TokenBalances = {};

      // Fetch balances for all NEO tokens
      const contracts = Object.entries(NEO_SWAP_TOKENS).map(([symbol, token]) => ({
        symbol,
        contract: token.address,
        decimals: token.decimals,
      }));

      try {
        const balanceResult = await provider.getBalance({
          address,
          contracts: contracts.map(c => c.contract),
        });

        for (const c of contracts) {
          const raw = balanceResult[c.contract] || '0';
          const balance = (parseFloat(raw) / Math.pow(10, c.decimals)).toFixed(c.decimals > 0 ? Math.min(c.decimals, 6) : 0);
          newBalances[c.symbol] = balance;
        }
      } catch (err) {
        console.error('Error fetching NEO balances:', err);
        for (const c of contracts) {
          newBalances[c.symbol] = '0';
        }
      }

      setBalances(newBalances);
    } catch (error) {
      console.error('Error fetching NEO balances:', error);
    }
  }, [address, provider]);

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
      const amountInSmallest = BigInt(Math.floor(parseFloat(amountIn) * Math.pow(10, decimalsIn))).toString();
      
      const { data, error } = await supabase.functions.invoke('get-neo-quote', {
        body: { action: 'quote', tokenIn, tokenOut, amountIn: amountInSmallest },
      });
      
      if (error) throw error;
      
      setQuote({ ...data, decimalsOut });
      return data;
    } catch (error) {
      console.error('Error fetching NEO quote:', error);
      return null;
    } finally {
      setIsLoadingQuote(false);
    }
  }, []);

  // Execute swap (placeholder - Flamingo DEX integration needed)
  const executeSwap = useCallback(async (
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    minAmountOut: string,
    decimalsIn: number
  ): Promise<string | null> => {
    if (!provider || !address) {
      toast.error('Please connect NeoLine wallet');
      return null;
    }

    setIsSwapping(true);
    try {
      toast.info('NEO swap via Flamingo DEX coming soon');
      // TODO: Implement Flamingo DEX swap via NeoLine invoke
      return null;
    } catch (error: any) {
      console.error('NEO swap error:', error);
      toast.error('Swap failed: ' + (error.message || 'Unknown error'));
      return null;
    } finally {
      setIsSwapping(false);
    }
  }, [provider, address]);

  // Auto-fetch prices
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Fetch balances when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 15000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address, fetchBalances]);

  return {
    prices,
    balances,
    quote,
    isLoadingQuote,
    isSwapping,
    fetchQuote,
    executeSwap,
  };
};
