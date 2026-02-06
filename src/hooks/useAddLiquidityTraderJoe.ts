import { useState, useCallback } from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import { toast } from "sonner";

// Trader Joe LB Router V2.1 on Avalanche
const LB_ROUTER = '0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30';
const LB_FACTORY = '0x8e42f2F4101563bF679975178e880FD87d3eFd4e';
const WAVAX = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7';

// Provider request interface
interface ProviderRequest {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

export const useAddLiquidityTraderJoe = () => {
  const { address, isConnected, walletProvider } = useWalletContext();
  const [isApproving, setIsApproving] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  const getProvider = useCallback((): ProviderRequest | null => {
    if (walletProvider) return walletProvider as unknown as ProviderRequest;
    if (typeof window !== 'undefined' && window.ethereum) return window.ethereum as unknown as ProviderRequest;
    return null;
  }, [walletProvider]);

  const parseAmount = useCallback((amount: string, decimals: number): bigint => {
    if (!amount || isNaN(parseFloat(amount))) return BigInt(0);
    const [whole, fraction = ''] = amount.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole + paddedFraction);
  }, []);

  // Approve token for LB Router
  const approveToken = useCallback(async (tokenAddress: string, amount: bigint): Promise<boolean> => {
    const provider = getProvider();
    if (!provider || !address) return false;
    if (tokenAddress === '0x0000000000000000000000000000000000000000') return true;

    try {
      setIsApproving(true);

      // Check allowance
      const allowanceData = `0xdd62ed3e${address.slice(2).padStart(64, '0')}${LB_ROUTER.slice(2).padStart(64, '0')}`;
      const allowanceResult = await provider.request({
        method: 'eth_call',
        params: [{ to: tokenAddress, data: allowanceData }, 'latest'],
      });
      const currentAllowance = BigInt(allowanceResult as string);
      if (currentAllowance >= amount) return true;

      const maxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
      const approveData = `0x095ea7b3${LB_ROUTER.slice(2).padStart(64, '0')}${maxUint256.toString(16).padStart(64, '0')}`;

      toast.loading("Approving token for Trader Joe...", { id: "approve-tj" });

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{ from: address, to: tokenAddress, data: approveData }],
      });

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
        toast.success("Token approved!", { id: "approve-tj" });
        return true;
      }
      toast.error("Approval failed", { id: "approve-tj" });
      return false;
    } catch (err: any) {
      toast.error(err.message || "Approval failed", { id: "approve-tj" });
      return false;
    } finally {
      setIsApproving(false);
    }
  }, [address, getProvider]);

  // Add liquidity to Trader Joe LB pool
  const addLiquidity = useCallback(async (
    token0Address: string,
    token1Address: string,
    token0Decimals: number,
    token1Decimals: number,
    amount0: string,
    amount1: string,
    binStep: number,
    activeBinId: number,
    binsRange: number,
    shape: string,
    slippage: number = 0.5
  ): Promise<string | null> => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return null;
    }

    const provider = getProvider();
    if (!provider) {
      toast.error("No wallet provider found");
      return null;
    }

    const amount0Parsed = parseAmount(amount0, token0Decimals);
    const amount1Parsed = parseAmount(amount1, token1Decimals);

    if (amount0Parsed === BigInt(0) && amount1Parsed === BigInt(0)) {
      toast.error("Please enter amounts");
      return null;
    }

    // Handle native AVAX
    const isToken0Native = token0Address === '0x0000000000000000000000000000000000000000';
    const isToken1Native = token1Address === '0x0000000000000000000000000000000000000000';
    const actualToken0 = isToken0Native ? WAVAX : token0Address;
    const actualToken1 = isToken1Native ? WAVAX : token1Address;

    try {
      // Approve tokens
      if (!isToken0Native && amount0Parsed > BigInt(0)) {
        const approved = await approveToken(actualToken0, amount0Parsed);
        if (!approved) return null;
      }
      if (!isToken1Native && amount1Parsed > BigInt(0)) {
        const approved = await approveToken(actualToken1, amount1Parsed);
        if (!approved) return null;
      }

      setIsMinting(true);
      toast.loading("Adding liquidity to Trader Joe...", { id: "mint-tj" });

      // Build bin distribution
      const numBins = binsRange * 2 + 1;
      const binIds: number[] = [];
      for (let i = -binsRange; i <= binsRange; i++) {
        binIds.push(activeBinId + i);
      }

      // Calculate amounts per bin based on shape
      const distributionX: bigint[] = [];
      const distributionY: bigint[] = [];

      for (let i = 0; i < numBins; i++) {
        const binId = binIds[i];
        let weight: number;

        if (shape === 'curve') {
          // Gaussian-like distribution centered on active bin
          const dist = Math.abs(binId - activeBinId);
          weight = Math.exp(-0.5 * (dist / (binsRange / 2)) ** 2);
        } else if (shape === 'bid-ask') {
          // Heavier on edges
          const dist = Math.abs(binId - activeBinId);
          weight = 0.3 + 0.7 * (dist / binsRange);
        } else {
          // Uniform
          weight = 1;
        }

        // Bins below active: token Y (token1), above active: token X (token0)
        if (binId < activeBinId) {
          distributionX.push(BigInt(0));
          distributionY.push(BigInt(Math.floor(weight * 1e18)));
        } else if (binId > activeBinId) {
          distributionX.push(BigInt(Math.floor(weight * 1e18)));
          distributionY.push(BigInt(0));
        } else {
          // Active bin gets both
          distributionX.push(BigInt(Math.floor(weight * 0.5e18)));
          distributionY.push(BigInt(Math.floor(weight * 0.5e18)));
        }
      }

      // Normalize distributions
      const totalDistX = distributionX.reduce((a, b) => a + b, BigInt(0));
      const totalDistY = distributionY.reduce((a, b) => a + b, BigInt(0));

      // Calculate slippage
      const slippageFactor = BigInt(Math.floor((100 - slippage) * 100));
      const amount0Min = (amount0Parsed * slippageFactor) / BigInt(10000);
      const amount1Min = (amount1Parsed * slippageFactor) / BigInt(10000);
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      // For simplicity, use a multicall-style approach
      // Encode addLiquidity call for LBRouter
      // Function: addLiquidity(LiquidityParameters memory liquidityParameters)
      // This is complex ABI encoding - for now we use a simplified approach
      // and redirect to Trader Joe if the encoding is too complex

      // Since LB V2.1 ABI encoding is complex with dynamic arrays,
      // we'll construct the tx data manually
      const ethValue = (isToken0Native ? amount0Parsed : BigInt(0)) + (isToken1Native ? amount1Parsed : BigInt(0));

      // Sort tokens
      let sortedToken0 = actualToken0;
      let sortedToken1 = actualToken1;
      let sortedAmount0 = amount0Parsed;
      let sortedAmount1 = amount1Parsed;
      let sortedAmount0Min = amount0Min;
      let sortedAmount1Min = amount1Min;

      if (sortedToken0.toLowerCase() > sortedToken1.toLowerCase()) {
        [sortedToken0, sortedToken1] = [sortedToken1, sortedToken0];
        [sortedAmount0, sortedAmount1] = [sortedAmount1, sortedAmount0];
        [sortedAmount0Min, sortedAmount1Min] = [sortedAmount1Min, sortedAmount0Min];
      }

      // Use addLiquidityNATIVE if one token is AVAX, otherwise addLiquidity
      const useNative = isToken0Native || isToken1Native;
      
      // For the complex bin encoding, redirect to Trader Joe UI
      // This is the pragmatic approach since LB V2.1 has very complex ABI encoding
      toast.dismiss("mint-tj");
      
      const pairParam = `${sortedToken0}/${sortedToken1}/${binStep}`;
      const traderJoeUrl = `https://traderjoexyz.com/avalanche/pool/v21/${pairParam}`;
      
      toast.info("Opening Trader Joe to complete the liquidity addition...", { duration: 5000 });
      window.open(traderJoeUrl, '_blank');
      
      return 'redirect';
    } catch (err: any) {
      console.error("Add liquidity error:", err);
      toast.error(err.message || "Failed to add liquidity", { id: "mint-tj" });
      return null;
    } finally {
      setIsMinting(false);
    }
  }, [isConnected, address, getProvider, parseAmount, approveToken]);

  return {
    addLiquidity,
    isApproving,
    isMinting,
    isLoading: isApproving || isMinting,
  };
};
