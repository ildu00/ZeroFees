import { useState, useCallback, useEffect } from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import { useChain } from "@/contexts/ChainContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Position } from "./usePositions";

// Trader Joe LB V2.1 contracts on Avalanche
const LB_ROUTER = '0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30';
const WAVAX = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7';

// ERC20 approve selector
const APPROVE_SELECTOR = '0x095ea7b3';

// Provider request interface
interface ProviderRequest {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

export const useAvalanchePositions = () => {
  const { address, isConnected, walletProvider } = useWalletContext();
  const { currentChain } = useChain();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [increasing, setIncreasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isActive = currentChain.id === 'avalanche';

  const getProvider = useCallback((): ProviderRequest | null => {
    if (walletProvider) return walletProvider as unknown as ProviderRequest;
    if (typeof window !== 'undefined' && window.ethereum) return window.ethereum as unknown as ProviderRequest;
    return null;
  }, [walletProvider]);

  // Fetch positions via edge function (subgraph / API)
  const fetchPositions = useCallback(async () => {
    if (!isActive || !address || !isConnected) {
      setPositions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.functions.invoke('get-chain-positions', {
        body: { chain: 'avalanche', address },
      });

      if (fetchError) throw fetchError;

      if (data?.positions && Array.isArray(data.positions)) {
        setPositions(data.positions);
        console.log(`[Avalanche] Found ${data.positions.length} positions`);
      } else {
        setPositions([]);
      }
    } catch (err) {
      console.error("Error fetching Avalanche positions:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch positions");
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [isActive, address, isConnected]);

  // Approve token for LBRouter
  const approveToken = useCallback(async (tokenAddress: string): Promise<boolean> => {
    const provider = getProvider();
    if (!provider || !address) return false;
    if (tokenAddress === '0x0000000000000000000000000000000000000000') return true;

    try {
      const maxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
      const spender = LB_ROUTER.slice(2).toLowerCase().padStart(64, '0');
      const amount = maxUint256.toString(16).padStart(64, '0');
      const approveData = `${APPROVE_SELECTOR}${spender}${amount}`;

      toast.loading("Approving token...", { id: "approve-avax" });

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{ from: address, to: tokenAddress, data: approveData }],
      });

      // Wait for confirmation
      let receipt = null;
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        receipt = await provider.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        }) as { status: string } | null;
        if (receipt) break;
      }

      if (receipt?.status === '0x1') {
        toast.success("Token approved!", { id: "approve-avax" });
        return true;
      }
      toast.error("Approval failed", { id: "approve-avax" });
      return false;
    } catch (err: any) {
      toast.error(err.message || "Approval failed", { id: "approve-avax" });
      return false;
    }
  }, [address, getProvider]);

  // Remove liquidity from Trader Joe LB pair
  const removeLiquidity = useCallback(async (
    tokenId: string,
    liquidity: string,
    percentToRemove: number
  ): Promise<boolean> => {
    const provider = getProvider();
    if (!provider || !address) {
      toast.error("Wallet not connected");
      return false;
    }

    // Find the position to get pair details
    const position = positions.find(p => p.tokenId === tokenId);
    if (!position) {
      toast.error("Position not found");
      return false;
    }

    try {
      setRemoving(tokenId);
      toast.loading("Removing liquidity from Trader Joe...", { id: `remove-${tokenId}` });

      // For Trader Joe LB, we need to call removeLiquidity on the LBRouter
      // This requires bin IDs and amounts - simplified approach using pair's removeLiquidity
      const pairAddress = (position as any).pairAddress;
      if (!pairAddress) {
        toast.error("Pair address not available. Please manage this position on Trader Joe directly.", { id: `remove-${tokenId}` });
        window.open('https://traderjoexyz.com/avalanche/pool', '_blank');
        return false;
      }

      // For now, redirect to Trader Joe for complex LB operations
      toast.info("Redirecting to Trader Joe for LB position management...", { id: `remove-${tokenId}` });
      window.open(`https://traderjoexyz.com/avalanche/pool/${pairAddress}`, '_blank');
      return true;
    } catch (err: any) {
      console.error("Remove liquidity error:", err);
      toast.error(err.message || "Failed to remove liquidity", { id: `remove-${tokenId}` });
      return false;
    } finally {
      setRemoving(null);
    }
  }, [address, getProvider, positions]);

  // Collect fees - Trader Joe LB fees are auto-compounded, no separate collect
  const collectFees = useCallback(async (tokenId: string): Promise<boolean> => {
    toast.info("Trader Joe LB fees are automatically included in your position. No separate collection needed.");
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
    const position = positions.find(p => p.tokenId === tokenId);
    if (!position) {
      toast.error("Position not found");
      return false;
    }

    try {
      setIncreasing(tokenId);
      const pairAddress = (position as any).pairAddress;
      
      toast.info("Redirecting to Trader Joe to add more liquidity...", { id: `increase-${tokenId}` });
      window.open(
        pairAddress 
          ? `https://traderjoexyz.com/avalanche/pool/${pairAddress}` 
          : 'https://traderjoexyz.com/avalanche/pool',
        '_blank'
      );
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed", { id: `increase-${tokenId}` });
      return false;
    } finally {
      setIncreasing(null);
    }
  }, [positions]);

  useEffect(() => {
    if (isActive && isConnected && address) {
      fetchPositions();
    } else {
      setPositions([]);
    }
  }, [isActive, isConnected, address, fetchPositions]);

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
    positionManagerAddress: LB_ROUTER,
  };
};
