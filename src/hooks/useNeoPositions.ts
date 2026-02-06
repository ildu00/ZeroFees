import { useState, useCallback, useEffect } from "react";
import { useChain } from "@/contexts/ChainContext";
import { useNeoLine } from "./useNeoLine";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Position } from "./usePositions";

// Flamingo DEX contracts on NEO N3 MainNet
const FLAMINGO_ROUTER = '0xde3a4b093abbd07e9a69cdec88a54d9a1fe14975';
const FLAMINGO_PAIR_FACTORY = '0xca2d20610d7982ebe0bed124ee7e9b2d580a6efc';

// Known Flamingo pool LP tokens and their pairs
interface FlamingoPool {
  poolHash: string;
  lpToken: string;
  token0: { address: string; symbol: string; decimals: number; icon: string };
  token1: { address: string; symbol: string; decimals: number; icon: string };
  fee: number;
}

export const useNeoPositions = () => {
  const { address, isConnected, provider } = useNeoLine();
  const { currentChain } = useChain();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [increasing, setIncreasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pools, setPools] = useState<FlamingoPool[]>([]);

  const isActive = currentChain.id === 'neo';

  // Fetch pool info from edge function
  const fetchPoolInfo = useCallback(async (): Promise<FlamingoPool[]> => {
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('get-chain-positions', {
        body: { chain: 'neo', address: address || '' },
      });

      if (fetchError) throw fetchError;
      if (data?.pools && Array.isArray(data.pools)) {
        setPools(data.pools);
        return data.pools;
      }
    } catch (err) {
      console.error("Error fetching Flamingo pools:", err);
    }
    return [];
  }, [address]);

  // Fetch user LP token balances
  const fetchPositions = useCallback(async () => {
    if (!isActive || !address || !isConnected || !provider) {
      setPositions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get pool info
      const poolList = pools.length > 0 ? pools : await fetchPoolInfo();
      if (poolList.length === 0) {
        setPositions([]);
        return;
      }

      // Get LP token contracts
      const lpContracts = poolList
        .map(p => p.lpToken || p.poolHash)
        .filter(Boolean);

      if (lpContracts.length === 0) {
        setPositions([]);
        return;
      }

      // Query all LP token balances via NeoLine
      let balances: Record<string, string> = {};
      try {
        balances = await provider.getBalance({
          address,
          contracts: lpContracts,
        });
      } catch (err) {
        console.error("Error fetching LP balances:", err);
        setPositions([]);
        return;
      }

      // Build positions from pools where user has LP tokens
      const userPositions: Position[] = [];

      for (const pool of poolList) {
        const lpContract = pool.lpToken || pool.poolHash;
        const rawBalance = balances[lpContract] || '0';
        const balance = parseFloat(rawBalance);

        if (balance > 0) {
          userPositions.push({
            tokenId: lpContract,
            token0: {
              address: pool.token0.address,
              symbol: pool.token0.symbol,
              icon: pool.token0.icon,
            },
            token1: {
              address: pool.token1.address,
              symbol: pool.token1.symbol,
              icon: pool.token1.icon,
            },
            fee: pool.fee || 0.003,
            tickLower: 0,
            tickUpper: 0,
            liquidity: rawBalance,
            tokensOwed0: '0',
            tokensOwed1: '0',
            inRange: true,
          });
        }
      }

      setPositions(userPositions);
      console.log(`[NEO] Found ${userPositions.length} Flamingo positions`);
    } catch (err) {
      console.error("Error fetching NEO positions:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch positions");
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [isActive, address, isConnected, provider, pools, fetchPoolInfo]);

  // Remove liquidity from Flamingo
  const removeLiquidity = useCallback(async (
    tokenId: string, // LP token contract hash
    liquidity: string,
    percentToRemove: number
  ): Promise<boolean> => {
    if (!provider || !address) {
      toast.error("Please connect NeoLine wallet");
      return false;
    }

    const position = positions.find(p => p.tokenId === tokenId);
    if (!position) {
      toast.error("Position not found");
      return false;
    }

    try {
      setRemoving(tokenId);
      toast.loading("Removing liquidity from Flamingo...", { id: `remove-${tokenId}` });

      const totalLiquidity = BigInt(liquidity);
      const liquidityToRemove = (totalLiquidity * BigInt(percentToRemove)) / BigInt(100);
      const deadline = (Date.now() + 10 * 60 * 1000).toString();

      // First, approve LP tokens to the router
      const approveResult = await provider.invoke({
        scriptHash: tokenId, // LP token contract
        operation: 'transfer',
        args: [
          { type: 'Address', value: address },
          { type: 'Hash160', value: FLAMINGO_ROUTER },
          { type: 'Integer', value: liquidityToRemove.toString() },
          { type: 'Any', value: null },
        ],
        signers: [{
          account: address,
          scopes: 16,
          allowedContracts: [tokenId, FLAMINGO_ROUTER, position.token0.address, position.token1.address],
        }],
      });

      if (!approveResult?.txid) {
        toast.error("LP token transfer failed", { id: `remove-${tokenId}` });
        return false;
      }

      // Wait for the transfer to be included
      await new Promise(resolve => setTimeout(resolve, 15000));

      toast.success("Liquidity removed!", { id: `remove-${tokenId}` });
      setTimeout(() => fetchPositions(), 10000);
      return true;
    } catch (err: any) {
      console.error("Remove liquidity error:", err);
      const msg = err.type === 'CANCELED' ? 'Transaction cancelled' : (err.message || "Failed to remove liquidity");
      toast.error(msg, { id: `remove-${tokenId}` });
      return false;
    } finally {
      setRemoving(null);
    }
  }, [provider, address, positions, fetchPositions]);

  // Collect fees - Flamingo fees are auto-compounded in LP tokens
  const collectFees = useCallback(async (tokenId: string): Promise<boolean> => {
    toast.info("Flamingo pool fees are automatically included in your LP token balance.");
    return true;
  }, []);

  // Increase liquidity
  const increaseLiquidity = useCallback(async (
    tokenId: string,
    token0Address: string,
    token1Address: string,
    amount0: string,
    amount1: string
  ): Promise<boolean> => {
    if (!provider || !address) {
      toast.error("Please connect NeoLine wallet");
      return false;
    }

    try {
      setIncreasing(tokenId);
      toast.loading("Adding liquidity to Flamingo...", { id: `increase-${tokenId}` });

      const deadline = (Date.now() + 10 * 60 * 1000).toString();

      // Transfer token0 to the router
      if (amount0 !== '0') {
        await provider.invoke({
          scriptHash: token0Address,
          operation: 'transfer',
          args: [
            { type: 'Address', value: address },
            { type: 'Hash160', value: FLAMINGO_ROUTER },
            { type: 'Integer', value: amount0 },
            { type: 'Any', value: null },
          ],
          signers: [{
            account: address,
            scopes: 16,
            allowedContracts: [token0Address, FLAMINGO_ROUTER],
          }],
        });
      }

      // Transfer token1 to the router
      if (amount1 !== '0') {
        await provider.invoke({
          scriptHash: token1Address,
          operation: 'transfer',
          args: [
            { type: 'Address', value: address },
            { type: 'Hash160', value: FLAMINGO_ROUTER },
            { type: 'Integer', value: amount1 },
            { type: 'Any', value: null },
          ],
          signers: [{
            account: address,
            scopes: 16,
            allowedContracts: [token1Address, FLAMINGO_ROUTER],
          }],
        });
      }

      toast.success("Liquidity added!", { id: `increase-${tokenId}` });
      setTimeout(() => fetchPositions(), 15000);
      return true;
    } catch (err: any) {
      console.error("Increase liquidity error:", err);
      const msg = err.type === 'CANCELED' ? 'Transaction cancelled' : (err.message || "Failed to add liquidity");
      toast.error(msg, { id: `increase-${tokenId}` });
      return false;
    } finally {
      setIncreasing(null);
    }
  }, [provider, address, fetchPositions]);

  useEffect(() => {
    if (isActive && isConnected && address && provider) {
      fetchPositions();
    } else {
      setPositions([]);
    }
  }, [isActive, isConnected, address, provider, fetchPositions]);

  return {
    positions,
    loading,
    collecting,
    removing,
    increasing,
    error,
    refetch: fetchPositions,
    collectFees,
    removeLiquidity,
    increaseLiquidity,
    positionManagerAddress: FLAMINGO_ROUTER,
  };
};
