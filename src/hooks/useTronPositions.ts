import { useState, useCallback, useEffect } from "react";
import { useChain } from "@/contexts/ChainContext";
import { useTronLink } from "./useTronLink";
import { toast } from "sonner";
import { Position } from "./usePositions";

// SunSwap V3 NonfungiblePositionManager on TRON Mainnet
const SUNSWAP_V3_PM = 'TLSWrv7eC1AZCXkRjpqMZUmvgd99cj7pPF';

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

function getTokenInfo(addr: string): { address: string; symbol: string; icon: string } {
  const known = TRON_TOKEN_ICONS[addr];
  if (known) return { address: addr, symbol: known.symbol, icon: known.icon };
  return {
    address: addr,
    symbol: addr.slice(0, 6) + '...',
    icon: `https://ui-avatars.com/api/?name=${addr.slice(1, 3)}&background=6366f1&color=fff&size=64`,
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

      const contract = await tronWeb.contract().at(SUNSWAP_V3_PM) as any;
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

          const token0Hex: string = pos.token0 || pos[2];
          const token1Hex: string = pos.token1 || pos[3];
          // TronWeb returns addresses as hex (41...), convert to base58
          const token0Addr = (tronWeb as any).address?.fromHex?.(token0Hex) || token0Hex;
          const token1Addr = (tronWeb as any).address?.fromHex?.(token1Hex) || token1Hex;
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

      const maxUint128 = '340282366920938463463374607431768211455';
      const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
        SUNSWAP_V3_PM,
        'collect((uint256,address,uint128,uint128))',
        { feeLimit: 200_000_000, callValue: 0 },
        [
          { type: 'uint256', value: tokenId },
          { type: 'address', value: address },
          { type: 'uint128', value: maxUint128 },
          { type: 'uint128', value: maxUint128 },
        ],
        address
      );

      const signedTx = await tronWeb.trx.sign(transaction);
      const result = await tronWeb.trx.sendRawTransaction(signedTx) as any;

      if (result?.txid || result?.transaction?.txID) {
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

      const totalLiquidity = BigInt(liquidity);
      const liquidityToRemove = (totalLiquidity * BigInt(percentToRemove)) / BigInt(100);
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      // Decrease liquidity
      const { transaction: decreaseTx } = await tronWeb.transactionBuilder.triggerSmartContract(
        SUNSWAP_V3_PM,
        'decreaseLiquidity((uint256,uint128,uint256,uint256,uint256))',
        { feeLimit: 300_000_000, callValue: 0 },
        [
          { type: 'uint256', value: tokenId },
          { type: 'uint128', value: liquidityToRemove.toString() },
          { type: 'uint256', value: '0' },
          { type: 'uint256', value: '0' },
          { type: 'uint256', value: deadline.toString() },
        ],
        address
      );

      const signedDecrease = await tronWeb.trx.sign(decreaseTx);
      const decreaseResult = await tronWeb.trx.sendRawTransaction(signedDecrease) as any;

      if (!decreaseResult?.txid && !decreaseResult?.transaction?.txID) {
        toast.error("Failed to decrease liquidity", { id: `remove-${tokenId}` });
        return false;
      }

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Collect tokens
      const maxUint128 = '340282366920938463463374607431768211455';
      const { transaction: collectTx } = await tronWeb.transactionBuilder.triggerSmartContract(
        SUNSWAP_V3_PM,
        'collect((uint256,address,uint128,uint128))',
        { feeLimit: 200_000_000, callValue: 0 },
        [
          { type: 'uint256', value: tokenId },
          { type: 'address', value: address },
          { type: 'uint128', value: maxUint128 },
          { type: 'uint128', value: maxUint128 },
        ],
        address
      );

      const signedCollect = await tronWeb.trx.sign(collectTx);
      await tronWeb.trx.sendRawTransaction(signedCollect);

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
      const maxApproval = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

      if (amount0 !== '0') {
        toast.loading("Approving token 0...", { id: `increase-${tokenId}` });
        const { transaction: approveTx0 } = await tronWeb.transactionBuilder.triggerSmartContract(
          token0Address,
          'approve(address,uint256)',
          { feeLimit: 100_000_000, callValue: 0 },
          [
            { type: 'address', value: SUNSWAP_V3_PM },
            { type: 'uint256', value: maxApproval },
          ],
          address
        );
        const signed0 = await tronWeb.trx.sign(approveTx0);
        await tronWeb.trx.sendRawTransaction(signed0);
        await new Promise(r => setTimeout(r, 2000));
      }

      if (amount1 !== '0') {
        toast.loading("Approving token 1...", { id: `increase-${tokenId}` });
        const { transaction: approveTx1 } = await tronWeb.transactionBuilder.triggerSmartContract(
          token1Address,
          'approve(address,uint256)',
          { feeLimit: 100_000_000, callValue: 0 },
          [
            { type: 'address', value: SUNSWAP_V3_PM },
            { type: 'uint256', value: maxApproval },
          ],
          address
        );
        const signed1 = await tronWeb.trx.sign(approveTx1);
        await tronWeb.trx.sendRawTransaction(signed1);
        await new Promise(r => setTimeout(r, 2000));
      }

      toast.loading("Increasing liquidity...", { id: `increase-${tokenId}` });
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
        SUNSWAP_V3_PM,
        'increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))',
        { feeLimit: 300_000_000, callValue: 0 },
        [
          { type: 'uint256', value: tokenId },
          { type: 'uint256', value: amount0 },
          { type: 'uint256', value: amount1 },
          { type: 'uint256', value: '0' },
          { type: 'uint256', value: '0' },
          { type: 'uint256', value: deadline.toString() },
        ],
        address
      );

      const signedTx = await tronWeb.trx.sign(transaction);
      const result = await tronWeb.trx.sendRawTransaction(signedTx) as any;

      if (result?.txid || result?.transaction?.txID) {
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
