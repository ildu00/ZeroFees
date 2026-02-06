import { useState, useCallback, useEffect } from "react";
import { useChain } from "@/contexts/ChainContext";
import { useTronLink } from "./useTronLink";
import { toast } from "sonner";
import { Position } from "./usePositions";

// SunSwap V3 NonfungiblePositionManager on TRON Mainnet
const SUNSWAP_V3_PM = 'TLSWrv7eC1AZCXkRjpqMZUmvgd99cj7pPF';

// Minimal ABI for SunSwap V3 PM (Uniswap V3 fork)
const PM_ABI = [
  {
    "name": "balanceOf",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{ "name": "owner", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
  },
  {
    "name": "tokenOfOwnerByIndex",
    "type": "function",
    "stateMutability": "view",
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "index", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
  },
  {
    "name": "positions",
    "type": "function",
    "stateMutability": "view",
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "outputs": [
      { "name": "nonce", "type": "uint96" },
      { "name": "operator", "type": "address" },
      { "name": "token0", "type": "address" },
      { "name": "token1", "type": "address" },
      { "name": "fee", "type": "uint24" },
      { "name": "tickLower", "type": "int24" },
      { "name": "tickUpper", "type": "int24" },
      { "name": "liquidity", "type": "uint128" },
      { "name": "feeGrowthInside0LastX128", "type": "uint256" },
      { "name": "feeGrowthInside1LastX128", "type": "uint256" },
      { "name": "tokensOwed0", "type": "uint128" },
      { "name": "tokensOwed1", "type": "uint128" },
    ],
  },
  {
    "name": "collect",
    "type": "function",
    "stateMutability": "payable",
    "inputs": [{
      "name": "params",
      "type": "tuple",
      "components": [
        { "name": "tokenId", "type": "uint256" },
        { "name": "recipient", "type": "address" },
        { "name": "amount0Max", "type": "uint128" },
        { "name": "amount1Max", "type": "uint128" },
      ],
    }],
    "outputs": [
      { "name": "amount0", "type": "uint256" },
      { "name": "amount1", "type": "uint256" },
    ],
  },
  {
    "name": "decreaseLiquidity",
    "type": "function",
    "stateMutability": "payable",
    "inputs": [{
      "name": "params",
      "type": "tuple",
      "components": [
        { "name": "tokenId", "type": "uint256" },
        { "name": "liquidity", "type": "uint128" },
        { "name": "amount0Min", "type": "uint256" },
        { "name": "amount1Min", "type": "uint256" },
        { "name": "deadline", "type": "uint256" },
      ],
    }],
    "outputs": [
      { "name": "amount0", "type": "uint256" },
      { "name": "amount1", "type": "uint256" },
    ],
  },
  {
    "name": "increaseLiquidity",
    "type": "function",
    "stateMutability": "payable",
    "inputs": [{
      "name": "params",
      "type": "tuple",
      "components": [
        { "name": "tokenId", "type": "uint256" },
        { "name": "amount0Desired", "type": "uint256" },
        { "name": "amount1Desired", "type": "uint256" },
        { "name": "amount0Min", "type": "uint256" },
        { "name": "amount1Min", "type": "uint256" },
        { "name": "deadline", "type": "uint256" },
      ],
    }],
    "outputs": [
      { "name": "liquidity", "type": "uint128" },
      { "name": "amount0", "type": "uint256" },
      { "name": "amount1", "type": "uint256" },
    ],
  },
];

// ERC20 approve ABI
const ERC20_APPROVE_ABI = [{
  "name": "approve",
  "type": "function",
  "inputs": [
    { "name": "spender", "type": "address" },
    { "name": "amount", "type": "uint256" },
  ],
  "outputs": [{ "name": "", "type": "bool" }],
}];

// Known TRON tokens for icon lookup
const TRON_TOKEN_ICONS: Record<string, { symbol: string; icon: string }> = {
  'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb': { symbol: 'WTRX', icon: 'https://cryptologos.cc/logos/tron-trx-logo.png' },
  'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR': { symbol: 'WTRX', icon: 'https://cryptologos.cc/logos/tron-trx-logo.png' },
  'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t': { symbol: 'USDT', icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png' },
  'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8': { symbol: 'USDC', icon: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' },
  'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn': { symbol: 'USDD', icon: 'https://cryptologos.cc/logos/usdd-usdd-logo.png' },
  'TKkeiboTkxXKJpbmVFbv4a8ov5rAfRDMf9': { symbol: 'SUN', icon: 'https://cryptologos.cc/logos/sun-token-sun-logo.png' },
  'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9': { symbol: 'JST', icon: 'https://cryptologos.cc/logos/just-jst-logo.png' },
  'TXpw8XeWYeTUd4quDskoUqeQPowRh4jY65': { symbol: 'WBTC', icon: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png' },
  'TXWkP3jLBqRGojUih1ShzNyDaN5Csnebok': { symbol: 'WETH', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
};

function getTokenInfo(address: string): { address: string; symbol: string; icon: string } {
  const known = TRON_TOKEN_ICONS[address];
  if (known) return { address, symbol: known.symbol, icon: known.icon };
  return {
    address,
    symbol: address.slice(0, 6) + '...',
    icon: `https://ui-avatars.com/api/?name=${address.slice(1, 3)}&background=6366f1&color=fff&size=64`,
  };
}

export const useTronPositions = () => {
  const { address, isConnected, tronWeb } = useTronLink();
  const { currentChain } = useChain();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [increasing, setIncreasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isActive = currentChain.id === 'tron';

  const fetchPositions = useCallback(async () => {
    if (!isActive || !tronWeb || !address || !isConnected) {
      setPositions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const contract = await tronWeb.contract(PM_ABI).at(SUNSWAP_V3_PM) as any;
      const balanceResult = await contract.balanceOf(address).call();
      const balance = Number(balanceResult);

      console.log(`[TRON] User has ${balance} SunSwap V3 positions`);

      if (balance === 0) {
        setPositions([]);
        return;
      }

      const fetchedPositions: Position[] = [];

      for (let i = 0; i < Math.min(balance, 20); i++) {
        try {
          const tokenIdResult = await contract.tokenOfOwnerByIndex(address, i).call();
          const tokenId = tokenIdResult.toString();

          const pos = await contract.positions(tokenId).call();

          const liquidity = pos.liquidity?.toString() || pos[7]?.toString() || '0';
          if (liquidity === '0') continue;

          // Convert TRON hex addresses to base58
          const token0Addr = tronWeb.address.fromHex(pos.token0 || pos[2]) as string;
          const token1Addr = tronWeb.address.fromHex(pos.token1 || pos[3]) as string;
          const fee = Number(pos.fee || pos[4]);
          const tickLower = Number(pos.tickLower || pos[5]);
          const tickUpper = Number(pos.tickUpper || pos[6]);
          const tokensOwed0 = (pos.tokensOwed0 || pos[10])?.toString() || '0';
          const tokensOwed1 = (pos.tokensOwed1 || pos[11])?.toString() || '0';

          fetchedPositions.push({
            tokenId,
            token0: getTokenInfo(token0Addr),
            token1: getTokenInfo(token1Addr),
            fee: fee / 10000,
            tickLower,
            tickUpper,
            liquidity,
            tokensOwed0,
            tokensOwed1,
            inRange: true,
          });
        } catch (err) {
          console.error(`Error fetching TRON position ${i}:`, err);
        }
      }

      setPositions(fetchedPositions);
    } catch (err) {
      console.error("Error fetching TRON positions:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch positions");
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [isActive, tronWeb, address, isConnected]);

  const collectFees = useCallback(async (tokenId: string): Promise<boolean> => {
    if (!tronWeb || !address) {
      toast.error("Wallet not connected");
      return false;
    }

    try {
      setCollecting(tokenId);
      toast.loading("Collecting fees...", { id: `collect-${tokenId}` });

      const contract = await tronWeb.contract(PM_ABI).at(SUNSWAP_V3_PM) as any;
      const maxUint128 = '340282366920938463463374607431768211455';

      const result = await contract.collect([
        tokenId,
        address,
        maxUint128,
        maxUint128,
      ]).send({ feeLimit: 200_000_000 });

      if (result) {
        toast.success("Fees collected!", { id: `collect-${tokenId}` });
        setTimeout(() => fetchPositions(), 5000);
        return true;
      }
      toast.error("Transaction failed", { id: `collect-${tokenId}` });
      return false;
    } catch (err: any) {
      console.error("Collect error:", err);
      toast.error(err.message || "Failed to collect fees", { id: `collect-${tokenId}` });
      return false;
    } finally {
      setCollecting(null);
    }
  }, [tronWeb, address, fetchPositions]);

  const removeLiquidity = useCallback(async (
    tokenId: string,
    liquidity: string,
    percentToRemove: number
  ): Promise<boolean> => {
    if (!tronWeb || !address) {
      toast.error("Wallet not connected");
      return false;
    }

    try {
      setRemoving(tokenId);
      toast.loading("Removing liquidity...", { id: `remove-${tokenId}` });

      const contract = await tronWeb.contract(PM_ABI).at(SUNSWAP_V3_PM) as any;
      const totalLiquidity = BigInt(liquidity);
      const liquidityToRemove = (totalLiquidity * BigInt(percentToRemove)) / BigInt(100);
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      // Decrease liquidity
      const decreaseResult = await contract.decreaseLiquidity([
        tokenId,
        liquidityToRemove.toString(),
        '0',
        '0',
        deadline.toString(),
      ]).send({ feeLimit: 300_000_000 });

      if (!decreaseResult) {
        toast.error("Failed to decrease liquidity", { id: `remove-${tokenId}` });
        return false;
      }

      // Wait a bit, then collect
      await new Promise(resolve => setTimeout(resolve, 3000));

      const maxUint128 = '340282366920938463463374607431768211455';
      await contract.collect([
        tokenId,
        address,
        maxUint128,
        maxUint128,
      ]).send({ feeLimit: 200_000_000 });

      toast.success("Liquidity removed!", { id: `remove-${tokenId}` });
      setTimeout(() => fetchPositions(), 5000);
      return true;
    } catch (err: any) {
      console.error("Remove liquidity error:", err);
      toast.error(err.message || "Failed to remove liquidity", { id: `remove-${tokenId}` });
      return false;
    } finally {
      setRemoving(null);
    }
  }, [tronWeb, address, fetchPositions]);

  const increaseLiquidity = useCallback(async (
    tokenId: string,
    token0Address: string,
    token1Address: string,
    amount0: string,
    amount1: string
  ): Promise<boolean> => {
    if (!tronWeb || !address) {
      toast.error("Wallet not connected");
      return false;
    }

    try {
      setIncreasing(tokenId);

      // Approve tokens
      if (amount0 !== '0') {
        toast.loading("Approving token 0...", { id: `increase-${tokenId}` });
        const token0Contract = await tronWeb.contract(ERC20_APPROVE_ABI).at(token0Address) as any;
        await token0Contract.approve(
          SUNSWAP_V3_PM,
          '115792089237316195423570985008687907853269984665640564039457584007913129639935'
        ).send({ feeLimit: 100_000_000 });
      }

      if (amount1 !== '0') {
        toast.loading("Approving token 1...", { id: `increase-${tokenId}` });
        const token1Contract = await tronWeb.contract(ERC20_APPROVE_ABI).at(token1Address) as any;
        await token1Contract.approve(
          SUNSWAP_V3_PM,
          '115792089237316195423570985008687907853269984665640564039457584007913129639935'
        ).send({ feeLimit: 100_000_000 });
      }

      toast.loading("Increasing liquidity...", { id: `increase-${tokenId}` });

      const deadline = Math.floor(Date.now() / 1000) + 1800;
      const contract = await tronWeb.contract(PM_ABI).at(SUNSWAP_V3_PM) as any;

      const result = await contract.increaseLiquidity([
        tokenId,
        amount0,
        amount1,
        '0',
        '0',
        deadline.toString(),
      ]).send({ feeLimit: 300_000_000 });

      if (result) {
        toast.success("Liquidity increased!", { id: `increase-${tokenId}` });
        setTimeout(() => fetchPositions(), 5000);
        return true;
      }
      toast.error("Transaction failed", { id: `increase-${tokenId}` });
      return false;
    } catch (err: any) {
      console.error("Increase liquidity error:", err);
      toast.error(err.message || "Failed to increase liquidity", { id: `increase-${tokenId}` });
      return false;
    } finally {
      setIncreasing(null);
    }
  }, [tronWeb, address, fetchPositions]);

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
    positionManagerAddress: SUNSWAP_V3_PM,
  };
};
