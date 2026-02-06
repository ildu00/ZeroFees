import { useState, useCallback } from "react";
import { useNeoLine } from "./useNeoLine";
import { toast } from "sonner";

// Flamingo DEX contracts on NEO N3
const FLAMINGO_ROUTER = '0xde3a4b093abbd07e9a69cdec88a54d9a1fe14975';

export const useAddLiquidityNeo = () => {
  const { address, isConnected, provider } = useNeoLine();
  const [isApproving, setIsApproving] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  // Add liquidity to Flamingo (simple LP)
  const addLiquidity = useCallback(async (
    token0Address: string,
    token1Address: string,
    amount0: string,
    amount1: string
  ): Promise<string | null> => {
    if (!isConnected || !address || !provider) {
      toast.error("Please connect NeoLine wallet");
      return null;
    }

    if (!amount0 || !amount1 || amount0 === '0' || amount1 === '0') {
      toast.error("Please enter both token amounts");
      return null;
    }

    try {
      setIsMinting(true);
      toast.loading("Adding liquidity to Flamingo...", { id: "mint-flm" });

      // Transfer token0 to router
      setIsApproving(true);
      toast.loading("Transferring token 0...", { id: "mint-flm" });

      const transfer0Result = await provider.invoke({
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

      if (!transfer0Result?.txid) {
        toast.error("Token 0 transfer failed", { id: "mint-flm" });
        return null;
      }

      // Wait for confirmation
      await new Promise(r => setTimeout(r, 15000));
      setIsApproving(false);

      // Transfer token1 to router
      toast.loading("Transferring token 1...", { id: "mint-flm" });

      const transfer1Result = await provider.invoke({
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

      if (!transfer1Result?.txid) {
        toast.error("Token 1 transfer failed", { id: "mint-flm" });
        return null;
      }

      const txId = transfer1Result.txid;
      toast.success("Liquidity added to Flamingo!", { id: "mint-flm" });
      return txId;
    } catch (err: any) {
      console.error("Flamingo add liquidity error:", err);
      const msg = err.type === 'CANCELED' ? 'Transaction cancelled' : (err.message || "Failed to add liquidity");
      toast.error(msg, { id: "mint-flm" });
      return null;
    } finally {
      setIsApproving(false);
      setIsMinting(false);
    }
  }, [isConnected, address, provider]);

  return {
    addLiquidity,
    isApproving,
    isMinting,
    isLoading: isApproving || isMinting,
  };
};
