import { useState, useCallback } from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import { toast } from "sonner";

// Uniswap V3 contracts on Base
const NONFUNGIBLE_POSITION_MANAGER = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";

// Common tokens on Base
export const BASE_TOKENS: Record<string, { address: string; decimals: number; icon: string }> = {
  'ETH': { 
    address: '0x0000000000000000000000000000000000000000', 
    decimals: 18,
    icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
  },
  'WETH': { 
    address: '0x4200000000000000000000000000000000000006', 
    decimals: 18,
    icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
  },
  'USDC': { 
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 
    decimals: 6,
    icon: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
  },
  'USDbC': { 
    address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', 
    decimals: 6,
    icon: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
  },
  'DAI': { 
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', 
    decimals: 18,
    icon: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png'
  },
  'WBTC': { 
    address: '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c', 
    decimals: 8,
    icon: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png'
  },
};

// Fee tiers available on Uniswap V3
export const FEE_TIERS = [
  { value: 100, label: '0.01%', description: 'Best for stable pairs' },
  { value: 500, label: '0.05%', description: 'Best for stable pairs' },
  { value: 3000, label: '0.3%', description: 'Best for most pairs' },
  { value: 10000, label: '1%', description: 'Best for exotic pairs' },
];

// Tick spacing for each fee tier
const TICK_SPACING: Record<number, number> = {
  100: 1,
  500: 10,
  3000: 60,
  10000: 200,
};

interface MintParams {
  token0Address: string;
  token1Address: string;
  fee: number;
  tickLower: number;
  tickUpper: number;
  amount0Desired: bigint;
  amount1Desired: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
}

// Type for EIP-1193 provider request
interface ProviderRequest {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

export const useAddLiquidity = () => {
  const { address, isConnected, walletProvider } = useWalletContext();
  const [isApproving, setIsApproving] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  // Get the Ethereum provider
  const getProvider = useCallback((): ProviderRequest | null => {
    if (walletProvider) return walletProvider as unknown as ProviderRequest;
    if (typeof window !== 'undefined' && window.ethereum) return window.ethereum as unknown as ProviderRequest;
    return null;
  }, [walletProvider]);

  // Parse amount to wei based on decimals
  const parseAmount = useCallback((amount: string, decimals: number): bigint => {
    if (!amount || isNaN(parseFloat(amount))) return BigInt(0);
    const [whole, fraction = ''] = amount.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole + paddedFraction);
  }, []);

  // Calculate tick from price
  const priceToTick = useCallback((price: number): number => {
    if (price <= 0) return -887272;
    return Math.floor(Math.log(price) / Math.log(1.0001));
  }, []);

  // Round tick to nearest valid tick based on tick spacing
  const roundTick = useCallback((tick: number, tickSpacing: number, roundUp: boolean): number => {
    const rounded = Math.round(tick / tickSpacing) * tickSpacing;
    if (roundUp && rounded < tick) return rounded + tickSpacing;
    if (!roundUp && rounded > tick) return rounded - tickSpacing;
    return rounded;
  }, []);

  // Check and approve token if needed
  const approveToken = useCallback(async (
    tokenAddress: string,
    amount: bigint
  ): Promise<boolean> => {
    const provider = getProvider();
    if (!provider || !address) return false;

    // Skip for ETH
    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
      return true;
    }

    try {
      setIsApproving(true);

      // Check current allowance
      const allowanceData = `0xdd62ed3e${address.slice(2).padStart(64, '0')}${NONFUNGIBLE_POSITION_MANAGER.slice(2).padStart(64, '0')}`;
      const allowanceResult = await provider.request({
        method: 'eth_call',
        params: [{
          to: tokenAddress,
          data: allowanceData,
        }, 'latest'],
      });

      const currentAllowance = BigInt(allowanceResult as string);
      
      if (currentAllowance >= amount) {
        console.log("Already approved");
        return true;
      }

      // Approve max amount
      const maxUint256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
      const approveData = `0x095ea7b3${NONFUNGIBLE_POSITION_MANAGER.slice(2).padStart(64, '0')}${maxUint256.toString(16).padStart(64, '0')}`;

      toast.loading("Approving token...", { id: "approve" });

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: tokenAddress,
          data: approveData,
        }],
      });

      // Wait for confirmation
      let receipt = null;
      while (!receipt) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        receipt = await provider.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        }) as { status: string } | null;
      }

      if (receipt.status === '0x1') {
        toast.success("Token approved!", { id: "approve" });
        return true;
      } else {
        toast.error("Approval failed", { id: "approve" });
        return false;
      }
    } catch (error: any) {
      console.error("Approval error:", error);
      toast.error(error.message || "Approval failed", { id: "approve" });
      return false;
    } finally {
      setIsApproving(false);
    }
  }, [address, getProvider]);

  // Mint new position
  const mintPosition = useCallback(async (params: MintParams): Promise<string | null> => {
    const provider = getProvider();
    if (!provider || !address) {
      toast.error("Wallet not connected");
      return null;
    }

    try {
      setIsMinting(true);

      // Sort tokens (token0 < token1)
      let token0 = params.token0Address;
      let token1 = params.token1Address;
      let amount0 = params.amount0Desired;
      let amount1 = params.amount1Desired;
      let amount0Min = params.amount0Min;
      let amount1Min = params.amount1Min;

      if (token0.toLowerCase() > token1.toLowerCase()) {
        [token0, token1] = [token1, token0];
        [amount0, amount1] = [amount1, amount0];
        [amount0Min, amount1Min] = [amount1Min, amount0Min];
      }

      // Handle WETH wrapping for ETH
      const isToken0ETH = token0 === '0x0000000000000000000000000000000000000000';
      const isToken1ETH = token1 === '0x0000000000000000000000000000000000000000';
      
      if (isToken0ETH) token0 = BASE_TOKENS.WETH.address;
      if (isToken1ETH) token1 = BASE_TOKENS.WETH.address;

      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes

      // Encode mint params
      const mintData = encodeMintCall({
        token0,
        token1,
        fee: params.fee,
        tickLower: params.tickLower,
        tickUpper: params.tickUpper,
        amount0Desired: amount0,
        amount1Desired: amount1,
        amount0Min: amount0Min,
        amount1Min: amount1Min,
        recipient: address,
        deadline: BigInt(deadline),
      });

      // Calculate ETH value to send
      const ethValue = (isToken0ETH ? amount0 : BigInt(0)) + (isToken1ETH ? amount1 : BigInt(0));

      toast.loading("Adding liquidity...", { id: "mint" });

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: NONFUNGIBLE_POSITION_MANAGER,
          data: mintData,
          value: ethValue > 0 ? '0x' + ethValue.toString(16) : '0x0',
        }],
      }) as string;

      // Wait for confirmation
      let receipt: { status: string } | null = null;
      while (!receipt) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        receipt = await provider.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        }) as { status: string } | null;
      }

      if (receipt.status === '0x1') {
        toast.success("Liquidity added successfully!", { id: "mint" });
        return txHash;
      } else {
        toast.error("Transaction failed", { id: "mint" });
        return null;
      }
    } catch (error: any) {
      console.error("Mint error:", error);
      toast.error(error.message || "Failed to add liquidity", { id: "mint" });
      return null;
    } finally {
      setIsMinting(false);
    }
  }, [address, getProvider]);

  // Add liquidity helper function
  const addLiquidity = useCallback(async (
    token0Symbol: string,
    token1Symbol: string,
    amount0: string,
    amount1: string,
    feeTier: number,
    priceLower: number,
    priceUpper: number,
    slippage: number = 0.5
  ): Promise<string | null> => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return null;
    }

    const token0Info = BASE_TOKENS[token0Symbol];
    const token1Info = BASE_TOKENS[token1Symbol];

    if (!token0Info || !token1Info) {
      toast.error("Token not supported");
      return null;
    }

    const amount0Parsed = parseAmount(amount0, token0Info.decimals);
    const amount1Parsed = parseAmount(amount1, token1Info.decimals);

    if (amount0Parsed === BigInt(0) && amount1Parsed === BigInt(0)) {
      toast.error("Please enter amounts");
      return null;
    }

    // Approve tokens
    if (token0Info.address !== '0x0000000000000000000000000000000000000000') {
      const approved = await approveToken(token0Info.address, amount0Parsed);
      if (!approved) return null;
    }

    if (token1Info.address !== '0x0000000000000000000000000000000000000000') {
      const approved = await approveToken(token1Info.address, amount1Parsed);
      if (!approved) return null;
    }

    // Calculate ticks from prices
    const tickSpacing = TICK_SPACING[feeTier] || 60;
    const tickLower = roundTick(priceToTick(priceLower), tickSpacing, false);
    const tickUpper = roundTick(priceToTick(priceUpper), tickSpacing, true);

    // Calculate min amounts with slippage
    const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100));
    const amount0Min = (amount0Parsed * slippageMultiplier) / BigInt(10000);
    const amount1Min = (amount1Parsed * slippageMultiplier) / BigInt(10000);

    return mintPosition({
      token0Address: token0Info.address,
      token1Address: token1Info.address,
      fee: feeTier,
      tickLower,
      tickUpper,
      amount0Desired: amount0Parsed,
      amount1Desired: amount1Parsed,
      amount0Min,
      amount1Min,
    });
  }, [isConnected, address, parseAmount, priceToTick, roundTick, approveToken, mintPosition]);

  return {
    addLiquidity,
    isApproving,
    isMinting,
    isLoading: isApproving || isMinting,
  };
};

// Helper function to encode mint call
function encodeMintCall(params: {
  token0: string;
  token1: string;
  fee: number;
  tickLower: number;
  tickUpper: number;
  amount0Desired: bigint;
  amount1Desired: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
  recipient: string;
  deadline: bigint;
}): string {
  // Function selector for mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))
  const selector = '0x88316456';
  
  // Encode parameters
  const token0 = params.token0.slice(2).toLowerCase().padStart(64, '0');
  const token1 = params.token1.slice(2).toLowerCase().padStart(64, '0');
  const fee = params.fee.toString(16).padStart(64, '0');
  const tickLower = toTwosComplement(params.tickLower).padStart(64, '0');
  const tickUpper = toTwosComplement(params.tickUpper).padStart(64, '0');
  const amount0Desired = params.amount0Desired.toString(16).padStart(64, '0');
  const amount1Desired = params.amount1Desired.toString(16).padStart(64, '0');
  const amount0Min = params.amount0Min.toString(16).padStart(64, '0');
  const amount1Min = params.amount1Min.toString(16).padStart(64, '0');
  const recipient = params.recipient.slice(2).toLowerCase().padStart(64, '0');
  const deadline = params.deadline.toString(16).padStart(64, '0');
  
  return selector + token0 + token1 + fee + tickLower + tickUpper + 
         amount0Desired + amount1Desired + amount0Min + amount1Min + 
         recipient + deadline;
}

function toTwosComplement(num: number): string {
  if (num >= 0) {
    return num.toString(16);
  }
  // Convert negative number to two's complement
  const hex = (BigInt(2) ** BigInt(256) + BigInt(num)).toString(16);
  return hex;
}
