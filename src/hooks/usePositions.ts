import { useState, useCallback, useEffect } from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import { useChain } from "@/contexts/ChainContext";
import { toast } from "sonner";
import { getPositionManager } from "@/config/positionManagers";
import { getTokensForChain, Token as ConfigToken } from "@/config/tokens";

// Type for EIP-1193 provider request
interface ProviderRequest {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

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

// Build known tokens lookup from config tokens for current chain
const buildKnownTokens = (chainId: string): Record<string, { symbol: string; decimals: number; icon: string }> => {
  const tokens = getTokensForChain(chainId);
  const map: Record<string, { symbol: string; decimals: number; icon: string }> = {};
  
  for (const token of tokens) {
    if (token.address && token.address !== '0x0000000000000000000000000000000000000000' && token.address !== 'native') {
      map[token.address.toLowerCase()] = {
        symbol: token.symbol,
        decimals: token.decimals,
        icon: getTokenIcon(token),
      };
    }
  }
  return map;
};

// Map token config icons to image URLs where possible
const getTokenIcon = (token: ConfigToken): string => {
  const iconMap: Record<string, string> = {
    'WETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    'ETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    'USDC': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    'USDC.e': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    'USDbC': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    'USDT': 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    'USDT.e': 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    'DAI': 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
    'DAI.e': 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
    'WBTC': 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png',
    'WBTC.e': 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png',
    'WBNB': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    'BNB': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    'MATIC': 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    'WMATIC': 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    'UNI': 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    'LINK': 'https://cryptologos.cc/logos/chainlink-link-logo.png',
    'LINK.e': 'https://cryptologos.cc/logos/chainlink-link-logo.png',
    'AAVE': 'https://cryptologos.cc/logos/aave-aave-logo.png',
    'AAVE.e': 'https://cryptologos.cc/logos/aave-aave-logo.png',
    'ARB': 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
    'OP': 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',
    'AVAX': 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
    'WAVAX': 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
    'CAKE': 'https://cryptologos.cc/logos/pancakeswap-cake-logo.png',
    'cbETH': 'https://cryptologos.cc/logos/coinbase-wrapped-staked-eth-cbeth-logo.png',
    'wstETH': 'https://cryptologos.cc/logos/lido-staked-ether-steth-logo.png',
    'SNX': 'https://cryptologos.cc/logos/synthetix-network-token-snx-logo.png',
    'MKR': 'https://cryptologos.cc/logos/maker-mkr-logo.png',
    'GMX': 'https://cryptologos.cc/logos/gmx-gmx-logo.png',
    'BUSD': 'https://cryptologos.cc/logos/binance-usd-busd-logo.png',
    'BTCB': 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png',
  };
  
  if (iconMap[token.symbol]) return iconMap[token.symbol];
  
  // Fallback: generate avatar
  return `https://ui-avatars.com/api/?name=${token.symbol.slice(0, 2)}&background=6366f1&color=fff&size=64`;
};

export const usePositions = () => {
  const { address, isConnected, walletProvider } = useWalletContext();
  const { currentChain } = useChain();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [increasing, setIncreasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chainId = currentChain.id;
  const positionManager = getPositionManager(chainId);
  const positionManagerAddress = positionManager?.address || '';

  const getProvider = useCallback((): ProviderRequest | null => {
    if (walletProvider) return walletProvider as unknown as ProviderRequest;
    if (typeof window !== 'undefined' && window.ethereum) return window.ethereum as unknown as ProviderRequest;
    return null;
  }, [walletProvider]);

  const getTokenInfo = useCallback((tokenAddress: string) => {
    const knownTokens = buildKnownTokens(chainId);
    const addr = tokenAddress.toLowerCase();
    if (knownTokens[addr]) {
      return {
        address: tokenAddress,
        symbol: knownTokens[addr].symbol,
        icon: knownTokens[addr].icon,
      };
    }
    return {
      address: tokenAddress,
      symbol: tokenAddress.slice(0, 6) + '...',
      icon: `https://ui-avatars.com/api/?name=${tokenAddress.slice(2, 4)}&background=6366f1&color=fff&size=64`,
    };
  }, [chainId]);

  const fetchPositionByIndex = useCallback(async (
    provider: ProviderRequest,
    ownerAddress: string,
    index: number
  ): Promise<Position | null> => {
    try {
      // tokenOfOwnerByIndex(address,uint256) = 0x2f745c59
      const tokenIdData = `0x2f745c59${ownerAddress.slice(2).padStart(64, '0')}${index.toString(16).padStart(64, '0')}`;
      const tokenIdResult = await provider.request({
        method: 'eth_call',
        params: [{
          to: positionManagerAddress,
          data: tokenIdData,
        }, 'latest'],
      });

      const tokenId = BigInt(tokenIdResult as string).toString();

      // positions(uint256) = 0x99fbab88
      const positionData = `0x99fbab88${BigInt(tokenId).toString(16).padStart(64, '0')}`;
      const positionResult = await provider.request({
        method: 'eth_call',
        params: [{
          to: positionManagerAddress,
          data: positionData,
        }, 'latest'],
      });

      // Decode position data
      const data = (positionResult as string).slice(2);
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

      const inRange = true; // Would need pool contract query for exact range check

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
  }, [positionManagerAddress, getTokenInfo]);

  const fetchPositions = useCallback(async () => {
    const provider = getProvider();
    if (!provider || !address || !isConnected || !positionManagerAddress) {
      setPositions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // balanceOf(address) = 0x70a08231
      const balanceData = `0x70a08231${address.slice(2).padStart(64, '0')}`;
      const balanceResult = await provider.request({
        method: 'eth_call',
        params: [{
          to: positionManagerAddress,
          data: balanceData,
        }, 'latest'],
      });

      const balance = parseInt(balanceResult as string, 16);
      console.log(`[${chainId}] User has ${balance} positions`);

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
  }, [address, isConnected, getProvider, positionManagerAddress, chainId, fetchPositionByIndex]);

  // Collect fees from a position
  const collectFees = useCallback(async (tokenId: string): Promise<boolean> => {
    const provider = getProvider();
    if (!provider || !address || !positionManagerAddress) {
      toast.error("Wallet not connected");
      return false;
    }

    try {
      setCollecting(tokenId);
      toast.loading("Collecting fees...", { id: `collect-${tokenId}` });

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
          to: positionManagerAddress,
          data: collectData,
        }],
      }) as string;

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
  }, [address, getProvider, fetchPositions, positionManagerAddress]);

  // Remove liquidity from a position
  const removeLiquidity = useCallback(async (
    tokenId: string,
    liquidity: string,
    percentToRemove: number
  ): Promise<boolean> => {
    const provider = getProvider();
    if (!provider || !address || !positionManagerAddress) {
      toast.error("Wallet not connected");
      return false;
    }

    try {
      setRemoving(tokenId);
      toast.loading("Removing liquidity...", { id: `remove-${tokenId}` });

      const totalLiquidity = BigInt(liquidity);
      const liquidityToRemove = (totalLiquidity * BigInt(percentToRemove)) / BigInt(100);
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      const decreaseData = encodeDecreaseLiquidityCall({
        tokenId: BigInt(tokenId),
        liquidity: liquidityToRemove,
        amount0Min: BigInt(0),
        amount1Min: BigInt(0),
        deadline: BigInt(deadline),
      });

      const txHash1 = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: positionManagerAddress,
          data: decreaseData,
        }],
      }) as string;

      let receipt1: { status: string } | null = null;
      while (!receipt1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        receipt1 = await provider.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash1],
        }) as { status: string } | null;
      }

      if (receipt1.status !== '0x1') {
        toast.error("Failed to decrease liquidity", { id: `remove-${tokenId}` });
        return false;
      }

      // Collect the tokens
      const maxUint128 = BigInt("0xffffffffffffffffffffffffffffffff");
      const collectData = encodeCollectCall({
        tokenId: BigInt(tokenId),
        recipient: address,
        amount0Max: maxUint128,
        amount1Max: maxUint128,
      });

      const txHash2 = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: positionManagerAddress,
          data: collectData,
        }],
      }) as string;

      let receipt2: { status: string } | null = null;
      while (!receipt2) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        receipt2 = await provider.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash2],
        }) as { status: string } | null;
      }

      if (receipt2.status === '0x1') {
        toast.success("Liquidity removed successfully!", { id: `remove-${tokenId}` });
        await fetchPositions();
        return true;
      } else {
        toast.error("Failed to collect tokens", { id: `remove-${tokenId}` });
        return false;
      }
    } catch (err: any) {
      console.error("Remove liquidity error:", err);
      toast.error(err.message || "Failed to remove liquidity", { id: `remove-${tokenId}` });
      return false;
    } finally {
      setRemoving(null);
    }
  }, [address, getProvider, fetchPositions, positionManagerAddress]);

  // Increase liquidity for a position
  const increaseLiquidity = useCallback(async (
    tokenId: string,
    token0Address: string,
    token1Address: string,
    amount0: string,
    amount1: string
  ): Promise<boolean> => {
    const provider = getProvider();
    if (!provider || !address || !positionManagerAddress) {
      toast.error("Wallet not connected");
      return false;
    }

    try {
      setIncreasing(tokenId);
      toast.loading("Approving tokens...", { id: `increase-${tokenId}` });

      const approveAmount = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

      if (amount0 !== '0') {
        const approveData0 = encodeApproveCall(positionManagerAddress, approveAmount);
        await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: token0Address,
            data: approveData0,
          }],
        });
      }

      if (amount1 !== '0') {
        const approveData1 = encodeApproveCall(positionManagerAddress, approveAmount);
        await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: token1Address,
            data: approveData1,
          }],
        });
      }

      toast.loading("Increasing liquidity...", { id: `increase-${tokenId}` });
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      const increaseData = encodeIncreaseLiquidityCall({
        tokenId: BigInt(tokenId),
        amount0Desired: BigInt(amount0),
        amount1Desired: BigInt(amount1),
        amount0Min: BigInt(0),
        amount1Min: BigInt(0),
        deadline: BigInt(deadline),
      });

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: positionManagerAddress,
          data: increaseData,
        }],
      }) as string;

      let receipt: { status: string } | null = null;
      while (!receipt) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        receipt = await provider.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        }) as { status: string } | null;
      }

      if (receipt.status === '0x1') {
        toast.success("Liquidity increased successfully!", { id: `increase-${tokenId}` });
        await fetchPositions();
        return true;
      } else {
        toast.error("Transaction failed", { id: `increase-${tokenId}` });
        return false;
      }
    } catch (err: any) {
      console.error("Increase liquidity error:", err);
      toast.error(err.message || "Failed to increase liquidity", { id: `increase-${tokenId}` });
      return false;
    } finally {
      setIncreasing(null);
    }
  }, [address, getProvider, fetchPositions, positionManagerAddress]);

  // Re-fetch on chain or wallet change
  useEffect(() => {
    if (isConnected && address && positionManagerAddress) {
      fetchPositions();
    } else {
      setPositions([]);
    }
  }, [isConnected, address, fetchPositions, positionManagerAddress, chainId]);

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
    positionManagerAddress,
  };
};

// --- Utility functions ---

function parseSignedInt(hex: string): number {
  const value = BigInt('0x' + hex);
  if (value >= BigInt(2) ** BigInt(255)) {
    return Number(value - BigInt(2) ** BigInt(256));
  }
  return Number(value);
}

function encodeCollectCall(params: {
  tokenId: bigint;
  recipient: string;
  amount0Max: bigint;
  amount1Max: bigint;
}): string {
  const selector = '0xfc6f7865';
  const tokenId = params.tokenId.toString(16).padStart(64, '0');
  const recipient = params.recipient.slice(2).toLowerCase().padStart(64, '0');
  const amount0Max = params.amount0Max.toString(16).padStart(64, '0');
  const amount1Max = params.amount1Max.toString(16).padStart(64, '0');
  return selector + tokenId + recipient + amount0Max + amount1Max;
}

function encodeDecreaseLiquidityCall(params: {
  tokenId: bigint;
  liquidity: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
  deadline: bigint;
}): string {
  const selector = '0x0c49ccbe';
  const tokenId = params.tokenId.toString(16).padStart(64, '0');
  const liquidity = params.liquidity.toString(16).padStart(64, '0');
  const amount0Min = params.amount0Min.toString(16).padStart(64, '0');
  const amount1Min = params.amount1Min.toString(16).padStart(64, '0');
  const deadline = params.deadline.toString(16).padStart(64, '0');
  return selector + tokenId + liquidity + amount0Min + amount1Min + deadline;
}

function encodeIncreaseLiquidityCall(params: {
  tokenId: bigint;
  amount0Desired: bigint;
  amount1Desired: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
  deadline: bigint;
}): string {
  const selector = '0x219f5d17';
  const tokenId = params.tokenId.toString(16).padStart(64, '0');
  const amount0Desired = params.amount0Desired.toString(16).padStart(64, '0');
  const amount1Desired = params.amount1Desired.toString(16).padStart(64, '0');
  const amount0Min = params.amount0Min.toString(16).padStart(64, '0');
  const amount1Min = params.amount1Min.toString(16).padStart(64, '0');
  const deadline = params.deadline.toString(16).padStart(64, '0');
  return selector + tokenId + amount0Desired + amount1Desired + amount0Min + amount1Min + deadline;
}

function encodeApproveCall(spender: string, amount: bigint): string {
  const selector = '0x095ea7b3';
  const spenderPadded = spender.slice(2).toLowerCase().padStart(64, '0');
  const amountPadded = amount.toString(16).padStart(64, '0');
  return selector + spenderPadded + amountPadded;
}
