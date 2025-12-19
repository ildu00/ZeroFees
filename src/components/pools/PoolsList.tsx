import { useState } from "react";
import { TrendingUp, Droplets, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PoolCard from "./PoolCard";
import AddLiquidityModal from "./AddLiquidityModal";

export interface Pool {
  id: string;
  token0: { symbol: string; icon: string };
  token1: { symbol: string; icon: string };
  tvl: number;
  apr: number;
  volume24h: number;
  fees24h: number;
  myLiquidity?: number;
}

const mockPools: Pool[] = [
  {
    id: "1",
    token0: { symbol: "ETH", icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
    token1: { symbol: "USDC", icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png" },
    tvl: 125400000,
    apr: 12.5,
    volume24h: 45600000,
    fees24h: 136800,
    myLiquidity: 2500,
  },
  {
    id: "2",
    token0: { symbol: "ETH", icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
    token1: { symbol: "WBTC", icon: "https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png" },
    tvl: 89200000,
    apr: 8.2,
    volume24h: 23400000,
    fees24h: 70200,
  },
  {
    id: "3",
    token0: { symbol: "USDC", icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png" },
    token1: { symbol: "USDT", icon: "https://cryptologos.cc/logos/tether-usdt-logo.png" },
    tvl: 67800000,
    apr: 4.8,
    volume24h: 89100000,
    fees24h: 44550,
  },
  {
    id: "4",
    token0: { symbol: "ETH", icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
    token1: { symbol: "DAI", icon: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png" },
    tvl: 34500000,
    apr: 15.3,
    volume24h: 12300000,
    fees24h: 36900,
  },
  {
    id: "5",
    token0: { symbol: "LINK", icon: "https://cryptologos.cc/logos/chainlink-link-logo.png" },
    token1: { symbol: "ETH", icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
    tvl: 18900000,
    apr: 22.1,
    volume24h: 8700000,
    fees24h: 26100,
  },
  {
    id: "6",
    token0: { symbol: "UNI", icon: "https://cryptologos.cc/logos/uniswap-uni-logo.png" },
    token1: { symbol: "ETH", icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
    tvl: 12400000,
    apr: 18.7,
    volume24h: 5600000,
    fees24h: 16800,
  },
];

const formatCurrency = (value: number) => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

const PoolsList = () => {
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const totalTVL = mockPools.reduce((acc, pool) => acc + pool.tvl, 0);
  const totalVolume = mockPools.reduce((acc, pool) => acc + pool.volume24h, 0);
  const avgAPR = mockPools.reduce((acc, pool) => acc + pool.apr, 0) / mockPools.length;

  const handleAddLiquidity = (pool: Pool) => {
    setSelectedPool(pool);
    setModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <Droplets className="w-4 h-4" />
            <span className="text-sm">Total Value Locked</span>
          </div>
          <p className="text-2xl font-bold text-gradient">{formatCurrency(totalTVL)}</p>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">24h Volume</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalVolume)}</p>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <span className="text-sm">Average APR</span>
          </div>
          <p className="text-2xl font-bold text-primary">{avgAPR.toFixed(1)}%</p>
        </div>
      </div>

      {/* Pools Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">All Pools</h2>
        <Button 
          variant="glow" 
          size="sm"
          onClick={() => {
            setSelectedPool(null);
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" />
          New Position
        </Button>
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockPools.map((pool) => (
          <PoolCard
            key={pool.id}
            pool={pool}
            onAddLiquidity={() => handleAddLiquidity(pool)}
          />
        ))}
      </div>

      {/* Add Liquidity Modal */}
      <AddLiquidityModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        pool={selectedPool}
      />
    </div>
  );
};

export default PoolsList;
