import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletContext';
import { toast } from 'sonner';

// Flamingo DEX contracts on NEO N3 MainNet
const FLAMINGO_SWAP_ROUTER = '0xde3a4b093abbd07e9a69cdec88a54d9a1fe14975';
const BNEO_CONTRACT = '0x48c40d4666f93408be1bef038b6722404d9a4c2a';

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

/**
 * Build swap path for Flamingo DEX.
 * Most tokens are paired against bNEO, so the route is typically:
 * tokenIn → bNEO → tokenOut (if neither is bNEO)
 * NEO is special: it must be wrapped to bNEO first via NeoBurger.
 */
function buildSwapPath(tokenInSymbol: string, tokenOutSymbol: string): string[] {
  const tokenIn = NEO_SWAP_TOKENS[tokenInSymbol];
  const tokenOut = NEO_SWAP_TOKENS[tokenOutSymbol];
  if (!tokenIn || !tokenOut) return [];

  const inAddr = tokenIn.address;
  const outAddr = tokenOut.address;

  // If NEO is involved, route through bNEO
  const effectiveIn = tokenInSymbol === 'NEO' ? BNEO_CONTRACT : inAddr;
  const effectiveOut = tokenOutSymbol === 'NEO' ? BNEO_CONTRACT : outAddr;

  // Direct pair (one of them is bNEO)
  if (effectiveIn === BNEO_CONTRACT || effectiveOut === BNEO_CONTRACT) {
    return [effectiveIn, effectiveOut];
  }

  // Route through bNEO as intermediate
  return [effectiveIn, BNEO_CONTRACT, effectiveOut];
}

export const useNeoSwap = () => {
  const { address, isConnected } = useWalletContext();
  const providerRef = useRef<any>(null);
  const [prices, setPrices] = useState<TokenPrices>({});
  const [balances, setBalances] = useState<TokenBalances>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [quote, setQuote] = useState<NeoSwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Initialize NeoLine provider lazily
  const getProvider = useCallback(async () => {
    if (providerRef.current) return providerRef.current;
    const win = window as any;
    if (win.NEOLineN3) {
      providerRef.current = new win.NEOLineN3.Init();
      return providerRef.current;
    }
    return null;
  }, []);

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
    if (!address) {
      setBalances({});
      return;
    }

    const neoProvider = await getProvider();
    if (!neoProvider) {
      setBalances({});
      return;
    }

    try {
      const newBalances: TokenBalances = {};
      const contracts = Object.entries(NEO_SWAP_TOKENS).map(([symbol, token]) => ({
        symbol,
        contract: token.address,
        decimals: token.decimals,
      }));

      try {
        const balanceResult = await neoProvider.getBalance({
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
  }, [address, getProvider]);

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

  // Execute swap via Flamingo DEX using NeoLine invoke
  const executeSwap = useCallback(async (
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    minAmountOut: string,
    decimalsIn: number
  ): Promise<string | null> => {
    const neoProvider = await getProvider();
    if (!neoProvider || !address) {
      toast.error('Please connect NeoLine wallet');
      return null;
    }

    setIsSwapping(true);
    try {
      const tokenInConfig = NEO_SWAP_TOKENS[tokenIn];
      const tokenOutConfig = NEO_SWAP_TOKENS[tokenOut];
      if (!tokenInConfig || !tokenOutConfig) {
        throw new Error('Invalid token configuration');
      }

      // Calculate amounts in smallest units
      const amountInSmallest = BigInt(Math.floor(parseFloat(amountIn) * Math.pow(10, decimalsIn))).toString();

      // Special case: NEO is indivisible. Wrap NEO → bNEO first via NeoBurger transfer
      if (tokenIn === 'NEO') {
        toast.info('Step 1/2: Wrapping NEO → bNEO via NeoBurger...');
        
        // Transfer NEO to bNEO contract to receive bNEO
        const wrapResult = await neoProvider.invoke({
          scriptHash: tokenInConfig.address, // NEO contract
          operation: 'transfer',
          args: [
            { type: 'Address', value: address },
            { type: 'Hash160', value: BNEO_CONTRACT },
            { type: 'Integer', value: amountInSmallest },
            { type: 'Any', value: null },
          ],
          signers: [{
            account: address,
            scopes: 16, // CalledByEntry + CustomContracts
            allowedContracts: [tokenInConfig.address, BNEO_CONTRACT],
          }],
        });

        if (!wrapResult || !wrapResult.txid) {
          throw new Error('NEO → bNEO wrap failed');
        }

        toast.info('Step 2/2: Swapping bNEO via Flamingo DEX...');
        
        // Wait briefly for the wrap tx to be included
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Build swap path
      const swapPath = buildSwapPath(tokenIn, tokenOut);
      if (swapPath.length < 2) {
        throw new Error('Could not determine swap route');
      }

      // Deadline: current time + 10 minutes (in milliseconds)
      const deadline = (Date.now() + 10 * 60 * 1000).toString();

      // Build the paths array for the contract
      const pathArgs = swapPath.map(p => ({ type: 'Hash160' as const, value: p }));

      // Determine the effective amountIn for the router
      // If NEO was wrapped, use bNEO amount (1 NEO = 1e8 bNEO units)
      const routerAmountIn = tokenIn === 'NEO'
        ? (BigInt(amountInSmallest) * BigInt(1e8)).toString()
        : amountInSmallest;

      // Build allowed contracts for signers
      const allowedContracts = [
        FLAMINGO_SWAP_ROUTER,
        ...swapPath,
      ];

      // Invoke FlamingoSwapRouter.swapTokenInForTokenOut
      const result = await neoProvider.invoke({
        scriptHash: FLAMINGO_SWAP_ROUTER,
        operation: 'swapTokenInForTokenOut',
        args: [
          { type: 'Address', value: address },           // sender
          { type: 'Integer', value: routerAmountIn },    // amountIn
          { type: 'Integer', value: minAmountOut },      // amountOutMin
          { type: 'Array', value: pathArgs },            // paths
          { type: 'Integer', value: deadline },          // deadLine
        ],
        signers: [{
          account: address,
          scopes: 16, // CalledByEntry
          allowedContracts,
        }],
      });

      if (result && result.txid) {
        toast.success(
          `Swap submitted! TX: ${result.txid.substring(0, 10)}...`,
          { duration: 8000 }
        );

        // Refresh balances after a delay
        setTimeout(() => fetchBalances(), 10000);

        return result.txid;
      } else {
        throw new Error('Transaction not confirmed');
      }
    } catch (error: any) {
      console.error('NEO Flamingo swap error:', error);
      
      let message = 'Swap failed';
      if (error.type === 'CANCELED' || error.description?.includes('cancel')) {
        message = 'Transaction cancelled by user';
      } else if (error.description) {
        message = error.description;
      } else if (error.message) {
        message = error.message;
      }
      
      toast.error(message);
      return null;
    } finally {
      setIsSwapping(false);
    }
  }, [getProvider, address, fetchBalances]);

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
