import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useChain } from "@/contexts/ChainContext";

export interface Pool {
  id: string;
  token0: { symbol: string; icon: string };
  token1: { symbol: string; icon: string };
  tvl: number;
  apr: number;
  volume24h: number;
  fees24h: number;
  feeTier?: number;
  myLiquidity?: number;
}

interface UseUniswapPoolsResult {
  pools: Pool[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUniswapPools = (): UseUniswapPoolsResult => {
  const { currentChain } = useChain();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-uniswap-pools', {
        body: { chain: currentChain.id },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        console.warn("Pool fetch warning:", data.error);
      }

      setPools(data?.pools || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch pools";
      console.error("Error fetching pools:", message);
      setError(message);
      setPools([]);
    } finally {
      setLoading(false);
    }
  }, [currentChain.id]);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  return { pools, loading, error, refetch: fetchPools };
};
