import { useState, useCallback } from "react";
import { useTronLink } from "./useTronLink";
import { toast } from "sonner";

// SunSwap V3 NonfungiblePositionManager on TRON
const SUNSWAP_V3_PM = 'TLSWrv7eC1AZCXkRjpqMZUmvgd99cj7pPF';
const WTRX = 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR';

// Tick spacing for SunSwap V3 fee tiers
const TICK_SPACING: Record<number, number> = {
  100: 1,
  500: 10,
  3000: 60,
  10000: 200,
};

export const useAddLiquidityTron = () => {
  const { address, isConnected, tronWeb } = useTronLink();
  const [isApproving, setIsApproving] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  const parseAmount = useCallback((amount: string, decimals: number): string => {
    if (!amount || isNaN(parseFloat(amount))) return '0';
    const [whole, fraction = ''] = amount.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return (BigInt(whole + paddedFraction)).toString();
  }, []);

  const priceToTick = useCallback((price: number): number => {
    if (price <= 0) return -887272;
    return Math.floor(Math.log(price) / Math.log(1.0001));
  }, []);

  const roundTick = useCallback((tick: number, tickSpacing: number, roundUp: boolean): number => {
    const rounded = Math.round(tick / tickSpacing) * tickSpacing;
    if (roundUp && rounded < tick) return rounded + tickSpacing;
    if (!roundUp && rounded > tick) return rounded - tickSpacing;
    return rounded;
  }, []);

  // Approve token on TRON
  const approveToken = useCallback(async (tokenAddress: string, amount: string): Promise<boolean> => {
    if (!tronWeb || !address) return false;

    try {
      setIsApproving(true);
      toast.loading("Approving token on SunSwap...", { id: "approve-sun" });

      const maxApproval = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
      
      const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
        tokenAddress,
        'approve(address,uint256)',
        { feeLimit: 100_000_000, callValue: 0 },
        [
          { type: 'address', value: SUNSWAP_V3_PM },
          { type: 'uint256', value: maxApproval },
        ],
        address
      );

      const signedTx = await tronWeb.trx.sign(transaction);
      const result = await tronWeb.trx.sendRawTransaction(signedTx) as any;

      if (result?.txid || result?.transaction?.txID) {
        toast.success("Token approved!", { id: "approve-sun" });
        await new Promise(r => setTimeout(r, 3000));
        return true;
      }
      toast.error("Approval failed", { id: "approve-sun" });
      return false;
    } catch (err: any) {
      toast.error(err.message || "Approval failed", { id: "approve-sun" });
      return false;
    } finally {
      setIsApproving(false);
    }
  }, [tronWeb, address]);

  // Add liquidity to SunSwap V3
  const addLiquidity = useCallback(async (
    token0Address: string,
    token1Address: string,
    token0Decimals: number,
    token1Decimals: number,
    amount0: string,
    amount1: string,
    feeTier: number,
    priceLower: number,
    priceUpper: number,
    slippage: number = 0.5
  ): Promise<string | null> => {
    if (!isConnected || !address || !tronWeb) {
      toast.error("Please connect TronLink wallet");
      return null;
    }

    const amount0Parsed = parseAmount(amount0, token0Decimals);
    const amount1Parsed = parseAmount(amount1, token1Decimals);

    if (amount0Parsed === '0' && amount1Parsed === '0') {
      toast.error("Please enter amounts");
      return null;
    }

    try {
      // Approve tokens
      if (amount0Parsed !== '0') {
        const approved = await approveToken(token0Address, amount0Parsed);
        if (!approved) return null;
      }
      if (amount1Parsed !== '0') {
        const approved = await approveToken(token1Address, amount1Parsed);
        if (!approved) return null;
      }

      setIsMinting(true);
      toast.loading("Adding liquidity to SunSwap V3...", { id: "mint-sun" });

      // Calculate ticks
      const tickSpacing = TICK_SPACING[feeTier] || 60;
      const tickLower = roundTick(priceToTick(priceLower), tickSpacing, false);
      const tickUpper = roundTick(priceToTick(priceUpper), tickSpacing, true);

      // Slippage
      const slippageMultiplier = Math.floor((100 - slippage) * 100);
      const amount0Min = (BigInt(amount0Parsed) * BigInt(slippageMultiplier) / BigInt(10000)).toString();
      const amount1Min = (BigInt(amount1Parsed) * BigInt(slippageMultiplier) / BigInt(10000)).toString();
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      // Sort tokens
      let sortedToken0 = token0Address;
      let sortedToken1 = token1Address;
      let sortedAmount0 = amount0Parsed;
      let sortedAmount1 = amount1Parsed;
      let sortedAmount0Min = amount0Min;
      let sortedAmount1Min = amount1Min;

      // TronWeb address comparison
      const addr0Hex = (tronWeb as any).address?.toHex?.(token0Address) || token0Address;
      const addr1Hex = (tronWeb as any).address?.toHex?.(token1Address) || token1Address;
      
      if (addr0Hex.toLowerCase() > addr1Hex.toLowerCase()) {
        [sortedToken0, sortedToken1] = [sortedToken1, sortedToken0];
        [sortedAmount0, sortedAmount1] = [sortedAmount1, sortedAmount0];
        [sortedAmount0Min, sortedAmount1Min] = [sortedAmount1Min, sortedAmount0Min];
      }

      // Call mint on NonfungiblePositionManager
      const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
        SUNSWAP_V3_PM,
        'mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))',
        { feeLimit: 500_000_000, callValue: 0 },
        [
          { type: 'address', value: sortedToken0 },
          { type: 'address', value: sortedToken1 },
          { type: 'uint24', value: feeTier.toString() },
          { type: 'int24', value: tickLower.toString() },
          { type: 'int24', value: tickUpper.toString() },
          { type: 'uint256', value: sortedAmount0 },
          { type: 'uint256', value: sortedAmount1 },
          { type: 'uint256', value: sortedAmount0Min },
          { type: 'uint256', value: sortedAmount1Min },
          { type: 'address', value: address },
          { type: 'uint256', value: deadline.toString() },
        ],
        address
      );

      const signedTx = await tronWeb.trx.sign(transaction);
      const result = await tronWeb.trx.sendRawTransaction(signedTx) as any;

      if (result?.txid || result?.transaction?.txID) {
        const txId = result.txid || result.transaction.txID;
        toast.success("Liquidity added to SunSwap V3!", { id: "mint-sun" });
        return txId;
      }
      toast.error("Transaction failed", { id: "mint-sun" });
      return null;
    } catch (err: any) {
      console.error("SunSwap mint error:", err);
      toast.error(err.message || "Failed to add liquidity", { id: "mint-sun" });
      return null;
    } finally {
      setIsMinting(false);
    }
  }, [isConnected, address, tronWeb, parseAmount, priceToTick, roundTick, approveToken]);

  return {
    addLiquidity,
    isApproving,
    isMinting,
    isLoading: isApproving || isMinting,
  };
};
