import { useState, useCallback, useEffect } from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import { toast } from "sonner";

// Uniswap V3 contracts on Base
const NONFUNGIBLE_POSITION_MANAGER = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";

// Known tokens on Base
const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number; icon: string }> = {
  '0x4200000000000000000000000000000000000006': { symbol: 'WETH', decimals: 18, icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': { symbol: 'USDC', decimals: 6, icon: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' },
  '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca': { symbol: 'USDbC', decimals: 6, icon: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' },
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': { symbol: 'DAI', decimals: 18, icon: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png' },
};

export interface Position {
  tokenId: string;
  token0: { address: string; symbol: string; icon: string };
  token1: { address: string; symbol: string; icon: string };
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  tokensOwed0: string;
  tokensOwed1: string;
  inRange: boolean;
}

export const usePositions = () => {
  const { address, isConnected } = useWalletContext();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getProvider = useCallback(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return window.ethereum;
    }
    return null;
  }, []);

  const getTokenInfo = (tokenAddress: string) => {
    const addr = tokenAddress.toLowerCase();
    if (KNOWN_TOKENS[addr]) {
      return {
        address: tokenAddress,
        symbol: KNOWN_TOKENS[addr].symbol,
        icon: KNOWN_TOKENS[addr].icon,
      };
    }
    return {
      address: tokenAddress,
      symbol: tokenAddress.slice(0, 6) + '...',
      icon: `https://ui-avatars.com/api/?name=${tokenAddress.slice(2, 4)}&background=6366f1&color=fff&size=64`,
    };
  };

  const fetchPositions = useCallback(async () => {
    const provider = getProvider();
    if (!provider || !address || !isConnected) {
      setPositions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get balance of NFT positions
      // balanceOf(address) = 0x70a08231
      const balanceData = `0x70a08231${address.slice(2).padStart(64, '0')}`;
      const balanceResult = await provider.request({
        method: 'eth_call',
        params: [{
          to: NONFUNGIBLE_POSITION_MANAGER,
          data: balanceData,
        }, 'latest'],
      });

      const balance = parseInt(balanceResult as string, 16);
      console.log(`User has ${balance} positions`);

      if (balance === 0) {
        setPositions([]);
        return;
      }

      const positionPromises: Promise<Position | null>[] = [];

      for (let i = 0; i < balance; i++) {
        positionPromises.push(fetchPositionByIndex(provider, address, i));
      }

      const results = await Promise.all(positionPromises);
      const validPositions = results.filter((p): p is Position => p !== null);
      
      setPositions(validPositions);
    } catch (err) {
      console.error("Error fetching positions:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch positions");
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, getProvider]);

  const fetchPositionByIndex = async (
    provider: any,
    ownerAddress: string,
    index: number
  ): Promise<Position | null> => {
    try {
      // tokenOfOwnerByIndex(address,uint256) = 0x2f745c59
      const tokenIdData = `0x2f745c59${ownerAddress.slice(2).padStart(64, '0')}${index.toString(16).padStart(64, '0')}`;
      const tokenIdResult = await provider.request({
        method: 'eth_call',
        params: [{
          to: NONFUNGIBLE_POSITION_MANAGER,
          data: tokenIdData,
        }, 'latest'],
      });

      const tokenId = BigInt(tokenIdResult as string).toString();

      // positions(uint256) = 0x99fbab88
      const positionData = `0x99fbab88${BigInt(tokenId).toString(16).padStart(64, '0')}`;
      const positionResult = await provider.request({
        method: 'eth_call',
        params: [{
          to: NONFUNGIBLE_POSITION_MANAGER,
          data: positionData,
        }, 'latest'],
      });

      // Decode position data
      const data = (positionResult as string).slice(2);
      // Each value is 32 bytes (64 hex chars)
      // nonce (0), operator (1), token0 (2), token1 (3), fee (4), tickLower (5), tickUpper (6), 
      // liquidity (7), feeGrowthInside0LastX128 (8), feeGrowthInside1LastX128 (9), 
      // tokensOwed0 (10), tokensOwed1 (11)

      const token0Address = '0x' + data.slice(64 * 2 + 24, 64 * 3);
      const token1Address = '0x' + data.slice(64 * 3 + 24, 64 * 4);
      const fee = parseInt(data.slice(64 * 4, 64 * 5), 16);
      const tickLower = parseSignedInt(data.slice(64 * 5, 64 * 6));
      const tickUpper = parseSignedInt(data.slice(64 * 6, 64 * 7));
      const liquidity = BigInt('0x' + data.slice(64 * 7, 64 * 8)).toString();
      const tokensOwed0 = BigInt('0x' + data.slice(64 * 10, 64 * 11)).toString();
      const tokensOwed1 = BigInt('0x' + data.slice(64 * 11, 64 * 12)).toString();

      // Skip positions with 0 liquidity
      if (liquidity === '0') {
        return null;
      }

      // Get current tick to determine if in range (simplified - would need pool contract)
      const inRange = true; // Placeholder - would need to query pool for current tick

      return {
        tokenId,
        token0: getTokenInfo(token0Address),
        token1: getTokenInfo(token1Address),
        fee: fee / 10000,
        tickLower,
        tickUpper,
        liquidity,
        tokensOwed0,
        tokensOwed1,
        inRange,
      };
    } catch (err) {
      console.error(`Error fetching position ${index}:`, err);
      return null;
    }
  };

  // Collect fees from a position
  const collectFees = useCallback(async (tokenId: string): Promise<boolean> => {
    const provider = getProvider();
    if (!provider || !address) {
      toast.error("Wallet not connected");
      return false;
    }

    try {
      setCollecting(tokenId);
      toast.loading("Collecting fees...", { id: `collect-${tokenId}` });

      // collect((uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max))
      // Function selector: 0xfc6f7865
      const maxUint128 = BigInt("0xffffffffffffffffffffffffffffffff");
      
      const collectData = encodeCollectCall({
        tokenId: BigInt(tokenId),
        recipient: address,
        amount0Max: maxUint128,
        amount1Max: maxUint128,
      });

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: NONFUNGIBLE_POSITION_MANAGER,
          data: collectData,
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
        toast.success("Fees collected successfully!", { id: `collect-${tokenId}` });
        // Refresh positions to update unclaimed fees
        await fetchPositions();
        return true;
      } else {
        toast.error("Transaction failed", { id: `collect-${tokenId}` });
        return false;
      }
    } catch (err: any) {
      console.error("Collect error:", err);
      toast.error(err.message || "Failed to collect fees", { id: `collect-${tokenId}` });
      return false;
    } finally {
      setCollecting(null);
    }
  }, [address, getProvider, fetchPositions]);

  useEffect(() => {
    if (isConnected && address) {
      fetchPositions();
    } else {
      setPositions([]);
    }
  }, [isConnected, address, fetchPositions]);

  return {
    positions,
    loading,
    collecting,
    error,
    refetch: fetchPositions,
    collectFees,
  };
};

function parseSignedInt(hex: string): number {
  const value = BigInt('0x' + hex);
  // Check if negative (highest bit set in 256-bit number)
  if (value >= BigInt(2) ** BigInt(255)) {
    return Number(value - BigInt(2) ** BigInt(256));
  }
  return Number(value);
}

// Encode collect function call
function encodeCollectCall(params: {
  tokenId: bigint;
  recipient: string;
  amount0Max: bigint;
  amount1Max: bigint;
}): string {
  // Function selector for collect((uint256,address,uint128,uint128))
  const selector = '0xfc6f7865';
  
  const tokenId = params.tokenId.toString(16).padStart(64, '0');
  const recipient = params.recipient.slice(2).toLowerCase().padStart(64, '0');
  const amount0Max = params.amount0Max.toString(16).padStart(64, '0');
  const amount1Max = params.amount1Max.toString(16).padStart(64, '0');
  
  return selector + tokenId + recipient + amount0Max + amount1Max;
}
